import { api } from "../axios";

export async function createPublicBootcamp({
  title,
  description,
  sectionTitle,
  videos,
  capacity,
  price,
  image,
  tags,
  requirements,
  whatYouLearn,
  studentId,
}) {
  try {
    const formData = new FormData();
    formData.append("title", title ?? "");
    if (description) formData.append("description", description);
    formData.append("sectionTitle", sectionTitle ?? "");
    formData.append("videos", JSON.stringify(videos ?? []));
    if (capacity != null && capacity !== "") formData.append("capacity", String(capacity));
    if (price != null && price !== "") formData.append("price", String(price));
    if (image) formData.append("image", image);
    if (studentId) formData.append("studentId", studentId);

    if (tags && String(tags).trim()) {
      const tagsArray = String(tags)
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      formData.append("tags", JSON.stringify(tagsArray));
    }

    if (requirements && String(requirements).trim()) {
      formData.append("requirements", requirements);
    }

    if (whatYouLearn && String(whatYouLearn).trim()) {
      formData.append("whatYouLearn", whatYouLearn);
    }

    const response = await api.post("/api/teacher/public-bootcamps", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      validateStatus: () => true,
    });

    if (response.status === 201) {
      return {
        response: true,
        data: response.data?.data ?? null,
        warning: response.data?.warning ?? "",
        message: "",
      };
    }

    return {
      response: false,
      data: null,
      warning: "",
      message: response.data?.error || "Failed to create bootcamp",
    };
  } catch (error) {
    console.error("Error creating bootcamp:", error);
    return {
      response: false,
      data: null,
      warning: "",
      message: error?.response?.data?.error || "Error. Please try again.",
    };
  }
}
