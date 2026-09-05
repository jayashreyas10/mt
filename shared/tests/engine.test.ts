import { describe, it, expect } from 'vitest';
import {
  calculateMonthlyPayment,
  generateAmortizationSchedule,
  calculateExtraPaymentImpact,
  compareScenarios,
  addMonthsToDate,
  getMonthDifference
} from '../src/engine/index.js';

describe('Mortgage Calculation Engine Tests (Section 22 Requirements)', () => {
  // Test 1: Standard fixed-rate mortgage
  it('Test 1: Standard fixed-rate mortgage ($300k, 6.5%, 30 yr)', () => {
    const payment = calculateMonthlyPayment(300000, 6.5, 30);
    // Standard financial calculation: 300000 * (0.065/12 * (1+0.065/12)^360) / ((1+0.065/12)^360 - 1) = 1896.20
    expect(payment).toBe(1896.20);
  });

  // Test 2: Zero extra payment
  it('Test 2: Zero extra payment schedule verification', () => {
    const result = generateAmortizationSchedule({
      principal: 300000,
      annualInterestRate: 6.5,
      termYears: 30,
      startDate: '2026-01-01',
    }, []);

    expect(result.summary.totalPaymentsCount).toBe(360);
    expect(result.schedule[result.schedule.length - 1].endingBalance).toBe(0);
    expect(result.summary.originalPrincipal).toBe(300000);
    // Total interest matching exact month-by-month rounded schedule (382,636.71)
    expect(result.summary.totalInterestPaid).toBeCloseTo(382636.71, 1);
  });

  // Test 3: Extra monthly payment
  it('Test 3: Extra monthly payment (+$500/month)', () => {
    const impact = calculateExtraPaymentImpact({
      principal: 300000,
      annualInterestRate: 6.5,
      termYears: 30,
      startDate: '2026-01-01',
    }, [{
      type: 'RECURRING_MONTHLY',
      amount: 500,
      startMonth: 1,
    }]);

    expect(impact.savings.monthsSaved).toBeGreaterThan(100);
    expect(impact.savings.interestSaved).toBeGreaterThan(100000);
    expect(impact.accelerated.totalMonths).toBeLessThan(impact.baseline.totalMonths);
    expect(impact.accelerated.totalInterest).toBeLessThan(impact.baseline.totalInterest);
  });

  // Test 4: One-time payment
  it('Test 4: One-time payment ($10,000 at month 24)', () => {
    const result = generateAmortizationSchedule({
      principal: 300000,
      annualInterestRate: 6.5,
      termYears: 30,
      startDate: '2026-01-01',
    }, [{
      type: 'ONE_TIME',
      amount: 10000,
      targetMonth: 24,
    }]);

    // Check that month 24 has extra payment 10,000
    const month24 = result.schedule.find(r => r.paymentNumber === 24);
    expect(month24).toBeDefined();
    expect(month24?.extraPayment).toBe(10000);
    expect(month24?.totalPayment).toBeCloseTo(1896.20 + 10000, 1);
    // Loan should finish earlier than 360 months
    expect(result.summary.totalPaymentsCount).toBeLessThan(360);
  });

  // Test 5: Early payoff
  it('Test 5: Early payoff with aggressive extra payments', () => {
    const result = generateAmortizationSchedule({
      principal: 200000,
      annualInterestRate: 5.0,
      termYears: 30,
      startDate: '2026-01-01',
    }, [{
      type: 'RECURRING_MONTHLY',
      amount: 2500, // aggressive extra payment
      startMonth: 1,
    }]);

    // Should be paid off in less than 6 years (72 months)
    expect(result.summary.totalPaymentsCount).toBeLessThan(72);
    expect(result.schedule[result.schedule.length - 1].endingBalance).toBe(0);
  });

  // Test 6: Very small remaining balance
  it('Test 6: Very small remaining balance does not overpay or leave residual cents', () => {
    const result = generateAmortizationSchedule({
      principal: 100,
      annualInterestRate: 6.0,
      termYears: 1,
      startDate: '2026-01-01',
      scheduledPayment: 8.61,
    }, []);

    const lastPayment = result.schedule[result.schedule.length - 1];
    expect(lastPayment.endingBalance).toBe(0);
    expect(lastPayment.scheduledPayment).toBeLessThanOrEqual(100);
  });

  // Test 7: Final payment adjustment
  it('Test 7: Final payment adjustment ensures zero ending balance', () => {
    const result = generateAmortizationSchedule({
      principal: 150000,
      annualInterestRate: 7.0,
      termYears: 15,
      startDate: '2026-01-01',
    }, []);

    const lastRow = result.schedule[result.schedule.length - 1];
    expect(lastRow.endingBalance).toBe(0);
    // Total principal paid across all rows must equal original principal
    const totalPrincipal = result.schedule.reduce((acc, row) => acc + row.principal, 0);
    expect(Math.round(totalPrincipal * 100) / 100).toBe(150000);
  });

  // Test 8: Different loan terms (15-year vs 30-year)
  it('Test 8: Different loan terms comparison', () => {
    const payment15 = calculateMonthlyPayment(300000, 6.5, 15);
    const payment30 = calculateMonthlyPayment(300000, 6.5, 30);

    expect(payment15).toBeGreaterThan(payment30);
    expect(payment15).toBe(2613.32);
    expect(payment30).toBe(1896.20);
  });

  // Test 9: Different interest rates (2.5% vs 12%)
  it('Test 9: Different interest rates calculation', () => {
    const lowRatePayment = calculateMonthlyPayment(250000, 2.5, 30);
    const highRatePayment = calculateMonthlyPayment(250000, 12.0, 30);

    expect(lowRatePayment).toBe(987.80);
    expect(highRatePayment).toBe(2571.53);
  });

  // Test 10: Rounding behavior & consistency
  it('Test 10: Rounding behavior verifies 2 decimal places on all schedule columns', () => {
    const result = generateAmortizationSchedule({
      principal: 275432.18,
      annualInterestRate: 5.875,
      termYears: 30,
      startDate: '2026-06-15',
    }, []);

    for (const row of result.schedule) {
      expect(row.endingBalance).toBeGreaterThanOrEqual(0);
      // Verify all amounts have at most 2 decimal places
      const decimals = (val: number) => (val.toString().split('.')[1] || '').length;
      expect(decimals(row.beginningBalance)).toBeLessThanOrEqual(2);
      expect(decimals(row.interest)).toBeLessThanOrEqual(2);
      expect(decimals(row.principal)).toBeLessThanOrEqual(2);
      expect(decimals(row.endingBalance)).toBeLessThanOrEqual(2);
    }
  });

  // Test 11: Invalid inputs handling
  it('Test 11: Invalid inputs throw clear errors', () => {
    expect(() => calculateMonthlyPayment(-1000, 5, 30)).toThrow('Principal cannot be negative');
    expect(() => calculateMonthlyPayment(100000, -2, 30)).toThrow('Interest rate cannot be negative');
    expect(() => calculateMonthlyPayment(100000, 5, 0)).toThrow('Term years must be greater than 0');
  });

  // Test 12: Large loan amount ($10M jumbo loan)
  it('Test 12: Large loan amount ($10,000,000 jumbo loan)', () => {
    const payment = calculateMonthlyPayment(10000000, 6.0, 30);
    expect(payment).toBe(59955.05);

    const result = generateAmortizationSchedule({
      principal: 10000000,
      annualInterestRate: 6.0,
      termYears: 30,
      startDate: '2026-01-01',
    }, []);

    expect(result.schedule[result.schedule.length - 1].endingBalance).toBe(0);
  });

  // Test 13: Very low interest rate (0.1%)
  it('Test 13: Very low interest rate (0.1%)', () => {
    const payment = calculateMonthlyPayment(300000, 0.1, 30);
    expect(payment).toBe(845.93);

    const result = generateAmortizationSchedule({
      principal: 300000,
      annualInterestRate: 0.1,
      termYears: 30,
      startDate: '2026-01-01',
    }, []);

    expect(result.schedule[result.schedule.length - 1].endingBalance).toBe(0);
  });

  // Test 14: Zero interest rate (0.0%)
  it('Test 14: Zero interest rate supports straight principal split', () => {
    const payment = calculateMonthlyPayment(360000, 0, 30);
    // 360,000 / 360 months = 1000.00
    expect(payment).toBe(1000.00);

    const result = generateAmortizationSchedule({
      principal: 360000,
      annualInterestRate: 0,
      termYears: 30,
      startDate: '2026-01-01',
    }, []);

    expect(result.summary.totalInterestPaid).toBe(0);
    expect(result.summary.totalPaymentsCount).toBe(360);
    expect(result.schedule[0].interest).toBe(0);
    expect(result.schedule[0].principal).toBe(1000.00);
    expect(result.schedule[result.schedule.length - 1].endingBalance).toBe(0);
  });

  // Test 15: Payment date and calendar month handling
  it('Test 15: Payment date progression handles month rollover correctly', () => {
    expect(addMonthsToDate('2026-01-15', 1)).toBe('2026-02-15');
    expect(addMonthsToDate('2026-01-31', 1)).toBe('2026-02-28'); // clamped to Feb 28
    expect(addMonthsToDate('2026-11-01', 2)).toBe('2027-01-01'); // year rollover
    expect(getMonthDifference('2026-01-01', '2027-03-01')).toBe(14);
  });

  // Test 16: Scenario comparison functionality
  it('Test 16: Scenario comparison compares baseline against multiple strategies', () => {
    const results = compareScenarios({
      principal: 300000,
      annualInterestRate: 6.5,
      termYears: 30,
      startDate: '2026-01-01',
    }, [
      { id: 'baseline', name: 'Standard Payment' },
      { id: 'extra200', name: '+$200/mo', extraMonthlyAmount: 200 },
      { id: 'extra500', name: '+$500/mo', extraMonthlyAmount: 500 },
      { id: 'lumpSum', name: '$10k lump sum', oneTimePayments: [{ amount: 10000, targetMonth: 24 }] },
    ]);

    expect(results).toHaveLength(4);
    expect(results[0].monthsSaved).toBe(0);
    expect(results[1].monthsSaved).toBeGreaterThan(0);
    expect(results[2].monthsSaved).toBeGreaterThan(results[1].monthsSaved);
    expect(results[3].interestSaved).toBeGreaterThan(0);
  });
});
