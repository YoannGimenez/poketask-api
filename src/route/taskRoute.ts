import { taskController } from '../controller/taskController';
import { authenticateJWT, checkOwnership } from '../middleware/authMiddleware';
import { router } from '../config/routerConfig';

router.get('/user/:id', authenticateJWT, checkOwnership('id'), taskController.getAllByUser);
router.get('/:id', authenticateJWT, taskController.getById);
router.post('/', authenticateJWT, taskController.create);
router.put('/:id', authenticateJWT, checkOwnership('id'), taskController.update);
router.delete('/:id', authenticateJWT, checkOwnership('id'), taskController.remove);

export default router;
