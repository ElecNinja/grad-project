import axios from "axios";
import { redirect } from "react-router-dom";
import { baseUrl } from "./apiEndpoints";

// Axios instance:

/**
 * ----------------------------------------------------
 * API calls in this application use the Axios library.
 * @see {@link https://axios-http.com}
 * -----------------------------------------------------
 * @example
 * 
 * Usage:
 * const response = await api.post(apiEndpoints.login, dataToPost)
 */
export const api = axios.create({
 baseURL: baseUrl,
 timeout: 5000,
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
  return axios.post(`${baseUrl}/api/teacher/upload-material`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  }).then((r) => r.data);
};

export const getTeacherOffers = (teacherId) =>
  api.get(`${baseUrl}/api/teacher/offers/${teacherId}`).then((r) => r.data);

export const acceptOffer = (offerId, price) =>
  api.post(`${baseUrl}/api/teacher/accept-offer`, { offerId, price }).then((r) => r.data);

export const summarizePdf = (pdfUrl) =>
  axios.post(`${baseUrl}/api/teacher/summarize-pdf`, { pdfUrl }).then((r) => r.data);