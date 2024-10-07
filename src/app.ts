import express from 'express';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';

const app = express();
app.use(express.json());

app.use('/auth', authRoutes); 
app.use('/users', userRoutes);

app.get('/greetings', (req, res) => {
  res.json({ message: 'greetings' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
