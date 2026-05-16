const supabase = require("../config/supabase");
const axios = require("axios");

// ===============================
// Upload material to storage + DB
// ===============================
const uploadMaterial = async (studentId, description, materialType, file) => {
  // Generate unique file name
  const fileExt = file.originalname?.split('.').pop() || 'pdf';
  const fileName = `${studentId}_${Date.now()}.${fileExt}`;

  // Upload file to Supabase Storage
  const { error: storageError } = await supabase.storage
    .from("teacher-materials")
    .upload(fileName, file.buffer, { contentType: file.mimetype });

  if (storageError) {
    console.error("Storage error:", storageError);
    throw storageError;
  }

  // Get public URL of uploaded file
  const { data: publicUrlData } = supabase.storage
    .from("teacher-materials")
    .getPublicUrl(fileName);

  const pdfUrl = publicUrlData.publicUrl;

  // Map materialType to resource_type allowed values
  const resourceTypeMap = {
    bootCamp: 'bootCamp',
    recordVideo: 'recordVideo',
    meeting: 'meeting',
    pdf: 'pdf',
    note: 'note',
  };

  // Save to community_resources table
  const { error: dbError } = await supabase
    .from("community_resources")
    .insert([{
      uploader_id: studentId,
      title: file.originalname || 'Uploaded Material',
      description: description || null,
      resource_type: resourceTypeMap[materialType] || 'other',
      file_url: pdfUrl,
      file_size_bytes: file.size || null,
      is_public: true,
    }]);

  if (dbError) {
    console.error("DB error:", dbError);
    throw dbError;
  }

  return { pdfUrl };
};

// ===============================
// Get all offers from DB + student info
// ===============================
const getOffers = async (teacherId) => {
  // Use explicit foreign key to avoid ambiguous relationship error
  const { data: resources, error } = await supabase
    .from("community_resources")
    .select(`
      *,
      profiles!community_resources_uploader_id_fkey (
        full_name,
        avatar_url
      )
    `)
    .eq("is_public", true);

  if (error) throw error;

  return resources.map((r) => ({
    ...r,
    studentName: r.profiles?.full_name || "Student",
    studentPhoto: r.profiles?.avatar_url || null,
  }));
};

// ===============================
// Accept an offer in DB
// ===============================
const acceptOffer = async (offerId, price) => {
  const { error } = await supabase
    .from("community_resources")
    .update({ is_public: true })
    .eq("id", offerId);

  if (error) throw error;
};

// ===============================
// Call AI service to summarize PDF
// ===============================
const summarizePdf = async (pdfUrl) => {
  const response = await axios.post(
    "http://127.0.0.1:8000/summarize-from-url",
    { pdfUrl }
  );

  return response.data;
};

// ===============================
// Get student requests for teacher
// ===============================
const getStudentRequests = async () => {
  const { data: requests, error } = await supabase
    .from("student_requests")
    .select(`
      *,
      profiles!student_requests_student_id_fkey (
        full_name,
        avatar_url
      ),
      request_files (
        file_name,
        file_url,
        mime_type
      )
    `)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return requests.map((r) => ({
    ...r,
    studentName: r.profiles?.full_name || "Student",
    studentPhoto: r.profiles?.avatar_url || null,
    fileUrl: r.request_files?.[0]?.file_url || null,
    fileName: r.request_files?.[0]?.file_name || null,
    subject: r.preferred_language || "Not specified", 
  }));
};

module.exports = {
  uploadMaterial,
  getOffers,
  acceptOffer,
  summarizePdf,
  getStudentRequests,
};