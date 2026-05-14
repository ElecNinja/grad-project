import { api } from "../axios";
import { apiEndpoints } from "../apiEndpoints";

export async function acceptOffer(offerId, price) {
  try {
    const response = await api.post("/api/teacher/accept-offer", {
      offerId,
      price
    }, { validateStatus: () => true });

    const status = response.status;

    if (status === 200) {
      return { response: true, message: "" };
    } else {
      return { response: false, message: response.data?.error || "Failed to accept offer." };
    }
  } catch {
    return { response: false, message: "Error. Please try again." };
  }
}