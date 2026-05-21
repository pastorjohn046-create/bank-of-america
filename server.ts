import express from "express";
import path from "path";
import fs from "fs";
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

interface SupportMessage {
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

interface Bill {
  id: string;
  name: string;
  dueDate: string;
  amount: number;
  status: 'paid' | 'unpaid';
  category: string;
  accountId?: string;
}

interface VaultItem {
  id: string;
  userId: string;
  name: string;
  size: string;
  type: string;
  uploadDate: string;
  expiryDate: string;
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
  { uid: 'user_1', email: 'pastorjohn046@gmail.com', displayName: 'John Pastor', role: 'admin', password: '123456789' },
  { uid: 'user_2', email: 'sarah.jenkins@newage.com', displayName: 'Sarah Jenkins', role: 'user' },
  { uid: 'user_3', email: 'david.smith@newage.com', displayName: 'David Smith', role: 'user' }
];

let accounts: Account[] = [
  { id: '1', userId: 'user_1', type: 'checking', number: '**** 4291', balance: 12450.75, currency: 'USD', name: 'John Pastor (Checking)', creditLimit: 2000, status: 'active', depositRestricted: false },
  { id: '2', userId: 'user_1', type: 'savings', number: '**** 8820', balance: 45200.00, currency: 'USD', name: 'John Pastor (Savings)', creditLimit: 5000, status: 'active', depositRestricted: false },
  { id: '3', userId: 'user_2', type: 'checking', number: '**** 3314', balance: 8430.20, currency: 'USD', name: 'Sarah Jenkins', creditLimit: 10000, status: 'active', depositRestricted: false },
  { id: '4', userId: 'user_3', type: 'savings', number: '**** 1234', balance: 3200.50, currency: 'USD', name: 'David Smith', creditLimit: 1500, status: 'active', depositRestricted: false }
];

let transactions: Transaction[] = [
  { id: 't_pending_1', accountId: '1', date: new Date(Date.now() - 45 * 60000).toISOString(), amount: 6500.00, description: 'Digital Asset Liquid Deposit (BTC-920)', category: 'Deposit', type: 'credit', status: 'pending' },
  { id: 't_pending_2', accountId: '1', date: new Date(Date.now() - 120 * 60000).toISOString(), amount: -4500.00, description: 'Wire Transfer to Sarah Jenkins', category: 'Transfer', type: 'debit', status: 'pending', toAccountId: '3' },
  { id: 't_pending_3', accountId: '3', date: new Date(Date.now() - 120 * 60000).toISOString(), amount: 4500.00, description: 'Incoming Transfer Request from John Pastor (Checking)', category: 'Transfer', type: 'credit', status: 'pending' },
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

let adminLogs: AdminLog[] = process.env.NODE_ENV === "production" ? [] : [
  { id: '1', msg: 'Core System Initialized', time: new Date().toLocaleTimeString() },
  { id: '2', msg: 'Executive Channel Security active', time: new Date().toLocaleTimeString() }
];

let vaultItems: VaultItem[] = [
  {
    id: 'v1',
    userId: 'user_1',
    name: 'Executive_ID_Verification.pdf',
    size: '1.4 MB',
    type: 'application/pdf',
    uploadDate: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    expiryDate: new Date(Date.now() + 28 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'v2',
    userId: 'user_1',
    name: 'Offshore_Tax_Declaration_2026.pdf',
    size: '3.1 MB',
    type: 'application/pdf',
    uploadDate: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    expiryDate: new Date(Date.now() + 25 * 24 * 3600 * 1000).toISOString()
  }
];

let supportMessages: SupportMessage[] = [
  {
    id: 'msg_1',
    userId: 'user_1',
    userName: 'John Pastor',
    subject: 'Credit Line Increment Request',
    text: 'Hello, I have deposited significant digital assets recently. I would like to request an upgrade to my Credit Overdraft limit to $250,000 for upcoming trade ventures.',
    date: new Date(Date.now() - 3 * 3600000).toISOString(),
    status: 'open',
    replies: [
      {
        id: 'reply_1',
        sender: 'admin',
        senderName: 'System Specialist',
        text: 'Welcome John. Our automated risk parameters are currently evaluating your collateral reserves. Please keep your account premium status active.',
        date: new Date(Date.now() - 2.5 * 3600000).toISOString()
      }
    ]
  },
  {
    id: 'msg_2',
    userId: 'user_2',
    userName: 'Sarah Jenkins',
    subject: 'International Asset Transfer Hold',
    text: 'My offshore transfer of $45,000 has been marked as pending verification for 4 hours. Can an admin force clear this transfer?',
    date: new Date(Date.now() - 5 * 3600000).toISOString(),
    status: 'open',
    replies: []
  }
];

interface BankCard {
  id: string;
  userId: string;
  cardholderName: string;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardType: 'Visa' | 'Mastercard' | 'AMEX' | 'Discover';
  themeColor: string;
  status: 'active' | 'suspended';
}

let bankCards: BankCard[] = [
  {
    id: "c1",
    userId: "user_1",
    cardholderName: "John Pastor",
    cardNumber: "4111 2222 3333 4444",
    expiryDate: "12/28",
    cvv: "123",
    cardType: "Visa",
    themeColor: "from-slate-800 to-slate-950",
    status: "active"
  },
  {
    id: "c2",
    userId: "user_1",
    cardholderName: "John Pastor",
    cardNumber: "5555 4444 3333 2222",
    expiryDate: "06/29",
    cvv: "987",
    cardType: "Mastercard",
    themeColor: "from-blue-600 to-indigo-900",
    status: "active"
  }
];

const DB_FILE_PATH = path.join(process.cwd(), "db_persisted.json");

function saveDb() {
  try {
    const data = {
      users,
      accounts,
      transactions,
      bills,
      adminLogs,
      vaultItems,
      supportMessages,
      bankCards
    };
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("Error saving database to persistence store:", err);
  }
}

function loadDb() {
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const content = fs.readFileSync(DB_FILE_PATH, "utf8");
      if (content.trim()) {
        const data = JSON.parse(content);
        if (data.users) users = data.users;
        if (data.accounts) accounts = data.accounts;
        if (data.transactions) transactions = data.transactions;
        if (data.bills) bills = data.bills;
        if (data.adminLogs) adminLogs = data.adminLogs;
        if (data.vaultItems) vaultItems = data.vaultItems;
        if (data.supportMessages) supportMessages = data.supportMessages;
        if (data.bankCards) bankCards = data.bankCards;
        console.log("Database state restored successfully from file storage.");
      }
    }
    
    // Ensure admin user password is set to 123456789
    const adminUser = users.find(u => u.email === 'pastorjohn046@gmail.com');
    if (adminUser) {
      adminUser.password = '123456789';
    } else {
      users.push({
        uid: 'user_1',
        email: 'pastorjohn046@gmail.com',
        displayName: 'John Pastor',
        role: 'admin',
        password: '123456789'
      });
    }
    saveDb();
  } catch (err) {
    console.error("Error loading database from file: falling back to memory defaults.", err);
  }
}

async function startServer() {
  loadDb();
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Auto-save DB on successful mutations (non-GET requests)
  app.use((req, res, next) => {
    if (req.method !== 'GET') {
      res.on('finish', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          saveDb();
        }
      });
    }
    next();
  });

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
      uid: "user_" + Math.random().toString(36).substr(2, 9),
      email,
      password, // Storing for mock validation
      displayName: name || email.split('@')[0],
      role: email === 'pastorjohn046@gmail.com' ? 'admin' : 'user',
      ssn,
      phone,
      photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`
    };
    users.push(newUser);

    // Auto-allocate primary Checking & Savings asset wallets
    const checkingId = "acc_" + Math.random().toString(36).substr(2, 9);
    const savingsId = "acc_" + Math.random().toString(36).substr(2, 9);
    
    accounts.push({
      id: checkingId,
      userId: newUser.uid,
      type: 'checking',
      number: '**** ' + Math.floor(1000 + Math.random() * 9000),
      balance: 15420.00, // starting check balance to look realistic
      currency: 'USD',
      name: `${newUser.displayName} (Checking)`,
      creditLimit: 5000,
      status: 'active',
      depositRestricted: false
    });

    accounts.push({
      id: savingsId,
      userId: newUser.uid,
      type: 'savings',
      number: '**** ' + Math.floor(1000 + Math.random() * 9000),
      balance: 45000.00, // starting savings balance to look realistic
      currency: 'USD',
      name: `${newUser.displayName} (Savings)`,
      creditLimit: 15000,
      status: 'active',
      depositRestricted: false
    });

    // Auto-allocate default secure Bank Cards with genuine card numbers for new account creation
    const visaCardNo = `4111 ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)}`;
    const masterCardNo = `5555 ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)}`;

    bankCards.push({
      id: "c_" + Math.random().toString(36).substr(2, 9),
      userId: newUser.uid,
      cardholderName: newUser.displayName,
      cardNumber: visaCardNo,
      expiryDate: "12/29",
      cvv: String(Math.floor(100 + Math.random() * 900)),
      cardType: "Visa",
      themeColor: "from-slate-800 to-slate-950",
      status: "active"
    });

    bankCards.push({
      id: "c_" + Math.random().toString(36).substr(2, 9),
      userId: newUser.uid,
      cardholderName: newUser.displayName,
      cardNumber: masterCardNo,
      expiryDate: "06/30",
      cvv: String(Math.floor(100 + Math.random() * 900)),
      cardType: "Mastercard",
      themeColor: "from-blue-600 to-indigo-900",
      status: "active"
    });

    adminLogs.unshift({
      id: Math.random().toString(36).substr(2, 9),
      msg: `Auto-initialized checkings/savings portfolios & linked funding cards for registered user: ${newUser.displayName}`,
      time: new Date().toLocaleTimeString()
    });

    res.json({ user: newUser });
  });

  // Admin Manual User Insertion Endpoint
  app.post("/api/admin/users", (req, res) => {
    const { email, password, displayName, role, ssn, phone, photoURL } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required to insert client" });
    }
    if (users.find(u => u.email === email)) {
      return res.status(400).json({ error: "An entity with this email already exists" });
    }
    const newUser: User = {
      uid: "user_" + Math.random().toString(36).substr(2, 9),
      email,
      password: password || "password123",
      displayName: displayName || email.split('@')[0],
      role: role || 'user',
      ssn: ssn || '',
      phone: phone || '',
      photoURL: photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`
    };
    users.push(newUser);

    // Auto-create standard checking & savings for custom inserted users
    const checkingId = "acc_" + Math.random().toString(36).substr(2, 9);
    const savingsId = "acc_" + Math.random().toString(36).substr(2, 9);
    
    accounts.push({
      id: checkingId,
      userId: newUser.uid,
      type: 'checking',
      number: '**** ' + Math.floor(1000 + Math.random() * 9000),
      balance: 5000.00,
      currency: 'USD',
      name: `${newUser.displayName} (Checking)`,
      creditLimit: 2500,
      status: 'active',
      depositRestricted: false
    });

    accounts.push({
      id: savingsId,
      userId: newUser.uid,
      type: 'savings',
      number: '**** ' + Math.floor(1000 + Math.random() * 9000),
      balance: 12000.00,
      currency: 'USD',
      name: `${newUser.displayName} (Savings)`,
      creditLimit: 5000,
      status: 'active',
      depositRestricted: false
    });

    // Auto-allocate default secure Bank Cards with genuine card numbers for new manually created account
    const visaCardNo = `4111 ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)}`;
    const masterCardNo = `5555 ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)}`;

    bankCards.push({
      id: "c_" + Math.random().toString(36).substr(2, 9),
      userId: newUser.uid,
      cardholderName: newUser.displayName,
      cardNumber: visaCardNo,
      expiryDate: "12/29",
      cvv: String(Math.floor(100 + Math.random() * 900)),
      cardType: "Visa",
      themeColor: "from-slate-800 to-slate-950",
      status: "active"
    });

    bankCards.push({
      id: "c_" + Math.random().toString(36).substr(2, 9),
      userId: newUser.uid,
      cardholderName: newUser.displayName,
      cardNumber: masterCardNo,
      expiryDate: "06/30",
      cvv: String(Math.floor(100 + Math.random() * 900)),
      cardType: "Mastercard",
      themeColor: "from-blue-600 to-indigo-900",
      status: "active"
    });

    adminLogs.unshift({
      id: Math.random().toString(36).substr(2, 9),
      msg: `Admin manually inserted user ${newUser.displayName} into secure database and provisioned assets & cards`,
      time: new Date().toLocaleTimeString()
    });

    res.status(201).json({ user: newUser });
  });

  // Admin User Profile Modification Endpoint
  app.patch("/api/admin/users/:uid", (req, res) => {
    const { uid } = req.params;
    const { email, password, displayName, role, ssn, phone, photoURL } = req.body;
    const user = users.find(u => u.uid === uid);
    if (!user) {
      return res.status(404).json({ error: "Target client entity not found" });
    }

    if (email !== undefined) user.email = email;
    if (password !== undefined) user.password = password;
    if (displayName !== undefined) user.displayName = displayName;
    if (role !== undefined) user.role = role;
    if (ssn !== undefined) user.ssn = ssn;
    if (phone !== undefined) user.phone = phone;
    if (photoURL !== undefined) user.photoURL = photoURL;

    adminLogs.unshift({
      id: Math.random().toString(36).substr(2, 9),
      msg: `Admin manually updated credentials, profile, & security parameters for ${user.displayName}`,
      time: new Date().toLocaleTimeString()
    });

    res.json({ user });
  });

  // Admin Custom Portfolio/Account Injection Endpoint
  app.post("/api/admin/accounts", (req, res) => {
    const { userId, name, balance, type, currency, creditLimit, status, depositRestricted } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "UserId parameter is required to initialize ledger" });
    }
    const user = users.find(u => u.uid === userId);
    if (!user) {
      return res.status(404).json({ error: "Assigned target client not found" });
    }

    const newAcc: Account = {
      id: "acc_" + Math.random().toString(36).substr(2, 9),
      userId,
      name: name || `${user.displayName} (${type || 'checking'})`,
      balance: Number(balance || 0),
      type: type || 'checking',
      currency: currency || 'USD',
      number: '**** ' + Math.floor(1000 + Math.random() * 9000),
      creditLimit: Number(creditLimit || 5000),
      status: status || 'active',
      depositRestricted: !!depositRestricted
    };

    accounts.push(newAcc);

    // Auto-generate also a physical card with full card number corresponding to checking or credit ledger types
    const cardBrand = type === 'checking' ? 'Visa' : 'Mastercard';
    const cardColor = type === 'checking' ? "from-emerald-600 to-teal-900" : "from-purple-700 to-fuchsia-950";
    const generatedCardNo = `${cardBrand === 'Visa' ? '4111' : '5555'} ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)}`;
    
    bankCards.push({
      id: "c_" + Math.random().toString(36).substr(2, 9),
      userId,
      cardholderName: user.displayName,
      cardNumber: generatedCardNo,
      expiryDate: "12/29",
      cvv: String(Math.floor(100 + Math.random() * 900)),
      cardType: cardBrand,
      themeColor: cardColor,
      status: "active"
    });

    adminLogs.unshift({
      id: Math.random().toString(36).substr(2, 9),
      msg: `Admin provisioned new custom ${newAcc.type} ledger and linked standard ${cardBrand} debit/credit instrument for ${user.displayName}`,
      time: new Date().toLocaleTimeString()
    });

    res.status(201).json(newAcc);
  });

  // Admin User Deletion Endpoint
  app.delete("/api/admin/users/:uid", (req, res) => {
    const { uid } = req.params;
    const userIndex = users.findIndex(u => u.uid === uid);
    if (userIndex === -1) {
      return res.status(404).json({ error: "Client entity not found in safe registry" });
    }

    const userName = users[userIndex].displayName;

    // Filter out accounts associated with the user
    const userAccs = accounts.filter(a => a.userId === uid);
    const userAccIds = userAccs.map(a => a.id);

    // Delete associated transactions, accounts, supportMessages, and vaultItems
    transactions = transactions.filter(t => !userAccIds.includes(t.accountId) && !(t.toAccountId && userAccIds.includes(t.toAccountId)));
    accounts = accounts.filter(a => a.userId !== uid);
    vaultItems = vaultItems.filter(v => v.userId !== uid);
    supportMessages = supportMessages.filter(m => m.userId !== uid);
    
    // Delete user from registry
    users.splice(userIndex, 1);

    adminLogs.unshift({
      id: Math.random().toString(36).substr(2, 9),
      msg: `Admin permanently purged registered client "${userName}" and all associated account ledgers`,
      time: new Date().toLocaleTimeString()
    });

    res.json({ success: true, message: `Successfully deleted user ${userName} and associated ledgers` });
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
  app.get("/api/accounts", (req, res) => {
    const { userId } = req.query;
    if (userId && userId !== 'undefined' && userId !== '') {
      return res.json(accounts.filter(a => a.userId === userId));
    }
    res.json(accounts);
  });
  app.get("/api/admin/users", (req, res) => res.json(users));
  
  app.get("/api/transactions", (req, res) => {
    const { accountId, userId } = req.query;
    if (accountId) {
      return res.json(transactions.filter(t => t.accountId === accountId as string));
    }
    if (userId && userId !== 'undefined' && userId !== '') {
      const userAccounts = accounts.filter(a => a.userId === userId).map(a => a.id);
      return res.json(transactions.filter(t => userAccounts.includes(t.accountId)));
    }
    res.json(transactions);
  });

  app.get("/api/bills", (req, res) => res.json(bills));

  app.get("/api/admin/metrics", (req, res) => {
    const totalDeposits = accounts.reduce((acc, a) => acc + a.balance, 0);
    const totalTransactions = transactions.length;
    const pendingBills = bills.filter(b => b.status === 'unpaid').length;
    const pendingTransactions = transactions.filter(t => t.status === 'pending' && !t.description.startsWith('Incoming Transfer Request')).length;
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
    const { accountId, description, amount, category, status, date } = req.body;
    const account = accounts.find(a => a.id === accountId);
    if (!account) return res.status(404).json({ error: "Account not found" });

    if (account.status === 'disabled') {
      return res.status(403).json({ error: "Cannot add transaction to a disabled account" });
    }

    if (amount > 0 && account.depositRestricted) {
      return res.status(403).json({ error: "Deposits are restricted for this account" });
    }

    const txStatus = (status as any) || 'completed';
    const txDate = date ? new Date(date).toISOString() : new Date().toISOString();

    const newTransaction: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      accountId,
      description,
      amount: Number(amount),
      date: txDate,
      category: category || 'Other',
      type: Number(amount) >= 0 ? 'credit' : 'debit',
      status: txStatus
    };

    transactions.unshift(newTransaction);
    
    // Adjust balance immediately if completed OR if it is a pending debit (held funds)
    if (txStatus === 'completed' || (txStatus === 'pending' && Number(amount) < 0)) {
      account.balance += Number(amount);
    }
    
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

    // Update bill status if this was a bill payment
    if (tx.description && tx.description.startsWith("Pending Bill Pay: ")) {
      const billName = tx.description.replace("Pending Bill Pay: ", "");
      const bill = bills.find(b => b.name === billName && b.status === "pending" as any);
      if (bill) {
        bill.status = 'paid';
      }
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

    // Revert bill status to unpaid if this was a bill payment
    if (tx.description && tx.description.startsWith("Pending Bill Pay: ")) {
      const billName = tx.description.replace("Pending Bill Pay: ", "");
      const bill = bills.find(b => b.name === billName && (b.status === "pending" as any || b.status === "paid"));
      if (bill) {
        bill.status = 'unpaid';
      }
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
    const { billId, accountId, cardId } = req.body;
    const bill = bills.find(b => b.id === billId);

    if (cardId) {
      const card = bankCards.find(c => c.id === cardId);
      if (!card) {
        return res.status(404).json({ error: "Linked bank card not found" });
      }
      if (card.status === 'suspended') {
        return res.status(403).json({ error: "This card is suspended and cannot process transactions" });
      }
      if (bill) {
        bill.status = 'paid';
        
        // Find user checking or primary account to attach transaction record to
        const checkingAcc = accounts.find(a => a.userId === card.userId && a.type === 'checking') || 
                            accounts.find(a => a.userId === card.userId) || 
                            accounts[0];
        
        const newTx: Transaction = {
          id: `t${Date.now()}`,
          accountId: checkingAcc ? checkingAcc.id : '1',
          date: new Date().toISOString(),
          amount: -bill.amount,
          description: `Card Pay (**** ${card.cardNumber.slice(-4)}): ${bill.name}`,
          category: bill.category,
          type: 'debit',
          status: 'completed'
        };
        transactions.unshift(newTx);
        
        adminLogs.unshift({
          id: Math.random().toString(36).substr(2, 9),
          msg: `Bill payment completed via Card ${card.cardType} ****${card.cardNumber.slice(-4)} for ${bill.name} ($${bill.amount})`,
          time: new Date().toLocaleTimeString()
        });

        return res.json({ success: true, transaction: newTx });
      }
    }

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

  // Support Messaging Endpoints
  // 1. Get all messages (Admin view)
  app.get("/api/admin/messages", (req, res) => {
    res.json(supportMessages);
  });

  // 2. Get messages for a user
  app.get("/api/users/:uid/messages", (req, res) => {
    const { uid } = req.params;
    res.json(supportMessages.filter(m => m.userId === uid));
  });

  // 3. Create a message from user
  app.post("/api/messages", (req, res) => {
    const { userId, userName, subject, text } = req.body;
    if (!userId || !text) {
      return res.status(400).json({ error: "Missing required message parameters" });
    }
    const newMessage: SupportMessage = {
      id: `msg_${Date.now()}`,
      userId,
      userName: userName || "Valued Client",
      subject: subject || "Secure Correspondence",
      text,
      date: new Date().toISOString(),
      replies: [],
      status: 'open'
    };
    supportMessages.unshift(newMessage);

    adminLogs.unshift({
      id: Math.random().toString(36).substr(2, 9),
      msg: `New SC Support Message from ${newMessage.userName}: ${newMessage.subject}`,
      time: new Date().toLocaleTimeString()
    });

    res.status(201).json(newMessage);
  });

  // 4. Add reply to message
  app.post("/api/messages/:id/reply", (req, res) => {
    const { id } = req.params;
    const { sender, senderName, text } = req.body;
    const msg = supportMessages.find(m => m.id === id);
    if (!msg) {
      return res.status(404).json({ error: "Message thread not found" });
    }
    if (!text) {
      return res.status(400).json({ error: "Reply text is required" });
    }

    const newReply = {
      id: `rep_${Date.now()}`,
      sender: sender || 'user',
      senderName: senderName || (sender === 'admin' ? 'System Admin' : 'Client'),
      text,
      date: new Date().toISOString()
    };
    msg.replies.push(newReply);

    // Auto update status on user reply
    if (sender === 'user') {
      msg.status = 'open';
    }

    res.status(201).json(newReply);
  });

  // 5. Toggle Resolve/Open state of a message
  app.post("/api/messages/:id/toggle-resolve", (req, res) => {
    const { id } = req.params;
    const msg = supportMessages.find(m => m.id === id);
    if (!msg) return res.status(404).json({ error: "Message thread not found" });

    msg.status = msg.status === 'open' ? 'resolved' : 'open';
    
    adminLogs.unshift({
      id: Math.random().toString(36).substr(2, 9),
      msg: `SC Message ${msg.id} status toggled to ${msg.status}`,
      time: new Date().toLocaleTimeString()
    });

    res.json({ success: true, status: msg.status });
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

  // 30-Day Storage Vault API
  app.get("/api/vault", (req, res) => {
    const { userId } = req.query;
    if (userId) {
      return res.json(vaultItems.filter(v => v.userId === userId));
    }
    res.json(vaultItems);
  });

  app.post("/api/vault", (req, res) => {
    const { userId, name, size, type } = req.body;
    if (!userId || !name) {
      return res.status(400).json({ error: "Missing required vault parameters" });
    }
    const newItem: VaultItem = {
      id: `v_${Date.now()}`,
      userId,
      name,
      size: size || "1.0 MB",
      type: type || "application/pdf",
      uploadDate: new Date().toISOString(),
      expiryDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString() // Exact 30 days storage
    };
    vaultItems.unshift(newItem);

    adminLogs.unshift({
      id: Math.random().toString(36).substr(2, 9),
      msg: `New document secured in 30-Day Storage Vault: ${name} (${size})`,
      time: new Date().toLocaleTimeString()
    });

    res.status(201).json(newItem);
  });

  app.delete("/api/vault/:id", (req, res) => {
    const { id } = req.params;
    const index = vaultItems.findIndex(v => v.id === id);
    if (index === -1) {
      return res.status(404).json({ error: "Vault item not found" });
    }
    const deleted = vaultItems.splice(index, 1)[0];

    adminLogs.unshift({
      id: Math.random().toString(36).substr(2, 9),
      msg: `Document purged/withdrawn from 30-Day Vault: ${deleted.name}`,
      time: new Date().toLocaleTimeString()
    });

    res.json({ success: true, deleted });
  });

  // Bank Cards API Endpoints
  app.get("/api/cards", (req, res) => {
    const { userId } = req.query;
    if (userId) {
      return res.json(bankCards.filter(c => c.userId === userId));
    }
    res.json(bankCards);
  });

  app.post("/api/cards", (req, res) => {
    const { userId, cardholderName, cardNumber, expiryDate, cvv, cardType, themeColor } = req.body;
    
    if (!userId || !cardholderName || !cardNumber || !expiryDate || !cvv) {
      return res.status(400).json({ error: "Missing required bank card parameters" });
    }

    const newCard: BankCard = {
      id: `c_${Date.now()}`,
      userId,
      cardholderName,
      cardNumber,
      expiryDate,
      cvv,
      cardType: cardType || 'Visa',
      themeColor: themeColor || 'from-slate-800 to-slate-950',
      status: 'active'
    };

    bankCards.push(newCard);

    adminLogs.unshift({
      id: Math.random().toString(36).substr(2, 9),
      msg: `Linked new ${newCard.cardType} bank card (ending in ${cardNumber.slice(-4)}) for user ${userId}`,
      time: new Date().toLocaleTimeString()
    });

    res.status(201).json(newCard);
  });

  app.delete("/api/cards/:id", (req, res) => {
    const { id } = req.params;
    const index = bankCards.findIndex(c => c.id === id);
    if (index === -1) {
      return res.status(404).json({ error: "Bank card not found" });
    }
    const deleted = bankCards.splice(index, 1)[0];

    adminLogs.unshift({
      id: Math.random().toString(36).substr(2, 9),
      msg: `Unlinked bank card (ending in ${deleted.cardNumber.slice(-4)}) for user ${deleted.userId}`,
      time: new Date().toLocaleTimeString()
    });

    res.json({ success: true, deleted });
  });

  // Global Error Handler to return JSON instead of HTML
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Express Error Handler caught:", err);
    res.status(err.status || 500).json({
      error: err.message || "Internal Server Error",
      stack: process.env.NODE_ENV !== "production" ? err.stack : undefined
    });
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

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception thrown:", error);
});
