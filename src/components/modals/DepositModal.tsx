import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Copy, Check, DollarSign, Wallet, QrCode } from 'lucide-react';
import { User, Account } from '../../types';

interface DepositModalProps {
  user: User;
  accounts: Account[];
  onClose: () => void;
  onSuccess: () => void;
}

export const DepositModal: React.FC<DepositModalProps> = ({ user, accounts, onClose, onSuccess }) => {
  const [copied, setCopied] = useState<string | null>(null);
  const [details, setDetails] = useState<User['depositDetails']>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [targetAccountId, setTargetAccountId] = useState(accounts[0]?.id || '');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/users/${user.uid}/deposit-details`)
      .then(res => res.json())
      .then(data => {
        setDetails(data);
        setLoading(false);
      });
  }, [user.uid]);

  const handleSubmitDeposit = async () => {
    if (!amount || isNaN(parseFloat(amount))) return alert('Please enter a valid amount.');
    setSubmitting(true);
    try {
      const res = await fetch('/api/deposits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          accountId: targetAccountId, 
          amount: parseFloat(amount),
          description: `Asset Deposit Request via ${methods[0]?.name || 'Bank'}`
        })
      });
      if (!res.ok) throw new Error('Submission failed');
      alert('Deposit Request Submitted. Our audit team will verify and approve your funds shortly.');
      onSuccess();
      onClose();
    } catch (err) {
      alert('Failed to submit deposit request.');
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const methods = [
    { id: 'paypal', name: 'PayPal', value: details?.paypal, icon: <DollarSign size={20} /> },
    { id: 'cashapp', name: 'Cash App', value: details?.cashapp, icon: <DollarSign size={20} /> },
    { id: 'zelle', name: 'Zelle', value: details?.zelle, icon: <DollarSign size={20} /> },
    { id: 'bitcoin', name: 'Bitcoin (BTC)', value: details?.bitcoin, icon: <QrCode size={20} /> },
    { id: 'bankInfo', name: 'Wire Transfer / Bank Account', value: details?.bankInfo, icon: <Wallet size={20} /> },
  ].filter(m => m.value);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl border border-slate-200"
      >
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Deposit Funds</h2>
              <p className="text-sm text-slate-500 mt-1">Select a method to fund your account</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400">
              <X size={20} />
            </button>
          </div>

          {loading ? (
            <div className="py-12 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : methods.length > 0 ? (
            <div className="space-y-6">
              <div className="bg-slate-50 border border-slate-100 p-6 rounded-2xl space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Target Account</label>
                  <select 
                    value={targetAccountId}
                    onChange={(e) => setTargetAccountId(e.target.value)}
                    className="w-full bg-white border border-slate-200 p-3 rounded-xl font-bold text-slate-800 outline-none"
                  >
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name} (**** {acc.id.slice(-4)})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Deposit Amount</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-800">$</span>
                    <input 
                      type="text"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full pl-8 pr-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-indigo-600 transition-all font-mono"
                    />
                  </div>
                </div>
              </div>

              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-2">Authenticated Deposit Channels</p>
              <div className="space-y-3">
                {methods.map((method) => (
                  <div 
                    key={method.id}
                    className="p-3 bg-slate-50 border border-slate-100 rounded-2xl group hover:border-indigo-200 transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
                          {method.icon}
                        </div>
                        <span className="font-bold text-slate-800 text-sm">{method.name}</span>
                      </div>
                      <button 
                        onClick={() => copyToClipboard(method.value!, method.id)}
                        className="p-1.5 hover:bg-indigo-50 text-indigo-600 rounded-lg transition-colors shrink-0"
                      >
                        {copied === method.id ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                      </button>
                    </div>
                    <div className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-slate-100 overflow-hidden">
                      <code className="text-[11px] font-semibold text-slate-600 break-all">{method.value}</code>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl">
                <p className="text-[10px] text-amber-800 leading-relaxed font-medium">
                  <span className="font-bold uppercase block mb-1">Important Instruction:</span>
                  Please include your full name and account number as the transaction reference. Once the transfer is complete, our audit team will verify and approve the deposit within 24 hours.
                </p>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign size={32} className="text-slate-300" />
              </div>
              <p className="text-slate-600 font-medium">No deposit methods assigned.</p>
              <p className="text-sm text-slate-400 mt-2">Please contact your Executive Advisor to activate deposit channels.</p>
            </div>
          )}

          <button 
            onClick={handleSubmitDeposit}
            disabled={submitting || !amount}
            className="w-full py-4 mt-8 bg-slate-900 text-white rounded-2xl font-bold uppercase tracking-[0.2em] hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 disabled:bg-slate-300 disabled:shadow-none"
          >
            {submitting ? 'Submitting...' : "I've Completed the Transfer"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
