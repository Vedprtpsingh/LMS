import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
export declare const getLessons: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getLessonById: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createLesson: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateLesson: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteLesson: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const reorderLessons: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=lessonController.d.ts.map