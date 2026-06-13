import api from '../axios';
import { apiEndpoints } from '../apiEndpoints';

export const uploadCourseContent = async (bidId, title, description, contentType, file) => {
  try {
    const formData = new FormData();
    formData.append('bidId', bidId);
    formData.append('title', title);
    formData.append('description', description || '');
    formData.append('contentType', contentType);
    if (file) {
      formData.append('file', file);
    }

    const response = await api.post('/api/teacher/upload-content', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error uploading course content:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to upload course content',
    };
  }
};

export const getCourseContent = async (bidId) => {
  try {
    const response = await api.get(`/api/teacher/course-content/${bidId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching course content:', error);
    throw error;
  }
};
