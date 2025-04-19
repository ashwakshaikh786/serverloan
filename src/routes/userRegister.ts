import { Router, Request, Response, NextFunction } from 'express';
import db from '../connection';
import bcrypt from 'bcrypt';
import moment from 'moment-timezone';
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
    dob,
    createuid
  } = req.body;

  // Validate required fields
  if (!first_name || !last_name || !mobile || !email || !username || !password || !role_id) {
    res.status(400).json({ 
      success: false, 
      message: 'First name, last name, mobile, email, username, password, and role_id are required' 
    });
    return;
  }
  const created_at = moment().tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss');

  try {
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const [result]: any = await db.query(
      `INSERT INTO adminusers 
       (first_name, last_name, mobile, email, address, username, password, role_id, dob ,	created_uid ,created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ? , ? ,?)`, 
      [first_name, last_name, mobile, email, address, username, hashedPassword, role_id, dob ,createuid ,created_at]
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
           a.user_id,
           a.first_name, 
           a.last_name, 
           a.mobile, 
           a.email, 
           a.address, 
           a.username, 
           a.password, 
           a.role_id, 
           r.role_name, 
           DATE_FORMAT(a.dob, "%d-%m-%Y") AS dob  
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

router.post('/userupdate', async (req: Request, res: Response, next: NextFunction) => {
 
  const { 
    user_id,
    first_name, 
    last_name, 
    mobile, 
    email, 
    address, 
    username, 
    password, 
    role_id, 
    dob,
    modified_uid
  } = req.body;

  // Validate required fields
  if (!user_id || !modified_uid) {
    res.status(400).json({ 
      success: false, 
      message: 'User ID and modified user ID are required' 
    });
    return;
  }

  try {
    // First, get the existing user data
    const [existingUser]: any = await db.query(
      `SELECT 
        first_name, last_name, mobile, email, address, 
        username, password, role_id, dob
       FROM adminusers 
       WHERE user_id = ?`, 
      [user_id]
    );

    if (existingUser.length === 0) {
      res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
      return;
    }

    const currentUser = existingUser[0];
    let hashedPassword = currentUser.password;

    // If password is provided, hash the new password
    if (password) {
      hashedPassword = await bcrypt.hash(password, saltRounds);
    }

    // Get current time in Asia/Kolkata timezone
    const modified_at = moment().tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss');

    // Update only the fields that are provided in the request
    const updatedFields = {
      first_name: first_name || currentUser.first_name,
      last_name: last_name || currentUser.last_name,
      mobile: mobile || currentUser.mobile,
      email: email || currentUser.email,
      address: address !== undefined ? address : currentUser.address,
      username: username || currentUser.username,
      password: hashedPassword,
      role_id: role_id || currentUser.role_id,
      dob: dob || currentUser.dob,
      modified_at: modified_at,
      modified_uid: modified_uid
    };

    // Perform the update
    const [result]: any = await db.query(
      `UPDATE adminusers SET 
        first_name = ?, 
        last_name = ?, 
        mobile = ?, 
        email = ?, 
        address = ?, 
        username = ?, 
        password = ?, 
        role_id = ?, 
        dob = ?,
        modified_at = ?,
        modified_uid = ?
       WHERE user_id = ?`, 
      [
        updatedFields.first_name,
        updatedFields.last_name,
        updatedFields.mobile,
        updatedFields.email,
        updatedFields.address,
        updatedFields.username,
        updatedFields.password,
        updatedFields.role_id,
        updatedFields.dob,
        updatedFields.modified_at,
        updatedFields.modified_uid,
        user_id
      ]
    );
    
    if (result.affectedRows === 0) {
      res.status(404).json({ 
        success: false, 
        message: 'User not found or no changes made' 
      });
      return;
    }
    
    res.status(200).json({ 
      success: true, 
      message: 'Admin user updated successfully' 
    });
  } catch (error: unknown) {
    console.error('Error updating admin user:', error);
    
    if (error instanceof Error) {
      const mysqlError = error as { code?: string };
      
      if (mysqlError.code === 'ER_DUP_ENTRY') {
        res.status(409).json({ 
          success: false, 
          message: 'Username or email already exists' 
        });
        return;
      }
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Server error while updating admin user' 
    });
  }
});
router.post('/userdeactivate', async (req: Request, res: Response, next: NextFunction) => {
  const { selectuserid, deleteid } = req.body;

  // Validate required fields
  if (!selectuserid || !deleteid) {
    res.status(400).json({ 
      success: false, 
      message: 'User ID and deleting user ID are required' 
    });return;
  }

  try {
    // First verify the user exists
    const [existingUser]: any = await db.query(
      `SELECT user_id FROM adminusers WHERE user_id = ?`, 
      [selectuserid]
    );

    if (existingUser.length === 0) {
      res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });return;
    }

    // Get current time in Asia/Kolkata timezone
    const delete_at = moment().tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss');

    // Perform the deactivation
    const [result]: any = await db.query(
      `UPDATE adminusers SET 
        is_active = 0,
        delete_at = ?,
        delete_uid = ?
       WHERE user_id = ?`, 
      [delete_at, deleteid, selectuserid]
    );
    
    if (result.affectedRows === 0) {
      res.status(404).json({ 
        success: false, 
        message: 'User not found or no changes made' 
      });return;
    }
    
    res.status(200).json({ 
      success: true, 
      message: 'User deactivated successfully',
      data: {
        deactivated_at: delete_at,
        deactivated_by: deleteid
      }
    });return;
  } catch (error: unknown) {
    console.error('Error deactivating user:', error);
    
    if (error instanceof Error) {
      res.status(500).json({ 
        success: false, 
        message: 'Server error while deactivating user',
        error: error.message 
      });return;
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Unknown server error while deactivating user' 
    });return;
  }
});
export default router;