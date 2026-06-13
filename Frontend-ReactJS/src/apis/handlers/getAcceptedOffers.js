import { api } from "../axios";
import { apiEndpoints } from "../apiEndpoints";

/**
 * Get accepted offers for the logged-in user
 * Works for both students and teachers based on their role
 * 
 * For students: returns accepted offers from teachers
 * For teachers: returns accepted offers they've made to students
 */
export async function getAcceptedOffers(userRole = "student") {
  try {
    const endpoint = userRole === "teacher" 
      ? "/api/teacher/accepted-offers"
      : "/api/student/accepted-offers";

    const response = await api.get(endpoint, { validateStatus: () => true });

    const status = response.status;

    if (status === 200) {
      const data = response.data?.offers || [];
      return { response: true, data, message: "" };
    } else if (status === 401 || status === 403) {
      return { response: false, data: [], message: "Unauthorized" };
    } else {
      return { response: false, data: [], message: response.data?.error || "Failed to fetch offers" };
    }
  } catch (error) {
    console.error("Error fetching accepted offers:", error);
    return { response: false, data: [], message: "Error. Please try again." };
  }
}
