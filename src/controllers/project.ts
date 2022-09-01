import { Types } from 'mongoose';

import { Project } from '../models/project';
import { User } from '../models/user';
import { Task } from '../models/task';
import { errorHandler } from '../util/errorHandler';
import { ErrorWithStatus, IMiddleware } from '../config/types';
import { Iteration } from '../models/iteration';

// получить список проектов для пользователя
export const getProjectsTitles: IMiddleware = async (req, res, next) => {
  try {
    const projectsTitles = await Project
      .find({
        users: { $in: req.userId }
      })
      .select(['title', 'createdAt'])
    if (!projectsTitles) {
      const error: ErrorWithStatus = new Error('No projects found');
      error.statusCode = 404;
      throw error;
    };
    res.status(200).json({
      message: 'Projects successfully fetched',
      projects: projectsTitles
    })
  } catch (err) {
    errorHandler(err, next);
  }
};

// получить один проект по id
export const getProject: IMiddleware = async (req, res, next) => {
  const projectId: string = req.params.projectId;
  try {
    const project = await Project
      .findById(projectId)
      .populate('users', 'username')
      .populate('backlog')
      .populate({
        path: 'iterations',
        populate: ['tasks.TODO', 'tasks.DOING', 'tasks.DONE']
      });
    if (!project) {
      const error: ErrorWithStatus = new Error('No project found');
      error.statusCode = 404;
      throw error;
    };
    // скрываем от обычного пользователя информацию об очереди на вступление
    if (project.admin.toString() !== req.userId) {
      project.queue = [];
    };
    res.status(200).json({
      message: 'Project successfully fetched',
      project: project.toJSON()
    })
  } catch (err) {
    errorHandler(err, next);
  }
};

// создать проект
export const createProject: IMiddleware = async (req, res, next) => {
  const title: string = req.body.title;
  const description: string = req.body.description;
  const adminId = req.userId;
  try {
    const project = new Project({
      title,
      description,
      admin: adminId,
      users: [adminId]
    });
    const createdProject = await project.save();
    const populatedProject = await createdProject.populate('users', 'username');
    res.status(201).json({
      message: 'Project successfully created',
      project: populatedProject.toJSON()
    });
  } catch (err) {
    errorHandler(err, next);
  }
};

// запроситься на участие в проекте
export const joinProject: IMiddleware = async (req, res, next) => {
  const projectId = req.params.projectId;
  try {
    // проверка валидности projectId
    try {
      new Types.ObjectId(projectId);
    } catch (err) {
      const error: ErrorWithStatus = new Error('No project found');
      error.statusCode = 404;
      throw error;
    };
    const project = await Project.findById(projectId);
    if (!project) {
      const error: ErrorWithStatus = new Error('No project found');
      error.statusCode = 404;
      throw error;
    };
    const user = await User
      .findById(req.userId)
      .select(['username', 'email']);
    if (!user) {
      const error: ErrorWithStatus = new Error('No user found');
      error.statusCode = 404;
      throw error;
    };

    if (project.users.includes(user._id)) {
      const error: ErrorWithStatus = new Error('User is already in project');
      error.statusCode = 400;
      throw error;
    };

    let isUserInQueue = false;
    for (const userInfo of project.queue) {
      if (userInfo.userId.toString() === user._id.toString()) {
        isUserInQueue = true;
      }
    };
    if (isUserInQueue) {
      const error: ErrorWithStatus = new Error('User is already in queue');
      error.statusCode = 400;
      throw error;
    };

    project.queue.push({
      userId: new Types.ObjectId(req.userId),
      username: user.username,
      email: user.email
    });
    await project.save();
    res.status(200).json({
      message: 'User is now in the queue',
      userId: req.userId
    })
  } catch (err) {
    errorHandler(err, next);
  }
};

// [admin] принять пользователя в проект
export const acceptUser: IMiddleware = async (req, res, next) => {
  const projectId = req.params.projectId;
  const joinedUserId = req.params.userId;
  try {
    const project = await Project.findById(projectId);
    if (!project) {
      const error: ErrorWithStatus = new Error('No project found');
      error.statusCode = 404;
      throw error;
    };
    const joinedUser = await User.findById(joinedUserId);
    if (!joinedUser) {
      const error: ErrorWithStatus = new Error('No user found');
      error.statusCode = 404;
      throw error;
    };
    // выносим вступившего пользователя из очереди ожидания
    project.queue = project.queue.filter(user => {
      return user.userId.toString() !== joinedUser._id.toString();
    });
    // добавляем его в сотрудиков проекта
    project.users.push(joinedUser._id)
    await project.save();
    res.status(200).json({
      message: 'User is now joined',
      userId: joinedUser._id.toString()
    })
  } catch (err) {
    errorHandler(err, next);
  }
};

// [admin] удалить проект
export const deleteProject: IMiddleware = async (req, res, next) => {
  const projectId = req.params.projectId;
  try {
    const deletedProject = await Project
      .findByIdAndDelete(projectId);
    if (!deletedProject) {
      const error: ErrorWithStatus = new Error('No project found');
      error.statusCode = 404;
      throw error;
    };
    // удалить задачи проекта
    await Iteration
      .find({ _id: { $in: deletedProject.iterations } })
    await Task
      .deleteMany({ projectId: deletedProject._id });
    res.status(200).json({
      message: 'Project successfully deleted',
      projectId: deletedProject._id.toString()
    })
  } catch (err) {
    errorHandler(err, next);
  }
};