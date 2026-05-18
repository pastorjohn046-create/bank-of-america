
import { Account, Transaction, Bill } from '../types';

const API_BASE = '/api';

export const api = {
  getAccounts: async (): Promise<Account[]> => {
    const res = await fetch(`${API_BASE}/accounts`);
    return res.json();
  },
  getTransactions: async (accountId?: string): Promise<Transaction[]> => {
    const url = accountId ? `${API_BASE}/transactions?accountId=${accountId}` : `${API_BASE}/transactions`;
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
  payBill: async (billId: string, accountId: string) => {
    const res = await fetch(`${API_BASE}/bills/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ billId, accountId }),
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
  }
};
