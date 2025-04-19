import { Router, Request, Response, NextFunction } from 'express';
import db from '../connection';

const router = Router();

router.get('/roles', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const [rows]: any = await db.query(
        'SELECT role_id, role_name FROM rolemaster WHERE is_active = 1'
      );
  
      res.status(200).json({ success: true, data: rows });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  });
  router.get('/agentroles', async (req: Request, res: Response, next: NextFunction) => {
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
         WHERE a.is_active = 1 AND a.role_id = 2` 
      );
  
      res.status(200).json({ success: true, data: rows });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  });
export default router;
