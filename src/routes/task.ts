import { Router } from 'express';

import * as taskControllers from '../controllers/task';

const router = Router({ mergeParams: true });

router.put('/', taskControllers.createTask);

router.patch('/:taskId', taskControllers.updateTaskContent);

router.post('/:taskId/storage', taskControllers.updateTaskStorage);

router.delete('/:taskId', taskControllers.deletetask);

export default router;