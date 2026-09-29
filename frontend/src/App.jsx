import React, { useState, useMemo, useEffect } from 'react';
import {
  LayoutDashboard,
  QrCode,
  Receipt,
  Package,
  Truck,
  Wallet,
  Users,
  Building2,
  AlertTriangle,
  CheckCircle,
  Plus,
  Search,
  Printer,
  Smartphone,
  CreditCard,
  Banknote,
  ArrowUpRight,
  Send,
  UserCheck,
  UserPlus,
  X,
  Store,
  LogIn,
  LogOut,
  Lock,
  Mail,
  BarChart3,
  Calendar,
  FileText,
  TrendingUp,
  Edit3,
  Trash2,
  ArrowUpDown,
  SlidersHorizontal,
  PauseCircle,
  PlayCircle,
  Clock,
  Layers,
  Download,
  Upload,
  FileSpreadsheet,
  Award,
  Coins,
  Share2,
  Eye,
  ShoppingBag,
  AlertOctagon,
  RotateCcw,
  Sparkles,
  Trophy,
  ArrowDownLeft,
  ShieldCheck,
  History,
  Landmark,
  DollarSign,
  Server,
  Wifi,
  Database,
  ArrowRight,
  Phone,
  MapPin,
  Check,
  Briefcase
} from 'lucide-react';
import api, { API_ENABLED, portalForRoles } from './api';
import rawProducts60 from './products60.json';
import seedData1Year from './seedData1Year.json';

// Helper: calculate days remaining until expiry
export const calculateDaysToExpiry = (expiryDateStr) => {
  if (!expiryDateStr) return 999;
  try {
    const exp = new Date(expiryDateStr);
    exp.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = exp.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } catch {
    return 999;
  }
};

// -------------------------------------------------------------
// 60 DAILY ESSENTIAL KIRANA & RETAIL INVENTORY PRODUCTS
// -------------------------------------------------------------
const RAW_INITIAL_PRODUCTS = rawProducts60.map((p, idx) => ({
  id: idx + 1,
  ...p,
  batches: [
    { id: 100 + idx + 1, batchNo: `BAT-${p.sku || 'ITEM'}-${100 + idx + 1}`, quantity: p.quantity, purchasePrice: p.purchasePrice, expiryDate: p.expiryDate }
  ]
}));

export const INITIAL_60_PRODUCTS = RAW_INITIAL_PRODUCTS.map(p => ({
  ...p,
  daysToExpiry: calculateDaysToExpiry(p.expiryDate)
}));
export const INITIAL_30_PRODUCTS = INITIAL_60_PRODUCTS;

