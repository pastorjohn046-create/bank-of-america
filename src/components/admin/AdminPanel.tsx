import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  Database, 
  ShieldCheck, 
  Activity, 
  Plus,
  RefreshCw,
  Wallet,
  ReceiptText,
  CreditCard
} from 'lucide-react';
import { Account } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

interface AdminMetrics {
  totalDeposits: number;
  totalTransactions: number;
  pendingBills: number;
  activeUsers: number;
  systemIntegrity: string;
  availableCredit: number;
}

export const AdminPanel = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<{ id: string, accountId: string, amount: number, description: string, status: string, type: string, date: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState<'overview' | 'accounts' | 'transactions' | 'bills' | 'approvals'>('overview');

  // Form States
  const [selectedAccId, setSelectedAccId] = useState('');
  const [editName, setEditName] = useState('');
  const [newBalance, setNewBalance] = useState('');
  const [newCredit, setNewCredit] = useState('');
  const [accountStatus, setAccountStatus] = useState<'active' | 'disabled'>('active');
  const [isDepositRestricted, setIsDepositRestricted] = useState(false);

  const handleUpdateDepositDetails = async () => {
    if (!selectedAccId) return;
    const acc = accounts.find(a => a.id === selectedAccId);
    if (!acc) return;
    
    try {
      const res = await fetch(`/api/admin/users/${acc.userId}/deposit-details`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          paypal: pp, 
          cashapp: ca, 
          zelle: zl, 
          bitcoin: bc, 
          bankInfo: bi 
        })
      });
      if (!res.ok) throw new Error('Update failed');
      showStatus('User deposit instructions secured');
    } catch (err) {
       showStatus('Failed to update deposit instructions', 'error');
    }
  };

  const [statusMsg, setStatusMsg] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const [adminLogs, setAdminLogs] = useState<{ id: string, msg: string, time: string }[]>([]);
  const [customLog, setCustomLog] = useState('');

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/admin/logs');
      const data = await res.json();
      setAdminLogs(data);
    } catch (err) {
      console.error("Error fetching logs:", err);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 10000); // Polling logs every 10s
    return () => clearInterval(interval);
  }, []);

  const addLog = async (msg: string) => {
    try {
      await fetch('/api/admin/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ msg })
      });
      fetchLogs();
    } catch (err) {
      console.error("Error creating log:", err);
    }
  };

  const handleCreateCustomLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customLog.trim()) return;
    await addLog(`[ADMIN CORE]: ${customLog}`);
    setCustomLog('');
    showStatus('Custom log entry committed to registry');
  };

  const showStatus = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMsg({ text, type });
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const [txDesc, setTxDesc] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txCat, setTxCat] = useState('Other');
  
  const [billName, setBillName] = useState('');
  const [billAmount, setBillAmount] = useState('');
  const [billDue, setBillDue] = useState('');
  const [billCat, setBillCat] = useState('Utility');

  // Deposit Details States
  const [pp, setPp] = useState('');
  const [ca, setCa] = useState('');
  const [zl, setZl] = useState('');
  const [bc, setBc] = useState('');
  const [bi, setBi] = useState('');

  const fetchAll = async () => {
    setIsLoading(true);
    try {
      const [mRes, aRes, tRes] = await Promise.all([
        fetch('/api/admin/metrics'),
        fetch('/api/accounts'),
        fetch('/api/transactions')
      ]);
      const metricsData = await mRes.json();
      setMetrics(metricsData);
      const accs = await aRes.json();
      setAccounts(accs);
      const txs = await tRes.json();
      setTransactions(txs);
      
      if (accs.length > 0) {
        const currentSelectedId = selectedAccId || accs[0].id;
        const currentSelected = accs.find((a: Account) => a.id === currentSelectedId);
        if (currentSelected) {
          setSelectedAccId(currentSelected.id);
          setEditName(currentSelected.name);
          setNewBalance(currentSelected.balance.toString());
          setNewCredit(currentSelected.creditLimit?.toString() || '');
          setAccountStatus(currentSelected.status);
          setIsDepositRestricted(currentSelected.depositRestricted);

          // Fetch user's deposit details
          const dRes = await fetch(`/api/users/${currentSelected.userId}/deposit-details`);
          const dData = await dRes.json();
          setPp(dData.paypal || '');
          setCa(dData.cashapp || '');
          setZl(dData.zelle || '');
          setBc(dData.bitcoin || '');
          setBi(dData.bankInfo || '');
        }
      }
    } catch (err) {
      console.error(err);
      showStatus('Failed to sync system data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleAccountChange = (id: string, switchTab = false) => {
    setSelectedAccId(id);
    const acc = accounts.find(a => a.id === id);
    if (acc) {
      setEditName(acc.name);
      setNewBalance(acc.balance.toString());
      setNewCredit(acc.creditLimit?.toString() || '');
      setAccountStatus(acc.status);
      setIsDepositRestricted(acc.depositRestricted);
      if (switchTab) setActiveView('accounts');
    }
  };

  const handleUpdateAccount = async () => {
    if (!selectedAccId) return;
    try {
      const res = await fetch(`/api/admin/accounts/${selectedAccId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          balance: newBalance,
          name: editName,
          creditLimit: newCredit,
          status: accountStatus,
          depositRestricted: isDepositRestricted
        })
      });
      if (!res.ok) throw new Error('Update failed');
      addLog(`Updated account ${selectedAccId}: ${editName}`);
      showStatus('Entity profile updated successfully');
      fetchAll();
    } catch (err) {
      showStatus('Failed to update entity', 'error');
    }
  };

  const handleAddTx = async () => {
    if (!selectedAccId || !txDesc || !txAmount) return;
    try {
      const res = await fetch('/api/admin/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: selectedAccId,
          description: txDesc,
          amount: txAmount,
          category: txCat
        })
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Transaction failed');
      }
      addLog(`Injected ${txAmount} to ${selectedAccId}`);
      showStatus('Transaction recorded and balance settled');
      setTxDesc('');
      setTxAmount('');
      fetchAll();
    } catch (err: any) {
      showStatus(err.message, 'error');
    }
  };

  const handleAddBill = async () => {
    if (!billName || !billAmount || !billDue) return;
    try {
      await fetch('/api/admin/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: billName,
          amount: billAmount,
          dueDate: billDue,
          category: billCat,
          accountId: selectedAccId
        })
      });
      addLog(`Issued bill ${billName} for ${billAmount}`);
      showStatus('Bill dispatched to targeted account');
      setBillName('');
      setBillAmount('');
      fetchAll();
    } catch (err) {
      showStatus('Failed to issue bill', 'error');
    }
  };

  const handleTxDecision = async (id: string, action: 'approve' | 'reject') => {
    try {
      const res = await fetch(`/api/admin/transactions/${id}/${action}`, { method: 'POST' });
      if (!res.ok) throw new Error(`${action} failed`);
      showStatus(`Transaction ${action}d successfully`);
      fetchAll();
    } catch (err) {
      showStatus(`Failed to ${action} transaction`, 'error');
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-800 text-center sm:text-left">Admin Control Center</h2>
          <p className="text-slate-500 mt-1 text-center sm:text-left">System-wide overrides and multi-user management.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={fetchAll}
            className="flex-1 sm:flex-none p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm flex items-center justify-center"
          >
            <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>
      
      {statusMsg && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`fixed top-8 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl shadow-2xl font-bold text-sm ${
            statusMsg.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
          }`}
        >
          {statusMsg.text}
        </motion.div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {[
          { id: 'overview', label: 'System Overview', icon: Activity },
          { id: 'accounts', label: 'Profile & Credit', icon: Wallet },
          { id: 'transactions', label: 'Insert Activity', icon: Database },
          { id: 'bills', label: 'Manage Bills', icon: ReceiptText },
          { id: 'approvals', label: 'Asset Approvals', icon: ShieldCheck },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id as any)}
            className={`whitespace-nowrap px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 border ${
              activeView === tab.id 
                ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-200' 
                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Primary Target Account</label>
        <select 
          value={selectedAccId}
          onChange={(e) => handleAccountChange(e.target.value)}
          className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-brand-primary/10"
        >
          {accounts.map(acc => (
            <option key={acc.id} value={acc.id}>
              {acc.name} - {acc.type} ({acc.number}) | ${acc.balance.toLocaleString()}
            </option>
          ))}
        </select>
      </div>

      {activeView === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Users, label: 'Entities', value: metrics?.activeUsers || '...', color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { icon: Wallet, label: 'AUM', value: metrics ? `$${(metrics.totalDeposits / 1000).toFixed(1)}k` : '...', color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { icon: ShieldCheck, label: 'Pending Queue', value: metrics?.pendingTransactions || '0', color: 'text-amber-600', bg: 'bg-amber-50', onClick: () => setActiveView('approvals') },
            { icon: Activity, label: 'Integrity', value: metrics?.systemIntegrity || '...', color: 'text-purple-600', bg: 'bg-purple-50' },
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={stat.onClick}
              className={`sleek-card flex items-center gap-4 ${stat.onClick ? 'cursor-pointer hover:border-amber-200' : ''}`}
            >
              <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center`}>
                <stat.icon size={24} />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
                <p className="text-xl font-bold text-slate-800">{stat.value}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {activeView === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="sleek-card border-dashed bg-slate-50/50 lg:col-span-2"
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Activity size={14} /> Living System Registry
              </h4>
              <span className="text-[10px] text-emerald-500 font-bold bg-emerald-50 px-2 py-0.5 rounded-full ring-1 ring-emerald-500/20">LIVE</span>
            </div>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
              {adminLogs.map(log => (
                <div key={log.id} className="flex justify-between items-center text-xs animate-in fade-in slide-in-from-left-2 duration-300">
                  <span className="text-slate-600 font-medium">{log.msg}</span>
                  <span className="text-slate-400 font-mono">{log.time}</span>
                </div>
              ))}
              {adminLogs.length === 0 && <p className="text-center py-10 text-slate-400 text-xs italic">Awaiting system events...</p>}
            </div>
          </motion.div>

          <div className="sleek-card border-indigo-100 bg-indigo-50/30">
            <h4 className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest mb-4">Manual Entry</h4>
            <form onSubmit={handleCreateCustomLog} className="space-y-4">
              <textarea 
                value={customLog}
                onChange={(e) => setCustomLog(e.target.value)}
                placeholder="Enter system broadcast..."
                className="w-full bg-white border border-indigo-100 rounded-xl p-3 text-xs font-medium outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all resize-none h-24"
              />
              <button 
                type="submit"
                className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
              >
                Commit to Log
              </button>
            </form>
          </div>
        </div>
      )}

      {activeView === 'accounts' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="sleek-card">
            <h3 className="font-bold text-slate-800 mb-6">Modify Entity Profile</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Display Name</label>
                <input 
                  type="text"
                  placeholder="Full Name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Balance Override</label>
                  <input 
                    type="number"
                    value={newBalance}
                    onChange={(e) => setNewBalance(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Credit limit</label>
                  <input 
                    type="number"
                    value={newCredit}
                    onChange={(e) => setNewCredit(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  />
                </div>
              </div>
              <button onClick={handleUpdateAccount} className="w-full sleek-button-primary">
                Save Profile Changes
              </button>
            </div>
          </div>

          <div className="sleek-card bg-slate-900 text-white">
            <h3 className="font-bold mb-4">Master Security Panel</h3>
            <p className="text-xs text-slate-400 mb-6 font-medium italic">Administrative locks and verification status.</p>
            <div className="space-y-6">
              <div className="space-y-3">
                <div 
                  onClick={() => setAccountStatus(prev => prev === 'active' ? 'disabled' : 'active')}
                  className={`flex justify-between items-center p-4 rounded-xl cursor-pointer transition-all border ${
                    accountStatus === 'disabled' 
                      ? 'bg-red-500/20 border-red-500/50' 
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                   <div className="flex items-center gap-3">
                     <ShieldCheck size={20} className={accountStatus === 'disabled' ? 'text-red-400' : 'text-emerald-400'} />
                     <div>
                        <p className="text-sm font-bold">Account Access</p>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">
                          {accountStatus === 'active' ? 'Full Access' : 'Completely Frozen'}
                        </p>
                     </div>
                   </div>
                   <span className={`px-2 py-1 text-[9px] font-bold uppercase rounded ${
                     accountStatus === 'active' 
                       ? 'bg-emerald-400/20 text-emerald-400' 
                       : 'bg-red-400/20 text-red-400'
                   }`}>
                     {accountStatus}
                   </span>
                </div>

                <div 
                  onClick={() => setIsDepositRestricted(prev => !prev)}
                  className={`flex justify-between items-center p-4 rounded-xl cursor-pointer transition-all border ${
                    isDepositRestricted 
                      ? 'bg-amber-500/20 border-amber-500/50' 
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                   <div className="flex items-center gap-3">
                     <Database size={20} className={isDepositRestricted ? 'text-amber-400' : 'text-indigo-400'} />
                     <div>
                        <p className="text-sm font-bold">Inbound Deposits</p>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">
                          {isDepositRestricted ? 'Incoming Blocked' : 'Allowed'}
                        </p>
                     </div>
                   </div>
                   <span className={`px-2 py-1 text-[9px] font-bold uppercase rounded ${
                     !isDepositRestricted 
                       ? 'bg-indigo-400/20 text-indigo-400' 
                       : 'bg-amber-400/20 text-amber-400'
                   }`}>
                     {isDepositRestricted ? 'Restricted' : 'Open'}
                   </span>
                </div>
              </div>

              <button 
                onClick={handleUpdateAccount}
                className={`w-full py-3 rounded-xl text-xs font-bold uppercase transition-all ${
                  accountStatus === 'disabled' ? 'bg-red-600 hover:bg-red-700' : 'bg-brand-primary hover:bg-brand-primary/90'
                }`}
              >
                Apply Master Restrictions
              </button>
            </div>

            <div className="mt-8 pt-8 border-t border-white/10 space-y-4">
              <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Target User Deposit Details</h4>
              <div className="space-y-3">
                <input 
                  placeholder="PayPal email" 
                  value={pp} onChange={e => setPp(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs outline-none focus:bg-white/10"
                />
                <input 
                  placeholder="Cash App tag" 
                  value={ca} onChange={e => setCa(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs outline-none focus:bg-white/10"
                />
                <input 
                  placeholder="Zelle Info" 
                  value={zl} onChange={e => setZl(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs outline-none focus:bg-white/10"
                />
                <input 
                   placeholder="Bitcoin Address" 
                   value={bc} onChange={e => setBc(e.target.value)}
                   className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs outline-none focus:bg-white/10"
                />
                <textarea 
                   placeholder="Bank Wire Details (ACH/Routing)" 
                   value={bi} onChange={e => setBi(e.target.value)}
                   className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs outline-none focus:bg-white/10 h-20"
                />
                <button 
                  onClick={handleUpdateDepositDetails}
                  className="w-full py-2 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-bold uppercase tracking-wider"
                >
                  Secured Injection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeView === 'transactions' && (
        <div className="sleek-card max-w-2xl">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Plus size={20} className="text-indigo-600" /> Inject Activity to Target
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Description</label>
              <input 
                type="text"
                placeholder="Payee/Reason"
                value={txDesc}
                onChange={(e) => setTxDesc(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Amount (+ for Credit)</label>
                <input 
                  type="number"
                  placeholder="0.00"
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Category</label>
                <select 
                  value={txCat}
                  onChange={(e) => setTxCat(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                >
                  <option>Income</option>
                  <option>Food</option>
                  <option>Entertainment</option>
                  <option>Lifestyle</option>
                  <option>Other</option>
                </select>
              </div>
            </div>
            <button onClick={handleAddTx} className="w-full sleek-button-primary">
              Append Transaction & Settle Balance
            </button>
          </div>
        </div>
      )}

      {activeView === 'bills' && (
        <div className="sleek-card max-w-2xl">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            <ReceiptText size={20} className="text-indigo-600" /> Issue Targeted Notification
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Service Provider / Billing Entity</label>
                <input 
                  type="text"
                  placeholder="e.g. Green Energy"
                  value={billName}
                  onChange={(e) => setBillName(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Amount Due</label>
                <input 
                  type="number"
                  placeholder="0.00"
                  value={billAmount}
                  onChange={(e) => setBillAmount(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Due Date String</label>
                <input 
                  type="text"
                  placeholder="June 5, 2024"
                  value={billDue}
                  onChange={(e) => setBillDue(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                />
              </div>
            </div>
            <button onClick={handleAddBill} className="w-full sleek-button-primary">
              Dispatch Bill to Selected Account
            </button>
          </div>
        </div>
      )}

      {activeView === 'approvals' && (
        <div className="space-y-6">
           <h3 className="text-xl font-bold text-slate-800">Pending Asset Verifications</h3>
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {transactions.filter(t => t.status === 'pending').map(tx => {
                const acc = accounts.find(a => a.id === tx.accountId);
                return (
                  <div key={tx.id} className="sleek-card border-amber-100 bg-amber-50/20">
                     <div className="flex justify-between items-start mb-4">
                        <div>
                           <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-1">Queue ID: {tx.id}</p>
                           <h4 className="font-bold text-slate-800">{tx.description}</h4>
                        </div>
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${tx.type === 'debit' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                           {tx.type === 'debit' ? 'Outbound' : 'Inbound'}
                        </span>
                     </div>
                     <div className="space-y-2 mb-6">
                        <div className="flex justify-between text-xs">
                           <span className="text-slate-500">Source Entity</span>
                           <span className="font-bold text-slate-800">{acc?.name || 'Unknown'}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                           <span className="text-slate-500">Asset Value</span>
                           <span className="font-bold text-slate-800">${Math.abs(tx.amount).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                           <span className="text-slate-500">Timestamp</span>
                           <span className="text-slate-600">{new Date(tx.date).toLocaleString()}</span>
                        </div>
                     </div>
                     <div className="flex gap-3">
                        <button 
                          onClick={() => handleTxDecision(tx.id, 'approve')}
                          className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/10"
                        >
                          Approve
                        </button>
                        <button 
                          onClick={() => handleTxDecision(tx.id, 'reject')}
                          className="flex-1 py-3 bg-red-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-600/10"
                        >
                          Reject
                        </button>
                     </div>
                  </div>
                );
              })}
              {transactions.filter(t => t.status === 'pending').length === 0 && (
                <div className="lg:col-span-2 py-20 text-center bg-white border border-dashed border-slate-200 rounded-3xl">
                   <ShieldCheck size={48} className="text-slate-200 mx-auto mb-4" />
                   <p className="text-slate-400 font-medium">All systems verified. No pending asset transfers.</p>
                </div>
              )}
           </div>
        </div>
      )}

      <div className="sleek-card bg-slate-50 border-dashed">
         <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">All Registered Accounts</h4>
         <div className="divide-y divide-slate-200">
           {accounts.map(acc => (
             <div key={acc.id} className="py-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div className="flex items-center gap-3">
                   <div className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center font-bold text-xs text-indigo-600 shadow-sm">
                      {acc.name.charAt(0)}
                   </div>
                   <div>
                      <p className="text-sm font-bold text-slate-800 leading-none mb-1">{acc.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">UID: {acc.id} | Limit: ${acc.creditLimit?.toLocaleString()}</p>
                   </div>
                </div>
                <div className="flex items-center justify-between sm:text-right gap-6">
                   <div className="sm:text-right">
                      <p className="text-sm font-bold text-slate-800">${acc.balance.toLocaleString()}</p>
                      <p className={`text-[10px] font-bold uppercase tracking-tight ${acc.status === 'disabled' ? 'text-red-500' : 'text-emerald-600'}`}>
                        {acc.status === 'disabled' ? 'Status: Disabled' : 'Status: Active'}
                        {acc.depositRestricted && ' | Deposits Locked'}
                      </p>
                   </div>
                   <button 
                     onClick={() => handleAccountChange(acc.id, true)}
                     className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold uppercase hover:bg-slate-50 transition-colors"
                   >
                     Select
                   </button>
                </div>
             </div>
           ))}
         </div>
      </div>
    </div>
  );
};
