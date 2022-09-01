// express config
import express, { NextFunction, Request, Response } from 'express';
import bodyParser from 'body-parser';
// const compression = require('compression');
import dotenv from "dotenv";
dotenv.config();

// types
import { ErrorWithStatus } from './types';
// middleware import
import { isAuth } from '../middleware/isAuth';
import { isAdmin } from '../middleware/isAdmin';
import { isMember } from '../middleware/isMember';
import { headers } from '../middleware/headers';
// routes import
import projectRoutes from '../routes/project';
import taskRoutes from '../routes/task';
import authRoutes from '../routes/auth';
import iterationRoutes from '../routes/iteration';

const app = express();

export default () => {
  // data parser config
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());

  // headers config
  app.use(headers);

  // routes
  app.use('/auth', authRoutes);
  app.use('/projects', isAuth, projectRoutes);
  app.use('/projects/:projectId/iterations', isAuth, isAdmin, iterationRoutes);
  app.use('/projects/:projectId/tasks', isAuth, isMember, taskRoutes);

  // error handling
  app.use((error: ErrorWithStatus, req: Request, res: Response, next: NextFunction) => {
    // console.log(error);
    const status = error.statusCode ?? 500;
    const message = error.message;
    res.status(status).json({ message });
  });

  return app;
};
