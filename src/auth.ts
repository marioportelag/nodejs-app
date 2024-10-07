import jwt from 'jsonwebtoken';

const secret = 'secret';

export const generateToken = (username: string): string => {
  return jwt.sign({ username }, secret, { expiresIn: '60s' });
};

export const validateToken = (token: string) => {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
};
