import { supabase } from '../lib/supabase.js';
import { v4 as uuidv4 } from 'uuid';
export const getProgress = async (req, res) => {
    try {
        const { enrollmentId } = req.params;
        const { data: progress, error } = await supabase
            .from('progress')
            .select(`
        id,
        completed,
        watch_seconds,
        last_accessed,
        lesson_id,
        lessons (
          id,
          title,
          type,
          duration_seconds,
          module_id,
          modules (
            id,
            title,
            course_id
          )
        )
      `)
            .eq('enrollment_id', enrollmentId)
            .order('last_accessed', { ascending: false });
        if (error) {
            console.error('Get progress error:', error);
            return res.status(500).json({ error: 'Failed to fetch progress' });
        }
        res.json(progress);
    }
    catch (error) {
        console.error('Get progress error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
export const updateProgress = async (req, res) => {
    try {
        const { enrollmentId, lessonId } = req.params;
        const { watchSeconds, completed } = req.body;
        // Verify enrollment belongs to user
        const { data: enrollment, error: enrollmentError } = await supabase
            .from('enrollments')
            .select('id, student_id')
            .eq('id', enrollmentId)
            .single();
        if (enrollmentError || !enrollment) {
            return res.status(404).json({ error: 'Enrollment not found' });
        }
        if (enrollment.student_id !== req.userId) {
            return res.status(403).json({ error: 'Access denied' });
        }
        // Upsert progress
        const { data: existingProgress } = await supabase
            .from('progress')
            .select('id, watch_seconds')
            .eq('enrollment_id', enrollmentId)
            .eq('lesson_id', lessonId)
            .maybeSingle();
        let progressData;
        let totalWatchSeconds = existingProgress ? (existingProgress.watch_seconds || 0) + (watchSeconds || 0) : (watchSeconds || 0);
        if (existingProgress) {
            const { data, error } = await supabase
                .from('progress')
                .update({
                watch_seconds: totalWatchSeconds,
                completed: completed !== undefined ? completed : existingProgress.watch_seconds >= 0.9 * (await getLessonDuration(lessonId)),
                last_accessed: new Date().toISOString()
            })
                .eq('id', existingProgress.id)
                .select()
                .single();
            if (error) {
                console.error('Update progress error:', error);
                return res.status(500).json({ error: 'Failed to update progress' });
            }
            progressData = data;
        }
        else {
            const { data, error } = await supabase
                .from('progress')
                .insert({
                id: uuidv4(),
                enrollment_id: enrollmentId,
                lesson_id: lessonId,
                watch_seconds: totalWatchSeconds,
                completed: completed || false,
                last_accessed: new Date().toISOString()
            })
                .select()
                .single();
            if (error) {
                console.error('Create progress error:', error);
                return res.status(500).json({ error: 'Failed to create progress' });
            }
            progressData = data;
        }
        // Update enrollment progress_percent
        await updateEnrollmentProgress(enrollmentId);
        res.json(progressData);
    }
    catch (error) {
        console.error('Update progress error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
async function getLessonDuration(lessonId) {
    const { data } = await supabase
        .from('lessons')
        .select('duration_seconds')
        .eq('id', lessonId)
        .single();
    return data?.duration_seconds || 0;
}
async function updateEnrollmentProgress(enrollmentId) {
    // Get all lessons for the enrollment's course
    const { data: enrollment } = await supabase
        .from('enrollments')
        .select('course_id')
        .eq('id', enrollmentId)
        .single();
    if (!enrollment)
        return;
    const { data: lessons } = await supabase
        .from('lessons')
        .select('id')
        .in('module_id', await supabase
        .from('modules')
        .select('id')
        .eq('course_id', enrollment.course_id)
        .then(({ data }) => data?.map(m => m.id) || []));
    if (!lessons || lessons.length === 0)
        return;
    // Get completed lessons
    const { data: completed } = await supabase
        .from('progress')
        .select('lesson_id')
        .eq('enrollment_id', enrollmentId)
        .eq('completed', true);
    const completedCount = completed?.length || 0;
    const totalLessons = lessons.length;
    const progressPercent = (completedCount / totalLessons) * 100;
    // Update enrollment
    await supabase
        .from('enrollments')
        .update({
        progress_percent: Math.round(progressPercent * 100) / 100,
        completed_at: progressPercent >= 100 ? new Date().toISOString() : null
    })
        .eq('id', enrollmentId);
}
export const markLessonComplete = async (req, res) => {
    try {
        const { enrollmentId, lessonId } = req.params;
        // Verify enrollment belongs to user
        const { data: enrollment } = await supabase
            .from('enrollments')
            .select('id, student_id')
            .eq('id', enrollmentId)
            .single();
        if (!enrollment || enrollment.student_id !== req.userId) {
            return res.status(403).json({ error: 'Access denied' });
        }
        // Upsert progress with completed = true
        const { data: existingProgress } = await supabase
            .from('progress')
            .select('id, watch_seconds')
            .eq('enrollment_id', enrollmentId)
            .eq('lesson_id', lessonId)
            .maybeSingle();
        if (existingProgress) {
            const { data, error } = await supabase
                .from('progress')
                .update({
                completed: true,
                last_accessed: new Date().toISOString()
            })
                .eq('id', existingProgress.id)
                .select()
                .single();
            if (error) {
                console.error('Mark complete error:', error);
                return res.status(500).json({ error: 'Failed to mark lesson complete' });
            }
            await updateEnrollmentProgress(enrollmentId);
            res.json(data);
        }
        else {
            const { data, error } = await supabase
                .from('progress')
                .insert({
                id: uuidv4(),
                enrollment_id: enrollmentId,
                lesson_id: lessonId,
                watch_seconds: 0,
                completed: true,
                last_accessed: new Date().toISOString()
            })
                .select()
                .single();
            if (error) {
                console.error('Mark complete error:', error);
                return res.status(500).json({ error: 'Failed to mark lesson complete' });
            }
            await updateEnrollmentProgress(enrollmentId);
            res.json(data);
        }
    }
    catch (error) {
        console.error('Mark complete error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
//# sourceMappingURL=progressController.js.map