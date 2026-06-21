import { api } from "../axios";
import { apiEndpoints } from "../apiEndpoints";

/**
 * Fetches the teacher directory for logged-in users.
 * @returns {{ response: Array<object>|null, status: number, message: string }}
 */
export async function getTeachers() {
  let res = { response: null, status: 400, message: "" };
  try {
    const response = await api.get(apiEndpoints.getTeachers, { validateStatus: () => true });
    switch (response.status) {
      case 200:
        res.status = 200;
        res.response = response.data.teachers || [];
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
