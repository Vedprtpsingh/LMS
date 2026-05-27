import { Response } from 'express';
import { supabase } from '../lib/supabase.js';
import { AuthRequest } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

export const getModules = async (req: AuthRequest, res: Response) => {
  try {
    const { courseId } = req.params;

    const { data: modules, error } = await supabase
      .from('modules')
      .select(`
        id,
        title,
        sort_order,
        is_free_preview,
        created_at,
        lessons (
          id,
          title,
          type,
          duration_seconds,
          sort_order
        )
      `)
      .eq('course_id', courseId)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Get modules error:', error);
      return res.status(500).json({ error: 'Failed to fetch modules' });
    }

    // Sort lessons within each module
    modules?.forEach(module => {
      module.lessons?.sort((a, b) => a.sort_order - b.sort_order);
    });

    res.json(modules);
  } catch (error) {
    console.error('Get modules error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createModule = async (req: AuthRequest, res: Response) => {
  try {
    const { courseId } = req.params;
    const { title, isFreePreview } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    // Check if user owns the course
    const { data: course, error: fetchError } = await supabase
      .from('courses')
      .select('id, instructor_id, status')
      .eq('id', courseId)
      .single();

    if (fetchError || !course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (course.instructor_id !== req.userId && req.userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!['DRAFT', 'REJECTED'].includes(course.status)) {
      return res.status(400).json({ error: 'Modules can only be added to DRAFT or REJECTED courses' });
    }

    // Get current max sort_order
    const { data: maxOrderModule } = await supabase
      .from('modules')
      .select('sort_order')
      .eq('course_id', courseId)
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle();

    const sortOrder = maxOrderModule ? (maxOrderModule.sort_order || 0) + 1 : 0;

    const { data: module, error } = await supabase
      .from('modules')
      .insert({
        id: uuidv4(),
        course_id: courseId,
        title,
        sort_order: sortOrder,
        is_free_preview: isFreePreview || false
      })
      .select()
      .single();

    if (error) {
      console.error('Create module error:', error);
      return res.status(500).json({ error: 'Failed to create module' });
    }

    res.status(201).json(module);
  } catch (error) {
    console.error('Create module error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateModule = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, isFreePreview, sortOrder } = req.body;

    // Get module and check ownership
    const { data: module, error: fetchError } = await supabase
      .from('modules')
      .select(`
        id,
        course_id,
        courses!inner (instructor_id, status)
      `)
      .eq('id', id)
      .single();

    if (fetchError || !module) {
      return res.status(404).json({ error: 'Module not found' });
    }

    const course = module.courses as any;
    if (course.instructor_id !== req.userId && req.userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!['DRAFT', 'REJECTED'].includes(course.status)) {
      return res.status(400).json({ error: 'Modules can only be updated in DRAFT or REJECTED courses' });
    }

    const { data: updatedModule, error } = await supabase
      .from('modules')
      .update({
        title: title,
        is_free_preview: isFreePreview,
        sort_order: sortOrder
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update module error:', error);
      return res.status(500).json({ error: 'Failed to update module' });
    }

    res.json(updatedModule);
  } catch (error) {
    console.error('Update module error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteModule = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { data: module, error: fetchError } = await supabase
      .from('modules')
      .select(`
        id,
        course_id,
        courses!inner (instructor_id, status)
      `)
      .eq('id', id)
      .single();

    if (fetchError || !module) {
      return res.status(404).json({ error: 'Module not found' });
    }

    const course = module.courses as any;
    if (course.instructor_id !== req.userId && req.userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!['DRAFT', 'REJECTED'].includes(course.status)) {
      return res.status(400).json({ error: 'Modules can only be deleted from DRAFT or REJECTED courses' });
    }

    const { error } = await supabase
      .from('modules')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete module error:', error);
      return res.status(500).json({ error: 'Failed to delete module' });
    }

    res.json({ message: 'Module deleted successfully' });
  } catch (error) {
    console.error('Delete module error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const reorderModules = async (req: AuthRequest, res: Response) => {
  try {
    const { courseId } = req.params;
    const { moduleIds } = req.body;

    if (!moduleIds || !Array.isArray(moduleIds)) {
      return res.status(400).json({ error: 'moduleIds array is required' });
    }

    // Check ownership
    const { data: course, error: fetchError } = await supabase
      .from('courses')
      .select('id, instructor_id, status')
      .eq('id', courseId)
      .single();

    if (fetchError || !course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (course.instructor_id !== req.userId && req.userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!['DRAFT', 'REJECTED'].includes(course.status)) {
      return res.status(400).json({ error: 'Modules can only be reordered in DRAFT or REJECTED courses' });
    }

    // Update sort_order for each module
    for (let i = 0; i < moduleIds.length; i++) {
      await supabase
        .from('modules')
        .update({ sort_order: i })
        .eq('id', moduleIds[i]);
    }

    res.json({ message: 'Modules reordered successfully' });
  } catch (error) {
    console.error('Reorder modules error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
