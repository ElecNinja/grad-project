import { api } from "../axios";

// Student: bootcamps still open for self-enrollment (not already joined)
export async function getAvailablePublicBootcamps() {
  try {
    const response = await api.get("/api/student/public-bootcamps", { validateStatus: () => true });
    if (response.status === 200) {
      return { response: true, data: response.data.bootcamps || [], message: "" };
    }
    return { response: false, data: [], message: response.data?.error || "Failed to fetch bootcamps" };
  } catch (error) {
    console.error("Error fetching available bootcamps:", error);
    return { response: false, data: [], message: "Error. Please try again." };
  }
}

// Student: join a public bootcamp instantly (no teacher approval needed)
export async function enrollPublicBootcamp(bootcampId) {
  try {
    const response = await api.post(
      `/api/student/public-bootcamps/${bootcampId}/enroll`,
      {},
      { validateStatus: () => true }
    );
    if (response.status === 200) {
      return { response: true, message: response.data?.message || "Enrolled" };
    }
    return { response: false, message: response.data?.error || "Could not enroll" };
  } catch (error) {
    console.error("Error enrolling in bootcamp:", error);
    return { response: false, message: "Error. Please try again." };
  }
}

// Teacher: add a new section to an existing bootcamp
export async function addBootcampSection({ bootcampId, sectionTitle, videos }) {
  try {
    const response = await api.post(
      `/api/teacher/bootcamps/${bootcampId}/sections`,
      { title: sectionTitle, videos },
      { validateStatus: () => true }
    );
    if (response.status === 200 || response.status === 201) {
      return { response: true, data: response.data?.section || response.data, message: "" };
    }
    return { response: false, data: null, message: response.data?.error || "Failed to add section" };
  } catch (error) {
    console.error("Error adding bootcamp section:", error);
    return { response: false, data: null, message: "Error. Please try again." };
  }
}

// Teacher: make a bootcamp public with a capacity limit
export async function makeBootcampPublic({ bootcampId, capacity }) {
  try {
    const response = await api.patch(
      `/api/teacher/bootcamps/${bootcampId}/publish`,
      { max_students: capacity },
      { validateStatus: () => true }
    );
    if (response.status === 200) {
      return { response: true, data: response.data, message: "" };
    }
    return { response: false, data: null, message: response.data?.error || "Failed to publish bootcamp" };
  } catch (error) {
    console.error("Error making bootcamp public:", error);
    return { response: false, data: null, message: "Error. Please try again." };
  }
}