import { prisma } from '../db.js';
import {
  calculateMonthlyPayment,
  generateAmortizationSchedule,
  calculateExtraPaymentImpact,
  compareScenarios,
  CreateMortgageInput,
  UpdateMortgageInput,
  ExtraPaymentRuleInput,
  ScenarioInput,
  ExtraPaymentRule as EngineExtraPaymentRule
} from '@mortgage-tracker/shared';

export class MortgageService {
  static async listUserMortgages(userId: string) {
    return prisma.mortgage.findMany({
      where: { userId },
      include: {
        property: true,
        extraPaymentRules: true,
        actualPayments: {
          orderBy: { paymentDate: 'desc' },
          take: 5,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getMortgageById(userId: string, mortgageId: string) {
    const mortgage = await prisma.mortgage.findFirst({
      where: { id: mortgageId, userId },
      include: {
        property: true,
        extraPaymentRules: true,
        actualPayments: {
          orderBy: { paymentDate: 'desc' },
        },
        scenarios: true,
      },
    });

    if (!mortgage) {
      const error: any = new Error('Mortgage not found');
      error.statusCode = 404;
      throw error;
    }

    return mortgage;
  }

  static async createMortgage(userId: string, data: CreateMortgageInput) {
    const scheduledPayment = data.scheduledPayment || calculateMonthlyPayment(
      data.originalBalance,
      data.interestRate,
      data.termYears
    );

    const currentBalance = data.currentBalance !== undefined ? data.currentBalance : data.originalBalance;

    // Create property if propertyName provided
    let propertyId: string | undefined;
    if (data.propertyName) {
      const prop = await prisma.property.create({
        data: {
          propertyName: data.propertyName,
          address: data.propertyAddress,
          propertyValue: data.propertyValue,
          purchasePrice: data.purchasePrice,
        },
      });
      propertyId = prop.id;
    }

    const mortgage = await prisma.mortgage.create({
      data: {
        userId,
        propertyId,
        name: data.name,
        originalBalance: data.originalBalance,
        currentBalance,
        interestRate: data.interestRate,
        termYears: data.termYears,
        startDate: new Date(data.startDate),
        paymentFrequency: data.paymentFrequency,
        scheduledPayment,
        propertyTaxMonthly: data.propertyTaxMonthly,
        homeInsuranceMonthly: data.homeInsuranceMonthly,
        hoaMonthly: data.hoaMonthly,
      },
      include: {
        property: true,
      },
    });

    return mortgage;
  }

  static async updateMortgage(userId: string, mortgageId: string, data: UpdateMortgageInput) {
    await this.getMortgageById(userId, mortgageId); // ensure ownership

    let scheduledPayment = data.scheduledPayment;
    if (scheduledPayment === undefined && (data.originalBalance || data.interestRate || data.termYears)) {
      const existing = await prisma.mortgage.findUnique({ where: { id: mortgageId } });
      if (existing) {
        scheduledPayment = calculateMonthlyPayment(
          data.originalBalance || existing.originalBalance,
          data.interestRate !== undefined ? data.interestRate : existing.interestRate,
          data.termYears || existing.termYears
        );
      }
    }

    return prisma.mortgage.update({
      where: { id: mortgageId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.originalBalance !== undefined && { originalBalance: data.originalBalance }),
        ...(data.currentBalance !== undefined && { currentBalance: data.currentBalance }),
        ...(data.interestRate !== undefined && { interestRate: data.interestRate }),
        ...(data.termYears !== undefined && { termYears: data.termYears }),
        ...(data.startDate && { startDate: new Date(data.startDate) }),
        ...(data.paymentFrequency && { paymentFrequency: data.paymentFrequency }),
        ...(scheduledPayment !== undefined && { scheduledPayment }),
        ...(data.propertyTaxMonthly !== undefined && { propertyTaxMonthly: data.propertyTaxMonthly }),
        ...(data.homeInsuranceMonthly !== undefined && { homeInsuranceMonthly: data.homeInsuranceMonthly }),
        ...(data.hoaMonthly !== undefined && { hoaMonthly: data.hoaMonthly }),
      },
      include: {
        property: true,
        extraPaymentRules: true,
      },
    });
  }

  static async deleteMortgage(userId: string, mortgageId: string) {
    await this.getMortgageById(userId, mortgageId);
    return prisma.mortgage.delete({
      where: { id: mortgageId },
    });
  }

  static async getAmortizationSchedule(
    userId: string,
    mortgageId: string,
    customRules?: {
      extraMonthly?: number;
      oneTimeAmount?: number;
      oneTimeMonth?: number;
      oneTimeDate?: string;
    }
  ) {
    const mortgage = await this.getMortgageById(userId, mortgageId);

    const rules: EngineExtraPaymentRule[] = mortgage.extraPaymentRules.map(r => ({
      id: r.id,
      type: r.type as any,
      amount: r.amount,
      startMonth: r.startMonth || undefined,
      startDate: r.startDate ? r.startDate.toISOString().split('T')[0] : undefined,
      targetMonth: r.targetMonth || undefined,
      targetDate: r.targetDate ? r.targetDate.toISOString().split('T')[0] : undefined,
    }));

    // Inject temporary simulation rules if passed in query
    if (customRules?.extraMonthly && customRules.extraMonthly > 0) {
      rules.push({
        type: 'RECURRING_MONTHLY',
        amount: customRules.extraMonthly,
        startMonth: 1,
      });
    }

    if (customRules?.oneTimeAmount && customRules.oneTimeAmount > 0) {
      rules.push({
        type: 'ONE_TIME',
        amount: customRules.oneTimeAmount,
        targetMonth: customRules.oneTimeMonth,
        targetDate: customRules.oneTimeDate,
      });
    }

    const startDateStr = mortgage.startDate.toISOString().split('T')[0];

    const schedule = generateAmortizationSchedule(
      {
        principal: mortgage.originalBalance,
        annualInterestRate: mortgage.interestRate,
        termYears: mortgage.termYears,
        startDate: startDateStr,
        scheduledPayment: mortgage.scheduledPayment,
      },
      rules
    );

    const impact = calculateExtraPaymentImpact(
      {
        principal: mortgage.originalBalance,
        annualInterestRate: mortgage.interestRate,
        termYears: mortgage.termYears,
        startDate: startDateStr,
        scheduledPayment: mortgage.scheduledPayment,
      },
      rules
    );

    return {
      mortgage: {
        id: mortgage.id,
        name: mortgage.name,
        originalBalance: mortgage.originalBalance,
        currentBalance: mortgage.currentBalance,
        interestRate: mortgage.interestRate,
        termYears: mortgage.termYears,
        scheduledPayment: mortgage.scheduledPayment,
      },
      schedule: schedule.schedule,
      summary: schedule.summary,
      impact,
    };
  }

  static async addExtraPaymentRule(userId: string, mortgageId: string, rule: ExtraPaymentRuleInput) {
    await this.getMortgageById(userId, mortgageId);

    return prisma.extraPaymentRule.create({
      data: {
        mortgageId,
        type: rule.type,
        amount: rule.amount,
        startMonth: rule.startMonth,
        startDate: rule.startDate ? new Date(rule.startDate) : null,
        targetMonth: rule.targetMonth,
        targetDate: rule.targetDate ? new Date(rule.targetDate) : null,
      },
    });
  }

  static async deleteExtraPaymentRule(userId: string, mortgageId: string, ruleId: string) {
    await this.getMortgageById(userId, mortgageId);

    return prisma.extraPaymentRule.delete({
      where: { id: ruleId },
    });
  }

  static async saveScenario(userId: string, mortgageId: string, data: ScenarioInput) {
    await this.getMortgageById(userId, mortgageId);

    return prisma.scenario.create({
      data: {
        mortgageId,
        name: data.name,
        configJson: JSON.stringify(data),
      },
    });
  }

  static async getScenarios(userId: string, mortgageId: string) {
    const mortgage = await this.getMortgageById(userId, mortgageId);
    return mortgage.scenarios;
  }

  static async compareScenarios(userId: string, mortgageId: string, scenarios: any[]) {
    const mortgage = await this.getMortgageById(userId, mortgageId);
    const startDateStr = mortgage.startDate.toISOString().split('T')[0];

    return compareScenarios(
      {
        principal: mortgage.originalBalance,
        annualInterestRate: mortgage.interestRate,
        termYears: mortgage.termYears,
        startDate: startDateStr,
        scheduledPayment: mortgage.scheduledPayment,
      },
      scenarios
    );
  }

  static async getDashboardOverview(userId: string) {
    const mortgages = await prisma.mortgage.findMany({
      where: { userId },
      include: {
        property: true,
        actualPayments: true,
      },
    });

    const totalMortgages = mortgages.length;
    let totalOriginalLoan = 0;
    let totalCurrentBalance = 0;
    let totalMonthlyPayment = 0;
    let totalPrincipalPaid = 0;
    let totalInterestPaid = 0;

    for (const m of mortgages) {
      totalOriginalLoan += m.originalBalance;
      totalCurrentBalance += m.currentBalance;
      totalMonthlyPayment += (m.scheduledPayment + m.propertyTaxMonthly + m.homeInsuranceMonthly + m.hoaMonthly);

      for (const p of m.actualPayments) {
        totalPrincipalPaid += (p.principalPaid + p.extraPrincipal);
        totalInterestPaid += p.interestPaid;
      }
    }

    const overallProgress = totalOriginalLoan > 0
      ? Math.min(100, Math.max(0, ((totalOriginalLoan - totalCurrentBalance) / totalOriginalLoan) * 100))
      : 0;

    return {
      totalMortgages,
      totalOriginalLoan: Math.round(totalOriginalLoan * 100) / 100,
      totalCurrentBalance: Math.round(totalCurrentBalance * 100) / 100,
      totalMonthlyPayment: Math.round(totalMonthlyPayment * 100) / 100,
      totalPrincipalPaid: Math.round(totalPrincipalPaid * 100) / 100,
      totalInterestPaid: Math.round(totalInterestPaid * 100) / 100,
      overallProgress: Math.round(overallProgress * 10) / 10,
      mortgages: mortgages.map(m => ({
        id: m.id,
        name: m.name,
        propertyName: m.property?.propertyName || m.name,
        originalBalance: m.originalBalance,
        currentBalance: m.currentBalance,
        interestRate: m.interestRate,
        termYears: m.termYears,
        scheduledPayment: m.scheduledPayment,
        monthlyTotal: m.scheduledPayment + m.propertyTaxMonthly + m.homeInsuranceMonthly + m.hoaMonthly,
        startDate: m.startDate.toISOString().split('T')[0],
      })),
    };
  }
}
