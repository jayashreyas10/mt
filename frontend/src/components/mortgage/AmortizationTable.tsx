import React, { useState, useMemo } from 'react';
import { AmortizationRow } from '@mortgage-tracker/shared';
import { Download, Search, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';
import { Button } from '../ui/Button.js';

interface AmortizationTableProps {
  schedule: AmortizationRow[];
  mortgageName: string;
}

export const AmortizationTable: React.FC<AmortizationTableProps> = ({ schedule, mortgageName }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize, setPageSize] = useState(12);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<keyof AmortizationRow>('paymentNumber');
  const [sortAsc, setSortAsc] = useState(true);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(val);
  };

  const handleSort = (field: keyof AmortizationRow) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  // Filter and sort schedule
  const filteredSchedule = useMemo(() => {
    return schedule.filter((row) => {
      const matchSearch =
        row.paymentNumber.toString().includes(searchTerm) ||
        row.paymentDate.includes(searchTerm);
      return matchSearch;
    }).sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortAsc ? Number(valA) - Number(valB) : Number(valB) - Number(valA);
    });
  }, [schedule, searchTerm, sortField, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(filteredSchedule.length / pageSize));
  const displayedRows = filteredSchedule.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const exportToCSV = () => {
    const headers = [
      '#',
      'Date',
      'Beginning Balance',
      'Scheduled Payment',
      'Extra Payment',
      'Total Payment',
      'Principal',
      'Interest',
      'Ending Balance',
      'Cumulative Interest',
      'Cumulative Principal',
    ];

    const csvContent = [
      headers.join(','),
      ...schedule.map((r) =>
        [
          r.paymentNumber,
          r.paymentDate,
          r.beginningBalance,
          r.scheduledPayment,
          r.extraPayment,
          r.totalPayment,
          r.principal,
          r.interest,
          r.endingBalance,
          r.cumulativeInterest,
          r.cumulativePrincipal,
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${mortgageName.replace(/\s+/g, '_')}_amortization.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search month or date (e.g. 2027)..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span>Show:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-700"
            >
              <option value={12}>12 mo (1 yr)</option>
              <option value={24}>24 mo (2 yr)</option>
              <option value={60}>60 mo (5 yr)</option>
              <option value={120}>120 mo (10 yr)</option>
              <option value={360}>All payments</option>
            </select>
          </div>

          <Button variant="outline" size="sm" onClick={exportToCSV} className="text-xs flex items-center gap-1.5">
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-xs bg-white">
        <table className="w-full text-left text-xs text-slate-600 border-collapse">
          <thead className="bg-slate-100/80 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3 px-3 cursor-pointer hover:bg-slate-200/60" onClick={() => handleSort('paymentNumber')}>
                <div className="flex items-center gap-1">
                  <span>#</span>
                  <ArrowUpDown className="h-3 w-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-3 cursor-pointer hover:bg-slate-200/60" onClick={() => handleSort('paymentDate')}>
                <div className="flex items-center gap-1">
                  <span>Date</span>
                  <ArrowUpDown className="h-3 w-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-3 text-right cursor-pointer hover:bg-slate-200/60" onClick={() => handleSort('beginningBalance')}>
                Beginning Balance
              </th>
              <th className="py-3 px-3 text-right">Payment</th>
              <th className="py-3 px-3 text-right text-emerald-700">Extra</th>
              <th className="py-3 px-3 text-right">Principal</th>
              <th className="py-3 px-3 text-right text-rose-700">Interest</th>
              <th className="py-3 px-3 text-right cursor-pointer hover:bg-slate-200/60" onClick={() => handleSort('endingBalance')}>
                Ending Balance
              </th>
              <th className="py-3 px-3 text-right text-slate-400">Total Interest</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono text-[12px]">
            {displayedRows.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-400 font-sans">
                  No amortization entries matched your filter.
                </td>
              </tr>
            ) : (
              displayedRows.map((row) => (
                <tr key={row.paymentNumber} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-slate-800">{row.paymentNumber}</td>
                  <td className="py-2.5 px-3 font-sans text-slate-600">{row.paymentDate}</td>
                  <td className="py-2.5 px-3 text-right text-slate-700">{formatCurrency(row.beginningBalance)}</td>
                  <td className="py-2.5 px-3 text-right font-semibold text-slate-900">{formatCurrency(row.scheduledPayment)}</td>
                  <td className="py-2.5 px-3 text-right font-semibold text-emerald-600">
                    {row.extraPayment > 0 ? `+${formatCurrency(row.extraPayment)}` : '—'}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-800">{formatCurrency(row.principal)}</td>
                  <td className="py-2.5 px-3 text-right text-rose-600">{formatCurrency(row.interest)}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-slate-900">{formatCurrency(row.endingBalance)}</td>
                  <td className="py-2.5 px-3 text-right text-slate-400">{formatCurrency(row.cumulativeInterest)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      <div className="flex items-center justify-between px-2 pt-1 text-xs text-slate-500">
        <div>
          Showing {filteredSchedule.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{' '}
          {Math.min(currentPage * pageSize, filteredSchedule.length)} of {filteredSchedule.length} payments
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="h-7 w-7 p-0 flex items-center justify-center"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-semibold text-slate-700">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="h-7 w-7 p-0 flex items-center justify-center"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
