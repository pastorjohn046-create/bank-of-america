
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowRight, Wallet, Users, Landmark } from 'lucide-react';
import { Account } from '../../types';
import { api } from '../../services/api';

interface TransferModalProps {
  accounts: Account[];
  onClose: () => void;
  onSuccess: () => void;
  initialType?: 'internal' | 'external';
  lockType?: boolean;
}

export const TransferModal: React.FC<TransferModalProps> = ({ 
  accounts, 
  onClose, 
  onSuccess, 
  initialType = 'internal',
  lockType = false
}) => {
  const [transferType, setTransferType] = useState<'internal' | 'external'>(initialType);
  const [fromId, setFromId] = useState(accounts[0]?.id || '');
  const [toId, setToId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // External Bank Fields
  const [bankName, setBankName] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');
  const [swiftCode, setSwiftCode] = useState('');

  const handleTransfer = async () => {
    if (!fromId || !amount || parseFloat(amount) <= 0) {
      setError('Please fill in required fields correctly');
      return;
    }

    if (transferType === 'internal' && !toId) {
      setError('Please specify a recipient');
      return;
    }

    if (transferType === 'external' && (!bankName || !toId || !routingNumber)) {
      setError('External wire requires Bank Name, Account Number, and Routing Number');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await api.transfer({
        fromId,
        toId: transferType === 'internal' ? toId : `${bankName} | ${toId}`,
        amount: parseFloat(amount),
        description: transferType === 'external' ? `Wire to ${bankName}: ${description}` : description
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
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Executive Transfer</h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <X size={20} />
            </button>
          </div>

          {!lockType && (
            <div className="flex gap-2 p-1 bg-slate-100 rounded-xl mb-8">
              <button 
                onClick={() => setTransferType('internal')}
                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${transferType === 'internal' ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-500'}`}
              >
                Elite Member
              </button>
              <button 
                onClick={() => setTransferType('external')}
                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${transferType === 'external' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500'}`}
              >
                External Bank
              </button>
            </div>
          )}

          <div className="space-y-5">
            {error && (
              <div className="p-4 bg-red-50 text-red-600 text-[10px] font-bold uppercase tracking-wider rounded-xl border border-red-100">
                {error}
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-2">Debit Account</label>
              <select 
                value={fromId}
                onChange={(e) => setFromId(e.target.value)}
                className="w-full p-3.5 bg-slate-50 border border-slate-100 rounded-xl outline-none font-semibold text-slate-800 focus:bg-white focus:border-blue-900 transition-all appearance-none"
              >
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name}</option>
                ))}
              </select>
            </div>

            {transferType === 'internal' ? (
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-2">Elite Recipient</label>
                <div className="relative">
                  <input 
                    type="text"
                    placeholder="Recipient ID or Name"
                    value={toId}
                    onChange={(e) => setToId(e.target.value)}
                    className="w-full p-3.5 bg-slate-50 border border-slate-100 rounded-xl outline-none font-semibold text-slate-800 focus:bg-white focus:border-blue-900 transition-all"
                  />
                </div>
                <div className="flex gap-2 mt-3 overflow-x-auto pb-1 no-scrollbar">
                  {accounts.filter(a => a.id !== fromId).map(a => (
                    <button 
                      key={a.id} 
                      onClick={() => setToId(a.id)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-900 rounded-lg text-[10px] font-bold uppercase hover:bg-blue-900 hover:text-white transition-all whitespace-nowrap"
                    >
                      <Users size={12} /> {a.name.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-2">Bank Name</label>
                    <input 
                      type="text"
                      placeholder="e.g. Chase"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full p-3.5 bg-slate-50 border border-slate-100 rounded-xl outline-none font-semibold text-red-600 focus:bg-white focus:border-red-600 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-2">Account Number</label>
                    <input 
                      type="text"
                      placeholder="Recipient Account"
                      value={toId}
                      onChange={(e) => setToId(e.target.value)}
                      className="w-full p-3.5 bg-slate-50 border border-slate-100 rounded-xl outline-none font-semibold text-red-600 focus:bg-white focus:border-red-600 transition-all"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-2">Routing (ABA)</label>
                    <input 
                      type="text"
                      placeholder="9-digit Routing"
                      value={routingNumber}
                      onChange={(e) => setRoutingNumber(e.target.value)}
                      className="w-full p-3.5 bg-slate-50 border border-slate-100 rounded-xl outline-none font-semibold text-red-600 focus:bg-white focus:border-red-600 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-2">SWIFT / BIC</label>
                    <input 
                      type="text"
                      placeholder="International Code"
                      value={swiftCode}
                      onChange={(e) => setSwiftCode(e.target.value)}
                      className="w-full p-3.5 bg-slate-50 border border-slate-100 rounded-xl outline-none font-semibold text-red-600 focus:bg-white focus:border-red-600 transition-all"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-2">Transfer Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">$</span>
                  <input 
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full p-3.5 pl-8 bg-slate-50 border border-slate-100 rounded-xl outline-none font-bold text-slate-800 focus:bg-white focus:border-blue-900 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-2">Executive Note</label>
                <input 
                  type="text"
                  placeholder="Memo"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3.5 bg-slate-50 border border-slate-100 rounded-xl outline-none font-semibold text-slate-800 focus:bg-white focus:border-blue-900 transition-all"
                />
              </div>
            </div>

            <button 
              onClick={handleTransfer}
              disabled={isLoading}
              className={`w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-bold uppercase tracking-[0.2em] transition-all shadow-xl ${
                transferType === 'internal' 
                ? 'bg-blue-900 text-white shadow-blue-900/20 hover:bg-blue-800' 
                : 'bg-red-600 text-white shadow-red-600/20 hover:bg-red-700'
              } ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isLoading ? 'Securing Funds...' : (
                <>Authorize {transferType === 'internal' ? 'Elite' : 'Wire'} Transfer <ArrowRight size={18} /></>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
