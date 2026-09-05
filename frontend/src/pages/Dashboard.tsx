import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { Card } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { Badge } from '../components/ui/Badge.js';
import { CreateMortgageModal } from '../components/mortgage/CreateMortgageModal.js';
import {
  Plus,
  DollarSign,
  TrendingDown,
  Calendar,
  Percent,
  Home,
  ArrowUpRight,
} from 'lucide-react';
import { CreateMortgageInput } from '@mortgage-tracker/shared';

export const Dashboard: React.FC = () => {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: overview, isLoading, error } = useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: async () => {
      const res = await api.get('/mortgages/overview');
      return res.data;
    },
  });

  const createMortgageMutation = useMutation({
    mutationFn: async (input: CreateMortgageInput) => {
      const res = await api.post('/mortgages', input);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
      queryClient.invalidateQueries({ queryKey: ['mortgages-list'] });
    },
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-rose-700">
        Failed to load portfolio overview. Please try refreshing.
      </div>
    );
  }

  const hasMortgages = overview && overview.totalMortgages > 0;

  return (
    <div className="space-y-8">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Financial Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time portfolio amortization, remaining balances, and payoff velocity
          </p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          <span>Add New Mortgage</span>
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Debt Remaining
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900">
            {formatCurrency(overview?.totalCurrentBalance || 0)}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Original: {formatCurrency(overview?.totalOriginalLoan || 0)}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Monthly Outflow (P&I + Escrow)
            </span>
            <div className="p-2 bg-sky-50 text-sky-600 rounded-lg">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900">
            {formatCurrency(overview?.totalMonthlyPayment || 0)}
          </div>
          <div className="mt-1 text-xs text-slate-500">Across {overview?.totalMortgages || 0} active loans</div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Principal Paid to Date
            </span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <TrendingDown className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900">
            {formatCurrency(overview?.totalPrincipalPaid || 0)}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Interest Paid: {formatCurrency(overview?.totalInterestPaid || 0)}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Portfolio Payoff Progress
            </span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Percent className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900">
            {overview?.overallProgress || 0}%
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, overview?.overallProgress || 0)}%` }}
            />
          </div>
        </Card>
      </div>

      {/* Mortgages List / Overview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Active Mortgage Portfolio</h2>
          {hasMortgages && (
            <Link to="/mortgages" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">
              View all mortgages &rarr;
            </Link>
          )}
        </div>

        {!hasMortgages ? (
          <Card className="p-12 text-center border-dashed border-2 border-slate-200">
            <div className="mx-auto w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-3">
              <Home className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">No mortgages added yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-6">
              Track your property financing, model accelerated payoff schedules, and see exactly how much interest you can save.
            </p>
            <Button onClick={() => setCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Mortgage
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {overview.mortgages.map((m: any) => {
              const progress = Math.min(
                100,
                Math.round(((m.originalBalance - m.currentBalance) / m.originalBalance) * 100)
              );

              return (
                <Card key={m.id} className="hover:border-slate-300 transition-all shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-base font-bold text-slate-900">{m.name}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">{m.propertyName}</p>
                      </div>
                      <Badge variant="success">{m.interestRate}% APR</Badge>
                    </div>

                    <div className="mt-5 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Current Balance:</span>
                        <span className="font-bold text-slate-900">{formatCurrency(m.currentBalance)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Monthly P&I:</span>
                        <span className="font-semibold text-slate-800">{formatCurrency(m.scheduledPayment)}/mo</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Loan Term:</span>
                        <span className="text-slate-700">{m.termYears} Years</span>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                        <span>Paid off: {progress}%</span>
                        <span>Original: {formatCurrency(m.originalBalance)}</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">Started {m.startDate}</span>
                    <Link
                      to={`/mortgages/${m.id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                    >
                      <span>Manage & Schedule</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <CreateMortgageModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={async (data) => {
          await createMortgageMutation.mutateAsync(data);
        }}
      />
    </div>
  );
};
