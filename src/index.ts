import express from 'express';
import cors from 'cors';
import userRouter from './routes/userRoutes';
import userRoles from './routes/userRoles';
import userRegister from './routes/userRegister';
import Login from './routes/login/userLogin';
import uploadexcel from  './routes/userexcel/userExcelcontrol'
import assigncustomer from './routes/assigncustomer/assingcustomer'
import TeleAssignList from './routes/telecaller/teleassign'
import NextFollowup from './routes/teleassign/userFollowup'
const app = express();

app.use(cors());
app.use(express.json());
app.get('/', (req, res) => {
  res.send('Welcome to the API');
});
app.use('/api/user', userRouter);
app.use('/api/user', userRoles);
app.use('/api/user', userRegister);
app.use('/api/user', Login);
app.use('/api/upload', uploadexcel);
app.use('/api/assign', assigncustomer);
app.use('/api/telecaller/assign', TeleAssignList);
app.use('/api/telecaller/assign', NextFollowup);


app.listen(5000, () => {
  console.log('Server running on http://localhost:5000');
});
