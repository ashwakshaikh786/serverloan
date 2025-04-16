import { Router, Request, Response, NextFunction } from 'express';
import db from '../../connection'; // adjust path as needed
import moment from 'moment-timezone';


const router = Router();


router.post('/nextfollowup', async (req: Request, res   : Response, next: NextFunction) => {
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

router.get('/currentupdate', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const [rows]: any = await db.query(
        'SELECT currentupdate_id, currentupdatename FROM currentupdate  WHERE status=1'
      );
  
      res.status(200).json({ success: true, data: rows });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  });


  router.delete('/currentupdate/delete/:id', async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;
    console.log('Attempting to delete record with id:', id); // Debugging log
  
    try {
      const [result]: any = await db.query(
        'UPDATE currentupdate SET status = 0 WHERE currentupdate_id = ?',
        [id]
      );
      
      console.log('Query result:', result); // Debugging log
      
      if (result.affectedRows === 0) {
        res.status(404).json({ success: false, message: 'Record not found' });
        return;
      }
      
      res.status(200).json({ success: true, message: 'Record deleted (status set to 0)' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  });


// Get a specific follow-up record by ID
router.get('/currentupdate/get/:id', async (req: Request, res: Response) => {
  const id = req.params.id;

  try {
    const [rows]: any = await db.query(
      'SELECT * FROM nextfollowup WHERE nextfollowup_id = ?',
      [id]
    );

    if (rows.length === 0) {
      res.status(404).json({ success: false, message: 'Follow-up not found' });
      return 
    }

    res.status(200).json({ success: true, data: rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update a follow-up record

router.put('/currentupdate/update/:id', async (req: Request, res: Response) => {
  const id = req.params.id;
  const { currentupdatename } = req.body;

  try {
    const [result]: any = await db.query(
      `UPDATE currentupdate SET currentupdatename = ? WHERE currentupdate_id = ?`,
      [currentupdatename, id]
    );

    if (result.affectedRows === 0) {
      res.status(404).json({ success: false, message: 'Follow-up not found' });
      return 
    }

    res.status(200).json({ success: true, message: 'Follow-up updated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});




export default router;