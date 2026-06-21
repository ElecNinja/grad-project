import { api } from "../axios";
import { apiEndpoints } from "../apiEndpoints";

/**
 * Submits a new rating/review for a teacher.
 * @returns {{ response: { review }|null, status: number, message: string }}
 */
export async function submitTeacherRating({ teacherId, rating, comment, sessionId, courseId }) {
  let res = { response: null, status: 400, message: "" };
  try {
    const response = await api.post(
      `${apiEndpoints.addTeacherReview}/${teacherId}/reviews`,
      { rating, comment, sessionId, courseId },
      { validateStatus: () => true }
    );
    switch (response.status) {
      case 201:
        res.status = 201;
        res.response = response.data;
        break;
      case 400:
        res.message = response.data?.error || "Invalid rating.";
        break;
      case 401:
        res.message = "Unauthorized.";
        break;
      default:
        res.message = "Error: Please refresh the page and try again.";
    }
  } catch {
    res.message = "Error: Please refresh the page and try again.";
  }
  return res;
}