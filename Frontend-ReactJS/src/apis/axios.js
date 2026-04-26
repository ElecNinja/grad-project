import axios from "axios";
import { baseUrl } from "./apiEndpoints";

export const api = axios.create({
  baseURL: baseUrl,
  timeout: 60000,
  withCredentials: true,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  }
});

export const uploadPdfForAnalysis = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return axios.post("/api/ai/analyze-pdf", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  }).then((r) => r.data);
};

export const uploadTeacherMaterial = (studentId, file, description, materialType) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("studentId", studentId);
  formData.append("description", description);
  formData.append("materialType", materialType);
  // Use api instance to send session cookie
  return api.post(`/api/teacher/upload-material`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  }).then((r) => r.data);
};

export const getTeacherOffers = (teacherId) =>
  api.get(`/api/teacher/offers/${teacherId}`).then((r) => r.data);

export const acceptOffer = (offerId, price) =>
  api.post(`/api/teacher/accept-offer`, { offerId, price }).then((r) => r.data);

export const summarizePdf = (pdfUrl) =>
  api.post(`/api/teacher/summarize-pdf`, { pdfUrl }).then((r) => r.data);