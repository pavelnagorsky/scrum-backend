import { NextFunction } from "express";

import { ErrorWithStatus } from "../config/types";

// async errorHandler for express
export const errorHandler = (error: ErrorWithStatus | any, next: NextFunction) => {
  if (!error.statusCode) {
    error.statusCode = 500;
  }
  next(error);
}