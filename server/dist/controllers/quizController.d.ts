import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
export declare const getQuiz: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createQuiz: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateQuiz: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createQuestion: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateQuestion: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteQuestion: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const submitQuizAttempt: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=quizController.d.ts.map