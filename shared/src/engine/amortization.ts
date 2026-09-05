import { Decimal } from 'decimal.js';
import {
  MortgageInput,
  ExtraPaymentRule,
  AmortizationRow,
  AmortizationSchedule
} from './types.js';
import { calculateMonthlyPayment, addMonthsToDate, getMonthDifference } from './formulas.js';

export function generateAmortizationSchedule(
  input: MortgageInput,
  extraRules: ExtraPaymentRule[] = []
): AmortizationSchedule {
  if (input.principal <= 0) {
    throw new Error('Principal must be greater than 0');
  }
  if (input.termYears <= 0) {
    throw new Error('Term years must be greater than 0');
  }
  if (input.annualInterestRate < 0) {
    throw new Error('Interest rate cannot be negative');
  }

  const scheduledPaymentAmount = input.scheduledPayment && input.scheduledPayment > 0
    ? input.scheduledPayment
    : calculateMonthlyPayment(input.principal, input.annualInterestRate, input.termYears);

  const monthlyRate = new Decimal(input.annualInterestRate).dividedBy(100).dividedBy(12);
  const totalMonthsScheduled = input.termYears * 12;

  let currentBalance = new Decimal(input.principal);
  let cumulativeInterest = new Decimal(0);
  let cumulativePrincipal = new Decimal(0);
  const rows: AmortizationRow[] = [];

  let paymentNumber = 1;
  const maxIterations = totalMonthsScheduled + 120; // safety ceiling (10 extra years)

  while (currentBalance.greaterThan(0) && paymentNumber <= maxIterations) {
    const paymentDate = addMonthsToDate(input.startDate, paymentNumber - 1);
    const beginningBalance = currentBalance;

    // Monthly interest calculation: round to 2 decimals
    let monthlyInterest = beginningBalance
      .times(monthlyRate)
      .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

    // Calculate extra payments for this month
    let extraPaymentForMonth = new Decimal(0);
    for (const rule of extraRules) {
      if (rule.amount <= 0) continue;

      if (rule.type === 'RECURRING_MONTHLY') {
        const startM = rule.startMonth ?? (rule.startDate ? getMonthDifference(input.startDate, rule.startDate) + 1 : 1);
        if (paymentNumber >= startM) {
          extraPaymentForMonth = extraPaymentForMonth.plus(rule.amount);
        }
      } else if (rule.type === 'ONE_TIME') {
        const targetM = rule.targetMonth ?? (rule.targetDate ? getMonthDifference(input.startDate, rule.targetDate) + 1 : null);
        if (targetM !== null && paymentNumber === targetM) {
          extraPaymentForMonth = extraPaymentForMonth.plus(rule.amount);
        }
      }
    }

    // Normal scheduled principal
    const scheduledPaymentDec = new Decimal(scheduledPaymentAmount);
    let normalPrincipal = scheduledPaymentDec.minus(monthlyInterest);

    // If scheduled payment is less than interest (negative amortization guard)
    if (normalPrincipal.lessThan(0)) {
      normalPrincipal = new Decimal(0);
    }

    let finalScheduledPayment = scheduledPaymentDec;
    let finalExtraPayment = extraPaymentForMonth;
    let actualPrincipalPaid = new Decimal(0);
    let endingBalance = new Decimal(0);

    // Check if remaining balance + interest is less than scheduled payment, or if we reached the scheduled final month
    const payoffRequired = beginningBalance.plus(monthlyInterest);
    const isFinalScheduledMonth = paymentNumber >= totalMonthsScheduled && extraRules.length === 0;

    if (scheduledPaymentDec.greaterThanOrEqualTo(payoffRequired) || isFinalScheduledMonth) {
      // Loan will be paid off completely by regular payment alone (adjusted down/up to exact penny balance)
      actualPrincipalPaid = beginningBalance;
      finalScheduledPayment = payoffRequired;
      finalExtraPayment = new Decimal(0);
      endingBalance = new Decimal(0);
    } else {
      // Regular payment doesn't fully pay off the loan
      if (normalPrincipal.greaterThanOrEqualTo(beginningBalance)) {
        actualPrincipalPaid = beginningBalance;
        finalScheduledPayment = beginningBalance.plus(monthlyInterest);
        finalExtraPayment = new Decimal(0);
        endingBalance = new Decimal(0);
      } else {
        // Normal principal paid, check if extra payment pays off the remaining balance
        const balanceAfterNormal = beginningBalance.minus(normalPrincipal);
        if (finalExtraPayment.greaterThanOrEqualTo(balanceAfterNormal)) {
          // Extra payment capped at remaining balance
          finalExtraPayment = balanceAfterNormal;
          actualPrincipalPaid = beginningBalance;
          endingBalance = new Decimal(0);
        } else {
          actualPrincipalPaid = normalPrincipal.plus(finalExtraPayment);
          endingBalance = beginningBalance.minus(actualPrincipalPaid);
        }
      }
    }

    // Ensure ending balance is never negative and clamped to 2 decimal places
    endingBalance = Decimal.max(0, endingBalance).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
    const totalPayment = finalScheduledPayment.plus(finalExtraPayment).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

    cumulativeInterest = cumulativeInterest.plus(monthlyInterest).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
    cumulativePrincipal = cumulativePrincipal.plus(actualPrincipalPaid).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

    rows.push({
      paymentNumber,
      paymentDate,
      beginningBalance: beginningBalance.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber(),
      scheduledPayment: finalScheduledPayment.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber(),
      extraPayment: finalExtraPayment.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber(),
      totalPayment: totalPayment.toNumber(),
      principal: actualPrincipalPaid.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber(),
      interest: monthlyInterest.toNumber(),
      endingBalance: endingBalance.toNumber(),
      cumulativeInterest: cumulativeInterest.toNumber(),
      cumulativePrincipal: cumulativePrincipal.toNumber(),
    });

    currentBalance = endingBalance;
    paymentNumber++;

    if (currentBalance.isZero()) {
      break;
    }
  }

  const lastRow = rows[rows.length - 1];
  const payoffDate = lastRow ? lastRow.paymentDate : input.startDate;
  const totalAmountPaid = cumulativePrincipal.plus(cumulativeInterest).toNumber();

  return {
    schedule: rows,
    summary: {
      originalPrincipal: input.principal,
      totalInterestPaid: cumulativeInterest.toNumber(),
      totalAmountPaid,
      totalPaymentsCount: rows.length,
      payoffDate,
      monthlyPayment: scheduledPaymentAmount,
    },
  };
}
