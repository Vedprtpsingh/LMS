import { supabase } from '../lib/supabase.js';
import { v4 as uuidv4 } from 'uuid';
export const getQuiz = async (req, res) => {
    try {
        const { lessonId } = req.params;
        const { data: quiz, error } = await supabase
            .from('quizzes')
            .select(`
        id,
        title,
        passing_score,
        time_limit_mins,
        created_at,
        quiz_questions (
          id,
          question,
          type,
          options,
          correct_answer,
          points,
          sort_order
        )
      `)
            .eq('lesson_id', lessonId)
            .single();
        if (error || !quiz) {
            return res.status(404).json({ error: 'Quiz not found' });
        }
        // Sort questions
        quiz.quiz_questions?.sort((a, b) => a.sort_order - b.sort_order);
        res.json(quiz);
    }
    catch (error) {
        console.error('Get quiz error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
export const createQuiz = async (req, res) => {
    try {
        const { lessonId } = req.params;
        const { title, passingScore, timeLimitMins } = req.body;
        if (!title) {
            return res.status(400).json({ error: 'Title is required' });
        }
        // Check lesson and course ownership
        const { data: lesson, error: lessonError } = await supabase
            .from('lessons')
            .select(`
        id,
        type,
        modules!inner (
          course_id,
          courses!inner (instructor_id, status)
        )
      `)
            .eq('id', lessonId)
            .single();
        if (lessonError || !lesson) {
            return res.status(404).json({ error: 'Lesson not found' });
        }
        if (lesson.type !== 'QUIZ') {
            return res.status(400).json({ error: 'Lesson must be of type QUIZ' });
        }
        const module = lesson.modules;
        const course = module.courses;
        if (course.instructor_id !== req.userId && req.userRole !== 'ADMIN') {
            return res.status(403).json({ error: 'Access denied' });
        }
        if (!['DRAFT', 'REJECTED'].includes(course.status)) {
            return res.status(400).json({ error: 'Quizzes can only be created in DRAFT or REJECTED courses' });
        }
        // Check if quiz already exists for this lesson
        const { data: existingQuiz } = await supabase
            .from('quizzes')
            .select('id')
            .eq('lesson_id', lessonId)
            .maybeSingle();
        if (existingQuiz) {
            return res.status(409).json({ error: 'Quiz already exists for this lesson' });
        }
        const { data: quiz, error } = await supabase
            .from('quizzes')
            .insert({
            id: uuidv4(),
            lesson_id: lessonId,
            title,
            passing_score: passingScore || 70,
            time_limit_mins: timeLimitMins
        })
            .select()
            .single();
        if (error) {
            console.error('Create quiz error:', error);
            return res.status(500).json({ error: 'Failed to create quiz' });
        }
        res.status(201).json(quiz);
    }
    catch (error) {
        console.error('Create quiz error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
export const updateQuiz = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, passingScore, timeLimitMins } = req.body;
        const { data: quiz, error: fetchError } = await supabase
            .from('quizzes')
            .select(`
        id,
        lesson_id,
        lessons!inner (
          modules!inner (
            courses!inner (instructor_id, status)
          )
        )
      `)
            .eq('id', id)
            .single();
        if (fetchError || !quiz) {
            return res.status(404).json({ error: 'Quiz not found' });
        }
        const lesson = quiz.lessons;
        const course = lesson.modules.courses;
        if (course.instructor_id !== req.userId && req.userRole !== 'ADMIN') {
            return res.status(403).json({ error: 'Access denied' });
        }
        if (!['DRAFT', 'REJECTED'].includes(course.status)) {
            return res.status(400).json({ error: 'Quizzes can only be updated in DRAFT or REJECTED courses' });
        }
        const { data: updatedQuiz, error } = await supabase
            .from('quizzes')
            .update({
            title: title,
            passing_score: passingScore,
            time_limit_mins: timeLimitMins
        })
            .eq('id', id)
            .select()
            .single();
        if (error) {
            console.error('Update quiz error:', error);
            return res.status(500).json({ error: 'Failed to update quiz' });
        }
        res.json(updatedQuiz);
    }
    catch (error) {
        console.error('Update quiz error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
export const createQuestion = async (req, res) => {
    try {
        const { quizId } = req.params;
        const { question, type, options, correctAnswer, points } = req.body;
        if (!question || !type || !correctAnswer) {
            return res.status(400).json({ error: 'Question, type, and correct answer are required' });
        }
        if (!['MCQ', 'TRUE_FALSE', 'SHORT'].includes(type)) {
            return res.status(400).json({ error: 'Invalid question type' });
        }
        // Check quiz and course ownership
        const { data: quiz, error: quizError } = await supabase
            .from('quizzes')
            .select(`
        id,
        lessons!inner (
          modules!inner (
            courses!inner (instructor_id, status)
          )
        )
      `)
            .eq('id', quizId)
            .single();
        if (quizError || !quiz) {
            return res.status(404).json({ error: 'Quiz not found' });
        }
        const lesson = quiz.lessons;
        const course = lesson.modules.courses;
        if (course.instructor_id !== req.userId && req.userRole !== 'ADMIN') {
            return res.status(403).json({ error: 'Access denied' });
        }
        if (!['DRAFT', 'REJECTED'].includes(course.status)) {
            return res.status(400).json({ error: 'Questions can only be added to DRAFT or REJECTED courses' });
        }
        // Get current max sort_order
        const { data: maxOrderQuestion } = await supabase
            .from('quiz_questions')
            .select('sort_order')
            .eq('quiz_id', quizId)
            .order('sort_order', { ascending: false })
            .limit(1)
            .maybeSingle();
        const sortOrder = maxOrderQuestion ? (maxOrderQuestion.sort_order || 0) + 1 : 0;
        const { data: questionData, error } = await supabase
            .from('quiz_questions')
            .insert({
            id: uuidv4(),
            quiz_id: quizId,
            question,
            type,
            options: options || [],
            correct_answer: correctAnswer,
            points: points || 1,
            sort_order: sortOrder
        })
            .select()
            .single();
        if (error) {
            console.error('Create question error:', error);
            return res.status(500).json({ error: 'Failed to create question' });
        }
        res.status(201).json(questionData);
    }
    catch (error) {
        console.error('Create question error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
export const updateQuestion = async (req, res) => {
    try {
        const { id } = req.params;
        const { question, type, options, correctAnswer, points, sortOrder } = req.body;
        const { data: questionData, error: fetchError } = await supabase
            .from('quiz_questions')
            .select(`
        id,
        quiz_id,
        quizzes!inner (
          lessons!inner (
            modules!inner (
              courses!inner (instructor_id, status)
            )
          )
        )
      `)
            .eq('id', id)
            .single();
        if (fetchError || !questionData) {
            return res.status(404).json({ error: 'Question not found' });
        }
        const quiz = questionData.quizzes;
        const lesson = quiz.lessons;
        const course = lesson.modules.courses;
        if (course.instructor_id !== req.userId && req.userRole !== 'ADMIN') {
            return res.status(403).json({ error: 'Access denied' });
        }
        if (!['DRAFT', 'REJECTED'].includes(course.status)) {
            return res.status(400).json({ error: 'Questions can only be updated in DRAFT or REJECTED courses' });
        }
        const { data: updatedQuestion, error } = await supabase
            .from('quiz_questions')
            .update({
            question: question,
            type: type,
            options: options,
            correct_answer: correctAnswer,
            points: points,
            sort_order: sortOrder
        })
            .eq('id', id)
            .select()
            .single();
        if (error) {
            console.error('Update question error:', error);
            return res.status(500).json({ error: 'Failed to update question' });
        }
        res.json(updatedQuestion);
    }
    catch (error) {
        console.error('Update question error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
export const deleteQuestion = async (req, res) => {
    try {
        const { id } = req.params;
        const { data: questionData, error: fetchError } = await supabase
            .from('quiz_questions')
            .select(`
        id,
        quiz_id,
        quizzes!inner (
          lessons!inner (
            modules!inner (
              courses!inner (instructor_id, status)
            )
          )
        )
      `)
            .eq('id', id)
            .single();
        if (fetchError || !questionData) {
            return res.status(404).json({ error: 'Question not found' });
        }
        const quiz = questionData.quizzes;
        const lesson = quiz.lessons;
        const course = lesson.modules.courses;
        if (course.instructor_id !== req.userId && req.userRole !== 'ADMIN') {
            return res.status(403).json({ error: 'Access denied' });
        }
        if (!['DRAFT', 'REJECTED'].includes(course.status)) {
            return res.status(400).json({ error: 'Questions can only be deleted from DRAFT or REJECTED courses' });
        }
        const { error } = await supabase
            .from('quiz_questions')
            .delete()
            .eq('id', id);
        if (error) {
            console.error('Delete question error:', error);
            return res.status(500).json({ error: 'Failed to delete question' });
        }
        res.json({ message: 'Question deleted successfully' });
    }
    catch (error) {
        console.error('Delete question error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
export const submitQuizAttempt = async (req, res) => {
    try {
        const { quizId } = req.params;
        const { answers } = req.body;
        if (!answers || !Array.isArray(answers)) {
            return res.status(400).json({ error: 'Answers array is required' });
        }
        // Get quiz and verify student is enrolled
        const { data: quiz, error: quizError } = await supabase
            .from('quizzes')
            .select(`
        id,
        passing_score,
        total_points,
        quiz_questions (
          id,
          correct_answer,
          points
        ),
        lessons!inner (
          module_id,
          modules!inner (
            course_id
          )
        )
      `)
            .eq('id', quizId)
            .single();
        if (quizError || !quiz) {
            return res.status(404).json({ error: 'Quiz not found' });
        }
        // Check enrollment
        const lesson = quiz.lessons;
        const courseId = lesson.modules.course_id;
        const { data: enrollment } = await supabase
            .from('enrollments')
            .select('id')
            .eq('student_id', req.userId)
            .eq('course_id', courseId)
            .maybeSingle();
        if (!enrollment) {
            return res.status(403).json({ error: 'You must be enrolled to submit quiz' });
        }
        // Calculate score
        let totalPoints = 0;
        let earnedPoints = 0;
        quiz.quiz_questions?.forEach((q) => {
            totalPoints += q.points || 1;
            const answer = answers.find((a) => a.questionId === q.id);
            if (answer && answer.answer === q.correct_answer) {
                earnedPoints += q.points || 1;
            }
        });
        const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
        const passed = score >= (quiz.passing_score || 70);
        // Save attempt
        const { data: attempt, error } = await supabase
            .from('quiz_attempts')
            .insert({
            id: uuidv4(),
            student_id: req.userId,
            quiz_id: quizId,
            score,
            passed
        })
            .select()
            .single();
        if (error) {
            console.error('Submit quiz attempt error:', error);
            return res.status(500).json({ error: 'Failed to submit quiz' });
        }
        res.json({
            id: attempt.id,
            score,
            passed,
            totalPoints,
            earnedPoints,
            message: passed ? 'Congratulations! You passed the quiz.' : 'You did not pass. Please try again.'
        });
    }
    catch (error) {
        console.error('Submit quiz attempt error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
//# sourceMappingURL=quizController.js.map