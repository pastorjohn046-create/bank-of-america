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
  photoURL?: string;
  password?: string; // Adding for mock login validation
  depositDetails?: {
    paypal?: string;
    cashapp?: string;
    zelle?: string;
    bitcoin?: string;
    bankInfo?: string;
  };
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
  status: 'completed' | 'pending' | 'rejected';
  toAccountId?: string; // For tracking transfers
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

let genAIClient: GoogleGenAI | null = null;
function getGenAI() {
  if (!genAIClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("GEMINI_API_KEY is missing. AI features will be disabled.");
    }
    genAIClient = new GoogleGenAI({
      apiKey: key || "dummy-key",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return genAIClient;
}

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

  // Request logger
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  // Health check
  app.get("/api/health", (req, res) => res.json({ status: "ok" }));

  // AUTH API
  app.post("/api/auth/signup", (req, res) => {
    const { email, password, name, ssn, phone } = req.body;
    if (users.find(u => u.email === email)) {
      return res.status(400).json({ error: "User already exists" });
    }
    const newUser: User = {
      uid: Math.random().toString(36).substr(2, 9),
      email,
      password, // Storing for mock validation
      displayName: name || email.split('@')[0],
      role: email === 'pastorjohn046@gmail.com' ? 'admin' : 'user',
      ssn,
      phone,
      photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`
    };
    users.push(newUser);
    res.json({ user: newUser });
  });

  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email);
    if (!user || (user.password && user.password !== password)) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    res.json({ user });
  });

  app.post("/api/auth/update-profile", (req, res) => {
    const { uid, displayName, photoURL, phone } = req.body;
    const user = users.find(u => u.uid === uid);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (displayName) user.displayName = displayName;
    if (photoURL) user.photoURL = photoURL;
    if (phone) user.phone = phone;

    res.json({ user });
  });

  app.post("/api/auth/reset-password", (req, res) => {
    const { email, newPassword } = req.body;
    const user = users.find(u => u.email === email);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.password = newPassword;
    res.json({ success: true });
  });

  // DEPOSIT DETAILS
  app.get("/api/users/:uid/deposit-details", (req, res) => {
    const { uid } = req.params;
    const user = users.find(u => u.uid === uid);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user.depositDetails || {});
  });

  app.post("/api/admin/users/:uid/deposit-details", (req, res) => {
    const { uid } = req.params;
    const { paypal, cashapp, zelle, bitcoin, bankInfo } = req.body;
    const user = users.find(u => u.uid === uid);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.depositDetails = {
      paypal,
      cashapp,
      zelle,
      bitcoin,
      bankInfo
    };

    adminLogs.unshift({
      id: Math.random().toString(36).substr(2, 9),
      msg: `Updated deposit details for user ${user.displayName}`,
      time: new Date().toLocaleTimeString()
    });

    res.json(user.depositDetails);
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
    const pendingTransactions = transactions.filter(t => t.status === 'pending').length;
    const totalCredit = accounts.reduce((acc, a) => acc + (a.creditLimit || 0), 0);
    
    res.json({
      totalDeposits,
      totalTransactions,
      pendingBills,
      pendingTransactions,
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

  // Admin: Approve/Reject Transaction
  app.post("/api/admin/transactions/:id/approve", (req, res) => {
    const { id } = req.params;
    const tx = transactions.find(t => t.id === id);
    if (!tx) return res.status(404).json({ error: "Transaction not found" });
    if (tx.status !== 'pending') return res.status(400).json({ error: "Transaction already processed" });

    const account = accounts.find(a => a.id === tx.accountId);
    if (!account) return res.status(404).json({ error: "Account not found" });

    tx.status = 'completed';
    
    // If it was a credit, we update balance now.
    // If it was a debit, balance was already decremented at initiation to "hold" funds.
    if (tx.type === 'credit') {
      account.balance += tx.amount;
    }

    // Handle the other side of a persistent internal transfer if exists
    if (tx.toAccountId) {
      const toAcc = accounts.find(a => a.id === tx.toAccountId);
      if (toAcc) {
          // This logic is simplified: for transfers, we usually have two transactions.
          // The 'credit' transaction for the recipient would also be pending.
          // We need to find its pair.
          const pair = transactions.find(t => t.accountId === tx.toAccountId && t.amount === Math.abs(tx.amount) && t.status === 'pending');
          if (pair) {
            pair.status = 'completed';
            toAcc.balance += pair.amount;
          }
      }
    }

    adminLogs.unshift({
      id: Math.random().toString(36).substr(2, 9),
      msg: `Approved transaction ${tx.id} for ${account.name}`,
      time: new Date().toLocaleTimeString()
    });

    res.json({ success: true, transaction: tx });
  });

  app.post("/api/admin/transactions/:id/reject", (req, res) => {
    const { id } = req.params;
    const tx = transactions.find(t => t.id === id);
    if (!tx) return res.status(404).json({ error: "Transaction not found" });
    if (tx.status !== 'pending') return res.status(400).json({ error: "Transaction already processed" });

    const account = accounts.find(a => a.id === tx.accountId);
    if (!account) return res.status(404).json({ error: "Account not found" });

    tx.status = 'rejected';

    // If it was a debit, we need to refund the held balance
    if (tx.type === 'debit') {
      account.balance += Math.abs(tx.amount);
    }

    // Handle pair
    if (tx.toAccountId) {
      const pair = transactions.find(t => t.accountId === tx.toAccountId && t.amount === Math.abs(tx.amount) && t.status === 'pending');
      if (pair) pair.status = 'rejected';
    }

    adminLogs.unshift({
      id: Math.random().toString(36).substr(2, 9),
      msg: `Rejected transaction ${tx.id} for ${account.name}`,
      time: new Date().toLocaleTimeString()
    });

    res.json({ success: true, transaction: tx });
  });

  app.post("/api/transfers", (req, res) => {
    const { fromId, toId, amount, description } = req.body;
    const fromAcc = accounts.find(a => a.id === fromId);
    const toAcc = accounts.find(a => a.id === toId);

    if (fromAcc?.status === 'disabled' || (toAcc && toAcc.status === 'disabled')) {
       return res.status(403).json({ error: "Transfer failed: One or more accounts are disabled" });
    }

    if (toAcc?.depositRestricted) {
      return res.status(403).json({ error: "Transfer failed: Recipient account has deposit restrictions" });
    }
    
    if (fromAcc && fromAcc.balance >= amount) {
      // Hold funds immediately
      fromAcc.balance -= amount;
      
      const newTx: Transaction = {
        id: `t${Date.now()}`,
        accountId: fromId,
        date: new Date().toISOString(),
        amount: -amount,
        description: description || `Transfer Request to ${toId}`,
        category: 'Transfer',
        type: 'debit',
        status: 'pending',
        toAccountId: toId
      };
      transactions.unshift(newTx);
      
      // If internal transfer, create a pending credit for recipient
      if (toAcc) {
        transactions.unshift({
          id: `t${Date.now() + 1}`,
          accountId: toId,
          date: new Date().toISOString(),
          amount: amount,
          description: `Incoming Transfer Request from ${fromAcc.name}`,
          category: 'Transfer',
          type: 'credit',
          status: 'pending'
        });
      }
      
      adminLogs.unshift({
        id: Math.random().toString(36).substr(2, 9),
        msg: `New Pending Transfer from ${fromAcc.name} to ${toId}`,
        time: new Date().toLocaleTimeString()
      });

      res.json({ success: true, transaction: newTx });
    } else {
      res.status(400).json({ error: "Insufficient funds" });
    }
  });

  app.post("/api/deposits", (req, res) => {
    const { accountId, amount, description } = req.body;
    const account = accounts.find(a => a.id === accountId);
    if (!account) return res.status(404).json({ error: "Account not found" });

    const newTx: Transaction = {
      id: `t${Date.now()}`,
      accountId,
      date: new Date().toISOString(),
      amount: amount,
      description: description || 'Digital Asset Deposit Request',
      category: 'Deposit',
      type: 'credit',
      status: 'pending'
    };
    transactions.unshift(newTx);

    adminLogs.unshift({
      id: Math.random().toString(36).substr(2, 9),
      msg: `New Pending Deposit from user ${account.userId} to ${account.name}`,
      time: new Date().toLocaleTimeString()
    });

    res.status(201).json(newTx);
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
      bill.status = 'pending' as any; // Temporary pending status for the bill too? Or just paid.
      
      const newTx: Transaction = {
        id: `t${Date.now()}`,
        accountId: accountId,
        date: new Date().toISOString(),
        amount: -bill.amount,
        description: `Pending Bill Pay: ${bill.name}`,
        category: bill.category,
        type: 'debit',
        status: 'pending'
      };
      transactions.unshift(newTx);

      adminLogs.unshift({
        id: Math.random().toString(36).substr(2, 9),
        msg: `New Pending Bill Payment from ${account.name} for ${bill.name}`,
        time: new Date().toLocaleTimeString()
      });
      
      res.json({ success: true, transaction: newTx });
    } else {
      res.status(400).json({ error: "Could not process bill payment" });
    }
  });

  app.post("/api/ai/advisor", async (req, res) => {
    try {
      const { prompt } = req.body;
      const key = process.env.GEMINI_API_KEY;
      if (!key) return res.status(503).json({ error: "AI Assistant unavailable: Missing API Key" });
      
      // Contextual data
      const context = `
        User Accounts: ${JSON.stringify(accounts)}
        Recent Transactions: ${JSON.stringify(transactions.slice(0, 10))}
        Upcoming Bills: ${JSON.stringify(bills.filter(b => b.status === 'unpaid'))}
      `;

      const response = await getGenAI().models.generateContent({
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
      console.error("AI Error:", error);
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

  try {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (listenError) {
    console.error("Server failed to listen on port:", listenError);
  }
}

startServer().catch(err => {
  console.error("Fatal server startup error:", err);
});
