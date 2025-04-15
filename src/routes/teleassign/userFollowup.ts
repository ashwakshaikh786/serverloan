import { Router, Request, Response, NextFunction } from 'express';
import db from '../../connection'; // adjust path as needed
import moment from 'moment-timezone';


const router = Router();


router.post('/nextfollowup', async (req: Request, res: Response, next: NextFunction) => {
  const {
    tele_id,
    customer_id,
    user_id,
    currentupdate_id,
    nextfollowup_dt,
    nextfollowup_at,
    note,
  } = req.body;

  if (!tele_id || !customer_id || !user_id || !currentupdate_id || !nextfollowup_dt || !nextfollowup_at) {
     res.status(400).json({ success: false, message: 'Missing required fields' });
     return;
  }

  const create_dt = moment().tz('Asia/Kolkata').format('YYYY-MM-DD');
  const create_at = moment().tz('Asia/Kolkata').format('HH:mm:ss');

  try {
    const [result]: any = await db.query(
      `INSERT INTO nextfollowup (
        tele_id, customer_id, user_id, currentupdate_id,
        nextfollowup_dt, nextfollowup_at, note,
        create_dt, create_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tele_id,
        customer_id,
        user_id,
        currentupdate_id,
        nextfollowup_dt,
        nextfollowup_at,
        note,
        create_dt,
        user_id
      ]
    );

    res.status(200).json({
      success: true,
      message: 'Follow-up inserted',
      id: result.insertId,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});
export default router;