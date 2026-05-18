
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowRight, Wallet, Users, Landmark } from 'lucide-react';
import { Account } from '../../types';
import { api } from '../../services/api';

interface TransferModalProps {
  accounts: Account[];
  onClose: () => void;
  onSuccess: () => void;
}

export const TransferModal: React.FC<TransferModalProps> = ({ accounts, onClose, onSuccess }) => {
  const [fromId, setFromId] = useState(accounts[0]?.id || '');
  const [toId, setToId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTransfer = async () => {
    if (!fromId || !toId || !amount || parseFloat(amount) <= 0) {
      setError('Please fill in all fields correctly');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await api.transfer({
        fromId,
        toId,
        amount: parseFloat(amount),
        description
      });

      if (res.error) {
        setError(res.error);
      } else {
        onSuccess();
        onClose();
      }
    } catch (err) {
      setError('Transfer failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        className="bg-white w-full max-w-lg rounded-[32px] overflow-hidden shadow-2xl border border-slate-200"
      >
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Make a Transfer</h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 text-red-600 text-xs font-bold uppercase tracking-wider rounded-xl border border-red-100">
                {error}
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">From Account</label>
              <select 
                value={fromId}
                onChange={(e) => setFromId(e.target.value)}
                className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none appearance-none font-semibold text-slate-800"
              >
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name} ({new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(acc.balance)})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">To Account / Recipient</label>
              <div className="relative">
                <input 
                  type="text"
                  placeholder="Account number or name"
                  value={toId}
                  onChange={(e) => setToId(e.target.value)}
                  className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none font-semibold text-slate-800"
                />
              </div>
              <div className="flex gap-2 mt-3 flex-wrap">
                {accounts.filter(a => a.id !== fromId).map(a => (
                  <button 
                    key={a.id} 
                    onClick={() => setToId(a.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-bold uppercase hover:bg-indigo-600 hover:text-white transition-all border border-indigo-100"
                  >
                    <Wallet size={12} /> {a.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">$</span>
                  <input 
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full p-4 pl-8 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none font-bold text-slate-800"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">Reference</label>
                <input 
                  type="text"
                  placeholder="Optional"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none font-semibold text-slate-800"
                />
              </div>
            </div>

            <button 
              onClick={handleTransfer}
              disabled={isLoading}
              className="w-full sleek-button-primary mt-4 flex items-center justify-center gap-2 py-4"
            >
              {isLoading ? 'Processing...' : (
                <>Confirm Transfer <ArrowRight size={18} /></>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
