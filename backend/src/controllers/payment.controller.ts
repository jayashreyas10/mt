import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { PaymentService } from '../services/payment.service.js';

export class PaymentController {
  static async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const payments = await PaymentService.listPayments(req.user!.userId, id);
      res.json(payments);
    } catch (err) {
      next(err);
    }
  }

  static async record(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const payment = await PaymentService.recordPayment(req.user!.userId, id, req.body);
      res.status(201).json(payment);
    } catch (err) {
      next(err);
    }
  }
}
