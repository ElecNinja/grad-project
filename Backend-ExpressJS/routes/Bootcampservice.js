const supabase = require("../config/supabase");

async function createPublicBootcamp({ teacherId, title, description, tags, videos, watchLimit, capacity }) {
  const { data, error } = await supabase
    .from("public_bootcamps")
    .insert({
      teacher_id: teacherId,
      title,
      description,
      tags,
      videos,
      watch_limit: watchLimit || 2,
      capacity,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function listAvailableBootcamps(studentId) {
  const { data: bootcamps, error } = await supabase
    .from("public_bootcamps")
    .select("*, profiles:teacher_id(full_name)")
    .order("created_at", { ascending: false });

  if (error) throw error;

  const { data: myEnrollments, error: enrollError } = await supabase
    .from("bootcamp_enrollments")
    .select("bootcamp_id")
    .eq("student_id", studentId);

  if (enrollError) throw enrollError;

  const enrolledIds = new Set((myEnrollments || []).map((e) => e.bootcamp_id));

  return (bootcamps || []).map((b) => ({
    id: b.id,
    title: b.title,
    description: b.description,
    tags: b.tags,
    videos: b.videos,
    watchLimit: b.watch_limit,
    capacity: b.capacity,
    enrolledCount: b.enrolled_count,
    spotsLeft: Math.max(b.capacity - b.enrolled_count, 0),
    isFull: b.enrolled_count >= b.capacity,
    teacherName: b.profiles?.full_name || "Teacher",
    alreadyEnrolled: enrolledIds.has(b.id),
    createdAt: b.created_at,
  }));
}

async function enrollInBootcamp({ studentId, bootcampId }) {
  const { data, error } = await supabase.rpc("enroll_in_bootcamp", {
    p_bootcamp_id: bootcampId,
    p_student_id: studentId,
  });
  if (error) throw error;
  return Array.isArray(data) ? data[0] : data; // { success, message }
}

async function getMyEnrolledBootcamps(studentId) {
  const { data, error } = await supabase
    .from("bootcamp_enrollments")
    .select("bootcamp_id, public_bootcamps(*, profiles:teacher_id(full_name))")
    .eq("student_id", studentId);

  if (error) throw error;

  return (data || [])
    .filter((row) => row.public_bootcamps)
    .map((row) => {
      const b = row.public_bootcamps;
      return {
        id: b.id,
        title: b.title,
        description: b.description,
        videos: b.videos,
        watchLimit: b.watch_limit,
        teacherName: b.profiles?.full_name || "Teacher",
      };
    });
}

module.exports = {
  createPublicBootcamp,
  listAvailableBootcamps,
  enrollInBootcamp,
  getMyEnrolledBootcamps,
};