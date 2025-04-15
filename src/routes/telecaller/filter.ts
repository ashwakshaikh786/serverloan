import express, { Router, Request, Response, NextFunction } from 'express';
import db from '../../connection';

const router = express.Router();

router.use(express.json());

router.get('/TeleFilter', async (req: Request, res: Response) => {
  try {

    const [rows]: any = await db.query(
      'SELECT tele_id, customer_id, user_id, name, mobile,loanamount,city,pincode, Proccess, is_active,DATE_FORMAT(created_at, "%d-%m-%Y %H:%i:%s") AS created_at FROM telecallercustomer WHERE is_active = 1 ',
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
