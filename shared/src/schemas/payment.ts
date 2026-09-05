import { z } from 'zod';

export const createActualPaymentSchema = z.object({
  paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  scheduledAmount: z.number().min(0, 'Scheduled amount must be non-negative'),
  actualAmount: z.number().positive('Actual amount must be greater than 0'),
  principalPaid: z.number().min(0, 'Principal paid must be non-negative'),
  interestPaid: z.number().min(0, 'Interest paid must be non-negative'),
  extraPrincipal: z.number().min(0, 'Extra principal must be non-negative').default(0),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
});

export type CreateActualPaymentInput = z.infer<typeof createActualPaymentSchema>;
