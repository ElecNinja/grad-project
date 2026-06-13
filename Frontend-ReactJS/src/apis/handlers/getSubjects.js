import { api } from "../axios";

/**
 * Fetches subjects list for specialties selection.
 * @returns {{ response: Array|null, status: number, message: string }}
 */
export async function getSubjects() {
  let res = { response: null, status: 400, message: "" };
  try {
    const response = await api.get("/api/teacher/subjects", {
      validateStatus: () => true,
    });

    switch (response.status) {
      case 200:
        res.status = 200;
        res.response = response.data.subjects || [];
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

