import multer from 'multer';
import ExcelJS from 'exceljs';
import express, { Router ,Request, Response } from 'express';
import { db } from '../../connection'; // adjust as needed


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
  
      const customers: { name: string; mobile: string }[] = [];
  
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip the header row
  
        const name = row.getCell(2).text.trim();   // Column B (Name)
        const mobile = row.getCell(3).text.trim(); // Column C (Mobile)
  
        if (name && mobile) {
          customers.push({ name, mobile });
        }
      });
  
      if (customers.length === 0) {
         res.status(400).json({ success: false, message: 'No valid data found in Excel' });return;
      }
  
      const insertPromises = customers.map(({ name, mobile }) =>
        db.query('INSERT INTO customer (name, mobile) VALUES (?, ?)', [name, mobile])
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
          'SELECT customer_id, name,mobile FROM customer WHERE is_active = 1'
        );
    
        res.status(200).json({ success: true, data: rows });
      } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
      }
    });
  
export default router;