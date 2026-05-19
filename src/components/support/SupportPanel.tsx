import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  MessageSquare, 
  Send, 
  Mail, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft, 
  Lock, 
  ShieldCheck, 
  Fingerprint, 
  Clock 
} from 'lucide-react';
import { SupportMessage } from '../../types';

interface SupportPanelProps {
  user: any;
}

export const SupportPanel = ({ user }: SupportPanelProps) => {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [selectedMsg, setSelectedMsg] = useState<SupportMessage | null>(null);
  const [newSubject, setNewSubject] = useState('');
  const [newText, setNewText] = useState('');
  const [replyText, setReplyText] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Use a ref to store the latest selectedMsg to completely eliminate stale closure issues during async polling
  const selectedMsgRef = React.useRef<SupportMessage | null>(null);
  useEffect(() => {
    selectedMsgRef.current = selectedMsg;
  }, [selectedMsg]);

  const fetchUserMessages = async () => {
    try {
      const res = await fetch(`/api/users/${user.uid}/messages`);
      const data = await res.json();
      setMessages(data);
      if (selectedMsgRef.current) {
        const found = data.find((m: any) => m.id === selectedMsgRef.current?.id);
        if (found) {
          setSelectedMsg(found);
        }
      }
    } catch (err) {
      console.error('Error loading secure correspondence:', err);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchUserMessages();

    // Setup high-frequency 3-second secure correspondence transceiver poll
    const interval = setInterval(fetchUserMessages, 3000);
    return () => clearInterval(interval);
  }, [user.uid]);

  const showStatus = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMsg({ text, type });
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || !newText.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          userName: user.displayName || user.email,
          subject: newSubject.trim(),
          text: newText.trim()
        })
      });
      if (!res.ok) throw new Error('Security node handshake failed');
      const data = await res.json();
      showStatus('Secured correspondence dispatched to specialist registry.');
      setNewSubject('');
      setNewText('');
      setShowCreateForm(false);
      await fetchUserMessages();
      setSelectedMsg(data);
    } catch (err: any) {
      showStatus(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMsg || !replyText.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/messages/${selectedMsg.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: 'user',
          senderName: user.displayName || user.email,
          text: replyText.trim()
        })
      });
      if (!res.ok) throw new Error('Failed to dispatch reply');
      setReplyText('');
      showStatus('Secure follow-up submitted');
      await fetchUserMessages();
    } catch (err: any) {
      showStatus(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 px-1 sm:px-4" id="support-panel-root">
      
      {/* Header Info Section - optimized for visual distinction & tap targets */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-indigo-100 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 bg-indigo-50 text-indigo-700 rounded-lg">
              <Lock size={16} />
            </span>
            <span className="text-[10px] uppercase font-black tracking-widest text-indigo-650">Confidential End-to-End Channel</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">Secure Correspondence</h2>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">Sovereign peer-to-peer encrypted communications terminal with prime executive advisors.</p>
        </div>
        <button
          onClick={() => {
            setShowCreateForm(!showCreateForm);
            if (!showCreateForm) setSelectedMsg(null);
          }}
          className="w-full sm:w-auto px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-sm select-none"
        >
          <Mail size={15} /> 
          {showCreateForm ? 'View Registry Feed' : 'New Transmission'}
        </button>
      </div>

      {statusMsg && (
        <div className={`p-4 rounded-xl flex items-center gap-2.5 font-bold text-xs shadow-sm border ${
          statusMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'
        }`}>
          {statusMsg.type === 'success' ? <CheckCircle2 size={16} className="text-emerald-600" /> : <AlertCircle size={16} className="text-red-600" />}
          {statusMsg.text}
        </div>
      )}

      {showCreateForm ? (
        <div className="sleek-card border border-indigo-100 bg-white p-5 sm:p-7 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Fingerprint size={18} className="text-indigo-600" />
            <h3 className="font-extrabold text-slate-800 text-xs sm:text-sm uppercase tracking-wider">Initialize Encrypted Frame</h3>
          </div>
          <form onSubmit={handleCreateTicket} className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Subject Inquiry Node</label>
              <input
                type="text"
                placeholder="e.g. Custodial offshore gold clearance verify"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                required
                className="w-full p-3 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all font-sans text-slate-800"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Detailed Statement Descriptor</label>
              <textarea
                placeholder="Declare funds routing sources, account credentials verification references, or specific questions in detail..."
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                required
                rows={5}
                className="w-full p-3 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all font-sans text-slate-800"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-indigo-100"
            >
              {loading ? 'Performing Encryption Seal Handshake...' : 'Transmit Cryptographic Frame'}
            </button>
          </form>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Threads List - Hidden on mobile if a message is currently selected */}
          <div className={`${selectedMsg ? 'hidden md:flex' : 'flex'} md:col-span-1 bg-white border border-slate-200 rounded-2xl flex flex-col overflow-hidden h-[480px] sm:h-[500px] shadow-sm`}>
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <span className="font-bold text-[10px] text-slate-450 uppercase tracking-widest flex items-center gap-1.5">
                <ShieldCheck size={12} className="text-slate-500" /> Secure Threads
              </span>
              <span className="font-mono text-[9px] bg-slate-900 text-white px-2 py-0.5 rounded-full font-bold">
                {messages.length} Active
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {messages.map((msg) => {
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
                        ? 'bg-indigo-50/40 border-indigo-600' 
                        : 'border-transparent hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[9px] font-mono text-slate-400 uppercase">{new Date(msg.date).toLocaleDateString()}</span>
                      <span className={`px-1.5 py-0.5 text-[8px] rounded uppercase font-extrabold tracking-wide ${
                        msg.status === 'open' ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      }`}>
                        {msg.status}
                      </span>
                    </div>
                    <h4 className="font-bold text-xs text-slate-800 truncate mb-1">{msg.subject}</h4>
                    <p className="text-[10px] text-slate-450 truncate font-medium">{msg.text}</p>
                  </div>
                );
              })}
              {messages.length === 0 && (
                <div className="p-10 text-center text-slate-400 text-xs italic flex flex-col items-center justify-center h-full">
                  <Mail size={32} className="text-slate-250 mb-3" />
                  <span>No secure conversations found.</span>
                </div>
              )}
            </div>
          </div>

          {/* Active dialogue panel - Hidden on mobile if no message is selected */}
          <div className={`${!selectedMsg ? 'hidden md:flex' : 'flex'} md:col-span-2 bg-white border border-slate-200 rounded-2xl flex flex-col overflow-hidden h-[480px] sm:h-[500px] shadow-sm`}>
            {selectedMsg ? (
              <div className="flex flex-col h-full">
                
                {/* Responsive Header inside Active Dialogue */}
                <div className="p-4 border-b border-indigo-50 bg-indigo-50/20 flex items-center justify-between gap-3 shrink-0">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Back button specifically on mobile */}
                    <button
                      onClick={() => setSelectedMsg(null)}
                      className="md:hidden p-1.5 -ml-1 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg shrink-0 outline-none transition-colors"
                      title="Back to threads"
                    >
                      <ArrowLeft size={16} />
                    </button>
                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                        <span className="text-[9px] font-mono font-bold text-indigo-700 uppercase tracking-wider">SECURE SHIELD TRANSCEIVER</span>
                      </div>
                      <h4 className="font-black text-slate-850 text-xs sm:text-sm uppercase tracking-wider truncate mt-0.5">{selectedMsg.subject}</h4>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <span className="text-[9px] font-bold uppercase py-0.5 px-2 bg-slate-900 text-slate-200 rounded-lg font-mono tracking-tight hidden sm:inline-flex items-center gap-1">
                      <Clock size={10} /> Active
                    </span>
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase ${
                      selectedMsg.status === 'open' 
                        ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {selectedMsg.status}
                    </span>
                  </div>
                </div>

                {/* Dialogues Chat Stream */}
                <div className="flex-1 p-4 sm:p-5 overflow-y-auto bg-slate-50/10 space-y-4">
                  
                  {/* Client original dispatch */}
                  <div className="flex flex-col items-end ml-auto max-w-[85%]">
                    <p className="text-[9px] font-black text-indigo-650 mb-1 uppercase tracking-widest flex items-center gap-1">
                      <ShieldCheck size={10} className="text-indigo-600" /> SECURED INBOX (YOU)
                    </p>
                    <div className="bg-indigo-600 text-white text-xs px-4 py-3 rounded-2xl rounded-tr-none shadow-sm font-semibold select-text break-words w-full">
                      {selectedMsg.text}
                    </div>
                    <span className="text-[8px] text-slate-400 font-mono mt-1">{new Date(selectedMsg.date).toLocaleString()}</span>
                  </div>

                  {/* Replies cascade */}
                  {selectedMsg.replies.map((rep) => {
                    const isStaff = rep.sender === 'admin';
                    return (
                      <div
                        key={rep.id}
                        className={`flex flex-col max-w-[85%] ${!isStaff ? 'items-end ml-auto' : 'items-start mr-auto'}`}
                      >
                        <p className={`text-[9px] font-black mb-1 uppercase tracking-widest ${
                          isStaff ? 'text-slate-600 flex items-center gap-1' : 'text-indigo-650'
                        }`}>
                          {isStaff ? (
                            <>
                              <Fingerprint size={10} className="text-slate-500" /> OFFICIAL RESOLUTION SPECIALIST
                            </>
                          ) : 'SECURED INBOX (YOU)'}
                        </p>
                        <div className={`text-xs px-4 py-3 rounded-2xl shadow-sm font-semibold break-words w-full ${
                          isStaff 
                            ? 'bg-white border border-slate-200 text-slate-850 rounded-tl-none ring-1 ring-slate-100' 
                            : 'bg-indigo-600 text-white rounded-tr-none'
                        }`}>
                          {rep.text}
                        </div>
                        <span className="text-[8px] text-slate-400 font-mono mt-1 font-semibold">
                          {new Date(rep.date).toLocaleString()}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Secure Reply Drafting UI - optimized with large tap button and rounded form elements */}
                <div className="p-3.5 border-t border-slate-100 bg-white shrink-0">
                  <form onSubmit={handleSendReply} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Type protected response matrix..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all font-sans font-semibold text-slate-800"
                    />
                    <button
                      type="submit"
                      disabled={loading || !replyText.trim()}
                      className="px-5 py-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-md select-none flex items-center gap-1 shrink-0"
                    >
                      <Send size={12} />
                      <span className="hidden sm:inline">Dispatch</span>
                    </button>
                  </form>
                </div>

              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center bg-slate-50/10">
                <MessageSquare size={44} className="text-slate-200 mb-3" />
                <h4 className="font-bold text-slate-800 mb-1 text-sm">Transmission Inactive</h4>
                <p className="text-xs max-w-xs text-slate-400 leading-relaxed font-semibold">
                  Select a live cryptographic dialogue from the index panel to initiate interaction, or formulate a new transmission.
                </p>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
};
