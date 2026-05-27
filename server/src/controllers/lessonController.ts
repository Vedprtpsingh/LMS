import { Response } from 'express';
import { supabase } from '../lib/supabase.js';
import { AuthRequest } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

export const getLessons = async (req: AuthRequest, res: Response) => {
  try {
    const { moduleId } = req.params;

    const { data: lessons, error } = await supabase
      .from('lessons')
      .select(`
        id,
        title,
        type,
        resource_url,
        content,
        duration_seconds,
        sort_order,
        created_at
      `)
      .eq('module_id', moduleId)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Get lessons error:', error);
      return res.status(500).json({ error: 'Failed to fetch lessons' });
    }

    res.json(lessons);
  } catch (error) {
    console.error('Get lessons error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getLessonById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { data: lesson, error } = await supabase
      .from('lessons')
      .select(`
        id,
        title,
        type,
        resource_url,
        content,
        duration_seconds,
        sort_order,
        created_at,
        module_id,
        modules!inner (
          id,
          course_id,
          courses!inner (
            id,
            instructor_id,
            status
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error || !lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    // Check access
    const module = lesson.modules as any;
    const course = module.courses as any;

    const canAccess =
      course.status === 'PUBLISHED' ||
      course.instructor_id === req.userId ||
      req.userRole === 'ADMIN' ||
      await checkEnrollment(req.userId!, course.id);

    if (!canAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(lesson);
  } catch (error) {
    console.error('Get lesson error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

async function checkEnrollment(userId: string, courseId: string): Promise<boolean> {
  const { data } = await supabase
    .from('enrollments')
    .select('id')
    .eq('student_id', userId)
    .eq('course_id', courseId)
    .maybeSingle();
  return !!data;
}

export const createLesson = async (req: AuthRequest, res: Response) => {
  try {
    const { moduleId } = req.params;
    const { title, type, resourceUrl, content, durationSeconds } = req.body;

    if (!title || !type) {
      return res.status(400).json({ error: 'Title and type are required' });
    }

    if (!['VIDEO', 'PDF', 'QUIZ', 'TEXT'].includes(type)) {
      return res.status(400).json({ error: 'Invalid lesson type' });
    }

    // Check module and course ownership
    const { data: module, error: moduleError } = await supabase
      .from('modules')
      .select(`
        id,
        course_id,
        courses!inner (instructor_id, status)
      `)
      .eq('id', moduleId)
      .single();

    if (moduleError || !module) {
      return res.status(404).json({ error: 'Module not found' });
    }

    const course = module.courses as any;
    if (course.instructor_id !== req.userId && req.userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!['DRAFT', 'REJECTED'].includes(course.status)) {
      return res.status(400).json({ error: 'Lessons can only be added to DRAFT or REJECTED courses' });
    }

    // Get current max sort_order
    const { data: maxOrderLesson } = await supabase
      .from('lessons')
      .select('sort_order')
      .eq('module_id', moduleId)
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle();

    const sortOrder = maxOrderLesson ? (maxOrderLesson.sort_order || 0) + 1 : 0;

    const { data: lesson, error } = await supabase
      .from('lessons')
      .insert({
        id: uuidv4(),
        module_id: moduleId,
        title,
        type,
        resource_url: resourceUrl,
        content: content,
        duration_seconds: durationSeconds,
        sort_order: sortOrder
      })
      .select()
      .single();

    if (error) {
      console.error('Create lesson error:', error);
      return res.status(500).json({ error: 'Failed to create lesson' });
    }

    res.status(201).json(lesson);
  } catch (error) {
    console.error('Create lesson error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateLesson = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, type, resourceUrl, content, durationSeconds, sortOrder } = req.body;

    const { data: lesson, error: fetchError } = await supabase
      .from('lessons')
      .select(`
        id,
        module_id,
        modules!inner (
          course_id,
          courses!inner (instructor_id, status)
        )
      `)
      .eq('id', id)
      .single();

    if (fetchError || !lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    const module = lesson.modules as any;
    const course = module.courses as any;

    if (course.instructor_id !== req.userId && req.userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!['DRAFT', 'REJECTED'].includes(course.status)) {
      return res.status(400).json({ error: 'Lessons can only be updated in DRAFT or REJECTED courses' });
    }

    const { data: updatedLesson, error } = await supabase
      .from('lessons')
      .update({
        title: title,
        type: type,
        resource_url: resourceUrl,
        content: content,
        duration_seconds: durationSeconds,
        sort_order: sortOrder
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update lesson error:', error);
      return res.status(500).json({ error: 'Failed to update lesson' });
    }

    res.json(updatedLesson);
  } catch (error) {
    console.error('Update lesson error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteLesson = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { data: lesson, error: fetchError } = await supabase
      .from('lessons')
      .select(`
        id,
        module_id,
        modules!inner (
          course_id,
          courses!inner (instructor_id, status)
        )
      `)
      .eq('id', id)
      .single();

    if (fetchError || !lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    const module = lesson.modules as any;
    const course = module.courses as any;

    if (course.instructor_id !== req.userId && req.userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!['DRAFT', 'REJECTED'].includes(course.status)) {
      return res.status(400).json({ error: 'Lessons can only be deleted from DRAFT or REJECTED courses' });
    }

    const { error } = await supabase
      .from('lessons')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete lesson error:', error);
      return res.status(500).json({ error: 'Failed to delete lesson' });
    }

    res.json({ message: 'Lesson deleted successfully' });
  } catch (error) {
    console.error('Delete lesson error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const reorderLessons = async (req: AuthRequest, res: Response) => {
  try {
    const { moduleId } = req.params;
    const { lessonIds } = req.body;

    if (!lessonIds || !Array.isArray(lessonIds)) {
      return res.status(400).json({ error: 'lessonIds array is required' });
    }

    // Check module and course ownership
    const { data: module, error: moduleError } = await supabase
      .from('modules')
      .select(`
        id,
        course_id,
        courses!inner (instructor_id, status)
      `)
      .eq('id', moduleId)
      .single();

    if (moduleError || !module) {
      return res.status(404).json({ error: 'Module not found' });
    }

    const course = module.courses as any;
    if (course.instructor_id !== req.userId && req.userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!['DRAFT', 'REJECTED'].includes(course.status)) {
      return res.status(400).json({ error: 'Lessons can only be reordered in DRAFT or REJECTED courses' });
    }

    // Update sort_order for each lesson
    for (let i = 0; i < lessonIds.length; i++) {
      await supabase
        .from('lessons')
        .update({ sort_order: i })
        .eq('id', lessonIds[i]);
    }

    res.json({ message: 'Lessons reordered successfully' });
  } catch (error) {
    console.error('Reorder lessons error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
