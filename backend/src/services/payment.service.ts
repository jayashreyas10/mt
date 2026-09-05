import { prisma } from '../db.js';
import { CreateActualPaymentInput } from '@mortgage-tracker/shared';
import { MortgageService } from './mortgage.service.js';

export class PaymentService {
  static async listPayments(userId: string, mortgageId: string) {
    await MortgageService.getMortgageById(userId, mortgageId);

    return prisma.actualPayment.findMany({
      where: { mortgageId },
      orderBy: { paymentDate: 'desc' },
    });
  }

  static async recordPayment(userId: string, mortgageId: string, data: CreateActualPaymentInput) {
    const mortgage = await MortgageService.getMortgageById(userId, mortgageId);

    const totalPrincipalReduction = data.principalPaid + data.extraPrincipal;
    const newCurrentBalance = Math.max(0, mortgage.currentBalance - totalPrincipalReduction);

    const [payment] = await prisma.$transaction([
      prisma.actualPayment.create({
        data: {
          mortgageId,
          paymentDate: new Date(data.paymentDate),
          scheduledAmount: data.scheduledAmount,
          actualAmount: data.actualAmount,
          principalPaid: data.principalPaid,
          interestPaid: data.interestPaid,
          extraPrincipal: data.extraPrincipal,
          notes: data.notes,
        },
      }),
      prisma.mortgage.update({
        where: { id: mortgageId },
        data: {
          currentBalance: Math.round(newCurrentBalance * 100) / 100,
        },
      }),
    ]);

    return payment;
  }
}
