
import { Account, Transaction, Bill, VaultItem, BankCard } from '../types';

const API_BASE = '/api';

export const api = {
  getAccounts: async (userId?: string): Promise<Account[]> => {
    const url = userId ? `${API_BASE}/accounts?userId=${userId}` : `${API_BASE}/accounts`;
    const res = await fetch(url);
    return res.json();
  },
  getTransactions: async (accountId?: string, userId?: string): Promise<Transaction[]> => {
    let url = `${API_BASE}/transactions`;
    const params = new URLSearchParams();
    if (accountId) params.append('accountId', accountId);
    if (userId) params.append('userId', userId);
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    const res = await fetch(url);
    return res.json();
  },
  getBills: async (): Promise<Bill[]> => {
    const res = await fetch(`${API_BASE}/bills`);
    return res.json();
  },
  transfer: async (data: { fromId: string; toId: string; amount: number; description?: string }) => {
    const res = await fetch(`${API_BASE}/transfers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  payBill: async (billId: string, accountId?: string, cardId?: string) => {
    const res = await fetch(`${API_BASE}/bills/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ billId, accountId, cardId }),
    });
    return res.json();
  },
  askAI: async (prompt: string): Promise<string> => {
    const res = await fetch(`${API_BASE}/ai/advisor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    const data = await res.json();
    return data.text;
  },
  getVaultItems: async (userId?: string): Promise<VaultItem[]> => {
    const url = userId ? `${API_BASE}/vault?userId=${userId}` : `${API_BASE}/vault`;
    const res = await fetch(url);
    return res.json();
  },
  uploadToVault: async (data: { userId: string; name: string; size?: string; type?: string }): Promise<VaultItem> => {
    const res = await fetch(`${API_BASE}/vault`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  deleteFromVault: async (id: string): Promise<{ success: boolean }> => {
    const res = await fetch(`${API_BASE}/vault/${id}`, {
      method: 'DELETE',
    });
    return res.json();
  },
  getCards: async (userId?: string): Promise<BankCard[]> => {
    const url = userId ? `${API_BASE}/cards?userId=${userId}` : `${API_BASE}/cards`;
    const res = await fetch(url);
    return res.json();
  },
  addCard: async (data: { userId: string; cardholderName: string; cardNumber: string; expiryDate: string; cvv: string; cardType?: string; themeColor?: string }): Promise<BankCard> => {
    const res = await fetch(`${API_BASE}/cards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  deleteCard: async (id: string): Promise<{ success: boolean }> => {
    const res = await fetch(`${API_BASE}/cards/${id}`, {
      method: 'DELETE',
    });
    return res.json();
  }
};
