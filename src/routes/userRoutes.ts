import { Router, Request, Response, NextFunction } from 'express';
import db from '../connection';

const router = Router();

router.post('/signin', async (req: Request, res: Response, next: NextFunction) => {
  const { name } = req.body;

  if (!name) {
    res.status(400).json({ success: false, message: 'Name is required' });
    return;
  }

  try {
    const [result]: any = await db.query('INSERT INTO test (name) VALUES (?)', [name]);
    res.status(200).json({ success: true, message: 'User inserted', id: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;
