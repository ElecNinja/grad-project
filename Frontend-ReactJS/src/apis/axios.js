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

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  // Try localStorage first, then Redux store
  const tokenFromStorage = typeof window !== "undefined"
    ? window.localStorage.getItem("supabase_access_token")
    : null;
  const tokenFromStore = store.getState().user?.token;
  const token = tokenFromStorage || tokenFromStore;

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── AI Analysis ──────────────────────────────────────────────────────────────
// Calls Express /api/ai/analyze-pdf which proxies to the FastAPI AI service.
// This keeps the AI service off the public internet — only Express is exposed.
export const uploadPdfForAnalysis = (file, requestId) => {
  const formData = new FormData();
  formData.append('file', file);
  if (requestId) {
    formData.append('request_id', requestId);
  }
  return api.post(`/api/ai/analyze-pdf`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000, // 2 minutes — LLM can be slow
  });
};

// ─── Student Request ───────────────────────────────────────────────────────────
// Step 1: Upload PDF to storage + create student_request + request_files rows
// Returns: { request_id, file_url }
export const createStudentRequest = (file, description, materialType, subject) => {
  const formData = new FormData();
  if (file) formData.append("file", file);
  formData.append("description", description || "");
  formData.append("materialType", materialType);
  formData.append("title", description || "New Request");
  formData.append("subject", subject || "");
  return api.post(`/api/student/request`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  }).then((r) => r.data);
};

// ─── Teacher ──────────────────────────────────────────────────────────────────
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

export const acceptRequest = (requestId, price, teachingMode) =>
  api.post(`/api/teacher/accept-request`, {
    requestId,
    price,
    sessionDuration: 1,
    teachingMode: teachingMode || 'recorded',
    numSessions: 1,
  }).then((r) => r.data);

export const getMyRequests = () =>
  api.get(`/api/student/requests`).then((r) => r.data.requests);

export const getTeacherOffers = (teacherId) =>
  api.get(`/api/teacher/offers/${teacherId}`).then((r) => r.data);

export const acceptOffer = (offerId, price) =>
  api.post(`/api/teacher/accept-offer`, { offerId, price }).then((r) => r.data);

export const summarizePdf = (pdfUrl) =>
  api.post(`/api/teacher/summarize-pdf`, { pdfUrl }).then((r) => r.data);

export const getStudentRequests = () =>
  api.get(`/api/teacher/requests`).then((r) => {
    if (Array.isArray(r.data)) return r.data;
    if (Array.isArray(r.data?.requests)) return r.data.requests;
    return [];
  });

export default api;