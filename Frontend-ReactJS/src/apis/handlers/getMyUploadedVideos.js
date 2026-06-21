import { api } from "../axios";

/**
 * Get videos a teacher has uploaded specifically for this student.
 * Backend returns: { success: true, data: [...] }
 * Each row: { id, type, title, description, videoUrl, thumbnail, expert, createdAt }
 */
export const getMyUploadedVideos = async () => {
  try {
    const response = await api.get('/api/student/videos/uploaded', {
      validateStatus: () => true,
    });

    if (response.status === 200) {
      // backend wraps in { success, data }
      return Array.isArray(response.data?.data)
        ? response.data.data
        : Array.isArray(response.data)
        ? response.data
        : [];
    }

    console.warn('getMyUploadedVideos: status', response.status);
    return [];
  } catch (err) {
    console.error('getMyUploadedVideos error:', err);
    return [];
  }
};