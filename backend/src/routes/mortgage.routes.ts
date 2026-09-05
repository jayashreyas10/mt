import { Router } from 'express';
import { MortgageController } from '../controllers/mortgage.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import {
  createMortgageSchema,
  updateMortgageSchema,
  extraPaymentRuleSchema,
  scenarioSchema
} from '@mortgage-tracker/shared';

const router = Router();

router.use(authenticate); // Require authentication for all mortgage endpoints

// Dashboard overview
router.get('/overview', MortgageController.getOverview);

// Mortgage CRUD
router.get('/', MortgageController.list);
router.post('/', validateBody(createMortgageSchema), MortgageController.create);
router.get('/:id', MortgageController.getById);
router.patch('/:id', validateBody(updateMortgageSchema), MortgageController.update);
router.delete('/:id', MortgageController.delete);

// Dynamic Amortization schedule calculation
router.get('/:id/amortization', MortgageController.getAmortization);

// Extra payment rules
router.post('/:id/extra-payments', validateBody(extraPaymentRuleSchema), MortgageController.addExtraPaymentRule);
router.delete('/:id/extra-payments/:ruleId', MortgageController.deleteExtraPaymentRule);

// Scenarios
router.post('/:id/scenarios', validateBody(scenarioSchema), MortgageController.saveScenario);
router.get('/:id/scenarios', MortgageController.getScenarios);
router.post('/:id/compare-scenarios', MortgageController.compareScenarios);

export default router;
