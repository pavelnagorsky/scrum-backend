import { Types } from 'mongoose';

import { ErrorWithStatus, IMiddleware } from '../config/types';
import { Iteration } from '../models/iteration';
import { Project } from '../models/project';
import { Task } from '../models/task';
import { errorHandler } from '../util/errorHandler';

// [admin] создать итерацию
export const createIteration: IMiddleware = async (req, res, next) => {
  const title: string = req.body.title;
  const deadline: string = req.body.deadline;
  const projectId = req.params.projectId;
  try {
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
    };
    project.iterations.push(createdIteration._id);
    await project.save();
    res.status(201).json({
      message: 'Iteration successfully created',
      iteration: createdIteration.toJSON()
    });
  } catch (err) {
    errorHandler(err, next);
  }
};

// [admin] обновить итерацию
export const updateIteration: IMiddleware = async (req, res, next) => {
  const title: string = req.body.title;
  const deadline: string = req.body.deadline;
  const iterationId = req.params.iterationId;
  try {
    const iteration = await Iteration
      .findById(iterationId)
      .populate('tasks');
    if (!iteration) {
      const error: ErrorWithStatus = new Error('No iteration found');
      error.statusCode = 404;
      throw error;
    };
    iteration.title = title;
    iteration.deadline = new Date(deadline);
    const updatedIteration = await iteration.save();
    res.status(200).json({
      message: 'Iteration successfully updated',
      iteration: updatedIteration.toJSON()
    });
  } catch (err) {
    errorHandler(err, next);
  }
};

// [admin] удаление итерации
export const deleteIteration: IMiddleware = async (req, res, next) => {
  const iterationId = req.params.iterationId;
  const projectId = req.params.projectId;
  const deleteTasks = req.query.deleteTasks; // true | false
  try {
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
    };
    // скрываем от обычного пользователя информацию об очереди на вступление
    if (project.admin.toString() !== req.userId) {
      project.queue = [];
    };
    const iteration = await Iteration
      .findByIdAndDelete(iterationId)
    if (!iteration) {
      const error: ErrorWithStatus = new Error('No iteration found');
      error.statusCode = 404;
      throw error;
    };
    // удаляем итерацию из проекта
    project.iterations = project.iterations.filter(iter => {
      return iter._id.toString() !== iteration._id.toString()
    });
    // получаем массив _id всех тасков итерации
    let tasksForDelete: Types.ObjectId[] = [];
    for (const idArr of Object.values(iteration.tasks)) {
      tasksForDelete = [...tasksForDelete, ...idArr];
    };
    if (deleteTasks === 'true') {   // если админ выбрал удалить таски итерации
      await Task.deleteMany({ _id: { $in: tasksForDelete } })
    } else {                       // если админ выбрал переместить таски в бэклог
      project.backlog = [...project.backlog, ...tasksForDelete];
    };
    await project.save();
    res.status(200).json({
      message: 'Iteration successfully deleted',
      project: project.toJSON()
    });
  } catch (err) {
    errorHandler(err, next);
  }
}

