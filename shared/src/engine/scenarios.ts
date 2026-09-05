import {
  MortgageInput,
  ExtraPaymentRule,
  ScenarioDefinition,
  ScenarioComparisonResult
} from './types.js';
import { generateAmortizationSchedule } from './amortization.js';
import { calculateExtraPaymentImpact } from './extraPayments.js';

export function compareScenarios(
  input: MortgageInput,
  scenarios: ScenarioDefinition[]
): ScenarioComparisonResult[] {
  const results: ScenarioComparisonResult[] = [];

  for (const scenario of scenarios) {
    const rules: ExtraPaymentRule[] = [];

    if (scenario.extraMonthlyAmount && scenario.extraMonthlyAmount > 0) {
      rules.push({
        type: 'RECURRING_MONTHLY',
        amount: scenario.extraMonthlyAmount,
        startMonth: 1,
      });
    }

    let oneTimeTotal = 0;
    if (scenario.oneTimePayments && scenario.oneTimePayments.length > 0) {
      for (const otp of scenario.oneTimePayments) {
        if (otp.amount > 0) {
          oneTimeTotal += otp.amount;
          rules.push({
            type: 'ONE_TIME',
            amount: otp.amount,
            targetMonth: otp.targetMonth,
            targetDate: otp.targetDate,
          });
        }
      }
    }

    const comparison = calculateExtraPaymentImpact(input, rules);

    results.push({
      scenarioId: scenario.id,
      scenarioName: scenario.name,
      monthlyPayment: comparison.baseline.monthlyPayment,
      extraMonthlyPayment: scenario.extraMonthlyAmount || 0,
      oneTimeTotal,
      payoffDate: comparison.accelerated.payoffDate,
      totalMonths: comparison.accelerated.totalMonths,
      monthsSaved: comparison.savings.monthsSaved,
      totalInterest: comparison.accelerated.totalInterest,
      interestSaved: comparison.savings.interestSaved,
      totalAmountPaid: comparison.accelerated.totalPaid,
    });
  }

  return results;
}
