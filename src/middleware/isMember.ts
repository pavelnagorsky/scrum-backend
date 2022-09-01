import { ErrorWithStatus, IMiddleware } from '../config/types';
import { Project } from '../models/project';
import { errorHandler } from '../util/errorHandler';

// проверка явялется ли пользователь участником проекта
export const isMember: IMiddleware = async (req, res, next) => {
  try {
    // находим проект
    const project = await Project
      .findById(req.params.projectId)
      .select('admin');

    if (!project) {
      const error: ErrorWithStatus = new Error('Project not found');
      error.statusCode = 404;
      throw error;
    };

    // если id пользователя нет в списке участников проекта - выходим
    let isUserMember = false;
    project.users.forEach(userId => {
      if (userId.toString() === req.userId) {
        isUserMember = true;
      }
    });
    if (!isUserMember) {
      const error: ErrorWithStatus = new Error('User is not a member of project');
      error.statusCode = 403;
      throw error;
    };

    next();
  } catch (err) {
    errorHandler(err, next);
  }
};