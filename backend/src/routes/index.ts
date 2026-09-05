import { Router } from 'express';
import authRoutes from './auth.routes.js';
import mortgageRoutes from './mortgage.routes.js';
import paymentRoutes from './payment.routes.js';

const apiRouter = Router();

// Health check
apiRouter.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

apiRouter.use('/auth', authRoutes);
apiRouter.use('/mortgages', mortgageRoutes);
apiRouter.use('/mortgages', paymentRoutes);

export default apiRouter;
