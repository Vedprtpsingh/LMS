import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
export declare const getProgress: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateProgress: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const markLessonComplete: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=progressController.d.ts.map