import { NextFunction, Request, Response } from "express";
import { ValidationError } from "express-validator";

export type IMiddleware = (
    req: CustomRequest,
    res: Response,
    next: NextFunction
  ) => void

export interface ErrorWithStatus extends Error {
  statusCode?: number;
  data?: ValidationError[]
};

export interface CustomRequest extends Request {
  userId?: string;
  [key: string]: any
}