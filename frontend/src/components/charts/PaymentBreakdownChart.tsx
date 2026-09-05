import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';

interface PaymentBreakdownProps {
  principal: number;
  interest: number;
  propertyTax?: number;
  homeInsurance?: number;
  hoa?: number;
}

export const PaymentBreakdownChart: React.FC<PaymentBreakdownProps> = ({
  principal,
  interest,
  propertyTax = 0,
  homeInsurance = 0,
  hoa = 0,
}) => {
  const data = [
    { name: 'Principal', value: Math.round(principal * 100) / 100, color: '#10b981' },
    { name: 'Interest', value: Math.round(interest * 100) / 100, color: '#f43f5e' },
    ...(propertyTax > 0 ? [{ name: 'Property Tax', value: propertyTax, color: '#0ea5e9' }] : []),
    ...(homeInsurance > 0 ? [{ name: 'Home Insurance', value: homeInsurance, color: '#8b5cf6' }] : []),
    ...(hoa > 0 ? [{ name: 'HOA Fees', value: hoa, color: '#f59e0b' }] : []),
  ];

  const total = data.reduce((acc, cur) => acc + cur.value, 0);

  return (
    <div className="h-64 w-full flex flex-col items-center justify-center">
      <ResponsiveContainer width="100%" height="85%">
        <PieChart>
          <Pie
            data={data}
            innerRadius={55}
            outerRadius={80}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(val: any) => [`$${Number(val).toLocaleString()}`, '']}
            contentStyle={{
              backgroundColor: '#0f172a',
              borderRadius: '8px',
              border: 'none',
              color: '#fff',
              fontSize: '12px',
            }}
          />
          <Legend wrapperStyle={{ fontSize: '11px' }} />
        </PieChart>
      </ResponsiveContainer>
      <div className="text-xs text-slate-500 font-semibold -mt-2">
        Total Monthly Outflow: ${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
    </div>
  );
};
