const supabase = require("../config/supabase");

// ===============================
// CREATE STUDENT REQUEST
// ===============================
const createRequest = async (req, res) => {
  try {
    const { description, materialType, title, subject } = req.body; 
    const studentId = req.user.id;
    const file = req.file;

    // Map materialType to preferred_mode allowed values
    const modeMap = {
      bootCamp: 'bootcamp',
      recordVideo: 'recorded',
      meeting: 'live_1on1',
    };

    // Insert into student_requests
    const { data: request, error: requestError } = await supabase
      .from("student_requests")
      .insert([{
        student_id: studentId,
        title: title || description || "New Request",
        description: description || null,
        preferred_mode: modeMap[materialType] || 'any',
        preferred_language: subject || null, 
        status: 'pending_analysis',
      }])
      .select()
      .single();

    if (requestError) {
      console.error("Request error:", requestError);
      return res.status(500).json({ error: "Could not create request." });
    }

    // If file uploaded, save to Supabase Storage + request_files table
    if (file) {
      const fileName = `${studentId}_${Date.now()}_${file.originalname}`;

      // Upload file to Supabase Storage
      const { error: storageError } = await supabase.storage
        .from("request-files")
        .upload(fileName, file.buffer, { contentType: file.mimetype });

      if (!storageError) {
        // Get public URL
        const { data: urlData } = supabase.storage
          .from("request-files")
          .getPublicUrl(fileName);

        // Save file info to request_files table
        await supabase
          .from("request_files")
          .insert([{
            request_id: request.id,
            file_name: file.originalname,
            file_url: urlData.publicUrl,
            file_size_bytes: file.size,
            mime_type: file.mimetype,
          }]);
      }
    }

    return res.status(201).json({
      message: "Request created successfully",
      request,
    });

  } catch (err) {
    console.error(err);
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
      return res.status(500).json({ error: "Could not fetch requests." });
    }

    return res.json({ requests });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error." });
  }
};

module.exports = { createRequest, getMyRequests };