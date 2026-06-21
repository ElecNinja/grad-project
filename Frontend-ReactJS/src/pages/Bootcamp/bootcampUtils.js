export const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=240&fit=crop";

const WORK_BOOTCAMPS_STORAGE_KEY = "work_uploadedRows";
const WORK_BOOTCAMPS_STORAGE_PREFIX = `${WORK_BOOTCAMPS_STORAGE_KEY}_`;

export function extractYouTubeId(url) {
  if (!url) return "";
  const match = String(url).match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/i
  );
  return match ? match[1] : "";
}

function getYouTubeThumbnail(url) {
  const id = extractYouTubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : null;
}

function mapLesson(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    videoUrl: row.video_url,
    playbackId: row.playback_id,
    thumbnail: row.thumbnail_url,
    lessonType: row.lesson_type,
    durationMin: row.duration_min,
    sortOrder: row.sort_order,
    isFreePreview: row.is_free_preview,
    isPublished: row.is_published !== false,
    sectionId: row.section_id,
  };
}

function extractTeacherName(bc) {
  const tp = Array.isArray(bc.teacher_profiles) ? bc.teacher_profiles[0] : bc.teacher_profiles;
  const prof = Array.isArray(tp?.profiles) ? tp.profiles[0] : tp?.profiles;
  return prof?.full_name ?? null;
}

