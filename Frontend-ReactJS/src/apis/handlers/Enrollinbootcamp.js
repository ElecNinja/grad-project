import { api } from "../axios";

export async function enrollInBootcamp(bootcampId) {
  try {
    const response = await api.post(
      `/api/student/bootcamps/${bootcampId}/enroll`,
      {},
      { validateStatus: () => true }
    );

    if (response.status === 200) {
      return { response: true, data: response.data.data, message: response.data.message || "" };
    }
    return {
      response: false,
      data: null,
      message: response.data?.message || response.data?.error || "Failed to enroll",
    };
  } catch (error) {
    console.error("Error enrolling in bootcamp:", error);
    return { response: false, data: null, message: "Error. Please try again." };
  }
}