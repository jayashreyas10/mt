import { z } from 'zod';

export const createMortgageSchema = z.object({
  name: z.string().min(1, 'Mortgage name is required'),
  originalBalance: z.number().positive('Original balance must be greater than 0'),
  currentBalance: z.number().positive('Current balance must be greater than 0').optional(),
  interestRate: z.number().min(0, 'Interest rate cannot be negative').max(100, 'Interest rate cannot exceed 100%'),
  termYears: z.number().int('Term years must be an integer').positive('Term must be at least 1 year').max(50, 'Max term is 50 years'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format'),
  paymentFrequency: z.enum(['MONTHLY', 'BIWEEKLY']).default('MONTHLY'),
  scheduledPayment: z.number().positive('Scheduled payment must be positive').optional(),
  
  // Escrow / Add-ons
  propertyTaxMonthly: z.number().min(0).default(0),
  homeInsuranceMonthly: z.number().min(0).default(0),
  hoaMonthly: z.number().min(0).default(0),

  // Property info
  propertyName: z.string().min(1, 'Property name is required'),
  propertyAddress: z.string().optional(),
  propertyValue: z.number().min(0, 'Property value must be non-negative').default(0),
  purchasePrice: z.number().min(0, 'Purchase price must be non-negative').default(0),
});

export const updateMortgageSchema = createMortgageSchema.partial();

export const extraPaymentRuleSchema = z.object({
  type: z.enum(['RECURRING_MONTHLY', 'ONE_TIME']),
  amount: z.number().positive('Extra payment amount must be greater than 0'),
  startMonth: z.number().int().min(1).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  targetMonth: z.number().int().min(1).optional(),
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const scenarioSchema = z.object({
  name: z.string().min(1, 'Scenario name is required'),
  extraMonthlyAmount: z.number().min(0).default(0),
  oneTimePayments: z.array(z.object({
    amount: z.number().positive('Amount must be greater than 0'),
    targetMonth: z.number().int().min(1).optional(),
    targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  })).default([]),
});

export type CreateMortgageInput = z.infer<typeof createMortgageSchema>;
export type UpdateMortgageInput = z.infer<typeof updateMortgageSchema>;
export type ExtraPaymentRuleInput = z.infer<typeof extraPaymentRuleSchema>;
export type ScenarioInput = z.infer<typeof scenarioSchema>;
