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
      `SELECT 
    t.tele_id, 
    t.customer_id, 
    t.user_id, 
    t.name, 
    t.mobile, 
    t.loanamount, 
    t.city, 
    t.pincode, 
    t.Proccess, 
    t.is_active, 
    n.nextfollowup_id, 
    n.tele_id AS followup_tele_id, 
    DATE_FORMAT(n.nextfollowup_dt, "%d-%m-%Y") AS nextfollowup_dt,
    n.nextfollowup_at, 
    n.currentupdate_id,
    n.note, 
    DATE_FORMAT(n.create_dt, "%d-%m-%Y %H:%i:%s") AS created_at,  
    n.create_at,
    cu.currentupdatename
FROM 
    telecallercustomer t
LEFT JOIN 
    (
      SELECT nf.*
      FROM nextfollowup nf
      INNER JOIN (
        SELECT tele_id, MAX(nextfollowup_id) AS max_id
        FROM nextfollowup
        GROUP BY tele_id
      ) latest ON nf.tele_id = latest.tele_id AND nf.nextfollowup_id = latest.max_id
    ) n ON t.tele_id = n.tele_id
LEFT JOIN 
    currentupdate cu ON n.currentupdate_id = cu.currentupdate_id
WHERE 
    t.is_active = 1 
    AND t.Proccess = 0 
    AND t.user_id = ?
`,
      [userId]
    );
    
    if (rows.length === 0) {
       res.status(404).json({ success: false, message: 'No records found' });
       return;
    }

    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching teleassignList:', error);  
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;
