import { api } from "../axios";
import { apiEndpoints } from "../apiEndpoints";

/**
 * Fetches paginated reviews and rating breakdown for a teacher.
 * @param {string} teacherId
 * @param {number} page  — 0-indexed page number
 * @param {number} limit — reviews per page (default 6)
 * @returns {{ response: { reviews, total, breakdown }|null, status: number, message: string }}
 */
export async function getTeacherReviews(teacherId, page = 0, limit = 6) {
  let res = { response: null, status: 400, message: "" };
  try {
    const response = await api.get(
      `${apiEndpoints.getTeacherReviews}/${teacherId}/reviews`,
      {
        params: { page, limit },
        validateStatus: () => true,
      }
    );
    switch (response.status) {
      case 200:
        res.status = 200;
        res.response = response.data;
        break;
      case 404:
        res.message = "Teacher reviews not found.";
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
