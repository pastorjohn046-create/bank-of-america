import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  ArrowLeftRight, 
  ReceiptText, 
  PieChart, 
  Settings, 
  LogOut, 
  Bell, 
  Search,
  Plus,
  TrendingUp,
  CreditCard,
  History,
  ArrowRight,
  Users,
  Landmark,
  ShieldAlert,
  Mail,
  MessageSquare,
  HardDrive,
  Upload,
  X,
  Lock
} from 'lucide-react';
import { api } from './services/api';
import { Account, Transaction, Bill, User, BankCard } from './types';
import { BalanceCard } from './components/dashboard/BalanceCard';
import { TransactionList } from './components/dashboard/TransactionList';
import { ExecutiveAdvisor } from './components/ai/ExecutiveAdvisor';
import { TransferModal } from './components/modals/TransferModal';
import { DepositModal } from './components/modals/DepositModal';
import { SpendingChart, NetWorthChart } from './components/dashboard/AnalyticsCharts';
import { AdminPanel } from './components/admin/AdminPanel';
import { SupportPanel } from './components/support/SupportPanel';
import { SplashScreen } from './components/ui/SplashScreen';
import { BankCardsSection } from './components/dashboard/BankCardsSection';

const SidebarItem = ({ icon: Icon, label, active, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`w-full ${active ? 'sleek-nav-item-active' : 'sleek-nav-item-inactive'}`}
  >
    <Icon size={20} />
    <span className="font-semibold">{label}</span>
  </button>
);

import { useAuth } from './contexts/AuthContext';
import { AuthScreen } from './components/auth/AuthScreen';
import { ShieldCheck, LogOut as LogOutIcon, Star as StarIcon } from 'lucide-react';

