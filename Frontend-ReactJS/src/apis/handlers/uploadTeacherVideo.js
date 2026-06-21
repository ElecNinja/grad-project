import { api } from "../axios";

/**
 * Teacher uploads a video/live session for one or more students (selected from My Lists).
 * Sends studentIds as an array. The backend accepts both a single studentId (legacy)
 * and an array, so this is fully backward-compatible.
 */
export const uploadTeacherVideo = ({ studentId, title, description, videoUrl, videoType, thumbnailUrl }) =>
  api.post(`/api/teacher/upload-video`, {
    // Always normalise to the array form — the controller handles both
    studentIds: [studentId],
    title,
    description,
    videoUrl,
    videoType,
    thumbnailUrl,
  }).then((r) => r.data);