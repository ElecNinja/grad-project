import { api } from "../axios";
import { apiEndpoints } from "../apiEndpoints";

/**
 * Fetches a student's profile by ID.
 * Pass no ID (or own ID) to get the logged-in student's own profile.
 * @param {string} studentId
 * @returns {{ response: object|null, status: number, message: string }}
 */
export async function getStudentProfile(studentId) {
  let res = { response: null, status: 400, message: "" };
  try {
    const response = await api.get(
      `${apiEndpoints.getStudentProfile}/${studentId}`,
      { validateStatus: () => true }
    );
    switch (response.status) {
      case 200:
        res.status = 200;
        res.response = response.data.student;
        break;
      case 404:
        res.message = "Student profile not found.";
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