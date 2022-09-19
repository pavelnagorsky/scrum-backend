import * as ProjectService from '../services/project.service';
import { errorHandler } from '../util/errorHandler';
import { IMiddleware } from '../config/types';
import { validate } from '../util/validate';

// получить список проектов для пользователя
export const getProjectsTitles: IMiddleware = async (req, res, next) => {
  try {
    const projectsTitles = await ProjectService.getProjectsTitles(req.userId);
    res.status(200).json({
      message: 'Projects successfully fetched',
      projects: projectsTitles
    })
  } catch (err) {
    errorHandler(err, next);
  }
}

// получить один проект по id
export const getProject: IMiddleware = async (req, res, next) => {
  const projectId: string = req.params.projectId;
  try {
    const project = await ProjectService.getProject(projectId, req.userId);
    res.status(200).json({
      message: 'Project successfully fetched',
      project: project.toJSON()
    })
  } catch (err) {
    errorHandler(err, next);
  }
}

// создать проект
export const createProject: IMiddleware = async (req, res, next) => {
  const title: string = req.body.title;
  const description: string = req.body.description;
  const adminId = req.userId;
  try {
    // валидация ввода
    validate(req);
    const populatedProject = await ProjectService.createProject(title, description, adminId);
    res.status(201).json({
      message: 'Project successfully created',
      project: populatedProject.toJSON()
    });
  } catch (err) {
    errorHandler(err, next);
  }
}

// обновить проект
export const updateProject: IMiddleware = async (req, res, next) => {
  const projectId = req.params.projectId;
  const projectTitle: string = req.body.title;
  const projectDescription: string = req.body.description;
  try {
    // валидация ввода
    validate(req);
    const projectData = await ProjectService.updateProject(projectId, projectTitle, projectDescription);
    res.status(200).json({
      message: 'Project successfully updated',
      project: projectData
    });
  } catch (err) {
    errorHandler(err, next);
  }
}

// запроситься на участие в проекте
export const joinProject: IMiddleware = async (req, res, next) => {
  const projectId = req.params.projectId;
  try {
    const userId = await ProjectService.joinProject(projectId, req.userId);
    res.status(200).json({
      message: 'User is now in the queue',
      userId: userId
    })
  } catch (err) {
    errorHandler(err, next);
  }
}

// покинуть проект 
export const leaveProject: IMiddleware = async (req, res, next) => {
  const projectId = req.params.projectId;
  try {
    const { userId, projId } = await ProjectService.leaveProject(projectId, req.userId);
    res.status(200).json({
      message: 'User successfully left the project',
      userId: userId,
      projectId: projId
    })
  } catch (err) {
    errorHandler(err, next);
  }
}

// [admin] принять пользователя в проект
export const acceptUser: IMiddleware = async (req, res, next) => {
  const projectId = req.params.projectId;
  const joinedUserId = req.params.userId;
  try {
    const joinedUserData = await ProjectService.acceptUser(projectId, joinedUserId);
    res.status(200).json({
      message: 'User is now joined',
      userId: joinedUserData.userId,
      username: joinedUserData.username
    })
  } catch (err) {
    errorHandler(err, next);
  }
}

// [admin] отклонить запрос пользователя на вступление в проект
export const rejectUser: IMiddleware = async (req, res, next) => {
  const projectId = req.params.projectId;
  const userId = req.params.userId;
  try {
    const rejectedUserId = await ProjectService.rejectUser(projectId, userId);
    res.status(200).json({
      message: 'User participation is rejected',
      userId: rejectedUserId
    })
  } catch (err) {
    errorHandler(err, next);
  }
}

// [admin] удалить проект
export const deleteProject: IMiddleware = async (req, res, next) => {
  const projectId = req.params.projectId;
  try {
    const deletedProjectId = await ProjectService.deleteProject(projectId);
    res.status(200).json({
      message: 'Project successfully deleted',
      projectId: deletedProjectId
    })
  } catch (err) {
    errorHandler(err, next);
  }
}