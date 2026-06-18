const supabase = require('../config/supabase');

// bootcamps.teacher_id points to teacher_profiles.id, NOT profiles.id —
// so we always resolve the logged-in user's profile id to their teacher_profiles row first.
async function getTeacherProfileId(profileUserId) {
  const { data, error } = await supabase
    .from('teacher_profiles')
    .select('id')
    .eq('profile_id', profileUserId)
    .single();
  if (error) throw error;
  return data?.id;
}

// ---------------------------------------------------------------------
// Create a bootcamp with its first section and that section's videos.
// Structure: bootcamp -> sections -> lessons (videos)
// ---------------------------------------------------------------------
async function createPublicBootcamp({
  profileUserId,
  title,
  description,
  sectionTitle,
  videos,
  capacity,
}) {
  const teacherProfileId = await getTeacherProfileId(profileUserId);
  if (!teacherProfileId) throw new Error('Teacher profile not found for this user');

  // 1) Create the bootcamp itself (still private/single-student by default;
  //    "Make Public" is a separate, explicit step done later via make_bootcamp_public)
  const { data: bootcamp, error: bcErr } = await supabase
    .from('bootcamps')
    .insert({
      teacher_id: teacherProfileId,
      title,
      description,
      delivery_type: 'recorded',
      max_students: capacity || null,
      enrolled_count: 0,
      is_public: false,
      status: 'planning',
    })
    .select()
    .single();

  if (bcErr) throw bcErr;

  // 2) Create the first section under this bootcamp
  const { data: section, error: secErr } = await supabase
    .from('bootcamp_sections')
    .insert({
      bootcamp_id: bootcamp.id,
      title: sectionTitle?.trim() || title,
      sort_order: 0,
    })
    .select()
    .single();

  if (secErr) throw secErr;

  // 3) Insert all videos under that section (no artificial limit)
  const lessonsToInsert = (videos || []).map((v, idx) => ({
    bootcamp_id: bootcamp.id,
    section_id: section.id,
    title: v.title?.trim() || `Video ${idx + 1}`,
    video_url: v.url,
    lesson_type: 'video',
    sort_order: idx,
    is_published: true,
  }));

  if (lessonsToInsert.length > 0) {
    const { error: lessonErr } = await supabase.from('bootcamp_lessons').insert(lessonsToInsert);
    if (lessonErr) throw lessonErr;
  }

  return { ...bootcamp, section };
}

// ---------------------------------------------------------------------
// Add a new section (e.g. "CSS", "JavaScript") to an existing bootcamp.
// sort_order is computed automatically (appended to the end).
// ---------------------------------------------------------------------
async function addSectionToBootcamp({ profileUserId, bootcampId, sectionTitle }) {
  const teacherProfileId = await getTeacherProfileId(profileUserId);
  if (!teacherProfileId) throw new Error('Teacher profile not found for this user');

  // Confirm the teacher owns this bootcamp
  const { data: bootcamp, error: bcErr } = await supabase
    .from('bootcamps')
    .select('id, teacher_id')
    .eq('id', bootcampId)
    .single();
  if (bcErr) throw bcErr;
  if (!bootcamp || bootcamp.teacher_id !== teacherProfileId) {
    throw new Error('You do not own this bootcamp');
  }

  // Find the current max sort_order to append the new section at the end
  const { data: existingSections, error: secListErr } = await supabase
    .from('bootcamp_sections')
    .select('sort_order')
    .eq('bootcamp_id', bootcampId)
    .order('sort_order', { ascending: false })
    .limit(1);
  if (secListErr) throw secListErr;

  const nextSortOrder = existingSections?.length ? existingSections[0].sort_order + 1 : 0;

  const { data: section, error: secErr } = await supabase
    .from('bootcamp_sections')
    .insert({
      bootcamp_id: bootcampId,
      title: sectionTitle?.trim(),
      sort_order: nextSortOrder,
    })
    .select()
    .single();

  if (secErr) throw secErr;
  return section;
}

