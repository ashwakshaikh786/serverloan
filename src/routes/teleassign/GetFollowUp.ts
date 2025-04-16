// // import express, { Router, Request, Response, NextFunction } from 'express';
// // import db from '../../connection';

// // const router = express.Router();

// // router.use(express.json());

// // router.get('/getfollowup', async (req: Request, res: Response) => {
// //   try {

// //     const [rows]: any = await db.query(`
// //         SELECT 
// //           nf.nextfollowup_id,
// //           nf.tele_id,
// //           nf.customer_id,
// //           nf.user_id,
// //           nf.currentupdate_id,
// //           nf.nextfollowup_dt,
// //           nf.nextfollowup_at,
// //           nf.note,
// //           DATE_FORMAT(nf.create_dt, "%d-%m-%Y %H:%i:%s") AS formatted_create_dt,
// //           nf.create_at,
// //           c.name AS customer_name,
// //           c.mobile AS customer_mobile,
// //           c.city AS customer_city,
// //           u.username AS agent_username,
// //           cu.CurrentUpdateName AS status_name
// //         FROM nextfollowup nf
// //         LEFT JOIN customer c ON nf.customer_id = c.customer_id
// //         LEFT JOIN adminusers u ON nf.user_id = u.user_id
// //         LEFT JOIN currentupdate cu ON nf.currentupdate_id = cu.currentupdate_id
// //       `);
      
      
      


// //     if (rows.length === 0) {
// //        res.status(404).json({ success: false, message: 'No records found' });
// //        return;
// //     }

// //     res.status(200).json({ success: true, data: rows });
// //   } catch (error) {
// //     console.error('Error fetching teleassignList:', error);  // Enhanced error logging
// //     res.status(500).json({ success: false, message: 'Server error' });
// //   }
// // });

// // export default router;
// import express, { Router, Request, Response, NextFunction } from 'express';
// import db from '../../connection';

// const router = express.Router();

// router.use(express.json());

// router.get('/getfollowup', async (req: Request, res: Response) => {
//   try {

//     // Query to get data and maximum nextfollowup_id
//     const [rows]: any = await db.query(`
//       SELECT 
//         nf.nextfollowup_id,
//         nf.tele_id,
//         nf.customer_id,
//         nf.user_id,
//         nf.currentupdate_id,
//         nf.nextfollowup_dt,
//         nf.nextfollowup_at,
//         nf.note,
//         DATE_FORMAT(nf.create_dt, "%d-%m-%Y %H:%i:%s") AS formatted_create_dt,
//         nf.create_at,
//         c.name AS customer_name,
//         c.mobile AS customer_mobile,
//         c.city AS customer_city,
//         u.username AS agent_username,
//         cu.CurrentUpdateName AS status_name,
//         (SELECT MAX(nextfollowup_id) FROM nextfollowup) AS max_id  -- Get max nextfollowup_id
//       FROM nextfollowup nf
//       LEFT JOIN customer c ON nf.customer_id = c.customer_id
//       LEFT JOIN adminusers u ON nf.user_id = u.user_id
//       LEFT JOIN currentupdate cu ON nf.currentupdate_id = cu.currentupdate_id
//     `);

//     // Check if the result is empty
//     if (rows.length === 0) {
//       res.status(404).json({ success: false, message: 'No records found' });
//       return;
//     }

//     // Return the result along with max_id
//     res.status(200).json({ success: true, data: rows });
//   } catch (error) {
//     console.error('Error fetching follow-up data:', error);  // Enhanced error logging
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });

// export default router;
import express, { Router, Request, Response, NextFunction } from 'express';
import db from '../../connection';
import { log } from 'console';

const router = express.Router();

router.use(express.json());

router.get('/getfollowup', async (req: Request, res: Response) => {
  try {
    // Query to get the latest (max) follow-up date for each customer
    const [rows]: any = await db.query(`
      SELECT 
        nf.tele_id,
        nf.customer_id,
        nf.nextfollowup_dt,  -- Get the latest follow-up date
        
        MAX(nf.nextfollowup_id) AS max_nextfollowup_id, 
        nf.user_id,
        nf.currentupdate_id,
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
      GROUP BY nf.tele_id, nf.customer_id  -- Grouping by tele_id and customer_id
    `);

    if (rows.length === 0) {
       res.status(404).json({ success: false, message: 'No records found' });
       return;
    }
    // Return the result
    res.status(200).json({ success: true, data: rows });
    console.log(rows);
  } catch (error) {
    console.error('Error fetching follow-up data:', error);  // Enhanced error logging
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;
