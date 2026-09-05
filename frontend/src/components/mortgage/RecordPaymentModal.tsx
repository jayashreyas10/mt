import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '../ui/Modal.js';
import { Input } from '../ui/Input.js';
import { Button } from '../ui/Button.js';
import { createActualPaymentSchema, CreateActualPaymentInput } from '@mortgage-tracker/shared';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  scheduledPayment: number;
  onSubmit: (data: CreateActualPaymentInput) => Promise<void>;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  onClose,
  scheduledPayment,
  onSubmit,
}) => {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateActualPaymentInput>({
    resolver: zodResolver(createActualPaymentSchema),
    defaultValues: {
      paymentDate: new Date().toISOString().split('T')[0],
      scheduledAmount: scheduledPayment,
      actualAmount: scheduledPayment,
      principalPaid: Math.round((scheduledPayment * 0.45) * 100) / 100,
      interestPaid: Math.round((scheduledPayment * 0.55) * 100) / 100,
      extraPrincipal: 0,
      notes: '',
    },
  });

  const actualAmount = watch('actualAmount');
  const principalPaid = watch('principalPaid');
  const interestPaid = watch('interestPaid');

  // Auto calculate extra principal if actual amount exceeds principal + interest
  React.useEffect(() => {
    const diff = Number(actualAmount || 0) - (Number(principalPaid || 0) + Number(interestPaid || 0));
    if (diff > 0) {
      setValue('extraPrincipal', Math.round(diff * 100) / 100);
    } else {
      setValue('extraPrincipal', 0);
    }
  }, [actualAmount, principalPaid, interestPaid, setValue]);

  const handleFormSubmit = async (data: CreateActualPaymentInput) => {
    try {
      await onSubmit(data);
      reset();
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Mortgage Payment" maxWidth="md">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <Input
          label="Payment Date"
          type="date"
          error={errors.paymentDate?.message}
          {...register('paymentDate')}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Scheduled Amount ($)"
            type="number"
            step="any"
            error={errors.scheduledAmount?.message}
            {...register('scheduledAmount', { valueAsNumber: true })}
          />
          <Input
            label="Total Amount Paid ($)"
            type="number"
            step="any"
            error={errors.actualAmount?.message}
            {...register('actualAmount', { valueAsNumber: true })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Principal Portion ($)"
            type="number"
            step="any"
            error={errors.principalPaid?.message}
            {...register('principalPaid', { valueAsNumber: true })}
          />
          <Input
            label="Interest Portion ($)"
            type="number"
            step="any"
            error={errors.interestPaid?.message}
            {...register('interestPaid', { valueAsNumber: true })}
          />
        </div>

        <Input
          label="Extra Principal Applied ($)"
          type="number"
          step="any"
          helperText="Directly reduces your remaining mortgage loan balance"
          error={errors.extraPrincipal?.message}
          {...register('extraPrincipal', { valueAsNumber: true })}
        />

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
            Notes / Reference
          </label>
          <textarea
            className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-600"
            rows={2}
            placeholder="e.g. Bank confirmation #948291, bonus applied to principal"
            {...register('notes')}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Save Payment Record
          </Button>
        </div>
      </form>
    </Modal>
  );
};
