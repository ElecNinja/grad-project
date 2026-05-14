import axios from "axios";
import { baseUrl } from "./apiEndpoints";
import { store } from "../redux/store";

export const api = axios.create({
  baseURL: baseUrl,
  timeout: 60000,
  withCredentials: true,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  }
});

// Automatically send token with every request
api.interceptors.request.use((config) => {
  const token = store.getState().user?.token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
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
  return api.post(`/api/teacher/upload-material`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  }).then((r) => r.data);
};

// ✅ Student creates a request
export const createStudentRequest = (file, description, materialType, title) => {
  const formData = new FormData();
  if (file) formData.append("file", file);
  formData.append("description", description || "");
  formData.append("materialType", materialType);
  formData.append("title", title || description || "New Request");
  return api.post(`/api/student/request`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  }).then((r) => r.data);
};

// ✅ Student gets their requests
export const getMyRequests = () =>
  api.get(`/api/student/requests`).then((r) => r.data);

export const getTeacherOffers = (teacherId) =>
  api.get(`/api/teacher/offers/${teacherId}`).then((r) => r.data);

export const acceptOffer = (offerId, price) =>
  api.post(`/api/teacher/accept-offer`, { offerId, price }).then((r) => r.data);

export const summarizePdf = (pdfUrl) =>
  api.post(`/api/teacher/summarize-pdf`, { pdfUrl }).then((r) => r.data);