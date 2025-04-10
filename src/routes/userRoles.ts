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

export default router;
