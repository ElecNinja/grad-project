const supabase = require("../config/supabase");
const axios = require("axios");

// ===============================
// Upload material to storage + DB
// ===============================
const uploadMaterial = async (studentId, description, materialType, file) => {
  const fileName = `${studentId}_${Date.now()}.pdf`;

  const { error: storageError } = await supabase.storage
    .from("teacher-materials")
    .upload(fileName, file.buffer, { contentType: "application/pdf" });

  if (storageError) throw storageError;

  const { data: publicUrlData } = supabase.storage
    .from("teacher-materials")
    .getPublicUrl(fileName);

  const pdfUrl = publicUrlData.publicUrl;
  const idPdf = Date.now();

  const { error: uploadError } = await supabase
    .from("upload-pdf")
    .insert([{
      "id-student": studentId,
      "pdf-url": pdfUrl,
      specialties: description || null,
      "id-pdf": idPdf,
      "Type": materialType || null,
    }]);

  if (uploadError) throw uploadError;

  return { pdfUrl };
};

// ===============================
// Get all offers from DB + student info
// ===============================
const getOffers = async (teacherId) => {
  const { data: pdfs, error } = await supabase
    .from("upload-pdf")
    .select("*");

  if (error) throw error;

  const offersWithStudentInfo = await Promise.all(
    pdfs.map(async (pdf) => {
      const { data: student } = await supabase
        .from("signup-students")
        .select("name, photo")
        .eq("id", pdf["id-student"])
        .single();

      return {
        ...pdf,
        studentName: student?.name || "Student",
        studentPhoto: student?.photo || null,
      };
    })
  );

  return offersWithStudentInfo;
};

// ===============================
// Accept an offer in DB
// ===============================
const acceptOffer = async (offerId, price) => {
  const { error } = await supabase
    .from("offer-teacher")
    .update({ "accept or not": "accepted" })
    .eq("id-pdf", offerId);

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

module.exports = {
  uploadMaterial,
  getOffers,
  acceptOffer,
  summarizePdf
};