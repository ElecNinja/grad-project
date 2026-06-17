import { api } from "../axios";

// Student gets videos a teacher uploaded specifically for them
export const getMyUploadedVideos = () =>
  api.get(`/api/student/videos/uploaded`).then((r) => {
    if (Array.isArray(r.data)) return r.data;
    if (Array.isArray(r.data?.data)) return r.data.data;
    return [];
  });