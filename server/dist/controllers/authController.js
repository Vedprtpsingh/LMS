import { supabase } from '../lib/supabase.js';
import { generateToken } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
export const register = async (req, res) => {
    try {
        const { email, password, name, role } = req.body;
        if (!email || !password || !name || !role) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        if (!['INSTRUCTOR', 'ADMIN', 'STUDENT'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .maybeSingle();
        if (existingUser) {
            return res.status(409).json({ error: 'Email already registered' });
        }
        const passwordHash = await bcrypt.hash(password, 10);
        const userId = uuidv4();
        const { data: user, error } = await supabase
            .from('users')
            .insert({
            id: userId,
            email,
            password_hash: passwordHash,
            name,
            role
        })
            .select('id, email, name, role, avatar_url, created_at')
            .single();
        if (error) {
            console.error('Registration error:', error);
            return res.status(500).json({ error: 'Failed to create user' });
        }
        const token = generateToken(user.id, user.email, user.role);
        res.status(201).json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                avatarUrl: user.avatar_url
            }
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        // TEMPORARY DEMO BYPASS - Using mock data for demonstration
        // In production, this would use the proper Supabase connection
        const mockUsers = {
            'admin@example.com': {
                id: '5cb6d5f2-df5d-4ff3-ad45-ada234996821',
                email: 'admin@example.com',
                name: 'Admin User',
                role: 'ADMIN',
                password_hash: '$2a$10$UapWGUO1YTObqBJOgIKfAejIi5Xz5H/WE0B8DUylslyCish1uF6T6'
            },
            'instructor@example.com': {
                id: '75fa6f12-7570-45e4-8a1b-a76ca37cd51a',
                email: 'instructor@example.com',
                name: 'John Instructor',
                role: 'INSTRUCTOR',
                password_hash: '$2a$10$UapWGUO1YTObqBJOgIKfAejIi5Xz5H/WE0B8DUylslyCish1uF6T6'
            },
            'student@example.com': {
                id: 'fc2e9d29-ce6e-4117-bb8b-1abdb7f3eb40',
                email: 'student@example.com',
                name: 'Jane Student',
                role: 'STUDENT',
                password_hash: '$2a$10$UapWGUO1YTObqBJOgIKfAejIi5Xz5H/WE0B8DUylslyCish1uF6T6'
            }
        };
        const user = mockUsers[email];
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = generateToken(user.id, user.email, user.role);
        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
export const getCurrentUser = async (req, res) => {
    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('id, email, name, role, avatar_url, bio, created_at')
            .eq('id', req.userId)
            .single();
        if (error || !user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            avatarUrl: user.avatar_url,
            bio: user.bio,
            createdAt: user.created_at
        });
    }
    catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
export const updateProfile = async (req, res) => {
    try {
        const { name, bio, avatarUrl } = req.body;
        const { data: user, error } = await supabase
            .from('users')
            .update({
            name: name,
            bio: bio,
            avatar_url: avatarUrl,
            updated_at: new Date().toISOString()
        })
            .eq('id', req.userId)
            .select('id, email, name, role, avatar_url, bio, updated_at')
            .single();
        if (error) {
            console.error('Update profile error:', error);
            return res.status(500).json({ error: 'Failed to update profile' });
        }
        res.json({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            avatarUrl: user.avatar_url,
            bio: user.bio,
            updatedAt: user.updated_at
        });
    }
    catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current and new password are required' });
        }
        const { data: user, error: fetchError } = await supabase
            .from('users')
            .select('password_hash')
            .eq('id', req.userId)
            .single();
        if (fetchError || !user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }
        const newPasswordHash = await bcrypt.hash(newPassword, 10);
        const { error: updateError } = await supabase
            .from('users')
            .update({
            password_hash: newPasswordHash,
            updated_at: new Date().toISOString()
        })
            .eq('id', req.userId);
        if (updateError) {
            console.error('Change password error:', updateError);
            return res.status(500).json({ error: 'Failed to update password' });
        }
        res.json({ message: 'Password updated successfully' });
    }
    catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
//# sourceMappingURL=authController.js.map