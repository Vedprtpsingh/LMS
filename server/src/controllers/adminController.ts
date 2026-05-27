import { Response } from 'express';
import { supabase } from '../lib/supabase.js';
import { AuthRequest } from '../middleware/auth.js';

export const getPendingCourses = async (req: AuthRequest, res: Response) => {
  try {
    const { page = '1', limit = '20' } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 20);
    const offset = (pageNum - 1) * limitNum;

    const { data: courses, error, count } = await supabase
      .from('courses')
      .select(`
        id,
        title,
        description,
        thumbnail_url,
        level,
        created_at,
        updated_at,
        instructor:users!courses_instructor_id_fkey (id, name, email, avatar_url),
        category:categories (id, name, slug),
        modules (count)
      `, { count: 'exact' })
      .eq('status', 'PENDING')
      .order('updated_at', { ascending: false })
      .range(offset, offset + limitNum - 1);

    if (error) {
      console.error('Get pending courses error:', error);
      return res.status(500).json({ error: 'Failed to fetch pending courses' });
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
        createdAt: course.created_at,
        updatedAt: course.updated_at,
        instructor: course.instructor,
        category: course.category,
        moduleCount: course.modules?.[0]?.count || 0
      }))
    });
  } catch (error) {
    console.error('Get pending courses error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const approveCourse = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { data: course, error: fetchError } = await supabase
      .from('courses')
      .select('id, status')
      .eq('id', id)
      .single();

    if (fetchError || !course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (course.status !== 'PENDING') {
      return res.status(400).json({ error: 'Only PENDING courses can be approved' });
    }

    // Create review record
    await supabase
      .from('course_reviews')
      .insert({
        course_id: id,
        admin_id: req.userId,
        decision: 'APPROVED',
        comment: 'Course approved',
        reviewed_at: new Date().toISOString()
      });

    // Update course status
    const { data: updatedCourse, error } = await supabase
      .from('courses')
      .update({
        status: 'APPROVED',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Approve course error:', error);
      return res.status(500).json({ error: 'Failed to approve course' });
    }

    res.json({
      id: updatedCourse.id,
      status: updatedCourse.status,
      message: 'Course approved successfully'
    });
  } catch (error) {
    console.error('Approve course error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const rejectCourse = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;

    if (!comment) {
      return res.status(400).json({ error: 'Rejection comment is required' });
    }

    const { data: course, error: fetchError } = await supabase
      .from('courses')
      .select('id, status')
      .eq('id', id)
      .single();

    if (fetchError || !course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (course.status !== 'PENDING') {
      return res.status(400).json({ error: 'Only PENDING courses can be rejected' });
    }

    // Create review record
    await supabase
      .from('course_reviews')
      .insert({
        course_id: id,
        admin_id: req.userId,
        decision: 'REJECTED',
        comment,
        reviewed_at: new Date().toISOString()
      });

    // Update course status
    const { data: updatedCourse, error } = await supabase
      .from('courses')
      .update({
        status: 'REJECTED',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Reject course error:', error);
      return res.status(500).json({ error: 'Failed to reject course' });
    }

    res.json({
      id: updatedCourse.id,
      status: updatedCourse.status,
      message: 'Course rejected'
    });
  } catch (error) {
    console.error('Reject course error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const publishCourse = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { data: course, error: fetchError } = await supabase
      .from('courses')
      .select('id, status')
      .eq('id', id)
      .single();

    if (fetchError || !course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (course.status !== 'APPROVED') {
      return res.status(400).json({ error: 'Only APPROVED courses can be published' });
    }

    const { data: updatedCourse, error } = await supabase
      .from('courses')
      .update({
        status: 'PUBLISHED',
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Publish course error:', error);
      return res.status(500).json({ error: 'Failed to publish course' });
    }

    res.json({
      id: updatedCourse.id,
      status: updatedCourse.status,
      message: 'Course published successfully'
    });
  } catch (error) {
    console.error('Publish course error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const archiveCourse = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { data: course, error: fetchError } = await supabase
      .from('courses')
      .select('id, status')
      .eq('id', id)
      .single();

    if (fetchError || !course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (course.status !== 'PUBLISHED') {
      return res.status(400).json({ error: 'Only PUBLISHED courses can be archived' });
    }

    const { data: updatedCourse, error } = await supabase
      .from('courses')
      .update({
        status: 'ARCHIVED',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Archive course error:', error);
      return res.status(500).json({ error: 'Failed to archive course' });
    }

    res.json({
      id: updatedCourse.id,
      status: updatedCourse.status,
      message: 'Course archived successfully'
    });
  } catch (error) {
    console.error('Archive course error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const restoreCourse = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { data: course, error: fetchError } = await supabase
      .from('courses')
      .select('id, status')
      .eq('id', id)
      .single();

    if (fetchError || !course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (course.status !== 'ARCHIVED') {
      return res.status(400).json({ error: 'Only ARCHIVED courses can be restored' });
    }

    const { data: updatedCourse, error } = await supabase
      .from('courses')
      .update({
        status: 'PUBLISHED',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Restore course error:', error);
      return res.status(500).json({ error: 'Failed to restore course' });
    }

    res.json({
      id: updatedCourse.id,
      status: updatedCourse.status,
      message: 'Course restored successfully'
    });
  } catch (error) {
    console.error('Restore course error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    // Get total counts
    const { count: totalStudents } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'STUDENT');

    const { count: totalInstructors } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'INSTRUCTOR');

    const { count: totalCourses } = await supabase
      .from('courses')
      .select('id', { count: 'exact', head: true });

    const { count: publishedCourses } = await supabase
      .from('courses')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'PUBLISHED');

    const { count: pendingCourses } = await supabase
      .from('courses')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'PENDING');

    const { count: totalEnrollments } = await supabase
      .from('enrollments')
      .select('id', { count: 'exact', head: true });

    // Get recent enrollments (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: recentEnrollments } = await supabase
      .from('enrollments')
      .select('enrolled_at')
      .gte('enrolled_at', sevenDaysAgo.toISOString())
      .order('enrolled_at', { ascending: false });

    // Get top courses by enrollment
    const { data: topCourses } = await supabase
      .from('courses')
      .select('id, title, enrollment_count, avg_rating')
      .eq('status', 'PUBLISHED')
      .order('enrollment_count', { ascending: false })
      .limit(5);

    // Calculate average completion rate
    const { data: enrollmentsData } = await supabase
      .from('enrollments')
      .select('progress_percent');

    const avgCompletionRate = enrollmentsData && enrollmentsData.length > 0
      ? enrollmentsData.reduce((sum: number, e) => sum + (e.progress_percent || 0), 0) / enrollmentsData.length
      : 0;

    res.json({
      overview: {
        totalStudents: totalStudents || 0,
        totalInstructors: totalInstructors || 0,
        totalCourses: totalCourses || 0,
        publishedCourses: publishedCourses || 0,
        pendingCourses: pendingCourses || 0,
        totalEnrollments: totalEnrollments || 0,
        avgCompletionRate: Math.round(avgCompletionRate * 100) / 100
      },
      recentEnrollments: recentEnrollments || [],
      topCourses: topCourses || []
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { role, page = '1', limit = '20' } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 20);
    const offset = (pageNum - 1) * limitNum;

    let query = supabase
      .from('users')
      .select('id, email, name, role, avatar_url, created_at', { count: 'exact' });

    if (role) {
      query = query.eq('role', role as string);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limitNum - 1);

    const { data: users, error, count } = await query;

    if (error) {
      console.error('Get all users error:', error);
      return res.status(500).json({ error: 'Failed to fetch users' });
    }

    res.json({
      total: count,
      page: pageNum,
      limit: limitNum,
      users: users?.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatar_url,
        createdAt: user.created_at
      }))
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
