const supabase = require("../config/supabase");

const ALLOWED_RESOURCE_TYPES = ["note", "pdf", "dataset", "summary", "other"];

// =========================================================
// UPLOAD RESOURCE  — POST /api/community/upload
// PROTECTED: requires requireAuth (isAuthenticated) middleware
// =========================================================
const uploadResource = async (req, res) => {
  try {
    const uploaderId = req.user?.id;
    if (!uploaderId) {
      return res.status(401).json({ error: "Unauthorized." });
    }

    const { title, description, resourceType, subjectId } = req.body;
    const file = req.file;

    // ── Validate required fields ──
    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Title is required." });
    }

    if (!file) {
      return res.status(400).json({ error: "A file is required." });
    }

    // ── Parse tags (comma-separated string or JSON array) ──
    let tags = [];
    if (req.body.tags) {
      try {
        tags = typeof req.body.tags === "string"
          ? req.body.tags.split(",").map((t) => t.trim()).filter(Boolean)
          : Array.isArray(req.body.tags)
            ? req.body.tags.map((t) => t.trim()).filter(Boolean)
            : [];
      } catch {
        tags = [];
      }
    }

    // ── Validate resource type ──
    const safeResourceType = ALLOWED_RESOURCE_TYPES.includes(resourceType)
      ? resourceType
      : "other";

    // ── Upload file to Supabase Storage ──
    const fileExt = file.originalname?.split(".").pop() || "bin";
    const fileName = `${uploaderId}_${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

    const { error: storageError } = await supabase.storage
      .from("community-resources")
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (storageError) {
      console.error("Storage error:", storageError);
      return res.status(500).json({ error: "Failed to upload file to storage." });
    }

    const { data: urlData } = supabase.storage
      .from("community-resources")
      .getPublicUrl(fileName);

    const fileUrl = urlData.publicUrl;

    // ── Insert row into community_resources ──
    const payload = {
      uploader_id: uploaderId,  // always from req.user — never trust body
      title: title.trim(),
      description: description?.trim() || null,
      resource_type: safeResourceType,
      file_url: fileUrl,
      file_size_bytes: file.size || null,
      is_public: true,
      tags,
      subject_id: subjectId || null,
    };

    const { data: resource, error: dbError } = await supabase
      .from("community_resources")
      .insert([payload])
      .select()
      .single();

    if (dbError) {
      console.error("DB error:", dbError);
      return res.status(500).json({ error: "Failed to save resource to database." });
    }

    return res.status(201).json({ resource });
  } catch (err) {
    console.error("uploadResource error:", err);
    return res.status(500).json({ error: err.message || "Server error." });
  }
};

// =========================================================
// LIST RESOURCES  — GET /api/community
// PUBLIC: no auth required — do NOT add isAuthenticated here
// =========================================================
const listResources = async (req, res) => {
  try {
    const page = Math.max(0, parseInt(req.query.page) || 0);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 12));
    const offset = page * limit;

    const { subjectId, resourceType, search } = req.query;

    // ── Build query ──
    let query = supabase
      .from("community_resources")
      .select(
        `
        id,
        title,
        description,
        resource_type,
        file_url,
        file_size_bytes,
        download_count,
        tags,
        created_at,
        uploader_id,
        subject_id,
        profiles!community_resources_uploader_id_fkey ( id, full_name ),
        subjects!community_resources_subject_id_fkey ( id, name )
        `,
        { count: "exact" }
      )
      .eq("is_public", true)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (subjectId) {
      query = query.eq("subject_id", subjectId);
    }

    if (resourceType && ALLOWED_RESOURCE_TYPES.includes(resourceType)) {
      query = query.eq("resource_type", resourceType);
    }

    if (search && search.trim()) {
      const cleanSearch = search.trim();
      const s = `%${cleanSearch}%`;

      // 1. Pre-fetch profile IDs of uploaders whose names match the search term
      let uploaderIds = [];
      try {
        const { data: profiles, error: profileErr } = await supabase
          .from("profiles")
          .select("id")
          .ilike("full_name", s);

        if (!profileErr && profiles && profiles.length > 0) {
          uploaderIds = profiles.map((p) => p.id);
        }
      } catch (err) {
        console.error("Error pre-fetching profile IDs for search:", err);
      }

      // 2. Pre-fetch subject IDs whose names match the search term
      let subjectIds = [];
      try {
        const { data: subjects, error: subjectErr } = await supabase
          .from("subjects")
          .select("id")
          .ilike("name", s);

        if (!subjectErr && subjects && subjects.length > 0) {
          subjectIds = subjects.map((sub) => sub.id);
        }
      } catch (err) {
        console.error("Error pre-fetching subject IDs for search:", err);
      }

      // 3. Build the OR filters
      const orFilters = [
        `title.ilike.${s}`,
        `description.ilike.${s}`,
        `file_url.ilike.${s}`,
        `tags.cs.{"${cleanSearch}"}`
      ];

      // Add lowercase version of tag to support lowercase tag matches
      const lowerSearch = cleanSearch.toLowerCase();
      if (lowerSearch !== cleanSearch) {
        orFilters.push(`tags.cs.{"${lowerSearch}"}`);
      }

      // Add uploader IDs filter if found
      if (uploaderIds.length > 0) {
        orFilters.push(`uploader_id.in.(${uploaderIds.join(",")})`);
      }

      // Add subject IDs filter if found
      if (subjectIds.length > 0) {
        orFilters.push(`subject_id.in.(${subjectIds.join(",")})`);
      }

      query = query.or(orFilters.join(","));
    }

    const { data: resources, error, count } = await query;

    if (error) {
      console.error("listResources DB error:", error);
      return res.status(500).json({ error: "Failed to fetch resources." });
    }

    const mapped = (resources || []).map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description || "",
      resourceType: r.resource_type,
      fileUrl: r.file_url,
      fileSizeBytes: r.file_size_bytes,
      downloadCount: r.download_count || 0,
      tags: r.tags || [],
      createdAt: r.created_at,
      uploaderName: r.profiles?.full_name || "Anonymous",
      uploaderId: r.uploader_id,
      subjectId: r.subject_id,
      subjectName: r.subjects?.name || null,
    }));

    const total = count || 0;
    const pages = Math.ceil(total / limit);

    return res.status(200).json({ resources: mapped, total, page, pages });
  } catch (err) {
    console.error("listResources error:", err);
    return res.status(500).json({ error: err.message || "Server error." });
  }
};

// =========================================================
// GET RESOURCE BY ID  — GET /api/community/:id
// PUBLIC: no auth required
// =========================================================
const getResourceById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: "Resource ID is required." });

    const { data: resource, error } = await supabase
      .from("community_resources")
      .select(
        `
        id,
        title,
        description,
        resource_type,
        file_url,
        file_size_bytes,
        download_count,
        tags,
        created_at,
        uploader_id,
        subject_id,
        profiles!community_resources_uploader_id_fkey ( id, full_name ),
        subjects!community_resources_subject_id_fkey ( id, name )
        `
      )
      .eq("id", id)
      .eq("is_public", true)
      .is("deleted_at", null)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return res.status(404).json({ error: "Resource not found." });
      }
      console.error("getResourceById error:", error);
      return res.status(500).json({ error: "Failed to fetch resource." });
    }

    return res.status(200).json({
      resource: {
        id: resource.id,
        title: resource.title,
        description: resource.description || "",
        resourceType: resource.resource_type,
        fileUrl: resource.file_url,
        fileSizeBytes: resource.file_size_bytes,
        downloadCount: resource.download_count || 0,
        tags: resource.tags || [],
        createdAt: resource.created_at,
        uploaderName: resource.profiles?.full_name || "Anonymous",
        uploaderId: resource.uploader_id,
        subjectId: resource.subject_id,
        subjectName: resource.subjects?.name || null,
      },
    });
  } catch (err) {
    console.error("getResourceById error:", err);
    return res.status(500).json({ error: err.message || "Server error." });
  }
};

// =========================================================
// DOWNLOAD RESOURCE  — GET /api/community/:id/download
// PUBLIC: no auth required — anonymous visitors MUST be able to use this
// Increments download_count, then redirects to the public file URL
// =========================================================
const downloadResource = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: "Resource ID is required." });

    // ── Fetch the resource (just the URL + count) ──
    const { data: resource, error } = await supabase
      .from("community_resources")
      .select("id, file_url, download_count")
      .eq("id", id)
      .eq("is_public", true)
      .is("deleted_at", null)
      .single();

    if (error || !resource) {
      return res.status(404).json({ error: "Resource not found." });
    }

    // ── Increment download_count (fire-and-forget, don't block the redirect) ──
    supabase
      .from("community_resources")
      .update({ download_count: (resource.download_count || 0) + 1 })
      .eq("id", id)
      .then(({ error: updateErr }) => {
        if (updateErr) console.error("download_count update failed:", updateErr);
      });

    // ── Return the file URL so the frontend can trigger the download ──
    return res.status(200).json({ fileUrl: resource.file_url });
  } catch (err) {
    console.error("downloadResource error:", err);
    return res.status(500).json({ error: err.message || "Server error." });
  }
};

// =========================================================
// LIST SUBJECTS (public — used by frontend filters & upload form)
// =========================================================
const listSubjectsPublic = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("subjects")
      .select("id, name, slug")
      .order("name", { ascending: true });

    if (error) throw error;
    return res.status(200).json({ subjects: data || [] });
  } catch (err) {
    console.error("listSubjectsPublic error:", err);
    return res.status(500).json({ error: "Failed to fetch subjects." });
  }
};

module.exports = {
  uploadResource,
  listResources,
  getResourceById,
  downloadResource,
  listSubjectsPublic,
};
