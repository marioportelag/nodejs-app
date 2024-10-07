import { Request, Response } from 'express';
import { generateToken } from '../auth';

const validUser = { username: 'admin', password: 'password' }; // Hardcoded

export const login = (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (username === validUser.username && password === validUser.password) {
    const token = generateToken(username);
    res.json({ success: true, token });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
};
