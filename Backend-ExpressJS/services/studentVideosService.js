const supabase = require('../config/supabase');

function extractYouTubeId(url) {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

function getThumbnail(manualThumbnailUrl, firstLessonVideoUrl) {
  if (manualThumbnailUrl) return manualThumbnailUrl;
  const videoId = extractYouTubeId(firstLessonVideoUrl);
  return videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null;
}

/**
 * Courses the student is enrolled in, with lesson progress.
 */
async function getStudentCourses(studentId) {
  const { data: progressRows, error: progressErr } = await supabase
    .from('course_progress')
    .select('course_id')
    .eq('student_id', studentId);

  if (progressErr) throw progressErr;

  const courseIds = [...new Set((progressRows || []).map(r => r.course_id))];
  if (courseIds.length === 0) return [];

  const { data: courses, error: coursesErr } = await supabase
    .from('courses')
    .select(`
      id,
      title,
      description,
      thumbnail_url,
      level,
      total_lessons,
      total_duration_min,
      teacher_id,
      teacher_profiles:teacher_id (
        profile_id,
        profiles:profile_id ( full_name )
      ),
      course_lessons (
        id, title, video_url, duration_min, sort_order
      )
    `)
    .in('id', courseIds)
    .is('deleted_at', null);

  if (coursesErr) throw coursesErr;

  const { data: progressDetail, error: detailErr } = await supabase
    .from('course_progress')
    .select('course_id, lesson_id, completed, watch_pct')
    .eq('student_id', studentId)
    .in('course_id', courseIds);

  if (detailErr) throw detailErr;

  return courses.map((course) => {
    const lessons = (course.course_lessons || []).sort((a, b) => a.sort_order - b.sort_order);
    const progressForCourse = progressDetail.filter(p => p.course_id === course.id);
    const completedCount = progressForCourse.filter(p => p.completed).length;
    const progressPct = lessons.length
      ? Math.round((completedCount / lessons.length) * 100)
      : 0;

    const currentLesson = lessons.find((l) => {
      const p = progressForCourse.find(pr => pr.lesson_id === l.id);
      return !p || !p.completed;
    }) || lessons[lessons.length - 1];

    return {
      id: course.id,
      type: 'COURSE',
      title: course.title,
      description: course.description,
      thumbnail: getThumbnail(course.thumbnail_url, lessons[0]?.video_url),
      expert: course.teacher_profiles?.profiles?.full_name || 'Unknown',
      videos: lessons.length ? `${completedCount}/${lessons.length}` : null,
      progress: progressPct,
      currentLesson: currentLesson
        ? `${currentLesson.title}`
        : null,
      videoUrl: currentLesson?.video_url || null,
      syllabus: lessons.map((l) => {
        const p = progressForCourse.find(pr => pr.lesson_id === l.id);
        return {
          id: l.id,
          title: l.title,
          duration: l.duration_min ? `${l.duration_min}:00` : '--:--',
          done: !!p?.completed,
          current: currentLesson?.id === l.id,
        };
      }),
    };
  });
}

/**
 * Bootcamps the student is enrolled in (active/completed), with progress.
 */
async function getStudentBootcamps(studentId) {
  const { data: enrollments, error: enrollErr } = await supabase
    .from('bootcamp_enrollments')
    .select(`
      id,
      bootcamp_id,
      status,
      progress_pct,
      bootcamps:bootcamp_id (
        id,
        title,
        description,
        thumbnail_url,
        teacher_id,
        teacher_profiles:teacher_id (
          profile_id,
          profiles:profile_id ( full_name )
        ),
        bootcamp_sections (
          id, title, sort_order
        ),
        bootcamp_lessons (
          id, title, video_url, duration_min, sort_order, section_id
        )
      )
    `)
    .eq('student_id', studentId)
    .in('status', ['active', 'completed']);

  if (enrollErr) throw enrollErr;
  if (!enrollments || enrollments.length === 0) return [];

  const bootcampIds = enrollments.map(e => e.bootcamp_id);

  const { data: progressDetail, error: progErr } = await supabase
    .from('bootcamp_progress')
    .select('bootcamp_id, lesson_id, completed, watch_pct')
    .eq('student_id', studentId)
    .in('bootcamp_id', bootcampIds);

  if (progErr) throw progErr;

  return enrollments.map((enrollment) => {
    const bootcamp = enrollment.bootcamps;
    const allLessons = (bootcamp.bootcamp_lessons || []).sort((a, b) => a.sort_order - b.sort_order);
    const progressForBootcamp = progressDetail.filter(p => p.bootcamp_id === bootcamp.id);

    const currentLesson = allLessons.find((l) => {
      const p = progressForBootcamp.find(pr => pr.lesson_id === l.id);
      return !p || !p.completed;
    }) || allLessons[allLessons.length - 1];

    const mapLesson = (l) => {
      const p = progressForBootcamp.find(pr => pr.lesson_id === l.id);
      return {
        id: l.id,
        title: l.title,
        url: l.video_url,
        duration: l.duration_min ? `${l.duration_min}:00` : '--:--',
        done: !!p?.completed,
        current: currentLesson?.id === l.id,
      };
    };

    const sectionsSorted = (bootcamp.bootcamp_sections || [])
      .sort((a, b) => a.sort_order - b.sort_order);

    const sections = sectionsSorted.map((sec) => ({
      id: sec.id,
      title: sec.title,
      lessons: allLessons.filter((l) => l.section_id === sec.id).map(mapLesson),
    }));

    const groupedIds = new Set(sections.flatMap((s) => s.lessons.map((l) => l.id)));
    const orphanLessons = allLessons.filter((l) => !groupedIds.has(l.id));
    if (orphanLessons.length > 0) {
      sections.push({
        id: 'ungrouped',
        title: 'Other Videos',
        lessons: orphanLessons.map(mapLesson),
      });
    }

    return {
      id: bootcamp.id,
      type: 'BOOTCAMP',
      title: bootcamp.title,
      description: bootcamp.description,
      thumbnail: getThumbnail(bootcamp.thumbnail_url, allLessons[0]?.video_url),
      expert: bootcamp.teacher_profiles?.profiles?.full_name || 'Unknown',
      progress: enrollment.progress_pct,
      currentLesson: currentLesson ? currentLesson.title : null,
      videoUrl: currentLesson?.video_url || null,
      sections,
      syllabus: allLessons.map(mapLesson),
    };
  });
}

module.exports = { getStudentCourses, getStudentBootcamps };