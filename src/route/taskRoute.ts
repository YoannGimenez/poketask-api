import { taskController } from '../controller/taskController';
import { authenticateJWT, checkOwnership } from '../middleware/authMiddleware';
import { router } from '../config/routerConfig';
import { createTaskSchema } from '../utils/validationSchemas';
import { validateData } from '../middleware/validationMiddleware';


router.use(authenticateJWT);

router.get('/my-tasks', taskController.getMyTasks);
router.post('/', validateData(createTaskSchema), taskController.create);



router.get('/:id', taskController.getById);
router.put('/:id', checkOwnership('id'), taskController.update);
router.delete('/:id', checkOwnership('id'), taskController.remove);

export default router;
