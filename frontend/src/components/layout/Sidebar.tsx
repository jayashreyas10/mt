import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Landmark, GitCompare, ShieldCheck } from 'lucide-react';

interface SidebarProps {
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const navItems = [
    { label: 'Dashboard', to: '/', icon: LayoutDashboard },
    { label: 'Mortgages', to: '/mortgages', icon: Landmark },
    { label: 'Payoff Scenarios', to: '/scenarios', icon: GitCompare },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col h-full border-r border-slate-800 select-none">
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="bg-emerald-500 p-2 rounded-xl text-slate-950 font-bold">
          <Landmark className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-base font-bold tracking-tight text-white leading-tight">MortgageTrack</h1>
          <p className="text-xs text-slate-400 font-medium">Wealth & Amortization</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-5 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
              end={item.to === '/'}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 m-3 bg-slate-800/60 rounded-xl border border-slate-700/50 text-xs text-slate-400 flex items-center gap-2.5">
        <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />
        <span>Bank-grade 256-bit calculation precision.</span>
      </div>
    </aside>
  );
};
