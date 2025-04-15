import express, { Router, Request, Response, NextFunction } from 'express';
import db from '../../connection';

const router = express.Router();

router.use(express.json());

router.get('/getfollowup', async (req: Request, res: Response) => {
  try {

    const [rows]: any = await db.query(`
        SELECT 
          nf.nextfollowup_id,
          nf.tele_id,
          nf.customer_id,
          nf.user_id,
          nf.currentupdate_id,
          nf.nextfollowup_dt,
          nf.nextfollowup_at,
          nf.note,
          DATE_FORMAT(nf.create_dt, "%d-%m-%Y %H:%i:%s") AS formatted_create_dt,
          nf.create_at,
          c.name AS customer_name,
          c.mobile AS customer_mobile,
          c.city AS customer_city,
          u.username AS agent_username,
          cu.CurrentUpdateName AS status_name
        FROM nextfollowup nf
        LEFT JOIN customer c ON nf.customer_id = c.customer_id
        LEFT JOIN adminusers u ON nf.user_id = u.user_id
        LEFT JOIN currentupdate cu ON nf.currentupdate_id = cu.currentupdate_id
      `);
      
      
      


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
