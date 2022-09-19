import { ErrorWithStatus } from "../config/types";
import { IIteration, Iteration } from "../models/iteration.model";
import { Project } from "../models/project.model";
import { Task } from "../models/task.model";

// интерфейс req.body.storageData для изменения хранилища задачи
export interface IMoveTaskRequest {
  moveFromBacklog: boolean;
  moveFromIteration: {
    iterationId: string;
    storage: "TODO" | "DOING" | "DONE";
  } | null;
  moveToBacklog: boolean;
  moveToIteration: {
    iterationId: string;
    storage: "TODO" | "DOING" | "DONE";
  } | null;
}

// создать новую задачу
export const createTask = (
  title: string,
  description: string,
  storyPoints: number,
  projectId: string
) => {
  const newTask = new Task({
    title,
    description,
    storyPoints,
    projectId
  });
  return newTask;
}

// создание задачи в итерации
export const addTaskToIteration = async (
  iterationId: string,
  newTask: ReturnType<typeof createTask>
) => {
  const iteration = await Iteration.findById(iterationId);
  if (!iteration) {
    const error: ErrorWithStatus = new Error('No iteration found');
    error.statusCode = 404;
    throw error;
  }
  const task = await newTask.save();
  iteration.tasks.TODO.push(task._id);
  await iteration.save();
  return task.toJSON()
}

// создание задачи в бэклоге
export const addTaskToBacklog = async (
  projectId: string,
  newTask: ReturnType<typeof createTask>
) => {
  const project = await Project.findById(projectId);
  if (!project) {
    const error: ErrorWithStatus = new Error('No project found');
    error.statusCode = 404;
    throw error;
  }
  const task = await newTask.save();
  project.backlog.push(task._id);
  await project.save();
  return task.toJSON()
}

// обновление контента задачи
export const updateTaskContent = async (
  title: string,
  description: string,
  storyPoints: number,
  taskId: string
) => {
  const task = await Task.findById(taskId);
  if (!task) {
    const error: ErrorWithStatus = new Error('No task found');
    error.statusCode = 404;
    throw error;
  }
  task.title = title;
  task.description = description;
  task.storyPoints = storyPoints;
  await task.save();
  return task.toJSON()
}

// обновление хранилища задачи
export const updateTaskStorage = async (
  projectId: string,
  taskId: string,
  storageData: IMoveTaskRequest
) => {
  // проверяем существование задачи
  const task = await Task.findById(taskId);
  if (!task) {
    const error: ErrorWithStatus = new Error('No task found');
    error.statusCode = 404;
    throw error;
  }
  // находим проект
  const project = await Project.findById(projectId);
  if (!project) {
    const error: ErrorWithStatus = new Error('No project found');
    error.statusCode = 404;
    throw error;
  }

  // [ действия для удаления задачи из предыдущего местонахождения ]

  let isTaskRemoved = false; // была ли убрана задача из прыдыдущего местоположения

  // если задачу переносим из бэклога, то очищаем бэклог проекта
  if (storageData.moveFromBacklog) {
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
    }
    const iterationFrom = await Iteration.findById(storageData.moveFromIteration.iterationId);
    if (!iterationFrom) {
      const error: ErrorWithStatus = new Error('No iteration found');
      error.statusCode = 404;
      throw error;
    }
    iterationFrom.tasks[storageData.moveFromIteration.storage] =
      iterationFrom.tasks[storageData.moveFromIteration.storage].filter(id => {
        // отмечаем что задача была перенесена
        if (id.toString() === task._id.toString()) {
          isTaskRemoved = true;
        };
        return id.toString() !== task._id.toString()
      });
    await iterationFrom.save();
  }

  // [ если задача не была найдена и перенесена из предыдущего хранилища - ошибка ]

  if (!isTaskRemoved) {
    const error: ErrorWithStatus = new Error('Incorrect request payload');
    error.statusCode = 422;
    throw error;
  }

  // [ действия для добавления задачи в новое местонахождение ]

  // если задачу переносим в бэклог
  if (storageData.moveToBacklog) {
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
  }

  await project.save();
  return task._id.toString()
}

// удаление задачи
export const deleteTask = async (taskId: string) => {
  const deletedTask = await Task.findByIdAndDelete(taskId);
  if (!deletedTask) {
    const error: ErrorWithStatus = new Error('No task found');
    error.statusCode = 404;
    throw error;
  }
  const project = await Project
    .findById(deletedTask.projectId)
    .populate<{ iterations: IIteration[] }>('iterations');
  if (!project) {
    const error: ErrorWithStatus = new Error('No project found');
    error.statusCode = 404;
    throw error;
  }

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
  }

  return deletedTask._id.toString()
}