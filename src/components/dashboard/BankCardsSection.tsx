import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, CreditCard, Lock, X, Check, Eye, EyeOff } from 'lucide-react';
import { BankCard } from '../../types';
import { api } from '../../services/api';

interface BankCardsSectionProps {
  userId: string;
  cards: BankCard[];
  onCardsUpdated: () => void;
  userDisplayName?: string;
}

const COLOR_TEMPLATES = [
  { id: 'slate', name: 'Midnight Onyx', css: 'from-slate-800 to-slate-950 text-white' },
  { id: 'blue', name: 'Royal Sapphire', css: 'from-blue-600 to-indigo-900 text-white' },
  { id: 'emerald', name: 'Emerald Forest', css: 'from-emerald-600 to-teal-900 text-white' },
  { id: 'sunset', name: 'Sunset Amber', css: 'from-amber-500 to-rose-700 text-white' },
  { id: 'purple', name: 'Imperial Amethyst', css: 'from-purple-700 to-fuchsia-950 text-white' },
  { id: 'crimson', name: 'Crimson Velvet', css: 'from-rose-600 to-red-950 text-white' }
];

export const BankCardsSection: React.FC<BankCardsSectionProps> = ({ userId, cards, onCardsUpdated, userDisplayName }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardholderName, setCardholderName] = useState(userDisplayName || '');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [selectedTheme, setSelectedTheme] = useState(COLOR_TEMPLATES[0].css);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showFullNumberId, setShowFullNumberId] = useState<string | null>(null);
  const [deletingCardId, setDeletingCardId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && userDisplayName) {
      setCardholderName(userDisplayName);
    }
  }, [isOpen, userDisplayName]);

  // Auto-detect Card Brand
  const getCardBrand = (number: string) => {
    const cleanNo = number.replace(/\D/g, '');
    if (cleanNo.startsWith('4')) return 'Visa';
    if (cleanNo.startsWith('5')) return 'Mastercard';
    if (cleanNo.startsWith('3')) return 'AMEX';
    if (cleanNo.startsWith('6')) return 'Discover';
    return 'Visa'; // fallback default
  };

  // Format Card Number (adds spaces every 4 digits)
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    let formatted = '';
    for (let i = 0; i < val.length && i < 16; i++) {
      if (i > 0 && i % 4 === 0) {
        formatted += ' ';
      }
      formatted += val[i];
    }
    setCardNumber(formatted);
  };

  // Format Expiry Date (adds slash MM/YY)
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 4) val = val.substring(0, 4);
    
    if (val.length >= 3) {
      setExpiryDate(`${val.substring(0, 2)}/${val.substring(2)}`);
    } else {
      setExpiryDate(val);
    }
  };

  // Format CVV (max 4 digits)
  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    if (val.length <= 4) {
      setCvv(val);
    }
  };

  const handleLinkCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const cleanNo = cardNumber.replace(/\D/g, '');
    if (cleanNo.length < 15) {
      setErrorMessage('Please enter a valid card number (15 to 16 digits).');
      return;
    }

    if (!cardholderName.trim()) {
      setErrorMessage('Cardholder name is required.');
      return;
    }

    if (!/^\d{2}\/\d{2}$/.test(expiryDate)) {
      setErrorMessage('Expiry date must be in MM/YY format.');
      return;
    }

    const [monthStr, yearStr] = expiryDate.split('/');
    const month = parseInt(monthStr, 10);
    if (month < 1 || month > 12) {
      setErrorMessage('Expiry month must be between 01 and 12.');
      return;
    }

    if (cvv.length < 3) {
      setErrorMessage('CVV must be at least 3 digits.');
      return;
    }

    setIsSubmitting(true);
    try {
      const type = getCardBrand(cardNumber);
      await api.addCard({
        userId,
        cardholderName,
        cardNumber,
        expiryDate,
        cvv,
        cardType: type,
        themeColor: selectedTheme
      });

      setSuccessMessage('Bank card has been linked successfully!');
      setTimeout(() => {
        setIsOpen(false);
        // Clear state
        setCardNumber('');
        setCardholderName('');
        setExpiryDate('');
        setCvv('');
        setSelectedTheme(COLOR_TEMPLATES[0].css);
        setSuccessMessage('');
        onCardsUpdated();
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error occurred while linking bank card.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnlinkCard = async (id: string) => {
    try {
      await api.deleteCard(id);
      setDeletingCardId(null);
      onCardsUpdated();
    } catch (err: any) {
      alert(err.message || 'Failed to unlink card.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Linked Funding Cards</h3>
          <p className="text-xs text-slate-400">Manage external debit and credit instruments used to fund liabilities.</p>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="sleek-button-primary py-2 px-3 text-xs uppercase font-bold tracking-wider flex items-center gap-1.5"
        >
          <Plus size={14} /> Link Card
        </button>
      </div>

      {cards.length === 0 ? (
        <div className="border border-dashed border-slate-200 rounded-2xl p-8 text-center bg-slate-50/50">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
            <CreditCard size={22} />
          </div>
          <h4 className="text-sm font-semibold text-slate-700">No linked bank cards found</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Link a secure external debit or credit card to automatically clear recurring bills.
          </p>
          <button
            onClick={() => setIsOpen(true)}
            className="mt-4 px-4 py-2 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100/70 text-indigo-600 rounded-xl text-xs font-bold transition-all"
          >
            Link Your First Card
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
          {cards.map((card) => {
            const isShowingNo = showFullNumberId === card.id;
            return (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${card.themeColor} p-6 shadow-md transition-all flex flex-col justify-between h-48`}
              >
                {/* Delink Confirmation Overlay */}
                <AnimatePresence>
                  {deletingCardId === card.id && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-slate-950/92 backdrop-blur-sm z-30 flex flex-col justify-center items-center p-4 text-center rounded-2xl"
                    >
                      <span className="text-[10px] uppercase tracking-widest text-rose-400 font-mono font-bold mb-1">Security Confirmation</span>
                      <p className="text-white text-xs font-semibold mb-3">Unlink card ending in {card.cardNumber.slice(-4)}?</p>
                      <div className="flex gap-2.5 w-full max-w-[220px]">
                        <button
                          onClick={() => setDeletingCardId(null)}
                          className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all"
                        >
                          Keep
                        </button>
                        <button
                          onClick={() => handleUnlinkCard(card.id)}
                          className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all"
                        >
                          Unlink
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Decorative Elements */}
                <div className="absolute right-0 bottom-0 w-32 h-32 bg-white/5 rounded-full -mr-8 -mb-8 pointer-events-none" />
                <div className="absolute left-1/2 top-4 w-40 h-40 bg-white/5 rounded-full -ml-20 -mt-20 pointer-events-none" />

                <div className="flex justify-between items-start z-10">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase tracking-widest text-white/60 font-mono font-bold">NewAge Elite</span>
                    {/* Brand Identifier */}
                    <span className="text-sm font-black italic tracking-tight text-white/90">
                      {card.cardType.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <div className="p-1.5 text-white/70" title="Secure Link Active">
                      <Lock size={14} />
                    </div>
                    <button
                      onClick={() => setDeletingCardId(card.id)}
                      className="p-1.5 text-white/60 hover:text-rose-400 rounded-lg hover:bg-white/10 transition-colors"
                      title="Unlink Card"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* EMV Microchip Illustration */}
                <div className="w-9 h-7 bg-amber-400/80 rounded-md relative overflow-hidden flex flex-col justify-between p-1 border border-amber-300 pointer-events-none my-1">
                  <div className="flex justify-between border-b border-amber-500/40 pb-0.5">
                    <div className="w-1 border-r border-amber-500/40 h-1.5" />
                    <div className="w-1 border-r border-amber-500/40 h-1.5" />
                  </div>
                  <div className="w-full h-1 border-y border-amber-500/40" />
                </div>

                {/* Card Number display */}
                <div className="my-2 z-10">
                  <p className="text-lg font-mono font-medium tracking-widest text-white">
                    {card.cardNumber}
                  </p>
                </div>

                <div className="flex justify-between items-end z-10">
                  <div className="flex flex-col">
                    <span className="text-[8px] uppercase tracking-wider text-white/50 font-bold">Cardholder</span>
                    <span className="text-xs font-semibold tracking-wide text-white/90">{card.cardholderName}</span>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <span className="text-[8px] uppercase tracking-wider text-white/50 font-bold">Expires</span>
                      <span className="text-xs font-mono font-semibold text-white/90">{card.expiryDate}</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[8px] uppercase tracking-wider text-white/50 font-bold">CVV</span>
                      <span className="text-xs font-mono font-semibold text-white/95">{card.cvv}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Linking Modal Dialog */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Lock size={18} className="text-indigo-600" /> Secure Card Connector
                  </h3>
                  <p className="text-xs text-slate-400">Link external accounts via encrypted tokens</p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[80vh] space-y-6">
                {/* Visual Card Preview */}
                <div className="perspective-card">
                  <div className={`rounded-2xl bg-gradient-to-br ${selectedTheme} p-6 h-44 shadow-lg flex flex-col justify-between relative overflow-hidden transition-all duration-300`}>
                    <div className="absolute right-0 bottom-0 w-32 h-32 bg-white/5 rounded-full -mr-8 -mb-8 pointer-events-none" />
                    <div className="absolute left-1/2 top-4 w-40 h-40 bg-white/5 rounded-full -ml-20 -mt-20 pointer-events-none" />

                    <div className="flex justify-between items-start z-10">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] uppercase tracking-widest text-white/60 font-mono font-bold">NewAge Elite</span>
                        <span className="text-xs font-black italic tracking-wide text-white/80">
                          {getCardBrand(cardNumber).toUpperCase()}
                        </span>
                      </div>
                      <CreditCard size={18} className="text-white/70" />
                    </div>

                    <div className="w-8 h-6 bg-amber-400/80 rounded-md pointer-events-none border border-amber-300/40 my-1 pb-1" />

                    <div>
                      <p className="text-base font-mono tracking-widest text-white font-medium my-1">
                        {cardNumber || '••••  ••••  ••••  ••••'}
                      </p>
                    </div>

                    <div className="flex justify-between items-end z-10">
                      <div className="flex flex-col">
                        <span className="text-[7px] uppercase tracking-wider text-white/50 font-bold">Holder Name</span>
                        <span className="text-xs font-semibold text-white/90 truncate max-w-[150px]">
                          {cardholderName || 'CARDHOLDER NAME'}
                        </span>
                      </div>
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <span className="text-[7px] uppercase tracking-wider text-white/50 font-bold">Expires</span>
                          <span className="text-xs font-mono font-semibold text-white/90">{expiryDate || 'MM/YY'}</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <span className="text-[7px] uppercase tracking-wider text-white/50 font-bold">CVV</span>
                          <span className="text-xs font-mono font-semibold text-white/90">{cvv || '***'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {errorMessage && (
                  <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-medium">
                    {errorMessage}
                  </div>
                )}

                {successMessage && (
                  <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl text-xs font-medium flex items-center gap-1.5">
                    <Check size={14} /> {successMessage}
                  </div>
                )}

                <form onSubmit={handleLinkCard} className="space-y-4">
                  {/* Cardholder Name */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Cardholder Name</label>
                    <input
                      type="text"
                      className="w-full text-sm bg-slate-50 border border-slate-200 outline-none rounded-xl p-3 text-slate-800 placeholder-slate-400 focus:border-indigo-600 focus:bg-white transition"
                      placeholder="e.g. John Pastor"
                      value={cardholderName}
                      onChange={(e) => setCardholderName(e.target.value)}
                      disabled={isSubmitting}
                      required
                    />
                  </div>

                  {/* Card Number */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Card Number</label>
                    <div className="relative">
                      <input
                        type="text"
                        className="w-full text-sm bg-slate-50 border border-slate-200 outline-none rounded-xl p-3 pr-10 text-slate-800 font-mono placeholder-slate-400 focus:border-indigo-600 focus:bg-white transition"
                        placeholder="4111 2222 3333 4444"
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        disabled={isSubmitting}
                        required
                      />
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                        <CreditCard size={18} />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Expiry Date */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Exp. Date (MM/YY)</label>
                      <input
                        type="text"
                        className="w-full text-sm bg-slate-50 border border-slate-200 outline-none rounded-xl p-3 text-slate-800 font-mono placeholder-slate-400 focus:border-indigo-600 focus:bg-white transition"
                        placeholder="12/28"
                        value={expiryDate}
                        onChange={handleExpiryChange}
                        disabled={isSubmitting}
                        required
                      />
                    </div>

                    {/* CVV */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">CVV</label>
                      <input
                        type="password"
                        className="w-full text-sm bg-slate-50 border border-slate-200 outline-none rounded-xl p-3 text-slate-800 font-mono placeholder-slate-400 focus:border-indigo-600 focus:bg-white transition"
                        placeholder="***"
                        value={cvv}
                        onChange={handleCvvChange}
                        disabled={isSubmitting}
                        required
                      />
                    </div>
                  </div>

                  {/* Themes Select */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Card Design Gradient</label>
                    <div className="flex flex-wrap gap-2.5">
                      {COLOR_TEMPLATES.map((color) => (
                        <button
                          key={color.id}
                          type="button"
                          onClick={() => setSelectedTheme(color.css)}
                          className={`w-8 h-8 rounded-full bg-gradient-to-br ${color.css} flex items-center justify-center border-2 transition-transform hover:scale-105 ${
                            selectedTheme === color.css ? 'border-indigo-600 ring-2 ring-indigo-100 scale-105' : 'border-transparent'
                          }`}
                          title={color.name}
                        >
                          {selectedTheme === color.css && <Check size={12} className="text-white" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="flex-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold uppercase py-3 rounded-xl transition"
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 sleek-button-primary text-xs font-bold uppercase py-3 rounded-xl transition flex items-center justify-center gap-1"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Verifying...' : 'Link Card'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
