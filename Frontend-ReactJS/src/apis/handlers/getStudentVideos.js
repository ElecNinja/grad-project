import { api } from "../axios";

// Student gets the courses they're enrolled in (with progress + syllabus)
export const getMyVideoCourses = () =>
  api.get(`/api/student/videos/courses`).then((r) => {
    if (Array.isArray(r.data)) return r.data;
    if (Array.isArray(r.data?.data)) return r.data.data;
    return [];
  });

// Student gets the bootcamps they're enrolled in (with progress + syllabus)
export const getMyVideoBootcamps = () =>
  api.get(`/api/student/videos/bootcamps`).then((r) => {
    if (Array.isArray(r.data)) return r.data;
    if (Array.isArray(r.data?.data)) return r.data.data;
    return [];
  });