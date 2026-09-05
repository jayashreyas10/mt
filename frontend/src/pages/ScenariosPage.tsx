import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import { Card } from '../components/ui/Card.js';
import { Badge } from '../components/ui/Badge.js';
import {
  GitCompare,
  PiggyBank,
  CheckCircle2,
} from 'lucide-react';
import { compareScenarios } from '@mortgage-tracker/shared';

export const ScenariosPage: React.FC = () => {
  const [selectedMortgageId, setSelectedMortgageId] = useState<string>('');

  // Scenario custom inputs
  const [extraB, setExtraB] = useState<number>(200);
  const [extraC, setExtraC] = useState<number>(500);
  const [lumpSumAmount, setLumpSumAmount] = useState<number>(10000);
  const [lumpSumMonth, setLumpSumMonth] = useState<number>(24);

  const { data: mortgages = [], isLoading: loadingMortgages } = useQuery({
    queryKey: ['mortgages-list'],
    queryFn: async () => {
      const res = await api.get('/mortgages');
      return res.data;
    },
  });

  // Set default selected mortgage once loaded
  React.useEffect(() => {
    if (mortgages.length > 0 && !selectedMortgageId) {
      setSelectedMortgageId(mortgages[0].id);
    }
  }, [mortgages, selectedMortgageId]);

  const selectedMortgage = mortgages.find((m: any) => m.id === selectedMortgageId);

  // Compute 4 scenarios comparison client-side using pure shared engine
  const scenariosComparison = React.useMemo(() => {
    if (!selectedMortgage) return [];

    const mortgageInput = {
      principal: selectedMortgage.originalBalance,
      annualInterestRate: selectedMortgage.interestRate,
      termYears: selectedMortgage.termYears,
      startDate: selectedMortgage.startDate?.split('T')[0] || '2026-01-01',
      scheduledPayment: selectedMortgage.scheduledPayment,
    };

    const scenarioDefs = [
      {
        id: 'scenarioA',
        name: 'Scenario A: Normal Payments',
        extraMonthlyAmount: 0,
      },
      {
        id: 'scenarioB',
        name: `Scenario B: +$${extraB}/month`,
        extraMonthlyAmount: extraB,
      },
      {
        id: 'scenarioC',
        name: `Scenario C: +$${extraC}/month`,
        extraMonthlyAmount: extraC,
      },
      {
        id: 'scenarioD',
        name: `Scenario D: $${lumpSumAmount.toLocaleString()} Lump Sum (Month ${lumpSumMonth})`,
        oneTimePayments: [{ amount: lumpSumAmount, targetMonth: lumpSumMonth }],
      },
    ];

    return compareScenarios(mortgageInput, scenarioDefs);
  }, [selectedMortgage, extraB, extraC, lumpSumAmount, lumpSumMonth]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Mortgage Scenario Comparison
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Compare 4 payoff strategies side-by-side to understand speed and interest elimination
          </p>
        </div>

        {mortgages.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Active Loan:</span>
            <select
              value={selectedMortgageId}
              onChange={(e) => setSelectedMortgageId(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 shadow-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              {mortgages.map((m: any) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({formatCurrency(m.originalBalance)})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loadingMortgages ? (
        <div className="h-64 bg-slate-200 animate-pulse rounded-xl"></div>
      ) : !selectedMortgage ? (
        <Card className="p-12 text-center">
          <GitCompare className="mx-auto h-12 w-12 text-slate-400 mb-3" />
          <h3 className="text-base font-semibold text-slate-800">No mortgages available for comparison</h3>
          <p className="text-xs text-slate-500 mt-1">
            Please add a mortgage loan from the dashboard before comparing strategies.
          </p>
        </Card>
      ) : (
        <>
          {/* Strategy Tuners */}
          <Card className="p-5 bg-slate-900 text-white border-slate-800">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <PiggyBank className="h-4 w-4 text-emerald-400" />
              <span>Customize Comparison Scenarios</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                  Scenario B (+Extra/mo)
                </label>
                <input
                  type="number"
                  step="50"
                  value={extraB}
                  onChange={(e) => setExtraB(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                  Scenario C (+Extra/mo)
                </label>
                <input
                  type="number"
                  step="50"
                  value={extraC}
                  onChange={(e) => setExtraC(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                  Scenario D (Lump Sum $)
                </label>
                <input
                  type="number"
                  step="1000"
                  value={lumpSumAmount}
                  onChange={(e) => setLumpSumAmount(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                  Scenario D (Target Month)
                </label>
                <input
                  type="number"
                  min="1"
                  max="360"
                  value={lumpSumMonth}
                  onChange={(e) => setLumpSumMonth(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          </Card>

          {/* 4 Cards Side-by-Side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {scenariosComparison.map((s, idx) => {
              const isBaseline = idx === 0;

              return (
                <Card
                  key={s.scenarioId}
                  className={`p-5 flex flex-col justify-between transition-all ${
                    isBaseline
                      ? 'border-slate-300 bg-white'
                      : 'border-emerald-300 bg-emerald-50/30 ring-1 ring-emerald-500/20'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                        {s.scenarioName.split(':')[0]}
                      </span>
                      {isBaseline ? (
                        <Badge variant="neutral">Baseline</Badge>
                      ) : (
                        <Badge variant="success">Accelerated</Badge>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 line-clamp-2 min-h-10">
                      {s.scenarioName}
                    </h4>

                    <div className="mt-4 space-y-2.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Payoff Date:</span>
                        <span className="font-bold text-slate-900">{s.payoffDate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Total Duration:</span>
                        <span className="font-semibold text-slate-700">
                          {Math.floor(s.totalMonths / 12)}y {s.totalMonths % 12}m
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Total Interest:</span>
                        <span className="font-semibold text-rose-600">{formatCurrency(s.totalInterest)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Total Outflow:</span>
                        <span className="font-semibold text-slate-900">{formatCurrency(s.totalAmountPaid)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-200">
                    {isBaseline ? (
                      <div className="text-center py-1 text-xs text-slate-400 font-medium">
                        Standard baseline reference
                      </div>
                    ) : (
                      <div className="bg-emerald-100/70 p-2.5 rounded-lg text-emerald-900 text-xs">
                        <div className="font-bold flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          <span>Save {formatCurrency(s.interestSaved)}</span>
                        </div>
                        <div className="text-[11px] text-emerald-700 mt-0.5">
                          Paid off {(s.monthsSaved / 12).toFixed(1)} yrs earlier!
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Full Side-by-side Comparative Table */}
          <Card className="p-0 overflow-hidden">
            <div className="p-4 bg-slate-100 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-800">
                Detailed Side-by-Side Comparison Metrics
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Metric</th>
                    {scenariosComparison.map((s) => (
                      <th key={s.scenarioId} className="py-3 px-4 text-right">
                        {s.scenarioName}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[12px]">
                  <tr>
                    <td className="py-3 px-4 font-sans font-semibold text-slate-900">Monthly P&I Payment</td>
                    {scenariosComparison.map((s) => (
                      <td key={s.scenarioId} className="py-3 px-4 text-right font-medium">
                        {formatCurrency(s.monthlyPayment)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-sans font-semibold text-slate-900">Extra Monthly Payment</td>
                    {scenariosComparison.map((s) => (
                      <td key={s.scenarioId} className="py-3 px-4 text-right text-emerald-600 font-semibold">
                        {s.extraMonthlyPayment > 0 ? `+${formatCurrency(s.extraMonthlyPayment)}/mo` : '—'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-sans font-semibold text-slate-900">One-Time Lump Sum</td>
                    {scenariosComparison.map((s) => (
                      <td key={s.scenarioId} className="py-3 px-4 text-right text-emerald-600 font-semibold">
                        {s.oneTimeTotal > 0 ? formatCurrency(s.oneTimeTotal) : '—'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-sans font-semibold text-slate-900">Payoff Date</td>
                    {scenariosComparison.map((s) => (
                      <td key={s.scenarioId} className="py-3 px-4 text-right font-bold text-slate-900 font-sans">
                        {s.payoffDate}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-sans font-semibold text-slate-900">Months Saved</td>
                    {scenariosComparison.map((s) => (
                      <td key={s.scenarioId} className="py-3 px-4 text-right font-bold text-emerald-600">
                        {s.monthsSaved > 0 ? `${s.monthsSaved} mo (${(s.monthsSaved / 12).toFixed(1)} yr)` : '0'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-sans font-semibold text-slate-900">Total Interest Paid</td>
                    {scenariosComparison.map((s) => (
                      <td key={s.scenarioId} className="py-3 px-4 text-right text-rose-600 font-semibold">
                        {formatCurrency(s.totalInterest)}
                      </td>
                    ))}
                  </tr>
                  <tr className="bg-emerald-50/50">
                    <td className="py-3 px-4 font-sans font-bold text-emerald-900">Total Interest Saved</td>
                    {scenariosComparison.map((s) => (
                      <td key={s.scenarioId} className="py-3 px-4 text-right font-extrabold text-emerald-700 text-sm">
                        {s.interestSaved > 0 ? formatCurrency(s.interestSaved) : '$0'}
                      </td>
                    ))}
                  </tr>
                  <tr className="bg-slate-50/80">
                    <td className="py-3 px-4 font-sans font-semibold text-slate-900">Total Cost (Principal + Interest)</td>
                    {scenariosComparison.map((s) => (
                      <td key={s.scenarioId} className="py-3 px-4 text-right font-bold text-slate-900">
                        {formatCurrency(s.totalAmountPaid)}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};
