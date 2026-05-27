import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
export declare const getModules: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createModule: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateModule: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteModule: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const reorderModules: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=moduleController.d.ts.map