import { Router } from 'express';

import * as projectControllers from '../controllers/project';
import { isAdmin } from '../middleware/isAdmin';

const router = Router();

router.get('/', projectControllers.getProjectsTitles);

router.get('/:projectId', projectControllers.getProject);

router.put('/', projectControllers.createProject);

router.post('/:projectId/join', projectControllers.joinProject);

router.post('/:projectId/acceptUser/:userId', isAdmin, projectControllers.acceptUser);

router.delete('/:projectId', isAdmin, projectControllers.deleteProject);

export default router;