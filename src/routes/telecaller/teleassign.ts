import express, { Router, Request, Response, NextFunction } from 'express';
import db from '../../connection';

const router = express.Router();

// Middleware to parse JSON bodies
router.use(express.json());

router.post('/teleassignList', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;  // Access userId from the request body

    if (!userId) {
       res.status(400).json({ success: false, message: 'User ID is required' });
       return;
    }

    const [rows]: any = await db.query(
      'SELECT tele_id, customer_id, user_id, name, mobile,loanamount,city,pincode, Proccess, is_active FROM telecallercustomer WHERE is_active = 1 AND Proccess = 0 AND user_id = ?',
      [userId]
    );

    if (rows.length === 0) {
       res.status(404).json({ success: false, message: 'No records found' });
       return;
    }

    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching teleassignList:', error);  // Enhanced error logging
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;
