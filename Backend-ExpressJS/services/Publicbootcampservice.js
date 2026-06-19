const supabase = require('../config/supabase');

async function getTeacherProfileId(profileUserId) {
  const { data, error } = await supabase
    .from('teacher_profiles')
    .select('id')
    .eq('profile_id', profileUserId)
    .single();
  if (error) throw error;
  return data?.id;
}

async function createPublicBootcamp({
  profileUserId,
  title,
  description,
  sectionTitle,
  videos,
  capacity,
  price,
  tags,
  requirements,
  whatYouLearn,
  studentId,
}) {
  const teacherProfileId = await getTeacherProfileId(profileUserId);
  if (!teacherProfileId) throw new Error('Teacher profile not found for this user');

  // 1) Create the bootcamp
  const { data: bootcamp, error: bcErr } = await supabase
    .from('bootcamps')
    .insert({
      teacher_id: teacherProfileId,
      title,
      description,
      delivery_type: 'recorded',
      max_students: capacity || null,
      enrolled_count: 0,
      is_public: true,
      status: 'open_enrollment',
      total_price: price || 0,
      tags: Array.isArray(tags) ? tags : [],
      requirements: requirements || null,
      what_you_learn: whatYouLearn || null,
    })
    .select()
    .single();

  if (bcErr) throw bcErr;

  // 2) Create the first section
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

  // 3) Insert videos under that section
  const lessonsToInsert = (videos || []).map((v, idx) => ({
    bootcamp_id: bootcamp.id,
    section_id: section.id,
    title: v.title?.trim() || `Video ${idx + 1}`,
    video_url: v.url,
    lesson_type: 'video',
    sort_order: idx,
    is_published: true,
    duration_min: v.durationMin ? Number(v.durationMin) : null,
  }));

  if (lessonsToInsert.length > 0) {
    const { error: lessonErr } = await supabase.from('bootcamp_lessons').insert(lessonsToInsert);
    if (lessonErr) throw lessonErr;
  }

  // 4) Auto-enroll the target student so it appears in their Videos page
  if (studentId) {
    try {
      await enrollStudentInBootcamp({ studentId, bootcampId: bootcamp.id });
    } catch (enrollErr) {
      console.error('Failed to auto-enroll student in bootcamp:', enrollErr);
      throw new Error('Bootcamp created but failed to enroll the student. Please try again.');
    }
  }

  return { ...bootcamp, section };
}

async function addSectionToBootcamp({ profileUserId, bootcampId, sectionTitle, videos }) {
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

  const lessonsToInsert = (videos || []).map((v, idx) => ({
    bootcamp_id: bootcampId,
    section_id: section.id,
    title: v.title?.trim() || `Video ${idx + 1}`,
    video_url: v.url,
    lesson_type: 'video',
    sort_order: idx,
    is_published: true,
    duration_min: v.durationMin ? Number(v.durationMin) : null,
  }));

  let lessons = [];
  if (lessonsToInsert.length > 0) {
    const { data: insertedLessons, error: lessonErr } = await supabase
      .from('bootcamp_lessons')
      .insert(lessonsToInsert)
      .select();
    if (lessonErr) throw lessonErr;
    lessons = insertedLessons || [];
  }

  return { ...section, lessons };
}

async function addVideoToSection({ profileUserId, bootcampId, sectionId, title, url, durationMin }) {
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
      duration_min: durationMin ? Number(durationMin) : null,
    })
    .select()
    .single();

  if (lessonErr) throw lessonErr;
  return lesson;
}

async function makeBootcampPublic({ profileUserId, bootcampId, capacity }) {
  const { data, error } = await supabase.rpc('make_bootcamp_public', {
    p_bootcamp_id: bootcampId,
    p_teacher_profile_user_id: profileUserId,
    p_capacity: capacity,
  });
  if (error) throw error;
  return Array.isArray(data) ? data[0] : data;
}

async function listAvailablePublicBootcamps(studentId) {
  const { data: bootcamps, error } = await supabase
    .from('bootcamps')
    .select(`
      id, title, description, max_students, enrolled_count, thumbnail_url, created_at,
      total_price, tags, requirements, what_you_learn,
      teacher_id,
      teacher_profiles:teacher_id ( profile_id, profiles:profile_id ( full_name ) ),
      bootcamp_sections ( id, title, sort_order,
        bootcamp_lessons ( id, title, video_url, sort_order, duration_min )
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
        price: b.total_price || 0,
        tags: b.tags || [],
        requirements: b.requirements || null,
        whatYouLearn: b.what_you_learn || null,
        sections,
        videosCount,
        createdAt: b.created_at,
      };
    })
    .filter((b) => !b.alreadyEnrolled);
}

async function enrollStudentInBootcamp({ studentId, bootcampId }) {
  // Prefer RPC (handles capacity + enrolled_count atomically)
  try {
    const { data, error } = await supabase.rpc('enroll_in_bootcamp_v2', {
      p_bootcamp_id: bootcampId,
      p_student_id: studentId,
    });
    if (!error) {
      const result = Array.isArray(data) ? data[0] : data;
      if (result?.success) return result;
      if (result?.message) throw new Error(result.message);
    }
  } catch (rpcErr) {
    console.warn('RPC enroll_in_bootcamp_v2 failed, using direct insert:', rpcErr.message);
  }

  // Fallback: direct enrollment row
  const { data: existing, error: existingErr } = await supabase
    .from('bootcamp_enrollments')
    .select('id')
    .eq('bootcamp_id', bootcampId)
    .eq('student_id', studentId)
    .maybeSingle();

  if (existingErr) throw existingErr;
  if (existing) return { success: true, message: 'Already enrolled' };

  const { error: enrollErr } = await supabase.from('bootcamp_enrollments').insert({
    bootcamp_id: bootcampId,
    student_id: studentId,
    status: 'active',
    progress_pct: 0,
  });
  if (enrollErr) throw enrollErr;

  const { data: bootcamp, error: bcErr } = await supabase
    .from('bootcamps')
    .select('enrolled_count')
    .eq('id', bootcampId)
    .single();
  if (bcErr) throw bcErr;

  const { error: countErr } = await supabase
    .from('bootcamps')
    .update({ enrolled_count: (bootcamp?.enrolled_count || 0) + 1 })
    .eq('id', bootcampId);
  if (countErr) throw countErr;

  return { success: true };
}

module.exports = {
  createPublicBootcamp,
  addSectionToBootcamp,
  addVideoToSection,
  makeBootcampPublic,
  listAvailablePublicBootcamps,
  enrollStudentInBootcamp,
};
