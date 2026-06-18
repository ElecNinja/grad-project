import { api } from "../axios";

export async function createPublicBootcamp({ title, description, tags, videos, watchLimit, capacity }) {
  try {
    const response = await api.post(
      "/api/teacher/bootcamps",
      { title, description, tags, videos, watchLimit, capacity },
      { validateStatus: () => true }
    );

    if (response.status === 201) {
      return { response: true, data: response.data.bootcamp, message: "" };
    }
    return { response: false, data: null, message: response.data?.error || "Failed to create bootcamp" };
  } catch (error) {
    console.error("Error creating bootcamp:", error);
    return { response: false, data: null, message: "Error. Please try again." };
  }
}