import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '../ui/Modal.js';
import { Input } from '../ui/Input.js';
import { Button } from '../ui/Button.js';
import { createMortgageSchema, CreateMortgageInput } from '@mortgage-tracker/shared';

interface CreateMortgageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateMortgageInput) => Promise<void>;
}

export const CreateMortgageModal: React.FC<CreateMortgageModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateMortgageInput>({
    resolver: zodResolver(createMortgageSchema),
    defaultValues: {
      name: 'Primary Residence Loan',
      propertyName: 'Main Residence',
      originalBalance: 350000,
      currentBalance: 350000,
      interestRate: 6.5,
      termYears: 30,
      startDate: new Date().toISOString().split('T')[0],
      paymentFrequency: 'MONTHLY',
      propertyValue: 420000,
      purchasePrice: 420000,
      propertyTaxMonthly: 350,
      homeInsuranceMonthly: 120,
      hoaMonthly: 50,
    },
  });

  const handleFormSubmit = async (data: CreateMortgageInput) => {
    try {
      await onSubmit(data);
      reset();
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Mortgage Loan" maxWidth="xl">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-md mb-3">
            1. Property Information
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Property Name"
              placeholder="e.g. Maple Street Home"
              error={errors.propertyName?.message}
              {...register('propertyName')}
            />
            <Input
              label="Property Address"
              placeholder="e.g. 123 Maple Ave, Austin TX"
              error={errors.propertyAddress?.message}
              {...register('propertyAddress')}
            />
            <Input
              label="Property Market Value ($)"
              type="number"
              step="any"
              error={errors.propertyValue?.message}
              {...register('propertyValue', { valueAsNumber: true })}
            />
            <Input
              label="Purchase Price ($)"
              type="number"
              step="any"
              error={errors.purchasePrice?.message}
              {...register('purchasePrice', { valueAsNumber: true })}
            />
          </div>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-md mb-3">
            2. Loan Terms & Financing
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Mortgage Nickname"
              placeholder="e.g. 30-Year Fixed Primary"
              error={errors.name?.message}
              {...register('name')}
            />
            <Input
              label="Original Loan Balance ($)"
              type="number"
              step="any"
              error={errors.originalBalance?.message}
              {...register('originalBalance', { valueAsNumber: true })}
            />
            <Input
              label="Interest Rate (%)"
              type="number"
              step="0.001"
              placeholder="e.g. 6.5"
              error={errors.interestRate?.message}
              {...register('interestRate', { valueAsNumber: true })}
            />
            <Input
              label="Term (Years)"
              type="number"
              placeholder="e.g. 30"
              error={errors.termYears?.message}
              {...register('termYears', { valueAsNumber: true })}
            />
            <Input
              label="Loan Start Date"
              type="date"
              error={errors.startDate?.message}
              {...register('startDate')}
            />
            <Input
              label="Current Remaining Balance ($)"
              type="number"
              step="any"
              helperText="Defaults to original balance if unchanged"
              error={errors.currentBalance?.message}
              {...register('currentBalance', { valueAsNumber: true })}
            />
          </div>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 bg-slate-100 px-3 py-1.5 rounded-md mb-3">
            3. Escrow & Monthly Add-ons (Optional)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Property Tax ($/mo)"
              type="number"
              step="any"
              error={errors.propertyTaxMonthly?.message}
              {...register('propertyTaxMonthly', { valueAsNumber: true })}
            />
            <Input
              label="Home Insurance ($/mo)"
              type="number"
              step="any"
              error={errors.homeInsuranceMonthly?.message}
              {...register('homeInsuranceMonthly', { valueAsNumber: true })}
            />
            <Input
              label="HOA Fees ($/mo)"
              type="number"
              step="any"
              error={errors.hoaMonthly?.message}
              {...register('hoaMonthly', { valueAsNumber: true })}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Create Mortgage & Calculate Schedule
          </Button>
        </div>
      </form>
    </Modal>
  );
};
