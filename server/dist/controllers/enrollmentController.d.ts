import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
export declare const getMyEnrollments: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getEnrollmentDetails: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const enrollInCourse: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const unenrollFromCourse: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=enrollmentController.d.ts.map