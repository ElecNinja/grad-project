import { api } from "../axios";
import { apiEndpoints } from "../apiEndpoints";

/**
 * Updates the logged-in student's profile.
 * Sends multipart/form-data if a photo file is included, otherwise JSON.
 * @param {{ name?: string, bio?: string, country?: string, timezone?: string, field?: string, specialist?: string, photo?: File }} profileData
 * @returns {{ response: object|null, status: number, message: string }}
 */
export async function updateStudentProfile(profileData) {
  let res = { response: null, status: 400, message: "" };
  try {
    let body;
    let headers = {};

    if (profileData.photo instanceof File) {
      body = new FormData();
      Object.entries(profileData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) body.append(key, value);
      });
      headers["Content-Type"] = "multipart/form-data";
    } else {
      body = profileData;
    }

    const response = await api.put(
      apiEndpoints.updateStudentProfile,
      body,
      { headers, validateStatus: () => true }
    );

    switch (response.status) {
      case 200:
        res.status = 200;
        res.response = response.data.student;
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