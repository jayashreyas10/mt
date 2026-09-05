import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { AmortizationRow } from '@mortgage-tracker/shared';

interface AmortizationChartProps {
  schedule: AmortizationRow[];
}

export const AmortizationChart: React.FC<AmortizationChartProps> = ({ schedule }) => {
  // Downsample data if large (e.g. sample every 6 or 12 months) for rendering performance
  const chartData = React.useMemo(() => {
    const step = schedule.length > 120 ? 6 : schedule.length > 60 ? 3 : 1;
    const sampled: any[] = [];

    for (let i = 0; i < schedule.length; i += step) {
      const row = schedule[i];
      sampled.push({
        date: row.paymentDate,
        month: `Mo ${row.paymentNumber}`,
        remainingBalance: row.endingBalance,
        principalPaid: row.cumulativePrincipal,
        interestPaid: row.cumulativeInterest,
      });
    }

    // Always include the last row
    const lastRow = schedule[schedule.length - 1];
    if (lastRow && sampled[sampled.length - 1]?.month !== `Mo ${lastRow.paymentNumber}`) {
      sampled.push({
        date: lastRow.paymentDate,
        month: `Mo ${lastRow.paymentNumber}`,
        remainingBalance: lastRow.endingBalance,
        principalPaid: lastRow.cumulativePrincipal,
        interestPaid: lastRow.cumulativeInterest,
      });
    }

    return sampled;
  }, [schedule]);

  const formatCurrency = (val: number) => `$${(val / 1000).toFixed(0)}k`;

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#0284c7" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="principalGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="interestGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
          <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
          <Tooltip
            formatter={(value: any) => [`$${Number(value).toLocaleString()}`, '']}
            contentStyle={{
              backgroundColor: '#0f172a',
              borderRadius: '8px',
              border: 'none',
              color: '#fff',
              fontSize: '12px',
            }}
          />
          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
          <Area
            type="monotone"
            dataKey="remainingBalance"
            name="Remaining Balance"
            stroke="#0284c7"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#balanceGrad)"
          />
          <Area
            type="monotone"
            dataKey="principalPaid"
            name="Principal Paid"
            stroke="#10b981"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#principalGrad)"
          />
          <Area
            type="monotone"
            dataKey="interestPaid"
            name="Interest Paid"
            stroke="#f43f5e"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#interestGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
