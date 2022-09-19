import { Types } from "mongoose";

import { ErrorWithStatus } from "../config/types";
import { Iteration } from "../models/iteration.model";
import { Project } from "../models/project.model";
import { Task } from "../models/task.model";
import { User } from "../models/user.model";

// получить список проектов для пользователя
export const getProjectsTitles = async (userId?: string) => {
  const projectsTitles = await Project
    .find({
      users: { $in: userId }
    })
    .select(['title', 'createdAt'])
  if (!projectsTitles) {
    const error: ErrorWithStatus = new Error('No projects found');
    error.statusCode = 404;
    throw error;
  };
  return projectsTitles;
}

// получить данные о проекте по id
export const getProject = async (projectId: string, userId?: string) => {
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
  if (project.admin.toString() !== userId) {
    project.queue = [];
  }
  return project;
}

// создание проекта
export const createProject = async (
  title: string,
  description: string,
  adminId?: string
) => {
  if (!adminId) {
    const error: ErrorWithStatus = new Error('No userId found');
    error.statusCode = 403;
    throw error;
  }
  const project = new Project({
    title,
    description,
    admin: adminId,
    users: [adminId]
  });
  const createdProject = await project.save();
  const populatedProject = await createdProject.populate('users', 'username');
  return populatedProject;
}

// обновить проект
export const updateProject = async (
  projectId: string,
  projectTitle: string,
  projectDescription: string
) => {
  const project = await Project
    .findById(projectId)
    .select(['title', 'description']);
  if (!project) {
    const error: ErrorWithStatus = new Error('No project found');
    error.statusCode = 404;
    throw error;
  }
  project.title = projectTitle;
  project.description = projectDescription;
  const updatedProject = await project.save();
  return {
    _id: updatedProject._id.toString(),
    description: updatedProject.description,
    title: updatedProject.title
  }
}

// запроситься на участие в проекте
export const joinProject = async (projectId: string, userId?: string) => {
  // проверка валидности projectId
  try {
    new Types.ObjectId(projectId);
  } catch (err) {
    const error: ErrorWithStatus = new Error('No project found');
    error.statusCode = 404;
    throw error;
  }
  const project = await Project.findById(projectId);
  if (!project) {
    const error: ErrorWithStatus = new Error('No project found');
    error.statusCode = 404;
    throw error;
  };
  const user = await User
    .findById(userId)
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
    userId: new Types.ObjectId(userId),
    username: user.username,
    email: user.email
  });
  await project.save();
  return userId;
}

// покинуть проект 
export const leaveProject = async (projectId: string, userId?: string) => {
  const project = await Project.findById(projectId);
  if (!project) {
    const error: ErrorWithStatus = new Error('No project found');
    error.statusCode = 404;
    throw error;
  }
  if (project.admin.toString() === userId) {
    const error: ErrorWithStatus = new Error("Admin can't leave project");
    error.statusCode = 403;
    throw error;
  }
  project.users = project.users.filter(user => {
    return user._id.toString() !== userId
  });
  await project.save();
  return { 
    userId: userId,
    projId: project._id.toString()
  }
}

// [admin] принять пользователя в проект
export const acceptUser = async (projectId: string, joinedUserId: string) => {
  const project = await Project.findById(projectId);
  if (!project) {
    const error: ErrorWithStatus = new Error('No project found');
    error.statusCode = 404;
    throw error;
  }
  const joinedUser = await User.findById(joinedUserId);
  if (!joinedUser) {
    const error: ErrorWithStatus = new Error('No user found');
    error.statusCode = 404;
    throw error;
  }
  // выносим вступившего пользователя из очереди ожидания
  project.queue = project.queue.filter(user => {
    return user.userId.toString() !== joinedUser._id.toString();
  });
  // добавляем его в сотрудиков проекта
  project.users.push(joinedUser._id);
  await project.save();
  return {
    userId: joinedUser._id.toString(),
    username: joinedUser.username
  }
}

// [admin] отклонить запрос пользователя на вступление в проект
export const rejectUser = async (projectId: string, userId: string) => {
  const project = await Project.findById(projectId);
  if (!project) {
    const error: ErrorWithStatus = new Error('No project found');
    error.statusCode = 404;
    throw error;
  }
  const rejectedUser = await User.findById(userId);
  if (!rejectedUser) {
    const error: ErrorWithStatus = new Error('No user found');
    error.statusCode = 404;
    throw error;
  }
  // выносим вступившего пользователя из очереди ожидания
  project.queue = project.queue.filter(user => {
    return user.userId.toString() !== rejectedUser._id.toString();
  });
  await project.save();
  return rejectedUser._id.toString();
}

// [admin] удалить проект
export const deleteProject = async (projectId: string) => {
  const deletedProject = await Project
    .findByIdAndDelete(projectId);
  if (!deletedProject) {
    const error: ErrorWithStatus = new Error('No project found');
    error.statusCode = 404;
    throw error;
  }
  // удалить итерации и задачи проекта
  await Iteration
    .deleteMany({ _id: { $in: deletedProject.iterations } });
  await Task
    .deleteMany({ projectId: deletedProject._id });

  return deletedProject._id.toString();
}