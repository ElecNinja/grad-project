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
      return res.status(500).json({ error: "Could not create request." });
    }

    // =============================================
    // SAVE FILE
    // =============================================
    if (file) {
      const fileName = `${studentId}_${Date.now()}_${file.originalname}`;

      const { error: storageError } = await supabase.storage
        .from("request-files")
        .upload(fileName, file.buffer, { contentType: file.mimetype });

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
    // Map AI output to exact subject names in DB
    // =============================================
    const normalized = finalSubject.toLowerCase();
    let searchTerm = finalSubject;

    if (
      normalized.includes("cyber") ||
      normalized.includes("security") ||
      normalized.includes("penetration") ||
      normalized.includes("kali") ||
      normalized.includes("network security")
    ) {
      searchTerm = "Cyber Security";
    } else if (
      normalized.includes("programming") ||
      normalized.includes("coding") ||
      normalized.includes("python") ||
      normalized.includes("javascript") ||
      normalized.includes("java") ||
      normalized.includes("c++") ||
      normalized.includes("react") ||
      normalized.includes("language")
    ) {
      searchTerm = "Programming";
    } else if (
      normalized.includes("computer science") ||
      normalized.includes("computer") ||
      normalized.includes("software") ||
      normalized.includes("algorithm") ||
      normalized.includes("operating system")
    ) {
      searchTerm = "Computer Science";
    } else if (
      normalized.includes("math") ||
      normalized.includes("calculus") ||
      normalized.includes("algebra") ||
      normalized.includes("geometry") ||
      normalized.includes("equation") ||
      normalized.includes("education")
    ) {
      searchTerm = "Mathematics";
    } else if (
      normalized.includes("data") ||
      normalized.includes("statistics") ||
      normalized.includes("analysis") ||
      normalized.includes("excel") ||
      normalized.includes("pandas") ||
      normalized.includes("visualization")
    ) {
      searchTerm = "Data Analysis";
    } else if (
      normalized.includes("artificial intelligence") ||
      normalized.includes("machine learning") ||
      normalized.includes("deep learning") ||
      normalized.includes("neural") ||
      normalized.includes("nlp")
    ) {
      searchTerm = "AI";
    } else if (
      normalized.includes("physics") ||
      normalized.includes("mechanics") ||
      normalized.includes("thermodynamics") ||
      normalized.includes("quantum")
    ) {
      searchTerm = "Physics";
    } else if (
      normalized.includes("chemistry") ||
      normalized.includes("organic") ||
      normalized.includes("chemical")
    ) {
      searchTerm = "Chemistry";
    } else if (
      normalized.includes("biology") ||
      normalized.includes("genetics") ||
      normalized.includes("cell") ||
      normalized.includes("anatomy")
    ) {
      searchTerm = "Biology";
    } else if (
      normalized.includes("english") ||
      normalized.includes("grammar") ||
      normalized.includes("writing") ||
      normalized.includes("literature")
    ) {
      searchTerm = "English";
    } else if (
      normalized.includes("economics") ||
      normalized.includes("microeconomics") ||
      normalized.includes("macroeconomics")
    ) {
      searchTerm = "Economics";
    } else if (
      normalized.includes("accounting") ||
      normalized.includes("finance") ||
      normalized.includes("bookkeeping")
    ) {
      searchTerm = "Accounting";
    } else if (
      normalized.includes("engineering") ||
      normalized.includes("mechanical") ||
      normalized.includes("electrical") ||
      normalized.includes("civil")
    ) {
      searchTerm = "Engineering";
    } else if (
      normalized.includes("medicine") ||
      normalized.includes("medical") ||
      normalized.includes("pharmacy") ||
      normalized.includes("nursing")
    ) {
      searchTerm = "Medicine";
    } else if (
      normalized.includes("law") ||
      normalized.includes("legal") ||
      normalized.includes("constitution")
    ) {
      searchTerm = "Law";
    }

    console.log("SEARCH TERM:", searchTerm);

    // =============================================
    // FIND SUBJECT IN DB
    // =============================================
    const { data: subjectRows } = await supabase
      .from("subjects")
      .select("id, name")
      .ilike("name", `%${searchTerm}%`)
      .limit(3);

    const subjectData = subjectRows?.[0] || null;

    console.log("FOUND SUBJECT:", subjectData);

    if (!subjectData) {
      console.log("Subject not found in DB for:", searchTerm);
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

    console.log(`MATCHED TEACHERS FOR ${subjectData.name}:`, teacherSubjects);

    if (teacherError) {
      console.error("TEACHER QUERY ERROR:", teacherError);
    }

    if (!teacherSubjects || teacherSubjects.length === 0) {
      console.log("No teachers found for subject:", subjectData.name);
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
    // SCORE AND RANK TEACHERS
    // =============================================
    const scoredTeachers = teacherSubjects.map((t) => {
      let score = 0.5;

      // Proficiency bonus
      if (t.proficiency === "expert") score += 0.3;
      else if (t.proficiency === "intermediate") score += 0.15;

      // Rating bonus
      const rating = t.teacher_profiles?.avg_rating || 0;
      score += (rating / 5) * 0.15;

      // Sessions bonus
      const sessions = t.teacher_profiles?.total_sessions || 0;
      score += Math.min(sessions / 100, 1) * 0.05;

      return {
        teacher_id: t.teacher_id,
        match_score: Number(score.toFixed(2)),
      };
    });

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
    // UPDATE REQUEST STATUS TO MATCHED
    // =============================================
    await supabase
      .from("student_requests")
      .update({ status: "matched" })
      .eq("id", request.id);

    console.log("MATCHING COMPLETED SUCCESSFULLY");

    return res.status(201).json({
      message: "Request created successfully",
      request,
      matches: insertedMatches,
    });

  } catch (err) {
    console.error("SERVER ERROR:", err);
    return res.status(500).json({ error: "Server error." });
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
          notes,
          teaching_mode,
          num_sessions,
          status,
          teacher_id,
         teacher_profiles!bids_teacher_id_fkey (
            profile_id,
            years_experience,
            introduction_video,
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
      return res.status(500).json({ error: "Could not fetch requests." });
    }

    return res.json({ requests });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error." });
  }
};

// ===============================
// GET ACCEPTED OFFERS FOR STUDENT
// ===============================
const getAcceptedOffers = async (req, res) => {
  try {
    const studentId = req.user.id;

    if (!studentId) {
      return res.status(401).json({ error: "Unauthorized." });
    }

    // Get student's requests that have at least one bid
    const { data: requests, error } = await supabase
      .from("student_requests")
      .select(`
        id,
        title,
        description,
        preferred_mode,
        status,
        created_at,
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
      .is("deleted_at", null);

    if (error) {
      console.error("Error fetching accepted offers:", error);
      return res.status(500).json({ error: "Could not fetch accepted offers." });
    }

    // Filter requests with at least one bid (accepted offer)
    const acceptedOffers = [];
    (requests || []).forEach((request) => {
      if (request.bids && request.bids.length > 0) {
        request.bids.forEach((bid) => {
          const teacherProfile = bid.teacher_profiles?.profiles;
          acceptedOffers.push({
            id: bid.id,
            requestId: request.id,
            type: request.preferred_mode || bid.teaching_mode || "recorded",
            title: request.title || "Untitled",
            description: request.description || "",
            teacherName: teacherProfile?.full_name || "Teacher",
            teacherPhoto: teacherProfile?.avatar_url || null,
            pricePerHour: bid.price || 0,
            currency: bid.currency || "USD",
            numSessions: bid.num_sessions || 1,
            bidStatus: bid.status || "pending",
            createdAt: request.created_at || null,
          });
        });
      }
    });

    return res.status(200).json({ offers: acceptedOffers });

  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: "Server error." });
  }
};
// ===============================
// CONFIRM BID (STUDENT ACCEPTS & PAYS)
// ===============================
const confirmBid = async (req, res) => {
  try {
    const { bidId } = req.body;
    const studentId = req.user.id;

    if (!bidId) {
      return res.status(400).json({ error: "bidId is required." });
    }

    // Verify the bid belongs to a request owned by this student
    const { data: bid, error: bidError } = await supabase
      .from("bids")
      .select("id, request_id, student_requests!bids_request_id_fkey(student_id)")
      .eq("id", bidId)
      .single();

    if (bidError || !bid) {
      return res.status(404).json({ error: "Bid not found." });
    }

    if (bid.student_requests?.student_id !== studentId) {
      return res.status(403).json({ error: "Unauthorized to confirm this bid." });
    }

    const { data: updatedBid, error: updateError } = await supabase
      .from("bids")
      .update({ status: "accepted" })
      .eq("id", bidId)
      .select()
      .single();

    if (updateError) {
      console.error("Confirm bid update error:", updateError);
      return res.status(500).json({ error: "Could not confirm bid." });
    }

    return res.status(200).json({ message: "Bid confirmed successfully", bid: updatedBid });

  } catch (err) {
    console.error("confirmBid error:", err);
    return res.status(500).json({ error: "Server error." });
  }
};
module.exports = {
  createRequest,
  getMyRequests,
  getAcceptedOffers,
  confirmBid,
};
