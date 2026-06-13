import { api } from "../axios";
import { apiEndpoints } from "../apiEndpoints";

/**
 * Fetches up to 4 recommended teachers sharing the same subject(s) as the given teacher.
 * @param {string} teacherId
 * @returns {{ response: Array<object>|null, status: number, message: string }}
 */
export async function getRecommendedTeachers(teacherId) {
  let res = { response: null, status: 400, message: "" };
  try {
    const response = await api.get(
      `${apiEndpoints.getRecommendedTeachers}/${teacherId}/recommended`,
      { validateStatus: () => true }
    );
    switch (response.status) {
      case 200:
        res.status = 200;
        res.response = response.data.teachers || [];
        break;
      case 404:
        res.message = "No recommended teachers found.";
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
