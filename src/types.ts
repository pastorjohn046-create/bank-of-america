
export interface Account {
  id: string;
  type: string;
  number: string;
  balance: number;
  currency: string;
  name: string;
  userId: string;
  creditLimit?: number;
  status: 'active' | 'disabled';
  depositRestricted: boolean;
}

export interface Transaction {
  id: string;
  accountId: string;
  date: string;
  amount: number;
  description: string;
  category: string;
  type: 'debit' | 'credit';
  status: 'completed' | 'pending';
}

export interface Bill {
  id: string;
  name: string;
  dueDate: string;
  amount: number;
  status: 'paid' | 'unpaid';
  category: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}
