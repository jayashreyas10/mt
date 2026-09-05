import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { Card } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { Badge } from '../components/ui/Badge.js';
import { CreateMortgageModal } from '../components/mortgage/CreateMortgageModal.js';
import {
  Landmark,
  Plus,
  Search,
  Trash2,
  ExternalLink,
  Home,
} from 'lucide-react';
import { CreateMortgageInput } from '@mortgage-tracker/shared';

export const MortgagesList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const queryClient = useQueryClient();

  const { data: mortgages = [], isLoading } = useQuery({
    queryKey: ['mortgages-list'],
    queryFn: async () => {
      const res = await api.get('/mortgages');
      return res.data;
    },
  });

  const createMortgageMutation = useMutation({
    mutationFn: async (input: CreateMortgageInput) => {
      const res = await api.post('/mortgages', input);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mortgages-list'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
    },
  });

  const deleteMortgageMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/mortgages/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mortgages-list'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
    },
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const filtered = mortgages.filter((m: any) =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.property?.propertyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.property?.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Mortgage Loans
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your financed properties, balances, and payment schedules
          </p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          <span>Add New Mortgage</span>
        </Button>
      </div>

      <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200">
        <Search className="h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by loan name, property, or address..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-slate-200 rounded-xl"></div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-2 border-slate-200">
          <div className="mx-auto w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-3">
            <Landmark className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-800">
            {searchTerm ? 'No mortgages match your search' : 'No mortgages found'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-6">
            {searchTerm
              ? 'Try changing your search terms or clearing the input filter.'
              : 'Add your first property mortgage to begin tracking amortization and extra payment benefits.'}
          </p>
          {!searchTerm && (
            <Button onClick={() => setCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Mortgage
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((m: any) => {
            const progress = Math.min(
              100,
              Math.round(((m.originalBalance - m.currentBalance) / m.originalBalance) * 100)
            );

            return (
              <Card key={m.id} className="flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{m.name}</h3>
                      {m.property && (
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Home className="h-3.5 w-3.5 text-slate-400" />
                          <span>{m.property.propertyName}</span>
                        </p>
                      )}
                    </div>
                    <Badge variant="success">{m.interestRate}% APR</Badge>
                  </div>

                  <div className="mt-5 space-y-2.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Current Balance</span>
                      <span className="font-bold text-slate-900">{formatCurrency(m.currentBalance)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Original Balance</span>
                      <span className="text-slate-700">{formatCurrency(m.originalBalance)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Monthly P&I</span>
                      <span className="font-semibold text-slate-800">{formatCurrency(m.scheduledPayment)}/mo</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Term / Start</span>
                      <span className="text-slate-700">{m.termYears}y &bull; {m.startDate?.split('T')[0]}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                      <span>Loan Equity: {progress}%</span>
                      <span>Balance: {formatCurrency(m.currentBalance)}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete mortgage "${m.name}"? This action cannot be undone.`)) {
                        deleteMortgageMutation.mutate(m.id);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete mortgage"
                    aria-label="Delete mortgage"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>

                  <Link to={`/mortgages/${m.id}`}>
                    <Button variant="outline" size="sm" className="text-xs flex items-center gap-1.5">
                      <span>View Details & Schedule</span>
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}

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