function toArray(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function pickBootcampFields(bc) {
  if (!bc) return {};
  return {
    category: bc.category ?? bc.topic ?? null,
    level: bc.level ?? null,
    expert: bc.expert_name ?? bc.expert ?? extractTeacherName(bc) ?? null,
    price: bc.price ?? bc.total_price ?? null,
    currency: bc.currency ?? "GBP",
    rating: bc.rating != null ? Number(bc.rating) : null,
    reviews: bc.review_count ?? bc.reviews ?? null,
    badge: bc.badge ?? null,
    image: bc.image_url ?? bc.thumbnail_url ?? bc.image ?? null,
    tags: Array.isArray(bc.tags) ? bc.tags : [],
    requirements: bc.requirements ?? null,
    whatYouLearn: bc.what_you_learn ?? bc.whatYouLearn ?? null,
    capacity: bc.max_students ?? null,
    enrolledCount: bc.enrolled_count ?? 0,
    createdAt: bc.created_at ?? null,
  };
}

function resolveBootcamp(row) {
  const bc = row.bootcamps;
  const groupId = bc?.id ?? row.bootcamp_id ?? row.id;

  if (bc?.id) {
    const extra = pickBootcampFields(bc);
    return {
      groupId,
      id: bc.id,
      title: bc.title || row.title || "Untitled bootcamp",
      description: bc.description ?? row.description,
      ...extra,
    };
  }

  return {
    groupId,
    id: groupId,
    title: row.title || "Untitled lesson",
    description: row.description,
    category: null,
    level: null,
    expert: null,
    price: null,
    currency: "GBP",
    rating: null,
    reviews: null,
    badge: null,
    image: row.thumbnail_url || null,
    tags: [],
    requirements: null,
    whatYouLearn: null,
    capacity: null,
    enrolledCount: 0,
    createdAt: null,
  };
}

/** Build one catalog entry per bootcamp (or bootcamp_id) from lessons. */
export function lessonsToBootcamps(lessons) {
  const map = new Map();

  lessons.forEach((row) => {
    const meta = resolveBootcamp(row);
    const lesson = mapLesson(row);

    if (!map.has(meta.groupId)) {
      map.set(meta.groupId, {
        id: meta.id,
        title: meta.title,
        description: meta.description,
        category: meta.category,
        level: meta.level,
        expert: meta.expert,
        price: meta.price,
        currency: meta.currency,
        rating: meta.rating,
        reviews: meta.reviews,
        badge: meta.badge,
        image: meta.image || row.thumbnail_url || null,
        tags: meta.tags || [],
        requirements: meta.requirements || null,
        whatYouLearn: meta.whatYouLearn || null,
        capacity: meta.capacity,
        enrolledCount: meta.enrolledCount,
        createdAt: meta.createdAt,
        hasUnpublishedLessons: false,
        lessons: [],
        sectionsMap: new Map(),
      });
    }

    const entry = map.get(meta.groupId);
    entry.lessons.push(lesson);

    if (!lesson.isPublished) {
      entry.hasUnpublishedLessons = true;
    }

    if (!entry.image && row.thumbnail_url) {
      entry.image = row.thumbnail_url;
    }

    if (!row.bootcamps && row.title && entry.title === row.title) {
      entry.title = row.title;
    }

    const sec = row.bootcamp_sections;
    const section = Array.isArray(sec) ? sec[0] : sec;
    if (section?.id) {
      if (!entry.sectionsMap.has(section.id)) {
        entry.sectionsMap.set(section.id, {
          id: section.id,
          title: section.title || "Section",
          sortOrder: section.sort_order ?? 0,
          lessons: [],
        });
      }
      entry.sectionsMap.get(section.id).lessons.push(lesson);
    }
  });

  return Array.from(map.values()).map((b) => ({
    ...b,
    sections: [...b.sectionsMap.values()].sort((a, z) => a.sortOrder - z.sortOrder),
    sectionsMap: undefined,
  }));
}

function mapLocalBootcampLesson(video, index, sectionId) {
  return {
    id: video.id || `${sectionId}_${index}`,
    title: video.title?.trim() || `Video ${index + 1}`,
    description: "",
    videoUrl: video.url || "",
    playbackId: null,
    thumbnail: getYouTubeThumbnail(video.url),
    lessonType: "video",
    durationMin: video.durationMin ? Number(video.durationMin) : null,
    sortOrder: index,
    isFreePreview: false,
    isPublished: true,
    sectionId,
  };
}

function mapLocalBootcamp(row, index) {
  const rawSections = Array.isArray(row.sections) && row.sections.length > 0
    ? row.sections
    : [{ id: `${row.id || `local_bootcamp_${index}`}_section_0`, title: row.title || "Course content", lessons: row.videos || [] }];

  const sections = rawSections.map((section, sectionIndex) => {
    const sectionId = section.id || `${row.id || `local_bootcamp_${index}`}_section_${sectionIndex}`;
    const lessonSource = Array.isArray(section.lessons) && section.lessons.length > 0
      ? section.lessons
      : section.videos || [];
    const lessons = lessonSource.map((video, videoIndex) =>
      mapLocalBootcampLesson(video, videoIndex, sectionId)
    );

    return {
      id: sectionId,
      title: section.title || `Section ${sectionIndex + 1}`,
      sortOrder: section.sortOrder ?? sectionIndex,
      lessons,
    };
  });

  const flatLessons = sections.flatMap((section) => section.lessons);
  const fallbackImage = row.thumbnailUrl || row.thumbnail || getYouTubeThumbnail(flatLessons[0]?.videoUrl);

  return {
    id: row.id || `local_bootcamp_${index}`,
    title: row.title || "Untitled bootcamp",
    description: row.description || "",
    category: row.category || null,
    level: row.level || null,
    expert: row.teacherName || row.expert || "Your Teacher",
    price: row.price != null && row.price !== "" ? Number(row.price) : null,
    currency: row.currency || "GBP",
    rating: row.rating != null ? Number(row.rating) : null,
    reviews: row.reviews != null ? Number(row.reviews) : null,
    badge: row.badge || null,
    image: fallbackImage || null,
    tags: toArray(row.tags),
    requirements: row.requirements || null,
    whatYouLearn: row.whatYouLearn || null,
    capacity: row.capacity != null && row.capacity !== "" ? Number(row.capacity) : null,
    enrolledCount: row.enrolledCount != null ? Number(row.enrolledCount) : 0,
    createdAt: row.createdAt || null,
    hasUnpublishedLessons: false,
    lessons: flatLessons,
    sections,
    isLocalDraft: true,
  };
}

function safeParseRows(raw) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getScopedKeys(userId) {
  const keys = [];
  if (userId) keys.push(`${WORK_BOOTCAMPS_STORAGE_KEY}_${userId}`);
  keys.push(WORK_BOOTCAMPS_STORAGE_KEY); // legacy/global fallback
  return keys;
}

function readRowsFromKeys(keys) {
  if (typeof window === "undefined") return [];
  return keys.flatMap((key) => safeParseRows(window.localStorage.getItem(key)));
}

function readAnyPrefixedRows() {
  if (typeof window === "undefined") return [];
  const rows = [];
  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i);
    if (key && key.startsWith(WORK_BOOTCAMPS_STORAGE_PREFIX)) {
      rows.push(...safeParseRows(window.localStorage.getItem(key)));
    }
  }
  return rows;
}

