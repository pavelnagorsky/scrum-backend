import { Router } from 'express';

import * as iterationControllers from '../controllers/iteration';

const router = Router({ mergeParams: true });

router.put('/', iterationControllers.createIteration);

router.patch('/:iterationId', iterationControllers.updateIteration);

router.delete('/:iterationId', iterationControllers.deleteIteration);

export default router;