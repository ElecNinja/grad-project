import { api } from "../axios";

// Teacher uploads a video for a specific student (selected from My Lists)
export const uploadTeacherVideo = ({ studentId, title, description, videoUrl, videoType, thumbnailUrl }) =>
  api.post(`/api/teacher/upload-video`, {
    studentId,
    title,
    description,
    videoUrl,
    videoType,
    thumbnailUrl,
  }).then((r) => r.data);