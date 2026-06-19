import { supabase } from "../../config/supabaseClient";

const LESSON_COLUMNS = `
  id,
  bootcamp_id,
  section_id,
  title,
  description,
  video_url,
  playback_id,
  thumbnail_url,
  lesson_type,
  duration_min,
  sort_order,
  is_free_preview,
  is_published
`;

function normalizeBootcampRelation(row) {
  const bc = row.bootcamps;
  if (!bc) return row;
  const bootcamp = Array.isArray(bc) ? bc[0] : bc;
  return { ...row, bootcamps: bootcamp || null };
}

async function fetchBootcampsByIds(ids) {
  if (!ids.length) return new Map();

  const { data, error } = await supabase
    .from("bootcamps")
    .select(`
      *,
      bootcamp_sections (
        id,
        title,
        sort_order
      ),
      teacher_profiles:teacher_id (
        profile_id,
        profiles:profile_id ( full_name )
      )
    `)
    .in("id", ids);

  if (error) {
    console.warn("Bootcamp catalog", error);
    return new Map();
  }

  return new Map((data || []).map((b) => [b.id, b]));
}

/** Load all lessons, then attach parent bootcamp rows (works even when embed join fails). */
export async function fetchBootcampLessons() {
  const { data: lessons, error: lessonsError } = await supabase
    .from("bootcamp_lessons")
    .select(LESSON_COLUMNS)
    .order("sort_order", { ascending: true });

  if (lessonsError) throw lessonsError;
  if (!lessons?.length) return [];

  const bootcampIds = [...new Set(lessons.map((l) => l.bootcamp_id).filter(Boolean))];
  const bootcampMap = await fetchBootcampsByIds(bootcampIds);

  return lessons.map((lesson) =>
    normalizeBootcampRelation({
      ...lesson,
      bootcamps: lesson.bootcamp_id ? bootcampMap.get(lesson.bootcamp_id) ?? null : null,
      bootcamp_sections: lesson.section_id
        ? bootcampMap.get(lesson.bootcamp_id)?.bootcamp_sections?.find(
            (s) => s.id === lesson.section_id
          ) ?? null
        : null,
    })
  );
}