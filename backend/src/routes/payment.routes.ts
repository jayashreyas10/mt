import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { createActualPaymentSchema } from '@mortgage-tracker/shared';

const router = Router();

router.use(authenticate);

router.get('/:id/payments', PaymentController.list);
router.post('/:id/payments', validateBody(createActualPaymentSchema), PaymentController.record);

export default router;
