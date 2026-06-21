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
// FIX: was POSTing to /api/teacher/bootcamps/... (404) — correct path is /api/teacher/public-bootcamps/...
export async function addBootcampSection({ bootcampId, sectionTitle, videos }) {
  try {
    const response = await api.post(
      `/api/teacher/public-bootcamps/${bootcampId}/sections`,
      { title: sectionTitle, videos },
      { validateStatus: () => true }
    );
    if (response.status === 200 || response.status === 201) {
      // backend returns { data: section } — read response.data.data, not response.data.section
      return { response: true, data: response.data?.data || null, message: "" };
    }
    return { response: false, data: null, message: response.data?.error || "Failed to add section" };
  } catch (error) {
    console.error("Error adding bootcamp section:", error);
    return { response: false, data: null, message: "Error. Please try again." };
  }
}

// Teacher: make a bootcamp public with a capacity limit
// FIX: was PATCH to /api/teacher/bootcamps/.../publish (404) — correct is POST /api/teacher/public-bootcamps/.../make-public
export async function makeBootcampPublic({ bootcampId, capacity }) {
  try {
    const response = await api.post(
      `/api/teacher/public-bootcamps/${bootcampId}/make-public`,
      { capacity },
      { validateStatus: () => true }
    );
    if (response.status === 200) {
      // backend returns { data: result } — read response.data.data, not response.data
      return { response: true, data: response.data?.data || null, message: "" };
    }
    return { response: false, data: null, message: response.data?.error || "Failed to publish bootcamp" };
  } catch (error) {
    console.error("Error making bootcamp public:", error);
    return { response: false, data: null, message: "Error. Please try again." };
  }
}