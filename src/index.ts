import express from 'express';
import cors from 'cors';
import userRouter from './routes/userRoutes';
import userRoles from './routes/userRoles';
import userRegister from './routes/userRegister';
import Login from './routes/login/userLogin';
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

app.listen(5000, () => {
  console.log('Server running on http://localhost:5000');
});
