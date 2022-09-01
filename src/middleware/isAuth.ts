import jwt from 'jsonwebtoken';

import { ErrorWithStatus, IMiddleware } from "../config/types";

interface JwtPayload {
  userId: string;
  email: string;
}

export const isAuth: IMiddleware = (req, res, next) => {
  const authHeader = req.get('Authorization');
  if (!authHeader) {
    const error: ErrorWithStatus = new Error('Not authenticated');
    error.statusCode = 401;
    throw error;
  }
  const token = req.get('Authorization')?.split(' ')[1] || '';
  let decodedToken: JwtPayload;
  try {
    decodedToken = jwt.verify(token, process.env.JWT_SECRET || '666') as JwtPayload;
  } catch (err: any | ErrorWithStatus) {
    err.statusCode = 500;
    throw err;
  }
  if (!decodedToken) {
    const error: ErrorWithStatus = new Error('Not authenticated');
    error.statusCode = 401;
    throw error;
  }
  req.userId = decodedToken.userId;
  next();
}