function dedupeRows(rows) {
  const seen = new Set();
  return rows.filter((row) => {
    const key = String(row?.id || `${row?.title || "bootcamp"}_${row?.createdAt || ""}`);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function getLocalWorkBootcamps(userId) {
  if (typeof window === "undefined") return [];

  try {
    let rows = readRowsFromKeys(getScopedKeys(userId));

    // fall back to scanning all per-user keys if we don't know the user id
    // (or the current user has no rows under their own key yet)
    if (!rows.length) {
      rows = readAnyPrefixedRows();
    }

    return dedupeRows(rows)
      .filter((row) => row?.type === "bootcamp")
      .map((row, index) => mapLocalBootcamp(row, index));
  } catch (error) {
    console.warn("Could not read local bootcamp drafts:", error);
    return [];
  }
}

function mergeBootcampItem(primary = {}, fallback = {}) {
  return {
    ...fallback,
    ...primary,
    title: primary.title || fallback.title || "Untitled bootcamp",
    description: primary.description || fallback.description || "",
    category: primary.category || fallback.category || null,
    level: primary.level || fallback.level || null,
    expert: primary.expert || fallback.expert || null,
    price: primary.price ?? fallback.price ?? null,
    currency: primary.currency || fallback.currency || "GBP",
    rating: primary.rating ?? fallback.rating ?? null,
    reviews: primary.reviews ?? fallback.reviews ?? null,
    badge: primary.badge || fallback.badge || null,
    image: primary.image || fallback.image || null,
    tags: (primary.tags && primary.tags.length ? primary.tags : fallback.tags) || [],
    requirements: primary.requirements || fallback.requirements || null,
    whatYouLearn: primary.whatYouLearn || fallback.whatYouLearn || null,
    capacity: primary.capacity ?? fallback.capacity ?? null,
    enrolledCount: primary.enrolledCount ?? fallback.enrolledCount ?? 0,
    createdAt: primary.createdAt || fallback.createdAt || null,
    lessons: (primary.lessons && primary.lessons.length ? primary.lessons : fallback.lessons) || [],
    sections: (primary.sections && primary.sections.length ? primary.sections : fallback.sections) || [],
    hasUnpublishedLessons: primary.hasUnpublishedLessons || fallback.hasUnpublishedLessons || false,
    isLocalDraft: primary.isLocalDraft || fallback.isLocalDraft || false,
  };
}

export function mergeBootcampCatalogs(primaryBootcamps = [], fallbackBootcamps = []) {
  const byKey = new Map();

  fallbackBootcamps.forEach((bootcamp) => {
    const key = String(bootcamp.id || bootcamp.title).toLowerCase();
    byKey.set(key, bootcamp);
  });

  primaryBootcamps.forEach((bootcamp) => {
    const key = String(bootcamp.id || bootcamp.title).toLowerCase();
    const existing = byKey.get(key);
    byKey.set(key, existing ? mergeBootcampItem(bootcamp, existing) : bootcamp);
  });

  return Array.from(byKey.values()).sort((a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bTime - aTime;
  });
}

export function formatPrice(price, currency = "GBP") {
  if (price == null || Number.isNaN(Number(price))) return null;
  const symbol = currency === "GBP" ? "£" : currency === "EUR" ? "€" : "$";
  return `${symbol}${Number(price).toFixed(2)}`;
}

export function formatDuration(totalMinutes) {
  if (!totalMinutes) return "—";
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h > 0) return `${h}h ${m > 0 ? `${m}m` : ""}`.trim();
  return `${m}min`;
}

export function groupBootcamps(bootcamps, categoriesList = []) {
  const hasCategories = bootcamps.some((b) => b.category);
  if (!hasCategories) {
    return [{ name: "Bootcamps", courses: bootcamps }];
  }

  const getLabel = (slug) => {
    const found = categoriesList.find(c => c.value === slug);
    return found ? found.label : slug;
  };

  const map = new Map();
  bootcamps.forEach((course) => {
    const slug = course.category || "General";
    const name = getLabel(slug);
    if (!map.has(name)) map.set(name, []);
    map.get(name).push(course);
  });
  return Array.from(map.entries()).map(([name, courses]) => ({ name, courses }));
}

export function filterBootcamps(bootcamps, { search, topic, level }) {
  const q = search.trim().toLowerCase();
  return bootcamps.filter((course) => {
    const matchSearch =
      !q ||
      course.title?.toLowerCase().includes(q) ||
      course.description?.toLowerCase().includes(q) ||
      course.expert?.toLowerCase().includes(q) ||
      course.lessons?.some((l) => l.title?.toLowerCase().includes(q));

    const matchTopic = topic === "all" || !course.category || course.category === topic;
    const matchLevel = level === "all" || !course.level || course.level === level;
    return matchSearch && matchTopic && matchLevel;
  });
}

export function getTopicOptions(bootcamps) {
  return [...new Set(bootcamps.map((b) => b.category).filter(Boolean))].sort();
}

export function getLevelOptions(bootcamps) {
  return [...new Set(bootcamps.map((b) => b.level).filter(Boolean))];
}

export function bootcampToCourseState(bootcamp) {
  const sectionList =
    bootcamp.sections?.length > 0
      ? bootcamp.sections
      : [{ title: "Course content", sortOrder: 0, lessons: bootcamp.lessons }];

  const sections = sectionList.map((sec) => {
    const sorted = [...sec.lessons].sort((a, z) => a.sortOrder - z.sortOrder);
    const totalMin = sorted.reduce((sum, l) => sum + (l.durationMin || 0), 0);
    return {
      title: sec.title,
      lectures: sorted.length,
      duration: formatDuration(totalMin),
      items: sorted.map((l) => l.title),
      durations: sorted.map((l) =>
        l.durationMin ? formatDuration(l.durationMin) : "—"
      ),
    };
  });

  const totalMin = bootcamp.lessons.reduce((sum, l) => sum + (l.durationMin || 0), 0);
  const price = formatPrice(bootcamp.price, bootcamp.currency);

  return {
    id: bootcamp.id,
    title: bootcamp.title,
    subtitle: bootcamp.description,
    expert: bootcamp.expert || undefined,
    price: price || undefined,
    rating: bootcamp.rating ?? undefined,
    reviews: bootcamp.reviews ?? undefined,
    image: bootcamp.image || PLACEHOLDER_IMAGE,
    badge: bootcamp.badge,
    relatedTopics: bootcamp.tags || [],
    requirements: bootcamp.requirements || null,
    whatYouLearn: bootcamp.whatYouLearn || null,
    sections,
    totalSections: sections.length,
    totalLectures: bootcamp.lessons.length,
    totalDuration: formatDuration(totalMin),
    lessons: bootcamp.lessons,
    capacity: bootcamp.capacity ?? null,
    enrolledCount: bootcamp.enrolledCount ?? 0,
  };
}
