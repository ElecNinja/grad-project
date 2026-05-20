export const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=240&fit=crop";

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

function pickBootcampFields(bc) {
  if (!bc) return {};
  return {
    category: bc.category ?? bc.topic ?? null,
    level: bc.level ?? null,
    expert:
      bc.expert_name ??
      bc.expert ??
      bc.profiles?.full_name ??
      bc.profiles?.[0]?.full_name ??
      null,
    price: bc.price ?? null,
    currency: bc.currency ?? "GBP",
    rating: bc.rating != null ? Number(bc.rating) : null,
    reviews: bc.review_count ?? bc.reviews ?? null,
    badge: bc.badge ?? null,
    image: bc.image_url ?? bc.thumbnail_url ?? bc.image ?? null,
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

export function groupBootcamps(bootcamps) {
  const hasCategories = bootcamps.some((b) => b.category);
  if (!hasCategories) {
    return [{ name: "Bootcamps", courses: bootcamps }];
  }

  const map = new Map();
  bootcamps.forEach((course) => {
    const name = course.category || "General";
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
    sections,
    totalSections: sections.length,
    totalLectures: bootcamp.lessons.length,
    totalDuration: formatDuration(totalMin),
    lessons: bootcamp.lessons,
  };
}
