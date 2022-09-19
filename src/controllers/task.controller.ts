import * as TaskService from '../services/task.service';
import { ErrorWithStatus, IMiddleware } from "../config/types";
import { errorHandler } from "../util/errorHandler";
import { validate } from "../util/validate";

// создание нового таска
export const createTask: IMiddleware = async (req, res, next) => {
  const title: string = req.body.title;
  const description: string = req.body.description;
  const storyPoints: number = +req.body.storyPoints;
  const iterationId: string | undefined = req.body.iterationId;
  const projectId = req.params.projectId;
  try {
    // валидация ввода
    validate(req);
    // создание новой задачи
    const newTask = TaskService.createTask(
      title,
      description,
      storyPoints,
      projectId
    );
    // создание задачи в итерации
    if (iterationId) {
      const task = await TaskService.addTaskToIteration(iterationId, newTask);
      res.status(201).json({
        message: "Task successfully created",
        task: task
      })
    } else {
      // создание задачи в бэклоге
      const task = await TaskService.addTaskToBacklog(projectId, newTask);
      res.status(201).json({
        message: "Task successfully created",
        task: task
      })
    }
  } catch (err) {
    errorHandler(err, next)
  }
}

// обновление контента задачи
export const updateTaskContent: IMiddleware = async (req, res, next) => {
  const title: string = req.body.title;
  const description: string = req.body.description;
  const storyPoints: number = +req.body.storyPoints;
  const taskId = req.params.taskId;
  try {
    // валидация ввода
    validate(req);
    const task = await TaskService.updateTaskContent(
      title,
      description,
      storyPoints,
      taskId
    );
    res.status(200).json({
      message: "Task successfully updated",
      task: task
    })
  } catch (err) {
    errorHandler(err, next)
  }
}

// обновление хранилища задачи
export const updateTaskStorage: IMiddleware = async (req, res, next) => {
  const projectId = req.params.projectId;
  const taskId = req.params.taskId;
  try {
    // валидация ввода
    validate(req);
    // проверяем наличие корректного тела запроса
    const storageData: TaskService.IMoveTaskRequest = req.body.storageData;
    if (!storageData) {
      const error: ErrorWithStatus = new Error('Incorrect request payload');
      error.statusCode = 422;
      throw error;
    } 
    const movedTaskId = await TaskService.updateTaskStorage(
      projectId,
      taskId,
      storageData
    );
    res.status(200).json({
      message: "Task successfully moved",
      taskId: movedTaskId
    })
  } catch (err) {
    errorHandler(err, next)
  }
};

// удаление задачи
export const deletetask: IMiddleware = async (req, res, next) => {
  const taskId = req.params.taskId;
  try {
    const deletedTaskId = await TaskService.deleteTask(taskId);
    res.status(200).json({
      message: "Task was successfully deleted",
      taskId: deletedTaskId
    })
  } catch (err) {
    errorHandler(err, next)
  }
}