
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
  status: 'completed' | 'pending' | 'rejected';
}

export interface Bill {
  id: string;
  name: string;
  dueDate: string;
  amount: number;
  status: 'paid' | 'unpaid';
  category: string;
}

export interface SupportMessage {
  id: string;
  userId: string;
  userName: string;
  subject: string;
  text: string;
  date: string;
  replies: Array<{
    id: string;
    sender: 'admin' | 'user';
    senderName: string;
    text: string;
    date: string;
  }>;
  status: 'open' | 'resolved';
}

export interface User {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  role: 'admin' | 'user';
  phone?: string;
  depositDetails?: {
    paypal?: string;
    cashapp?: string;
    zelle?: string;
    bitcoin?: string;
    bankInfo?: string;
  };
}

export interface VaultItem {
  id: string;
  userId: string;
  name: string;
  size: string;
  type: string;
  uploadDate: string;
  expiryDate: string;
}
