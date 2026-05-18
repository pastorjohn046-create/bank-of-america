
import React from 'react';
import { motion } from 'motion/react';
import { CreditCard, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { Account } from '../../types';

interface BalanceCardProps {
  account: Account;
  isActive?: boolean;
  onClick?: () => void;
  onSend?: (e: React.MouseEvent) => void;
  onAdd?: (e: React.MouseEvent) => void;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({ account, isActive, onClick, onSend, onAdd }) => {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`sleek-card cursor-pointer transition-all ${
        isActive ? 'ring-2 ring-brand-primary' : 'hover:shadow-md'
      } ${account.type === 'savings' ? 'bg-gradient-to-br from-brand-primary to-brand-secondary text-white border-none shadow-lg shadow-brand-primary/20' : ''}`}
    >
      <div className="flex justify-between items-start mb-8">
        <div className={`p-2 rounded-xl ${account.type === 'savings' ? 'bg-white/10 text-white' : 'bg-brand-primary/5 text-brand-primary'}`}>
          <CreditCard size={24} />
        </div>
        <span className={`text-[10px] font-bold uppercase tracking-wider ${account.type === 'savings' ? 'text-white/60' : 'text-text-muted'}`}>
          {account.type}
        </span>
      </div>
      
      <div>
        <h3 className={`text-sm font-medium mb-1 ${account.type === 'savings' ? 'text-white/80' : 'text-text-muted'}`}>{account.name}</h3>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold tracking-tight">
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: account.currency }).format(account.balance)}
          </span>
        </div>
        <p className={`text-xs font-mono mt-4 ${account.type === 'savings' ? 'text-white/40' : 'text-text-muted/40'}`}>{account.number}</p>
      </div>
      
      <div className="mt-6 flex gap-3">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onSend?.(e);
          }}
          className={`flex-1 flex items-center justify-center gap-1 text-xs font-bold uppercase py-2.5 rounded-lg transition-all ${
          account.type === 'savings' ? 'bg-white text-brand-primary hover:bg-white/90' : 'bg-brand-primary text-white hover:bg-brand-secondary'
        }`}>
          <ArrowUpRight size={14} /> Send
        </button>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onAdd?.(e);
          }}
          className={`flex-1 flex items-center justify-center gap-1 text-xs font-bold uppercase py-2.5 rounded-lg transition-all ${
          account.type === 'savings' ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-slate-50 text-text-main hover:bg-slate-100'
        }`}>
          <ArrowDownLeft size={14} /> Add
        </button>
      </div>
    </motion.div>
  );
};
