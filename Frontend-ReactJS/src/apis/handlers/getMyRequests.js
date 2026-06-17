import { api } from "../axios";
import { apiEndpoints } from "../apiEndpoints";

/**
 * Fetches the logged-in student's own requests.
 * @returns {{ response: object[]|null, status: number, message: string }}
 */
export async function getMyRequests() {
  let res = { response: null, status: 400, message: "" };
  try {
    const response = await api.get(apiEndpoints.getMyRequests, {
      validateStatus: () => true,
    });

    switch (response.status) {
      case 200:
        res.status = 200;
        res.response = response.data.requests || [];
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
