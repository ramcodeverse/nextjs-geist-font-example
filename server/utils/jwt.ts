import jwt from 'jsonwebtoken';
import { IUser } from '../models/User';

export interface JWTPayload {
  id: string;
  email: string;
  role: string;
}

export const generateToken = (user: IUser): string => {
  const payload: JWTPayload = {
    id: (user._id as any).toString(),
    email: user.email,
    role: user.role
  };

  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: '7d'
  });
};

export const verifyToken = (token: string): JWTPayload => {
  return jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
};

export const generateRefreshToken = (user: IUser): string => {
  const payload: JWTPayload = {
    id: (user._id as any).toString(),
    email: user.email,
    role: user.role
  };

  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: '30d'
  });
};
