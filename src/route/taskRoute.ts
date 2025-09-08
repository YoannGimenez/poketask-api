import { taskController } from '../controller/taskController';
import { authenticateJWT } from '../middleware/authMiddleware';
import { createTaskSchema, taskIdSchema } from '../utils/validationSchemas';
import { validateData, validateParams } from '../middleware/validationMiddleware';
import { Router } from 'express';

const router = Router();

router.use(authenticateJWT);

router.get('/my-tasks', taskController.getMyTasks);
router.post('/', validateData(createTaskSchema), taskController.create);
router.patch('/:id/complete',validateParams(taskIdSchema), taskController.completeTask);
router.patch('/:id/edit', validateParams(taskIdSchema), validateData(createTaskSchema.partial()), taskController.update);
router.delete('/:id/delete', validateParams(taskIdSchema), taskController.remove);

export default router;
