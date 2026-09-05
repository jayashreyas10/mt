import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { MortgageService } from '../services/mortgage.service.js';

export class MortgageController {
  static async getOverview(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const overview = await MortgageService.getDashboardOverview(req.user!.userId);
      res.json(overview);
    } catch (err) {
      next(err);
    }
  }

  static async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const mortgages = await MortgageService.listUserMortgages(req.user!.userId);
      res.json(mortgages);
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const mortgage = await MortgageService.getMortgageById(req.user!.userId, id);
      res.json(mortgage);
    } catch (err) {
      next(err);
    }
  }

  static async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const mortgage = await MortgageService.createMortgage(req.user!.userId, req.body);
      res.status(201).json(mortgage);
    } catch (err) {
      next(err);
    }
  }

  static async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const mortgage = await MortgageService.updateMortgage(req.user!.userId, id, req.body);
      res.json(mortgage);
    } catch (err) {
      next(err);
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      await MortgageService.deleteMortgage(req.user!.userId, id);
      res.json({ message: 'Mortgage deleted successfully' });
    } catch (err) {
      next(err);
    }
  }

  static async getAmortization(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const extraMonthly = req.query.extraMonthly ? parseFloat(req.query.extraMonthly as string) : undefined;
      const oneTimeAmount = req.query.oneTimeAmount ? parseFloat(req.query.oneTimeAmount as string) : undefined;
      const oneTimeMonth = req.query.oneTimeMonth ? parseInt(req.query.oneTimeMonth as string, 10) : undefined;
      const oneTimeDate = req.query.oneTimeDate as string | undefined;

      const schedule = await MortgageService.getAmortizationSchedule(
        req.user!.userId,
        id,
        { extraMonthly, oneTimeAmount, oneTimeMonth, oneTimeDate }
      );
      res.json(schedule);
    } catch (err) {
      next(err);
    }
  }

  static async addExtraPaymentRule(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const rule = await MortgageService.addExtraPaymentRule(req.user!.userId, id, req.body);
      res.status(201).json(rule);
    } catch (err) {
      next(err);
    }
  }

  static async deleteExtraPaymentRule(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const ruleId = req.params.ruleId as string;
      await MortgageService.deleteExtraPaymentRule(req.user!.userId, id, ruleId);
      res.json({ message: 'Extra payment rule removed successfully' });
    } catch (err) {
      next(err);
    }
  }

  static async saveScenario(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const scenario = await MortgageService.saveScenario(req.user!.userId, id, req.body);
      res.status(201).json(scenario);
    } catch (err) {
      next(err);
    }
  }

  static async getScenarios(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const scenarios = await MortgageService.getScenarios(req.user!.userId, id);
      res.json(scenarios);
    } catch (err) {
      next(err);
    }
  }

  static async compareScenarios(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const results = await MortgageService.compareScenarios(req.user!.userId, id, req.body.scenarios);
      res.json(results);
    } catch (err) {
      next(err);
    }
  }
}
