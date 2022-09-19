import { Router } from 'express';
import { body } from 'express-validator';

import * as projectControllers from '../controllers/project.controller';
import { isAdmin } from '../middleware/isAdmin.middleware';

const router = Router();

router.get('/', projectControllers.getProjectsTitles);

router.get('/:projectId', projectControllers.getProject);

router.put(
  '/', [
  body('title')
    .isString()
    .trim()
    .isLength({ min: 3 }),
  body('description')
    .isString()
    .trim()
    .isLength({ min: 3 })
  ], projectControllers.createProject
);

router.patch(
  '/:projectId', 
  isAdmin, 
  [
    body('title')
      .isString()
      .trim()
      .isLength({ min: 3 }),
    body('description')
      .isString()
      .trim()
      .isLength({ min: 3 })
  ],
  projectControllers.updateProject
),

router.post('/:projectId/join', projectControllers.joinProject);

router.post('/:projectId/leave', projectControllers.leaveProject);

router.post('/:projectId/acceptUser/:userId', isAdmin, projectControllers.acceptUser);

router.post('/:projectId/rejectUser/:userId', isAdmin, projectControllers.rejectUser);

router.delete('/:projectId', isAdmin, projectControllers.deleteProject);

export default router;