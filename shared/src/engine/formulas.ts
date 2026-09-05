import { Decimal } from 'decimal.js';

// Configure Decimal for financial precision with standard bank rounding (ROUND_HALF_UP)
Decimal.set({ precision: 30, rounding: Decimal.ROUND_HALF_UP });

/**
 * Calculates standard fixed-rate monthly principal and interest payment (P&I).
 * Formula: M = P * [r(1+r)^n] / [(1+r)^n - 1]
 * Special case: r = 0 => M = P / n
 * 
 * @param principal Loan principal amount (P)
 * @param annualInterestRate Annual interest rate in percentage (e.g. 6.5 for 6.5%)
 * @param termYears Loan term in years (e.g. 30)
 * @returns Monthly scheduled payment rounded to 2 decimal places
 */
export function calculateMonthlyPayment(
  principal: number,
  annualInterestRate: number,
  termYears: number
): number {
  if (principal < 0) {
    throw new Error('Principal cannot be negative');
  }
  if (termYears <= 0) {
    throw new Error('Term years must be greater than 0');
  }
  if (annualInterestRate < 0) {
    throw new Error('Interest rate cannot be negative');
  }
  if (principal === 0) {
    return 0;
  }

  const p = new Decimal(principal);
  const n = new Decimal(termYears).times(12);

  // Zero interest rate edge case (0%)
  if (annualInterestRate === 0) {
    return p.dividedBy(n).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();
  }

  const r = new Decimal(annualInterestRate).dividedBy(100).dividedBy(12);
  const onePlusR = new Decimal(1).plus(r);
  const pow = onePlusR.pow(n);
  const numerator = p.times(r).times(pow);
  const denominator = pow.minus(1);

  return numerator.dividedBy(denominator).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();
}

/**
 * Advances an ISO date (YYYY-MM-DD) by a given number of calendar months.
 * Preserves the original day of month, clamping to the last day of month if necessary
 * (e.g., Jan 31 + 1 month = Feb 28/29).
 */
export function addMonthsToDate(dateStr: string, monthsToAdd: number): string {
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1; // 0-indexed month
  const targetDay = parseInt(dayStr, 10);

  const targetDate = new Date(Date.UTC(year, month + monthsToAdd, 1));
  const targetYear = targetDate.getUTCFullYear();
  const targetMonth = targetDate.getUTCMonth();

  // Find max days in target month
  const daysInTargetMonth = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
  const day = Math.min(targetDay, daysInTargetMonth);

  const finalDate = new Date(Date.UTC(targetYear, targetMonth, day));
  return finalDate.toISOString().split('T')[0];
}

/**
 * Calculates the number of whole months between two ISO dates (YYYY-MM-DD).
 */
export function getMonthDifference(startDateStr: string, targetDateStr: string): number {
  const [y1, m1] = startDateStr.split('-').map(Number);
  const [y2, m2] = targetDateStr.split('-').map(Number);
  return (y2 - y1) * 12 + (m2 - m1);
}
