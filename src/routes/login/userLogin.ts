import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import db from '../../connection';

const router = Router();

router.post('/login', async (req: Request, res: Response) => {
    const { usernameOrEmail, password } = req.body;

    if (!usernameOrEmail?.trim() || !password?.trim()) {
        res.status(400).json({
            success: false,
            message: 'Username/email and password are required',
            field: !usernameOrEmail ? 'usernameOrEmail' : 'password'
        });
                return;
    }

    try {
        console.log('Attempting login for:', usernameOrEmail);
        
        // Find user with active status
        const [users]: any = await db.query(
            `SELECT 
                a.user_id,
                a.username,
                a.email,
                a.password,
                a.role_id,
                r.role_name,
                a.is_active
            FROM adminusers a
            LEFT JOIN rolemaster r ON a.role_id = r.role_id
            WHERE (a.username = ? OR a.email = ?)`,
            [usernameOrEmail.trim(), usernameOrEmail.trim()]
        );

        console.log('Query results:', users);

        // User not found
        if (users.length === 0) {
            console.log('User not found');
            res.status(404).json({
                success: false,
                message: 'Account not found'
            });
                return;
        }

        const user = users[0];
        console.log('Found user:', user.user_id);

        // Check if account is active
        if (!user.is_active) {
            console.log('Account inactive');
            res.status(403).json({
                success: false,
                message: 'Account is inactive. Please contact administrator.'
            });
                return;
        }

        // Verify password
        console.log('Comparing passwords...');
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            console.log('Password mismatch');
            res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
                return;
        }

        // Prepare response data
        const userData = {
            id: user.id,
            user_id : user.user_id,
            username: user.username,
            email: user.email,
            role_id: user.role_id,
            role_name: user.role_name
        };

        console.log('Login successful for:', user.username);
        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: userData,
            token: 'generate_jwt_token_here'
        });
                return;

    } catch (error: any) {
        console.error('Detailed login error:', error);
        console.error('Error stack:', error.stack);
        
        // Check for specific database errors
        if (error.code) {
            console.error('Database error code:', error.code);
            
            if (error.code === 'ECONNREFUSED') {
                res.status(503).json({
                    success: false,
                    message: 'Database service unavailable',
                    details: error.message
                });
                return;
                
            }
            
            if (error.code === 'ER_NO_SUCH_TABLE') {
                res.status(500).json({
                    success: false,
                    message: 'Database table missing',
                    details: error.message,

                });
                return;
            }
        }

        res.status(500).json({
            success: false,
            message: 'Internal server error during login',
            details: error.message, // always send this during debug
            stack: error.stack 
        });
        return;
    }
});

export default router;