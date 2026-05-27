import { Request, Response, NextFunction } from 'express';
export interface AuthRequest extends Request {
    userId?: string;
    userRole?: string;
    userEmail?: string;
}
export declare const generateToken: (userId: string, email: string, role: string) => string;
export declare const verifyToken: (token: string) => {
    userId: string;
    email: string;
    role: string;
} | null;
export declare const authenticate: (req: AuthRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
export declare const requireRole: (...roles: string[]) => (req: AuthRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
//# sourceMappingURL=auth.d.ts.map