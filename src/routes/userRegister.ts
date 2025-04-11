import { Router, Request, Response, NextFunction } from 'express';
import db from '../connection';
import bcrypt from 'bcrypt';

const router = Router();
const saltRounds = 10; 
router.post('/userregister', async (req: Request, res: Response, next: NextFunction) => {
  const { 
    first_name, 
    last_name, 
    mobile, 
    email, 
    address, 
    username, 
    password, 
    role_id, 
    dob 
  } = req.body;

  // Validate required fields
  if (!first_name || !last_name || !mobile || !email || !username || !password || !role_id) {
    res.status(400).json({ 
      success: false, 
      message: 'First name, last name, mobile, email, username, password, and role_id are required' 
    });
    return;
  }

  try {
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const [result]: any = await db.query(
      `INSERT INTO adminusers 
       (first_name, last_name, mobile, email, address, username, password, role_id, dob) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
      [first_name, last_name, mobile, email, address, username, hashedPassword, role_id, dob]
    );
    
    res.status(200).json({ 
      success: true, 
      message: 'Admin user created successfully', 
      id: result.insertId 
    });
  } catch (error: unknown) {
    console.error('Error creating admin user:', error);
    
    // Type guard to check if error is an Error object
    if (error instanceof Error) {
      // Type guard for MySQL error (you might need to adjust this based on your DB library)
      const mysqlError = error as { code?: string };
      
      // Handle duplicate entry for unique fields (like username or email)
      if (mysqlError.code === 'ER_DUP_ENTRY') {
        res.status(409).json({ 
          success: false, 
          message: 'Username or email already exists' 
        });
        return;
      }
    }
    
    // Generic error response
    res.status(500).json({ 
      success: false, 
      message: 'Server error while creating admin user' 
    });
  }
});
router.get('/userfetch', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const [rows]: any = await db.query(
        `SELECT 
           a.first_name, 
           a.last_name, 
           a.mobile, 
           a.email, 
           a.address, 
           a.username, 
           a.password, 
           a.role_id, 
           r.role_name, 
           a.dob
         FROM adminusers a
         LEFT JOIN rolemaster r ON a.role_id = r.role_id
         WHERE a.is_active = 1 AND r.is_active = 1`
      );
  
      res.status(200).json({ success: true, data: rows });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  });

  

export default router;