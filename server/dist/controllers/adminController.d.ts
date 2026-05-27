import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
export declare const getPendingCourses: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const approveCourse: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const rejectCourse: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const publishCourse: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const archiveCourse: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const restoreCourse: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getAnalytics: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getAllUsers: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=adminController.d.ts.map