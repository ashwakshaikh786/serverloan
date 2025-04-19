
import ExcelJS from 'exceljs';
import express, { Router ,Request, Response } from 'express';
import { db } from '../../connection'; // adjust as needed
import multer from 'multer';
import moment from 'moment-timezone';

// Set up multer to store file in memory (buffer)
const storage = multer.memoryStorage();
const upload = multer({ storage });


const router = Router();
  router.post('/uploadexcel', upload.single('excelFile'), async (req: Request, res: Response) => {
      try {
        if (!req.file) {
          res.status(400).json({ success: false, message: 'Excel file is required' });return;
        }
    
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(req.file.buffer);
        const worksheet = workbook.worksheets[0]; 
    
        const customers: { name: string; mobile: string,loanamount:string,city:string ,pincode:string}[] = [];
    
        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return; // Skip the header row
    
          const name = row.getCell(2).text.trim();   // Column B (Name)
          const mobile = row.getCell(3).text.trim(); // Column C (Mobile)
          const loanamount = row.getCell(4).text.trim();   // Column B (Name)
          const city = row.getCell(5).text.trim();
          const pincode = row.getCell(6).text.trim();   // Column B (Name)
        
          if (name && mobile && loanamount && city && pincode) {
            customers.push({ name, mobile ,loanamount,city,pincode});
          }
        });
    
        if (customers.length === 0) {
          res.status(400).json({ success: false, message: 'No valid data found in Excel' });return;
        }
    
        const insertPromises = customers.map(({ name, mobile, loanamount, city, pincode }) =>
          db.query(
            'INSERT INTO customer (name, mobile, loanamount, city, pincode) VALUES (?, ?, ?, ?, ?)',
            [name, mobile, loanamount, city, pincode]
          )
        );
        
    
        await Promise.all(insertPromises);
    
        res.status(200).json({ 
          success: true, 
          message: 'Customers uploaded successfully', 
          count: customers.length 
        });return;
      } catch (error) {
        console.error('Error uploading customers:', error);
        res.status(500).json({ success: false, message: 'Server error while uploading customers' });return;
      }
    });
  
  router.get('/fetchexcel', async (req: Request, res: Response) => {
      try {
        const [rows]: any = await db.query(
          'SELECT customer_id, name,mobile,DATE_FORMAT(created_at, "%d-%m-%Y %H:%i:%s") AS created_at,Proccess,loanamount,city,pincode  FROM customer WHERE is_active = 1 AND Proccess = 0'
        );
    
        res.status(200).json({ success: true, data: rows });
      } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
      }
    });
    
    router.post('/uploadsingleexcel', async (req: Request, res: Response) => {
      const customers: { name: string; mobile: string ,loanamount:string,city:string ,pincode:string }[] = req.body;
    
      // Check if body is a non-empty array
      if (!Array.isArray(customers) || customers.length === 0) {
         res.status(400).json({
          success: false,
          message: 'Request body must be a non-empty array of customer objects',
        });
        return;
      }
    
      // Validate each customer object
      const invalidEntries = customers.filter(c => !c.name || !c.mobile);
      if (invalidEntries.length > 0) {
         res.status(400).json({
          success: false,
          message: 'Each customer must have both name and mobile',
          invalidEntries,
        });
        return;
      }
    
      // Prepare values for bulk insert
      const values = customers.map(c => [c.name, c.mobile,c.loanamount,c.city,c.pincode]);
    
      try {
        const [result]: any = await db.query(
          `INSERT INTO customer (name, mobile,loanamount,city,pincode) VALUES ?`,
          [values] // Note: Values is nested array
        );
    
        res.status(200).json({
          success: true,
          message: 'Customers inserted successfully',
          affectedRows: result.affectedRows,
          insertIdStart: result.insertId,
        });
      } catch (error: unknown) {
        console.error('Error inserting customers:', error);
    
        if (error instanceof Error) {
          const mysqlError = error as { code?: string };
    
          if (mysqlError.code === 'ER_DUP_ENTRY') {
             res.status(409).json({
              success: false,
              message: 'Duplicate entry found (name or mobile already exists)',
            });
            return;
          }
        }
    
        res.status(500).json({
          success: false,
          message: 'Server error while inserting customers',
        });
      }
    });
    
    
export default router;
    
