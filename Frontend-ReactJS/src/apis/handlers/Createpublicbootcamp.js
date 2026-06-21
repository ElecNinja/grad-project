import { api } from "../axios";

export async function createPublicBootcamp({
  title,
  description,
  category,
  sectionTitle,
  videos,
  capacity,
  price,
  image,
  photoUrl,
  tags,
  requirements,
  whatYouLearn,
  studentId,
}) {
  try {
    const formData = new FormData();
    formData.append("title", title ?? "");
    if (category) formData.append("category", category);
    if (description) formData.append("description", description);
    formData.append("sectionTitle", sectionTitle ?? "");
    formData.append("videos", JSON.stringify(videos ?? []));
    if (capacity != null && capacity !== "") formData.append("capacity", String(capacity));
    if (price != null && price !== "") formData.append("price", String(price));
    if (image) formData.append("image", image);
    if (photoUrl && photoUrl.trim()) formData.append("photoUrl", photoUrl.trim());
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
        // Let the browser set Content-Type automatically (multipart/form-data + boundary).
        // Manually setting it breaks the boundary which causes multer to miss the file.
        "Content-Type": undefined,
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
