import { api } from "../axios";
import { apiEndpoints } from "../apiEndpoints";

/**
 * Fetches a teacher's profile by ID.
 * @param {string} teacherId
 * @returns {{ response: object|null, status: number, message: string }}
 */
export async function getTeacherProfile(teacherId) {
  let res = { response: null, status: 400, message: "" };
  try {
    const response = await api.get(
      `${apiEndpoints.getTeacherProfile}/${teacherId}`,
      { validateStatus: () => true }
    );
    switch (response.status) {
      case 200:
        res.status = 200;
        res.response = response.data.teacher;
        break;
      case 404:
        res.message = "Teacher profile not found.";
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