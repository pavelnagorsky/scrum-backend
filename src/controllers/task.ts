import { ErrorWithStatus, IMiddleware } from "../config/types";
import { IIteration, Iteration } from "../models/iteration";
import { Project } from "../models/project";
import { Task } from "../models/task";
import { errorHandler } from "../util/errorHandler";

// интерфейс req.body.storageData для изменения хранилища задачи
interface IMoveTaskRequest {
  moveFromBacklog: boolean,
  moveFromIteration: {
    iterationId: string;
    storage: "TODO" | "DOING" | "DONE"
  } | null;
  moveToBacklog: boolean,
  moveToIteration: {
    iterationId: string;
    storage: "TODO" | "DOING" | "DONE"
  } | null;
};

// создание нового таска
export const createTask: IMiddleware = async (req, res, next) => {
  const title: string = req.body.title;
  const description: string = req.body.description;
  const storyPoints: number = +req.body.storyPoints;
  const iterationId: string | undefined = req.body.iterationId;
  const projectId = req.params.projectId;
  try {
    const newTask = new Task({
      title,
      description,
      storyPoints,
      projectId
    });
    // создание задачи в итерации
    if (iterationId) {
      const iteration = await Iteration.findById(iterationId);
      if (!iteration) {
        const error: ErrorWithStatus = new Error('No iteration found');
        error.statusCode = 404;
        throw error;
      };
      const task = await newTask.save();
      iteration.tasks.TODO.push(task._id);
      await iteration.save();
      res.status(201).json({
        message: "Task successfully created",
        task: task.toJSON()
      })
    } else {
      // создание задачи в бэклоге
      const project = await Project.findById(projectId);
      if (!project) {
        const error: ErrorWithStatus = new Error('No project found');
        error.statusCode = 404;
        throw error;
      };
      const task = await newTask.save();
      project.backlog.push(task._id);
      await project.save();
      res.status(201).json({
        message: "Task successfully created",
        task: task.toJSON()
      })
    };
  } catch (err) {
    errorHandler(err, next)
  }
};

// обновление контента задачи
export const updateTaskContent: IMiddleware = async (req, res, next) => {
  const title: string = req.body.title;
  const description: string = req.body.description;
  const storyPoints: number = +req.body.storyPoints;
  const taskId = req.params.taskId;
  try {
    const task = await Task.findById(taskId);
    if (!task) {
      const error: ErrorWithStatus = new Error('No task found');
      error.statusCode = 404;
      throw error;
    };
    task.title = title;
    task.description = description;
    task.storyPoints = storyPoints;
    await task.save();
    res.status(200).json({
      message: "Task successfully updated",
      task: task.toJSON()
    })
  } catch (err) {
    errorHandler(err, next)
  }
};

