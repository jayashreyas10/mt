import { Decimal } from 'decimal.js';
import {
  MortgageInput,
  ExtraPaymentRule,
  ExtraPaymentComparison
} from './types.js';
import { generateAmortizationSchedule } from './amortization.js';

export function calculateExtraPaymentImpact(
  input: MortgageInput,
  extraRules: ExtraPaymentRule[]
): ExtraPaymentComparison {
  const baseline = generateAmortizationSchedule(input, []);
  const accelerated = generateAmortizationSchedule(input, extraRules);

  const baselineInterest = new Decimal(baseline.summary.totalInterestPaid);
  const acceleratedInterest = new Decimal(accelerated.summary.totalInterestPaid);
  const interestSaved = baselineInterest.minus(acceleratedInterest).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();

  const baselineMonths = baseline.summary.totalPaymentsCount;
  const acceleratedMonths = accelerated.summary.totalPaymentsCount;
  const monthsSaved = Math.max(0, baselineMonths - acceleratedMonths);
  const yearsSaved = Number((monthsSaved / 12).toFixed(1));

  const baselineTotalPaid = new Decimal(baseline.summary.totalAmountPaid);
  const acceleratedTotalPaid = new Decimal(accelerated.summary.totalAmountPaid);
  const totalSavings = baselineTotalPaid.minus(acceleratedTotalPaid).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();

  return {
    baseline: {
      monthlyPayment: baseline.summary.monthlyPayment,
      payoffDate: baseline.summary.payoffDate,
      totalMonths: baselineMonths,
      totalInterest: baseline.summary.totalInterestPaid,
      totalPaid: baseline.summary.totalAmountPaid,
    },
    accelerated: {
      monthlyPayment: accelerated.summary.monthlyPayment,
      payoffDate: accelerated.summary.payoffDate,
      totalMonths: acceleratedMonths,
      totalInterest: accelerated.summary.totalInterestPaid,
      totalPaid: accelerated.summary.totalAmountPaid,
    },
    savings: {
      monthsSaved,
      yearsSaved,
      interestSaved,
      totalSavings,
    },
    schedule: accelerated.schedule,
  };
}
