const supabase = require("../config/supabase");

// ✅ helper to verify token
const verifyToken = async (req) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return null;
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user;
};

const uploadMaterialController = async (req, res) => {
  const { uploadMaterial } = require("../services/teacherService");
  try {
    // Verify user is authenticated
    const authUser = await verifyToken(req);
    if (!authUser) return res.status(401).json({ error: "Unauthorized" });

    const { studentId, description, materialType } = req.body;
    const file = req.file;

    if (!file || !studentId) {
      return res.status(400).json({ error: "File and studentId are required." });
    }

    const result = await uploadMaterial(studentId, description, materialType, file);
    return res.json({ success: true, pdfUrl: result.pdfUrl });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Upload failed" });
  }
};

const getOffersController = async (req, res) => {
  const { getOffers } = require("../services/teacherService");
  try {
    // Verify user is authenticated
    const authUser = await verifyToken(req);
    if (!authUser) return res.status(401).json({ error: "Unauthorized" });

    const { teacherId } = req.params;
    const offers = await getOffers(teacherId);
    return res.json(offers);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to get offers" });
  }
};

const acceptOfferController = async (req, res) => {
  const { acceptOffer } = require("../services/teacherService");
  try {
    // Verify user is authenticated
    const authUser = await verifyToken(req);
    if (!authUser) return res.status(401).json({ error: "Unauthorized" });

    const { offerId, price } = req.body;
    if (!offerId) return res.status(400).json({ error: "offerId is required." });

    await acceptOffer(offerId, price);
    return res.json({ success: true });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to accept offer" });
  }
};

const summarizePdfController = async (req, res) => {
  const { summarizePdf } = require("../services/teacherService");
  try {
    // Verify user is authenticated
    const authUser = await verifyToken(req);
    if (!authUser) return res.status(401).json({ error: "Unauthorized" });

    const { pdfUrl } = req.body;
    if (!pdfUrl) return res.status(400).json({ error: "pdfUrl is required." });

    const result = await summarizePdf(pdfUrl);
    return res.json(result);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Summarization failed" });
  }
};
const getRequestsController = async (req, res) => {
  const { getStudentRequests } = require("../services/teacherService");
  try {
    // ✅ Get teacher's subject from their profile
    const { data: teacherProfile } = await supabase
      .from("profiles")
      .select("bio")
      .eq("id", req.user.id)
      .single();

    const teacherSubject = teacherProfile?.bio || null;
    
    const requests = await getStudentRequests(teacherSubject);
    return res.json(requests);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to get requests" });
  }
};
const acceptRequestController = async (req, res) => {
  try {
    const { requestId, price, sessionDuration, teachingMode, numSessions } = req.body;
    const teacherId = req.user.id;

    if (!requestId || !price) {
      return res.status(400).json({ error: "requestId and price are required." });
    }

    // Get teacher_profile id
    const { data: teacherProfile, error: tpError } = await supabase
      .from("teacher_profiles")
      .select("id")
      .eq("profile_id", teacherId)
      .single();

    if (tpError || !teacherProfile) {
      return res.status(404).json({ error: "Teacher profile not found." });
    }

    // Insert into bids table
    const { data: bid, error: bidError } = await supabase
      .from("bids")
      .insert([{
        request_id: requestId,
        teacher_id: teacherProfile.id,
        price: parseFloat(price),
        currency: 'USD',
        session_duration_hr: sessionDuration || 1,
        teaching_mode: teachingMode || 'recorded',
        num_sessions: numSessions || 1,
        status: 'pending',
      }])
      .select()
      .single();

    if (bidError) {
      console.error("Bid error:", bidError);
      return res.status(500).json({ error: "Could not create bid." });
    }

    // Update request status to matched
    await supabase
      .from("student_requests")
      .update({ status: 'matched' })
      .eq("id", requestId);

    return res.status(201).json({ message: "Bid created successfully", bid });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error." });
  }
};


module.exports = {
  uploadMaterialController,
  getOffersController,
  getRequestsController, 
  acceptOfferController,
  acceptRequestController,
  summarizePdfController
};