// обновление хранилища задачи
export const updateTaskStorage: IMiddleware = async (req, res, next) => {
  const projectId = req.params.projectId;
  const taskId = req.params.taskId;
  try {
    let isTaskRemoved = false; // была ли убрана задача из прыдыдущего местоположения
    // проверяем наличие корректного тела запроса
    const storageData: IMoveTaskRequest = req.body.storageData;
    if (!storageData) {
      const error: ErrorWithStatus = new Error('Incorrect request payload');
      error.statusCode = 422;
      throw error;
    }
    // проверяем существование задачи
    const task = await Task.findById(taskId);
    if (!task) {
      const error: ErrorWithStatus = new Error('No task found');
      error.statusCode = 404;
      throw error;
    };
    // находим проект
    const project = await Project.findById(projectId);
    if (!project) {
      const error: ErrorWithStatus = new Error('No project found');
      error.statusCode = 404;
      throw error;
    };

    // [ действия для удаления задачи из предыдущего местонахождения ]

    // если задачу переносим из бэклога, то очищаем бэклог проекта
    if (storageData.moveFromBacklog === true) {
      project.backlog = project.backlog.filter(id => {
        // отмечаем что задача была перенесена
        if (id.toString() === task._id.toString()) {
          isTaskRemoved = true;
        };
        return id.toString() !== task._id.toString();
      })
    } else {
      // иначе находим итерацию и чистим нужный раздел
      if (!storageData.moveFromIteration) {
        const error: ErrorWithStatus = new Error('Incorrect request payload');
        error.statusCode = 422;
        throw error;
      };
      const iterationFrom = await Iteration.findById(storageData.moveFromIteration.iterationId);
      if (!iterationFrom) {
        const error: ErrorWithStatus = new Error('No iteration found');
        error.statusCode = 404;
        throw error;
      };
      iterationFrom.tasks[storageData.moveFromIteration.storage] =
        iterationFrom.tasks[storageData.moveFromIteration.storage].filter(id => {
          // отмечаем что задача была перенесена
          if (id.toString() === task._id.toString()) {
            isTaskRemoved = true;
          };
          return id.toString() !== task._id.toString()
        });
      await iterationFrom.save();
    };

    // [ если задача не была найдена и перенесена из предыдущего хранилища - ошибка ]

    if (!isTaskRemoved) {
      const error: ErrorWithStatus = new Error('Incorrect request payload');
      error.statusCode = 422;
      throw error;
    }

    // [ действия для добавления задачи в новое местонахождение ]

    // если задачу переносим в бэклог
    if (storageData.moveToBacklog === true) {
      project.backlog.push(task._id);
    } else {
      // если задачу перемещаем в итерацию
      if (!storageData.moveToIteration) {
        const error: ErrorWithStatus = new Error('Incorrect request payload');
        error.statusCode = 422;
        throw error;
      };
      const iterationTo = await Iteration.findById(storageData.moveToIteration.iterationId);
      if (!iterationTo) {
        const error: ErrorWithStatus = new Error('No iteration found');
        error.statusCode = 404;
        throw error;
      };
      iterationTo.tasks[storageData.moveToIteration.storage].push(task._id);
      await iterationTo.save();
    };

    await project.save();

    res.status(200).json({
      message: "Task successfully moved",
      taskId: task._id.toString()
    })
  } catch (err) {
    errorHandler(err, next)
  }
};

// удаление задачи
export const deletetask: IMiddleware = async (req, res, next) => {
  const taskId = req.params.taskId;
  try {
    const deletedTask = await Task.findByIdAndDelete(taskId);
    if (!deletedTask) {
      const error: ErrorWithStatus = new Error('No task found');
      error.statusCode = 404;
      throw error;
    };
    const project = await Project
      .findById(deletedTask.projectId)
      .populate<{ iterations: IIteration[] }>('iterations');
    if (!project) {
      const error: ErrorWithStatus = new Error('No project found');
      error.statusCode = 404;
      throw error;
    };

    // удаляем ссылку на задачу из бэклога проекта если такая есть
    project.backlog = project.backlog.filter(id => {
      return id.toString() !== deletedTask._id.toString()
    });
    await project.save();

    // удаляем ссылку на задачу из итерации если такая есть
    const iteration = await Iteration
      .findOne({
        $or: [
          { 'tasks.TODO': deletedTask._id },
          { 'tasks.DOING': deletedTask._id },
          { 'tasks.DONE': deletedTask._id }
        ]
      });
    if (iteration) {
      iteration.tasks.TODO = iteration.tasks.TODO.filter(id => {
        return id.toString() !== deletedTask._id.toString();
      });
      iteration.tasks.DOING = iteration.tasks.DOING.filter(id => {
        return id.toString() !== deletedTask._id.toString();
      });
      iteration.tasks.DONE = iteration.tasks.DONE.filter(id => {
        return id.toString() !== deletedTask._id.toString();
      });
      await iteration.save();
    };

    res.status(200).json({
      message: "Task was successfully deleted",
      taskId: deletedTask._id.toString()
    })
  } catch (err) {
    errorHandler(err, next)
  }
}