// ---------------------------------------------------------------------
// Add a video (lesson) under an existing section.
// ---------------------------------------------------------------------
async function addVideoToSection({ profileUserId, bootcampId, sectionId, title, url }) {
  const teacherProfileId = await getTeacherProfileId(profileUserId);
  if (!teacherProfileId) throw new Error('Teacher profile not found for this user');

  const { data: bootcamp, error: bcErr } = await supabase
    .from('bootcamps')
    .select('id, teacher_id')
    .eq('id', bootcampId)
    .single();
  if (bcErr) throw bcErr;
  if (!bootcamp || bootcamp.teacher_id !== teacherProfileId) {
    throw new Error('You do not own this bootcamp');
  }

  const { data: existingLessons, error: lessonListErr } = await supabase
    .from('bootcamp_lessons')
    .select('sort_order')
    .eq('section_id', sectionId)
    .order('sort_order', { ascending: false })
    .limit(1);
  if (lessonListErr) throw lessonListErr;

  const nextSortOrder = existingLessons?.length ? existingLessons[0].sort_order + 1 : 0;

  const { data: lesson, error: lessonErr } = await supabase
    .from('bootcamp_lessons')
    .insert({
      bootcamp_id: bootcampId,
      section_id: sectionId,
      title: title?.trim() || 'Untitled video',
      video_url: url,
      lesson_type: 'video',
      sort_order: nextSortOrder,
      is_published: true,
    })
    .select()
    .single();

  if (lessonErr) throw lessonErr;
  return lesson;
}

// ---------------------------------------------------------------------
// Teacher converts a private/single-student bootcamp into a public,
// capacity-limited, self-enroll bootcamp. Delegates the actual logic
// (ownership check, status flip, auto-enrolling the original student)
// to the make_bootcamp_public Postgres function for atomicity.
// ---------------------------------------------------------------------
async function makeBootcampPublic({ profileUserId, bootcampId, capacity }) {
  const { data, error } = await supabase.rpc('make_bootcamp_public', {
    p_bootcamp_id: bootcampId,
    p_teacher_profile_user_id: profileUserId,
    p_capacity: capacity,
  });
  if (error) throw error;
  return Array.isArray(data) ? data[0] : data;
}

// ---------------------------------------------------------------------
// Student-facing: list public bootcamps open for self-enrollment,
// with their sections and lessons nested for display.
// ---------------------------------------------------------------------
async function listAvailablePublicBootcamps(studentId) {
  const { data: bootcamps, error } = await supabase
    .from('bootcamps')
    .select(`
      id, title, description, max_students, enrolled_count, thumbnail_url, created_at,
      teacher_id,
      teacher_profiles:teacher_id ( profile_id, profiles:profile_id ( full_name ) ),
      bootcamp_sections ( id, title, sort_order,
        bootcamp_lessons ( id, title, video_url, sort_order )
      )
    `)
    .eq('is_public', true)
    .eq('status', 'open_enrollment')
    .order('created_at', { ascending: false });

  if (error) throw error;

  const { data: myEnrollments, error: enrollErr } = await supabase
    .from('bootcamp_enrollments')
    .select('bootcamp_id')
    .eq('student_id', studentId);

  if (enrollErr) throw enrollErr;
  const enrolledIds = new Set((myEnrollments || []).map((e) => e.bootcamp_id));

  return (bootcamps || [])
    .map((b) => {
      const sections = (b.bootcamp_sections || [])
        .sort((a, c) => a.sort_order - c.sort_order)
        .map((s) => ({
          id: s.id,
          title: s.title,
          lessons: (s.bootcamp_lessons || []).sort((a, c) => a.sort_order - c.sort_order),
        }));

      const videosCount = sections.reduce((sum, s) => sum + s.lessons.length, 0);

      return {
        id: b.id,
        title: b.title,
        description: b.description,
        thumbnail: b.thumbnail_url || null,
        teacherName: b.teacher_profiles?.profiles?.full_name || 'Teacher',
        capacity: b.max_students,
        enrolledCount: b.enrolled_count,
        spotsLeft: b.max_students != null ? Math.max(b.max_students - b.enrolled_count, 0) : null,
        isFull: b.max_students != null ? b.enrolled_count >= b.max_students : false,
        alreadyEnrolled: enrolledIds.has(b.id),
        sections,
        videosCount,
        createdAt: b.created_at,
      };
    })
    // already-enrolled bootcamps show up in the normal "My Bootcamps" list (getStudentBootcamps),
    // so we keep this list to just what the student can still join.
    .filter((b) => !b.alreadyEnrolled);
}

async function enrollStudentInBootcamp({ studentId, bootcampId }) {
  const { data, error } = await supabase.rpc('enroll_in_public_bootcamp', {
    p_bootcamp_id: bootcampId,
    p_student_id: studentId,
  });
  if (error) throw error;
  return Array.isArray(data) ? data[0] : data; // { success, message }
}

module.exports = {
  createPublicBootcamp,
  addSectionToBootcamp,
  addVideoToSection,
  makeBootcampPublic,
  listAvailablePublicBootcamps,
  enrollStudentInBootcamp,
};