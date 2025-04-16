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
router.post('/teleassignListToday', async (req: Request, res: Response) => {
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
        AND (n.nextfollowup_dt = CURDATE() OR n.nextfollowup_dt IS NULL)
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
router.post('/teleassignListBacklog', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body; 

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
        AND (n.nextfollowup_dt  < CURDATE())
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
router.post('/teleassignListNext', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body; 

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
        AND (n.nextfollowup_dt  > CURDATE())
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

router.post('/teleassignListCount', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body; 

    if (!userId) {
       res.status(400).json({ success: false, message: 'User ID is required' });
       return;
    }

    // Query to get the list of records
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
        AND (n.nextfollowup_dt < CURDATE() OR n.nextfollowup_dt IS NULL)
      `,
      [userId]
    );
    
    // Query to get the counts for different conditions
    const [counts]: any = await db.query(
      `SELECT 
        SUM(CASE WHEN n.nextfollowup_dt = CURDATE() OR n.nextfollowup_dt IS NULL THEN 1 ELSE 0 END) AS today_or_null_count,
        SUM(CASE WHEN n.nextfollowup_dt < CURDATE() THEN 1 ELSE 0 END) AS past_count,
        SUM(CASE WHEN n.nextfollowup_dt > CURDATE() THEN 1 ELSE 0 END) AS future_count,
        COUNT(*) AS total_count
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
      WHERE 
        t.is_active = 1 
        AND t.Proccess = 0 
        AND t.user_id = ?
      `,
      [userId]
    );

    if (rows.length === 0) {
       res.status(200).json({ 
         success: false, 
         message: 'No records found',
         counts: counts[0] // Return counts even if no records found
       });
       return;
    }

    res.status(200).json({ 
      success: true, 
      data: 'No records found',
      counts: counts[0] 
    });
  } catch (error) {
    console.error('Error fetching teleassignList:', error);  
    res.status(500).json({ success: false, message: 'Server error' });
  }
});
export default router;
