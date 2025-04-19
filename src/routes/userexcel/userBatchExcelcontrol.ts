import express, { Request, Response } from 'express';
import ExcelJS from 'exceljs';
import moment from 'moment-timezone';
import { db } from '../../connection'; // adjust as needed
import multer from 'multer';
import { ResultSetHeader } from 'mysql2';

const router = express.Router();
const upload = multer();

router.post('/uploadbatchexcel', upload.single('excelFile'), async (req: Request, res: Response) => {
  // Validate file exists
  if (!req.file) {
    res.status(400).json({ success: false, message: 'No file uploaded' });return;
  }

  try {
    // Parse and validate form data
    const adminUserId = req.body.created_at;
    const batchName = req.body.batch_name;
    
    if (!adminUserId || !batchName) {
      res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: created_at or batch_name' 
      });
    }

    // Process agents array
    let agents: number[] = [];
    if (typeof req.body.agents === 'string') {
        try {
          const parsed = JSON.parse(req.body.agents);
          agents = Array.isArray(parsed) ? parsed.map(Number) : [Number(parsed)];
        } catch (e) {
          // If JSON parsing fails, try comma-separated values
          const agentsStr = req.body.agents.replace(/[\[\]"]/g, '');
          agents = agentsStr.split(',').map(Number).filter((n: number) => !isNaN(n));
        }
      } 
      // Case 2: Array format (from form field 'agents[]=6&agents[]=7&agents[]=8')
      else if (Array.isArray(req.body.agents)) {
        agents = req.body.agents.map(Number);
      } 
      // Case 3: Field with brackets
      else if (req.body['agents[]']) {
        agents = Array.isArray(req.body['agents[]']) 
          ? req.body['agents[]'].map(Number) 
          : [Number(req.body['agents[]'])];
      }
      // Case 4: Single value
      else if (req.body.agents) {
        agents = [Number(req.body.agents)];
      }

    if (agents.length === 0) {
      res.status(400).json({ success: false, message: 'No agents specified' });
    }

    // Process Excel file
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);
    const worksheet = workbook.worksheets[0];

    const customers: { 
      name: string; 
      mobile: string; 
      loanamount: string; 
      city: string; 
      pincode: string 
    }[] = [];

    // Extract customer data from Excel (skip header row)
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      
      const name = row.getCell(2).text.trim();
      const mobile = row.getCell(3).text.trim();
      const loanamount = row.getCell(4).text.trim();
      const city = row.getCell(5).text.trim();
      const pincode = row.getCell(6).text.trim();

      if (name && mobile && loanamount && city && pincode) {
        customers.push({ name, mobile, loanamount, city, pincode });
      }
    });

    if (customers.length === 0) {
      res.status(400).json({ success: false, message: 'No valid customer data found' });
    }

    const currentTime = moment().tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss');
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // 1. Insert batch record
      const [batchResult] = await connection.query<ResultSetHeader>(
        'INSERT INTO batch (batchname, created_at, created_dt) VALUES (?, ?, ?)',
        [batchName, adminUserId, currentTime]
      );
      const batchId = batchResult.insertId;

      // 2. Insert customers and collect their IDs
      const customerIds: number[] = [];
      
      for (const customer of customers) {   
        const [result] = await connection.query<ResultSetHeader>(
          `INSERT INTO customer 
          (name, mobile, loanamount, city, pincode, batch_id, Proccess, is_active, created_at, created_uid) 
          VALUES (?, ?, ?, ?, ?, ?, 1, 1, ?, ?)`,
          [
            customer.name, 
            customer.mobile, 
            customer.loanamount, 
            customer.city, 
            customer.pincode, 
            batchId, 
            currentTime, 
            adminUserId
          ]
        );
        customerIds.push(result.insertId);
      }

      // 3. Assign customers to agents with duplicate handling
      const assignmentPromises: Promise<any>[] = [];
      const assignedPairs = new Set<string>();
      let successfulAssignments = 0;

      for (const customerId of customerIds) {
        const customer = customers[customerIds.indexOf(customerId)];
        
        for (const agentId of agents) {
          const pairKey = `${customerId}-${agentId}`;
          
          if (!assignedPairs.has(pairKey)) {
            assignedPairs.add(pairKey);
            
            try {
              // Using INSERT IGNORE to skip duplicates silently
              const [assignmentResult] = await connection.query<ResultSetHeader>(
                `INSERT IGNORE INTO telecallercustomer 
                (customer_id, user_id, name, mobile, loanamount, city, pincode, batch_id, Proccess, is_active, created_at, created_uid) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 1, ?, ?)`,
                [
                  customerId, 
                  agentId, 
                  customer.name, 
                  customer.mobile, 
                  customer.loanamount, 
                  customer.city, 
                  customer.pincode, 
                  batchId, 
                  currentTime, 
                  adminUserId
                ]
              );
              
              if (assignmentResult.affectedRows > 0) {
                successfulAssignments++;
              }
            } catch (error) {
              console.error(`Error assigning customer ${customerId} to agent ${agentId}:`, error);
              // Continue with other assignments even if one fails
            }
          }
        }
      }

      await connection.commit();
      connection.release();

      res.status(200).json({
        success: true,
        message: 'Data imported successfully',
        batch_id: batchId,
        total_customers: customers.length,
        total_assignments_attempted: assignedPairs.size,
        successful_assignments: successfulAssignments,
        duplicate_assignments_skipped: assignedPairs.size - successfulAssignments,
      });

    } catch (error) {
      await connection.rollback();
      connection.release();
      console.error('Database error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Database processing failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during processing',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;