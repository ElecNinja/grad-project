const supabase = require("../config/supabase");

// ===============================
// CREATE STUDENT REQUEST
// ===============================
const createRequest = async (req, res) => {
  try {
    const { description, materialType, title, subject } = req.body;

    const studentId = req.user.id;
    const file = req.file;

    const modeMap = {
      bootCamp: "bootcamp",
      recordVideo: "recorded",
      meeting: "live_1on1",
    };

    // =============================================
    // CREATE REQUEST
    // =============================================
    const { data: request, error: requestError } = await supabase
      .from("student_requests")
      .insert([
        {
          student_id: studentId,
          title: title || description || "New Request",
          description: description || null,
          preferred_mode: modeMap[materialType] || "any",
          status: "pending_analysis",
        },
      ])
      .select()
      .single();

    if (requestError) {
      console.error("REQUEST ERROR:", requestError);

      return res.status(500).json({
        error: "Could not create request.",
      });
    }

    // =============================================
    // SAVE FILE
    // =============================================
    if (file) {
      const fileName = `${studentId}_${Date.now()}_${file.originalname}`;

      const { error: storageError } = await supabase.storage
        .from("request-files")
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
        });

      if (storageError) {
        console.error("STORAGE ERROR:", storageError);
      } else {
        const { data: urlData } = supabase.storage
          .from("request-files")
          .getPublicUrl(fileName);

        const { error: fileInsertError } = await supabase
          .from("request_files")
          .insert([
            {
              request_id: request.id,
              file_name: file.originalname,
              file_url: urlData.publicUrl,
              file_size_bytes: file.size,
              mime_type: file.mimetype,
            },
          ]);

        if (fileInsertError) {
          console.error("FILE INSERT ERROR:", fileInsertError);
        }
      }
    }

    // =============================================
    // AI MATCHING
    // =============================================

    console.log(
      "[DEBUG] Raw subject from AI:",
      JSON.stringify(subject)
    );

    let finalSubject = subject ? subject.trim() : null;

    if (!finalSubject) {
      console.log("No subject received");

      await supabase
        .from("student_requests")
        .update({ status: "open" })
        .eq("id", request.id);

      return res.status(201).json({
        message: "Request created",
        request,
        note: "No subject detected",
      });
    }

    // =============================================
    // SUBJECT NORMALIZATION
    // =============================================

    const normalized = finalSubject.toLowerCase();

    let searchTerm = finalSubject;

    // Cyber Security
    if (
      normalized.includes("cyber") ||
      normalized.includes("security") ||
      normalized.includes("penetration") ||
      normalized.includes("kali") ||
      normalized.includes("network security")
    ) {
      searchTerm = "Cyber Security";
    }

    // Programming
    else if (
      normalized.includes("programming") ||
      normalized.includes("coding") ||
      normalized.includes("python") ||
      normalized.includes("javascript") ||
      normalized.includes("java") ||
      normalized.includes("c++") ||
      normalized.includes("react")
    ) {
      searchTerm = "Programming";
    }

    // Mathematics
    else if (
      normalized.includes("Education") ||
      normalized.includes("math") ||
      normalized.includes("calculus") ||
      normalized.includes("algebra") ||
      normalized.includes("geometry") ||
      normalized.includes("equation")
    ) {
      searchTerm = "Mathematics";
    }

    // Data Analysis
    else if (
      normalized.includes("data") ||
      normalized.includes("statistics") ||
      normalized.includes("analysis") ||
      normalized.includes("excel")
    ) {
      searchTerm = "Data Analysis";
    }

    // AI
    else if (
      normalized.includes("ai") ||
      normalized.includes("machine learning") ||
      normalized.includes("deep learning")
    ) {
      searchTerm = "AI";
    }

    console.log("SEARCH TERM:", searchTerm);

    // =============================================
    // FIND SUBJECT
    // =============================================

    let { data: subjectData, error: subjectError } = await supabase
      .from("subjects")
      .select("id, name")
      .ilike("name", `%${searchTerm}%`)
      .limit(1)
      .single();

    console.log("FOUND SUBJECT:", subjectData);

    if (subjectError) {
      console.error("SUBJECT ERROR:", subjectError);
    }

    // If no subject found
    if (!subjectData) {
      console.log("Subject not found in DB");

      await supabase
        .from("student_requests")
        .update({ status: "open" })
        .eq("id", request.id);

      return res.status(201).json({
        message: "Request created",
        request,
        note: "Subject not found",
      });
    }

    // =============================================
    // FIND MATCHING TEACHERS
    // =============================================

    const { data: teacherSubjects, error: teacherError } = await supabase
      .from("teacher_subjects")
      .select(`
        teacher_id,
        proficiency,
        teacher_profiles!inner(
          id,
          avg_rating,
          total_sessions,
          is_accepting
        )
      `)
      .eq("subject_id", subjectData.id)
      .eq("teacher_profiles.is_accepting", true);

    console.log(
      `MATCHED TEACHERS FOR ${subjectData.name}:`,
      teacherSubjects
    );

    if (teacherError) {
      console.error("TEACHER QUERY ERROR:", teacherError);
    }

    // =============================================
    // NO TEACHERS FOUND
    // =============================================

    if (!teacherSubjects || teacherSubjects.length === 0) {
      console.log("No teachers found");

      await supabase
        .from("student_requests")
        .update({ status: "open" })
        .eq("id", request.id);

      return res.status(201).json({
        message: "Request created",
        request,
        note: "No teachers found",
      });
    }

    // =============================================
    // SCORE TEACHERS
    // =============================================

    const scoredTeachers = teacherSubjects.map((t) => {
      let score = 0.5;

      // proficiency
      if (t.proficiency === "expert") {
        score += 0.3;
      } else if (t.proficiency === "intermediate") {
        score += 0.15;
      }

      // rating
      const rating = t.teacher_profiles?.avg_rating || 0;
      score += (rating / 5) * 0.15;

      // sessions
      const sessions = t.teacher_profiles?.total_sessions || 0;
      score += Math.min(sessions / 100, 1) * 0.05;

      return {
        teacher_id: t.teacher_id,
        match_score: Number(score.toFixed(2)),
      };
    });

    // sort descending
    const rankedTeachers = scoredTeachers
      .sort((a, b) => b.match_score - a.match_score)
      .slice(0, 10);

    // =============================================
    // INSERT MATCHES
    // =============================================

    const matchRows = rankedTeachers.map((teacher, index) => ({
      request_id: request.id,
      teacher_id: teacher.teacher_id,
      match_score: teacher.match_score,
      rank: index + 1,
      notified_at: new Date().toISOString(),
    }));

    const { data: insertedMatches, error: matchError } = await supabase
      .from("request_matches")
      .insert(matchRows)
      .select();

    console.log("INSERTED MATCHES:", insertedMatches);

    if (matchError) {
      console.error("MATCH INSERT ERROR:", matchError);

      await supabase
        .from("student_requests")
        .update({ status: "open" })
        .eq("id", request.id);

      return res.status(201).json({
        message: "Request created",
        request,
        note: "Match insert failed",
      });
    }

    // =============================================
    // UPDATE REQUEST STATUS
    // =============================================

    await supabase
      .from("student_requests")
      .update({
        status: "matched",
      })
      .eq("id", request.id);

    console.log("MATCHING COMPLETED SUCCESSFULLY");

    return res.status(201).json({
      message: "Request created successfully",
      request,
      matches: insertedMatches,
    });

  } catch (err) {
    console.error("SERVER ERROR:", err);

    return res.status(500).json({
      error: "Server error.",
    });
  }
};

// ===============================
// GET STUDENT'S OWN REQUESTS
// ===============================
const getMyRequests = async (req, res) => {
  try {
    const studentId = req.user.id;

    const { data: requests, error } = await supabase
      .from("student_requests")
      .select(`
        *,
        request_files (
          id,
          file_name,
          file_url,
          mime_type
        ),
        bids (
          id,
          price,
          currency,
          teaching_mode,
          num_sessions,
          status,
          teacher_id,
          teacher_profiles!bids_teacher_id_fkey (
            profile_id,
            profiles!teacher_profiles_profile_id_fkey (
              full_name,
              avatar_url
            )
          )
        )
      `)
      .eq("student_id", studentId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({
        error: "Could not fetch requests.",
      });
    }

    return res.json({ requests });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Server error.",
    });
  }
};

module.exports = {
  createRequest,
  getMyRequests,
};