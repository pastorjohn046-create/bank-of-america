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
  CreditCard,
  Mail,
  MessageSquare,
  ArrowLeft,
  Send,
  Search,
  ArrowUpDown,
  Trash2
} from 'lucide-react';
import { Account, SupportMessage, User } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

interface AdminMetrics {
  totalDeposits: number;
  totalTransactions: number;
  pendingBills: number;
  activeUsers: number;
  systemIntegrity: string;
  availableCredit: number;
}

export const AdminPanel = (props: { onMutation?: () => void }) => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<{ id: string, accountId: string, amount: number, description: string, status: string, type: string, date: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState<'overview' | 'accounts' | 'transactions' | 'bills' | 'approvals' | 'messages'>('overview');

  const [usersList, setUsersList] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [userSortField, setUserSortField] = useState<'name' | 'email' | 'uid' | 'balance' | 'role'>('name');
  const [userSortOrder, setUserSortOrder] = useState<'asc' | 'desc'>('asc');

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
      if (!res.ok) {
        const text = await res.text();
        console.error(`Error fetching logs (Status ${res.status}):`, text);
        return;
      }
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
  const [txStatus, setTxStatus] = useState<'completed' | 'pending' | 'rejected'>('completed');
  const [txDate, setTxDate] = useState('');

  // Support Messaging Panel States & Methods
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [selectedMsg, setSelectedMsg] = useState<SupportMessage | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const selectedMsgRef = React.useRef<SupportMessage | null>(null);
  useEffect(() => {
    selectedMsgRef.current = selectedMsg;
  }, [selectedMsg]);

  const fetchMessages = async () => {
    try {
      const res = await fetch('/api/admin/messages');
      if (!res.ok) {
        const text = await res.text();
        console.error(`Error fetching messages (Status ${res.status}):`, text);
        return;
      }
      const data = await res.json();
      setMessages(data);
      if (selectedMsgRef.current) {
        const found = data.find((m: any) => m.id === selectedMsgRef.current?.id);
        if (found) setSelectedMsg(found);
      }
    } catch (err) {
      console.error('Error syncing support communications:', err);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMsg || !replyText.trim()) return;
    setSendingReply(true);
    try {
      const res = await fetch(`/api/messages/${selectedMsg.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: 'admin',
          senderName: 'System Specialist',
          text: replyText
        })
      });
      if (!res.ok) throw new Error('Failed to post reply');
      setReplyText('');
      showStatus('Secured response transmitted');
      await fetchMessages();
    } catch (err: any) {
      showStatus(err.message, 'error');
    } finally {
      setSendingReply(false);
    }
  };

  const handleToggleResolve = async (msgId: string) => {
    try {
      const res = await fetch(`/api/messages/${msgId}/toggle-resolve`, {
        method: 'POST'
      });
      if (!res.ok) throw new Error('Action failed');
      const data = await res.json();
      showStatus(`Ticket Status marked as: ${data.status.toUpperCase()}`);
      await fetchMessages();
    } catch (err) {
       showStatus('Failed to toggle status', 'error');
    }
  };

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

  // Manual User Insertion States
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserSsn, setNewUserSsn] = useState('');
  const [newUserRole, setNewUserRole] = useState<'user' | 'admin'>('user');

  // Manual Account Creation States
  const [newAccUserId, setNewAccUserId] = useState('');
  const [newAccType, setNewAccType] = useState('checking');
  const [newAccName, setNewAccName] = useState('');
  const [newAccBalance, setNewAccBalance] = useState('14500');
  const [newAccCreditLimit, setNewAccCreditLimit] = useState('5000');

  // Selected User (Owner) Editing States
  const [editUserEmail, setEditUserEmail] = useState('');
  const [editUserPhone, setEditUserPhone] = useState('');
  const [editUserSsn, setEditUserSsn] = useState('');
  const [editUserPassword, setEditUserPassword] = useState('');
  const [editUserRole, setEditUserRole] = useState<'user' | 'admin'>('user');
  const [deleteConfirmUid, setDeleteConfirmUid] = useState<string | null>(null);

  const fetchAll = async () => {
    setIsLoading(true);
    try {
      const [mRes, aRes, tRes, uRes] = await Promise.all([
        fetch('/api/admin/metrics'),
        fetch('/api/accounts'),
        fetch('/api/transactions'),
        fetch('/api/admin/users')
      ]);
      const metricsData = await mRes.json();
      setMetrics(metricsData);
      const accs = await aRes.json();
      setAccounts(accs);
      const txs = await tRes.json();
      setTransactions(txs);
      const uData = await uRes.json();
      setUsersList(uData);
      
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

          // Find owner info to pre-populate credentials
          const usr = uData.find((u: any) => u.uid === currentSelected.userId);
          if (usr) {
            setEditUserEmail(usr.email || '');
            setEditUserPhone(usr.phone || '');
            setEditUserSsn(usr.ssn || '');
            setEditUserPassword(usr.password || '');
            setEditUserRole(usr.role || 'user');
          }

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
      // Also fetch support messages in parallel
      await fetchMessages();
    } catch (err) {
      console.error(err);
      showStatus('Failed to sync system data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (activeView === 'messages') {
      fetchMessages();
      interval = setInterval(fetchMessages, 3000); // Polling messages every 3s
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeView]);

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

      // Pre-fill owner's login credentials/secure settings
      const usr = usersList.find(u => u.uid === acc.userId);
      if (usr) {
        setEditUserEmail(usr.email || '');
        setEditUserPhone(usr.phone || '');
        setEditUserSsn(usr.ssn || '');
        setEditUserPassword(usr.password || '');
        setEditUserRole(usr.role || 'user');
      }

      if (switchTab) setActiveView('accounts');
    }
  };

  const handleDeleteUser = async (uid: string, name: string) => {
    if (uid === user?.uid) {
      showStatus('Self-elimination blocked: You cannot delete your own executive supervisor account.', 'error');
      return;
    }
    try {
      const res = await fetch(`/api/admin/users/${uid}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete client');
      }
      showStatus(`Client "${name}" has been permanently purged from secure databases.`);
      setDeleteConfirmUid(null);
      fetchAll();
      props.onMutation?.();
    } catch (err: any) {
      showStatus(err.message, 'error');
    }
  };

  const handleInsertUser = async () => {
    if (!newUserEmail) {
      showStatus('Please enter a secure email address', 'error');
      return;
    }
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newUserEmail,
          password: newUserPassword,
          displayName: newUserName,
          phone: newUserPhone,
          ssn: newUserSsn,
          role: newUserRole
        })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to insert private client');
      }
      showStatus('Private client & default portfolios successfully inserted!');
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserName('');
      setNewUserPhone('');
      setNewUserSsn('');
      setNewUserRole('user');
      fetchAll();
      props.onMutation?.();
    } catch (err: any) {
      showStatus(err.message, 'error');
    }
  };

  const handleInsertAccount = async () => {
    if (!newAccUserId) {
      showStatus('Select a target owner for this ledger account', 'error');
      return;
    }
    try {
      const res = await fetch('/api/admin/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: newAccUserId,
          type: newAccType,
          name: newAccName || undefined,
          balance: newAccBalance,
          creditLimit: newAccCreditLimit
        })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to allocate asset wallet');
      }
      showStatus('Custom asset portfolio/credit wallet has been provisioned!');
      setNewAccName('');
      setNewAccBalance('14500');
      setNewAccCreditLimit('5000');
      fetchAll();
      props.onMutation?.();
    } catch (err: any) {
      showStatus(err.message, 'error');
    }
  };

  const handleUpdateUserProfile = async () => {
    const acc = accounts.find(a => a.id === selectedAccId);
    if (!acc) {
      showStatus('Select a target account/user first', 'error');
      return;
    }
    try {
      const res = await fetch(`/api/admin/users/${acc.userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: editUserEmail,
          phone: editUserPhone,
          ssn: editUserSsn,
          password: editUserPassword,
          role: editUserRole
        })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Security update failed');
      }
      showStatus('Client credentials & SSN profile overwritten successfully!');
      fetchAll();
      props.onMutation?.();
    } catch (err: any) {
      showStatus(err.message, 'error');
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
      props.onMutation?.();
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
          category: txCat,
          status: txStatus,
          date: txDate || undefined
        })
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Transaction failed');
      }
      addLog(`Injected ${txAmount} (Status: ${txStatus}) to ${selectedAccId}`);
      showStatus('Transaction recorded and balance settled');
      setTxDesc('');
      setTxAmount('');
      setTxStatus('completed');
      setTxDate('');
      fetchAll();
      props.onMutation?.();
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
      props.onMutation?.();
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
      props.onMutation?.();
    } catch (err) {
      showStatus(`Failed to ${action} transaction`, 'error');
    }
  };

  const filteredUsers = React.useMemo(() => {
    let result = usersList.filter(u => {
      const q = searchQuery.toLowerCase();
      const matchName = u.displayName?.toLowerCase().includes(q);
      const matchEmail = u.email?.toLowerCase().includes(q);
      const matchUid = u.uid?.toLowerCase().includes(q);
      return matchName || matchEmail || matchUid;
    });

    result.sort((a, b) => {
      let orderMult = userSortOrder === 'asc' ? 1 : -1;
      
      if (userSortField === 'name') {
        return (a.displayName || '').localeCompare(b.displayName || '') * orderMult;
      }
      if (userSortField === 'email') {
        return (a.email || '').localeCompare(b.email || '') * orderMult;
      }
      if (userSortField === 'uid') {
        return (a.uid || '').localeCompare(b.uid || '') * orderMult;
      }
      if (userSortField === 'role') {
        return (a.role || '').localeCompare(b.role || '') * orderMult;
      }
      if (userSortField === 'balance') {
        const balA = accounts.filter(ac => ac.userId === a.uid).reduce((sum, ac) => sum + ac.balance, 0);
        const balB = accounts.filter(ac => ac.userId === b.uid).reduce((sum, ac) => sum + ac.balance, 0);
        return (balA - balB) * orderMult;
      }
      return 0;
    });

    return result;
  }, [usersList, searchQuery, userSortField, userSortOrder, accounts]);

  const handleUserSort = (field: 'name' | 'email' | 'uid' | 'balance' | 'role') => {
    if (userSortField === field) {
      setUserSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setUserSortField(field);
      setUserSortOrder('asc');
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
          { id: 'messages', label: 'SC Messaging', icon: Mail },
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
        <div className="space-y-6">
          {/* User Directory & Database Search */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <Users size={18} className="text-slate-700" /> User Security & Account Directory
                </h3>
                <p className="text-xs text-slate-400 font-medium font-semibold">Search, filter, and audit client credentials alongside asset ledgers.</p>
              </div>
              <div className="relative w-full sm:w-72">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search name, email, or UID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs font-semibold text-slate-805 outline-none focus:bg-white focus:ring-2 focus:ring-slate-950/5 focus:border-slate-800 transition-all font-sans placeholder:text-slate-450"
                />
              </div>
            </div>

            {/* Sortable User Table */}
            <div className="overflow-x-auto border border-slate-150 rounded-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-150">
                    {[
                      { key: 'name', label: 'Client / Name' },
                      { key: 'email', label: 'Secure Email' },
                      { key: 'uid', label: 'User UID' },
                      { key: 'role', label: 'Security Level' },
                      { key: 'balance', label: 'Aggregated Holdings' },
                    ].map((col) => (
                      <th
                        key={col.key}
                        onClick={() => handleUserSort(col.key as any)}
                        className="p-3 text-[10px] font-black uppercase text-slate-500 tracking-wider cursor-pointer select-none hover:bg-slate-100/80 hover:text-slate-800 transition-colors"
                      >
                        <div className="flex items-center gap-1 font-bold">
                          {col.label}
                          <ArrowUpDown size={11} className={`text-slate-400 ${userSortField === col.key ? 'text-slate-900' : ''}`} />
                        </div>
                      </th>
                    ))}
                    <th className="p-3 text-[10px] font-black uppercase text-slate-500 tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-semibold">
                  {filteredUsers.map((u) => {
                    const userAccounts = accounts.filter((a) => a.userId === u.uid);
                    const totalHoldings = userAccounts.reduce((sum, a) => sum + a.balance, 0);
                    const isSelectedUser = userAccounts.some(a => a.id === selectedAccId);
                    
                    return (
                      <tr 
                        key={u.uid} 
                        className={`hover:bg-slate-50/60 transition ${isSelectedUser ? 'bg-indigo-50/10' : ''}`}
                      >
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-slate-150 text-slate-700 font-bold border border-slate-200 rounded-full flex items-center justify-center text-[11px] uppercase shrink-0">
                              {u.displayName?.substring(0, 1) || u.email?.substring(0, 1) || '?'}
                            </div>
                            <span className="font-extrabold text-slate-800 select-all">{u.displayName}</span>
                          </div>
                        </td>
                        <td className="p-3 font-mono text-slate-650 text-[11px] select-all">{u.email}</td>
                        <td className="p-3 font-mono text-slate-400 text-[10px] select-all">{u.uid}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                            u.role === 'admin' 
                              ? 'bg-rose-55 text-rose-700 border border-rose-100' 
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-slate-800 font-mono">
                          ${totalHoldings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          <span className="text-[9px] text-slate-450 block font-sans font-medium">({userAccounts.length} accounts)</span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex justify-end items-center gap-2">
                            {deleteConfirmUid === u.uid ? (
                              <div className="flex items-center gap-1 shrink-0">
                                <button 
                                  onClick={() => handleDeleteUser(u.uid, u.displayName)}
                                  className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[9px] font-black uppercase tracking-wider"
                                >
                                  Purge Client
                                </button>
                                <button 
                                  onClick={() => setDeleteConfirmUid(null)}
                                  className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[9px] font-black uppercase tracking-wider"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <>
                                {userAccounts.length === 0 ? (
                                  <span className="text-[10px] text-slate-400 italic py-1 px-2 block">No accounts</span>
                                ) : userAccounts.length === 1 ? (
                                  <button 
                                    onClick={() => handleAccountChange(userAccounts[0].id)}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition select-none ${
                                      isSelectedUser 
                                        ? 'bg-slate-900 text-white' 
                                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                    }`}
                                  >
                                    {isSelectedUser ? 'Selected' : 'Select'}
                                  </button>
                                ) : (
                                  <select
                                    onChange={(e) => handleAccountChange(e.target.value)}
                                    value={userAccounts.some(a => a.id === selectedAccId) ? selectedAccId : ''}
                                    className="p-1 px-2 text-[10px] bg-white border border-slate-200 rounded-lg font-bold text-slate-850 outline-none max-w-[140px] shadow-sm cursor-pointer animate-in fade-in duration-200"
                                  >
                                    <option value="" disabled>Select...</option>
                                    {userAccounts.map(a => (
                                      <option key={a.id} value={a.id}>
                                        {a.type.toUpperCase()} ({a.number.replace('**** ', '')})
                                      </option>
                                    ))}
                                  </select>
                                )}

                                <button 
                                  onClick={() => {
                                    if (u.uid === user?.uid) {
                                      showStatus('Self-elimination blocked: You cannot purge your active supervisor session.', 'error');
                                    } else {
                                      setDeleteConfirmUid(u.uid);
                                    }
                                  }}
                                  disabled={u.uid === user?.uid}
                                  className="p-1.5 text-slate-450 hover:text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all shrink-0"
                                  title={u.uid === user?.uid ? "Active administrator session" : "Purge client registers and portfolios"}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-450 italic font-semibold">
                        No matches found for "{searchQuery}".
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="sleek-card animate-in fade-in duration-300 h-full flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-slate-805 text-base text-blue-900 border-b border-slate-100 pb-3 mb-6 uppercase tracking-tight">Modify Asset Account Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 index-block">Ledger Account Display Label</label>
                    <input 
                      type="text"
                      placeholder="Full Portfolio Label"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-850 text-xs text-slate-800"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Override Balance</label>
                      <input 
                        type="number"
                        value={newBalance}
                        onChange={(e) => setNewBalance(e.target.value)}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-850 text-xs text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Override Credit Limit</label>
                      <input 
                        type="number"
                        value={newCredit}
                        onChange={(e) => setNewCredit(e.target.value)}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-850 text-xs text-slate-800"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <button onClick={handleUpdateAccount} className="w-full sleek-button-primary mt-6">
                Apply Ledger Settings Override
              </button>
            </div>

            {/* Owner Master Credentials Overwrites Form */}
            <div className="sleek-card animate-in fade-in duration-300 border-indigo-150 bg-indigo-50/10 h-full flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-indigo-900 text-base border-b border-indigo-100/50 pb-3 mb-6 uppercase tracking-tight flex items-center gap-2">
                  <ShieldCheck size={18} className="text-indigo-600" /> Override Credentials & SSN
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1 block">Email Address (Secured Credentials)</label>
                    <input 
                      type="email"
                      placeholder="secure.client@newage.com"
                      value={editUserEmail}
                      onChange={(e) => setEditUserEmail(e.target.value)}
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1 block">Phone Number</label>
                      <input 
                        type="text"
                        placeholder="+1 (555) 0192"
                        value={editUserPhone}
                        onChange={(e) => setEditUserPhone(e.target.value)}
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1 block">SSN Override Value</label>
                      <input 
                        type="text"
                        placeholder="XXX-XX-XXXX"
                        value={editUserSsn}
                        onChange={(e) => setEditUserSsn(e.target.value)}
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 text-xs"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1 block">Password String</label>
                      <input 
                        type="text"
                        placeholder="Master Passkey"
                        value={editUserPassword}
                        onChange={(e) => setEditUserPassword(e.target.value)}
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1 block">Security Role</label>
                      <select 
                        value={editUserRole}
                        onChange={(e) => setEditUserRole(e.target.value as any)}
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 text-xs"
                      >
                        <option value="user">USER (Private Client)</option>
                        <option value="admin">ADMIN (Executive Ops)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              <button onClick={handleUpdateUserProfile} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-widest mt-6 transition-colors shadow-lg shadow-indigo-100">
                Overwrite Owner Credentials
              </button>
            </div>

            {/* Restrictions Panel */}
            <div className="sleek-card bg-slate-905 text-white bg-slate-900 border-slate-800 animate-in fade-in duration-300">
              <h3 className="font-bold mb-1 uppercase tracking-tight text-slate-100">Master Restrictions & Holds</h3>
              <p className="text-[10px] text-slate-400 mb-6 font-medium italic">Administrative locks and verification status overrides.</p>
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
                          <p className="text-sm font-bold">Account Access Code</p>
                          <p className="text-[10px] text-slate-450 uppercase font-black">
                            {accountStatus === 'active' ? 'Authorized (Active)' : 'Completely Frozen'}
                          </p>
                       </div>
                     </div>
                     <span className={`px-2 py-1 text-[9px] font-black uppercase rounded ${
                       accountStatus === 'active' 
                         ? 'bg-emerald-400/20 text-emerald-400' 
                         : 'bg-red-400/20 text-red-500'
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
                          <p className="text-sm font-bold">Inbound Deposits Hold</p>
                          <p className="text-[10px] text-slate-450 uppercase font-black">
                            {isDepositRestricted ? 'Incoming Assets Suspended' : 'Allowed (Open)'}
                          </p>
                       </div>
                     </div>
                     <span className={`px-2 py-1 text-[9px] font-black uppercase rounded ${
                       !isDepositRestricted 
                         ? 'bg-indigo-400/20 text-indigo-400' 
                         : 'bg-amber-400/20 text-amber-500'
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
                <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-450">Target User Deposit Details</h4>
                <div className="space-y-3">
                  <input 
                    placeholder="PayPal email" 
                    value={pp} onChange={e => setPp(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs outline-none focus:bg-white/10 text-white font-semibold"
                  />
                  <input 
                    placeholder="Cash App tag" 
                    value={ca} onChange={e => setCa(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs outline-none focus:bg-white/10 text-white font-semibold"
                  />
                  <input 
                    placeholder="Zelle Info" 
                    value={zl} onChange={e => setZl(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs outline-none focus:bg-white/10 text-white font-semibold"
                  />
                  <input 
                     placeholder="Bitcoin Address" 
                     value={bc} onChange={e => setBc(e.target.value)}
                     className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs outline-none focus:bg-white/10 text-white font-semibold"
                  />
                  <textarea 
                     placeholder="Bank Wire Details (ACH/Routing)" 
                     value={bi} onChange={e => setBi(e.target.value)}
                     className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs outline-none focus:bg-white/10 h-20 text-white font-semibold resize-none"
                  />
                  <button 
                    onClick={handleUpdateDepositDetails}
                    className="w-full py-2 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-bold uppercase tracking-wider text-white transition-all"
                  >
                    Secured Injection
                  </button>
                </div>
              </div>
            </div>

            {/* Empty column placeholder for symmetry - or can make it full operations space */}
            <div className="hidden lg:block bg-slate-50 border border-dashed border-slate-200 rounded-2xl h-full flex flex-col justify-center items-center text-center p-8 text-slate-400">
               <ShieldCheck size={48} className="text-slate-300 mb-2" />
               <p className="text-xs font-bold uppercase tracking-wide">Elite Secure Access Authorized</p>
               <p className="text-[10px] tracking-tight leading-relaxed max-w-xs mt-1">Ready to update any security levels, overrides, custom SSNs, or balance states immediately.</p>
            </div>
          </div>

          {/* Core Creation & Portfolio Issuing Area */}
          <div className="pt-8 border-t border-slate-200 mt-12">
            <h3 className="text-lg font-black tracking-tight text-slate-800 uppercase mb-2">Administrative Actions: Manual Entity Registration</h3>
            <p className="text-xs text-slate-450 font-medium mb-6">Manually inject brand-new private clients or provision additional high-limit portfolio ledger accounts.</p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Insert/Create New User Form */}
              <div className="sleek-card border-dashed border-2 bg-white animate-in fade-in duration-300">
                <h4 className="font-extrabold text-[#111] text-base mb-6 flex items-center gap-2">
                  <Users size={18} className="text-emerald-600" /> Manually Register Private Client
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Full Client Name</label>
                    <input 
                      type="text"
                      placeholder="e.g. Timothy Vance"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Secure Email Credentials</label>
                      <input 
                        type="email"
                        placeholder="timothy.vance@offshore.com"
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Custom Password Passkey</label>
                      <input 
                        type="text"
                        placeholder="Default password123"
                        value={newUserPassword}
                        onChange={(e) => setNewUserPassword(e.target.value)}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-xs"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Social Security Number (SSN)</label>
                      <input 
                        type="text"
                        placeholder="e.g. 000-12-8921"
                        value={newUserSsn}
                        onChange={(e) => setNewUserSsn(e.target.value)}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Phone Number</label>
                      <input 
                        type="text"
                        placeholder="+1 (555) 0122"
                        value={newUserPhone}
                        onChange={(e) => setNewUserPhone(e.target.value)}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Initial Security Authorization</label>
                    <select 
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value as any)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-xs"
                    >
                      <option value="user">USER (Authorized Elite Core Client)</option>
                      <option value="admin">ADMIN (Operations Security Director)</option>
                    </select>
                  </div>
                  <button onClick={handleInsertUser} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-colors shadow-lg shadow-emerald-50 mt-4">
                    Register Client & Autogen Portfolios
                  </button>
                </div>
              </div>

              {/* Allocate Custom Account / Wallet to Existing User form */}
              <div className="sleek-card border-dashed border-2 bg-white animate-in fade-in duration-300">
                <h4 className="font-extrabold text-[#111] text-base mb-6 flex items-center gap-2">
                  <Database size={18} className="text-brand-primary" /> Provision Custom Ledger Account
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Target Private Client Owner</label>
                    <select 
                      value={newAccUserId}
                      onChange={(e) => setNewAccUserId(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-xs"
                    >
                      <option value="">Choose Existing User Target...</option>
                      {usersList.map(u => (
                        <option key={u.uid} value={u.uid}>
                          {u.displayName} ({u.email})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Ledger Account Type</label>
                      <select 
                        value={newAccType}
                        onChange={(e) => setNewAccType(e.target.value)}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-xs"
                      >
                        <option value="checking">Checking Asset Account</option>
                        <option value="savings">Savings Portfolio Vault</option>
                        <option value="credit">High-limit Credit Card Wallet</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Account Custom Title (Optional)</label>
                      <input 
                        type="text"
                        placeholder="e.g. Vance Holdings Trust"
                        value={newAccName}
                        onChange={(e) => setNewAccName(e.target.value)}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-xs"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Starting Balance Override ($)</label>
                      <input 
                        type="number"
                        placeholder="14500.00"
                        value={newAccBalance}
                        onChange={(e) => setNewAccBalance(e.target.value)}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Credit Limit Overdraft ($)</label>
                      <input 
                        type="number"
                        placeholder="5000.00"
                        value={newAccCreditLimit}
                        onChange={(e) => setNewAccCreditLimit(e.target.value)}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-xs"
                      />
                    </div>
                  </div>
                  <button onClick={handleInsertAccount} className="w-full py-3 bg-brand-primary hover:bg-brand-primary/95 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-colors shadow-lg shadow-indigo-50 mt-10">
                    Provision Account Portfolio
                  </button>
                </div>
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Transaction Status</label>
                <select 
                  value={txStatus}
                  onChange={(e) => setTxStatus(e.target.value as any)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                >
                  <option value="completed">Approved / Completed</option>
                  <option value="pending">Pending Auth</option>
                  <option value="rejected">Failed / Rejected</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Override Date (Optional)</label>
                <input 
                  type="datetime-local"
                  value={txDate}
                  onChange={(e) => setTxDate(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                />
                <p className="text-[10px] text-slate-400 mt-1 italic">Leave blank to use current runtime date.</p>
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
              {transactions.filter(t => t.status === 'pending' && !t.description.startsWith('Incoming Transfer Request')).map(tx => {
                const acc = accounts.find(a => a.id === tx.accountId);
                const destAcc = tx.toAccountId ? accounts.find(a => a.id === tx.toAccountId) : null;
                return (
                  <div key={tx.id} className="sleek-card border-amber-100 bg-amber-50/20">
                     <div className="flex justify-between items-start mb-4">
                        <div>
                           <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-1">Queue ID: {tx.id}</p>
                           <h4 className="font-bold text-slate-800 text-sm">{tx.description}</h4>
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
                        {destAcc && (
                          <div className="flex justify-between text-xs">
                             <span className="text-slate-500">Recipient Entity</span>
                             <span className="font-bold text-slate-800">{destAcc.name}</span>
                          </div>
                        )}
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
              {transactions.filter(t => t.status === 'pending' && !t.description.startsWith('Incoming Transfer Request')).length === 0 && (
                <div className="lg:col-span-2 py-20 text-center bg-white border border-dashed border-slate-200 rounded-3xl">
                   <ShieldCheck size={48} className="text-slate-200 mx-auto mb-4" />
                   <p className="text-slate-400 font-medium">All systems verified. No pending asset transfers.</p>
                </div>
              )}
           </div>
        </div>
      )}

      {activeView === 'messages' && (
        <div className="space-y-4" id="admin-sc-console">
          {/* Admin Header Ribbon */}
          <div className="bg-slate-900 text-white p-4.5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border border-slate-800 shadow-md">
            <div>
              <div className="inline-flex items-center gap-2 bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest">
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-ping" /> Global Operations Node
              </div>
              <h3 className="text-lg font-black tracking-tight mt-1">Resolution Communications Hub</h3>
              <p className="text-[11px] text-slate-400 font-semibold">Triage secure correspondence, audit customer compliance logs, and dispatch official executive resolutions.</p>
            </div>
            <div className="text-right flex items-center gap-2 sm:self-center font-mono text-[10px] bg-slate-800/80 px-3 py-1.5 rounded-xl border border-white/5">
              <span className="text-slate-500 font-medium">Pending Queue:</span>
              <span className="font-extrabold text-indigo-400">{messages.filter(m => m.status === 'open').length} Threads</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[550px]">
            {/* Left Column: Messages List - hidden on mobile when viewing details */}
            <div className={`${selectedMsg ? 'hidden lg:flex' : 'flex'} lg:col-span-1 bg-white border border-slate-200 rounded-2xl flex flex-col overflow-hidden shadow-sm`}>
              <div className="p-4 border-b border-slate-150 bg-slate-50 flex justify-between items-center shrink-0">
                <span className="font-black text-[10px] text-slate-500 uppercase tracking-widest">Client Requests Register</span>
                <span className="text-[9px] font-black px-2 py-0.5 bg-slate-900 text-white rounded-lg font-mono">
                  Total: {messages.length}
                </span>
              </div>
              
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                {messages.map(msg => {
                  const isSelected = selectedMsg?.id === msg.id;
                  return (
                    <div
                      key={msg.id}
                      onClick={() => {
                        setSelectedMsg(msg);
                        setReplyText('');
                      }}
                      className={`p-4 cursor-pointer transition-all border-l-4 ${
                        isSelected 
                          ? 'bg-slate-50 border-slate-900' 
                          : 'border-transparent hover:bg-slate-50/40'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-extrabold text-xs text-slate-900 uppercase tracking-tight">{msg.userName}</span>
                        <span className="text-[9px] font-mono text-slate-400">{new Date(msg.date).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs font-bold text-slate-700 truncate mb-1.5">{msg.subject}</p>
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-[10px] text-slate-400 font-medium truncate max-w-[140px] font-mono">[UID: {msg.userId.substring(0,6)}] {msg.text}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                          msg.status === 'open' 
                            ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}>
                          {msg.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {messages.length === 0 && (
                  <div className="p-10 text-center text-slate-400 text-xs italic flex flex-col items-center justify-center h-full">
                    <MessageSquare size={32} className="text-slate-200 mb-2" />
                    <span>No secure communication logs.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Active Thread Transcript - hidden on mobile when list is shown */}
            <div className={`${!selectedMsg ? 'hidden lg:flex' : 'flex'} lg:col-span-2 bg-white border border-slate-200 rounded-2xl flex flex-col overflow-hidden shadow-sm`}>
              {selectedMsg ? (
                <div className="flex flex-col h-full">
                  {/* Message Header */}
                  <div className="p-4 border-b border-slate-250 bg-slate-900 text-white flex justify-between items-center shrink-0">
                    <div className="flex items-center min-w-0">
                      {/* Mobile Back Button */}
                      <button
                        onClick={() => setSelectedMsg(null)}
                        className="lg:hidden p-1.5 bg-slate-800 rounded-xl text-slate-300 mr-2.5 hover:bg-slate-700 transition"
                      >
                        <ArrowLeft size={14} />
                      </button>
                      <div className="truncate">
                        <span className="text-[8px] font-mono font-bold text-slate-400 uppercase tracking-wider">SECURE ADVISING PLATFORM</span>
                        <h4 className="font-black text-white text-xs sm:text-sm uppercase tracking-wider truncate">{selectedMsg.subject}</h4>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleToggleResolve(selectedMsg.id)}
                        className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider transition-colors ${
                          selectedMsg.status === 'open'
                            ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                            : 'bg-amber-500 hover:bg-amber-600 text-white'
                        }`}
                      >
                        {selectedMsg.status === 'open' ? 'Mark Resolved' : 'Reopen Thread'}
                      </button>
                    </div>
                  </div>

                  {/* Chat Transcript Panel */}
                  <div className="flex-1 p-4 sm:p-5 overflow-y-auto bg-slate-50/50 space-y-4">
                    
                    {/* Customer Original Statement */}
                    <div className="flex flex-col items-start max-w-[85%]">
                      <p className="text-[9px] text-slate-500 font-black mb-1 uppercase tracking-wider flex items-center gap-1">
                        Client: <span className="font-extrabold text-slate-800 select-all font-mono">{selectedMsg.userName}</span>
                      </p>
                      <div className="bg-white border border-slate-200 text-slate-800 text-xs px-4 py-3 rounded-2xl rounded-tl-none shadow-sm font-semibold select-text break-words w-full">
                        {selectedMsg.text}
                      </div>
                      <span className="text-[8px] text-slate-400 font-mono mt-1">{new Date(selectedMsg.date).toLocaleString()}</span>
                    </div>

                    {/* Replies list */}
                    {selectedMsg.replies.map((rep) => {
                      const isAdminReply = rep.sender === 'admin';
                      return (
                        <div
                          key={rep.id}
                          className={`flex flex-col max-w-[85%] ${isAdminReply ? 'items-end ml-auto' : 'items-start mr-auto'}`}
                        >
                          <p className="text-[9px] text-slate-500 font-bold mb-1 uppercase tracking-widest">
                            {isAdminReply ? (
                              <span className="text-slate-700 bg-slate-150 border border-slate-200 px-1.5 py-0.5 rounded font-black text-[8px]">You (Staff)</span>
                            ) : (
                              <span className="font-mono">{selectedMsg.userName}</span>
                            )}
                          </p>
                          <div className={`text-xs px-4 py-3 rounded-2xl shadow-sm font-semibold break-words w-full ${
                            isAdminReply 
                              ? 'bg-slate-900 text-white rounded-tr-none' 
                              : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                          }`}>
                            {rep.text}
                          </div>
                          <span className="text-[8px] text-slate-400 font-mono mt-1 font-semibold">{new Date(rep.date).toLocaleString()}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Reply drafting form */}
                  <div className="p-3.5 border-t border-slate-150 bg-white shrink-0">
                    <form onSubmit={handleSendReply} className="flex gap-2">
                      <input
                        type="text"
                        placeholder={selectedMsg.status === 'resolved' ? "Ticket resolved. Enter message to reopen and reply..." : "Draft response parameters to send to client portal..."}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-slate-900/5 focus:border-slate-800 transition-all font-sans text-slate-800 font-semibold"
                      />
                      <button
                        type="submit"
                        disabled={sendingReply || !replyText.trim()}
                        className="px-5 py-3 bg-slate-900 hover:bg-slate-850 disabled:bg-slate-300 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-md shrink-0 flex items-center gap-1 select-none"
                      >
                        <Send size={12} />
                        <span className="hidden sm:inline">Transmit</span>
                      </button>
                    </form>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center bg-slate-50/10">
                  <MessageSquare size={44} className="text-slate-200 mb-3" />
                  <h4 className="font-bold text-slate-800 mb-1 text-sm">Dialogue Inspector Offline</h4>
                  <p className="text-xs max-w-xs text-slate-400 leading-relaxed font-semibold">Select a client correspondence thread from the left register stream to inspect and dispatch responses.</p>
                </div>
              )}
            </div>
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
