import * as IterationService from '../services/iteration.service';
import { IMiddleware } from '../config/types';
import { errorHandler } from '../util/errorHandler';
import { validate } from '../util/validate';

// [admin] создать итерацию
export const createIteration: IMiddleware = async (req, res, next) => {
  const title: string = req.body.title;
  const deadline: string = req.body.deadline;
  const projectId = req.params.projectId;
  try {
    // валидация ввода
    validate(req);
    const createdIteration = await IterationService.createIteration(
      projectId, title, deadline
    );
    res.status(201).json({
      message: 'Iteration successfully created',
      iteration: createdIteration
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
    // валидация ввода
    validate(req);
    const updatedIteration = await IterationService.updateIteration(
      iterationId, title, deadline
    );
    res.status(200).json({
      message: 'Iteration successfully updated',
      iteration: updatedIteration
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
    const project = await IterationService.deleteIteration(
      projectId,
      iterationId,
      deleteTasks?.toString(),
      req.userId
    );
    res.status(200).json({
      message: 'Iteration successfully deleted',
      project: project
    });
  } catch (err) {
    errorHandler(err, next);
  }
}