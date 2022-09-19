import { Types } from "mongoose";

import { ErrorWithStatus } from "../config/types";
import { Iteration } from "../models/iteration.model";
import { Project } from "../models/project.model";
import { Task } from "../models/task.model";

// [admin] создать итерацию
export const createIteration = async (
  projectId: string,
  title: string,
  deadline: string
) => {
  const iteration = new Iteration({
    title,
    deadline: new Date(deadline)
  });
  const createdIteration = await iteration.save();
  const project = await Project.findById(projectId);
  if (!project) {
    const error: ErrorWithStatus = new Error('No project found');
    error.statusCode = 404;
    throw error;
  }
  project.iterations.push(createdIteration._id);
  await project.save();
  return createdIteration.toJSON()
}

// [admin] обновить итерацию
export const updateIteration = async (
  iterationId: string, 
  title: string,
  deadline: string
) => {
  const iteration = await Iteration
    .findById(iterationId)
    .populate('tasks');
  if (!iteration) {
    const error: ErrorWithStatus = new Error('No iteration found');
    error.statusCode = 404;
    throw error;
  }
  iteration.title = title;
  iteration.deadline = new Date(deadline);
  const updatedIteration = await iteration.save();
  return updatedIteration.toJSON()
}

// [admin] удаление итерации
export const deleteIteration = async (
  projectId: string,
  iterationId: string,
  deleteTasks?: string,
  userId?: string
) => {
  const project = await Project
    .findById(projectId)
    .populate('backlog')
    .populate('users', 'username')
    .populate({
      path: 'iterations',
      populate: ['tasks.TODO', 'tasks.DOING', 'tasks.DONE']
    });
  if (!project) {
    const error: ErrorWithStatus = new Error('No project found');
    error.statusCode = 404;
    throw error;
  }
  // скрываем от обычного пользователя информацию об очереди на вступление
  if (project.admin.toString() !== userId) {
    project.queue = [];
  }
  const iteration = await Iteration
    .findByIdAndDelete(iterationId)
  if (!iteration) {
    const error: ErrorWithStatus = new Error('No iteration found');
    error.statusCode = 404;
    throw error;
  }
  // удаляем итерацию из проекта
  project.iterations = project.iterations.filter(iter => {
    return iter._id.toString() !== iteration._id.toString()
  });
  // получаем массив _id всех тасков итерации
  let tasksForDelete: Types.ObjectId[] = [];
  for (const idArr of Object.values(iteration.tasks)) {
    tasksForDelete = [...tasksForDelete, ...idArr];
  }
  if (deleteTasks === 'true') {   // если админ выбрал удалить таски итерации
    await Task.deleteMany({ _id: { $in: tasksForDelete } })
  } else {                       // если админ выбрал переместить таски в бэклог
    project.backlog = [...project.backlog, ...tasksForDelete];
    await project.populate('backlog');
  }
  await project.save();
  return project.toJSON()
}