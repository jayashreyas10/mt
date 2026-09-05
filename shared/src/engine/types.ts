export interface MortgageInput {
  principal: number;
  annualInterestRate: number; // percentage, e.g. 6.5 for 6.5%
  termYears: number;          // e.g. 30
  startDate: string;          // ISO date YYYY-MM-DD
  paymentFrequency?: 'MONTHLY' | 'BIWEEKLY'; // default MONTHLY
  scheduledPayment?: number;  // optional override; otherwise computed via standard formula
}

export interface ExtraPaymentRule {
  id?: string;
  type: 'RECURRING_MONTHLY' | 'ONE_TIME';
  amount: number;
  startMonth?: number;        // 1-indexed month number (e.g. 1 for first month)
  startDate?: string;         // YYYY-MM-DD
  targetDate?: string;        // YYYY-MM-DD for ONE_TIME
  targetMonth?: number;       // 1-indexed month number for ONE_TIME
}

export interface AmortizationRow {
  paymentNumber: number;
  paymentDate: string;        // YYYY-MM-DD
  beginningBalance: number;
  scheduledPayment: number;
  extraPayment: number;
  totalPayment: number;
  principal: number;
  interest: number;
  endingBalance: number;
  cumulativeInterest: number;
  cumulativePrincipal: number;
}

export interface AmortizationSchedule {
  schedule: AmortizationRow[];
  summary: {
    originalPrincipal: number;
    totalInterestPaid: number;
    totalAmountPaid: number;
    totalPaymentsCount: number;
    payoffDate: string;
    monthlyPayment: number;
  };
}

export interface ExtraPaymentComparison {
  baseline: {
    monthlyPayment: number;
    payoffDate: string;
    totalMonths: number;
    totalInterest: number;
    totalPaid: number;
  };
  accelerated: {
    monthlyPayment: number;
    payoffDate: string;
    totalMonths: number;
    totalInterest: number;
    totalPaid: number;
  };
  savings: {
    monthsSaved: number;
    yearsSaved: number;
    interestSaved: number;
    totalSavings: number;
  };
  schedule: AmortizationRow[];
}

export interface ScenarioDefinition {
  id: string;
  name: string;
  extraMonthlyAmount?: number;
  oneTimePayments?: Array<{
    amount: number;
    targetMonth?: number;
    targetDate?: string;
  }>;
}

export interface ScenarioComparisonResult {
  scenarioId: string;
  scenarioName: string;
  monthlyPayment: number;
  extraMonthlyPayment: number;
  oneTimeTotal: number;
  payoffDate: string;
  totalMonths: number;
  monthsSaved: number;
  totalInterest: number;
  interestSaved: number;
  totalAmountPaid: number;
}
