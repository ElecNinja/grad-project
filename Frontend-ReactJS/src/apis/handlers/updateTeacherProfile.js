import { api } from "../axios";
import { apiEndpoints } from "../apiEndpoints";

/**
 * Updates the logged-in teacher's profile.
 * Sends multipart/form-data if any file is included, otherwise JSON.
 * @param {{ name?: string, bio?: string, photo?: File, video?: File, headline?: string, introduction_video?: string, hourly_rate_min?: number, hourly_rate_max?: number, teaching_languages?: string[]|string, specialties?: any[]|string, specialty_subject_ids?: string[]|string }} profileData
 * @returns {{ response: object|null, status: number, message: string }}
 */
export async function updateTeacherProfile(profileData) {
  let res = { response: null, status: 400, message: "" };
  try {
    let body;
    let headers = {};

    const hasFile =
      profileData.photo instanceof File || profileData.video instanceof File;

    if (hasFile) {
      // Multipart when a file is being uploaded
      body = new FormData();
      Object.entries(profileData).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        // File / Blob must be appended as-is so multer receives real binary data
        if (value instanceof File || value instanceof Blob) {
          body.append(key, value, value.name);
          return;
        }
        if (value instanceof File || value instanceof Blob) {
  body.append(key, value, value.name);
  return;
}
if (Array.isArray(value)) {
  body.append(key, JSON.stringify(value));
  return;
}
if (typeof value === "object") {
  body.append(key, JSON.stringify(value));
  return;
}
        body.append(key, value);
      });
      // Do NOT manually set Content-Type — axios sets it with the correct boundary automatically
    } else {
      body = profileData;
    }

    const response = await api.put(
      apiEndpoints.updateTeacherProfile,
      body,
      { headers, validateStatus: () => true }
    );

    switch (response.status) {
      case 200:
        res.status = 200;
        res.response = response.data.teacher;
        res.message = "Profile updated successfully.";
        break;
      case 400:
        res.message = response.data?.error || "Invalid data.";
        break;
      case 401:
      case 403:
        res.message = response.data?.error || "Unauthorized.";
        break;
      default:
        res.message = "Error: Please refresh the page and try again.";
    }
  } catch {
    res.message = "Error: Please refresh the page and try again.";
  }
  return res;
}