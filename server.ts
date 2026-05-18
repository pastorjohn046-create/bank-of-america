import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

interface User {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'user';
  ssn?: string;
  phone?: string;
}

interface Account {
  id: string;
  name: string;
  balance: number;
  type: string;
  currency: string;
  number: string;
  userId: string;
  creditLimit?: number;
  status: 'active' | 'disabled';
  depositRestricted: boolean;
}

interface Transaction {
  id: string;
  accountId: string;
  date: string;
  amount: number;
  description: string;
  category: string;
  type: 'debit' | 'credit';
  status: 'completed' | 'pending';
}

interface AdminLog {
  id: string;
  msg: string;
  time: string;
}

interface Bill {
  id: string;
  name: string;
  dueDate: string;
  amount: number;
  status: 'paid' | 'unpaid';
  category: string;
  accountId?: string;
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Mock Database State
let users: User[] = [
  { uid: 'user_1', email: 'pastorjohn046@gmail.com', displayName: 'John Pastor', role: 'admin' }
];

let accounts: Account[] = [
  { id: '1', userId: 'user_1', type: 'checking', number: '**** 4291', balance: 12450.75, currency: 'USD', name: 'John Pastor (Checking)', creditLimit: 2000, status: 'active', depositRestricted: false },
  { id: '2', userId: 'user_1', type: 'savings', number: '**** 8820', balance: 45200.00, currency: 'USD', name: 'John Pastor (Savings)', creditLimit: 5000, status: 'active', depositRestricted: false },
  { id: '3', userId: 'user_2', type: 'checking', number: '**** 3314', balance: 8430.20, currency: 'USD', name: 'Sarah Jenkins', creditLimit: 10000, status: 'active', depositRestricted: false },
  { id: '4', userId: 'user_3', type: 'savings', number: '**** 1234', balance: 3200.50, currency: 'USD', name: 'David Smith', creditLimit: 1500, status: 'active', depositRestricted: false }
];

let transactions: Transaction[] = [
  { id: 't1', accountId: '1', date: new Date().toISOString(), amount: -12.50, description: 'Starbucks Coffee', category: 'Food & Drink', type: 'debit', status: 'completed' },
  { id: 't2', accountId: '1', date: new Date(Date.now() - 86400000).toISOString(), amount: -54.20, description: 'Shell Gasoline', category: 'Transportation', type: 'debit', status: 'completed' },
  { id: 't3', accountId: '1', date: new Date(Date.now() - 172800000).toISOString(), amount: 2500.00, description: 'Salary Deposit', category: 'Income', type: 'credit', status: 'completed' },
  { id: 't4', accountId: '3', date: new Date(Date.now() - 432000000).toISOString(), amount: 100.00, description: 'Interest Earned', category: 'Income', type: 'credit', status: 'completed' }
];

let bills: Bill[] = [
  { id: 'b1', name: 'Cloud Services', dueDate: '2026-06-01', amount: 124.99, status: 'unpaid', category: 'Business' },
  { id: 'b2', name: 'Electricity Bill', dueDate: '2026-05-25', amount: 85.50, status: 'unpaid', category: 'Utilities' },
  { id: 'b3', name: 'Premium Insurance', dueDate: '2026-05-20', amount: 250.00, status: 'paid', category: 'Insurance' }
];

let adminLogs: AdminLog[] = [
  { id: '1', msg: 'Core System Initialized', time: new Date().toLocaleTimeString() },
  { id: '2', msg: 'Executive Channel Security active', time: new Date().toLocaleTimeString() }
];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // AUTH API
  app.post("/api/auth/signup", (req, res) => {
    const { email, password, name, ssn, phone } = req.body;
    if (users.find(u => u.email === email)) {
      return res.status(400).json({ error: "User already exists" });
    }
    const newUser: User = {
      uid: Math.random().toString(36).substr(2, 9),
      email,
      displayName: name || email.split('@')[0],
      role: email === 'pastorjohn046@gmail.com' ? 'admin' : 'user',
      ssn,
      phone
    };
    users.push(newUser);
    res.json({ user: newUser });
  });

  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    // In a real app, verify password here
    res.json({ user });
  });

  // ADMIN LOGS
  app.get("/api/admin/logs", (req, res) => res.json(adminLogs));
  app.post("/api/admin/logs", (req, res) => {
    const { msg } = req.body;
    const newLog = { 
      id: Math.random().toString(36).substr(2, 9), 
      msg, 
      time: new Date().toLocaleTimeString() 
    };
    adminLogs.unshift(newLog);
    if (adminLogs.length > 50) adminLogs.pop();
    res.status(201).json(newLog);
  });

  // API Routes
  app.get("/api/accounts", (req, res) => res.json(accounts));
  
  app.get("/api/transactions", (req, res) => {
    const { accountId } = req.query;
    if (accountId) {
      return res.json(transactions.filter(t => t.accountId === accountId as string));
    }
    res.json(transactions);
  });

  app.get("/api/bills", (req, res) => res.json(bills));

  app.get("/api/admin/metrics", (req, res) => {
    const totalDeposits = accounts.reduce((acc, a) => acc + a.balance, 0);
    const totalTransactions = transactions.length;
    const pendingBills = bills.filter(b => b.status === 'unpaid').length;
    const totalCredit = accounts.reduce((acc, a) => acc + (a.creditLimit || 0), 0);
    
    res.json({
      totalDeposits,
      totalTransactions,
      pendingBills,
      activeUsers: new Set(accounts.map(a => a.userId)).size,
      systemIntegrity: '99.9%',
      availableCredit: totalCredit
    });
  });

  // Admin: Update Account Full Data
  app.patch("/api/admin/accounts/:id", (req, res) => {
    const { id } = req.params;
    const { balance, name, creditLimit, status, depositRestricted } = req.body;
    const account = accounts.find(a => a.id === id);
    if (!account) return res.status(404).json({ error: "Account not found" });
    
    if (balance !== undefined) account.balance = Number(balance);
    if (name !== undefined) account.name = name;
    if (creditLimit !== undefined) account.creditLimit = Number(creditLimit);
    if (status !== undefined) account.status = status;
    if (depositRestricted !== undefined) account.depositRestricted = !!depositRestricted;
    
    res.json(account);
  });

  // Admin: Add Transaction
  app.post("/api/admin/transactions", (req, res) => {
    const { accountId, description, amount, category, status } = req.body;
    const account = accounts.find(a => a.id === accountId);
    if (!account) return res.status(404).json({ error: "Account not found" });

    if (account.status === 'disabled') {
      return res.status(403).json({ error: "Cannot add transaction to a disabled account" });
    }

    if (amount > 0 && account.depositRestricted) {
      return res.status(403).json({ error: "Deposits are restricted for this account" });
    }

    const newTransaction: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      accountId,
      description,
      amount: Number(amount),
      date: new Date().toISOString(),
      category: category || 'Other',
      type: Number(amount) >= 0 ? 'credit' : 'debit',
      status: (status as any) || 'completed'
    };

    transactions.unshift(newTransaction);
    account.balance += Number(amount);
    res.status(201).json(newTransaction);
  });

  // Admin: Add Bill
  app.post("/api/admin/bills", (req, res) => {
    const { name, amount, dueDate, category, accountId } = req.body;
    const newBill: Bill = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      amount: Number(amount),
      dueDate,
      category,
      status: 'unpaid',
      accountId
    };
    bills.unshift(newBill);
    res.status(201).json(newBill);
  });

  app.post("/api/transfers", (req, res) => {
    const { fromId, toId, amount, description } = req.body;
    const fromAcc = accounts.find(a => a.id === fromId);
    const toAcc = accounts.find(a => a.id === toId);

    if (fromAcc?.status === 'disabled' || toAcc?.status === 'disabled') {
       return res.status(403).json({ error: "Transfer failed: One or more accounts are disabled" });
    }

    if (toAcc?.depositRestricted) {
      return res.status(403).json({ error: "Transfer failed: Recipient account has deposit restrictions" });
    }
    
    // Simulating a transfer to another account or external
    if (fromAcc && fromAcc.balance >= amount) {
      fromAcc.balance -= amount;
      
      const newTx: Transaction = {
        id: `t${Date.now()}`,
        accountId: fromId,
        date: new Date().toISOString(),
        amount: -amount,
        description: description || `Transfer to ${toId}`,
        category: 'Transfer',
        type: 'debit',
        status: 'completed'
      };
      transactions.unshift(newTx);
      
      // If internal transfer
      const toAcc = accounts.find(a => a.id === toId);
      if (toAcc) {
        toAcc.balance += amount;
        transactions.unshift({
          ...newTx,
          id: `t${Date.now() + 1}`,
          accountId: toId,
          amount: amount,
          type: 'credit',
          status: 'completed'
        });
      }
      
      res.json({ success: true, fromAcc });
    } else {
      res.status(400).json({ error: "Insufficient funds" });
    }
  });

  app.post("/api/bills/pay", (req, res) => {
    const { billId, accountId } = req.body;
    const bill = bills.find(b => b.id === billId);
    const account = accounts.find(a => a.id === accountId);

    if (account?.status === 'disabled') {
      return res.status(403).json({ error: "Cannot pay bills from a disabled account" });
    }

    if (bill && account && account.balance >= bill.amount) {
      account.balance -= bill.amount;
      bill.status = 'paid';
      
      transactions.unshift({
        id: `t${Date.now()}`,
        accountId: accountId,
        date: new Date().toISOString(),
        amount: -bill.amount,
        description: `Bill Pay: ${bill.name}`,
        category: bill.category,
        type: 'debit',
        status: 'completed'
      });
      
      res.json({ success: true, bill, account });
    } else {
      res.status(400).json({ error: "Could not process bill payment" });
    }
  });

  app.post("/api/ai/advisor", async (req, res) => {
    try {
      const { prompt, history } = req.body;
      
      // Contextual data
      const context = `
        User Accounts: ${JSON.stringify(accounts)}
        Recent Transactions: ${JSON.stringify(transactions.slice(0, 10))}
        Upcoming Bills: ${JSON.stringify(bills.filter(b => b.status === 'unpaid'))}
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          systemInstruction: `You are the Executive AI Advisor for NEW AGE OF AMERICA. 
          Use the following context to provide personalized, professional financial advice to our elite clientele. 
          Keep responses concise, authoritative, and helpful. 
          Context: ${context}`
        }
      });

      res.json({ text: response.text });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "AI Assistant unavailable" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
