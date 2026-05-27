import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();
export const generateToken = (userId, email, role) => {
    const secret = process.env.JWT_SECRET || 'default-secret-key-change-in-production';
    const expiresIn = '7d';
    // @ts-ignore - TypeScript has issues with jwt.sign overloads
    return jwt.sign({ userId, email, role }, secret, { expiresIn });
};
export const verifyToken = (token) => {
    try {
        const secret = process.env.JWT_SECRET;
        return jwt.verify(token, secret);
    }
    catch (error) {
        return null;
    }
};
export const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authorization token required' });
    }
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    req.userEmail = decoded.email;
    next();
};
export const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.userRole || !roles.includes(req.userRole)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        next();
    };
};
//# sourceMappingURL=auth.js.map