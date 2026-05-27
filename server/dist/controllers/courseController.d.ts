import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
export declare const getCourses: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getCourseById: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createCourse: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateCourse: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteCourse: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const submitCourse: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getCourseReview: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=courseController.d.ts.map