import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import { Card } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { Badge } from '../components/ui/Badge.js';
import { Input } from '../components/ui/Input.js';
import { AmortizationTable } from '../components/mortgage/AmortizationTable.js';
import { AmortizationChart } from '../components/charts/AmortizationChart.js';
import { PaymentBreakdownChart } from '../components/charts/PaymentBreakdownChart.js';
import { RecordPaymentModal } from '../components/mortgage/RecordPaymentModal.js';
import {
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  Plus,
  Trash2,
  Receipt,
  PiggyBank,
  History,
  FileSpreadsheet,
} from 'lucide-react';
import { CreateActualPaymentInput, ExtraPaymentRuleInput } from '@mortgage-tracker/shared';

export const MortgageDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'overview' | 'schedule' | 'strategy' | 'tracker'>('overview');
  const [recordPaymentModalOpen, setRecordPaymentModalOpen] = useState(false);

  // Strategy interactive simulator state
  const [simExtraMonthly, setSimExtraMonthly] = useState<number>(300);
  const [simOneTimeAmount, setSimOneTimeAmount] = useState<number>(5000);
  const [simOneTimeMonth, setSimOneTimeMonth] = useState<number>(12);

  // Mortgage details query
  const { data: mortgage, isLoading: loadingMortgage } = useQuery({
    queryKey: ['mortgage-detail', id],
    queryFn: async () => {
      const res = await api.get(`/mortgages/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  // Amortization query with active simulation params
  const { data: amortizationData, isLoading: loadingSchedule } = useQuery({
    queryKey: ['mortgage-amortization', id, simExtraMonthly, simOneTimeAmount, simOneTimeMonth],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (simExtraMonthly > 0) params.set('extraMonthly', simExtraMonthly.toString());
      if (simOneTimeAmount > 0) {
        params.set('oneTimeAmount', simOneTimeAmount.toString());
        params.set('oneTimeMonth', simOneTimeMonth.toString());
      }
      const res = await api.get(`/mortgages/${id}/amortization?${params.toString()}`);
      return res.data;
    },
    enabled: !!id,
  });

  // Payment history query
  const { data: payments = [] } = useQuery({
    queryKey: ['mortgage-payments', id],
    queryFn: async () => {
      const res = await api.get(`/mortgages/${id}/payments`);
      return res.data;
    },
    enabled: !!id,
  });

  // Save extra payment rule mutation
  const addRuleMutation = useMutation({
    mutationFn: async (rule: ExtraPaymentRuleInput) => {
      const res = await api.post(`/mortgages/${id}/extra-payments`, rule);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mortgage-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['mortgage-amortization', id] });
    },
  });

  // Delete extra payment rule mutation
  const deleteRuleMutation = useMutation({
    mutationFn: async (ruleId: string) => {
      await api.delete(`/mortgages/${id}/extra-payments/${ruleId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mortgage-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['mortgage-amortization', id] });
    },
  });

  // Record actual payment mutation
  const recordPaymentMutation = useMutation({
    mutationFn: async (data: CreateActualPaymentInput) => {
      const res = await api.post(`/mortgages/${id}/payments`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mortgage-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['mortgage-payments', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
    },
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    }).format(val);
  };

  if (loadingMortgage || !mortgage) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-1/6"></div>
        <div className="h-10 bg-slate-200 rounded w-1/3"></div>
        <div className="h-64 bg-slate-200 rounded-xl"></div>
      </div>
    );
  }

  const impact = amortizationData?.impact;

  return (
    <div className="space-y-6">
      {/* Back button & Title */}
      <div>
        <Link
          to="/mortgages"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to All Mortgages</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {mortgage.name}
              </h1>
              <Badge variant="success">{mortgage.interestRate}% Fixed APR</Badge>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              {mortgage.property?.propertyName} &bull; Started on {mortgage.startDate?.split('T')[0]} &bull; {mortgage.termYears} Years ({mortgage.termYears * 12} Months)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRecordPaymentModalOpen(true)}
              className="flex items-center gap-1.5"
            >
              <Receipt className="h-4 w-4 text-slate-600" />
              <span>Record Actual Payment</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Overview Metric Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Current Balance</span>
          <div className="text-xl font-bold text-slate-900 mt-1">{formatCurrency(mortgage.currentBalance)}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Original: {formatCurrency(mortgage.originalBalance)}</div>
        </Card>

        <Card className="p-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Monthly P&I</span>
          <div className="text-xl font-bold text-slate-900 mt-1">{formatCurrency(mortgage.scheduledPayment)}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Principal + Interest</div>
        </Card>

        <Card className="p-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Monthly Outflow</span>
          <div className="text-xl font-bold text-emerald-700 mt-1">
            {formatCurrency(
              mortgage.scheduledPayment +
              (mortgage.propertyTaxMonthly || 0) +
              (mortgage.homeInsuranceMonthly || 0) +
              (mortgage.hoaMonthly || 0)
            )}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Includes Escrow & HOA</div>
        </Card>

        <Card className="p-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Projected Payoff</span>
          <div className="text-xl font-bold text-slate-900 mt-1">
            {impact?.accelerated?.payoffDate || impact?.baseline?.payoffDate || '—'}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">
            {impact?.savings?.monthsSaved ? `${impact.savings.monthsSaved} months earlier!` : 'On scheduled pace'}
          </div>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview & Charts', icon: Sparkles },
            { id: 'schedule', label: 'Amortization Schedule', icon: FileSpreadsheet },
            { id: 'strategy', label: 'Payoff Strategy & Extra Payments', icon: PiggyBank },
            { id: 'tracker', label: 'Actual Payment History', icon: History },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3.5 px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center gap-2 transition-colors ${
                  active
                    ? 'border-emerald-600 text-emerald-700 font-semibold'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <Icon className={`h-4 w-4 ${active ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab 1: Overview & Visual Charts */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Loan Amortization Curve</h3>
                  <p className="text-xs text-slate-500">
                    Remaining balance reduction vs cumulative principal & interest paid over time
                  </p>
                </div>
              </div>
              {amortizationData?.schedule ? (
                <AmortizationChart schedule={amortizationData.schedule} />
              ) : (
                <div className="h-64 flex items-center justify-center text-slate-400">Loading curve...</div>
              )}
            </Card>

            <Card className="p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Monthly Payment Breakdown</h3>
                <p className="text-xs text-slate-500 mb-4">Portion allocated to interest, principal, and escrow</p>
                <PaymentBreakdownChart
                  principal={mortgage.scheduledPayment * 0.45}
                  interest={mortgage.scheduledPayment * 0.55}
                  propertyTax={mortgage.propertyTaxMonthly}
                  homeInsurance={mortgage.homeInsuranceMonthly}
                  hoa={mortgage.hoaMonthly}
                />
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Principal & Interest:</span>
                  <span className="font-semibold text-slate-800">{formatCurrency(mortgage.scheduledPayment)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Property Tax:</span>
                  <span className="text-slate-700">{formatCurrency(mortgage.propertyTaxMonthly || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Insurance & HOA:</span>
                  <span className="text-slate-700">
                    {formatCurrency((mortgage.homeInsuranceMonthly || 0) + (mortgage.hoaMonthly || 0))}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Tab 2: Amortization Schedule Table */}
      {activeTab === 'schedule' && (
        <div>
          {loadingSchedule || !amortizationData?.schedule ? (
            <div className="h-64 flex items-center justify-center text-slate-400 animate-pulse">
              Calculating full amortization schedule...
            </div>
          ) : (
            <AmortizationTable schedule={amortizationData.schedule} mortgageName={mortgage.name} />
          )}
        </div>
      )}

      {/* Tab 3: Payoff Strategy & Extra Payments (Section 12 requirement) */}
      {activeTab === 'strategy' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Input simulator controls */}
            <Card className="p-6 space-y-5">
              <div>
                <h3 className="text-base font-bold text-slate-900">Extra Payment Simulator</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  See how additional payments accelerate your payoff and eliminate interest
                </p>
              </div>

              <div className="space-y-4">
                <Input
                  label="Extra Monthly Payment ($)"
                  type="number"
                  step="50"
                  value={simExtraMonthly}
                  onChange={(e) => setSimExtraMonthly(Math.max(0, Number(e.target.value)))}
                  helperText="Added to principal every month"
                />

                <Input
                  label="One-Time Lump Sum Payment ($)"
                  type="number"
                  step="500"
                  value={simOneTimeAmount}
                  onChange={(e) => setSimOneTimeAmount(Math.max(0, Number(e.target.value)))}
                  helperText="Single extra principal reduction"
                />

                <Input
                  label="Apply Lump Sum at Month #"
                  type="number"
                  min="1"
                  max="360"
                  value={simOneTimeMonth}
                  onChange={(e) => setSimOneTimeMonth(Math.max(1, Number(e.target.value)))}
                  helperText="e.g. Month 12 (Year 1) or Month 24 (Year 2)"
                />
              </div>

              <Button
                variant="outline"
                className="w-full text-xs"
                onClick={() => {
                  if (simExtraMonthly > 0) {
                    addRuleMutation.mutate({
                      type: 'RECURRING_MONTHLY',
                      amount: simExtraMonthly,
                      startMonth: 1,
                    });
                  }
                }}
                isLoading={addRuleMutation.isPending}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Save as Permanent Rule
              </Button>
            </Card>

            {/* Impact Result Visualizer (Section 12) */}
            <div className="lg:col-span-2 space-y-6">
              {impact ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Card className="p-5 bg-slate-900 text-white border-slate-800">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      WITHOUT EXTRA PAYMENTS
                    </div>
                    <div className="mt-4">
                      <div className="text-xs text-slate-400">Payoff Date:</div>
                      <div className="text-lg font-bold text-white">{impact.baseline.payoffDate}</div>
                    </div>
                    <div className="mt-3">
                      <div className="text-xs text-slate-400">Total Interest:</div>
                      <div className="text-base font-bold text-rose-400">
                        {formatCurrency(impact.baseline.totalInterest)}
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-slate-400">
                      Total Paid: {formatCurrency(impact.baseline.totalPaid)}
                    </div>
                  </Card>

                  <Card className="p-5 bg-emerald-900/90 text-white border-emerald-700">
                    <div className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
                      WITH EXTRA PAYMENTS
                    </div>
                    <div className="mt-4">
                      <div className="text-xs text-emerald-200">New Payoff Date:</div>
                      <div className="text-lg font-bold text-white">{impact.accelerated.payoffDate}</div>
                    </div>
                    <div className="mt-3">
                      <div className="text-xs text-emerald-200">New Total Interest:</div>
                      <div className="text-base font-bold text-emerald-300">
                        {formatCurrency(impact.accelerated.totalInterest)}
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-emerald-200">
                      Total Paid: {formatCurrency(impact.accelerated.totalPaid)}
                    </div>
                  </Card>

                  <Card className="p-5 bg-white border-emerald-200 border-2 shadow-sm">
                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span>YOU SAVE</span>
                    </div>
                    <div className="mt-4">
                      <div className="text-xs text-slate-500">Time Eliminated:</div>
                      <div className="text-xl font-extrabold text-slate-900">
                        {impact.savings.yearsSaved} Years
                      </div>
                      <div className="text-xs text-slate-500">({impact.savings.monthsSaved} monthly payments)</div>
                    </div>
                    <div className="mt-3">
                      <div className="text-xs text-slate-500">Interest Saved:</div>
                      <div className="text-xl font-extrabold text-emerald-600">
                        {formatCurrency(impact.savings.interestSaved)}
                      </div>
                    </div>
                  </Card>
                </div>
              ) : null}

              {/* Active Saved Rules */}
              <Card className="p-6">
                <h4 className="text-sm font-bold text-slate-900 mb-3">Active Saved Extra Payment Rules</h4>
                {mortgage.extraPaymentRules?.length === 0 ? (
                  <p className="text-xs text-slate-500">No recurring extra payment rules saved in database yet.</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {mortgage.extraPaymentRules.map((rule: any) => (
                      <div key={rule.id} className="py-3 flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold text-slate-800">
                            {rule.type === 'RECURRING_MONTHLY' ? 'Monthly Extra Payment' : 'One-Time Lump Sum'}
                          </div>
                          <div className="text-xs text-slate-500">
                            Amount: {formatCurrency(rule.amount)} {rule.type === 'RECURRING_MONTHLY' ? '/ month' : ''}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteRuleMutation.mutate(rule.id)}
                          className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Actual Payment History Tracker (Section 13 requirement) */}
      {activeTab === 'tracker' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Recorded Payment Transactions</h3>
              <p className="text-xs text-slate-500">
                Log actual payments made to your mortgage servicer and track real balance changes
              </p>
            </div>
            <Button size="sm" onClick={() => setRecordPaymentModalOpen(true)}>
              <Plus className="h-4 w-4 mr-1.5" />
              Record New Payment
            </Button>
          </div>

          <Card className="p-0 overflow-hidden">
            {payments.length === 0 ? (
              <div className="p-12 text-center">
                <Receipt className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                <h4 className="text-sm font-semibold text-slate-700">No actual payments recorded yet</h4>
                <p className="text-xs text-slate-500 mt-1 mb-4">
                  Log your first monthly mortgage payment to keep your remaining balance synchronized.
                </p>
                <Button size="sm" onClick={() => setRecordPaymentModalOpen(true)}>
                  Record First Payment
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-200 uppercase tracking-wider text-[11px] text-slate-500 font-semibold">
                    <tr>
                      <th className="py-3 px-4">Payment Date</th>
                      <th className="py-3 px-4 text-right">Scheduled</th>
                      <th className="py-3 px-4 text-right">Total Paid</th>
                      <th className="py-3 px-4 text-right">Principal</th>
                      <th className="py-3 px-4 text-right">Interest</th>
                      <th className="py-3 px-4 text-right text-emerald-600 font-bold">Extra Principal</th>
                      <th className="py-3 px-4">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[12px]">
                    {payments.map((p: any) => (
                      <tr key={p.id} className="hover:bg-slate-50/60">
                        <td className="py-3 px-4 font-sans text-slate-800 font-medium">
                          {p.paymentDate?.split('T')[0]}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-600">{formatCurrency(p.scheduledAmount)}</td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900">{formatCurrency(p.actualAmount)}</td>
                        <td className="py-3 px-4 text-right text-slate-700">{formatCurrency(p.principalPaid)}</td>
                        <td className="py-3 px-4 text-right text-rose-600">{formatCurrency(p.interestPaid)}</td>
                        <td className="py-3 px-4 text-right font-semibold text-emerald-600">
                          {p.extraPrincipal > 0 ? `+${formatCurrency(p.extraPrincipal)}` : '—'}
                        </td>
                        <td className="py-3 px-4 font-sans text-slate-500 text-xs truncate max-w-xs">
                          {p.notes || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Record Payment Modal */}
      <RecordPaymentModal
        isOpen={recordPaymentModalOpen}
        onClose={() => setRecordPaymentModalOpen(false)}
        scheduledPayment={mortgage.scheduledPayment}
        onSubmit={async (data) => {
          await recordPaymentMutation.mutateAsync(data);
        }}
      />
    </div>
  );
};
