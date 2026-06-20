const supabase = require('../config/supabase');

// POST /api/saved-teachers
async function saveTeacher(req, res) {
  try {
    const { teacherId } = req.body;
    const studentId = req.user.id;

    if (!teacherId) {
      return res.status(400).json({ success: false, message: 'teacherId is required' });
    }

    const { error } = await supabase
      .from('saved_teachers')
      .insert({
        student_id: studentId,
        teacher_id: teacherId
      });

    // If error is due to UNIQUE constraint (already saved), treat as success
    if (error && error.code !== '23505') {
      console.error('saveTeacher error:', error);
      return res.status(500).json({ success: false, message: 'Failed to save teacher' });
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('saveTeacher error:', err);
    res.status(500).json({ success: false, message: 'Failed to save teacher' });
  }
}

// GET /api/saved-teachers
async function getSavedTeachers(req, res) {
  try {
    const studentId = req.user.id;

    const { data, error } = await supabase
      .from('saved_teachers')
      .select(`
        teacher_id,
        profiles!teacher_id (
          full_name,
          avatar_url,
          bio,
          teacher_profiles (
            id,
            headline,
            avg_rating,
            rating_count,
            total_sessions,
            years_experience,
            teacher_subjects (
              proficiency,
              subjects (
                id,
                name,
                slug
              )
            )
          )
        )
      `)
      .eq('student_id', studentId);

    if (error) {
      console.error('getSavedTeachers error:', error);
      return res.status(500).json({ success: false, message: 'Failed to fetch saved teachers' });
    }

    const teachers = (data || []).map(item => {
      const profile = item.profiles || {};
      const tpRaw = profile.teacher_profiles;
      const tp = Array.isArray(tpRaw) ? tpRaw[0] : tpRaw;

      const specialties = tp ? (tp.teacher_subjects || []).map(ts => ({
        id: ts.subjects?.id,
        name: ts.subjects?.name,
        slug: ts.subjects?.slug,
        proficiency: ts.proficiency || 'intermediate'
      })).filter(s => s.id) : [];

      return {
        teacherId: item.teacher_id,
        name: profile.full_name || 'Unknown',
        avatar: profile.avatar_url || null,
        bio: profile.bio || '',
        headline: tp?.headline || '',
        rating: tp?.avg_rating != null ? parseFloat(tp.avg_rating) : 0,
        ratingCount: tp?.rating_count || 0,
        totalSessions: tp?.total_sessions || 0,
        yearsExperience: tp?.years_experience || 0,
        specialties
      };
    });

    res.status(200).json({ teachers });
  } catch (err) {
    console.error('getSavedTeachers error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch saved teachers' });
  }
}

// DELETE /api/saved-teachers/:teacherId
async function deleteSavedTeacher(req, res) {
  try {
    const { teacherId } = req.params;
    const studentId = req.user.id;

    if (!teacherId) {
      return res.status(400).json({ success: false, message: 'teacherId is required' });
    }

    const { error } = await supabase
      .from('saved_teachers')
      .delete()
      .eq('student_id', studentId)
      .eq('teacher_id', teacherId);

    if (error) {
      console.error('deleteSavedTeacher error:', error);
      return res.status(500).json({ success: false, message: 'Failed to unsave teacher' });
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('deleteSavedTeacher error:', err);
    res.status(500).json({ success: false, message: 'Failed to unsave teacher' });
  }
}

module.exports = { saveTeacher, getSavedTeachers, deleteSavedTeacher };
