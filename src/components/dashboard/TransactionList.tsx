
import React from 'react';
import { Transaction } from '../../types';
import { ArrowUpRight, ArrowDownLeft, ShoppingBag, Coffee, Car, DollarSign, Activity } from 'lucide-react';
import { format } from 'date-fns';

interface TransactionListProps {
  transactions: Transaction[];
}

const getCategoryIcon = (category: string) => {
  switch (category.toLowerCase()) {
    case 'food & drink': return <Coffee size={18} />;
    case 'transportation': return <Car size={18} />;
    case 'income': return <DollarSign size={18} />;
    case 'shopping': return <ShoppingBag size={18} />;
    case 'transfer': return <Activity size={18} />;
    default: return <ShoppingBag size={18} />;
  }
};

export const TransactionList: React.FC<TransactionListProps> = ({ transactions }) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold text-text-main">Recent Activity</h2>
        <button className="text-xs font-bold text-brand-primary uppercase tracking-wider hover:underline">
          View All
        </button>
      </div>
      
      <div className="bg-white border border-border-subtle rounded-2xl shadow-sm overflow-hidden">
        {/* Mobile View - List */}
        <div className="md:hidden divide-y divide-slate-100">
          {transactions.map((tx) => (
            <div key={tx.id} className="p-4 active:bg-slate-50 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-text-muted border border-slate-100">
                  {getCategoryIcon(tx.category)}
                </div>
                <div>
                  <p className="font-bold text-text-main text-sm leading-tight mb-0.5">{tx.description}</p>
                  <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">
                    {format(new Date(tx.date), 'MMM d')} • {tx.category}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-bold text-sm ${tx.amount > 0 ? 'text-green-600' : 'text-text-main'}`}>
                  {tx.amount > 0 ? '+' : ''}{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(tx.amount)}
                </p>
                <p className={`text-[10px] font-bold uppercase tracking-widest ${
                  tx.status === 'pending' ? 'text-amber-500' : 
                  tx.status === 'rejected' ? 'text-red-500' : 
                  'text-text-muted'
                }`}>
                  {tx.status}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop View - Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-text-muted font-bold border-b border-border-subtle">
              <tr>
                <th className="px-6 py-3 font-bold">Transaction</th>
                <th className="px-6 py-3 font-bold">Category</th>
                <th className="px-6 py-3 font-bold">Date</th>
                <th className="px-6 py-3 text-right font-bold">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-text-muted">
                        {getCategoryIcon(tx.category)}
                      </div>
                      <div>
                        <p className="font-semibold text-text-main text-sm">{tx.description}</p>
                        <p className={`text-xs font-bold uppercase tracking-tighter ${
                          tx.status === 'pending' ? 'text-amber-500' : 
                          tx.status === 'rejected' ? 'text-red-500' : 
                          'text-text-muted'
                        }`}>
                          {tx.status === 'completed' ? 'Settled' : tx.status}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-brand-primary/10 text-brand-primary rounded-md text-[10px] font-bold uppercase">
                      {tx.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-text-muted font-medium">
                    {format(new Date(tx.date), 'MMM d, yyyy')}
                  </td>
                  <td className={`px-6 py-4 text-right font-bold text-sm ${tx.amount > 0 ? 'text-green-600' : 'text-text-main'}`}>
                    {tx.amount > 0 ? '+' : ''}{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(tx.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {transactions.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-sm text-text-muted font-medium">No transactions found.</p>
          </div>
        )}
      </div>
    </div>
  );
};
