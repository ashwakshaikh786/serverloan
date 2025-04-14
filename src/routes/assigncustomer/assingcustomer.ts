import { Router, Request, Response, NextFunction } from 'express';
import db from '../../connection';

const router = Router();router.post('/assigncustomer', async (req: Request, res: Response, next: NextFunction) => {
    const { customer_id, user_id, name, mobile } = req.body;
  
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
            'INSERT INTO telecallercustomer (customer_id, user_id, name, mobile) VALUES (?, ?, ?, ?)',
            [customer_id, user_id, name, mobile]
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
  

export default router;