export default function App() {
  const { user, loading, isAdmin, signOut, updateProfile, resetPassword } = useAuth();
  const [activeTab, setActiveTab ] = useState('dashboard');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [cards, setCards] = useState<BankCard[]>([]);
  const [payingBill, setPayingBill] = useState<Bill | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  
  // Profile State
  const [editName, setEditName] = useState(user?.displayName || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [editPhoto, setEditPhoto] = useState(user?.photoURL || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [resetPassEmail, setResetPassEmail] = useState(user?.email || '');
  const [newPass, setNewPass] = useState('');

  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('File type must be an image.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Premium profile image limit is 5MB.');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setEditPhoto(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (user) {
      setEditName(user.displayName || '');
      setEditPhone(user.phone || '');
      setEditPhoto(user.photoURL || '');
      setResetPassEmail(user.email || '');
    }
  }, [user]);

  const handleUpdateProfile = async () => {
    setSavingProfile(true);
    try {
      await updateProfile({ displayName: editName, phone: editPhone, photoURL: editPhoto });
      alert('Executive Profile Secured Successfully.');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleResetPass = async () => {
    if (!newPass) return alert('Enter a new security credential.');
    try {
      await resetPassword(resetPassEmail, newPass);
      alert('Security Credentials Updated.');
      setNewPass('');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handlePayBill = (billId: string) => {
    const bill = bills.find(b => b.id === billId);
    if (bill) {
      setPayingBill(bill);
    }
  };

  const executePayBill = async (billId: string, accountId?: string, cardId?: string) => {
    try {
      const response = await fetch('/api/bills/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billId, accountId, cardId }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Liquidity process failed');
      }

      alert(cardId ? 'Bill paid instantly using secure linked card.' : 'Bill payment scheduled and queued for admin validation.');
      setPayingBill(null);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferModalInitialType, setTransferModalInitialType] = useState<'internal' | 'external'>('internal');
  const [transferModalLocked, setTransferModalLocked] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  const openTransferModal = (type: 'internal' | 'external' = 'internal', locked: boolean = false) => {
    setTransferModalInitialType(type);
    setTransferModalLocked(locked);
    setIsTransferModalOpen(true);
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [accData, txData, billData, cardData] = await Promise.all([
        api.getAccounts(),
        api.getTransactions(),
        api.getBills(),
        api.getCards(user?.uid)
      ]);
      setAccounts(accData);
      setTransactions(txData);
      setBills(billData);
      setCards(cardData || []);
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, activeTab]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  const totalBalance = accounts.reduce((acc, curr) => acc + curr.balance, 0);

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
      {/* Sidebar - Desktop Only */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-slate-200 flex-col">
        <div className="p-8">
          <div className="flex flex-col gap-1 mb-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-900 rounded-full flex items-center justify-center shadow-lg shadow-blue-900/20 border-2 border-white">
                 <StarIcon size={18} className="text-white" fill="currentColor" />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-sm tracking-[0.2em] text-blue-900 uppercase leading-none">New Age</span>
                <span className="font-black text-sm tracking-[0.2em] text-red-600 uppercase">Of America</span>
              </div>
            </div>
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-2">Executive Portal</p>
            <div className="mt-2 text-[10px] font-bold text-indigo-750 bg-indigo-50/70 border border-indigo-100 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 w-max">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
              <span>30-Day Storage Active</span>
            </div>
          </div>

          <nav className="space-y-1">
            <SidebarItem 
              icon={LayoutDashboard} 
              label="Dashboard" 
              active={activeTab === 'dashboard'} 
              onClick={() => setActiveTab('dashboard')}
            />
            <SidebarItem 
              icon={ArrowLeftRight} 
              label="Transfers" 
              active={activeTab === 'transfers'} 
              onClick={() => setActiveTab('transfers')}
            />
            <SidebarItem 
              icon={ReceiptText} 
              label="Bill Pay" 
              active={activeTab === 'bills'} 
              onClick={() => setActiveTab('bills')}
            />
            <SidebarItem 
              icon={PieChart} 
              label="Analytics" 
              active={activeTab === 'analytics'} 
              onClick={() => setActiveTab('analytics')}
            />
            <SidebarItem 
              icon={Settings} 
              label="Settings" 
              active={activeTab === 'settings'} 
              onClick={() => setActiveTab('settings')}
            />
            <SidebarItem 
              icon={Mail} 
              label="Support Center" 
              active={activeTab === 'support'} 
              onClick={() => setActiveTab('support')}
            />
            {isAdmin && (
              <SidebarItem 
                icon={ShieldAlert} 
                label="Admin" 
                active={activeTab === 'admin'} 
                onClick={() => setActiveTab('admin')} 
              />
            )}
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-slate-100">
          <div className="bg-slate-900 rounded-2xl p-6 text-white relative overflow-hidden group">
            <div className="relative z-10">
              <p className="text-xs text-slate-400 mb-1">Portfolio Credit</p>
              <p className="text-lg font-bold">${accounts.reduce((acc, a) => acc + (a.creditLimit || 0), 0).toLocaleString()}.00</p>
              <div className="w-full bg-slate-700 h-1.5 rounded-full mt-3 overflow-hidden">
                <div className="bg-indigo-500 h-full w-2/3" />
              </div>
            </div>
          </div>
          <button 
            onClick={signOut}
            className="w-full flex items-center gap-3 px-2 py-6 text-slate-400 hover:text-red-500 transition-colors font-semibold text-sm"
          >
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto flex flex-col pb-20 lg:pb-0">
        {/* Header */}
        <header className="h-16 lg:h-20 bg-white border-b border-slate-200 px-6 lg:px-8 flex items-center justify-between sticky top-0 z-10">
          <div className="flex flex-col">
             <h1 className="text-lg lg:text-xl font-bold text-slate-800 tracking-tight">
               {activeTab === 'admin' ? 'Executive Control' : `Good Morning, ${user.displayName?.split(' ')[0] || 'Member'}`}
             </h1>
             <p className="hidden sm:block text-xs lg:text-sm text-slate-500">
               Market Status: <span className="text-emerald-500 font-bold uppercase tracking-widest text-[10px]">Open</span>
             </p>
          </div>
          
          <div className="flex items-center gap-2 lg:gap-4">
            <div className="relative group hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Search..." 
                className="bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all w-48 focus:w-64"
              />
            </div>
            <button className="w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 relative hover:bg-slate-200 transition-colors">
              <Bell size={18} lg:size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 border-2 border-white rounded-full" />
            </button>
            <div className="flex items-center gap-3 pl-2 lg:pl-4 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-800 capitalize">{user.displayName || 'Member'}</p>
                <p className="text-xs text-slate-500">{isAdmin ? 'Executive Admin' : 'Premium Member'}</p>
              </div>
              <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-indigo-100 overflow-hidden border border-indigo-200 shadow-sm cursor-pointer hover:scale-105 transition-transform flex items-center justify-center font-bold text-indigo-600">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  user.displayName?.charAt(0) || user.email?.charAt(0).toUpperCase()
                )}
              </div>
              <button 
                onClick={signOut}
                className="flex items-center justify-center w-9 h-9 lg:w-10 lg:h-10 rounded-xl border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50/50 transition-all shrink-0"
                title="Sign Out"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </header>

        <div className="p-4 lg:p-8 content-start">
          {activeTab === 'admin' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <AdminPanel onMutation={fetchData} />
            </motion.div>
          )}

          {activeTab === 'dashboard' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-12 gap-4 lg:gap-8"
            >
              <section className="col-span-12 lg:col-span-8 space-y-6 lg:space-y-8">
                {/* Credit Cards / Accounts Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {accounts.slice(0, 2).map((acc, idx) => (
                    <BalanceCard 
                      key={acc.id} 
                      account={acc} 
                      onSend={() => setActiveTab('transfers')}
                      onAdd={() => setIsDepositModalOpen(true)}
                    />
                  ))}
                </div>

                <TransactionList transactions={transactions} />
              </section>

              <section className="col-span-12 lg:col-span-4 space-y-4 lg:space-y-6">

                {/* Upcoming Bill - Dark Version */}
                {bills.find(b => b.status === 'unpaid') && (
                  <div className="bg-slate-900 rounded-2xl p-6 text-white overflow-hidden relative shadow-lg shadow-slate-200">
                    <h3 className="font-bold mb-1">Upcoming Bill</h3>
                    <p className="text-xs text-slate-400 mb-4">{bills.find(b => b.status === 'unpaid')?.name}</p>
                    <div className="flex justify-between items-end mb-4">
                      <div className="text-2xl font-bold">${bills.find(b => b.status === 'unpaid')?.amount}</div>
                      <div className="text-[11px] text-indigo-400 font-bold uppercase tracking-wider">
                        Due {bills.find(b => b.status === 'unpaid')?.dueDate}
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        const unpaidBill = bills.find(b => b.status === 'unpaid');
                        if (unpaidBill) handlePayBill(unpaidBill.id);
                      }}
                      className="w-full py-3 bg-white/10 hover:bg-white/20 text-white text-sm font-bold rounded-xl transition-colors border border-white/20"
                    >
                      Pay Bill Now
                    </button>
                  </div>
                )}

                {/* Savings Goal Component */}
                <div className="sleek-card">
                  <h3 className="font-bold text-slate-800 mb-3">Savings Goal</h3>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-slate-500 uppercase font-bold tracking-tight">Europe Trip</span>
                    <span className="font-bold">72%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full mb-2 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '72%' }}
                      className="bg-emerald-500 h-full rounded-full shadow-sm shadow-emerald-200"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium">$3,600.00 of $5,000.00 saved</p>
                </div>
              </section>
            </motion.div>
          )}

          {activeTab === 'transfers' && (
             <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-4xl mx-auto py-8"
             >
                <div className="flex justify-between items-end mb-12">
                   <div>
                      <h2 className="text-3xl font-bold tracking-tight text-slate-800">Transfers</h2>
                      <p className="text-slate-500 mt-1">Send money across the world instantly.</p>
                   </div>
                   <button 
                      onClick={() => openTransferModal('internal')}
                      className="sleek-button-primary flex items-center gap-2"
                   >
                     <Plus size={18} /> New Transfer
                   </button>
                </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                   <div 
                      onClick={() => openTransferModal('internal', true)}
                      className="sleek-card hover:border-blue-300 cursor-pointer transition-all group border-2 border-slate-100"
                    >
                      <div className="w-12 h-12 bg-blue-50 text-blue-900 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-900 group-hover:text-white transition-all">
                        <Users size={24} />
                      </div>
                      <h3 className="text-xl font-bold mb-2 uppercase tracking-wide text-blue-900">Elite Contacts</h3>
                      <p className="text-sm text-slate-500 mb-8 leading-relaxed">Instantly send funds to anyone on the NEW AGE OF AMERICA network with zero fees.</p>
                      <div className="flex items-center gap-2 text-blue-900 font-bold text-xs uppercase tracking-wider">
                        Select Member <ArrowRight size={14} />
                      </div>
                   </div>
                   
                   <div 
                      onClick={() => openTransferModal('external', true)}
                      className="sleek-card hover:border-red-200 cursor-pointer transition-all group border-2 border-slate-100"
                    >
                      <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center mb-6 group-hover:bg-red-600 group-hover:text-white transition-all">
                        <Landmark size={24} />
                      </div>
                      <h3 className="text-xl font-bold mb-2 uppercase tracking-wide text-red-600">External Bank</h3>
                      <p className="text-sm text-slate-500 mb-8 leading-relaxed">Transfer to other financial institutions worldwide via wire or ACH.</p>
                      <div className="flex items-center gap-2 text-red-600 font-bold text-xs uppercase tracking-wider">
                        Setup Recipient <ArrowRight size={14} />
                      </div>
                   </div>
                </div>

                <TransactionList transactions={transactions.filter(t => t.category === 'Transfer')} />
             </motion.div>
          )}

          {activeTab === 'bills' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="max-w-4xl mx-auto space-y-6 lg:space-y-10"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 lg:mb-10">
                <h2 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-800">Bill Pay</h2>
                <button className="w-full sm:w-auto sleek-button-primary flex items-center justify-center gap-2">
                  <Plus size={18} /> Add New Bill
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                <div className="sleek-card bg-indigo-600 text-white border-none shadow-lg shadow-indigo-100 p-5 lg:p-6">
                  <p className="text-[10px] lg:text-xs font-bold uppercase tracking-widest text-white/60 mb-2 lg:mb-4">Total Outstanding</p>
                  <p className="text-3xl lg:text-4xl font-bold tracking-tight mb-1 lg:mb-2 text-white">
                    ${bills.filter(b => b.status === 'unpaid').reduce((acc, b) => acc + b.amount, 0).toFixed(2)}
                  </p>
                  <p className="text-[10px] lg:text-xs text-white/40 font-medium italic">Across {bills.filter(b => b.status === 'unpaid').length} payments</p>
                </div>
                <div className="sleek-card p-5 lg:p-6">
                  <p className="text-[10px] lg:text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 lg:mb-4">Paid this period</p>
                  <p className="text-3xl lg:text-4xl font-bold tracking-tight text-slate-800 mb-1 lg:mb-2">
                    ${bills.filter(b => b.status === 'paid').reduce((acc, b) => acc + b.amount, 0).toFixed(2)}
                  </p>
                  <div className="flex items-center gap-1.5 text-emerald-600 text-[10px] lg:text-xs font-bold uppercase">
                    <TrendingUp size={14} /> All clear
                  </div>
                </div>
              </div>

              {user && (
                <div className="border border-slate-100 bg-white p-5 lg:p-6 rounded-3xl shadow-sm">
                  <BankCardsSection
                    userId={user.uid}
                    cards={cards}
                    onCardsUpdated={fetchData}
                  />
                </div>
              )}

              <div className="space-y-3 lg:space-y-4">
                <div className="border-b border-slate-100 pb-2">
                  <h3 className="text-lg font-bold text-slate-800">Your Bills List</h3>
                  <p className="text-xs text-slate-400">View and clear active liabilities and ongoing services.</p>
                </div>
                {bills.map(bill => (
                  <div 
                    key={bill.id} 
                    className={`sleek-card p-4 lg:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                      bill.status === 'paid' ? 'opacity-50' : 'hover:scale-[1.01] hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center gap-4 lg:gap-6">
                      <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        bill.status === 'paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'
                      }`}>
                        <ReceiptText size={20} />
                      </div>
                      <div>
                        <h4 className="text-base lg:text-lg font-bold text-slate-800">{bill.name}</h4>
                        <p className="text-[10px] lg:text-xs font-bold text-slate-400 uppercase tracking-wider">
                          Due {bill.dueDate} • {bill.category}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-4 lg:gap-8 border-t sm:border-none pt-3 sm:pt-0">
                       <p className="text-lg font-bold text-slate-800">${bill.amount}</p>
                       {bill.status === 'unpaid' ? (
                         <button 
                           onClick={() => handlePayBill(bill.id)}
                           className="sleek-button-primary py-2 px-4 lg:py-2.5 lg:px-6 text-[10px] lg:text-xs uppercase font-bold tracking-widest"
                         >
                           Pay Bill
                         </button>
                       ) : (
                         <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-widest rounded-md">
                           Paid
                         </span>
                       )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-12 max-w-6xl mx-auto"
            >
              <div className="mb-10">
                <h2 className="text-3xl font-bold tracking-tight text-slate-800">Financial Insights</h2>
                <p className="text-slate-500 mt-1">Smart tracking powered by AI for better financial decisions.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="sleek-card h-[500px] flex flex-col">
                  <div className="flex justify-between items-center mb-10">
                     <h3 className="text-xl font-bold text-slate-800">Spending Trends</h3>
                     <select className="bg-slate-50 border-none rounded-lg text-xs font-bold text-slate-500 py-1.5 focus:ring-0">
                        <option>Last 30 Days</option>
                        <option>Last 6 Months</option>
                     </select>
                  </div>
                  <div className="flex-1 w-full">
                    <SpendingChart />
                  </div>
                </div>
                
                <div className="sleek-card h-[500px] flex flex-col">
                  <div className="flex justify-between items-center mb-10">
                    <h3 className="text-xl font-bold text-slate-800">Asset Growth</h3>
                     <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold uppercase">
                        <TrendingUp size={14} /> +4.2% Growth
                      </div>
                  </div>
                  <div className="flex-1 w-full">
                    <NetWorthChart />
                  </div>
                </div>
              </div>

              {/* Data Summary Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {[
                   { label: 'Highest Spend', value: '$1,240.00', sub: 'Housing & Rent', color: 'indigo' },
                   { label: 'Avg Monthly Save', value: '$840.00', sub: 'Healthy Growth', color: 'emerald' },
                   { label: 'Investment ROI', value: '+12.4%', sub: 'Last Quarter', color: 'indigo' }
                 ].map((item, i) => (
                   <div key={i} className="sleek-card">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">{item.label}</p>
                      <p className="text-3xl font-bold text-slate-800 mb-1">{item.value}</p>
                      <p className={`text-xs font-bold text-${item.color}-600 tracking-tight`}>{item.sub}</p>
                   </div>
                 ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="max-w-3xl mx-auto"
            >
               <div className="flex items-center justify-between mb-10">
                  <h2 className="text-3xl font-bold tracking-tight text-slate-800">Preferences</h2>
                  <button 
                    onClick={signOut}
                    className="flex items-center gap-2 px-4 py-2 border border-slate-200 hover:border-red-200 text-slate-600 hover:text-red-600 hover:bg-red-50 text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm"
                  >
                    <LogOut size={14} />
                    <span>Sign Out</span>
                  </button>
               </div>
               <div className="space-y-8">
                  <div className="sleek-card">
                     <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-4 mb-8 text-blue-900 uppercase tracking-tighter">Executive Personal Details</h3>
                     <div className="flex flex-col sm:flex-row items-center gap-8 mb-10">
                        <div 
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                          onClick={() => document.getElementById('hidden-profile-input')?.click()}
                          className={`w-28 h-28 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center relative overflow-hidden cursor-pointer transition-all shrink-0 ${
                            isDragging 
                              ? 'border-indigo-600 bg-indigo-50/40 scale-105 shadow-md' 
                              : editPhoto 
                                ? 'border-slate-200 hover:border-indigo-400 bg-slate-50' 
                                : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-slate-50'
                          }`}
                        >
                          <input 
                            type="file" 
                            id="hidden-profile-input" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleFileChange(e.target.files[0]);
                              }
                            }}
                          />
                          {editPhoto ? (
                            <>
                              <img src={editPhoto} className="w-full h-full object-cover" alt="Profile" />
                              <div className="absolute inset-x-0 bottom-0 bg-black/60 transition-opacity flex flex-col items-center justify-center text-white py-1.5 text-center">
                                <Upload size={14} className="mb-0.5" />
                                <span className="text-[8px] font-bold uppercase tracking-wider">Change Photo</span>
                              </div>
                            </>
                          ) : (
                            <div className="text-center p-3 flex flex-col items-center justify-center text-slate-400">
                              <Upload size={22} className="mb-1.5 text-slate-400" />
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">Upload Photo</span>
                              <span className="text-[8px] text-slate-400 block mt-0.5">Drag & drop or Click</span>
                            </div>
                          )}
                        </div>
                        <div className="text-center sm:text-left">
                           <p className="text-lg font-bold text-slate-800 capitalize">{user?.displayName || 'Member'}</p>
                           <p className="text-sm text-slate-500">{isAdmin ? 'Executive Administrator' : 'Premium Member'}</p>
                           <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-3">
                             <button onClick={() => alert('Membership ID: ' + user?.uid)} className="text-indigo-600 text-xs font-bold uppercase tracking-widest hover:underline">Membership Info</button>
                             <span className="text-slate-300">|</span>
                             <button 
                               onClick={(e) => {
                                 e.stopPropagation();
                                 const url = prompt('Enter a direct URL for your profile image:');
                                 if (url !== null) setEditPhoto(url);
                               }}
                               className="text-slate-500 text-xs font-bold uppercase tracking-widest hover:underline"
                             >
                               Or set via URL
                             </button>
                           </div>
                        </div>
                     </div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                           <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Display Name</label>
                           <input 
                             type="text" 
                             value={editName} 
                             onChange={(e) => setEditName(e.target.value)}
                             className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-semibold outline-none focus:bg-white transition-all" 
                           />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Phone Link</label>
                          <input 
                            type="tel" 
                            value={editPhone} 
                            onChange={(e) => setEditPhone(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-semibold outline-none focus:bg-white transition-all" 
                          />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Profile Photo URL</label>
                          <input 
                            type="text" 
                            value={editPhoto} 
                            onChange={(e) => setEditPhoto(e.target.value)}
                            placeholder="Direct image link"
                            className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-semibold outline-none focus:bg-white transition-all" 
                          />
                        </div>
                     </div>
                     <button 
                       onClick={handleUpdateProfile}
                       disabled={savingProfile}
                       className="sleek-button-primary mt-10 w-full sm:w-auto"
                     >
                       {savingProfile ? 'Sealing...' : 'Secure Profile Changes'}
                     </button>
                  </div>

                  <div className="sleek-card">
                     <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-4 mb-6 uppercase tracking-widest text-[11px] text-red-600">Executive Security Protocol</h3>
                     <div className="divide-y divide-slate-100">
                        <div className="py-6">
                           <div className="flex items-center justify-between mb-4">
                              <div>
                                 <p className="font-bold text-slate-800">Master Password</p>
                                 <p className="text-xs text-slate-500">Update your account credentials for increased security.</p>
                              </div>
                              <ShieldAlert size={20} className="text-amber-500" />
                           </div>
                           <div className="space-y-4">
                              <input 
                                 type="password" 
                                 value={newPass}
                                 onChange={(e) => setNewPass(e.target.value)}
                                 placeholder="New Security Credential"
                                 className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-bold font-mono outline-none focus:bg-white transition-all"
                               />
                              <button 
                                 onClick={handleResetPass}
                                 className="text-xs font-bold text-red-600 bg-red-50 px-6 py-3 rounded-xl hover:bg-red-600 hover:text-white transition-all uppercase tracking-widest"
                              >
                                 Execute Reset
                              </button>
                           </div>
                        </div>
                        <div className="py-6 flex items-center justify-between">
                           <div>
                              <p className="font-bold text-slate-800">Two-Factor Authentication</p>
                              <p className="text-xs text-slate-500">Add an extra layer of security to your account.</p>
                           </div>
                           <div className="w-12 h-6 bg-indigo-600 rounded-full relative cursor-pointer shadow-inner">
                              <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-md" />
                           </div>
                        </div>
                        <div className="py-6">
                           <div className="flex flex-col gap-2">
                              <p className="font-bold text-indigo-900 uppercase tracking-tight text-xs">Sovereign 30-Day Storage & Ledger Policy</p>
                              <p className="text-xs text-slate-500 leading-relaxed">
                                To protect supreme confidentiality and comply with offshore sovereign data protection standards, New Age of America enforces an automatic core ledger retainer policy.
                              </p>
                              <p className="text-xs text-slate-500 leading-relaxed">
                                Every piece of data—including interest rate settings, system preferences, custom display settings, passwords, and correspondence—is maintained for precisely 30 days. Active sessions refresh this retainer, while 30 continuous days of inactivity automatically trigger cryptographic shredding.
                              </p>
                           </div>
                           <div className="mt-4.5 inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl text-[10px] font-black uppercase tracking-wider">
                              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> 30-Day Storage Cycle Enforced (Active)
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </motion.div>
          )}

          {activeTab === 'support' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <SupportPanel user={user} />
            </motion.div>
          )}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 px-1 flex items-center justify-around z-50">
        {[
          { id: 'dashboard', icon: LayoutDashboard, label: 'Home' },
          { id: 'transfers', icon: ArrowLeftRight, label: 'Pay' },
          { id: 'bills', icon: ReceiptText, label: 'Bills' },
          ...(isAdmin ? [{ id: 'admin', icon: ShieldAlert, label: 'Admin' }] : []),
          { id: 'support', icon: Mail, label: 'Support' },
          { id: 'settings', icon: Settings, label: 'You' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center gap-1 py-2 flex-1 min-w-0 transition-colors ${
              activeTab === item.id ? 'text-indigo-600' : 'text-slate-400'
            }`}
          >
            <item.icon size={18} strokeWidth={activeTab === item.id ? 2.5 : 2} />
            <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wider truncate max-w-full">{item.label}</span>
          </button>
        ))}
      </div>

      {/* Splash Screen */}
      <AnimatePresence>
        {showSplash && <SplashScreen />}
      </AnimatePresence>

      {/* Floating AI */}
      <div className="hidden lg:block">
        <ExecutiveAdvisor />
      </div>

      {/* Modals */}
      <AnimatePresence>
        {isTransferModalOpen && (
          <TransferModal 
            accounts={accounts} 
            onClose={() => setIsTransferModalOpen(false)} 
            onSuccess={fetchData}
            initialType={transferModalInitialType}
            lockType={transferModalLocked}
          />
        )}

        {isDepositModalOpen && user && (
          <DepositModal 
            user={user}
            accounts={accounts}
            onClose={() => setIsDepositModalOpen(false)} 
            onSuccess={fetchData}
          />
        )}

        {payingBill && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Clear Outstanding Bill</h3>
                  <p className="text-xs text-slate-400 font-medium">Select asset account or secure linked bank card</p>
                </div>
                <button 
                  onClick={() => setPayingBill(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg focus:outline-none hover:bg-slate-100 transition"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* Bill Card info */}
                <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100/40 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">{payingBill.category}</span>
                    <h4 className="text-base font-bold text-slate-800">{payingBill.name}</h4>
                    <p className="text-xs text-slate-400">Due {payingBill.dueDate}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Total Due</span>
                    <div className="text-xl font-extrabold text-slate-800">${payingBill.amount.toFixed(2)}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Pick Funding Source</label>
                  
                  {/* Account Funding Source Option */}
                  {accounts.filter(a => a.status === 'active').map(account => (
                    <button
                      key={account.id}
                      onClick={() => executePayBill(payingBill.id, account.id)}
                      className="w-full p-3 flex justify-between items-center hover:bg-slate-50 transition border border-slate-100 rounded-2xl text-left cursor-pointer hover:border-indigo-600 group mb-3 bg-white"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                          <Landmark size={18} />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-800">{account.name}</div>
                          <div className="text-[10px] text-slate-400">{account.number}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-slate-400">Bal.</div>
                        <div className="text-sm font-bold text-indigo-600">${account.balance.toFixed(2)}</div>
                      </div>
                    </button>
                  ))}

                  {/* Connected Credit/Debit Cards Options */}
                  {cards.map(card => (
                    <button
                      key={card.id}
                      onClick={() => executePayBill(payingBill.id, undefined, card.id)}
                      className="w-full p-3 flex justify-between items-center hover:bg-slate-50 transition border border-slate-100 rounded-2xl text-left cursor-pointer hover:border-indigo-600 group mb-3 bg-white"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                          <CreditCard size={18} />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-800">{card.cardType} Bank Card (Linked)</div>
                          <div className="text-[10px] text-slate-400">•••• •••• •••• {card.cardNumber.slice(-4)}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-slate-400">Holder</div>
                        <div className="text-xs font-bold text-emerald-600">{card.cardholderName}</div>
                      </div>
                    </button>
                  ))}

                  {cards.length === 0 && (
                    <div className="p-4 bg-slate-50 rounded-2xl border border-dashed text-center text-xs text-slate-400 font-medium">
                      Want to pay via cards? Link a bank card in the bills section first.
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-start gap-2.5">
                  <Lock size={15} className="text-slate-400 mt-0.5 flex-shrink-0" />
                  <p className="text-[10px] text-slate-400 leading-normal font-medium">
                    This transaction initializes a secure cryptographic flow and logs the immediate processing inside the administrative master ledger.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