export default function App() {
  // -------------------------------------------------------------
  // CLOUD BACKEND CONNECTIVITY & SYNC STATE
  // -------------------------------------------------------------
  const [backendStatus, setBackendStatus] = useState('checking'); // 'connected' | 'offline' | 'local'
  const [backendDetails, setBackendDetails] = useState(null);

  // Heartbeat check for live Spring Boot + PostgreSQL backend
  useEffect(() => {
    let isMounted = true;
    async function checkCloudBackend() {
      if (!API_ENABLED) {
        if (isMounted) setBackendStatus('local');
        return;
      }
      try {
        const res = await api.checkHealth();
        if (isMounted) {
          if (res.connected) {
            setBackendStatus('connected');
            setBackendDetails(res.data);
          } else {
            setBackendStatus('offline');
          }
        }
      } catch (e) {
        if (isMounted) setBackendStatus('offline');
      }
    }

    checkCloudBackend();
    // Poll less often once connected; retry sooner while a free-tier server is waking up
    const interval = setInterval(checkCloudBackend, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // -------------------------------------------------------------
  // AUTHENTICATION & VIEW ROUTING STATE
  // -------------------------------------------------------------
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [viewMode, setViewMode] = useState('landing'); // 'landing' | 'login' | 'register'

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Registered Business Owners List (Persisted in localStorage)
  const [registeredOwners, setRegisteredOwners] = useState(() => {
    try {
      const saved = localStorage.getItem('bizsmart_registered_owners');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse saved owners', e);
    }
    return [
      {
        id: 1,
        name: 'Damani Retails Owner',
        email: 'damani@gmail.com',
        password: 'password123',
        storeName: 'Damani Retails',
        category: 'Kirana & Supermarket',
        tagline: 'Quality Groceries & Daily Needs',
        address: 'Shop 12-14, Main Market, Sector 15, New Delhi',
        gstin: '07AABCS1429B1Z8',
        phone: '+91-98100-22334'
      }
    ];
  });

  // Owner Registration Form State (Exclusive for Business Owners)
  const [ownerRegisterForm, setOwnerRegisterForm] = useState({
    ownerName: '',
    email: '',
    password: '',
    confirmPassword: '',
    storeName: '',
    category: 'Kirana & Supermarket',
    tagline: '',
    address: '',
    gstin: '',
    phone: ''
  });
  const [registerError, setRegisterError] = useState('');
  const [authBusy, setAuthBusy] = useState(false);

  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState('dashboard');

  // Business Profile (Active Store - Persisted in localStorage)
  const [business, setBusiness] = useState(() => {
    try {
      const saved = localStorage.getItem('bizsmart_active_store');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse active store', e);
    }
    return {
      name: "Damani Retails",
      tagline: "Quality Groceries & Daily Needs",
      address: "Shop 12-14, Main Market, Sector 15, New Delhi",
      gstin: "07AABCS1429B1Z8",
      phone: "+91-98100-22334"
    };
  });

  // -------------------------------------------------------------
  // PRODUCTS / INVENTORY (30 Initial Retail Products Pre-Loaded)
  // -------------------------------------------------------------
  const [products, setProducts] = useState(INITIAL_30_PRODUCTS);

  // -------------------------------------------------------------
  // INVENTORY FILTERING & SORTING STATE
  // -------------------------------------------------------------
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState('all');
  const [inventoryExpiryFilter, setInventoryExpiryFilter] = useState('all'); // 'all' | 'near-30' | 'near-60' | 'near-90' | 'expired'
  const [inventoryStockFilter, setInventoryStockFilter] = useState('all'); // 'all' | 'low'
  const [inventorySortBy, setInventorySortBy] = useState('expiry-asc'); // 'expiry-asc' | 'expiry-desc' | 'stock-asc' | 'stock-desc' | 'name-asc' | 'price-asc' | 'price-desc'

  // -------------------------------------------------------------
  // EMPLOYEES STATE (Managed exclusively by Store Owner)
  // -------------------------------------------------------------
  const [employees, setEmployees] = useState(() => {
    try {
      const saved = localStorage.getItem('bizsmart_employees');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse employees', e);
    }
    return [
      { id: 1, name: 'Ajay Sharma', role: 'Cashier & POS Operator', phone: '+91-98122-33445', email: 'ajaysharma@gmail.com', password: 'password123', salary: 25000, shift: 'Morning (8 AM - 4 PM)', status: 'ACTIVE', joinedDate: 'Today' }
    ];
  });

  // Persist registered owners, employees, and active store
  useEffect(() => {
    try {
      localStorage.setItem('bizsmart_registered_owners', JSON.stringify(registeredOwners));
    } catch (e) {
      console.warn('Failed to persist owners', e);
    }
  }, [registeredOwners]);

  useEffect(() => {
    try {
      localStorage.setItem('bizsmart_employees', JSON.stringify(employees));
    } catch (e) {
      console.warn('Failed to persist employees', e);
    }
  }, [employees]);

  useEffect(() => {
    try {
      localStorage.setItem('bizsmart_active_store', JSON.stringify(business));
    } catch (e) {
      console.warn('Failed to persist active store', e);
    }
  }, [business]);

  // -------------------------------------------------------------
  // SUPPLIERS STATE (Wholesale suppliers directory)
  // -------------------------------------------------------------
  const [suppliers, setSuppliers] = useState([
    { id: 1, name: 'ITC Consumer Goods Distribution', contact: 'Sunil Kumar', phone: '+91-98200-11223', email: 'supplier@itc.in', dues: 0, activeOrders: 0, address: 'Okhla Phase III, Delhi' },
    { id: 2, name: 'Tata Consumer Products Hub', contact: 'Ramesh Patel', phone: '+91-98211-44556', email: 'tata@supply.in', dues: 0, activeOrders: 0, address: 'Sector 18, Gurugram' },
    { id: 3, name: 'Amul Dairy Federation Depot', contact: 'Dinesh Rawat', phone: '+91-98100-99887', email: 'amul@depot.in', dues: 0, activeOrders: 0, address: 'Patparganj Industrial Area' },
    { id: 4, name: 'Adani Wilmar Supply Hub', contact: 'Vikas Gupta', phone: '+91-98999-33221', email: 'adani@wilmar.in', dues: 0, activeOrders: 0, address: 'Transport Nagar, Delhi' },
    { id: 5, name: 'Hindustan Unilever FMCG Depot', contact: 'Rajesh Nair', phone: '+91-98333-77889', email: 'hul@wholesale.in', dues: 0, activeOrders: 0, address: 'Naraina Industrial Area, Delhi' },
    { id: 6, name: 'Nestle Regional Agency', contact: 'Pooja Mishra', phone: '+91-98111-88990', email: 'nestle@agency.in', dues: 0, activeOrders: 0, address: 'Mayapuri Phase 1, Delhi' },
    { id: 7, name: 'Britannia Distribution Hub', contact: 'Sanjay Singhal', phone: '+91-98222-33445', email: 'britannia@hub.in', dues: 0, activeOrders: 0, address: 'Lawrence Road, Delhi' },
    { id: 8, name: 'Parle Products Wholesale', contact: 'Manoj Tiwari', phone: '+91-98990-44556', email: 'parle@wholesale.in', dues: 0, activeOrders: 0, address: 'Kirti Nagar, Delhi' }
  ]);

  // -------------------------------------------------------------
  // PLATFORM STORES (Default ₹0 GMV)
  // -------------------------------------------------------------
  const [platformStores, setPlatformStores] = useState([
    { id: 1, name: 'New Business Retail Store', owner: 'Rajesh Sharma', city: 'Delhi', phone: '+91-98100-22334', gmv: '₹0', skus: products.length, status: 'ACTIVE' }
  ]);

  // -------------------------------------------------------------
  // CUSTOMERS & KHATA (Default ₹0 balance)
  // -------------------------------------------------------------
  // CUSTOMERS & KHATA (With Loyalty Points & Lifetime Spend)
  // -------------------------------------------------------------
  const [customers, setCustomers] = useState([
    { id: 1, name: 'Walk-in Retail Customer', phone: '+91-98000-00000', balance: 0, limit: 5000, city: 'Local Area', lastBillDate: '-', loyaltyPoints: 40, totalVisits: 2, lifetimeSpent: 4000 },
    { id: 2, name: 'Rahul Sharma (Regular Shopper)', phone: '+91-98111-22334', balance: 0, limit: 10000, city: 'Block B, Sector 15', lastBillDate: 'Yesterday', loyaltyPoints: 125, totalVisits: 6, lifetimeSpent: 12500 }
  ]);

  // -------------------------------------------------------------
  // PURCHASE ORDERS (Wholesale PO Tracking)
  // -------------------------------------------------------------
  const [purchaseOrders, setPurchaseOrders] = useState([]);

  // -------------------------------------------------------------
  // EXPENSES (Default empty / ₹0 for new business)
  // -------------------------------------------------------------
  const [expenses, setExpenses] = useState(() => {
    try {
      const saved = localStorage.getItem('bizsmart_expenses_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse expenses', e);
    }
    return seedData1Year.expenses || [];
  });

  // -------------------------------------------------------------
  // BILLS / TRANSACTIONS HISTORY (Default empty / ₹0)
  // -------------------------------------------------------------
  const [bills, setBills] = useState(() => {
    try {
      const saved = localStorage.getItem('bizsmart_bills_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse bills', e);
    }
    return seedData1Year.bills || [];
  });

  // -------------------------------------------------------------
  // POS & BILLING CART (With Queue Buster Hold & Loyalty Points)
  // -------------------------------------------------------------
  const [selectedCustomerId, setSelectedCustomerId] = useState(1);
  const [cart, setCart] = useState([]);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [paymentMode, setPaymentMode] = useState('UPI'); // 'UPI' | 'CASH' | 'SPLIT' | 'CREDIT'
  const [splitCashAmount, setSplitCashAmount] = useState('');
  const [splitUpiAmount, setSplitUpiAmount] = useState('');
  const [tenderCashGiven, setTenderCashGiven] = useState('');
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [lastGeneratedBill, setLastGeneratedBill] = useState(null);

  // 1. Hold / Park Cart State
  const [heldCarts, setHeldCarts] = useState([]);
  const [showHeldCartsModal, setShowHeldCartsModal] = useState(false);

  // 2. Loyalty Points Redemption State
  const [redeemLoyaltyPoints, setRedeemLoyaltyPoints] = useState(false);

  // 3. Batch Tracking (FIFO) State
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [selectedProductForBatch, setSelectedProductForBatch] = useState(null);
  const [newBatchForm, setNewBatchForm] = useState({
    batchNo: '',
    quantity: '',
    purchasePrice: '',
    expiryDate: '',
    mfgDate: ''
  });

  // 4. Auto-Draft Purchase Order State
  const [showAutoPoModal, setShowAutoPoModal] = useState(false);
  const [autoPoData, setAutoPoData] = useState(null);

  // 5. Stock Wastage & Spoilage Tracking State
  const [wastageEntries, setWastageEntries] = useState([]);
  const [showWastageModal, setShowWastageModal] = useState(false);
  const [selectedProductForWastage, setSelectedProductForWastage] = useState(null);
  const [wastageForm, setWastageForm] = useState({
    quantity: '1',
    reason: 'Expired Shelf Life',
    notes: ''
  });

  // 6. Customer Purchase History State
  const [showCustomerHistoryModal, setShowCustomerHistoryModal] = useState(false);
  const [selectedCustomerForHistory, setSelectedCustomerForHistory] = useState(null);

  // -------------------------------------------------------------
  // 7. CASH DRAWER & SHIFT RECONCILER STATE (Hisab-Kitab)
  // -------------------------------------------------------------
  const [activeShift, setActiveShift] = useState({
    id: 'SHIFT-101',
    cashierId: 1,
    cashierName: 'Ajay Sharma',
    shiftName: 'Morning Shift (8 AM - 4 PM)',
    startTime: '08:00 AM',
    startDate: new Date().toISOString().slice(0, 10),
    openingFloat: 2000,
    status: 'OPEN' // 'OPEN' | 'CLOSED'
  });

  const [cashDrops, setCashDrops] = useState([]);
  const [closedShifts, setClosedShifts] = useState([]);

  // Drawer Modals State
  const [showOpeningFloatModal, setShowOpeningFloatModal] = useState(false);
  const [tempOpeningFloat, setTempOpeningFloat] = useState('2000');

  const [showCashDropModal, setShowCashDropModal] = useState(false);
  const [cashDropForm, setCashDropForm] = useState({
    type: 'CASH_OUT', // 'CASH_OUT' | 'CASH_IN'
    amount: '',
    reason: 'Vendor Payout (Milk/Bread)',
    notes: ''
  });

  const [showCloseShiftModal, setShowCloseShiftModal] = useState(false);
  const [physicalCashCounted, setPhysicalCashCounted] = useState('');
  const [denominations, setDenominations] = useState({
    500: '',
    200: '',
    100: '',
    50: '',
    20: '',
    10: ''
  });
  const [shiftClosingNotes, setShiftClosingNotes] = useState('');
  const [showShiftAuditModal, setShowShiftAuditModal] = useState(false);
  const [selectedShiftForAudit, setSelectedShiftForAudit] = useState(null);

  // Employee Counter stats
  const [employeeStats, setEmployeeStats] = useState({
    todayBills: 0,
    counterSales: 0,
    cashCollected: 0,
    upiCollected: 0,
    activeShift: 'Morning Shift (8 AM - 4 PM)'
  });

  // -------------------------------------------------------------
  // SALES ANALYTICS STATE (Weekly, Monthly, Specific Period, Yearly)
  // -------------------------------------------------------------
  const [analyticsPeriod, setAnalyticsPeriod] = useState('weekly'); // 'weekly' | 'monthly' | 'custom' | 'yearly'
  const [analyticsStartDate, setAnalyticsStartDate] = useState(
    new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [analyticsEndDate, setAnalyticsEndDate] = useState(
    new Date().toISOString().slice(0, 10)
  );

  // -------------------------------------------------------------
  // EXPENSES & PROFIT DATE FILTERING STATE
  // -------------------------------------------------------------
  const [expenseFilterMode, setExpenseFilterMode] = useState('all'); // 'all' | 'today' | 'month' | 'custom'
  const [expenseStartDate, setExpenseStartDate] = useState(
    new Date().toISOString().slice(0, 7) + '-01'
  );
  const [expenseEndDate, setExpenseEndDate] = useState(
    new Date().toISOString().slice(0, 10)
  );

  // -------------------------------------------------------------
  // MODALS STATE
  // -------------------------------------------------------------
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'Staples & Grains',
    sku: '',
    purchasePrice: '',
    sellingPrice: '',
    quantity: '',
    minStock: '10',
    supplier: 'ITC Consumer Goods Distribution',
    expiryDate: '2027-03-31',
    batchNo: ''
  });

  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    role: 'Cashier & POS Operator',
    phone: '',
    email: '',
    password: '',
    salary: '22000',
    shift: 'Morning (8 AM - 4 PM)'
  });

  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    contact: '',
    phone: '',
    address: '',
    dues: '0'
  });

  // Modal: Add Expense (Nice Box with Title, Category, Date calendar, Amount, Note)
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [newExpense, setNewExpense] = useState({
    title: '',
    category: 'Shop Floor Rent',
    date: new Date().toISOString().slice(0, 10),
    amount: '',
    notes: ''
  });

  // Modal: Edit Note for Existing Expense
  const [showEditExpenseNoteModal, setShowEditExpenseNoteModal] = useState(false);
  const [selectedExpenseForNote, setSelectedExpenseForNote] = useState(null);
  const [expenseNoteText, setExpenseNoteText] = useState('');

  // Modal: Add Customer (Clean Tailwind Modal)
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    limit: '5000',
    city: 'Delhi NCR'
  });

  // Modal: Receive Khata Payment (Clean Tailwind Modal)
  const [showKhataPaymentModal, setShowKhataPaymentModal] = useState(false);
  const [selectedKhataCustomer, setSelectedKhataCustomer] = useState(null);
  const [khataPaymentAmount, setKhataPaymentAmount] = useState('');
  const [khataPaymentMode, setKhataPaymentMode] = useState('UPI');
  const [khataPaymentNote, setKhataPaymentNote] = useState('');

  // -------------------------------------------------------------
  // OWNER REGISTRATION HANDLER (Exclusive for Store Owners)
  // -------------------------------------------------------------
  const handleOwnerRegister = async (e) => {
    e.preventDefault();
    setRegisterError('');
    if (authBusy) return;

    const cleanEmail = ownerRegisterForm.email.trim().toLowerCase();
    const cleanPassword = ownerRegisterForm.password.trim();

    if (!ownerRegisterForm.ownerName.trim()) {
      setRegisterError('Please enter the business owner full name.');
      return;
    }
    if (!cleanEmail) {
      setRegisterError('Please enter a valid email address.');
      return;
    }
    if (cleanPassword.length < 6) {
      setRegisterError('Password must be at least 6 characters long.');
      return;
    }
    if (cleanPassword !== ownerRegisterForm.confirmPassword.trim()) {
      setRegisterError('Passwords do not match. Please re-enter.');
      return;
    }
    if (!ownerRegisterForm.storeName.trim()) {
      setRegisterError('Please enter your store / business name.');
      return;
    }

    // With a backend, the server account is the source of truth for credentials
    if (API_ENABLED) {
      setAuthBusy(true);
      try {
        await api.register({
          email: cleanEmail,
          password: cleanPassword,
          fullName: ownerRegisterForm.ownerName.trim(),
          phone: ownerRegisterForm.phone.trim() || undefined
        });
        await api.login(cleanEmail, cleanPassword);
        await loadCloudData();
      } catch (err) {
        setRegisterError(err.message || 'Registration failed. Please try again.');
        setAuthBusy(false);
        return;
      }
      setAuthBusy(false);
    }

    // Check if email already registered (offline demo mode)
    if (!API_ENABLED && registeredOwners.some(o => o.email.toLowerCase() === cleanEmail)) {
      setRegisterError('An owner account with this email already exists. Please sign in instead.');
      return;
    }
    if (employees.some(emp => emp.email.toLowerCase() === cleanEmail)) {
      setRegisterError('This email is already registered as an employee. Store owners must use their own unique email.');
      return;
    }

    const newOwnerProfile = {
      id: Date.now(),
      name: ownerRegisterForm.ownerName.trim(),
      email: cleanEmail,
      // Passwords are only kept in the browser in offline demo mode; the server stores a hash otherwise
      password: API_ENABLED ? undefined : cleanPassword,
      storeName: ownerRegisterForm.storeName.trim(),
      category: ownerRegisterForm.category || 'Retail Store',
      tagline: ownerRegisterForm.tagline.trim() || `${ownerRegisterForm.category || 'Retail'} • Daily Essentials`,
      address: ownerRegisterForm.address.trim() || 'Main Market Store Location',
      gstin: ownerRegisterForm.gstin.trim() || 'UNREGISTERED',
      phone: ownerRegisterForm.phone.trim() || '+91-98100-00000'
    };

    const newStoreObj = {
      name: newOwnerProfile.storeName,
      tagline: newOwnerProfile.tagline,
      address: newOwnerProfile.address,
      gstin: newOwnerProfile.gstin,
      phone: newOwnerProfile.phone
    };

    // Save owner and active store
    setRegisteredOwners(prev => [...prev, newOwnerProfile]);
    setBusiness(newStoreObj);

    // Register on multi-store platform directory
    setPlatformStores(prev => [
      {
        id: Date.now(),
        name: newOwnerProfile.storeName,
        owner: newOwnerProfile.name,
        city: newOwnerProfile.address.split(',').pop()?.trim() || 'India',
        phone: newOwnerProfile.phone,
        gmv: '₹0'
      },
      ...prev
    ]);

    // Automatically authenticate the owner and route directly to their Owner Dashboard
    setCurrentUser({
      email: cleanEmail,
      name: `${newOwnerProfile.name} (Owner)`,
      role: 'OWNER',
      roleTitle: 'Store Owner'
    });
    setIsAuthenticated(true);
    setActiveTab('dashboard'); // Takes owner directly to their store dashboard!
    setViewMode('landing');
    setOwnerRegisterForm({
      ownerName: '',
      email: '',
      password: '',
      confirmPassword: '',
      storeName: '',
      category: 'Kirana & Supermarket',
      tagline: '',
      address: '',
      gstin: '',
      phone: ''
    });
  };

  // -------------------------------------------------------------
  // CLOUD SYNC HELPERS
  // -------------------------------------------------------------
  // Loads server data after sign-in. Staff-only endpoints that are forbidden for a role are skipped.
  async function loadCloudData() {
    const [remoteProducts, remoteCustomers] = await Promise.allSettled([api.getProducts(), api.getCustomers()]);
    if (remoteProducts.status === 'fulfilled' && remoteProducts.value.length > 0) {
      setProducts(remoteProducts.value);
    }
    if (remoteCustomers.status === 'fulfilled' && remoteCustomers.value.length > 0) {
      setCustomers(remoteCustomers.value);
    }
  }

  function notifySyncError(context, err) {
    console.warn(`${context}:`, err?.message);
    if (err?.status === 401) {
      alert('Your session has expired. Please sign in again.');
      handleSignOut();
    } else if (err?.status && err.status !== 0) {
      alert(`${context}: ${err.message}`);
    }
  }

  // -------------------------------------------------------------
  // LOGIN / ROLE AUTHENTICATION HANDLER
  // -------------------------------------------------------------
  const handleLogin = async (e) => {
    e.preventDefault();
    const cleanEmail = loginEmail.trim().toLowerCase();
    const cleanPassword = loginPassword.trim();

    if (!cleanEmail) {
      setLoginError('Please enter your email ID');
      return;
    }
    if (!cleanPassword) {
      setLoginError('Please enter your password');
      return;
    }

    // Backend configured: the server decides who you are. No local fallback.
    if (API_ENABLED) {
      if (authBusy) return;
      setAuthBusy(true);
      setLoginError('');
      try {
        const session = await api.login(cleanEmail, cleanPassword);
        const portal = portalForRoles(session.roles || []);
        const ownerProfile = registeredOwners.find(o => o.email.toLowerCase() === (session.email || '').toLowerCase());
        if (ownerProfile && portal.role === 'OWNER') {
          setBusiness({
            name: ownerProfile.storeName || business.name,
            tagline: ownerProfile.tagline || business.tagline,
            address: ownerProfile.address || business.address,
            gstin: ownerProfile.gstin || business.gstin,
            phone: ownerProfile.phone || business.phone
          });
        }
        setCurrentUser({
          email: session.email,
          name: `${session.fullName || session.username} (${portal.roleTitle})`,
          role: portal.role,
          roleTitle: portal.roleTitle
        });
        setIsAuthenticated(true);
        setActiveTab(portal.tab);
        await loadCloudData();
      } catch (err) {
        setLoginError(err.status === 401
          ? 'Incorrect email or password.'
          : (err.message || 'Could not reach the server. Please retry in a moment.'));
      } finally {
        setAuthBusy(false);
      }
      return;
    }

    // 1. Check Registered Owners First
    const ownerMatch = registeredOwners.find(o => o.email.toLowerCase() === cleanEmail);
    if (ownerMatch) {
      if (ownerMatch.password && ownerMatch.password !== cleanPassword) {
        setLoginError('Incorrect password for this Owner account. Please try again.');
        return;
      }
      // Load this owner's store profile
      setBusiness({
        name: ownerMatch.storeName || business.name,
        tagline: ownerMatch.tagline || business.tagline,
        address: ownerMatch.address || business.address,
        gstin: ownerMatch.gstin || business.gstin,
        phone: ownerMatch.phone || business.phone
      });
      setCurrentUser({
        email: ownerMatch.email,
        name: `${ownerMatch.name} (Owner)`,
        role: 'OWNER',
        roleTitle: 'Store Owner'
      });
      setIsAuthenticated(true);
      setActiveTab('dashboard'); // Opens Owner Dashboard
      setLoginError('');
      return;
    }

    // 2. Check Employees Added by Owner (Strict password check)
    const empMatch = employees.find(emp => emp.email && emp.email.toLowerCase() === cleanEmail);
    if (empMatch) {
      if (empMatch.password && empMatch.password !== cleanPassword) {
        setLoginError('Incorrect employee password. Please verify the password set by your Store Owner.');
        return;
      }
      setCurrentUser({
        email: empMatch.email,
        name: `${empMatch.name} (${empMatch.role || 'Staff'})`,
        role: 'EMPLOYEE',
        roleTitle: empMatch.role || 'Store Cashier'
      });
      setIsAuthenticated(true);
      setActiveTab('employee-dashboard'); // Opens dedicated Employee Interface!
      setLoginError('');
      return;
    }



    setLoginError('Unrecognized credentials. Store Owners can register their store on the registration page. Employees must be added by their Store Owner in the Owner Dashboard.');
  };

  const handleSignOut = () => {
    api.logout();
    setIsAuthenticated(false);
    setCurrentUser(null);
    setLoginEmail('');
    setLoginPassword('');
    setLoginError('');
    setViewMode('landing'); // Return to the Opening Page
  };

  // Clearance Promotional Markdown Trigger (15% Off Near-Expiry Stock)
  const handleApplyClearanceMarkdown = (productId, discountPct = 15) => {
    setProducts(prevProducts => prevProducts.map(p => {
      if (p.id === productId) {
        const discountedPrice = Math.max(1, Math.round(p.sellingPrice * (1 - discountPct / 100)));
        return {
          ...p,
          sellingPrice: discountedPrice,
          clearanceMarkdown: discountPct,
          originalPrice: p.originalPrice || p.sellingPrice
        };
      }
      return p;
    }));
  };

  const handleApplyClearanceMarkdownToAllNearExpiry = (discountPct = 15) => {
    const nearExpiryIds = new Set(
      products
        .filter(p => calculateDaysToExpiry(p.expiryDate) <= 15)
        .map(p => p.id)
    );
    if (nearExpiryIds.size === 0) {
      alert('No products currently expiring within 15 days.');
      return;
    }
    setProducts(prevProducts => prevProducts.map(p => {
      if (nearExpiryIds.has(p.id)) {
        const discountedPrice = Math.max(1, Math.round(p.sellingPrice * (1 - discountPct / 100)));
        return {
          ...p,
          sellingPrice: discountedPrice,
          clearanceMarkdown: discountPct,
          originalPrice: p.originalPrice || p.sellingPrice
        };
      }
      return p;
    }));
    alert(`Success: Applied ${discountPct}% clearance promotional markdown to ${nearExpiryIds.size} near-expiry items to prevent dead inventory!`);
  };

  // Cart operations
  // Cart operations (With Queue Buster Hold, Loyalty Points & FIFO)
  const currentCustomer = customers.find(c => c.id === Number(selectedCustomerId));
  const cartSubtotal = cart.reduce((acc, item) => acc + (item.product.sellingPrice * item.quantity), 0);
  const cartGst = Math.round(cartSubtotal * 0.05);
  const availableLoyaltyPoints = currentCustomer?.loyaltyPoints || 0;
  const loyaltyDiscount = redeemLoyaltyPoints && currentCustomer ? Math.min(availableLoyaltyPoints, cartSubtotal) : 0;
  const cartFinalTotal = Math.max(0, cartSubtotal + cartGst - discountAmount - loyaltyDiscount);
  const pointsEarnable = Math.floor(cartFinalTotal / 100);

  const addToCart = (product) => {
    const existing = cart.find(item => item.product.id === product.id);
    if (existing) {
      setCart(cart.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
  };

  const updateCartQty = (productId, delta) => {
    setCart(cart.map(item => {
      if (item.product.id === productId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean));
  };

  // 1. HOLD / PARK CART HANDLERS (Queue Buster)
  const handleHoldCart = () => {
    if (cart.length === 0) return;
    const cust = customers.find(c => c.id === Number(selectedCustomerId));
    const newHeld = {
      id: Date.now(),
      customerId: selectedCustomerId,
      customerName: cust ? cust.name : 'Walk-in Retail Customer',
      items: [...cart],
      discountAmount,
      redeemLoyaltyPoints,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      total: cartFinalTotal,
      itemsCount: cart.reduce((acc, it) => acc + it.quantity, 0)
    };
    setHeldCarts(prev => [newHeld, ...prev]);
    setCart([]);
    setDiscountAmount(0);
    setRedeemLoyaltyPoints(false);
    alert(`Cart for "${newHeld.customerName}" held! Counter is cleared for next customer.`);
  };

  const handleResumeCart = (heldCartId) => {
    const target = heldCarts.find(h => h.id === heldCartId);
    if (!target) return;
    if (cart.length > 0) {
      const confirmSwitch = window.confirm("You have active items in your current cart. Park current cart and resume this held cart?");
      if (!confirmSwitch) return;
      const cust = customers.find(c => c.id === Number(selectedCustomerId));
      const currentHeld = {
        id: Date.now(),
        customerId: selectedCustomerId,
        customerName: cust ? cust.name : 'Walk-in Retail Customer',
        items: [...cart],
        discountAmount,
        redeemLoyaltyPoints,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        total: cartFinalTotal,
        itemsCount: cart.reduce((acc, it) => acc + it.quantity, 0)
      };
      setHeldCarts(prev => [currentHeld, ...prev.filter(h => h.id !== heldCartId)]);
    } else {
      setHeldCarts(prev => prev.filter(h => h.id !== heldCartId));
    }
    setCart(target.items);
    setSelectedCustomerId(target.customerId);
    setDiscountAmount(target.discountAmount || 0);
    setRedeemLoyaltyPoints(target.redeemLoyaltyPoints || false);
    setShowHeldCartsModal(false);
  };

  const handleDiscardHeldCart = (heldCartId) => {
    if (window.confirm("Are you sure you want to discard this held cart?")) {
      setHeldCarts(prev => prev.filter(h => h.id !== heldCartId));
    }
  };

  // BILL GENERATION WITH FIFO BATCH DEDUCTION & LOYALTY POINTS
  const handleGenerateBill = () => {
    if (cart.length === 0) return;
    const cust = customers.find(c => c.id === Number(selectedCustomerId));
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    // Split Payment Calculations
    const finalCashPart = paymentMode === 'SPLIT'
      ? Math.min(cartFinalTotal, Number(splitCashAmount) || 0)
      : (paymentMode === 'CASH' ? cartFinalTotal : 0);
    const finalUpiPart = paymentMode === 'SPLIT'
      ? Math.max(0, cartFinalTotal - finalCashPart)
      : (paymentMode === 'UPI' ? cartFinalTotal : 0);
    const tenderGivenNum = Number(tenderCashGiven) || 0;
    const changeToReturn = (paymentMode === 'CASH' || paymentMode === 'SPLIT') && tenderGivenNum > finalCashPart
      ? tenderGivenNum - finalCashPart
      : 0;

    const bill = {
      id: Date.now(),
      billNo: `INV-${Date.now().toString().slice(-6)}`,
      date: `${dateStr} ${timeStr}`,
      dateStr: dateStr,
      timestamp: now.toISOString(),
      customer: cust || { name: 'Walk-in Retail Customer', phone: 'N/A', balance: 0 },
      items: [...cart],
      subtotal: cartSubtotal,
      gst: cartGst,
      discount: discountAmount,
      loyaltyDiscount: loyaltyDiscount,
      pointsEarned: pointsEarnable,
      pointsRedeemed: loyaltyDiscount,
      total: cartFinalTotal,
      paymentMode,
      splitCash: paymentMode === 'SPLIT' ? finalCashPart : 0,
      splitUpi: paymentMode === 'SPLIT' ? finalUpiPart : 0,
      tenderGiven: tenderGivenNum > 0 ? tenderGivenNum : finalCashPart,
      changeReturned: changeToReturn,
      cashier: currentUser ? currentUser.name : 'Ajay Sharma',
      shiftId: activeShift ? activeShift.id : 'SHIFT-101'
    };

    // FIFO BATCH DEDUCTION
    setProducts(products.map(p => {
      const cartItem = cart.find(ci => ci.product.id === p.id);
      if (!cartItem) return p;

      let remainingNeeded = cartItem.quantity;
      if (p.batches && p.batches.length > 0) {
        const sortedBatches = p.batches.slice().sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
        const updatedBatches = sortedBatches.map(b => {
          if (remainingNeeded <= 0) return b;
          if (b.quantity >= remainingNeeded) {
            const newQty = b.quantity - remainingNeeded;
            remainingNeeded = 0;
            return { ...b, quantity: newQty };
          } else {
            remainingNeeded -= b.quantity;
            return { ...b, quantity: 0 };
          }
        });
        const newTotalQty = updatedBatches.reduce((acc, b) => acc + b.quantity, 0);
        const activeBatches = updatedBatches.filter(b => b.quantity > 0);
        const earliestExp = activeBatches.length > 0 ? activeBatches[0].expiryDate : p.expiryDate;
        return {
          ...p,
          quantity: newTotalQty,
          batches: updatedBatches,
          expiryDate: earliestExp,
          daysToExpiry: calculateDaysToExpiry(earliestExp)
        };
      } else {
        return { ...p, quantity: Math.max(0, p.quantity - cartItem.quantity) };
      }
    }));

    // Customer balance & Loyalty Points accrual
    if (cust) {
      const newPoints = Math.max(0, (cust.loyaltyPoints || 0) - loyaltyDiscount + pointsEarnable);
      setCustomers(customers.map(c => {
        if (c.id === cust.id) {
          return {
            ...c,
            balance: paymentMode === 'CREDIT' ? c.balance + cartFinalTotal : c.balance,
            loyaltyPoints: newPoints,
            totalVisits: (c.totalVisits || 0) + 1,
            lifetimeSpent: (c.lifetimeSpent || 0) + cartFinalTotal,
            lastBillDate: 'Today'
          };
        }
        return c;
      }));
    }

    setEmployeeStats(prev => ({
      ...prev,
      todayBills: prev.todayBills + 1,
      counterSales: prev.counterSales + cartFinalTotal,
      cashCollected: paymentMode === 'CASH'
        ? prev.cashCollected + cartFinalTotal
        : (paymentMode === 'SPLIT' ? prev.cashCollected + finalCashPart : prev.cashCollected),
      upiCollected: paymentMode === 'UPI'
        ? prev.upiCollected + cartFinalTotal
        : (paymentMode === 'SPLIT' ? prev.upiCollected + finalUpiPart : prev.upiCollected)
    }));

    setBills(prev => [bill, ...prev]);
    setLastGeneratedBill(bill);
    setShowInvoiceModal(true);
    setCart([]);
    setDiscountAmount(0);
    setRedeemLoyaltyPoints(false);
    setSplitCashAmount('');
    setSplitUpiAmount('');
    setTenderCashGiven('');

    // Sync order to Cloud Database if connected
    if (API_ENABLED && isAuthenticated) {
      api.createOrder({
        billNo: bill.billNo,
        customerId: cust ? cust.id : undefined, // server falls back to the walk-in customer
        paymentMode: bill.paymentMode,
        status: 'DELIVERED', // counter sales are completed immediately
        items: bill.items.map(it => ({
          productId: it.product.id,
          quantity: it.quantity
        }))
      }).catch(e => notifySyncError('Sale saved locally but not synced to the server', e));
    }
  };

  const handleStockUpdate = (productId, delta) => {
    if (API_ENABLED && isAuthenticated) {
      api.adjustStock(productId, delta)
        .catch(e => notifySyncError('Stock change not synced to the server', e));
    }
    setProducts(products.map(p => {
      if (p.id === productId) {
        const newTotal = Math.max(0, p.quantity + delta);
        let updatedBatches = p.batches || [];
        if (updatedBatches.length > 0) {
          if (delta > 0) {
            // Add to latest batch
            updatedBatches = updatedBatches.map((b, idx) => idx === updatedBatches.length - 1 ? { ...b, quantity: b.quantity + delta } : b);
          } else {
            // Deduct from earliest batch (FIFO)
            let rem = Math.abs(delta);
            updatedBatches = updatedBatches.map(b => {
              if (rem <= 0) return b;
              if (b.quantity >= rem) {
                const n = b.quantity - rem;
                rem = 0;
                return { ...b, quantity: n };
              } else {
                rem -= b.quantity;
                return { ...b, quantity: 0 };
              }
            });
          }
        }
        return { ...p, quantity: newTotal, batches: updatedBatches };
      }
      return p;
    }));
  };

  const handleDeleteProduct = (productId) => {
    const prod = products.find(p => p.id === productId);
    const prodName = prod ? prod.name : 'this item';
    if (window.confirm(`Are you sure you want to remove "${prodName}" from inventory?`)) {
      if (API_ENABLED && isAuthenticated) {
        api.deleteProduct(productId)
          .then(() => {
            setProducts(prev => prev.filter(p => p.id !== productId));
            setCart(prev => prev.filter(item => item.product.id !== productId));
          })
          .catch(e => notifySyncError('Could not delete product', e));
        return;
      }
      setProducts(prev => prev.filter(p => p.id !== productId));
      setCart(prev => prev.filter(item => item.product.id !== productId));
    }
  };

  // -------------------------------------------------------------
  // OWNER ACTION HANDLERS
  // -------------------------------------------------------------
  const handleAddProductSubmit = (e) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.sellingPrice) return;
    const days = calculateDaysToExpiry(newProduct.expiryDate);
    const initialBatchNo = newProduct.batchNo?.trim() || `BAT-${Date.now().toString().slice(-4)}`;
    const initQty = Number(newProduct.quantity) || 0;
    const initPurchase = Number(newProduct.purchasePrice) || 0;

    const initialBatch = {
      id: Date.now() + 10,
      batchNo: initialBatchNo,
      quantity: initQty,
      purchasePrice: initPurchase,
      expiryDate: newProduct.expiryDate || '2027-03-31'
    };

    const p = {
      id: Date.now(),
      sku: newProduct.sku || `SKU-${Date.now().toString().slice(-4)}`,
      name: newProduct.name.trim(),
      category: newProduct.category,
      purchasePrice: initPurchase,
      sellingPrice: Number(newProduct.sellingPrice) || 0,
      quantity: initQty,
      minStock: Number(newProduct.minStock) || 10,
      supplier: newProduct.supplier || suppliers[0]?.name || 'ITC Consumer Goods Distribution',
      expiryDate: newProduct.expiryDate || '2027-03-31',
      daysToExpiry: days,
      batches: [initialBatch]
    };

    setProducts([p, ...products]);
    setShowAddProductModal(false);

    // Sync product to Cloud Database if connected
    if (API_ENABLED && isAuthenticated) {
      api.createProduct({
        name: p.name,
        sku: p.sku,
        categoryName: p.category,
        purchasePrice: p.purchasePrice,
        sellingPrice: p.sellingPrice,
        quantity: p.quantity,
        minStock: p.minStock,
        supplierName: p.supplier,
        expiryDate: p.expiryDate
      })
        .then(saved => setProducts(prev => prev.map(x => (x.id === p.id ? { ...x, id: saved.id, sku: saved.sku } : x))))
        .catch(e => notifySyncError('Product saved locally but not synced to the server', e));
    }

    setNewProduct({
      name: '',
      category: 'Staples & Grains',
      sku: '',
      purchasePrice: '',
      sellingPrice: '',
      quantity: '',
      minStock: '10',
      supplier: suppliers[0]?.name || 'ITC Consumer Goods Distribution',
      expiryDate: '2027-03-31',
      batchNo: ''
    });
    alert(`Success: Added item "${p.name}" with initial Batch #${initialBatch.batchNo} to inventory!`);
  };

  // 2. BATCH MANAGEMENT (FIFO) HANDLERS
  const handleOpenBatchModal = (product) => {
    setSelectedProductForBatch(product);
    setNewBatchForm({
      batchNo: `BAT-${Date.now().toString().slice(-4)}`,
      quantity: '20',
      purchasePrice: product.purchasePrice || '',
      expiryDate: new Date(Date.now() + 180 * 86400000).toISOString().slice(0, 10),
      mfgDate: new Date().toISOString().slice(0, 10)
    });
    setShowBatchModal(true);
  };

  const handleAddBatchSubmit = (e) => {
    e.preventDefault();
    if (!selectedProductForBatch || !newBatchForm.batchNo || !newBatchForm.quantity || !newBatchForm.expiryDate) return;
    const addedQty = Number(newBatchForm.quantity) || 0;
    const batch = {
      id: Date.now(),
      batchNo: newBatchForm.batchNo.trim(),
      quantity: addedQty,
      purchasePrice: Number(newBatchForm.purchasePrice) || selectedProductForBatch.purchasePrice || 0,
      expiryDate: newBatchForm.expiryDate,
      mfgDate: newBatchForm.mfgDate
    };

    setProducts(products.map(p => {
      if (p.id === selectedProductForBatch.id) {
        const existingBatches = p.batches || [];
        const updatedBatches = [...existingBatches, batch].sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
        const activeBatches = updatedBatches.filter(b => b.quantity > 0);
        const earliestExpiry = activeBatches.length > 0 ? activeBatches[0].expiryDate : p.expiryDate;
        return {
          ...p,
          quantity: p.quantity + addedQty,
          batches: updatedBatches,
          expiryDate: earliestExpiry,
          daysToExpiry: calculateDaysToExpiry(earliestExpiry)
        };
      }
      return p;
    }));

    setShowBatchModal(false);
    setSelectedProductForBatch(null);
    setNewBatchForm({ batchNo: '', quantity: '', purchasePrice: '', expiryDate: '', mfgDate: '' });
    alert(`Success: Registered Batch "${batch.batchNo}" (+${addedQty} units) under ${selectedProductForBatch.name}! FIFO priority updated.`);
  };

  // 3. AUTO-DRAFT PURCHASE ORDER HANDLERS
  const handleOpenAutoPo = (product) => {
    const linkedSupp = suppliers.find(s => s.name === product.supplier) || suppliers[0];
    const suggestedQty = Math.max(10, (product.minStock * 2) - product.quantity);
    const unitPrice = product.purchasePrice || Math.round(product.sellingPrice * 0.8);
    const totalVal = suggestedQty * unitPrice;
    setAutoPoData({
      id: `PO-${Date.now().toString().slice(-5)}`,
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      supplierName: linkedSupp.name,
      supplierContact: linkedSupp.contact,
      supplierPhone: linkedSupp.phone,
      supplierEmail: linkedSupp.email,
      reorderQty: suggestedQty,
      unitPrice,
      totalVal,
      expectedDelivery: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
      notes: `Urgent restocking: inventory reached ${product.quantity} units (minimum safety threshold is ${product.minStock} units).`
    });
    setShowAutoPoModal(true);
  };

  const handleSaveAutoPo = () => {
    if (!autoPoData) return;
    const newPO = {
      id: autoPoData.id,
      supplier: autoPoData.supplierName,
      items: `${autoPoData.productName} (${autoPoData.reorderQty} units)`,
      amount: autoPoData.totalVal,
      status: 'PENDING',
      paymentStatus: 'UNPAID',
      deliveryDate: autoPoData.expectedDelivery
    };
    setPurchaseOrders(prev => [newPO, ...prev]);
    setShowAutoPoModal(false);
    alert(`Purchase Order "${newPO.id}" has been drafted and added to wholesale ledger!`);
  };

  const handleWhatsAppAutoPo = () => {
    if (!autoPoData) return;
    const msg = `*PURCHASE ORDER: ${autoPoData.id}*\n*To:* ${autoPoData.supplierName} (Attn: ${autoPoData.supplierContact})\n*From:* ${business.name}\n----------------------------\nPlease process wholesale order for:\n📦 *Item:* ${autoPoData.productName} [${autoPoData.sku}]\n🔢 *Quantity:* ${autoPoData.reorderQty} units\n💰 *Est. Unit Cost:* ₹${autoPoData.unitPrice}\n💵 *Total Order Value:* ₹${autoPoData.totalVal.toLocaleString('en-IN')}\n📅 *Expected Delivery:* ${autoPoData.expectedDelivery}\n----------------------------\n*Note:* ${autoPoData.notes}\nKindly acknowledge receipt and confirm shipment dispatch.`;
    const cleanPhone = (autoPoData.supplierPhone || '').replace(/[^0-9]/g, '');
    const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
    handleSaveAutoPo();
  };

  // 4. STOCK WASTAGE & SPOILAGE HANDLERS
  const handleOpenWastage = (product) => {
    setSelectedProductForWastage(product);
    setWastageForm({
      quantity: '1',
      reason: 'Expired Shelf Life',
      notes: `Written off from current shelf stock of ${product.quantity} units.`
    });
    setShowWastageModal(true);
  };

  const handleSaveWastage = (e) => {
    e.preventDefault();
    if (!selectedProductForWastage) return;
    const qty = Math.min(selectedProductForWastage.quantity, Math.max(1, Number(wastageForm.quantity) || 1));
    const loss = qty * (selectedProductForWastage.purchasePrice || 0);
    const entry = {
      id: Date.now(),
      productId: selectedProductForWastage.id,
      productName: selectedProductForWastage.name,
      sku: selectedProductForWastage.sku,
      quantity: qty,
      purchaseCost: selectedProductForWastage.purchasePrice,
      lossAmount: loss,
      reason: wastageForm.reason,
      date: new Date().toISOString().slice(0, 10),
      notes: wastageForm.notes.trim()
    };

    // Deduct stock from product and its earliest batches
    setProducts(products.map(p => {
      if (p.id === selectedProductForWastage.id) {
        let rem = qty;
        const updatedBatches = (p.batches || []).slice().sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate)).map(b => {
          if (rem <= 0) return b;
          if (b.quantity >= rem) {
            const newQ = b.quantity - rem;
            rem = 0;
            return { ...b, quantity: newQ };
          } else {
            rem -= b.quantity;
            return { ...b, quantity: 0 };
          }
        });
        return {
          ...p,
          quantity: Math.max(0, p.quantity - qty),
          batches: updatedBatches
        };
      }
      return p;
    }));

    setWastageEntries(prev => [entry, ...prev]);
    setShowWastageModal(false);
    setSelectedProductForWastage(null);
    alert(`Logged wastage: ${qty} units of "${entry.productName}" written off (Loss: ₹${loss.toLocaleString('en-IN')}).`);
  };

  // 5. EXCEL / CSV BULK IMPORT & EXPORT HANDLERS
  const handleDownloadSampleCsv = () => {
    const csvContent = "data:text/csv;charset=utf-8," +
      "Name,Category,SKU,PurchasePrice,SellingPrice,Quantity,MinStock,Supplier,ExpiryDate,BatchNo\n" +
      "Aashirvaad Shudh Chakki Atta 10kg,Staples & Grains,GROC-ATTA-10K,380,430,40,10,ITC Consumer Goods Distribution,2027-03-31,BAT-ITC-101\n" +
      "Fortune Sunlite Refined Sunflower Oil 1L,Edible Oils & Ghee,GROC-OIL-1L,125,150,50,15,Adani Wilmar Supply Hub,2027-01-15,BAT-ADANI-204\n" +
      "Amul Taaza Toned Milk 1L,Dairy & Breakfast,GROC-MILK-1L,70,78,60,20,Amul Dairy Federation Depot,2026-10-15,BAT-AMUL-305\n" +
      "Tata Salt Vacuum Evaporated 1kg,Staples & Grains,GROC-SALT-1K,22,28,100,25,Tata Consumer Products Hub,2027-12-31,BAT-TATA-401\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "BizSmart_Sample_Product_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportInventoryCsv = () => {
    if (products.length === 0) {
      alert("No products in inventory to export!");
      return;
    }
    const headers = "Name,Category,SKU,PurchasePrice,SellingPrice,Quantity,MinStock,Supplier,ExpiryDate,BatchCount\n";
    const rows = products.map(p => {
      const cleanName = `"${(p.name || '').replace(/"/g, '""')}"`;
      const cleanSupplier = `"${(p.supplier || '').replace(/"/g, '""')}"`;
      return `${cleanName},${p.category},${p.sku},${p.purchasePrice},${p.sellingPrice},${p.quantity},${p.minStock},${cleanSupplier},${p.expiryDate},${p.batches?.length || 1}`;
    }).join("\n");
    const csvContent = "data:text/csv;charset=utf-8," + headers + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `BizSmart_Inventory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCsvFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result;
        if (!text) return;
        const lines = text.split(/\r\n|\n/).filter(line => line.trim().length > 0);
        if (lines.length <= 1) {
          alert("Uploaded CSV is empty or only contains headers.");
          return;
        }
        const newItems = [];
        for (let i = 1; i < lines.length; i++) {
          const row = lines[i].split(',');
          if (row.length < 5) continue;
          const name = row[0]?.replace(/^"|"$/g, '').trim();
          if (!name) continue;
          const category = row[1]?.trim() || 'Staples & Grains';
          const sku = row[2]?.trim() || `SKU-${Date.now().toString().slice(-4)}-${i}`;
          const purchasePrice = Number(row[3]) || 0;
          const sellingPrice = Number(row[4]) || 0;
          const quantity = Number(row[5]) || 0;
          const minStock = Number(row[6]) || 10;
          const supplier = row[7]?.replace(/^"|"$/g, '').trim() || suppliers[0]?.name || 'ITC Consumer Goods Distribution';
          const expiryDate = row[8]?.trim() || '2027-03-31';
          const batchNo = row[9]?.trim() || `BAT-IMP-${Date.now().toString().slice(-4)}-${i}`;

          const days = calculateDaysToExpiry(expiryDate);
          const item = {
            id: Date.now() + i,
            sku,
            name,
            category,
            purchasePrice,
            sellingPrice,
            quantity,
            minStock,
            supplier,
            expiryDate,
            daysToExpiry: days,
            batches: [
              {
                id: Date.now() + i + 500,
                batchNo,
                quantity,
                purchasePrice,
                expiryDate
              }
            ]
          };
          newItems.push(item);
        }

        if (newItems.length > 0) {
          setProducts(prev => [...newItems, ...prev]);
          alert(`Success: Imported ${newItems.length} products from CSV into Inventory!`);
        } else {
          alert("Could not parse valid products from the CSV file. Please check column format.");
        }
      } catch (err) {
        console.error(err);
        alert("Error parsing CSV file. Please use the downloadable template format.");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // 6. CUSTOMER PROFILE & PURCHASE HISTORY HANDLER
  const handleOpenCustomerHistory = (customer) => {
    setSelectedCustomerForHistory(customer);
    setShowCustomerHistoryModal(true);
  };

  // -------------------------------------------------------------
  // 7. CASH DRAWER & SHIFT RECONCILER COMPUTATIONS (Hisab-Kitab)
  // -------------------------------------------------------------
  const activeShiftBills = bills.filter(b => b.shiftId === activeShift?.id || (b.dateStr >= activeShift?.startDate && b.cashier === activeShift?.cashierName));
  const currentShiftCashSales = activeShiftBills.filter(b => b.paymentMode === 'CASH').reduce((acc, b) => acc + b.total, 0);
  const currentShiftUpiSales = activeShiftBills.filter(b => b.paymentMode === 'UPI').reduce((acc, b) => acc + b.total, 0);
  const currentShiftCreditSales = activeShiftBills.filter(b => b.paymentMode === 'CREDIT').reduce((acc, b) => acc + b.total, 0);
  const currentShiftTotalSales = activeShiftBills.reduce((acc, b) => acc + b.total, 0);

  const currentShiftCashDrops = cashDrops.filter(cd => cd.shiftId === activeShift?.id);
  const currentShiftCashIn = currentShiftCashDrops.filter(cd => cd.type === 'CASH_IN').reduce((acc, cd) => acc + cd.amount, 0);
  const currentShiftCashOut = currentShiftCashDrops.filter(cd => cd.type === 'CASH_OUT').reduce((acc, cd) => acc + cd.amount, 0);

  const expectedDrawerCash = activeShift?.status === 'OPEN'
    ? (activeShift.openingFloat + currentShiftCashSales + currentShiftCashIn - currentShiftCashOut)
    : 0;

  // Computed Denomination Total in Close Shift Modal
  const calculatedDenominationTotal = useMemo(() => {
    return (
      (Number(denominations[500]) || 0) * 500 +
      (Number(denominations[200]) || 0) * 200 +
      (Number(denominations[100]) || 0) * 100 +
      (Number(denominations[50]) || 0) * 50 +
      (Number(denominations[20]) || 0) * 20 +
      (Number(denominations[10]) || 0) * 10
    );
  }, [denominations]);

  const effectivePhysicalCash = physicalCashCounted !== '' ? Number(physicalCashCounted) : calculatedDenominationTotal;
  const shiftDiscrepancy = effectivePhysicalCash - expectedDrawerCash;

  // -------------------------------------------------------------
  // 8. CASHIER SHIFT PERFORMANCE & SALES LEADERBOARD COMPUTATIONS
  // -------------------------------------------------------------
  const cashierLeaderboard = useMemo(() => {
    return employees.map(emp => {
      const empBills = bills.filter(b => b.cashier === emp.name || (b.cashier && b.cashier.includes(emp.name.split(' ')[0])));
      const totalBills = empBills.length;
      const totalSales = empBills.reduce((acc, b) => acc + b.total, 0);
      const cashSales = empBills.filter(b => b.paymentMode === 'CASH').reduce((acc, b) => acc + b.total, 0);
      const upiSales = empBills.filter(b => b.paymentMode === 'UPI').reduce((acc, b) => acc + b.total, 0);
      const creditSales = empBills.filter(b => b.paymentMode === 'CREDIT').reduce((acc, b) => acc + b.total, 0);
      const aov = totalBills > 0 ? Math.round(totalSales / totalBills) : 0;
      // Realistic average billing time in seconds: base 45s, decreases with experience
      const avgSpeedSeconds = totalBills > 0 ? Math.max(30, 48 - Math.min(15, totalBills * 2)) : 45;
      // Incentive commission: 1% of sales + ₹5 per bill processed
      const incentiveBonus = Math.round(totalSales * 0.01 + totalBills * 5);

      return {
        id: emp.id,
        name: emp.name,
        role: emp.role,
        shift: emp.shift,
        totalBills,
        totalSales,
        cashSales,
        upiSales,
        creditSales,
        aov,
        avgSpeedSeconds,
        incentiveBonus
      };
    }).sort((a, b) => b.totalSales - a.totalSales || b.totalBills - a.totalBills);
  }, [employees, bills]);

  // -------------------------------------------------------------
  // CASH DRAWER & SHIFT RECONCILER HANDLERS
  // -------------------------------------------------------------
  const handleUpdateOpeningFloat = (e) => {
    e.preventDefault();
    const newFloat = Number(tempOpeningFloat) || 0;
    setActiveShift(prev => ({
      ...prev,
      openingFloat: newFloat
    }));
    setShowOpeningFloatModal(false);
    alert(`Opening Cash Float updated to ₹${newFloat.toLocaleString('en-IN')}!`);
  };

  const handleSaveCashDrop = (e) => {
    e.preventDefault();
    const amount = Number(cashDropForm.amount);
    if (!amount || amount <= 0) {
      alert("Please enter a valid cash amount.");
      return;
    }
    const drop = {
      id: Date.now(),
      shiftId: activeShift.id,
      type: cashDropForm.type, // 'CASH_OUT' | 'CASH_IN'
      amount,
      reason: cashDropForm.reason,
      notes: cashDropForm.notes.trim(),
      cashier: currentUser ? currentUser.name : activeShift.cashierName,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toISOString().slice(0, 10)
    };

    setCashDrops(prev => [drop, ...prev]);
    setShowCashDropModal(false);
    setCashDropForm({ type: 'CASH_OUT', amount: '', reason: 'Vendor Payout (Milk/Bread)', notes: '' });
    alert(`Cash ${drop.type === 'CASH_OUT' ? 'Withdrawal (Drop Out)' : 'Injection (Cash In)'} of ₹${amount.toLocaleString('en-IN')} recorded successfully.`);
  };

  const handleCloseShift = (e) => {
    e.preventDefault();
    const counted = effectivePhysicalCash;
    const discrepancy = counted - expectedDrawerCash;
    const now = new Date();
    const endTimeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    let statusText = 'BALANCED';
    if (discrepancy < 0) statusText = 'SHORTAGE';
    if (discrepancy > 0) statusText = 'EXCESS';

    const closed = {
      id: activeShift.id,
      cashierName: activeShift.cashierName,
      shiftName: activeShift.shiftName,
      startDate: activeShift.startDate,
      startTime: activeShift.startTime,
      endDate: now.toISOString().slice(0, 10),
      endTime: endTimeStr,
      openingFloat: activeShift.openingFloat,
      cashSales: currentShiftCashSales,
      upiSales: currentShiftUpiSales,
      creditSales: currentShiftCreditSales,
      totalSales: currentShiftTotalSales,
      billsCount: activeShiftBills.length,
      cashIn: currentShiftCashIn,
      cashOut: currentShiftCashOut,
      expectedCash: expectedDrawerCash,
      actualCash: counted,
      discrepancy,
      status: statusText,
      notes: shiftClosingNotes.trim(),
      denominations: { ...denominations }
    };

    setClosedShifts(prev => [closed, ...prev]);
    setShowCloseShiftModal(false);
    setPhysicalCashCounted('');
    setDenominations({ 500: '', 200: '', 100: '', 50: '', 20: '', 10: '' });
    setShiftClosingNotes('');

    // Reset for next shift
    const nextShiftId = `SHIFT-${Date.now().toString().slice(-4)}`;
    setActiveShift({
      id: nextShiftId,
      cashierId: activeShift.cashierId,
      cashierName: activeShift.cashierName,
      shiftName: 'Evening Shift (2 PM - 10 PM)',
      startTime: endTimeStr,
      startDate: now.toISOString().slice(0, 10),
      openingFloat: counted,
      status: 'OPEN'
    });

    const statusMsg = statusText === 'BALANCED'
      ? '✅ Perfect Match! Physical cash in drawer matches digital expected cash exactly.'
      : statusText === 'SHORTAGE'
      ? `🚨 Cash Shortage Alert! ₹${Math.abs(discrepancy).toLocaleString('en-IN')} missing from drawer.`
      : `⚠️ Cash Excess! ₹${discrepancy.toLocaleString('en-IN')} extra physical cash in drawer.`;

    alert(`Shift ${closed.id} Closed & Reconciled!\n${statusMsg}\nNew shift initialized with opening float ₹${counted.toLocaleString('en-IN')}.`);
  };

  const handleOpenShiftAudit = (shift) => {
    setSelectedShiftForAudit(shift);
    setShowShiftAuditModal(true);
  };

  const handleAddEmployeeSubmit = async (e) => {
    e.preventDefault();
    if (!newEmployee.name || !newEmployee.phone) {
      alert('Please provide employee name and phone number.');
      return;
    }
    const cleanEmail = (newEmployee.email.trim() || `${newEmployee.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@bizsmart.in`).toLowerCase();
    // No silent default passwords when a real backend is used
    const cleanPassword = newEmployee.password.trim() || (API_ENABLED ? '' : 'password123');

    // Verify uniqueness
    if (employees.some(emp => emp.email.toLowerCase() === cleanEmail)) {
      alert(`An employee with email "${cleanEmail}" already exists. Please use a distinct email.`);
      return;
    }
    if (registeredOwners.some(o => o.email.toLowerCase() === cleanEmail)) {
      alert(`The email "${cleanEmail}" is already registered to a Store Owner. Please choose a different email for employee.`);
      return;
    }

    if (API_ENABLED && isAuthenticated) {
      if (cleanPassword.length < 6) {
        alert('Please set a password of at least 6 characters for the employee.');
        return;
      }
      try {
        await api.createEmployee({
          email: cleanEmail,
          password: cleanPassword,
          fullName: newEmployee.name.trim(),
          phone: newEmployee.phone.trim(),
          jobTitle: newEmployee.role
        });
      } catch (err) {
        alert(`Could not create the employee login: ${err.message}`);
        return;
      }
    }

    const emp = {
      id: Date.now(),
      name: newEmployee.name.trim(),
      role: newEmployee.role,
      phone: newEmployee.phone.trim(),
      email: cleanEmail,
      password: API_ENABLED ? undefined : cleanPassword,
      salary: Number(newEmployee.salary) || 22000,
      shift: newEmployee.shift,
      status: 'ACTIVE',
      joinedDate: 'Today'
    };
    setEmployees([...employees, emp]);
    setShowAddEmployeeModal(false);
    setNewEmployee({ name: '', role: 'Cashier & POS Operator', phone: '', email: '', password: '', salary: '22000', shift: 'Morning (8 AM - 4 PM)' });
    alert(`🎉 Employee Account Created Successfully!\n\nName: ${emp.name}\nRole: ${emp.role}\nLogin Email: ${emp.email}\nLogin Password: ${emp.password}\n\nYour employee can now log in at the sign-in screen using this Email and Password to access their POS & Cashier terminal!`);
  };

  const handleAddSupplierSubmit = (e) => {
    e.preventDefault();
    if (!newSupplier.name || !newSupplier.contact) return;
    const s = {
      id: Date.now(),
      name: newSupplier.name,
      contact: newSupplier.contact,
      phone: newSupplier.phone,
      email: `${newSupplier.name.toLowerCase().replace(/\s+/g, '')}@supplier.in`,
      address: newSupplier.address || 'Industrial Hub',
      dues: Number(newSupplier.dues) || 0,
      activeOrders: 0
    };
    setSuppliers([...suppliers, s]);
    setShowAddSupplierModal(false);
    setNewSupplier({ name: '', contact: '', phone: '', address: '', dues: '0' });
    alert(`Success: Added supplier "${s.name}"!`);
  };



  // ADD EXPENSE HANDLER (Nice Box Modal Submission)
  const handleAddExpenseSubmit = (e) => {
    e.preventDefault();
    if (!newExpense.title.trim() || !newExpense.amount) return;
    const exp = {
      id: Date.now(),
      title: newExpense.title.trim(),
      category: newExpense.category,
      amount: Number(newExpense.amount) || 0,
      date: newExpense.date || new Date().toISOString().slice(0, 10),
      notes: newExpense.notes.trim()
    };
    setExpenses(prev => [exp, ...prev]);
    setShowAddExpenseModal(false);
    setNewExpense({
      title: '',
      category: 'Shop Floor Rent',
      date: new Date().toISOString().slice(0, 10),
      amount: '',
      notes: ''
    });
  };

  // EDIT EXPENSE NOTE HANDLER
  const handleSaveExpenseNote = (e) => {
    e.preventDefault();
    if (!selectedExpenseForNote) return;
    setExpenses(expenses.map(exp => exp.id === selectedExpenseForNote.id ? { ...exp, notes: expenseNoteText } : exp));
    setShowEditExpenseNoteModal(false);
    setSelectedExpenseForNote(null);
    setExpenseNoteText('');
  };

  // ADD CUSTOMER HANDLER (Replacing prompt)
  const handleAddCustomerSubmit = (e) => {
    e.preventDefault();
    if (!newCustomer.name || !newCustomer.phone) return;
    const cust = {
      id: Date.now(),
      name: newCustomer.name.trim(),
      phone: newCustomer.phone.trim(),
      balance: 0,
      limit: Number(newCustomer.limit) || 5000,
      city: newCustomer.city.trim() || 'Delhi NCR',
      lastBillDate: '-'
    };
    setCustomers(prev => [...prev, cust]);
    if (API_ENABLED && isAuthenticated) {
      api.createCustomer({ name: cust.name, phone: cust.phone, city: cust.city, creditLimit: cust.limit })
        .then(saved => setCustomers(prev => prev.map(c => (c.id === cust.id ? { ...c, id: saved.id } : c))))
        .catch(e => notifySyncError('Customer saved locally but not synced to the server', e));
    }
    setShowAddCustomerModal(false);
    setNewCustomer({ name: '', phone: '', limit: '5000', city: 'Delhi NCR' });
  };

  // RECEIVE KHATA PAYMENT HANDLER (Replacing prompt)
  const handleKhataPaymentSubmit = (e) => {
    e.preventDefault();
    if (!selectedKhataCustomer) return;
    const amt = Number(khataPaymentAmount) || 0;
    if (amt <= 0) return;
    if (API_ENABLED && isAuthenticated) {
      api.recordKhataPayment(selectedKhataCustomer.id, Math.min(amt, selectedKhataCustomer.balance), khataPaymentMode, khataPaymentNote)
        .catch(e => notifySyncError('Khata payment not synced to the server', e));
    }
    setCustomers(customers.map(c => c.id === selectedKhataCustomer.id ? { ...c, balance: Math.max(0, c.balance - amt), lastBillDate: 'Today (Repaid)' } : c));
    setShowKhataPaymentModal(false);
    setSelectedKhataCustomer(null);
    setKhataPaymentAmount('');
    setKhataPaymentNote('');
  };

  // DYNAMIC METRICS FOR DASHBOARD & FINANCIALS (Starts at default 0)
  const todayStr = new Date().toISOString().slice(0, 10);
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const currentYearStr = new Date().getFullYear().toString();

  const lowStockProductsList = products.filter(p => p.quantity <= p.minStock);
  const nearExpiryProductsList = products.filter(p => {
    const d = calculateDaysToExpiry(p.expiryDate);
    return d <= 30; // expired or expiring within 30 days
  });

  // Stock Valuation & Wastage Metrics
  const totalStockCostValue = products.reduce((acc, p) => acc + (p.quantity * (p.purchasePrice || 0)), 0);
  const totalStockRetailValue = products.reduce((acc, p) => acc + (p.quantity * (p.sellingPrice || 0)), 0);
  const projectedGrossMargin = totalStockRetailValue - totalStockCostValue;
  const projectedMarginPct = totalStockRetailValue > 0 ? ((projectedGrossMargin / totalStockRetailValue) * 100).toFixed(1) : '0.0';
  const totalWastageLoss = wastageEntries.reduce((acc, w) => acc + w.lossAmount, 0);

  const availableCategories = useMemo(() => {
    const defaultCats = [
      'Staples & Grains',
      'Edible Oils & Ghee',
      'Dairy & Breakfast',
      'FMCG & Packaged Foods',
      'Personal Care',
      'Snacks & Beverages',
      'Spices & Masalas'
    ];
    const productCats = products.map(p => p.category).filter(Boolean);
    return Array.from(new Set([...defaultCats, ...productCats]));
  }, [products]);

  const filteredAndSortedProducts = useMemo(() => {
    return products
      .filter(p => {
        // Search filter (name or sku)
        if (inventorySearch.trim()) {
          const q = inventorySearch.toLowerCase();
          const matchName = p.name?.toLowerCase().includes(q);
          const matchSku = p.sku?.toLowerCase().includes(q);
          if (!matchName && !matchSku) return false;
        }
        // Category filter
        if (inventoryCategoryFilter !== 'all' && p.category !== inventoryCategoryFilter) {
          return false;
        }
        // Stock filter
        if (inventoryStockFilter === 'low' && p.quantity > p.minStock) {
          return false;
        }
        // Expiry filter
        const days = calculateDaysToExpiry(p.expiryDate);
        if (inventoryExpiryFilter === 'expired') {
          return days <= 0;
        }
        if (inventoryExpiryFilter === 'near-15') {
          return days > 0 && days <= 15;
        }
        if (inventoryExpiryFilter === 'near-30') {
          return days > 0 && days <= 30;
        }
        if (inventoryExpiryFilter === 'near-60') {
          return days > 0 && days <= 60;
        }
        if (inventoryExpiryFilter === 'near-90') {
          return days > 0 && days <= 90;
        }
        return true;
      })
      .sort((a, b) => {
        const daysA = calculateDaysToExpiry(a.expiryDate);
        const daysB = calculateDaysToExpiry(b.expiryDate);
        if (inventorySortBy === 'expiry-asc') return daysA - daysB;
        if (inventorySortBy === 'expiry-desc') return daysB - daysA;
        if (inventorySortBy === 'stock-asc') return a.quantity - b.quantity;
        if (inventorySortBy === 'stock-desc') return b.quantity - a.quantity;
        if (inventorySortBy === 'price-asc') return a.sellingPrice - b.sellingPrice;
        if (inventorySortBy === 'price-desc') return b.sellingPrice - a.sellingPrice;
        if (inventorySortBy === 'name-asc') return a.name.localeCompare(b.name);
        return 0;
      });
  }, [products, inventorySearch, inventoryCategoryFilter, inventoryExpiryFilter, inventoryStockFilter, inventorySortBy]);
  const todayBillsList = bills.filter(b => b.dateStr === todayStr);
  const todaySales = todayBillsList.reduce((acc, b) => acc + b.total, 0);

  const monthBillsList = bills.filter(b => b.dateStr.startsWith(currentMonthStr));
  const monthlySales = monthBillsList.reduce((acc, b) => acc + b.total, 0);

  const totalExpensesAmount = expenses.reduce((acc, e) => acc + e.amount, 0);

  const totalCogs = bills.reduce((acc, b) => {
    return acc + b.items.reduce((sum, it) => sum + ((it.product.purchasePrice || 0) * it.quantity), 0);
  }, 0);

  const estimatedNetProfit = Math.max(0, monthlySales - totalExpensesAmount - totalCogs);
  const netMargin = monthlySales > 0 ? ((estimatedNetProfit / monthlySales) * 100).toFixed(1) : '0.0';

  // EXPENSES & PROFIT FILTERED METRICS
  const getFilteredExpenses = () => {
    if (expenseFilterMode === 'today') {
      return expenses.filter(e => e.date === todayStr);
    }
    if (expenseFilterMode === 'month') {
      return expenses.filter(e => e.date.startsWith(currentMonthStr));
    }
    if (expenseFilterMode === 'custom') {
      return expenses.filter(e => (!expenseStartDate || e.date >= expenseStartDate) && (!expenseEndDate || e.date <= expenseEndDate));
    }
    return expenses;
  };

  const filteredExpensesList = getFilteredExpenses();
  const periodExpensesSum = filteredExpensesList.reduce((acc, e) => acc + e.amount, 0);

  const getFilteredBillsForExpenses = () => {
    if (expenseFilterMode === 'today') {
      return bills.filter(b => b.dateStr === todayStr);
    }
    if (expenseFilterMode === 'month') {
      return bills.filter(b => b.dateStr.startsWith(currentMonthStr));
    }
    if (expenseFilterMode === 'custom') {
      return bills.filter(b => (!expenseStartDate || b.dateStr >= expenseStartDate) && (!expenseEndDate || b.dateStr <= expenseEndDate));
    }
    return bills;
  };

  const periodBillsForPnl = getFilteredBillsForExpenses();
  const periodSalesPnl = periodBillsForPnl.reduce((acc, b) => acc + b.total, 0);
  const periodCogsPnl = periodBillsForPnl.reduce((acc, b) => {
    return acc + b.items.reduce((sum, it) => sum + ((it.product.purchasePrice || 0) * it.quantity), 0);
  }, 0);
  const periodNetProfitPnl = Math.max(0, periodSalesPnl - periodExpensesSum - periodCogsPnl);
  const periodMarginPnl = periodSalesPnl > 0 ? ((periodNetProfitPnl / periodSalesPnl) * 100).toFixed(1) : '0.0';

  // SALES ANALYTICS FILTERED METRICS
  const getAnalyticsBills = () => {
    const today = new Date();
    if (analyticsPeriod === 'weekly') {
      const past7 = new Date();
      past7.setDate(today.getDate() - 6);
      const past7Str = past7.toISOString().slice(0, 10);
      return bills.filter(b => b.dateStr >= past7Str && b.dateStr <= todayStr);
    }
    if (analyticsPeriod === 'monthly') {
      return bills.filter(b => b.dateStr.startsWith(currentMonthStr));
    }
    if (analyticsPeriod === 'yearly') {
      return bills.filter(b => b.dateStr.startsWith(currentYearStr));
    }
    if (analyticsPeriod === 'custom') {
      return bills.filter(b => (!analyticsStartDate || b.dateStr >= analyticsStartDate) && (!analyticsEndDate || b.dateStr <= analyticsEndDate));
    }
    return bills;
  };

  const analyticsBillsList = getAnalyticsBills();
  const analyticsRevenue = analyticsBillsList.reduce((acc, b) => acc + b.total, 0);
  const analyticsOrdersCount = analyticsBillsList.length;
  const analyticsAov = analyticsOrdersCount > 0 ? Math.round(analyticsRevenue / analyticsOrdersCount) : 0;
  const analyticsCash = analyticsBillsList.filter(b => b.paymentMode === 'CASH').reduce((acc, b) => acc + b.total, 0);
  const analyticsUPI = analyticsBillsList.filter(b => b.paymentMode === 'UPI').reduce((acc, b) => acc + b.total, 0);
  const analyticsCredit = analyticsBillsList.filter(b => b.paymentMode === 'CREDIT').reduce((acc, b) => acc + b.total, 0);

  // =============================================================
  // SCREEN 1: REAL LOGIN SCREEN (When Not Authenticated)
  // =============================================================
  if (!isAuthenticated) {
    // -----------------------------------------------------------
    // VIEW 1A: OPENING / INTRO LANDING PAGE
    // -----------------------------------------------------------
    if (viewMode === 'landing') {
      return (
        <div className="min-h-screen bg-gradient-to-br from-violet-950 via-purple-900 to-emerald-950 text-white font-sans selection:bg-fuchsia-500 selection:text-white flex flex-col relative overflow-hidden">
          {/* Ambient Vibrant Mesh Glows */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[850px] h-[450px] bg-gradient-to-r from-fuchsia-600/35 via-violet-600/30 to-emerald-500/25 blur-3xl pointer-events-none rounded-full" />
          <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-emerald-500/25 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/3 -right-20 w-96 h-96 bg-fuchsia-500/25 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-10 right-1/3 w-80 h-80 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Top Glassmorphic Navigation */}
          <header className="border-b border-white/10 bg-black/30 backdrop-blur-2xl sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
              {/* Logo */}
              <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setViewMode('landing')}>
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-fuchsia-500 to-emerald-400 flex items-center justify-center text-white shadow-xl shadow-fuchsia-500/30 ring-2 ring-white/20">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-2xl font-black tracking-tight text-white">Biz<span className="bg-gradient-to-r from-fuchsia-400 via-pink-300 to-emerald-300 bg-clip-text text-transparent">Smart</span></span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">Retail 2.0</span>
                  </div>
                  <p className="text-[11px] text-purple-200/70 font-medium">Unified Kirana, Supermarket & Retail POS Platform</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => {
                    setLoginError('');
                    setViewMode('login');
                  }}
                  className="px-5 py-2.5 text-xs font-bold text-white/90 hover:text-white bg-white/10 hover:bg-white/20 rounded-2xl backdrop-blur-md transition flex items-center space-x-2 border border-white/15 shadow-sm"
                >
                  <LogIn className="w-4 h-4 text-emerald-300" />
                  <span>Sign In</span>
                </button>
                <button
                  onClick={() => {
                    setRegisterError('');
                    setViewMode('register');
                  }}
                  className="px-5 py-2.5 bg-gradient-to-r from-fuchsia-500 via-purple-500 to-emerald-500 hover:from-fuchsia-600 hover:to-emerald-600 text-white text-xs font-black rounded-2xl transition shadow-xl shadow-fuchsia-500/30 flex items-center space-x-1.5 ring-2 ring-white/20"
                >
                  <Store className="w-4 h-4" />
                  <span>Register Store (Owner) &rarr;</span>
                </button>
              </div>
            </div>
          </header>

          {/* Hero Section */}
          <section className="max-w-5xl mx-auto px-4 pt-16 pb-14 text-center relative z-10">
            {/* Pill Announcement */}
            <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-xs font-bold text-emerald-300 mb-6 shadow-lg">
              <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
              <span>Next-Gen Counter Billing &amp; Expiry Defense System</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-tight sm:leading-none mb-6">
              Run Your Retail Store With <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-fuchsia-400 via-amber-300 to-emerald-300 bg-clip-text text-transparent">
                Vibrant Speed &amp; Zero Wastage
              </span>
            </h1>

            <p className="text-purple-100/90 text-sm sm:text-lg max-w-3xl mx-auto mb-10 leading-relaxed font-normal">
              BizSmart powers daily kirana and retail stores with instant thermal barcode POS, Queue Buster multi-cart hold, split cash/UPI tender calculator, 15-day promotional clearance triggers, and foolproof cashier cash-drawer reconciliation.
            </p>

            {/* Hero CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <button
                onClick={() => {
                  setRegisterError('');
                  setViewMode('register');
                }}
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-fuchsia-500 to-emerald-500 hover:from-fuchsia-600 hover:to-emerald-600 text-white font-black text-sm rounded-2xl shadow-2xl shadow-fuchsia-500/40 transition flex items-center justify-center space-x-2 ring-2 ring-white/30 transform hover:-translate-y-0.5"
              >
                <Store className="w-4 h-4" />
                <span>Register Store (Owner Portal)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setLoginError('');
                  setViewMode('login');
                }}
                className="w-full sm:w-auto px-8 py-4 bg-black/40 hover:bg-black/60 text-white font-extrabold text-sm rounded-2xl border border-white/20 backdrop-blur-xl transition flex items-center justify-center space-x-2 shadow-lg hover:border-white/40"
              >
                <LogIn className="w-4 h-4 text-emerald-400" />
                <span>Launch Counter / Staff Sign In</span>
              </button>
            </div>

            {/* Quick Live Highlight Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-4xl mx-auto text-xs font-bold">
              <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex flex-col items-center">
                <span className="text-emerald-300 text-lg font-black">60 Items</span>
                <span className="text-purple-200/80 text-[11px]">Daily Essentials Preloaded</span>
              </div>
              <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex flex-col items-center">
                <span className="text-amber-300 text-lg font-black">15% Off</span>
                <span className="text-purple-200/80 text-[11px]">Near-Expiry Markdown Radar</span>
              </div>
              <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex flex-col items-center">
                <span className="text-fuchsia-300 text-lg font-black">Split POS</span>
                <span className="text-purple-200/80 text-[11px]">Cash + UPI + Tender Return</span>
              </div>
              <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex flex-col items-center">
                <span className="text-sky-300 text-lg font-black">100% Audit</span>
                <span className="text-purple-200/80 text-[11px]">Float &amp; Till Reconciliation</span>
              </div>
            </div>
          </section>

          {/* 6 Modern Vibrant Architectural Highlights */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs font-extrabold uppercase tracking-widest bg-gradient-to-r from-fuchsia-300 to-emerald-300 bg-clip-text text-transparent">
                Store-Ready Capabilities
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white mt-2">
                Designed for Ultra-Fast Checkout &amp; Maximum Profits
              </h2>
              <p className="text-xs sm:text-sm text-purple-200/80 mt-2">
                Everything Indian retailers and supermarket cashiers need for peak holiday rushes and everyday billing.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-3xl p-6 hover:bg-white/15 transition shadow-xl">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-fuchsia-500 to-pink-500 text-white flex items-center justify-center mb-4 shadow-lg shadow-fuchsia-500/30">
                  <Receipt className="w-6 h-6" />
                </div>
                <h3 className="text-base font-extrabold text-white mb-2">Split Payment &amp; Change Tender</h3>
                <p className="text-xs text-purple-100/80 leading-relaxed mb-3">
                  Accept hybrid payments (₹500 Cash + ₹300 UPI) in a single bill with an automated Cash Tender calculator computing exact customer change to return.
                </p>
                <div className="text-[11px] text-emerald-300 font-bold flex items-center">
                  <Check className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                  <span>Dynamic QR Generator + WhatsApp e-Invoices</span>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-3xl p-6 hover:bg-white/15 transition shadow-xl">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 text-white flex items-center justify-center mb-4 shadow-lg shadow-amber-500/30">
                  <Percent className="w-6 h-6" />
                </div>
                <h3 className="text-base font-extrabold text-white mb-2">15-Day Clearance Markdown Radar</h3>
                <p className="text-xs text-purple-100/80 leading-relaxed mb-3">
                  Early detection system warns when stock is within 15 days of expiry. Trigger instant 15% clearance promotional markdowns with 1 click to clear dead stock.
                </p>
                <div className="text-[11px] text-amber-300 font-bold flex items-center">
                  <Check className="w-3.5 h-3.5 mr-1 text-amber-400" />
                  <span>FIFO Multi-Batch dispatch ensures fresh goods</span>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-3xl p-6 hover:bg-white/15 transition shadow-xl">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/30">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <h3 className="text-base font-extrabold text-white mb-2">Bulk CSV &amp; Excel Product Sync</h3>
                <p className="text-xs text-purple-100/80 leading-relaxed mb-3">
                  Export all 60 store items with full batch numbers and expiry dates to CSV, edit in Excel, and re-import bulk updates instantly with zero downtime.
                </p>
                <div className="text-[11px] text-emerald-300 font-bold flex items-center">
                  <Check className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                  <span>Sample template download &amp; error-free upload</span>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-3xl p-6 hover:bg-white/15 transition shadow-xl">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-500 to-indigo-500 text-white flex items-center justify-center mb-4 shadow-lg shadow-violet-500/30">
                  <Landmark className="w-6 h-6" />
                </div>
                <h3 className="text-base font-extrabold text-white mb-2">Shift Float &amp; Cash Till Hisab-Kitab</h3>
                <p className="text-xs text-purple-100/80 leading-relaxed mb-3">
                  Track starting morning float, record mid-day cash drops (milk/bread payouts), and match evening physical notes. Zero-discrepancy daily balance audits.
                </p>
                <div className="text-[11px] text-purple-300 font-bold flex items-center">
                  <Check className="w-3.5 h-3.5 mr-1 text-purple-400" />
                  <span>Physical denomination breakdown counter</span>
                </div>
              </div>

              {/* Feature 5 */}
              <div className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-3xl p-6 hover:bg-white/15 transition shadow-xl">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-500 text-white flex items-center justify-center mb-4 shadow-lg shadow-cyan-500/30">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-base font-extrabold text-white mb-2">Customer Khata &amp; Loyalty CRM</h3>
                <p className="text-xs text-purple-100/80 leading-relaxed mb-3">
                  Digital customer ledger with credit limits, payment tracking, balance reminders, and instant bill history lookup for loyal neighborhood customers.
                </p>
                <div className="text-[11px] text-cyan-300 font-bold flex items-center">
                  <Check className="w-3.5 h-3.5 mr-1 text-cyan-400" />
                  <span>Automatic 1% loyalty point rewards on bills</span>
                </div>
              </div>

              {/* Feature 6 */}
              <div className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-3xl p-6 hover:bg-white/15 transition shadow-xl">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-600 text-white flex items-center justify-center mb-4 shadow-lg shadow-pink-500/30">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-base font-extrabold text-white mb-2">Strict Owner &amp; Cashier Separation</h3>
                <p className="text-xs text-purple-100/80 leading-relaxed mb-3">
                  Store Owners manage overhead expenses, staff salaries (e.g. ₹25,000 for Ajay Sharma), and catalog pricing while Cashiers run focused POS billing desks.
                </p>
                <div className="text-[11px] text-pink-300 font-bold flex items-center">
                  <Check className="w-3.5 h-3.5 mr-1 text-pink-400" />
                  <span>Sensitive store profits hidden from terminal</span>
                </div>
              </div>
            </div>
          </section>

          {/* Simple 3-Step Store Setup Workflow */}
          <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-white/10">
            <div className="text-center mb-10">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                Simple &amp; Fast Onboarding
              </span>
              <h2 className="text-2xl font-black text-white mt-1">
                How Damani Retails &amp; Retailers Get Started
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/10 backdrop-blur-xl border border-white/15 p-5 rounded-3xl relative">
                <div className="w-8 h-8 rounded-xl bg-fuchsia-500 text-white font-black text-xs flex items-center justify-center mb-3 shadow-md">
                  1
                </div>
                <h4 className="text-sm font-bold text-white mb-1">Owner Registers Store</h4>
                <p className="text-xs text-purple-200/80">
                  Store Owner sets up the business profile with name, address, and master password credentials.
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-xl border border-white/15 p-5 rounded-3xl relative">
                <div className="w-8 h-8 rounded-xl bg-purple-500 text-white font-black text-xs flex items-center justify-center mb-3 shadow-md">
                  2
                </div>
                <h4 className="text-sm font-bold text-white mb-1">Owner Assigns Staff</h4>
                <p className="text-xs text-purple-200/80">
                  From the Owner Dashboard, create staff logins with custom email, password, and monthly salary.
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-xl border border-white/15 p-5 rounded-3xl relative">
                <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white font-black text-xs flex items-center justify-center mb-3 shadow-md">
                  3
                </div>
                <h4 className="text-sm font-bold text-white mb-1">Cashier Fires Up POS</h4>
                <p className="text-xs text-purple-200/80">
                  Cashier signs in directly to POS billing with Queue Buster hold, Split payments, and live barcode scanning.
                </p>
              </div>
            </div>
          </section>

          {/* Bottom Call to Action */}
          <section className="max-w-4xl mx-auto px-4 py-12 text-center">
            <div className="bg-gradient-to-r from-fuchsia-600/40 via-purple-600/30 to-emerald-600/40 border-2 border-white/20 rounded-3xl p-8 backdrop-blur-2xl shadow-2xl">
              <h3 className="text-2xl sm:text-3xl font-black text-white mb-2">
                Ready to Upgrade Your Retail Billing?
              </h3>
              <p className="text-xs sm:text-sm text-purple-100 max-w-xl mx-auto mb-6">
                Start managing sales, FIFO batch expiry defense, and cash reconciliations with BizSmart.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => {
                    setRegisterError('');
                    setViewMode('register');
                  }}
                  className="px-6 py-3.5 bg-gradient-to-r from-fuchsia-500 to-emerald-500 hover:from-fuchsia-600 hover:to-emerald-600 text-white text-xs font-black rounded-2xl transition shadow-xl shadow-fuchsia-500/30 flex items-center space-x-2 ring-2 ring-white/20"
                >
                  <Store className="w-4 h-4" />
                  <span>Register Store (Owner Portal) &rarr;</span>
                </button>
                <button
                  onClick={() => {
                    setLoginError('');
                    setViewMode('login');
                  }}
                  className="px-6 py-3.5 bg-white/15 hover:bg-white/25 text-white text-xs font-extrabold rounded-2xl border border-white/20 backdrop-blur-md transition flex items-center space-x-2"
                >
                  <LogIn className="w-4 h-4 text-emerald-300" />
                  <span>Sign In to Terminal</span>
                </button>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="mt-auto border-t border-white/10 py-6 text-center text-xs text-purple-300/70 bg-black/20">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                &copy; {new Date().getFullYear()} BizSmart Retail Platform. Engineered for Indian Retailers.
              </div>
              <div className="flex items-center space-x-4">
                <span className="flex items-center text-emerald-400 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse mr-1.5 shadow-sm shadow-emerald-400" />
                  Cloud Database Live (PostgreSQL)
                </span>
                <span className="text-white/20">&bull;</span>
                <button
                  onClick={() => setViewMode('login')}
                  className="text-fuchsia-300 hover:underline font-bold"
                >
                  Terminal Login
                </button>
                <button
                  onClick={() => setViewMode('register')}
                  className="text-emerald-300 hover:underline font-bold"
                >
                  Owner Registration
                </button>
              </div>
            </div>
          </footer>
        </div>
      );
    }

    // -----------------------------------------------------------
    // VIEW 1B: EXCLUSIVE BUSINESS OWNER STORE REGISTRATION
    // -----------------------------------------------------------
    if (viewMode === 'register') {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 font-sans relative overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-xl w-full bg-slate-900/90 border border-slate-800 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 my-8">
            {/* Top Back Link */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
              <button
                onClick={() => setViewMode('landing')}
                className="text-xs font-bold text-slate-400 hover:text-white flex items-center space-x-1 transition"
              >
                <span>&larr; Back to Home</span>
              </button>
              <button
                onClick={() => setViewMode('login')}
                className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition"
              >
                Already have a store? Sign In &rarr;
              </button>
            </div>

            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white mx-auto shadow-lg shadow-indigo-500/30 mb-3">
                <Store className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-black tracking-tight text-white">
                Register Your Business &amp; Store
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Exclusive for Business &amp; Store Owners. Setup your retail management system in seconds.
              </p>

              {/* Owner Exclusivity Notice */}
              <div className="mt-3.5 p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[11px] font-medium flex items-center justify-center space-x-1.5 text-left">
                <ShieldCheck className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                <span>
                  <strong>Owner Registration Only:</strong> Staff &amp; cashiers do not register here. You will add employees and assign them passwords from your Owner Dashboard.
                </span>
              </div>
            </div>

            {/* Registration Form */}
            <form onSubmit={handleOwnerRegister} className="space-y-4 text-xs">
              {/* Owner Details */}
              <div className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-2xl space-y-3">
                <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center">
                  <Briefcase className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
                  Business Owner Credentials
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Owner Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Damani Retails Owner"
                      value={ownerRegisterForm.ownerName}
                      onChange={e => setOwnerRegisterForm({ ...ownerRegisterForm, ownerName: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Owner Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="Enter your store email address"
                      value={ownerRegisterForm.email}
                      onChange={e => setOwnerRegisterForm({ ...ownerRegisterForm, email: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Create Password * (min 6 chars)</label>
                    <input
                      type="password"
                      required
                      placeholder="Enter strong password"
                      value={ownerRegisterForm.password}
                      onChange={e => setOwnerRegisterForm({ ...ownerRegisterForm, password: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Confirm Password *</label>
                    <input
                      type="password"
                      required
                      placeholder="Re-type password"
                      value={ownerRegisterForm.confirmPassword}
                      onChange={e => setOwnerRegisterForm({ ...ownerRegisterForm, confirmPassword: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Owner Contact Phone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91-98100-22334"
                    value={ownerRegisterForm.phone}
                    onChange={e => setOwnerRegisterForm({ ...ownerRegisterForm, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Store Details */}
              <div className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-2xl space-y-3">
                <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center">
                  <Store className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
                  Store / Retail Business Details
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Store / Business Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sharma Superstore, City Mart"
                      value={ownerRegisterForm.storeName}
                      onChange={e => setOwnerRegisterForm({ ...ownerRegisterForm, storeName: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Business Category *</label>
                    <select
                      value={ownerRegisterForm.category}
                      onChange={e => setOwnerRegisterForm({ ...ownerRegisterForm, category: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="Kirana & Supermarket">Kirana &amp; Supermarket</option>
                      <option value="Departmental Store">Departmental Store</option>
                      <option value="Pharmacy / Chemist">Pharmacy / Chemist</option>
                      <option value="Electronics & Appliances">Electronics &amp; Appliances</option>
                      <option value="Fashion & Apparel">Fashion &amp; Apparel</option>
                      <option value="Bakery & Cafe">Bakery &amp; Cafe</option>
                      <option value="General Retail">General Retail &amp; FMCG</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Store Tagline / Slogan</label>
                  <input
                    type="text"
                    placeholder="e.g. Quality Groceries & Daily Needs"
                    value={ownerRegisterForm.tagline}
                    onChange={e => setOwnerRegisterForm({ ...ownerRegisterForm, tagline: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Store Address &amp; City *</label>
                    <input
                      type="text"
                      required
                      placeholder="Shop 12-14, Main Market, New Delhi"
                      value={ownerRegisterForm.address}
                      onChange={e => setOwnerRegisterForm({ ...ownerRegisterForm, address: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">GSTIN Number (Optional)</label>
                    <input
                      type="text"
                      placeholder="07AABCS1429B1Z8"
                      value={ownerRegisterForm.gstin}
                      onChange={e => setOwnerRegisterForm({ ...ownerRegisterForm, gstin: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {registerError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-semibold">
                  {registerError}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2"
              >
                <Store className="w-4 h-4" />
                <span>Create Store Account &amp; Enter Dashboard &rarr;</span>
              </button>
            </form>
          </div>
        </div>
      );
    }

    // -----------------------------------------------------------
    // VIEW 1C: UNIFIED LOGIN SCREEN (For Owners & Employees)
    // -----------------------------------------------------------
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 font-sans relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10">
          {/* Top navigation */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-6">
            <button
              onClick={() => setViewMode('landing')}
              className="text-xs font-bold text-slate-400 hover:text-white flex items-center space-x-1 transition"
            >
              <span>&larr; Back to Home</span>
            </button>
            <button
              onClick={() => setViewMode('register')}
              className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition"
            >
              New Owner? Register Store &rarr;
            </button>
          </div>

          {/* Logo & Title */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white mx-auto shadow-lg shadow-indigo-500/30 mb-3">
              <Building2 className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              Biz<span className="text-indigo-400">Smart</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Sign In to Your Store Dashboard or Cashier Terminal
            </p>
          </div>

          {/* Role Explainer Tips */}
          <div className="mb-5 p-3 rounded-2xl bg-slate-950/70 border border-slate-800 text-[11px] space-y-1.5 text-slate-300">
            <div className="flex items-start space-x-2">
              <span className="text-indigo-400 font-bold">👑</span>
              <span><strong>Store Owners:</strong> Sign in with your registered email and password to manage store &amp; staff.</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-amber-400 font-bold">🧑‍💼</span>
              <span><strong>Cashiers &amp; Staff:</strong> Sign in with the email &amp; password given by your Store Owner.</span>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Login Email ID
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="Enter your registered login email"
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="Enter your password"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>
            </div>

            {loginError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-semibold">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In to Dashboard / Terminal</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // =============================================================
  // SCREEN 2: AUTHENTICATED DASHBOARD
  // =============================================================
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans flex flex-col">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-700 to-indigo-500 flex items-center justify-center text-white font-extrabold shadow-md shadow-indigo-200">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center">
                <span className="text-xl font-black tracking-tight text-slate-900">Biz<span className="text-indigo-600">Smart</span></span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">{business.name}</p>
            </div>
          </div>

          {/* Cloud Sync Status Badge */}
          <div className="hidden md:flex items-center space-x-2">
            {backendStatus === 'connected' ? (
              <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <Database className="w-3.5 h-3.5" />
                <span>Cloud PostgreSQL Live</span>
              </div>
            ) : backendStatus === 'offline' ? (
              <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                <Wifi className="w-3.5 h-3.5" />
                <span>Connecting Cloud API...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-600 text-xs font-semibold">
                <Server className="w-3.5 h-3.5 text-slate-400" />
                <span>Local POS Mode</span>
              </div>
            )}
          </div>

          {/* Logged in User Profile & Sign Out Button */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-right">
              <div className="hidden sm:block">
                <div className="text-xs font-bold text-slate-900">{currentUser.name}</div>
                <div className="text-[10px] text-slate-400 font-mono">{currentUser.email}</div>
              </div>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold ${
                currentUser.role === 'OWNER' ? 'bg-indigo-600' :
                currentUser.role === 'EMPLOYEE' ? 'bg-amber-600' :
                currentUser.role === 'SUPPLIER' ? 'bg-blue-600' : 'bg-purple-600'
              }`}>
                {currentUser.name[0]}
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-rose-50 hover:border-rose-300 text-slate-600 hover:text-rose-600 text-xs font-bold transition flex items-center space-x-1.5"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 flex flex-col">
        {/* Navigation Tabs based on Current Authenticated Role */}
        <div className="flex flex-wrap gap-1.5 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm mb-6 self-start">
          {currentUser.role === 'OWNER' && (
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Owner Dashboard</span>
            </button>
          )}

          {currentUser.role === 'OWNER' && (
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${activeTab === 'analytics' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Sales Analytics</span>
            </button>
          )}

          {currentUser.role === 'EMPLOYEE' && (
            <button
              onClick={() => setActiveTab('employee-dashboard')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${activeTab === 'employee-dashboard' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Employee Dashboard</span>
            </button>
          )}

          {(currentUser.role === 'OWNER' || currentUser.role === 'EMPLOYEE') && (
            <button
              onClick={() => setActiveTab('pos')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${activeTab === 'pos' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <Receipt className="w-4 h-4" />
              <span>POS & Billing</span>
            </button>
          )}

          {(currentUser.role === 'OWNER' || currentUser.role === 'EMPLOYEE') && (
            <button
              onClick={() => setActiveTab('inventory')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${activeTab === 'inventory' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <Package className="w-4 h-4" />
              <span>Inventory & Items</span>
              {lowStockProductsList.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold">
                  {lowStockProductsList.length}
                </span>
              )}
            </button>
          )}

          {currentUser.role === 'OWNER' && (
            <button
              onClick={() => setActiveTab('employees')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${activeTab === 'employees' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Employees ({employees.length})</span>
            </button>
          )}

          {currentUser.role === 'OWNER' && (
            <button
              onClick={() => setActiveTab('shifts')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${activeTab === 'shifts' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <Landmark className="w-4 h-4" />
              <span>Cash Drawer &amp; Shifts</span>
              {currentShiftCashDrops.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-extrabold">
                  {currentShiftCashDrops.length}
                </span>
              )}
            </button>
          )}

          {currentUser.role === 'OWNER' && (
            <button
              onClick={() => setActiveTab('suppliers')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${activeTab === 'suppliers' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <Truck className="w-4 h-4" />
              <span>Suppliers ({suppliers.length})</span>
            </button>
          )}

          {(currentUser.role === 'OWNER' || currentUser.role === 'EMPLOYEE') && (
            <button
              onClick={() => setActiveTab('customers')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${activeTab === 'customers' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <Users className="w-4 h-4" />
              <span>Customers & Khata</span>
            </button>
          )}

          {currentUser.role === 'OWNER' && (
            <button
              onClick={() => setActiveTab('expenses')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${activeTab === 'expenses' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <Wallet className="w-4 h-4" />
              <span>Expenses & Profit</span>
            </button>
          )}


        </div>

        {/* ============================================================== */}
        {/* VIEW 1: BUSINESS OWNER DASHBOARD */}
        {/* ============================================================== */}
        {activeTab === 'dashboard' && currentUser.role === 'OWNER' && (
          <div className="space-y-6">
            {/* Top Stat Cards (Default 0 for new business setup) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Today's Sales</div>
                <div className="text-xl font-black text-slate-900 mt-1">₹{todaySales.toLocaleString('en-IN')}</div>
                <div className="mt-2 flex items-center text-[11px] font-semibold text-emerald-600">
                  <ArrowUpRight className="w-3.5 h-3.5 mr-1" />
                  <span>{todayBillsList.length} retail bills</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Monthly Sales</div>
                <div className="text-xl font-black text-indigo-600 mt-1">₹{monthlySales.toLocaleString('en-IN')}</div>
                <div className="mt-2 text-[11px] font-medium text-slate-500">
                  Target: ₹5,00,000 ({monthlySales > 0 ? ((monthlySales / 500000) * 100).toFixed(0) : 0}%)
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Expenses</div>
                <div className="text-xl font-black text-rose-600 mt-1">₹{totalExpensesAmount.toLocaleString('en-IN')}</div>
                <div className="mt-2 text-[11px] font-medium text-slate-500">
                  Overheads &amp; Costs
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm bg-gradient-to-br from-white to-emerald-50/50">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Estimated Profit</div>
                <div className="text-xl font-black text-emerald-600 mt-1">₹{estimatedNetProfit.toLocaleString('en-IN')}</div>
                <div className="mt-2 flex items-center text-[11px] font-bold text-emerald-700">
                  <CheckCircle className="w-3.5 h-3.5 mr-1" />
                  <span>{netMargin}% Net Margin</span>
                </div>
              </div>

              {/* Cash Drawer KPI */}
              <div
                onClick={() => setActiveTab('shifts')}
                className="bg-white rounded-2xl p-4 border border-emerald-200 shadow-sm bg-gradient-to-br from-white to-emerald-50/70 cursor-pointer hover:border-emerald-400 transition"
                title="View Cash Drawer & Shift Reconciler"
              >
                <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 flex items-center justify-between">
                  <span>Cash in Drawer</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <div className="text-xl font-black text-emerald-700 mt-1">₹{expectedDrawerCash.toLocaleString('en-IN')}</div>
                <div className="mt-2 text-[11px] font-medium text-slate-600 flex items-center justify-between">
                  <span>Float: ₹{activeShift?.openingFloat || 0}</span>
                  <span className="font-bold text-indigo-600 hover:underline">Hisab &rarr;</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm bg-gradient-to-br from-white to-rose-50/40">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Low Stock Alert</div>
                <div className="text-xl font-black text-rose-600 mt-1">{lowStockProductsList.length} Items</div>
                <div className="mt-2 text-[11px] font-bold text-rose-700 flex items-center">
                  <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                  <span>Min threshold breached</span>
                </div>
              </div>
            </div>

            {/* Owner Quick Actions Row */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Owner Administrative Management Desk</h4>
                <p className="text-xs text-slate-500">New business setup: add staff, suppliers, items, overhead expenses, or view multi-period analytics</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setShowAddProductModal(true)}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4" /> <span>Add More Items</span>
                </button>
                <button
                  onClick={() => setShowAddEmployeeModal(true)}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-sm"
                >
                  <UserPlus className="w-4 h-4" /> <span>Add Employee</span>
                </button>
                <button
                  onClick={() => setShowAddSupplierModal(true)}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-sm"
                >
                  <Truck className="w-4 h-4" /> <span>Add Supplier</span>
                </button>
                <button
                  onClick={() => setShowAddExpenseModal(true)}
                  className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-sm"
                >
                  <Wallet className="w-4 h-4" /> <span>+ Log Expense</span>
                </button>
                <button
                  onClick={() => setActiveTab('shifts')}
                  className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-sm"
                >
                  <Landmark className="w-4 h-4" /> <span>Cash Drawer &amp; Shifts</span>
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-sm"
                >
                  <BarChart3 className="w-4 h-4" /> <span>Sales Analytics &rarr;</span>
                </button>
              </div>
            </div>

            {/* Weekly Sales Chart (Dynamic from Bills) */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Weekly Store Sales Performance (₹)</h3>
                  <p className="text-xs text-slate-500">Live 7-day revenue performance</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
                    Total: ₹{todaySales.toLocaleString('en-IN')}
                  </span>
                  <button
                    onClick={() => setActiveTab('analytics')}
                    className="text-xs text-indigo-600 font-bold hover:underline"
                  >
                    View All Analytics &rarr;
                  </button>
                </div>
              </div>

              {bills.length === 0 ? (
                <div className="py-12 px-4 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                  <TrendingUp className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <h4 className="text-sm font-bold text-slate-700">Store Performance Initialized at ₹0</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-4">
                    Your new retail business is ready. Process customer bills at the POS Billing Counter or log expenses to see dynamic performance charts.
                  </p>
                  <button
                    onClick={() => setActiveTab('pos')}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
                  >
                    Open POS Counter &rarr;
                  </button>
                </div>
              ) : (
                <div className="h-48 flex items-end justify-between gap-3 pt-6 px-2 border-b border-slate-100">
                  {[-6, -5, -4, -3, -2, -1, 0].map((offset, idx) => {
                    const d = new Date();
                    d.setDate(d.getDate() + offset);
                    const dStr = d.toISOString().slice(0, 10);
                    const dayLabel = d.toLocaleDateString('en-IN', { weekday: 'short' });
                    const daySales = bills.filter(b => b.dateStr === dStr).reduce((acc, b) => acc + b.total, 0);
                    const maxVal = Math.max(...bills.map(b => b.total), 1000);
                    const heightPct = Math.min(100, Math.max(8, (daySales / maxVal) * 100));
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1.5">
                        <div className="w-full flex items-end justify-center h-36">
                          <div
                            style={{ height: `${heightPct}%` }}
                            className="w-full max-w-[36px] bg-gradient-to-t from-indigo-700 to-indigo-500 rounded-t-lg transition hover:brightness-110 relative group"
                          >
                            <span className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-slate-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow transition whitespace-nowrap">
                              ₹{daySales.toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>
                        <span className="text-[11px] font-bold text-slate-600 mt-2">{dayLabel}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Staff & Payroll Overview (Owner Dashboard) */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100 mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center">
                    <Users className="w-5 h-5 mr-2 text-indigo-600" /> Active Store Staff &amp; Salary Overview
                  </h3>
                  <p className="text-xs text-slate-500">
                    Store employee roster, allocated shifts, and monthly fixed salary payroll
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('employees')}
                  className="text-xs text-indigo-600 font-bold hover:underline"
                >
                  Manage All Staff &rarr;
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {employees.map(emp => (
                  <div key={emp.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                          {emp.name[0]}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm">{emp.name}</div>
                          <div className="text-[11px] text-indigo-600 font-medium">{emp.role}</div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                        {emp.status}
                      </span>
                    </div>

                    <div className="mt-3.5 pt-3 border-t border-slate-200/70 space-y-1.5 text-xs">
                      <div className="flex justify-between items-center text-slate-600">
                        <span>Assigned Shift:</span>
                        <span className="font-medium text-slate-800">{emp.shift}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-600">
                        <span>Staff Login:</span>
                        <span className="font-mono text-slate-700 text-[11px]">{emp.email}</span>
                      </div>
                      <div className="flex justify-between items-center pt-1.5 border-t border-slate-200/50">
                        <span className="font-bold text-slate-700">Monthly Salary:</span>
                        <span className="text-sm font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                          ₹{emp.salary.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 1B: SALES ANALYTICS (Weekly, Monthly, Specific Period, Yearly) */}
        {/* ============================================================== */}
        {activeTab === 'analytics' && currentUser.role === 'OWNER' && (
          <div className="space-y-6">
            {/* Header & Period Switcher */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2 text-indigo-600" /> Store Sales &amp; Revenue Analytics
                </h3>
                <p className="text-xs text-slate-500">
                  Analyze revenue performance across weekly, monthly, custom calendar periods, and annual cycles
                </p>
              </div>

              {/* Period Switcher Pills */}
              <div className="flex flex-wrap items-center bg-white p-1 rounded-2xl border border-slate-200 shadow-sm text-xs font-bold">
                {[
                  { id: 'weekly', label: 'Weekly (7 Days)' },
                  { id: 'monthly', label: 'Monthly (This Month)' },
                  { id: 'custom', label: 'Specific Period' },
                  { id: 'yearly', label: 'Yearly' }
                ].map(p => (
                  <button
                    key={p.id}
                    onClick={() => setAnalyticsPeriod(p.id)}
                    className={`px-3.5 py-2 rounded-xl transition ${analyticsPeriod === p.id ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Specific Period Calendar Picker */}
            {analyticsPeriod === 'custom' && (
              <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center space-x-2 text-xs font-bold text-indigo-900">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  <span>Select Specific Calendar Date Range:</span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-slate-500 font-semibold">From:</span>
                    <input
                      type="date"
                      value={analyticsStartDate}
                      onChange={e => setAnalyticsStartDate(e.target.value)}
                      className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900"
                    />
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-slate-500 font-semibold">To:</span>
                    <input
                      type="date"
                      value={analyticsEndDate}
                      onChange={e => setAnalyticsEndDate(e.target.value)}
                      className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900"
                    />
                  </div>
                  <button
                    onClick={() => {
                      setAnalyticsStartDate(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
                      setAnalyticsEndDate(todayStr);
                    }}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl font-bold transition"
                  >
                    Reset Range
                  </button>
                </div>
              </div>
            )}

            {/* Analytics KPI Cards for Selected Period */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Sales Revenue</span>
                <div className="text-2xl font-black text-slate-900 mt-1">₹{analyticsRevenue.toLocaleString('en-IN')}</div>
                <p className="text-xs text-indigo-600 mt-2 font-semibold">
                  {analyticsPeriod === 'weekly' ? 'Past 7 Days Total' : analyticsPeriod === 'monthly' ? 'Current Month Total' : analyticsPeriod === 'yearly' ? 'Annual Cycle' : 'Selected Date Period'}
                </p>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Invoices / Orders</span>
                <div className="text-2xl font-black text-indigo-600 mt-1">{analyticsOrdersCount} Bills</div>
                <p className="text-xs text-slate-500 mt-2">Transactions processed</p>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Average Order Value (AOV)</span>
                <div className="text-2xl font-black text-emerald-600 mt-1">₹{analyticsAov.toLocaleString('en-IN')}</div>
                <p className="text-xs text-slate-500 mt-2">Revenue per checkout</p>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Payment Breakdown</span>
                <div className="mt-2 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Cash:</span>
                    <span className="font-bold text-slate-900">₹{analyticsCash.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">UPI:</span>
                    <span className="font-bold text-emerald-600">₹{analyticsUPI.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Udhaar (Khata):</span>
                    <span className="font-bold text-rose-600">₹{analyticsCredit.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Sales Chart for Selected Period */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {analyticsPeriod === 'weekly' ? 'Weekly Daily Velocity Trend' :
                     analyticsPeriod === 'monthly' ? 'Monthly Revenue Breakdown' :
                     analyticsPeriod === 'yearly' ? 'Annual Monthly Revenue Distribution' : 'Custom Period Revenue Velocity'}
                  </h4>
                  <p className="text-xs text-slate-500">Visual trend of customer billing</p>
                </div>
                <span className="text-xs font-bold px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
                  Total in View: ₹{analyticsRevenue.toLocaleString('en-IN')}
                </span>
              </div>

              {analyticsBillsList.length === 0 ? (
                <div className="py-12 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                  <BarChart3 className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <h4 className="text-sm font-bold text-slate-700">No Sales in This Selected Period</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
                    There are no customer bills registered for this timeframe yet.
                  </p>
                  <button
                    onClick={() => setActiveTab('pos')}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
                  >
                    Open POS Billing Counter &rarr;
                  </button>
                </div>
              ) : (
                <div className="h-56 flex items-end justify-between gap-2 pt-6 px-2 border-b border-slate-100">
                  {analyticsPeriod === 'yearly' ? (
                    ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, idx) => {
                      const mStr = `${currentYearStr}-${String(idx + 1).padStart(2, '0')}`;
                      const mSales = analyticsBillsList.filter(b => b.dateStr.startsWith(mStr)).reduce((acc, b) => acc + b.total, 0);
                      const maxVal = Math.max(...analyticsBillsList.map(b => b.total), 1000);
                      const heightPct = Math.min(100, Math.max(6, (mSales / maxVal) * 100));
                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-1.5">
                          <div className="w-full flex items-end justify-center h-44">
                            <div
                              style={{ height: `${heightPct}%` }}
                              className="w-full max-w-[28px] bg-gradient-to-t from-indigo-700 to-indigo-500 rounded-t-lg transition hover:brightness-110 relative group"
                            >
                              <span className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-slate-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow transition whitespace-nowrap">
                                ₹{mSales.toLocaleString('en-IN')}
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-slate-600 mt-2">{month}</span>
                        </div>
                      );
                    })
                  ) : (
                    // Weekly or Custom Period Day Bars
                    [-6, -5, -4, -3, -2, -1, 0].map((offset, idx) => {
                      const d = new Date();
                      d.setDate(d.getDate() + offset);
                      const dStr = d.toISOString().slice(0, 10);
                      const dayLabel = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });
                      const daySales = analyticsBillsList.filter(b => b.dateStr === dStr).reduce((acc, b) => acc + b.total, 0);
                      const maxVal = Math.max(...analyticsBillsList.map(b => b.total), 1000);
                      const heightPct = Math.min(100, Math.max(8, (daySales / maxVal) * 100));
                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-1.5">
                          <div className="w-full flex items-end justify-center h-44">
                            <div
                              style={{ height: `${heightPct}%` }}
                              className="w-full max-w-[36px] bg-gradient-to-t from-indigo-700 to-indigo-500 rounded-t-lg transition hover:brightness-110 relative group"
                            >
                              <span className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-slate-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow transition whitespace-nowrap">
                                ₹{daySales.toLocaleString('en-IN')}
                              </span>
                            </div>
                          </div>
                          <span className="text-[11px] font-bold text-slate-600 mt-2">{dayLabel}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Invoices List in Selected Period */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Transactions in this Period ({analyticsBillsList.length} Bills)
                </h4>
              </div>

              {analyticsBillsList.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No invoices recorded for this period yet.
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-3 px-4">Invoice #</th>
                      <th className="py-3 px-4">Date &amp; Time</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Cashier</th>
                      <th className="py-3 px-4 text-center">Payment</th>
                      <th className="py-3 px-4 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {analyticsBillsList.map(b => (
                      <tr key={b.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-bold font-mono text-slate-900">{b.billNo}</td>
                        <td className="py-3 px-4 text-slate-600">{b.date}</td>
                        <td className="py-3 px-4 font-medium text-slate-800">{b.customer.name}</td>
                        <td className="py-3 px-4 text-slate-500">{b.cashier}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            b.paymentMode === 'UPI' ? 'bg-emerald-100 text-emerald-700' :
                            b.paymentMode === 'CASH' ? 'bg-indigo-100 text-indigo-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {b.paymentMode}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-black text-slate-900">₹{b.total.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 2: DEDICATED EMPLOYEE DASHBOARD */}
        {/* ============================================================== */}
        {activeTab === 'employee-dashboard' && currentUser.role === 'EMPLOYEE' && (
          <div className="space-y-6">
            {/* Cashier Welcome & Shift Header */}
            <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 text-white rounded-2xl p-6 shadow-md">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2.5 py-1 rounded-full">
                      Employee Cashier Terminal
                    </span>
                    <span className="text-[10px] font-bold bg-emerald-500/80 text-white px-2 py-0.5 rounded-full flex items-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-white mr-1 animate-ping" /> Till Active
                    </span>
                  </div>
                  <h2 className="text-xl font-black mt-2">Welcome, {currentUser.name}!</h2>
                  <p className="text-xs text-amber-100 mt-0.5">
                    Active Shift: <span className="font-bold underline">{activeShift?.shiftName}</span> &bull; Shift ID: <span className="font-mono font-bold">{activeShift?.id}</span> &bull; Station #1
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => {
                      setCashDropForm({ type: 'CASH_OUT', amount: '', reason: 'Vendor Payout (Milk/Bread)', notes: '' });
                      setShowCashDropModal(true);
                    }}
                    className="px-3.5 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5"
                  >
                    <ArrowDownLeft className="w-4 h-4" />
                    <span>+ Cash Drop (In/Out)</span>
                  </button>
                  <button
                    onClick={() => {
                      setPhysicalCashCounted('');
                      setDenominations({ 500: '', 200: '', 100: '', 50: '', 20: '', 10: '' });
                      setShiftClosingNotes('');
                      setShowCloseShiftModal(true);
                    }}
                    className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-md"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Close Shift &amp; Reconcile</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('pos')}
                    className="px-5 py-2.5 bg-white text-amber-950 hover:bg-amber-50 rounded-xl text-xs font-bold transition shadow-md flex items-center space-x-1.5"
                  >
                    <Receipt className="w-4 h-4 text-amber-700" />
                    <span>Launch POS Billing Desk</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Cash Drawer Hisab-Kitab 4 Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex justify-between items-center">
                    <span>Morning Cash Float</span>
                    <button
                      onClick={() => {
                        setTempOpeningFloat(String(activeShift?.openingFloat || 2000));
                        setShowOpeningFloatModal(true);
                      }}
                      className="text-[11px] font-bold text-indigo-600 hover:underline"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="text-2xl font-black text-slate-800 mt-1">₹{(activeShift?.openingFloat || 0).toLocaleString('en-IN')}</div>
                </div>
                <div className="mt-3 text-xs text-slate-500 pt-2 border-t border-slate-100">
                  Starting till change provided
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Cash Sales (My Shift)</div>
                  <div className="text-2xl font-black text-indigo-600 mt-1">₹{currentShiftCashSales.toLocaleString('en-IN')}</div>
                </div>
                <div className="mt-3 text-xs text-slate-500 pt-2 border-t border-slate-100 flex justify-between">
                  <span>{activeShiftBills.filter(b => b.paymentMode === 'CASH').length} cash bills</span>
                  <span className="text-emerald-600 font-semibold">UPI: ₹{currentShiftUpiSales.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex justify-between items-center">
                    <span>Mid-day Cash Drops</span>
                    <button
                      onClick={() => {
                        setCashDropForm({ type: 'CASH_OUT', amount: '', reason: 'Vendor Payout (Milk/Bread)', notes: '' });
                        setShowCashDropModal(true);
                      }}
                      className="text-[11px] font-bold text-amber-700 hover:underline"
                    >
                      + Log
                    </button>
                  </div>
                  <div className="text-xl font-black text-slate-800 mt-1 flex items-center space-x-1.5">
                    <span className="text-emerald-600">+₹{currentShiftCashIn}</span>
                    <span className="text-slate-300">/</span>
                    <span className="text-rose-600">-₹{currentShiftCashOut}</span>
                  </div>
                </div>
                <div className="mt-3 text-xs text-slate-500 pt-2 border-t border-slate-100">
                  {currentShiftCashDrops.length} petty cash entries
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border-2 border-emerald-500/70 shadow-sm bg-gradient-to-br from-white to-emerald-50/40 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex justify-between items-center">
                    <span>Expected in Drawer</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <div className="text-2xl font-black text-emerald-700 mt-1">₹{expectedDrawerCash.toLocaleString('en-IN')}</div>
                </div>
                <div className="mt-3 text-xs font-semibold text-emerald-800 pt-2 border-t border-emerald-100">
                  Physical cash must match this
                </div>
              </div>
            </div>

            {/* Cashier Performance & Staff Leaderboard Badge */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center">
                    <Trophy className="w-4 h-4 mr-1.5 text-amber-500" /> My Shift Performance
                  </h4>
                  <p className="text-xs text-slate-500">
                    Real-time metrics for current cashier logged in as <span className="font-bold text-slate-800">{currentUser.name}</span>
                  </p>
                </div>
                <div className="px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-black flex items-center">
                  <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-600" />
                  Rank #1 &bull; Top Store Performer
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Bills Processed</span>
                    <div className="text-xl font-black text-slate-900 mt-0.5">{activeShiftBills.length} Customers</div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    <Receipt className="w-5 h-5" />
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Sales Handled</span>
                    <div className="text-xl font-black text-indigo-600 mt-0.5">₹{currentShiftTotalSales.toLocaleString('en-IN')}</div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    <Banknote className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </div>

            {/* Employee Quick Tasks & Low Stock */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center">
                  <AlertTriangle className="w-4 h-4 text-rose-500 mr-2" /> Critical Low Stock Notice for Counter Staff
                </h4>
                <p className="text-xs text-slate-500 mb-3">
                  Please inform customers or limit unit purchases for items running below safety thresholds:
                </p>
                <div className="space-y-2">
                  {lowStockProductsList.length === 0 ? (
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-center text-xs text-slate-500">
                      No low stock alerts. All items are currently well-stocked or catalog is newly initialized.
                    </div>
                  ) : (
                    lowStockProductsList.map(p => (
                      <div key={p.id} className="p-2.5 bg-rose-50 border border-rose-100 rounded-xl flex justify-between items-center text-xs">
                        <div>
                          <span className="font-bold text-slate-900">{p.name}</span>
                          <span className="text-[11px] text-rose-700 block">Only {p.quantity} units remaining</span>
                        </div>
                        <button
                          onClick={() => handleStockUpdate(p.id, 5)}
                          className="px-2.5 py-1 bg-white hover:bg-rose-100 text-rose-800 border border-rose-200 font-bold rounded-lg text-[10px]"
                        >
                          + Restocked 5
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 mb-2">Shift Closing Guidelines</h4>
                  <ul className="space-y-2 text-xs text-slate-600">
                    <li className="flex items-center text-emerald-700 font-semibold">
                      <CheckCircle className="w-4 h-4 mr-2 text-emerald-500" /> Count all physical rupee notes in the cash drawer accurately
                    </li>
                    <li className="flex items-center text-emerald-700 font-semibold">
                      <CheckCircle className="w-4 h-4 mr-2 text-emerald-500" /> Ensure all mid-day drops (vendor payouts / bank drops) are recorded
                    </li>
                    <li className="flex items-center text-emerald-700 font-semibold">
                      <CheckCircle className="w-4 h-4 mr-2 text-emerald-500" /> Check for any unbilled held carts before ending shift
                    </li>
                  </ul>
                </div>
                <div className="mt-6 flex space-x-2">
                  <button
                    onClick={() => {
                      setPhysicalCashCounted('');
                      setDenominations({ 500: '', 200: '', 100: '', 50: '', 20: '', 10: '' });
                      setShiftClosingNotes('');
                      setShowCloseShiftModal(true);
                    }}
                    className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition text-center shadow-sm"
                  >
                    Close &amp; Reconcile Shift
                  </button>
                  <button
                    onClick={() => setActiveTab('pos')}
                    className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition text-center shadow-sm"
                  >
                    Go to POS Counter &rarr;
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 3: POS & BILLING */}
        {/* ============================================================== */}
        {activeTab === 'pos' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center">
                      <Receipt className="w-5 h-5 mr-2 text-indigo-600" /> POS Billing Counter
                    </h3>
                    <p className="text-xs text-slate-500">
                      {products.length === 0 ? 'Catalog initialized (0 items)' : `Tap items to bill (${products.length} products available)`}
                    </p>
                  </div>
                  {currentUser.role === 'OWNER' && (
                    <button
                      onClick={() => setShowAddProductModal(true)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1 shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Add Item</span>
                    </button>
                  )}
                </div>

                {products.length === 0 ? (
                  <div className="py-12 px-4 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 my-2">
                    <Package className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                    <h4 className="text-sm font-bold text-slate-800">No Products in POS Catalog</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                      Pre-populated dummy items have been removed. Once you add items from the Inventory or clicking the button below, only your added products will appear here.
                    </p>
                    {currentUser.role === 'OWNER' ? (
                      <button
                        onClick={() => setShowAddProductModal(true)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition inline-flex items-center shadow-sm"
                      >
                        <Plus className="w-4 h-4 mr-1.5" /> + Add First Product
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400 italic">
                        Ask store owner to register inventory products.
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[460px] overflow-y-auto pr-1">
                    {products.map(p => (
                      <button
                        key={p.id}
                        onClick={() => addToCart(p)}
                        className="text-left p-3 rounded-xl border border-slate-200 hover:border-indigo-400 bg-white hover:bg-indigo-50/40 transition flex flex-col justify-between group shadow-sm hover:shadow"
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono text-slate-400">{p.sku}</span>
                            <span className="text-[9px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{p.category}</span>
                          </div>
                          <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 line-clamp-2 mt-1">
                            {p.name}
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100">
                          <span className="text-xs font-black text-slate-900">₹{p.sellingPrice}</span>
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${p.quantity <= p.minStock ? 'bg-rose-100 text-rose-700 font-bold' : 'bg-slate-100 text-slate-600'}`}>
                            Stock: {p.quantity}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Cart on the Right */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center pb-3 border-b border-slate-200 mb-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Current Bill</h3>
                    <div className="flex items-center space-x-2 text-[11px] text-slate-500">
                      <span>Cashier: {currentUser.name}</span>
                      <span>&bull;</span>
                      <span className="font-bold text-emerald-700 flex items-center" title="Active physical cash expected in drawer till">
                        <Banknote className="w-3 h-3 mr-0.5" /> Till: ₹{expectedDrawerCash.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => {
                        setCashDropForm({ type: 'CASH_OUT', amount: '', reason: 'Vendor Payout (Milk/Bread)', notes: '' });
                        setShowCashDropModal(true);
                      }}
                      className="px-2 py-1 rounded-xl text-xs font-bold transition flex items-center space-x-1 border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
                      title="Log Mid-day Cash In / Drop Out"
                    >
                      <ArrowDownLeft className="w-3 h-3" />
                      <span>Drop</span>
                    </button>
                    {heldCarts.length > 0 && (
                      <button
                        onClick={() => setShowHeldCartsModal(true)}
                        className="px-2.5 py-1 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs flex items-center space-x-1 border border-amber-300 transition"
                        title="View Parked / Held Carts"
                      >
                        <Clock className="w-3.5 h-3.5 text-amber-700" />
                        <span>{heldCarts.length} Held</span>
                      </button>
                    )}
                    <button
                      onClick={handleHoldCart}
                      disabled={cart.length === 0}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition flex items-center space-x-1 border ${
                        cart.length > 0 ? 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100' : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                      }`}
                      title="Park current cart to bill next customer (Queue Buster)"
                    >
                      <PauseCircle className="w-3.5 h-3.5" />
                      <span>Hold</span>
                    </button>
                    <span className="text-xs font-bold px-2 py-1 rounded bg-indigo-50 text-indigo-700">
                      {cart.length} Items
                    </span>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Customer Name (For Udhaar / Loyalty / Receipt)
                  </label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => {
                      setSelectedCustomerId(Number(e.target.value));
                      setRedeemLoyaltyPoints(false);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.balance > 0 ? `(Khata Due: ₹${c.balance})` : ''} {c.loyaltyPoints > 0 ? `⭐ ${c.loyaltyPoints} pts` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Loyalty Points Redemption Widget */}
                {availableLoyaltyPoints > 0 && (
                  <div className="mb-3 p-2.5 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Award className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      <div>
                        <div className="text-[11px] font-bold text-amber-900">
                          {availableLoyaltyPoints} Loyalty Points Available (₹{availableLoyaltyPoints})
                        </div>
                        <div className="text-[10px] text-amber-700">1 Point = ₹1 redeemable discount</div>
                      </div>
                    </div>
                    <label className="flex items-center space-x-1.5 cursor-pointer text-xs font-bold text-amber-900 bg-white px-2 py-1 rounded-lg border border-amber-200 shadow-sm">
                      <input
                        type="checkbox"
                        checked={redeemLoyaltyPoints}
                        onChange={(e) => setRedeemLoyaltyPoints(e.target.checked)}
                        className="w-4 h-4 text-amber-600 rounded border-amber-300 focus:ring-amber-500"
                      />
                      <span>Redeem</span>
                    </label>
                  </div>
                )}

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1 mb-4">
                  {cart.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-400">
                      Cart is empty. Tap items on the left to add to bill.
                    </div>
                  ) : (
                    cart.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                        <div className="flex-1 pr-2">
                          <div className="font-bold text-slate-900">{item.product.name}</div>
                          <div className="text-[11px] text-slate-500">₹{item.product.sellingPrice} each</div>
                        </div>

                        <div className="flex items-center space-x-1.5">
                          <button
                            onClick={() => updateCartQty(item.product.id, -1)}
                            className="w-6 h-6 rounded bg-slate-200 hover:bg-slate-300 font-bold flex items-center justify-center text-xs"
                          >
                            -
                          </button>
                          <span className="w-5 text-center font-bold">{item.quantity}</span>
                          <button
                            onClick={() => updateCartQty(item.product.id, 1)}
                            className="w-6 h-6 rounded bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-bold flex items-center justify-center text-xs"
                          >
                            +
                          </button>
                        </div>

                        <div className="w-16 text-right font-black text-slate-900">
                          ₹{item.product.sellingPrice * item.quantity}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {cart.length > 0 && (
                  <div className="space-y-1.5 pt-3 border-t border-slate-200 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal</span>
                      <span>₹{cartSubtotal}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>GST (5%)</span>
                      <span>₹{cartGst}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Store Discount (₹)</span>
                      <input
                        type="number"
                        value={discountAmount}
                        onChange={(e) => setDiscountAmount(Math.max(0, Number(e.target.value)))}
                        className="w-16 text-right px-1 py-0.5 border border-slate-300 rounded text-xs"
                      />
                    </div>
                    {loyaltyDiscount > 0 && (
                      <div className="flex justify-between text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded">
                        <span>Loyalty Points Discount ({loyaltyDiscount} pts)</span>
                        <span>-₹{loyaltyDiscount}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                      <span>Total Payable</span>
                      <span className="text-indigo-600 text-base">₹{cartFinalTotal}</span>
                    </div>
                    <div className="text-[10px] text-emerald-700 font-semibold text-right pt-0.5 flex items-center justify-end">
                      <Sparkles className="w-3 h-3 mr-1 text-emerald-600" />
                      <span>Customer earns +{pointsEarnable} loyalty points on this bill</span>
                    </div>
                  </div>
                )}

                <div className="mt-4">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      onClick={() => {
                        setPaymentMode('CASH');
                        setSplitCashAmount('');
                        setSplitUpiAmount('');
                      }}
                      className={`p-2 rounded-xl text-xs font-bold border flex flex-col items-center justify-center transition ${paymentMode === 'CASH' ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}`}
                    >
                      <Banknote className="w-4 h-4 mb-1" />
                      <span>Cash</span>
                    </button>
                    <button
                      onClick={() => {
                        setPaymentMode('UPI');
                        setSplitCashAmount('');
                        setSplitUpiAmount('');
                      }}
                      className={`p-2 rounded-xl text-xs font-bold border flex flex-col items-center justify-center transition ${paymentMode === 'UPI' ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}`}
                    >
                      <Smartphone className="w-4 h-4 mb-1" />
                      <span>UPI</span>
                    </button>
                    <button
                      onClick={() => {
                        setPaymentMode('SPLIT');
                        const halfCash = Math.floor(cartFinalTotal / 2);
                        setSplitCashAmount(halfCash.toString());
                        setSplitUpiAmount((cartFinalTotal - halfCash).toString());
                      }}
                      className={`p-2 rounded-xl text-xs font-bold border flex flex-col items-center justify-center transition ${paymentMode === 'SPLIT' ? 'bg-purple-600 text-white border-purple-600 shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}`}
                    >
                      <Coins className="w-4 h-4 mb-1" />
                      <span>Split</span>
                    </button>
                    <button
                      onClick={() => {
                        setPaymentMode('CREDIT');
                        setSplitCashAmount('');
                        setSplitUpiAmount('');
                      }}
                      className={`p-2 rounded-xl text-xs font-bold border flex flex-col items-center justify-center transition ${paymentMode === 'CREDIT' ? 'bg-rose-600 text-white border-rose-600 shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}`}
                    >
                      <CreditCard className="w-4 h-4 mb-1" />
                      <span>Udhaar</span>
                    </button>
                  </div>
                </div>

                {/* SPLIT PAYMENT BREAKDOWN INPUTS */}
                {paymentMode === 'SPLIT' && (
                  <div className="mt-3 p-3 bg-purple-50/80 rounded-2xl border border-purple-200 text-xs space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-purple-900">
                      <span className="flex items-center space-x-1">
                        <Coins className="w-3.5 h-3.5 text-purple-600" />
                        <span>Split Payment Breakdown</span>
                      </span>
                      <span className="font-mono text-purple-700">Total: ₹{cartFinalTotal}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 block mb-1">Cash Part (₹)</label>
                        <input
                          type="number"
                          min="0"
                          max={cartFinalTotal}
                          value={splitCashAmount}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSplitCashAmount(val);
                            const num = Number(val) || 0;
                            setSplitUpiAmount(Math.max(0, cartFinalTotal - num).toString());
                          }}
                          placeholder="e.g. 500"
                          className="w-full px-2.5 py-1.5 bg-white border border-purple-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 block mb-1">UPI Part (₹)</label>
                        <input
                          type="number"
                          min="0"
                          max={cartFinalTotal}
                          value={splitUpiAmount}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSplitUpiAmount(val);
                            const num = Number(val) || 0;
                            setSplitCashAmount(Math.max(0, cartFinalTotal - num).toString());
                          }}
                          placeholder="e.g. 300"
                          className="w-full px-2.5 py-1.5 bg-white border border-purple-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                        />
                      </div>
                    </div>

                    <div className="text-[10px] flex items-center justify-between font-semibold pt-1 border-t border-purple-100 text-purple-800">
                      <span>Recorded: ₹{(Number(splitCashAmount) || 0) + (Number(splitUpiAmount) || 0)}</span>
                      <span>{(Number(splitCashAmount) || 0) + (Number(splitUpiAmount) || 0) === cartFinalTotal ? '✅ Balanced' : '⚠️ Must equal total'}</span>
                    </div>
                  </div>
                )}

                {/* CASH TENDER & CHANGE CALCULATOR */}
                {(paymentMode === 'CASH' || paymentMode === 'SPLIT') && (
                  <div className="mt-3 p-3 bg-emerald-50/70 rounded-2xl border border-emerald-200 text-xs space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-emerald-900">
                      <span className="flex items-center space-x-1">
                        <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Cash Tender & Change Calculator</span>
                      </span>
                      <span className="text-[10px] text-emerald-700 font-medium">Due Cash: ₹{paymentMode === 'SPLIT' ? (Number(splitCashAmount) || 0) : cartFinalTotal}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <div className="flex-1">
                        <input
                          type="number"
                          min="0"
                          value={tenderCashGiven}
                          onChange={(e) => setTenderCashGiven(e.target.value)}
                          placeholder="Customer gave ₹ (e.g. 2000)"
                          className="w-full px-2.5 py-1.5 bg-white border border-emerald-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                        />
                      </div>
                      <div className="flex space-x-1">
                        {[100, 200, 500, 2000].map(val => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setTenderCashGiven(val.toString())}
                            className="px-2 py-1 bg-white hover:bg-emerald-100 border border-emerald-200 rounded-lg text-[10px] font-bold text-emerald-800 transition"
                          >
                            ₹{val}
                          </button>
                        ))}
                      </div>
                    </div>

                    {Number(tenderCashGiven) > 0 && (
                      <div className="pt-1.5 border-t border-emerald-200/80 flex items-center justify-between">
                        <span className="text-[11px] font-bold text-emerald-900">Change to Return Customer:</span>
                        <span className={`text-sm font-black font-mono ${Number(tenderCashGiven) >= (paymentMode === 'SPLIT' ? (Number(splitCashAmount) || 0) : cartFinalTotal) ? 'text-emerald-700' : 'text-rose-600'}`}>
                          {Number(tenderCashGiven) >= (paymentMode === 'SPLIT' ? (Number(splitCashAmount) || 0) : cartFinalTotal)
                            ? `₹${Number(tenderCashGiven) - (paymentMode === 'SPLIT' ? (Number(splitCashAmount) || 0) : cartFinalTotal)}`
                            : `Short by ₹${(paymentMode === 'SPLIT' ? (Number(splitCashAmount) || 0) : cartFinalTotal) - Number(tenderCashGiven)}`}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* POS Dynamic Bill Payment QR Scanner Preview */}
                {cart.length > 0 && (
                  <div className="mt-4 p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-center justify-between gap-2.5">
                    <div className="flex-1">
                      <div className="flex items-center space-x-1 text-xs font-bold text-slate-800">
                        <QrCode className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Dynamic Bill Scanner</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {paymentMode === 'UPI' ? 'UPI QR code ready for instant checkout' : 'Instant barcode & bill scanner active'}
                      </p>
                      <div className="text-[10px] font-mono text-indigo-700 font-bold mt-1">
                        ₹{cartFinalTotal} &bull; Damani Retails
                      </div>
                    </div>
                    <div className="p-1 bg-white rounded-lg border border-slate-200 shadow-xs flex flex-col items-center">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&margin=1&data=${encodeURIComponent(`upi://pay?pa=damani@okaxis&pn=Damani+Retails&am=${cartFinalTotal}&cu=INR`)}`}
                        alt="POS Scanner"
                        className="w-14 h-14 object-contain rounded"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={handleGenerateBill}
                disabled={cart.length === 0}
                className={`mt-6 w-full py-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 shadow-sm ${
                  cart.length > 0 ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Printer className="w-4 h-4" />
                <span>Print &amp; Generate Tax Invoice</span>
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 4: INVENTORY & ITEMS */}
        {/* ============================================================== */}
        {activeTab === 'inventory' && (
          <div className="space-y-4">
            {/* Header & Quick Operations Bar */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center">
                  <Package className="w-5 h-5 mr-2 text-indigo-600" />
                  Inventory Items ({products.length} Products)
                </h3>
                <p className="text-xs text-slate-500">
                  Batch tracking (FIFO), expiry filters, stock valuation, CSV catalog import/export, and wastage logs
                </p>
              </div>

              {currentUser.role === 'OWNER' && (
                <div className="flex flex-wrap items-center gap-2">
                  {/* CSV Operations */}
                  <button
                    onClick={handleDownloadSampleCsv}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center space-x-1 border border-slate-200 shadow-sm"
                    title="Download Excel / CSV template for bulk onboarding"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-600" />
                    <span>Sample CSV</span>
                  </button>

                  <button
                    onClick={handleExportInventoryCsv}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center space-x-1 border border-slate-200 shadow-sm"
                    title="Export complete inventory to CSV"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-slate-600" />
                    <span>Export CSV</span>
                  </button>

                  <label className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition flex items-center space-x-1 cursor-pointer shadow-sm">
                    <Upload className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Import CSV</span>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleImportCsvFile}
                      className="hidden"
                    />
                  </label>

                  {/* Auto-Draft PO shortcut if low stock exists */}
                  {lowStockProductsList.length > 0 && (
                    <button
                      onClick={() => handleOpenAutoPo(lowStockProductsList[0])}
                      className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1 shadow-sm"
                      title="Auto-draft purchase order for low stock"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>⚡ Auto-Draft PO ({lowStockProductsList.length})</span>
                    </button>
                  )}

                  <button
                    onClick={() => setShowAddProductModal(true)}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Add More Items</span>
                  </button>
                </div>
              )}
            </div>

            {/* Stock Valuation & Wastage Summary KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Inventory Cost Valuation</div>
                <div className="text-xl font-black text-slate-900 mt-1">₹{totalStockCostValue.toLocaleString('en-IN')}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Asset value at wholesale purchase cost</div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Retail Catalog Value</div>
                <div className="text-xl font-black text-indigo-600 mt-1">₹{totalStockRetailValue.toLocaleString('en-IN')}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Estimated gross retail sales value</div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Projected Margin</div>
                <div className="text-xl font-black text-emerald-600 mt-1">₹{projectedGrossMargin.toLocaleString('en-IN')}</div>
                <div className="text-[11px] text-emerald-700 font-bold mt-0.5">+{projectedMarginPct}% Gross Margin</div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Stock Wastage &amp; Loss</div>
                <div className="text-xl font-black text-rose-600 mt-1">₹{totalWastageLoss.toLocaleString('en-IN')}</div>
                <div className="text-[11px] text-rose-700 font-medium mt-0.5">{wastageEntries.length} write-off incident(s)</div>
              </div>
            </div>

            {/* Near-Expiry Warning & Promotional Clearance Markdown Trigger */}
            {products.some(p => calculateDaysToExpiry(p.expiryDate) <= 15) && (
              <div className="bg-gradient-to-r from-rose-50 via-amber-50 to-orange-50 border-2 border-rose-300 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-md">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-rose-300">
                    <Percent className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-rose-900 flex items-center space-x-1.5">
                      <span>⚡ Clearance Discount Trigger:</span>
                      <span className="bg-rose-600 text-white px-2 py-0.5 rounded-full text-[10px] font-black uppercase">
                        {products.filter(p => calculateDaysToExpiry(p.expiryDate) <= 15).length} Items Expiring in &le;15 Days
                      </span>
                    </div>
                    <div className="text-[11px] text-rose-700 font-medium mt-0.5">
                      Automatically apply a 15% clearance promotional markdown to sell out stock before it becomes dead inventory and causes spoilage losses.
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleApplyClearanceMarkdownToAllNearExpiry(15)}
                    className="px-3.5 py-2 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white rounded-xl text-xs font-black transition shadow-sm flex items-center space-x-1 whitespace-nowrap"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Apply 15% Clearance to All (&le;15d)</span>
                  </button>
                  <button
                    onClick={() => {
                      setInventoryExpiryFilter('near-15');
                      setInventorySortBy('expiry-asc');
                    }}
                    className="px-3 py-2 bg-white hover:bg-rose-50 text-rose-800 border border-rose-200 rounded-xl text-xs font-bold transition whitespace-nowrap"
                  >
                    View &le;15d Stock
                  </button>
                </div>
              </div>
            )}

            {/* General Near-Expiry Warning Banner (30 days) */}
            {nearExpiryProductsList.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-amber-900">
                      ⚠️ Expiry Date Warning: {nearExpiryProductsList.length} product{nearExpiryProductsList.length > 1 ? 's' : ''} expiring within 30 days or already expired!
                    </div>
                    <div className="text-[11px] text-amber-700">
                      Sort or filter by expiry below to identify items needing immediate clearance discount or supplier returns.
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setInventoryExpiryFilter('near-30');
                      setInventorySortBy('expiry-asc');
                    }}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shadow-sm whitespace-nowrap"
                  >
                    Filter Near Expiry (&lt; 30d)
                  </button>
                  {inventoryExpiryFilter !== 'all' && (
                    <button
                      onClick={() => setInventoryExpiryFilter('all')}
                      className="px-2.5 py-1.5 bg-white border border-amber-200 text-amber-800 hover:bg-amber-100 rounded-xl text-xs font-semibold transition"
                    >
                      Show All
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Filtering & Sorting Controls Bar */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {/* 1. Search Bar */}
                <div className="lg:col-span-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Search Products
                  </label>
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Name or SKU..."
                      value={inventorySearch}
                      onChange={e => setInventorySearch(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* 2. Expiry Date Filter (Highlight) */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block mb-1 flex items-center">
                    <Calendar className="w-3 h-3 mr-1" /> Expiry Date Filter
                  </label>
                  <select
                    value={inventoryExpiryFilter}
                    onChange={e => setInventoryExpiryFilter(e.target.value)}
                    className="w-full bg-indigo-50/50 border border-indigo-200 rounded-xl px-3 py-2 text-xs font-bold text-indigo-950 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">📅 All Expiry Dates</option>
                    <option value="near-15">🔥 Urgent Clearance (&le; 15 Days)</option>
                    <option value="near-30">⚠️ Near Expiry (&lt; 30 Days)</option>
                    <option value="near-60">⏳ Expiring Soon (&lt; 60 Days)</option>
                    <option value="near-90">📆 Expiring (&lt; 90 Days)</option>
                    <option value="expired">🚨 Expired Already</option>
                  </select>
                </div>

                {/* 3. Sort Order (Highlight Expiry Nearest) */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block mb-1 flex items-center">
                    <ArrowUpDown className="w-3 h-3 mr-1" /> Sort Order
                  </label>
                  <select
                    value={inventorySortBy}
                    onChange={e => setInventorySortBy(e.target.value)}
                    className="w-full bg-indigo-50/50 border border-indigo-200 rounded-xl px-3 py-2 text-xs font-bold text-indigo-950 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="expiry-asc">⚡ Expiry: Nearest First (Urgent)</option>
                    <option value="expiry-desc">🗓️ Expiry: Furthest First</option>
                    <option value="stock-asc">📉 Stock: Low to High</option>
                    <option value="stock-desc">📈 Stock: High to Low</option>
                    <option value="price-asc">💲 Price: Low to High</option>
                    <option value="price-desc">💰 Price: High to Low</option>
                    <option value="name-asc">🔤 Product Name (A-Z)</option>
                  </select>
                </div>

                {/* 4. Category Filter */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Category Filter
                  </label>
                  <select
                    value={inventoryCategoryFilter}
                    onChange={e => setInventoryCategoryFilter(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">All Categories</option>
                    {availableCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* 5. Stock Filter & Reset */}
                <div className="flex items-end space-x-2">
                  <div className="flex-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Stock Level
                    </label>
                    <select
                      value={inventoryStockFilter}
                      onChange={e => setInventoryStockFilter(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="all">All Stocks</option>
                      <option value="low">⚠️ Low Stock (&le; Min)</option>
                    </select>
                  </div>
                  {(inventorySearch || inventoryCategoryFilter !== 'all' || inventoryExpiryFilter !== 'all' || inventoryStockFilter !== 'all' || inventorySortBy !== 'expiry-asc') && (
                    <button
                      onClick={() => {
                        setInventorySearch('');
                        setInventoryCategoryFilter('all');
                        setInventoryExpiryFilter('all');
                        setInventoryStockFilter('all');
                        setInventorySortBy('expiry-asc');
                      }}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
                      title="Reset All Filters"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>

              {/* Active Filter Indicator */}
              <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                <div className="flex items-center space-x-2">
                  <span>Showing <span className="font-bold text-slate-800">{filteredAndSortedProducts.length}</span> of {products.length} products</span>
                  {inventoryExpiryFilter !== 'all' && (
                    <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-bold">
                      Expiry Filter: {inventoryExpiryFilter === 'near-30' ? '< 30 Days' : inventoryExpiryFilter === 'near-60' ? '< 60 Days' : inventoryExpiryFilter === 'near-90' ? '< 90 Days' : 'Expired'}
                    </span>
                  )}
                  {inventorySortBy === 'expiry-asc' && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
                      Sorted: Nearest Expiry First
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400">
                  Bulk actions: Sample CSV, Export, or Import catalog
                </div>
              </div>
            </div>

            {/* Inventory Table / Empty States */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              {products.length === 0 ? (
                <div className="py-16 px-4 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                    <Package className="w-7 h-7" />
                  </div>
                  <h4 className="text-base font-bold text-slate-800">Inventory Catalog is Empty</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-5">
                    Pre-populated dummy items have been cleared. As the business owner, add your authentic store products, upload a CSV, or configure batches below.
                  </p>
                  {currentUser.role === 'OWNER' ? (
                    <div className="flex flex-wrap items-center justify-center gap-3">
                      <button
                        onClick={() => setShowAddProductModal(true)}
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition inline-flex items-center space-x-2 shadow-sm"
                      >
                        <Plus className="w-4 h-4" />
                        <span>+ Add First Product</span>
                      </button>
                      <button
                        onClick={handleDownloadSampleCsv}
                        className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition inline-flex items-center space-x-1.5"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download Sample CSV</span>
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 italic">
                      Contact store owner to add products to the catalog.
                    </span>
                  )}
                </div>
              ) : filteredAndSortedProducts.length === 0 ? (
                <div className="py-12 px-4 text-center">
                  <SlidersHorizontal className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <h4 className="text-sm font-bold text-slate-700">No Products Match Current Filters</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
                    Try loosening your expiry date or category filters to view more products.
                  </p>
                  <button
                    onClick={() => {
                      setInventorySearch('');
                      setInventoryCategoryFilter('all');
                      setInventoryExpiryFilter('all');
                      setInventoryStockFilter('all');
                      setInventorySortBy('expiry-asc');
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
                  >
                    Reset All Filters
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        <th className="py-3.5 px-4">Product ID &amp; Name</th>
                        <th className="py-3.5 px-4">Category</th>
                        <th className="py-3.5 px-4 text-center">Batches (FIFO)</th>
                        <th className="py-3.5 px-4 text-right">Purchase (₹)</th>
                        <th className="py-3.5 px-4 text-right">Selling (₹)</th>
                        <th className="py-3.5 px-4 text-center">Current Stock</th>
                        <th className="py-3.5 px-4 text-center">Min Stock</th>
                        <th className="py-3.5 px-4">Supplier Linkage</th>
                        <th className="py-3.5 px-4 text-center">Expiry Date &amp; Urgency</th>
                        <th className="py-3.5 px-4 text-right">Quick Stock</th>
                        {currentUser.role === 'OWNER' && (
                          <th className="py-3.5 px-4 text-center">Actions &amp; Operations</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredAndSortedProducts.map(p => {
                        const isLow = p.quantity <= p.minStock;
                        const days = calculateDaysToExpiry(p.expiryDate);
                        const isExpired = days <= 0;
                        const isNearExpiry = days > 0 && days <= 30;
                        const isSoonExpiry = days > 30 && days <= 60;
                        const batchCount = p.batches?.length || 1;

                        return (
                          <tr key={p.id} className={`hover:bg-slate-50 transition ${isExpired ? 'bg-rose-50/50' : isNearExpiry ? 'bg-amber-50/40' : isLow ? 'bg-rose-50/20' : ''}`}>
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900">{p.name}</div>
                              <div className="text-[11px] text-slate-400 font-mono">{p.sku}</div>
                              {isLow && (
                                <span className="text-[10px] font-black text-rose-600 block mt-0.5">
                                  ⚠️ Low Stock Alert
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium">
                                {p.category}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <button
                                onClick={() => handleOpenBatchModal(p)}
                                className="px-2 py-0.5 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] inline-flex items-center space-x-1 border border-indigo-200 transition"
                                title="Manage Batches & FIFO priority"
                              >
                                <Layers className="w-3 h-3" />
                                <span>{batchCount} Batch{batchCount > 1 ? 'es' : ''}</span>
                              </button>
                            </td>
                            <td className="py-3 px-4 text-right font-medium text-slate-600">₹{p.purchasePrice}</td>
                            <td className="py-3 px-4 text-right">
                              <span className="font-black text-slate-900">₹{p.sellingPrice}</span>
                              {p.clearanceMarkdown && (
                                <span className="block text-[10px] text-rose-600 font-extrabold line-through opacity-75">
                                  ₹{p.originalPrice}
                                </span>
                              )}
                              {p.clearanceMarkdown && (
                                <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 text-[9px] font-black">
                                  {p.clearanceMarkdown}% OFF
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className={`px-2.5 py-1 rounded-full font-black ${isLow ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-800'}`}>
                                {p.quantity} units
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center font-bold text-slate-500">{p.minStock} units</td>
                            <td className="py-3 px-4 text-slate-700 font-medium">
                              <div className="truncate max-w-[140px] font-medium text-slate-800">{p.supplier}</div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="font-semibold text-slate-800">{p.expiryDate}</div>
                              <div className="mt-0.5">
                                {isExpired ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200">
                                    🚨 Expired {Math.abs(days)}d ago
                                  </span>
                                ) : isNearExpiry ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                                    ⚠️ Expires in {days}d
                                  </span>
                                ) : isSoonExpiry ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-yellow-50 text-yellow-800 border border-yellow-200">
                                    ⏳ in {days} days
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-slate-400 font-medium">
                                    in {days} days
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="inline-flex items-center space-x-1">
                                <button
                                  onClick={() => handleStockUpdate(p.id, -1)}
                                  className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold flex items-center justify-center text-xs"
                                  title="Sold 1"
                                >
                                  -1
                                </button>
                                <button
                                  onClick={() => handleStockUpdate(p.id, 5)}
                                  className="w-7 h-7 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs"
                                  title="Restocked 5"
                                >
                                  +5
                                </button>
                              </div>
                            </td>
                            {currentUser.role === 'OWNER' && (
                              <td className="py-3 px-4 text-center">
                                <div className="inline-flex items-center space-x-1">
                                  {/* Manage Batches */}
                                  <button
                                    onClick={() => handleOpenBatchModal(p)}
                                    className="w-7 h-7 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 flex items-center justify-center transition"
                                    title="Add New Batch & Track FIFO"
                                  >
                                    <Layers className="w-3.5 h-3.5" />
                                  </button>
                                  {/* Log Wastage */}
                                  <button
                                    onClick={() => handleOpenWastage(p)}
                                    className="w-7 h-7 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 flex items-center justify-center transition"
                                    title="Log Damaged / Expired Wastage"
                                  >
                                    <AlertOctagon className="w-3.5 h-3.5" />
                                  </button>
                                  {/* Auto PO if low stock */}
                                  {isLow && (
                                    <button
                                      onClick={() => handleOpenAutoPo(p)}
                                      className="w-7 h-7 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 flex items-center justify-center transition"
                                      title="Auto-Draft Wholesale PO to Supplier"
                                    >
                                      <Share2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  {/* 15% Clearance Markdown Trigger for <= 15 days */}
                                  {days > 0 && days <= 15 && (
                                    <button
                                      onClick={() => handleApplyClearanceMarkdown(p.id, 15)}
                                      className="px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] flex items-center space-x-0.5 shadow-sm transition"
                                      title="Apply 15% Clearance Markdown Discount"
                                    >
                                      <Percent className="w-3 h-3" />
                                      <span>-15%</span>
                                    </button>
                                  )}
                                  {/* Delete Item */}
                                  <button
                                    onClick={() => handleDeleteProduct(p.id)}
                                    className="w-7 h-7 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-800 flex items-center justify-center transition"
                                    title="Delete Product"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 5: EMPLOYEES LIST (Owner Only) */}
        {/* ============================================================== */}
        {activeTab === 'employees' && currentUser.role === 'OWNER' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-slate-900">Employees &amp; Staff Management</h3>
                <p className="text-xs text-slate-500">Add employees and manage cashier/helper accounts</p>
              </div>
              <button
                onClick={() => setShowAddEmployeeModal(true)}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-sm"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Add New Employee</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">Employee Name</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Login Email &amp; Phone</th>
                    <th className="py-3 px-4">Shift</th>
                    <th className="py-3 px-4 text-right">Monthly Salary (₹)</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {employees.map(emp => (
                    <tr key={emp.id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center space-x-2">
                        <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                          {emp.name[0]}
                        </div>
                        <span>{emp.name}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-semibold text-[11px]">
                          {emp.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{emp.email}</div>
                        <div className="text-[11px] text-slate-400">{emp.phone}</div>
                        {emp.password && (
                          <div className="mt-1 inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-indigo-50 border border-indigo-100 text-indigo-700 font-mono text-[10px] font-bold">
                            <Lock className="w-2.5 h-2.5" />
                            <span>Pass: {emp.password}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{emp.shift}</td>
                      <td className="py-3.5 px-4 text-right font-black text-slate-900">₹{emp.salary.toLocaleString('en-IN')}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                          {emp.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 5B: CASH DRAWER & SHIFTS (Hisab-Kitab & Staff Leaderboard) */}
        {/* ============================================================== */}
        {activeTab === 'shifts' && currentUser.role === 'OWNER' && (
          <div className="space-y-6">
            {/* Header & Quick Shift Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center">
                  <Landmark className="w-5 h-5 mr-2 text-indigo-600" /> Cash Drawer Float &amp; Shift Reconciler
                </h3>
                <p className="text-xs text-slate-500">
                  Morning cash float, mid-day petty cash drops, daily hisab-kitab, and cashier sales leaderboard
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    setTempOpeningFloat(String(activeShift?.openingFloat || 2000));
                    setShowOpeningFloatModal(true);
                  }}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 border border-slate-200"
                >
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <span>Set Opening Float</span>
                </button>
                <button
                  onClick={() => {
                    setCashDropForm({ type: 'CASH_OUT', amount: '', reason: 'Vendor Payout (Milk/Bread)', notes: '' });
                    setShowCashDropModal(true);
                  }}
                  className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-sm"
                >
                  <ArrowDownLeft className="w-4 h-4" />
                  <span>+ Cash Drop (In/Out)</span>
                </button>
                <button
                  onClick={() => {
                    setPhysicalCashCounted('');
                    setDenominations({ 500: '', 200: '', 100: '', 50: '', 20: '', 10: '' });
                    setShiftClosingNotes('');
                    setShowCloseShiftModal(true);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-sm"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Reconcile &amp; Close Shift</span>
                </button>
              </div>
            </div>

            {/* Active Drawer Hisab Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Opening Cash Float</div>
                <div className="text-xl font-black text-slate-800 mt-1">₹{(activeShift?.openingFloat || 0).toLocaleString('en-IN')}</div>
                <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
                  <span>Shift: {activeShift?.shiftName}</span>
                  <button onClick={() => { setTempOpeningFloat(String(activeShift?.openingFloat || 2000)); setShowOpeningFloatModal(true); }} className="text-indigo-600 font-bold hover:underline">Edit</button>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Cash Sales (Active Shift)</div>
                <div className="text-xl font-black text-indigo-600 mt-1">₹{currentShiftCashSales.toLocaleString('en-IN')}</div>
                <div className="mt-2 text-[11px] text-slate-500">
                  {activeShiftBills.filter(b => b.paymentMode === 'CASH').length} cash bills &bull; Cashier: {activeShift?.cashierName}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Mid-day Cash In / Out</div>
                <div className="text-xl font-black text-slate-800 mt-1 flex items-center space-x-2">
                  <span className="text-emerald-600">+₹{currentShiftCashIn}</span>
                  <span className="text-slate-300">/</span>
                  <span className="text-rose-600">-₹{currentShiftCashOut}</span>
                </div>
                <div className="mt-2 text-[11px] text-slate-500">
                  {currentShiftCashDrops.length} drops recorded today
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border-2 border-emerald-500/70 shadow-sm bg-emerald-50/30">
                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 flex items-center justify-between">
                  <span>Expected Drawer Cash</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-extrabold text-[9px]">LIVE</span>
                </div>
                <div className="text-2xl font-black text-emerald-700 mt-1">₹{expectedDrawerCash.toLocaleString('en-IN')}</div>
                <div className="mt-2 text-[11px] font-semibold text-emerald-800">
                  Must be physically present in till
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Digital / UPI Sales</div>
                <div className="text-xl font-black text-emerald-600 mt-1">₹{currentShiftUpiSales.toLocaleString('en-IN')}</div>
                <div className="mt-2 text-[11px] text-slate-500">
                  Bank direct credit (Not in physical till)
                </div>
              </div>
            </div>

            {/* Cashier Shift Performance & Sales Leaderboard */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center">
                    <Trophy className="w-4 h-4 mr-1.5 text-amber-500" /> Cashier Performance &amp; Sales Leaderboard
                  </h4>
                  <p className="text-xs text-slate-500">
                    Track billing velocity, revenue generated, and earned staff commission bonuses
                  </p>
                </div>
                <span className="text-[11px] font-bold px-3 py-1 bg-amber-50 text-amber-900 rounded-full border border-amber-200 flex items-center">
                  <Award className="w-3.5 h-3.5 mr-1 text-amber-600" /> Staff Incentive: 1% Sales + ₹5 / Bill
                </span>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-3 px-4">Rank</th>
                      <th className="py-3 px-4">Cashier / Staff Member</th>
                      <th className="py-3 px-4 text-center">Bills Processed</th>
                      <th className="py-3 px-4 text-right">Revenue Generated</th>
                      <th className="py-3 px-4 text-center">Cash vs UPI</th>
                      <th className="py-3 px-4 text-right">Monthly Salary (₹)</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cashierLeaderboard.map((cashier, idx) => (
                      <tr key={cashier.id} className={idx === 0 ? 'bg-amber-50/30' : 'hover:bg-slate-50'}>
                        <td className="py-3 px-4 font-black">
                          {idx === 0 ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-bold">
                              🥇 #1 Top
                            </span>
                          ) : idx === 1 ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 text-xs font-bold">
                              🥈 #2
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 text-xs font-bold">
                              🥉 #{idx + 1}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 flex items-center space-x-2">
                            <span>{cashier.name}</span>
                            {idx === 0 && <Sparkles className="w-3.5 h-3.5 text-amber-500" />}
                          </div>
                          <div className="text-[11px] text-slate-400">{cashier.role} &bull; {cashier.shift}</div>
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-slate-900">
                          {cashier.totalBills} Bills
                        </td>
                        <td className="py-3 px-4 text-right font-black text-indigo-600 text-sm">
                          ₹{cashier.totalSales.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="text-[11px] font-semibold text-slate-600">
                            ₹{cashier.cashSales.toLocaleString('en-IN')} (C) / ₹{cashier.upiSales.toLocaleString('en-IN')} (U)
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-black text-emerald-700">
                          ₹{(employees.find(e => e.id === cashier.id)?.salary || 25000).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                            ACTIVE
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mid-day Cash Drops Ledger & Closed Shifts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Mid-day Petty Cash Drops Ledger */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-3">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Active Shift Cash Drops / In-Out ({currentShiftCashDrops.length})</h4>
                      <p className="text-[11px] text-slate-500">Mid-day petty expenses, vendor payouts, or bank drops</p>
                    </div>
                    <button
                      onClick={() => {
                        setCashDropForm({ type: 'CASH_OUT', amount: '', reason: 'Vendor Payout (Milk/Bread)', notes: '' });
                        setShowCashDropModal(true);
                      }}
                      className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold rounded-xl text-xs border border-amber-200 transition flex items-center space-x-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Log Drop</span>
                    </button>
                  </div>

                  {currentShiftCashDrops.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      No mid-day cash movements logged for active shift. All cash received stays in till.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {currentShiftCashDrops.map(drop => (
                        <div key={drop.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${drop.type === 'CASH_OUT' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}`}>
                                {drop.type === 'CASH_OUT' ? 'CASH DROP OUT' : 'CASH IN'}
                              </span>
                              <span className="font-bold text-slate-800">{drop.reason}</span>
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {drop.timestamp} &bull; Recorded by: {drop.cashier} {drop.notes ? `&bull; Note: ${drop.notes}` : ''}
                            </div>
                          </div>
                          <span className={`font-black text-sm ${drop.type === 'CASH_OUT' ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {drop.type === 'CASH_OUT' ? '-' : '+'}₹{drop.amount.toLocaleString('en-IN')}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Past Reconciled Shifts (Audit Ledger) */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-3">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Reconciled Shift History ({closedShifts.length})</h4>
                      <p className="text-[11px] text-slate-500">Historical shift close audits and cash discrepancy reports</p>
                    </div>
                  </div>

                  {closedShifts.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      No shifts closed yet in this session. Reconcile active shift at end of day to log audit records.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {closedShifts.map(shift => (
                        <div key={shift.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-mono font-bold text-indigo-700">{shift.id}</span>
                              <span className="font-semibold text-slate-900">{shift.cashierName}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                shift.status === 'BALANCED' ? 'bg-emerald-100 text-emerald-800' :
                                shift.status === 'SHORTAGE' ? 'bg-rose-100 text-rose-800' :
                                'bg-amber-100 text-amber-800'
                              }`}>
                                {shift.status === 'BALANCED' ? 'BALANCED' : `${shift.status}: ${shift.discrepancy > 0 ? '+' : ''}₹${shift.discrepancy}`}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {shift.startDate} ({shift.startTime} - {shift.endTime}) &bull; {shift.billsCount} Bills &bull; Actual: ₹{shift.actualCash.toLocaleString('en-IN')}
                            </div>
                          </div>
                          <button
                            onClick={() => handleOpenShiftAudit(shift)}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                            title="Inspect Hisab Breakdown"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 6: SUPPLIERS (Owner Only) */}
        {/* ============================================================== */}
        {activeTab === 'suppliers' && currentUser.role === 'OWNER' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Wholesale Suppliers &amp; Vendors</h3>
                <p className="text-xs text-slate-500">Add suppliers, track wholesale pending dues, and issue purchase orders</p>
              </div>
              <div className="flex items-center space-x-2">
                {lowStockProductsList.length > 0 && (
                  <button
                    onClick={() => handleOpenAutoPo(lowStockProductsList[0])}
                    className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-sm"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>⚡ Auto-Draft PO ({lowStockProductsList.length} low)</span>
                  </button>
                )}
                <button
                  onClick={() => setShowAddSupplierModal(true)}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add New Supplier</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {suppliers.map(s => (
                <div key={s.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Supplier #{s.id}</span>
                    <h4 className="text-sm font-bold text-slate-900 mt-1">{s.name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Contact: {s.contact}</p>
                    <p className="text-xs text-slate-400">{s.phone}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-medium">Pending Dues:</span>
                    <span className="font-black text-rose-600">₹{s.dues.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Purchase Orders */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">Active Wholesale Purchase Orders ({purchaseOrders.length})</h4>
              </div>
              {purchaseOrders.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 text-xs text-slate-400">
                  No active wholesale purchase orders. Use "⚡ Auto-Draft PO" from Inventory or Low Stock to draft one with 1-click WhatsApp order.
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-3 px-4">PO Number</th>
                      <th className="py-3 px-4">Supplier</th>
                      <th className="py-3 px-4">Items Summary</th>
                      <th className="py-3 px-4 text-right">Amount (₹)</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-center">Payment</th>
                      <th className="py-3 px-4 text-right">Expected Delivery</th>
                      <th className="py-3 px-4 text-center">Share / WhatsApp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {purchaseOrders.map(po => (
                      <tr key={po.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-bold font-mono text-slate-900">{po.id}</td>
                        <td className="py-3 px-4 font-medium text-slate-800">{po.supplier}</td>
                        <td className="py-3 px-4 text-slate-600">{po.items}</td>
                        <td className="py-3 px-4 text-right font-black text-slate-900">₹{po.amount.toLocaleString('en-IN')}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
                            {po.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${po.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-700' : po.paymentStatus === 'PARTIAL' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                            {po.paymentStatus}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-slate-500">{po.deliveryDate}</td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => {
                              const supp = suppliers.find(s => s.name === po.supplier);
                              const cleanPhone = (supp?.phone || '+91-98200-11223').replace(/[^0-9]/g, '');
                              const msg = `*PURCHASE ORDER: ${po.id}*\n*Supplier:* ${po.supplier}\n*Items:* ${po.items}\n*Amount:* ₹${po.amount}\n*Delivery Date:* ${po.deliveryDate}\n*From:* ${business.name}`;
                              window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`, '_blank');
                            }}
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition inline-flex items-center space-x-1 font-bold text-[11px]"
                            title="Share Wholesale PO via WhatsApp"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 7: CUSTOMERS, KHATA & LOYALTY */}
        {/* ============================================================== */}
        {activeTab === 'customers' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-slate-900">Customer CRM, Loyalty Points &amp; Khata Ledger</h3>
                <p className="text-xs text-slate-500">Track customer credit balances, loyalty points, lifetime spend, and purchase history</p>
              </div>
              <button
                onClick={() => setShowAddCustomerModal(true)}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Customer</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">Customer Name &amp; Area</th>
                    <th className="py-3 px-4">Phone</th>
                    <th className="py-3 px-4 text-center">Loyalty Points</th>
                    <th className="py-3 px-4 text-center">Visits</th>
                    <th className="py-3 px-4 text-right">Lifetime Spend</th>
                    <th className="py-3 px-4 text-right">Credit Limit</th>
                    <th className="py-3 px-4 text-right">Current Udhaar (Due)</th>
                    <th className="py-3 px-4 text-center">Profile &amp; Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customers.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{c.name}</div>
                        <div className="text-[11px] text-slate-400">{c.city}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-mono">{c.phone}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-amber-100 text-amber-900 inline-flex items-center space-x-1 border border-amber-200">
                          <Award className="w-3 h-3 text-amber-600" />
                          <span>{c.loyaltyPoints || 0} pts</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-700">{c.totalVisits || 0} bills</td>
                      <td className="py-3.5 px-4 text-right font-black text-slate-900">₹{(c.lifetimeSpent || 0).toLocaleString('en-IN')}</td>
                      <td className="py-3.5 px-4 text-right text-slate-500 font-medium">₹{c.limit.toLocaleString('en-IN')}</td>
                      <td className="py-3.5 px-4 text-right">
                        <span className={`font-black ${c.balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                          ₹{c.balance.toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center space-x-1.5">
                          <button
                            onClick={() => handleOpenCustomerHistory(c)}
                            className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold transition flex items-center space-x-1"
                            title="View Purchase History & Analytics"
                          >
                            <Eye className="w-3 h-3" />
                            <span>History</span>
                          </button>
                          {c.balance > 0 && (
                            <button
                              onClick={() => {
                                setSelectedKhataCustomer(c);
                                setKhataPaymentAmount(c.balance.toString());
                                setKhataPaymentNote('');
                                setShowKhataPaymentModal(true);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[11px] font-bold transition"
                            >
                              Receive
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 8: EXPENSES & PROFIT (Owner Only) */}
        {/* ============================================================== */}
        {activeTab === 'expenses' && currentUser.role === 'OWNER' && (
          <div className="space-y-6">
            {/* Header & Log Expense Button */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center">
                  <Wallet className="w-5 h-5 mr-2 text-rose-600" /> Overhead Expenses &amp; Estimated Net Profit
                </h3>
                <p className="text-xs text-slate-500">
                  Select calendar dates to analyze periodic overhead and real-time net profitability
                </p>
              </div>
              <button
                onClick={() => setShowAddExpenseModal(true)}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>+ Log New Expense</span>
              </button>
            </div>

            {/* Calendar Date Filter Bar */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-600 flex items-center">
                  <Calendar className="w-4 h-4 mr-1 text-indigo-600" /> Date Filter:
                </span>
                <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                  {[
                    { id: 'all', label: 'All Time' },
                    { id: 'today', label: 'Today' },
                    { id: 'month', label: 'This Month' },
                    { id: 'custom', label: 'Specific Date Range' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setExpenseFilterMode(tab.id)}
                      className={`px-3 py-1 rounded-lg transition ${expenseFilterMode === tab.id ? 'bg-white text-indigo-700 shadow-sm font-black' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Specific Period Date Pickers using Calendar */}
              {expenseFilterMode === 'custom' && (
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <div className="flex items-center space-x-1">
                    <span className="text-slate-500 font-semibold">From:</span>
                    <input
                      type="date"
                      value={expenseStartDate}
                      onChange={e => setExpenseStartDate(e.target.value)}
                      className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-slate-500 font-semibold">To:</span>
                    <input
                      type="date"
                      value={expenseEndDate}
                      onChange={e => setExpenseEndDate(e.target.value)}
                      className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Dynamic P&L Ledger Cards for Selected Period */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-md">
              <div className="flex justify-between items-center pb-2 border-b border-white/10">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                  {expenseFilterMode === 'all' ? 'All-Time P&L Ledger' :
                   expenseFilterMode === 'today' ? "Today's P&L Ledger" :
                   expenseFilterMode === 'month' ? "This Month's P&L Ledger" : "Custom Period P&L Ledger"}
                </span>
                <span className="text-[11px] font-mono text-slate-300">
                  {filteredExpensesList.length} expenses logged
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-4">
                <div>
                  <div className="text-xs text-indigo-200">Total Sales in Period</div>
                  <div className="text-2xl font-black text-white mt-1">₹{periodSalesPnl.toLocaleString('en-IN')}</div>
                  <div className="text-[11px] text-slate-400 mt-1">{periodBillsForPnl.length} bills processed</div>
                </div>
                <div>
                  <div className="text-xs text-indigo-200">Total Overhead Expenses</div>
                  <div className="text-2xl font-black text-rose-400 mt-1">-₹{periodExpensesSum.toLocaleString('en-IN')}</div>
                  <div className="text-[11px] text-rose-300/80 mt-1">{filteredExpensesList.length} expense items</div>
                </div>
                <div>
                  <div className="text-xs text-indigo-200">Est. Cost of Goods (COGS)</div>
                  <div className="text-2xl font-black text-slate-300 mt-1">-₹{periodCogsPnl.toLocaleString('en-IN')}</div>
                  <div className="text-[11px] text-slate-400 mt-1">Wholesale inventory cost</div>
                </div>
                <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-xl">
                  <div className="text-xs font-bold text-emerald-300">Estimated Net Profit</div>
                  <div className="text-2xl font-black text-emerald-400 mt-0.5">₹{periodNetProfitPnl.toLocaleString('en-IN')}</div>
                  <div className="text-[11px] font-bold text-emerald-300/80 mt-1">{periodMarginPnl}% Net Margin</div>
                </div>
              </div>
            </div>

            {/* Expenses Table with Calendar Dates & Notes */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Logged Expense Entries ({filteredExpensesList.length})
                </h4>
                <button
                  onClick={() => setShowAddExpenseModal(true)}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" /> <span>Add Expense</span>
                </button>
              </div>

              {filteredExpensesList.length === 0 ? (
                <div className="py-12 px-4 text-center bg-slate-50/50">
                  <Wallet className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <h4 className="text-sm font-bold text-slate-700">No Expenses Recorded for this Timeframe</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
                    Track your business outgoings: shop rent, electricity, helper salaries, transport freight, and store maintenance.
                  </p>
                  <button
                    onClick={() => setShowAddExpenseModal(true)}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm transition inline-flex items-center space-x-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> <span>+ Log New Expense</span>
                  </button>
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-3 px-4">Expense Description</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4 text-right">Amount (₹)</th>
                      <th className="py-3 px-4">Note / Remarks</th>
                      <th className="py-3 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredExpensesList.map(e => (
                      <tr key={e.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-bold text-slate-900">{e.title}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold">
                            {e.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-medium flex items-center space-x-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 mr-1" />
                          <span>{e.date}</span>
                        </td>
                        <td className="py-3 px-4 text-right font-black text-rose-600">₹{e.amount.toLocaleString('en-IN')}</td>
                        <td className="py-3 px-4 text-slate-600 max-w-xs">
                          {e.notes ? (
                            <div className="flex items-start space-x-1">
                              <FileText className="w-3.5 h-3.5 text-indigo-500 mt-0.5 shrink-0" />
                              <span className="line-clamp-2">{e.notes}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">No notes</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => {
                              setSelectedExpenseForNote(e);
                              setExpenseNoteText(e.notes || '');
                              setShowEditExpenseNoteModal(true);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] transition inline-flex items-center space-x-1"
                          >
                            <Edit3 className="w-3 h-3 text-slate-500" />
                            <span>{e.notes ? 'Edit Note' : 'Add Note'}</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}


      </div>

      {/* ============================================================== */}
      {/* OWNER MODAL 1: ADD NEW PRODUCT / ITEM */}
      {/* ============================================================== */}
      {showAddProductModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center">
                  <Plus className="w-4 h-4 mr-1 text-indigo-600" /> Add New Inventory Item
                </h3>
                <p className="text-xs text-slate-500">New item registration</p>
              </div>
              <button onClick={() => setShowAddProductModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddProductSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Product / Item Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tata Tea Gold 500g, Dettol Handwash..."
                  value={newProduct.name}
                  onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category</label>
                  <select
                    value={newProduct.category}
                    onChange={e => setNewProduct({ ...newProduct, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  >
                    <option value="Staples & Grains">Staples &amp; Grains</option>
                    <option value="Edible Oils & Ghee">Edible Oils &amp; Ghee</option>
                    <option value="Dairy & Breakfast">Dairy &amp; Breakfast</option>
                    <option value="FMCG & Packaged Foods">FMCG &amp; Packaged Foods</option>
                    <option value="Personal Care">Personal Care</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">SKU Barcode</label>
                  <input
                    type="text"
                    placeholder="e.g. GROC-TEA-009"
                    value={newProduct.sku}
                    onChange={e => setNewProduct({ ...newProduct, sku: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Purchase Price (₹) *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 210"
                    value={newProduct.purchasePrice}
                    onChange={e => setNewProduct({ ...newProduct, purchasePrice: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Selling Price (₹) *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 250"
                    value={newProduct.sellingPrice}
                    onChange={e => setNewProduct({ ...newProduct, sellingPrice: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Initial Stock Qty *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 25"
                    value={newProduct.quantity}
                    onChange={e => setNewProduct({ ...newProduct, quantity: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Min. Stock Alert Level</label>
                  <input
                    type="number"
                    value={newProduct.minStock}
                    onChange={e => setNewProduct({ ...newProduct, minStock: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Supplier Linkage</label>
                  <select
                    value={newProduct.supplier}
                    onChange={e => setNewProduct({ ...newProduct, supplier: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  >
                    {suppliers.map(s => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={newProduct.expiryDate}
                    onChange={e => setNewProduct({ ...newProduct, expiryDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex space-x-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm transition"
                >
                  Save Item to Inventory
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* OWNER MODAL 2: ADD EMPLOYEE */}
      {/* ============================================================== */}
      {showAddEmployeeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center">
                  <UserPlus className="w-4 h-4 mr-1 text-indigo-600" /> Onboard New Employee
                </h3>
                <p className="text-xs text-slate-500">Employee will be able to log in with this email</p>
              </div>
              <button onClick={() => setShowAddEmployeeModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddEmployeeSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Employee Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar, Sunita Rao..."
                  value={newEmployee.name}
                  onChange={e => setNewEmployee({ ...newEmployee, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Assigned Role</label>
                <select
                  value={newEmployee.role}
                  onChange={e => setNewEmployee({ ...newEmployee, role: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                >
                  <option value="Cashier & POS Operator">Cashier &amp; POS Operator (Billing only)</option>
                  <option value="Inventory & Stock In-charge">Inventory &amp; Stock In-charge</option>
                  <option value="Store Helper & Logistics">Store Helper &amp; Logistics</option>
                </select>
              </div>

              {/* Login Credentials for Staff */}
              <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl space-y-2.5">
                <div className="text-[11px] font-bold text-indigo-900 flex items-center">
                  <Lock className="w-3.5 h-3.5 mr-1 text-indigo-600" />
                  Staff Login Credentials
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Staff Login Email ID *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. cashier1@bizsmart.in"
                    value={newEmployee.email}
                    onChange={e => setNewEmployee({ ...newEmployee, email: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900"
                  />
                  <p className="text-[10px] text-slate-500 mt-0.5">Staff will enter this email at the login screen.</p>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Staff Login Password *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. staff123"
                    value={newEmployee.password}
                    onChange={e => setNewEmployee({ ...newEmployee, password: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900 font-mono"
                  />
                  <p className="text-[10px] text-slate-500 mt-0.5">Set a secure password to give your employee.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91-98765-43210"
                    value={newEmployee.phone}
                    onChange={e => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Monthly Salary (₹)</label>
                  <input
                    type="number"
                    placeholder="22000"
                    value={newEmployee.salary}
                    onChange={e => setNewEmployee({ ...newEmployee, salary: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Shift Timing</label>
                <select
                  value={newEmployee.shift}
                  onChange={e => setNewEmployee({ ...newEmployee, shift: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                >
                  <option value="Morning (8 AM - 4 PM)">Morning (8 AM - 4 PM)</option>
                  <option value="Evening (2 PM - 10 PM)">Evening (2 PM - 10 PM)</option>
                  <option value="Full Day (9 AM - 7 PM)">Full Day (9 AM - 7 PM)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex space-x-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm transition"
                >
                  Confirm Employee Onboarding
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddEmployeeModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* OWNER MODAL 3: ADD SUPPLIER */}
      {/* ============================================================== */}
      {showAddSupplierModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center">
                  <Truck className="w-4 h-4 mr-1 text-indigo-600" /> Onboard Wholesale Supplier
                </h3>
                <p className="text-xs text-slate-500">Supplier can log in with their email</p>
              </div>
              <button onClick={() => setShowAddSupplierModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSupplierSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Company / Agency Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Parle Agro Distributors, Dabur Agency..."
                  value={newSupplier.name}
                  onChange={e => setNewSupplier({ ...newSupplier, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Contact Person *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Manjeet Singh (Sales Manager)"
                  value={newSupplier.contact}
                  onChange={e => setNewSupplier({ ...newSupplier, contact: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+91-98111-22334"
                    value={newSupplier.phone}
                    onChange={e => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Initial Due (₹)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={newSupplier.dues}
                    onChange={e => setNewSupplier({ ...newSupplier, dues: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Warehouse Address</label>
                <input
                  type="text"
                  placeholder="e.g. Transport Nagar, Phase 2, Delhi"
                  value={newSupplier.address}
                  onChange={e => setNewSupplier({ ...newSupplier, address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex space-x-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm transition"
                >
                  Save Supplier
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddSupplierModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* ============================================================== */}
      {/* INVOICE PRINT MODAL */}
      {/* ============================================================== */}
      {showInvoiceModal && lastGeneratedBill && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="text-center pb-4 border-b border-slate-200">
              <h2 className="text-lg font-black text-slate-900">{business.name}</h2>
              <p className="text-[11px] text-slate-500">{business.address}</p>
              <p className="text-[10px] text-slate-400 font-mono">GSTIN: {business.gstin} &bull; Ph: {business.phone}</p>
              <div className="mt-2 inline-block px-3 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-800">
                TAX INVOICE &bull; {lastGeneratedBill.billNo}
              </div>
            </div>

            <div className="py-3 text-xs flex justify-between border-b border-slate-100">
              <div>
                <span className="text-slate-400 block text-[10px]">BILLED TO:</span>
                <span className="font-bold text-slate-900">{lastGeneratedBill.customer.name}</span>
                <span className="block text-slate-500 text-[11px]">{lastGeneratedBill.customer.phone}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block text-[10px]">DATE &amp; CASHIER:</span>
                <span className="font-medium text-slate-700">{lastGeneratedBill.date}</span>
                <span className="block text-indigo-600 font-semibold">{lastGeneratedBill.cashier}</span>
              </div>
            </div>

            <div className="py-3 border-b border-slate-200">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-400 text-[10px] font-bold uppercase border-b border-slate-100 pb-1">
                    <th className="text-left pb-1">Item</th>
                    <th className="text-center pb-1">Qty</th>
                    <th className="text-right pb-1">Rate</th>
                    <th className="text-right pb-1">Amt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {lastGeneratedBill.items.map((item, idx) => (
                    <tr key={idx} className="py-1">
                      <td className="py-1 font-medium text-slate-800">{item.product.name}</td>
                      <td className="py-1 text-center font-bold">{item.quantity}</td>
                      <td className="py-1 text-right text-slate-500">₹{item.product.sellingPrice}</td>
                      <td className="py-1 text-right font-bold text-slate-900">₹{item.product.sellingPrice * item.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="py-3 space-y-1 text-xs border-b border-slate-200">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span>₹{lastGeneratedBill.subtotal}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>GST (5%)</span>
                <span>₹{lastGeneratedBill.gst}</span>
              </div>
              {lastGeneratedBill.discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Special Discount</span>
                  <span>-₹{lastGeneratedBill.discount}</span>
                </div>
              )}
              {lastGeneratedBill.loyaltyDiscount > 0 && (
                <div className="flex justify-between text-amber-800 font-medium">
                  <span>Loyalty Points Redeemed</span>
                  <span>-₹{lastGeneratedBill.loyaltyDiscount}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                <span>Grand Total</span>
                <span className="text-indigo-600 text-base">₹{lastGeneratedBill.total}</span>
              </div>
              <div className="flex justify-between text-[11px] font-bold text-slate-600 pt-1">
                <span>Payment Mode</span>
                <span className={`px-2 py-0.5 rounded ${lastGeneratedBill.paymentMode === 'SPLIT' ? 'bg-purple-100 text-purple-800' : 'bg-indigo-50 text-indigo-700'}`}>
                  {lastGeneratedBill.paymentMode}
                </span>
              </div>
              {lastGeneratedBill.paymentMode === 'SPLIT' && (
                <div className="p-2 bg-purple-50/80 rounded-xl border border-purple-100 text-[11px] space-y-1">
                  <div className="flex justify-between text-purple-900 font-semibold">
                    <span>💵 Paid in Cash:</span>
                    <span className="font-mono font-bold">₹{lastGeneratedBill.splitCash || 0}</span>
                  </div>
                  <div className="flex justify-between text-purple-900 font-semibold">
                    <span>📱 Paid via UPI:</span>
                    <span className="font-mono font-bold">₹{lastGeneratedBill.splitUpi || 0}</span>
                  </div>
                </div>
              )}
              {lastGeneratedBill.changeReturned > 0 && (
                <div className="flex justify-between text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-1 rounded-lg">
                  <span>Change Returned to Customer</span>
                  <span className="font-mono">₹{lastGeneratedBill.changeReturned}</span>
                </div>
              )}
              <div className="flex justify-between text-[11px] font-bold text-emerald-700 pt-1 bg-emerald-50/70 p-2 rounded-lg">
                <span className="flex items-center">
                  <Sparkles className="w-3 h-3 mr-1 text-emerald-600" /> Points Earned on this Bill
                </span>
                <span>+{lastGeneratedBill.pointsEarned || 0} pts</span>
              </div>
            </div>

            {/* Bill Payment QR Code & Scanner Box */}
            <div className="my-3 p-3 bg-gradient-to-br from-indigo-50/70 via-slate-50 to-emerald-50/50 rounded-2xl border border-indigo-100/80 flex items-center justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-900 mb-0.5">
                  <QrCode className="w-4 h-4 text-indigo-600" />
                  <span>Scan to Pay &amp; Verify Bill</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-tight">
                  Scan via any UPI App (GPay, PhonePe, Paytm) or barcode reader to instantly settle ₹{lastGeneratedBill.total}
                </p>
                <div className="mt-1.5 flex items-center space-x-2 text-[10px] font-mono text-slate-600">
                  <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-bold text-indigo-700">UPI: damani@okaxis</span>
                  <span className="text-emerald-600 font-bold flex items-center">
                    <CheckCircle className="w-3 h-3 mr-0.5 inline" /> Verified
                  </span>
                </div>
              </div>
              <div className="p-1.5 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col items-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&margin=2&data=${encodeURIComponent(`upi://pay?pa=damani@okaxis&pn=Damani+Retails&am=${lastGeneratedBill.total}&cu=INR&tn=Bill-${lastGeneratedBill.billNo}`)}`}
                  alt="Payment QR Scanner"
                  className="w-20 h-20 rounded-lg object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    if (e.currentTarget.nextElementSibling) {
                      e.currentTarget.nextElementSibling.style.display = 'flex';
                    }
                  }}
                />
                <div className="w-20 h-20 bg-indigo-50 rounded-lg items-center justify-center flex-col text-indigo-700 hidden text-center p-1">
                  <QrCode className="w-8 h-8 mx-auto" />
                  <span className="text-[8px] font-bold">₹{lastGeneratedBill.total}</span>
                </div>
                <span className="text-[9px] font-black text-slate-700 mt-1 uppercase tracking-wider">₹{lastGeneratedBill.total}</span>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>Print Bill</span>
              </button>

              <button
                onClick={() => {
                  const custPhone = (lastGeneratedBill.customer.phone || '').replace(/[^0-9]/g, '');
                  const itemsSummary = lastGeneratedBill.items.map(it => `• ${it.product.name} x ${it.quantity} = ₹${it.product.sellingPrice * it.quantity}`).join('\n');
                  const msg = `🧾 *TAX INVOICE: ${lastGeneratedBill.billNo}*\n🏪 *${business.name}*\n----------------------------\n*Customer:* ${lastGeneratedBill.customer.name}\n*Date:* ${lastGeneratedBill.date}\n----------------------------\n${itemsSummary}\n----------------------------\n*Subtotal:* ₹${lastGeneratedBill.subtotal}\n*GST (5%):* ₹${lastGeneratedBill.gst}\n*Discount:* ₹${lastGeneratedBill.discount + (lastGeneratedBill.loyaltyDiscount || 0)}\n*Total Paid:* ₹${lastGeneratedBill.total} (${lastGeneratedBill.paymentMode})\n🌟 *Points Earned:* +${lastGeneratedBill.pointsEarned || 0} pts\n----------------------------\nThank you for shopping with us!`;
                  window.open(`https://api.whatsapp.com/send?phone=${custPhone}&text=${encodeURIComponent(msg)}`, '_blank');
                }}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1 shadow-sm"
                title="Send digital receipt on customer's WhatsApp"
              >
                <Share2 className="w-4 h-4" />
                <span>WhatsApp Bill</span>
              </button>

              <button
                onClick={() => setShowInvoiceModal(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: ADD EXPENSE (The "Nice Box" with Title, Calendar Date, Amount & Note) */}
      {/* ============================================================== */}
      {showAddExpenseModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center">
                  <Wallet className="w-5 h-5 mr-1.5 text-rose-600" /> Log Business Overhead Expense
                </h3>
                <p className="text-xs text-slate-500">Record shop rent, electricity, salaries, or transport</p>
              </div>
              <button onClick={() => setShowAddExpenseModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddExpenseSubmit} className="space-y-3.5 text-xs">
              {/* Title (by typing) */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Expense Title * <span className="font-normal text-slate-400">(e.g. Shop Rent, Power, Salaries)</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Type expense title..."
                  value={newExpense.title}
                  onChange={e => setNewExpense({ ...newExpense, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none text-slate-900 font-medium"
                />
              </div>

              {/* Expense What / About - Freeform Text Input (Replaced Dropdown) */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  What is this expense about? * <span className="font-normal text-slate-400">(e.g. Shop Rent, Electricity, Packaging, Water, Repair)</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Write what this expense is about..."
                  value={newExpense.category}
                  onChange={e => setNewExpense({ ...newExpense, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none text-slate-900 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Date (using calendar) */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Date * <span className="font-normal text-slate-400">(Calendar)</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={newExpense.date}
                    onChange={e => setNewExpense({ ...newExpense, date: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none text-slate-900 font-medium"
                  />
                </div>

                {/* Amount (by typing) */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Amount (₹) * <span className="font-normal text-slate-400">(by typing)</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 15000"
                    value={newExpense.amount}
                    onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none text-slate-900 font-bold"
                  />
                </div>
              </div>

              {/* Note (by typing) */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Note &amp; Remarks <span className="font-normal text-slate-400">(by typing)</span>
                </label>
                <textarea
                  rows="3"
                  placeholder="Type any reference details, invoice number, payment mode, or remarks..."
                  value={newExpense.notes}
                  onChange={e => setNewExpense({ ...newExpense, notes: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none text-slate-900"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex space-x-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-sm transition flex items-center justify-center space-x-1.5"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Save Expense</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddExpenseModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: EDIT EXPENSE NOTE */}
      {/* ============================================================== */}
      {showEditExpenseNoteModal && selectedExpenseForNote && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center">
                  <FileText className="w-4 h-4 mr-1.5 text-indigo-600" /> Edit Expense Note
                </h3>
                <p className="text-xs text-slate-500">{selectedExpenseForNote.title} &bull; {selectedExpenseForNote.date}</p>
              </div>
              <button onClick={() => setShowEditExpenseNoteModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExpenseNote} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Notes &amp; Remarks (by typing)</label>
                <textarea
                  rows="4"
                  placeholder="Type note details for this expense..."
                  value={expenseNoteText}
                  onChange={e => setExpenseNoteText(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900"
                />
              </div>

              <div className="pt-2 flex space-x-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm transition"
                >
                  Update Note
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditExpenseNoteModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: ADD CUSTOMER TO KHATA */}
      {/* ============================================================== */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center">
                  <Users className="w-4 h-4 mr-1.5 text-indigo-600" /> Add Customer to Udhaar Khata
                </h3>
                <p className="text-xs text-slate-500">Register customer profile and credit limit</p>
              </div>
              <button onClick={() => setShowAddCustomerModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCustomerSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rakesh Gupta, Priya Sharma..."
                  value={newCustomer.name}
                  onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91-98765-43210"
                    value={newCustomer.phone}
                    onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Credit Limit (₹)</label>
                  <input
                    type="number"
                    placeholder="5000"
                    value={newCustomer.limit}
                    onChange={e => setNewCustomer({ ...newCustomer, limit: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Area / City</label>
                <input
                  type="text"
                  placeholder="e.g. Sector 15 Market, Delhi"
                  value={newCustomer.city}
                  onChange={e => setNewCustomer({ ...newCustomer, city: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex space-x-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm transition"
                >
                  Save Customer
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: RECEIVE KHATA PAYMENT */}
      {/* ============================================================== */}
      {showKhataPaymentModal && selectedKhataCustomer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center">
                  <Banknote className="w-4 h-4 mr-1.5 text-emerald-600" /> Record Khata Repayment
                </h3>
                <p className="text-xs text-slate-500">Customer: <span className="font-bold">{selectedKhataCustomer.name}</span></p>
              </div>
              <button onClick={() => setShowKhataPaymentModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleKhataPaymentSubmit} className="space-y-3.5 text-xs">
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex justify-between items-center">
                <span className="text-rose-700 font-semibold">Total Outstanding Udhaar:</span>
                <span className="text-base font-black text-rose-700">₹{selectedKhataCustomer.balance.toLocaleString('en-IN')}</span>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Repayment Amount Received (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={selectedKhataCustomer.balance}
                  value={khataPaymentAmount}
                  onChange={e => setKhataPaymentAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-900 font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Payment Channel</label>
                <div className="grid grid-cols-2 gap-2">
                  {['UPI', 'CASH'].map(m => (
                    <button
                      type="button"
                      key={m}
                      onClick={() => setKhataPaymentMode(m)}
                      className={`py-2 rounded-xl border text-xs font-bold transition ${khataPaymentMode === m ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50 text-slate-700 border-slate-200'}`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Payment Note / Receipt (by typing)</label>
                <input
                  type="text"
                  placeholder="e.g. Paid via GooglePay, transaction ID..."
                  value={khataPaymentNote}
                  onChange={e => setKhataPaymentNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-900"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex space-x-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm transition"
                >
                  Confirm Payment Received
                </button>
                <button
                  type="button"
                  onClick={() => setShowKhataPaymentModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: PARKED / HELD CARTS (Queue Buster) */}
      {/* ============================================================== */}
      {showHeldCartsModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center">
                  <PauseCircle className="w-5 h-5 mr-1.5 text-amber-600" /> Parked / Held Carts ({heldCarts.length})
                </h3>
                <p className="text-xs text-slate-500">Queue Buster: Resume a customer's cart or discard when done</p>
              </div>
              <button onClick={() => setShowHeldCartsModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {heldCarts.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                <PauseCircle className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="font-bold text-slate-600">No Held Carts</p>
                <p>Use the "Hold Cart" button at checkout whenever a customer steps away.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                {heldCarts.map((held) => (
                  <div key={held.id} className="p-4 bg-amber-50/50 border border-amber-200/70 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-black text-slate-900 text-sm">{held.customerName}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 flex items-center">
                          <Clock className="w-3 h-3 mr-1" /> {held.timestamp}
                        </span>
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-1 text-[11px] text-slate-600">
                        {held.items.map((it, i) => (
                          <span key={i} className="px-2 py-0.5 bg-white border border-slate-200 rounded-md">
                            {it.product.name} &times; {it.quantity}
                          </span>
                        ))}
                      </div>
                      <div className="mt-2 text-xs font-bold text-slate-700 flex items-center space-x-3">
                        <span>Items: <strong className="text-slate-900">{held.itemsCount}</strong></span>
                        <span>Total Payable: <strong className="text-emerald-700 font-black">₹{held.total.toLocaleString('en-IN')}</strong></span>
                        {held.redeemLoyaltyPoints && (
                          <span className="text-amber-700 font-semibold flex items-center">
                            <Sparkles className="w-3 h-3 mr-0.5" /> Loyalty Applied
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2 shrink-0">
                      <button
                        onClick={() => handleResumeCart(held.id)}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1 shadow-sm"
                      >
                        <PlayCircle className="w-4 h-4" />
                        <span>Resume</span>
                      </button>
                      <button
                        onClick={() => handleDiscardHeldCart(held.id)}
                        className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition flex items-center"
                        title="Discard cart"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setShowHeldCartsModal(false)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: BATCH MANAGEMENT & FIFO TRACKING */}
      {/* ============================================================== */}
      {showBatchModal && selectedProductForBatch && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center">
                  <Layers className="w-5 h-5 mr-1.5 text-indigo-600" /> Manage Batches (FIFO)
                </h3>
                <p className="text-xs text-slate-500">
                  Product: <span className="font-bold text-slate-900">{selectedProductForBatch.name}</span> &bull; Total Stock: <span className="font-bold text-indigo-600">{selectedProductForBatch.quantity} units</span>
                </p>
              </div>
              <button onClick={() => setShowBatchModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Existing Batches List */}
            <div className="mb-6">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center">
                <Clock className="w-3.5 h-3.5 mr-1 text-slate-500" /> Active Batches (Depleted FIFO - Earliest Expiry First)
              </h4>
              <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Batch Code</th>
                      <th className="py-2.5 px-3">Stock Units</th>
                      <th className="py-2.5 px-3">Cost / Unit</th>
                      <th className="py-2.5 px-3">Mfg Date</th>
                      <th className="py-2.5 px-3">Expiry Date</th>
                      <th className="py-2.5 px-3">FIFO Priority</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(selectedProductForBatch.batches || []).length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-4 text-center text-slate-400">No specific batch assigned yet. Add one below.</td>
                      </tr>
                    ) : (
                      (selectedProductForBatch.batches || [])
                        .slice()
                        .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate))
                        .map((b, idx) => {
                          const daysLeft = calculateDaysToExpiry(b.expiryDate);
                          return (
                            <tr key={b.id || idx} className={idx === 0 ? 'bg-indigo-50/40 font-semibold' : ''}>
                              <td className="py-2.5 px-3 font-mono text-slate-800 flex items-center">
                                {idx === 0 && <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5" title="Next to deplete (FIFO)" />}
                                {b.batchNo}
                              </td>
                              <td className="py-2.5 px-3 font-bold text-slate-900">{b.quantity}</td>
                              <td className="py-2.5 px-3 text-slate-600">₹{b.purchasePrice || selectedProductForBatch.purchasePrice || 0}</td>
                              <td className="py-2.5 px-3 text-slate-500">{b.mfgDate || 'N/A'}</td>
                              <td className="py-2.5 px-3">
                                <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                                  daysLeft <= 0 ? 'bg-rose-100 text-rose-800' :
                                  daysLeft <= 30 ? 'bg-rose-50 text-rose-700' :
                                  daysLeft <= 60 ? 'bg-amber-50 text-amber-700' :
                                  'bg-emerald-50 text-emerald-700'
                                }`}>
                                  {b.expiryDate} ({daysLeft <= 0 ? 'Expired' : `${daysLeft}d`})
                                </span>
                              </td>
                              <td className="py-2.5 px-3">
                                {idx === 0 ? (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">1st (Next)</span>
                                ) : (
                                  <span className="text-[10px] text-slate-400 font-medium">#{idx + 1}</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Add New Batch Form */}
            <form onSubmit={handleAddBatchSubmit} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 text-xs">
              <h4 className="font-bold text-slate-800 flex items-center">
                <Plus className="w-4 h-4 mr-1 text-indigo-600" /> Register Inward Shipment / New Batch
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Batch Code / Lot # *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BAT-2026-X01"
                    value={newBatchForm.batchNo}
                    onChange={e => setNewBatchForm({ ...newBatchForm, batchNo: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Incoming Quantity (Units) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="25"
                    value={newBatchForm.quantity}
                    onChange={e => setNewBatchForm({ ...newBatchForm, quantity: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Purchase Cost / Unit (₹)</label>
                  <input
                    type="number"
                    placeholder="Wholesale price"
                    value={newBatchForm.purchasePrice}
                    onChange={e => setNewBatchForm({ ...newBatchForm, purchasePrice: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Mfg Date (Optional)</label>
                  <input
                    type="date"
                    value={newBatchForm.mfgDate}
                    onChange={e => setNewBatchForm({ ...newBatchForm, mfgDate: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">Batch Expiry Date *</label>
                  <input
                    type="date"
                    required
                    value={newBatchForm.expiryDate}
                    onChange={e => setNewBatchForm({ ...newBatchForm, expiryDate: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex space-x-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm transition"
                >
                  Add Batch & Update FIFO
                </button>
                <button
                  type="button"
                  onClick={() => setShowBatchModal(false)}
                  className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition"
                >
                  Close
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: AUTO-DRAFT PURCHASE ORDER (Low Stock to PO) */}
      {/* ============================================================== */}
      {showAutoPoModal && autoPoData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center">
                  <Sparkles className="w-5 h-5 mr-1.5 text-indigo-600" /> Auto-Draft Purchase Order
                </h3>
                <p className="text-xs text-slate-500">Order ID: <span className="font-bold font-mono">{autoPoData.id}</span></p>
              </div>
              <button onClick={() => setShowAutoPoModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-2xl flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">Assigned Wholesale Supplier</span>
                  <span className="text-sm font-bold text-slate-900">{autoPoData.supplierName}</span>
                  <span className="text-[11px] text-slate-500 block">Contact: {autoPoData.supplierContact} &bull; {autoPoData.supplierPhone}</span>
                </div>
                <Truck className="w-8 h-8 text-indigo-400" />
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Item to Restock:</span>
                  <span className="font-bold text-slate-900">{autoPoData.productName} ({autoPoData.sku})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Recommended Reorder Units:</span>
                  <span className="font-black text-indigo-600 text-sm">{autoPoData.reorderQty} units</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Estimated Unit Cost:</span>
                  <span className="font-bold text-slate-800">₹{autoPoData.unitPrice}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                  <span className="font-bold text-slate-700">Total Purchase Order Value:</span>
                  <span className="font-black text-emerald-700 text-base">₹{autoPoData.totalVal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-500">Target Delivery Date:</span>
                  <span className="font-semibold text-slate-700">{autoPoData.expectedDelivery}</span>
                </div>
              </div>

              <div className="p-3 bg-amber-50/60 border border-amber-100 rounded-xl text-[11px] text-amber-800">
                <p className="font-bold mb-0.5">PO Justification:</p>
                <p>{autoPoData.notes}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleWhatsAppAutoPo}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm transition flex items-center justify-center space-x-1.5"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Order via WhatsApp</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveAutoPo}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm transition"
                >
                  Save PO
                </button>
                <button
                  type="button"
                  onClick={() => setShowAutoPoModal(false)}
                  className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: STOCK WASTAGE & SPOILAGE WRITE-OFF */}
      {/* ============================================================== */}
      {showWastageModal && selectedProductForWastage && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center">
                  <AlertOctagon className="w-5 h-5 mr-1.5 text-rose-600" /> Stock Wastage & Write-Off
                </h3>
                <p className="text-xs text-slate-500">Record damaged, spoiled or expired shelf inventory</p>
              </div>
              <button onClick={() => setShowWastageModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveWastage} className="space-y-3.5 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Product:</span>
                  <span className="font-bold text-slate-900">{selectedProductForWastage.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Available Stock:</span>
                  <span className="font-bold text-indigo-600">{selectedProductForWastage.quantity} units</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Cost Price / Unit:</span>
                  <span className="font-bold text-slate-800">₹{selectedProductForWastage.purchasePrice || 0}</span>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Units to Write Off *</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={selectedProductForWastage.quantity}
                  value={wastageForm.quantity}
                  onChange={e => setWastageForm({ ...wastageForm, quantity: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Wastage Category / Reason *</label>
                <select
                  value={wastageForm.reason}
                  onChange={e => setWastageForm({ ...wastageForm, reason: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none font-semibold text-slate-800"
                >
                  <option value="Expired Shelf Life">Expired Shelf Life</option>
                  <option value="Damaged in Handling/Transit">Damaged in Handling / Transit</option>
                  <option value="Spillage or Leakage">Spillage or Packaging Leakage</option>
                  <option value="Pest or Moisture Spoilage">Pest or Moisture Spoilage</option>
                  <option value="Quality Defect / Returned">Quality Defect / Returned</option>
                </select>
              </div>

              <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex justify-between items-center">
                <span className="text-rose-700 font-bold">Estimated Financial Loss:</span>
                <span className="text-base font-black text-rose-700">
                  ₹{((Number(wastageForm.quantity) || 0) * (selectedProductForWastage.purchasePrice || 0)).toLocaleString('en-IN')}
                </span>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Audit Note / Remark</label>
                <input
                  type="text"
                  placeholder="e.g. Broken seal found during shelf audit"
                  value={wastageForm.notes}
                  onChange={e => setWastageForm({ ...wastageForm, notes: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none text-slate-900"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex space-x-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-sm transition"
                >
                  Confirm & Deduct Stock
                </button>
                <button
                  type="button"
                  onClick={() => setShowWastageModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: CUSTOMER PURCHASE HISTORY & PROFILE */}
      {/* ============================================================== */}
      {showCustomerHistoryModal && selectedCustomerForHistory && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center">
                  <Eye className="w-5 h-5 mr-1.5 text-indigo-600" /> Customer Profile & History
                </h3>
                <p className="text-xs text-slate-500">
                  <span className="font-bold text-slate-900">{selectedCustomerForHistory.name}</span> &bull; {selectedCustomerForHistory.phone} &bull; {selectedCustomerForHistory.city || 'Local'}
                </p>
              </div>
              <button onClick={() => setShowCustomerHistoryModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 text-xs">
              <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-2xl">
                <div className="text-[10px] uppercase font-bold text-emerald-700">Lifetime Spend</div>
                <div className="text-lg font-black text-emerald-900 mt-1">₹{(selectedCustomerForHistory.lifetimeSpent || 0).toLocaleString('en-IN')}</div>
              </div>
              <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-2xl">
                <div className="text-[10px] uppercase font-bold text-indigo-700">Store Visits</div>
                <div className="text-lg font-black text-indigo-900 mt-1">{selectedCustomerForHistory.totalVisits || 1}</div>
              </div>
              <div className="p-3 bg-amber-50/70 border border-amber-100 rounded-2xl">
                <div className="text-[10px] uppercase font-bold text-amber-700 flex items-center">
                  <Coins className="w-3 h-3 mr-1" /> Loyalty Points
                </div>
                <div className="text-lg font-black text-amber-900 mt-1">{selectedCustomerForHistory.loyaltyPoints || 0} pts</div>
              </div>
              <div className="p-3 bg-rose-50/70 border border-rose-100 rounded-2xl">
                <div className="text-[10px] uppercase font-bold text-rose-700">Udhaar Due</div>
                <div className="text-lg font-black text-rose-900 mt-1">₹{(selectedCustomerForHistory.balance || 0).toLocaleString('en-IN')}</div>
              </div>
            </div>

            {/* Purchase History / Past Invoices */}
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center">
                  <Receipt className="w-3.5 h-3.5 mr-1 text-slate-500" /> Past Bills & Receipts
                </h4>
                {bills.filter(b => b.customer?.id === selectedCustomerForHistory.id || b.customer?.phone === selectedCustomerForHistory.phone).length === 0 ? (
                  <div className="py-8 text-center text-slate-400 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-xs">
                    <Receipt className="w-8 h-8 mx-auto mb-1.5 text-slate-300" />
                    <p className="font-semibold text-slate-600">No transactions recorded in this session</p>
                    <p className="text-[11px]">Completed bills for this customer will be archived here.</p>
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">Bill #</th>
                          <th className="py-2.5 px-3">Date & Time</th>
                          <th className="py-2.5 px-3">Items</th>
                          <th className="py-2.5 px-3">Mode</th>
                          <th className="py-2.5 px-3">Points</th>
                          <th className="py-2.5 px-3 text-right">Amount</th>
                          <th className="py-2.5 px-3 text-center">Receipt</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {bills
                          .filter(b => b.customer?.id === selectedCustomerForHistory.id || b.customer?.phone === selectedCustomerForHistory.phone)
                          .map((b) => (
                            <tr key={b.id} className="hover:bg-slate-50">
                              <td className="py-2 px-3 font-mono font-bold text-indigo-700">{b.billNo}</td>
                              <td className="py-2 px-3 text-slate-600">{b.date}</td>
                              <td className="py-2 px-3 text-slate-700">{b.items.reduce((s, it) => s + it.quantity, 0)} items</td>
                              <td className="py-2 px-3">
                                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[10px]">
                                  {b.paymentMode}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-emerald-700 font-bold">+{b.pointsEarned || 0}</td>
                              <td className="py-2 px-3 text-right font-black text-slate-900">₹{b.total.toLocaleString('en-IN')}</td>
                              <td className="py-2 px-3 text-center">
                                <button
                                  onClick={() => {
                                    setLastGeneratedBill(b);
                                    setShowInvoiceModal(true);
                                  }}
                                  className="p-1 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                  title="View Receipt"
                                >
                                  <Receipt className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowCustomerHistoryModal(false)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: SET / EDIT OPENING CASH FLOAT */}
      {/* ============================================================== */}
      {showOpeningFloatModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center">
                  <Banknote className="w-5 h-5 mr-1.5 text-emerald-600" /> Morning Starting Cash Float
                </h3>
                <p className="text-xs text-slate-500">Till change provided to cashier at shift opening</p>
              </div>
              <button onClick={() => setShowOpeningFloatModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateOpeningFloat} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Starting Cash Float Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="50"
                  placeholder="e.g. 2000"
                  value={tempOpeningFloat}
                  onChange={e => setTempOpeningFloat(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-900 font-black text-base"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Common kirana float is ₹1,500 - ₹3,000 in small change (₹10, ₹20, ₹50, ₹100 notes).
                </p>
              </div>

              <div className="pt-2 flex space-x-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm transition"
                >
                  Update Cash Float
                </button>
                <button
                  type="button"
                  onClick={() => setShowOpeningFloatModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: LOG CASH DROP / MID-DAY PETTY CASH */}
      {/* ============================================================== */}
      {showCashDropModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center">
                  <ArrowDownLeft className="w-5 h-5 mr-1.5 text-amber-600" /> Mid-Day Cash Movement (Drop)
                </h3>
                <p className="text-xs text-slate-500">Record cash paid to vendors or cash added to till</p>
              </div>
              <button onClick={() => setShowCashDropModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCashDrop} className="space-y-3.5 text-xs">
              {/* Type Switcher */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Movement Type *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCashDropForm({ ...cashDropForm, type: 'CASH_OUT' })}
                    className={`py-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center space-x-1 ${
                      cashDropForm.type === 'CASH_OUT' ? 'bg-rose-600 text-white border-rose-600 shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    <span>🔻 Cash Drop Out (Paid Out)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCashDropForm({ ...cashDropForm, type: 'CASH_IN' })}
                    className={`py-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center space-x-1 ${
                      cashDropForm.type === 'CASH_IN' ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    <span>🔺 Cash In (Change Added)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Cash Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 450"
                  value={cashDropForm.amount}
                  onChange={e => setCashDropForm({ ...cashDropForm, amount: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900 font-black text-base"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Reason / Category *</label>
                <select
                  value={cashDropForm.reason}
                  onChange={e => setCashDropForm({ ...cashDropForm, reason: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-semibold text-slate-800"
                >
                  <option value="Vendor Payout (Milk/Bread)">Vendor Payout (Milk / Bread / Eggs)</option>
                  <option value="Store Petty Overhead">Store Petty Overhead (Tea, Cleaning, Ice)</option>
                  <option value="Bank Cash Deposit">Bank Cash Deposit (Excess Safe Drop)</option>
                  <option value="Owner Cash Withdrawal">Owner Cash Withdrawal</option>
                  <option value="Change Refill (Small Notes)">Change Refill (Coins / Small Notes In)</option>
                  <option value="Other Cash Transfer">Other Cash Transfer</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Audit Remark / Receipt Note</label>
                <input
                  type="text"
                  placeholder="e.g. Paid Amul delivery guy for morning milk crates"
                  value={cashDropForm.notes}
                  onChange={e => setCashDropForm({ ...cashDropForm, notes: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex space-x-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm transition"
                >
                  Record Movement
                </button>
                <button
                  type="button"
                  onClick={() => setShowCashDropModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: RECONCILE & CLOSE SHIFT (Hisab-Kitab) */}
      {/* ============================================================== */}
      {showCloseShiftModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center">
                  <ShieldCheck className="w-5 h-5 mr-1.5 text-indigo-600" /> Shift Closing &amp; Cash Reconciliation
                </h3>
                <p className="text-xs text-slate-500">
                  Shift: <span className="font-bold text-slate-800">{activeShift?.shiftName}</span> &bull; Cashier: <span className="font-bold text-slate-800">{activeShift?.cashierName}</span>
                </p>
              </div>
              <button onClick={() => setShowCloseShiftModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCloseShift} className="space-y-4 text-xs">
              {/* Expected Till Breakdown Card */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span>Opening Starting Float:</span>
                  <span className="font-semibold text-slate-900">₹{(activeShift?.openingFloat || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Cash Sales ({activeShiftBills.filter(b => b.paymentMode === 'CASH').length} bills):</span>
                  <span className="font-semibold text-indigo-600">+₹{currentShiftCashSales.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Mid-day Cash In / Change Added:</span>
                  <span className="font-semibold text-emerald-600">+₹{currentShiftCashIn.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Mid-day Cash Drops Out (Vendor/Bank):</span>
                  <span className="font-semibold text-rose-600">-₹{currentShiftCashOut.toLocaleString('en-IN')}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between items-center font-bold text-slate-900">
                  <span className="text-sm font-black">Expected Cash in Till:</span>
                  <span className="text-base font-black text-indigo-700">₹{expectedDrawerCash.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Physical Cash Count Entry */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-slate-800 text-xs">
                    Actual Physical Cash Counted (₹) *
                  </label>
                  <span className="text-[11px] text-slate-400">Enter total or use denomination breakdown below</span>
                </div>

                <input
                  type="number"
                  min="0"
                  placeholder="Total counted cash (e.g. 2450)"
                  value={physicalCashCounted}
                  onChange={e => setPhysicalCashCounted(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-black text-lg text-slate-900"
                />

                {/* Fast Denomination Helper */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex justify-between">
                    <span>Quick Denomination Counter (Optional)</span>
                    <span>Subtotal: ₹{calculatedDenominationTotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
                    {[500, 200, 100, 50, 20, 10].map(denom => (
                      <div key={denom}>
                        <span className="text-[10px] font-bold text-slate-600 block mb-0.5">₹{denom} &times;</span>
                        <input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={denominations[denom] || ''}
                          onChange={e => {
                            const updated = { ...denominations, [denom]: e.target.value };
                            setDenominations(updated);
                            const total = [500, 200, 100, 50, 20, 10].reduce((acc, d) => acc + ((Number(updated[d]) || 0) * d), 0);
                            setPhysicalCashCounted(String(total));
                          }}
                          className="w-full px-1.5 py-1 text-center bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Real-Time Discrepancy Indicator */}
              <div className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                shiftDiscrepancy === 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-900' :
                shiftDiscrepancy < 0 ? 'bg-rose-50 border-rose-200 text-rose-900' :
                'bg-amber-50 border-amber-200 text-amber-900'
              }`}>
                <div>
                  <div className="font-bold flex items-center">
                    {shiftDiscrepancy === 0 ? (
                      <CheckCircle className="w-4 h-4 mr-1 text-emerald-600" />
                    ) : shiftDiscrepancy < 0 ? (
                      <AlertTriangle className="w-4 h-4 mr-1 text-rose-600" />
                    ) : (
                      <Sparkles className="w-4 h-4 mr-1 text-amber-600" />
                    )}
                    <span>
                      {shiftDiscrepancy === 0 ? 'Exact Match (Balanced Till)' :
                       shiftDiscrepancy < 0 ? 'Till Shortage (Discrepancy)' : 'Till Excess (Surplus)'}
                    </span>
                  </div>
                  <div className="text-[11px] opacity-80 mt-0.5">
                    {shiftDiscrepancy === 0 ? 'Physical cash matches register exactly.' :
                     shiftDiscrepancy < 0 ? 'Physical cash is lower than expected register amount.' : 'More physical cash than expected.'}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold tracking-wider block">Difference</span>
                  <span className={`text-base font-black ${
                    shiftDiscrepancy === 0 ? 'text-emerald-700' :
                    shiftDiscrepancy < 0 ? 'text-rose-700' : 'text-amber-700'
                  }`}>
                    {shiftDiscrepancy > 0 ? `+₹${shiftDiscrepancy.toLocaleString('en-IN')}` :
                     shiftDiscrepancy < 0 ? `-₹${Math.abs(shiftDiscrepancy).toLocaleString('en-IN')}` : '₹0'}
                  </span>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Shift Handover Remark / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Clean till handover to Evening shift cashier"
                  value={shiftClosingNotes}
                  onChange={e => setShiftClosingNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex space-x-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm transition"
                >
                  Confirm &amp; Archive Shift
                </button>
                <button
                  type="button"
                  onClick={() => setShowCloseShiftModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: SHIFT RECONCILIATION AUDIT INSPECTION */}
      {/* ============================================================== */}
      {showShiftAuditModal && selectedShiftForAudit && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center">
                  <Landmark className="w-5 h-5 mr-1.5 text-indigo-600" /> Shift Audit: {selectedShiftForAudit.id}
                </h3>
                <p className="text-xs text-slate-500">
                  Cashier: <span className="font-bold text-slate-900">{selectedShiftForAudit.cashierName}</span> &bull; {selectedShiftForAudit.shiftName}
                </p>
              </div>
              <button onClick={() => setShowShiftAuditModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Shift Duration</span>
                  <div className="font-bold text-slate-800 mt-0.5">{selectedShiftForAudit.startDate} ({selectedShiftForAudit.startTime} - {selectedShiftForAudit.endTime})</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Total Invoices</span>
                  <div className="font-bold text-slate-800 mt-0.5">{selectedShiftForAudit.billsCount} Bills (₹{selectedShiftForAudit.totalSales.toLocaleString('en-IN')})</div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>Starting Opening Float:</span>
                  <span className="font-bold text-slate-900">₹{selectedShiftForAudit.openingFloat.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Cash Sales Received:</span>
                  <span className="font-bold text-indigo-600">+₹{selectedShiftForAudit.cashSales.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Mid-day Cash In:</span>
                  <span className="font-bold text-emerald-600">+₹{selectedShiftForAudit.cashIn.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Mid-day Cash Drops Out:</span>
                  <span className="font-bold text-rose-600">-₹{selectedShiftForAudit.cashOut.toLocaleString('en-IN')}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between text-slate-900 font-bold">
                  <span>Expected Drawer Cash:</span>
                  <span className="text-sm font-black">₹{selectedShiftForAudit.expectedCash.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-900 font-bold">
                  <span>Actual Counted Physical Cash:</span>
                  <span className="text-sm font-black text-indigo-700">₹{selectedShiftForAudit.actualCash.toLocaleString('en-IN')}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                  <span className="font-bold text-slate-700">Reconciliation Status:</span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-black ${
                    selectedShiftForAudit.status === 'BALANCED' ? 'bg-emerald-100 text-emerald-800' :
                    selectedShiftForAudit.status === 'SHORTAGE' ? 'bg-rose-100 text-rose-800' :
                    'bg-amber-100 text-amber-800'
                  }`}>
                    {selectedShiftForAudit.status === 'BALANCED' ? 'BALANCED' : `${selectedShiftForAudit.status}: ₹${selectedShiftForAudit.discrepancy}`}
                  </span>
                </div>
              </div>

              {selectedShiftForAudit.notes && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900">
                  <span className="font-bold block mb-0.5">Closing Remark:</span>
                  <p>{selectedShiftForAudit.notes}</p>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowShiftAuditModal(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
                >
                  Close Audit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-400">
        BizSmart SME Platform &bull; Made for Indian Retail Businesses &bull; Role-Based Security &bull; Vercel Production
      </footer>
    </div>
  );
}
