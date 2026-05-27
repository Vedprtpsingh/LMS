import { Response } from 'express';
import { supabase } from '../lib/supabase.js';
import { AuthRequest } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

export const getMyEnrollments = async (req: AuthRequest, res: Response) => {
  try {
    const { page = '1', limit = '20' } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 20);
    const offset = (pageNum - 1) * limitNum;

    const { data: enrollments, error, count } = await supabase
      .from('enrollments')
      .select(`
        id,
        enrolled_at,
        progress_percent,
        completed_at,
        courses (
          id,
          title,
          description,
          thumbnail_url,
          level,
          language,
          avg_rating,
          enrollment_count,
          instructor:users!courses_instructor_id_fkey (id, name, avatar_url),
          category:categories (id, name)
        )
      `, { count: 'exact' })
      .eq('student_id', req.userId)
      .order('enrolled_at', { ascending: false })
      .range(offset, offset + limitNum - 1);

    if (error) {
      console.error('Get enrollments error:', error);
      return res.status(500).json({ error: 'Failed to fetch enrollments' });
    }

    res.json({
      total: count,
      page: pageNum,
      limit: limitNum,
      enrollments: enrollments?.map(e => ({
        id: e.id,
        enrolledAt: e.enrolled_at,
        progressPercent: e.progress_percent,
        completedAt: e.completed_at,
        course: e.courses
      }))
    });
  } catch (error) {
    console.error('Get enrollments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getEnrollmentDetails = async (req: AuthRequest, res: Response) => {
  try {
    const { courseId } = req.params;

    const { data: enrollment, error } = await supabase
      .from('enrollments')
      .select(`
        id,
        enrolled_at,
        progress_percent,
        completed_at,
        courses (
          id,
          title,
          description,
          thumbnail_url,
          level,
          language,
          avg_rating,
          enrollment_count,
          instructor:users!courses_instructor_id_fkey (id, name, avatar_url),
          category:categories (id, name),
          modules (
            id,
            title,
            sort_order,
            lessons (
              id,
              title,
              type,
              duration_seconds,
              sort_order
            )
          )
        )
      `)
      .eq('student_id', req.userId)
      .eq('course_id', courseId)
      .single();

    if (error || !enrollment) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }

    // Sort modules and lessons
    const course = enrollment.courses as any;
    course.modules?.sort((a: any, b: any) => a.sort_order - b.sort_order);
    course.modules?.forEach((module: any) => {
      module.lessons?.sort((a: any, b: any) => a.sort_order - b.sort_order);
    });

    res.json({
      id: enrollment.id,
      enrolledAt: enrollment.enrolled_at,
      progressPercent: enrollment.progress_percent,
      completedAt: enrollment.completed_at,
      course: course
    });
  } catch (error) {
    console.error('Get enrollment details error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const enrollInCourse = async (req: AuthRequest, res: Response) => {
  try {
    const { courseId } = req.params;

    // Check if course is published
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, status, price')
      .eq('id', courseId)
      .single();

    if (courseError || !course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (course.status !== 'PUBLISHED') {
      return res.status(400).json({ error: 'Course is not available for enrollment' });
    }

    // Check if already enrolled
    const { data: existingEnrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('student_id', req.userId)
      .eq('course_id', courseId)
      .maybeSingle();

    if (existingEnrollment) {
      return res.status(409).json({ error: 'Already enrolled in this course' });
    }

    // Create enrollment
    const { data: enrollment, error } = await supabase
      .from('enrollments')
      .insert({
        id: uuidv4(),
        student_id: req.userId,
        course_id: courseId,
        enrolled_at: new Date().toISOString(),
        progress_percent: 0
      })
      .select()
      .single();

    if (error) {
      console.error('Enroll course error:', error);
      return res.status(500).json({ error: 'Failed to enroll in course' });
    }

    // Update enrollment count on course
    await supabase.rpc('increment_enrollment_count', { course_id: courseId });

    res.status(201).json({
      id: enrollment.id,
      message: 'Successfully enrolled in course'
    });
  } catch (error) {
    console.error('Enroll course error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const unenrollFromCourse = async (req: AuthRequest, res: Response) => {
  try {
    const { courseId } = req.params;

    const { data: enrollment, error: fetchError } = await supabase
      .from('enrollments')
      .select('id')
      .eq('student_id', req.userId)
      .eq('course_id', courseId)
      .maybeSingle();

    if (!enrollment) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }

    const { error } = await supabase
      .from('enrollments')
      .delete()
      .eq('id', enrollment.id);

    if (error) {
      console.error('Unenroll course error:', error);
      return res.status(500).json({ error: 'Failed to unenroll from course' });
    }

    res.json({ message: 'Successfully unenrolled from course' });
  } catch (error) {
    console.error('Unenroll course error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
