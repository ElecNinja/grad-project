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

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = window.localStorage.getItem("supabase_access_token");

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

// Automatically send token with every request
api.interceptors.request.use((config) => {
  const token = store.getState().user?.token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const AI_BASE_URL = 'http://localhost:8000';

export const uploadPdfForAnalysis = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return axios.post(`${AI_BASE_URL}/analyze-pdf`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
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

//  Student creates a request
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

export const acceptRequest = (requestId, price, teachingMode) =>
  api.post(`/api/teacher/accept-request`, {
    requestId,
    price,
    sessionDuration: 1,
    teachingMode: teachingMode || 'recorded',
    numSessions: 1,
  }).then((r) => r.data);

  
// Student gets their requests
export const getMyRequests = () =>
  api.get(`/api/student/requests`).then((r) => r.data.requests); 

export const getTeacherOffers = (teacherId) =>
  api.get(`/api/teacher/offers/${teacherId}`).then((r) => r.data);

export const acceptOffer = (offerId, price) =>
  api.post(`/api/teacher/accept-offer`, { offerId, price }).then((r) => r.data);

export const summarizePdf = (pdfUrl) =>
  api.post(`/api/teacher/summarize-pdf`, { pdfUrl }).then((r) => r.data);

export const getStudentRequests = () =>
  api.get(`/api/teacher/requests`).then((r) => r.data);


