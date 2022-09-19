import { Router } from 'express';
import { body } from 'express-validator';

import * as iterationControllers from '../controllers/iteration.controller';

const router = Router({ mergeParams: true });

router.put(
  '/', [
  body('title')
    .isString()
    .trim()
    .isLength({ min: 3 }),
  body('deadline')
    .isString()
    .trim()
  ], iterationControllers.createIteration
);

router.patch(
  '/:iterationId', [
  body('title')
    .isString()
    .trim()
    .isLength({ min: 3 }),
  body('deadline')
    .isString()
    .trim()
  ], iterationControllers.updateIteration
);

router.delete('/:iterationId', iterationControllers.deleteIteration);

export default router;