import { Router } from 'express';
import { body } from 'express-validator';

import * as taskControllers from '../controllers/task.controller';

const router = Router({ mergeParams: true });

router.put(
  '/', 
  [
    body('title')
      .isString()
      .trim()
      .isLength({ min: 1 }),
    body('description')
      .isString()
      .trim()
      .isLength({ min: 1 }),
    body('storyPoints')
      .matches(/^[0-5]+$/),
    body('iterationId')
      .isString()
      .trim()
  ],
  taskControllers.createTask
);

router.patch(
  '/:taskId', 
  [
    body('title')
      .isString()
      .trim()
      .isLength({ min: 1 }),
    body('description')
      .isString()
      .trim()
      .isLength({ min: 1 }),
    body('storyPoints')
      .matches(/^[0-5]+$/)
  ],
  taskControllers.updateTaskContent
);

router.post(
  '/:taskId/storage', 
  [
    body('storageData.moveFromBacklog')
      .isBoolean(),
    body('storageData.moveToBacklog')
      .isBoolean()
  ],
  taskControllers.updateTaskStorage
);

router.delete('/:taskId', taskControllers.deletetask);

export default router;