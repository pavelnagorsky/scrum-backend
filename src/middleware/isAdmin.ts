import { ErrorWithStatus, IMiddleware } from '../config/types';
import { Project } from '../models/project';
import { User } from '../models/user';
import { errorHandler } from '../util/errorHandler';

// проверка прав админа
export const isAdmin: IMiddleware = async (req, res, next) => {
  try {
    // дешевая проверка существования пользователя
    const userCount = await User.countDocuments({ _id: req.userId });
    if (userCount !== 1) {
      const error: ErrorWithStatus = new Error('Not authenticated');
      error.statusCode = 401;
      throw error;
    };

    const project = await Project
      .findById(req.params.projectId)
      .select('admin');

    if (!project) {
      const error: ErrorWithStatus = new Error('Project not found');
      error.statusCode = 404;
      throw error;
    };

    // если пользователь не админ - выходим
    if (project.admin.toString() !== req.userId) {
      const error: ErrorWithStatus = new Error('User not admin');
      error.statusCode = 403;
      throw error;
    };

    next();
  } catch (err) {
    errorHandler(err, next);
  }
};