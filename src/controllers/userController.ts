import { Request, Response } from 'express';

const users = [
  { id: 25, name: 'camilo', edad: 28 },
  { id: 26, name: 'juan', edad: 32 },
];

export const getUsers = (req: Request, res: Response) => {
  res.json(users);
};

export const getUserById = (req: Request, res: Response) => {
  const userId = parseInt(req.params.id, 10);
  const user = users.find(u => u.id === userId);
  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};
