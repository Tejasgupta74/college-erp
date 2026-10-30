import jwt from 'jsonwebtoken';

export const generateToken = (id, tokenVersion = 0) =>
  jwt.sign({ id, tokenVersion }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });
