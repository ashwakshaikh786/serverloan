import { Router, Request, Response, NextFunction } from 'express';
import db from '../../connection';
import { checkServerIdentity } from 'tls';

const router = Router();router.post('/assigncustomer', async (req: Request, res: Response, next: NextFunction) => {
    const { customer_id, user_id, name, mobile,loanamount,city,pincode } = req.body;
  
    if (!customer_id || !user_id || !name || !mobile) {
        res.status(400).json({ success: false, message: 'All fields are required' });return;
    }
  
    // Get a connection from the pool
    const connection = await db.getConnection();
    
    try {
        // Begin transaction
        await connection.beginTransaction();

        // 1. Assign customer to telecaller
        const [insertResult]: any = await connection.query(
            'INSERT INTO telecallercustomer (customer_id, user_id, name, mobile, loanamount, city, pincode) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [customer_id, user_id, name, mobile, loanamount, city,pincode] 
        );

        // 2. Update customer process status
        const [updateResult]: any = await connection.query(
            'UPDATE customer SET Proccess = 1 WHERE customer_id = ?',
            [customer_id]
        );

        // Commit transaction if both queries succeed
        await connection.commit();
        
        res.status(200).json({ 
            success: true, 
            message: 'Customer assigned and status updated', 
            id: insertResult.insertId 
        });
    } catch (error) {
        // Rollback transaction if any error occurs
        await connection.rollback();
        console.error('Database Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    } finally {
        // Release the connection back to the pool
        if (connection) connection.release();
    }
});
router.get('/AdminassignListCount', async (req: Request, res: Response) => {
    try {
      // Updated: Removed userId usage, not needed anymore
  
      // Query to get the counts for different conditions across all users
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
        `
      );
  
      res.status(200).json({ 
        success: true,
        counts: counts[0] 
      });
  
    } catch (error) {
      console.error('Error fetching teleassignListCount:', error);  
      res.status(500).json({ success: false, message: 'Server error' });
    }
  });
  

export default router;
