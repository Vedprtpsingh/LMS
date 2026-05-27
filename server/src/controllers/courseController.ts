import { Response } from 'express';
import { supabase } from '../lib/supabase.js';
import { AuthRequest } from '../middleware/auth.js';

export const getCourses = async (req: AuthRequest, res: Response) => {
  try {
    const {
      search,
      category,
      level,
      status,
      instructorId,
      sort = 'latest',
      page = '1',
      limit = '20'
    } = req.query;

    let query = supabase
      .from('courses')
      .select(`
        id,
        title,
        description,
        thumbnail_url,
        level,
        price,
        language,
        avg_rating,
        enrollment_count,
        status,
        created_at,
        updated_at,
        published_at,
        instructor:users!courses_instructor_id_fkey (id, name, avatar_url),
        category:categories (id, name, slug)
      `, { count: 'exact' });

    // Role-based filtering
    if (req.userRole === 'INSTRUCTOR') {
      query = query.eq('instructor_id', req.userId);
    } else if (req.userRole === 'STUDENT') {
      query = query.eq('status', 'PUBLISHED');
    } else if (req.userRole === 'ADMIN') {
      // Admin can see all courses
      if (status && status !== 'ALL') {
        query = query.eq('status', status as string);
      }
    }

    // Filters
    if (instructorId) {
      query = query.eq('instructor_id', instructorId as string);
    }

    if (category) {
      query = query.eq('category_id', category as string);
    }

    if (level) {
      query = query.eq('level', level as string);
    }

    if (status && req.userRole === 'ADMIN') {
      // Already handled above
    } else if (status && status !== 'ALL') {
      query = query.eq('status', status as string);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Sorting
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 20);
    const offset = (pageNum - 1) * limitNum;

    switch (sort) {
      case 'popular':
        query = query.order('enrollment_count', { ascending: false });
        break;
      case 'rating':
        query = query.order('avg_rating', { ascending: false });
        break;
      case 'latest':
      default:
        query = query.order('created_at', { ascending: false });
        break;
    }

    query = query.range(offset, offset + limitNum - 1);

    const { data: courses, error, count } = await query;

    if (error) {
      console.error('Get courses error:', error);
      return res.status(500).json({ error: 'Failed to fetch courses' });
    }

    res.json({
      total: count,
      page: pageNum,
      limit: limitNum,
      courses: courses?.map(course => ({
        id: course.id,
        title: course.title,
        description: course.description,
        thumbnailUrl: course.thumbnail_url,
        level: course.level,
        price: course.price,
        language: course.language,
        avgRating: course.avg_rating,
        enrollmentCount: course.enrollment_count,
        status: course.status,
        createdAt: course.created_at,
        updatedAt: course.updated_at,
        publishedAt: course.published_at,
        instructor: course.instructor,
        category: course.category
      }))
    });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getCourseById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { data: course, error } = await supabase
      .from('courses')
      .select(`
        id,
        title,
        description,
        thumbnail_url,
        level,
        price,
        language,
        avg_rating,
        enrollment_count,
        status,
        created_at,
        updated_at,
        published_at,
        instructor:users!courses_instructor_id_fkey (id, name, avatar_url, bio),
        category:categories (id, name, slug),
        modules (
          id,
          title,
          sort_order,
          is_free_preview,
          lessons (
            id,
            title,
            type,
            duration_seconds,
            sort_order
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error || !course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Check access
    const instructorData = Array.isArray(course.instructor) ? course.instructor[0] : course.instructor;
    const canAccess =
      course.status === 'PUBLISHED' ||
      (instructorData && instructorData.id === req.userId) ||
      req.userRole === 'ADMIN';

    if (!canAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Sort modules and lessons
    course.modules?.sort((a, b) => a.sort_order - b.sort_order);
    course.modules?.forEach(module => {
      module.lessons?.sort((a, b) => a.sort_order - b.sort_order);
    });

    res.json({
      id: course.id,
      title: course.title,
      description: course.description,
      thumbnailUrl: course.thumbnail_url,
      level: course.level,
      price: course.price,
      language: course.language,
      avgRating: course.avg_rating,
      enrollmentCount: course.enrollment_count,
      status: course.status,
      createdAt: course.created_at,
      updatedAt: course.updated_at,
      publishedAt: course.published_at,
      instructor: course.instructor,
      category: course.category,
      modules: course.modules
    });
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createCourse = async (req: AuthRequest, res: Response) => {
  try {
    const {
      title,
      description,
      categoryId,
      level,
      language,
      price,
      thumbnailUrl
    } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const { data: course, error } = await supabase
      .from('courses')
      .insert({
        instructor_id: req.userId,
        title,
        description,
        category_id: categoryId,
        level: level || 'BEGINNER',
        language: language || 'English',
        price: price || 0,
        thumbnail_url: thumbnailUrl,
        status: 'DRAFT'
      })
      .select(`
        id,
        title,
        description,
        thumbnail_url,
        level,
        price,
        language,
        avg_rating,
        enrollment_count,
        status,
        created_at,
        updated_at,
        instructor:users!courses_instructor_id_fkey (id, name, avatar_url),
        category:categories (id, name, slug)
      `)
      .single();

    if (error) {
      console.error('Create course error:', error);
      return res.status(500).json({ error: 'Failed to create course' });
    }

    res.status(201).json({
      id: course.id,
      title: course.title,
      description: course.description,
      thumbnailUrl: course.thumbnail_url,
      level: course.level,
      price: course.price,
      language: course.language,
      avgRating: course.avg_rating,
      enrollmentCount: course.enrollment_count,
      status: course.status,
      createdAt: course.created_at,
      updatedAt: course.updated_at,
      instructor: course.instructor,
      category: course.category
    });
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateCourse = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      categoryId,
      level,
      language,
      price,
      thumbnailUrl
    } = req.body;

    // Check if course exists and user owns it
    const { data: existingCourse, error: fetchError } = await supabase
      .from('courses')
      .select('id, instructor_id, status')
      .eq('id', id)
      .single();

    if (fetchError || !existingCourse) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Check ownership (unless admin)
    if (existingCourse.instructor_id !== req.userId && req.userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Non-admin can only edit DRAFT or REJECTED courses
    if (req.userRole !== 'ADMIN' && !['DRAFT', 'REJECTED'].includes(existingCourse.status)) {
      return res.status(400).json({ error: 'Course cannot be edited in current status' });
    }

    const { data: course, error } = await supabase
      .from('courses')
      .update({
        title: title,
        description: description,
        category_id: categoryId,
        level: level,
        language: language,
        price: price,
        thumbnail_url: thumbnailUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        id,
        title,
        description,
        thumbnail_url,
        level,
        price,
        language,
        avg_rating,
        enrollment_count,
        status,
        created_at,
        updated_at,
        instructor:users!courses_instructor_id_fkey (id, name, avatar_url),
        category:categories (id, name, slug)
      `)
      .single();

    if (error) {
      console.error('Update course error:', error);
      return res.status(500).json({ error: 'Failed to update course' });
    }

    res.json({
      id: course.id,
      title: course.title,
      description: course.description,
      thumbnailUrl: course.thumbnail_url,
      level: course.level,
      price: course.price,
      language: course.language,
      avgRating: course.avg_rating,
      enrollmentCount: course.enrollment_count,
      status: course.status,
      createdAt: course.created_at,
      updatedAt: course.updated_at,
      instructor: course.instructor,
      category: course.category
    });
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteCourse = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { data: course, error: fetchError } = await supabase
      .from('courses')
      .select('id, instructor_id, status')
      .eq('id', id)
      .single();

    if (fetchError || !course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Check ownership (unless admin)
    if (course.instructor_id !== req.userId && req.userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Cannot delete published courses
    if (course.status === 'PUBLISHED' && req.userRole !== 'ADMIN') {
      return res.status(400).json({ error: 'Published courses cannot be deleted' });
    }

    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete course error:', error);
      return res.status(500).json({ error: 'Failed to delete course' });
    }

    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const submitCourse = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { data: course, error: fetchError } = await supabase
      .from('courses')
      .select('id, instructor_id, status')
      .eq('id', id)
      .single();

    if (fetchError || !course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (course.instructor_id !== req.userId) {
      return res.status(403).json({ error: 'Only the instructor can submit this course' });
    }

    if (!['DRAFT', 'REJECTED'].includes(course.status)) {
      return res.status(400).json({ error: 'Only DRAFT or REJECTED courses can be submitted' });
    }

    const { data: updatedCourse, error } = await supabase
      .from('courses')
      .update({
        status: 'PENDING',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Submit course error:', error);
      return res.status(500).json({ error: 'Failed to submit course' });
    }

    res.json({
      id: updatedCourse.id,
      status: updatedCourse.status,
      message: 'Course submitted for review'
    });
  } catch (error) {
    console.error('Submit course error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getCourseReview = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { data: review, error } = await supabase
      .from('course_reviews')
      .select(`
        id,
        decision,
        comment,
        reviewed_at,
        admin:users (id, name, email)
      `)
      .eq('course_id', id)
      .eq('decision', 'REJECTED')
      .order('reviewed_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Get course review error:', error);
      return res.status(500).json({ error: 'Failed to fetch review' });
    }

    if (!review) {
      return res.json(null);
    }

    res.json({
      id: review.id,
      decision: review.decision,
      comment: review.comment,
      reviewedAt: review.reviewed_at,
      admin: review.admin
    });
  } catch (error) {
    console.error('Get course review error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
