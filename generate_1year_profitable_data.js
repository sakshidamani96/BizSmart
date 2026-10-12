const fs = require('fs');
const path = require('path');

const seedPath = path.join(__dirname, 'frontend', 'src', 'seedData1Year.json');
const productsPath = path.join(__dirname, 'frontend', 'src', 'products60.json');

const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));

// Update products wholesale purchase price to ~73.4% of selling price for ~16.0% net profit
const updatedProducts = products.map(p => {
  const sp = Number(p.sellingPrice) || 100;
  const cp = Math.round(sp * 0.734);
  return {
    ...p,
    purchasePrice: cp
  };
});
fs.writeFileSync(productsPath, JSON.stringify(updatedProducts, null, 2), 'utf8');

// 1. Monthly Configuration with Festival Peaks and Steady Regular Months
const months = [
  { month: '2025-10', name: 'October 2025 (Navratri / Festive Prep)', isFestival: true, billsCount: 410, avgItems: 5, rent: 58000, salary: 28000, electricity: 15500, freight: 7500, packaging: 5500 },
  { month: '2025-11', name: 'November 2025 (Diwali Mega Rush & Chhath)', isFestival: true, billsCount: 510, avgItems: 6, rent: 62000, salary: 32000, electricity: 18000, freight: 9000, packaging: 7000 },
  { month: '2025-12', name: 'December 2025 (Year-End & Winter Festivities)', isFestival: true, billsCount: 380, avgItems: 5, rent: 56000, salary: 26000, electricity: 14000, freight: 6500, packaging: 4800 },
  { month: '2026-01', name: 'January 2026 (New Year & Makar Sankranti)', isFestival: false, billsCount: 350, avgItems: 4, rent: 50000, salary: 25000, electricity: 12000, freight: 5000, packaging: 3800 },
  { month: '2026-02', name: 'February 2026 (Regular Retail Grocery)', isFestival: false, billsCount: 320, avgItems: 4, rent: 50000, salary: 25000, electricity: 11500, freight: 4800, packaging: 3700 },
  { month: '2026-03', name: 'March 2026 (Holi Festival & Sweets Rush)', isFestival: true, billsCount: 430, avgItems: 5, rent: 58000, salary: 28000, electricity: 15000, freight: 7800, packaging: 5600 },
  { month: '2026-04', name: 'April 2026 (Baisakhi & Ram Navami)', isFestival: false, billsCount: 340, avgItems: 4, rent: 50000, salary: 25000, electricity: 12200, freight: 5000, packaging: 3900 },
  { month: '2026-05', name: 'May 2026 (Summer Refreshments & Daily Needs)', isFestival: false, billsCount: 345, avgItems: 4, rent: 50000, salary: 25000, electricity: 12500, freight: 5100, packaging: 4000 },
  { month: '2026-06', name: 'June 2026 (Monsoon Restocking)', isFestival: false, billsCount: 335, avgItems: 4, rent: 50000, salary: 25000, electricity: 12200, freight: 5000, packaging: 3900 },
  { month: '2026-07', name: 'July 2026 (Monsoon Tea Season & FMCG)', isFestival: false, billsCount: 340, avgItems: 4, rent: 50000, salary: 25000, electricity: 12300, freight: 5000, packaging: 3900 },
  { month: '2026-08', name: 'August 2026 (Rakhi & Janmashtami Festival)', isFestival: true, billsCount: 420, avgItems: 5, rent: 58000, salary: 28000, electricity: 15500, freight: 7600, packaging: 5500 },
  { month: '2026-09', name: 'September 2026 (Ganesh Utsav & Navratri)', isFestival: true, billsCount: 500, avgItems: 6, rent: 62000, salary: 32000, electricity: 18000, freight: 9000, packaging: 7000 }
];

// Generate Overhead Expenses for Past 12 Months
const allExpenses = [];
let expId = 0;

months.forEach(m => {
  expId++;
  allExpenses.push({
    id: expId,
    title: `Shop Floor Rent - ${m.name}`,
    category: 'Shop Floor Rent',
    amount: m.rent,
    date: `${m.month}-01`,
    notes: 'Commercial showroom space rent paid via bank transfer'
  });
  expId++;
  allExpenses.push({
    id: expId,
    title: `Staff Salaries & Counter Operations - ${m.name}`,
    category: 'Staff Salaries',
    amount: m.salary,
    date: `${m.month}-01`,
    notes: m.isFestival ? 'Monthly staff salary for Ajay Sharma + festival overtime helper allowance' : 'Monthly staff salary for Ajay Sharma (Cashier & Counter Operator)'
  });
  expId++;
  allExpenses.push({
    id: expId,
    title: `Commercial Electricity Bill - ${m.name}`,
    category: 'Electricity & Power',
    amount: m.electricity,
    date: `${m.month}-10`,
    notes: 'Showroom air conditioning, display chillers and lighting electricity bill'
  });
  expId++;
  allExpenses.push({
    id: expId,
    title: `Wholesale Transport & Logistics Freight - ${m.name}`,
    category: 'Wholesale Transport & Logistics',
    amount: m.freight,
    date: `${m.month}-18`,
    notes: 'Wholesale depot delivery freight & bulk FMCG transport charges'
  });
  expId++;
  allExpenses.push({
    id: expId,
    title: `Packaging Materials & Carry Bags - ${m.name}`,
    category: 'Packaging Materials',
    amount: m.packaging,
    date: `${m.month}-25`,
    notes: 'Eco-friendly biodegradable carry bags and paper pouches'
  });
});

// Add October 2026 Expenses (Incurred till October 12, 2026)
expId++;
allExpenses.push({
  id: expId,
  title: 'Shop Floor Rent - October 2026 (Festive Season Store Lease)',
  category: 'Shop Floor Rent',
  amount: 38000,
  date: '2026-10-01',
  notes: 'Commercial showroom space rent paid via bank transfer'
});
expId++;
allExpenses.push({
  id: expId,
  title: 'Staff Salaries & Counter Operations - October 2026',
  category: 'Staff Salaries',
  amount: 20000,
  date: '2026-10-01',
  notes: 'Staff salary for Ajay Sharma + counter support'
});
expId++;
allExpenses.push({
  id: expId,
  title: 'Commercial Electricity Bill - October 2026',
  category: 'Electricity & Power',
  amount: 9500,
  date: '2026-10-10',
  notes: 'Showroom air conditioning and display chillers bill'
});

allExpenses.reverse();

// Customers List
const customers = [
  { name: 'Rahul Sharma (Regular Shopper)', phone: '+91-98111-22334', city: 'Block B, Sector 15' },
  { name: 'Priya Verma', phone: '+91-98222-33445', city: 'Green Park, New Delhi' },
  { name: 'Amit Patel', phone: '+91-98333-44556', city: 'Sector 14, Gurugram' },
  { name: 'Sneha Kulkarni', phone: '+91-98444-55667', city: 'Vasant Kunj' },
  { name: 'Vikram Malhotra', phone: '+91-98555-66778', city: 'South Extension II' },
  { name: 'Sunita Agarwal', phone: '+91-98666-77889', city: 'Hauz Khas Enclave' },
  { name: 'Rohan Gupta', phone: '+91-98777-88990', city: 'Malviya Nagar' },
  { name: 'Ananya Joshi', phone: '+91-98888-99001', city: 'Lajpat Nagar IV' },
  { name: 'Deepak Mehta', phone: '+91-98999-00112', city: 'Greater Kailash I' },
  { name: 'Pooja Nair', phone: '+91-98101-11223', city: 'Saket, New Delhi' },
  { name: 'Kavita Singhania', phone: '+91-98112-23344', city: 'Defence Colony' },
  { name: 'Rajesh Mehra', phone: '+91-98113-34455', city: 'Panchsheel Park' },
  { name: 'Walk-in Retail Customer', phone: '+91-98000-00000', city: 'Local Area' }
];

// Generate Bills
let billId = 10000;
const allBills = [];

// 1. Generate full 12 months (2025-10 to 2026-09)
months.forEach(m => {
  const [yr, mo] = m.month.split('-').map(Number);
  const daysInMonth = new Date(yr, mo, 0).getDate();
  const count = m.billsCount;
  
  for (let i = 0; i < count; i++) {
    billId++;
    const day = 1 + Math.floor((i / count) * daysInMonth);
    const dayStr = `${m.month}-${String(day).padStart(2, '0')}`;
    const hour = 8 + Math.floor(((i * 7) % count) / count * 13);
    const minute = (i * 13) % 60;
    const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    const cust = customers[(i + billId) % customers.length];

    const itemCount = m.avgItems + (i % 2);
    const selectedProds = [];
    const prodStart = (i * 4 + billId) % updatedProducts.length;
    for (let j = 0; j < itemCount; j++) {
      selectedProds.push(updatedProducts[(prodStart + j) % updatedProducts.length]);
    }

    const billItems = selectedProds.map((p, pIdx) => {
      const qty = m.isFestival ? (1 + ((i + pIdx) % 3)) : (1 + ((i + pIdx) % 2));
      const sp = p.sellingPrice;
      const cp = p.purchasePrice || Math.round(sp * 0.734);
      const subtotal = sp * qty;
      return {
        product: { ...p, purchasePrice: cp },
        quantity: qty,
        sellingPrice: sp,
        subtotal: subtotal
      };
    });

    const subtotal = billItems.reduce((acc, it) => acc + it.subtotal, 0);
    const gst = Math.round(subtotal * 0.05);
    const total = subtotal + gst;

    const isCash = (i % 10) < 8; // 80% Cash
    const paymentMode = isCash ? 'CASH' : 'UPI';

    allBills.push({
      id: billId,
      billNo: `INV-${billId}`,
      date: `${dayStr} ${timeStr}`,
      dateStr: dayStr,
      timestamp: `${dayStr}T${timeStr}:00.000Z`,
      customer: { ...cust },
      items: billItems,
      subtotal: subtotal,
      gst: gst,
      discount: 0,
      loyaltyDiscount: 0,
      pointsEarned: Math.round(total / 100),
      pointsRedeemed: 0,
      total: total,
      paymentMode: paymentMode,
      cashier: 'Ajay Sharma',
      shiftId: 'SHIFT-AJAY-M'
    });
  }
});

// 2. Generate October 2026 Bills (Oct 1 to Oct 12, 2026)
const octDays = [
  { day: 1, count: 28 },
  { day: 2, count: 30 },
  { day: 3, count: 29 },
  { day: 4, count: 32 }, // Sunday shopping
  { day: 5, count: 27 },
  { day: 6, count: 28 },
  { day: 7, count: 30 },
  { day: 8, count: 31 },
  { day: 9, count: 33 },
  { day: 10, count: 34 },
  { day: 11, count: 35 }, // Sunday rush
  { day: 12, count: 22 }  // Today till midday / current hour
];

octDays.forEach(od => {
  const dayStr = `2026-10-${String(od.day).padStart(2, '0')}`;
  const count = od.count;
  const isToday = od.day === 12;

  for (let i = 0; i < count; i++) {
    billId++;
    // For today, generate times between 8:00 AM and 12:00 PM; for other days 8:00 AM to 9:30 PM
    let hour, minute;
    if (isToday) {
      hour = 8 + Math.floor((i / count) * 4); // 8 to 11 AM / 12 PM
      minute = (i * 17) % 60;
    } else {
      hour = 8 + Math.floor((i / count) * 13); // 8 AM to 9 PM
      minute = (i * 11) % 60;
    }
    const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    const cust = customers[(i + billId) % customers.length];

    const itemCount = 4 + (i % 2); // 4-5 items per bill
    const selectedProds = [];
    const prodStart = (i * 3 + od.day * 5) % updatedProducts.length;
    for (let j = 0; j < itemCount; j++) {
      selectedProds.push(updatedProducts[(prodStart + j) % updatedProducts.length]);
    }

    const billItems = selectedProds.map((p, pIdx) => {
      const qty = 1 + ((i + pIdx) % 2); // 1-2 units
      const sp = p.sellingPrice;
      const cp = p.purchasePrice || Math.round(sp * 0.734);
      const subtotal = sp * qty;
      return {
        product: { ...p, purchasePrice: cp },
        quantity: qty,
        sellingPrice: sp,
        subtotal: subtotal
      };
    });

    const subtotal = billItems.reduce((acc, it) => acc + it.subtotal, 0);
    const gst = Math.round(subtotal * 0.05);
    const total = subtotal + gst;

    const isCash = (i % 10) < 8; // 80% Cash
    const paymentMode = isCash ? 'CASH' : 'UPI';

    allBills.push({
      id: billId,
      billNo: `INV-${billId}`,
      date: `${dayStr} ${timeStr}`,
      dateStr: dayStr,
      timestamp: `${dayStr}T${timeStr}:00.000Z`,
      customer: { ...cust },
      items: billItems,
      subtotal: subtotal,
      gst: gst,
      discount: 0,
      loyaltyDiscount: 0,
      pointsEarned: Math.round(total / 100),
      pointsRedeemed: 0,
      total: total,
      paymentMode: paymentMode,
      cashier: 'Ajay Sharma',
      shiftId: 'SHIFT-AJAY-M'
    });
  }
});

allBills.reverse();

// Statistics Validation
const pnlByMonth = {};
allBills.forEach(b => {
  const m = b.dateStr.slice(0, 7);
  if (!pnlByMonth[m]) pnlByMonth[m] = { sales: 0, cogs: 0, cash: 0, bills: 0, exp: 0 };
  pnlByMonth[m].sales += b.total;
  pnlByMonth[m].bills++;
  if (b.paymentMode === 'CASH') pnlByMonth[m].cash += b.total;
  (b.items || []).forEach(it => {
    pnlByMonth[m].cogs += (it.product.purchasePrice || 0) * (it.quantity || 1);
  });
});

allExpenses.forEach(e => {
  const m = e.date.slice(0, 7);
  if (!pnlByMonth[m]) pnlByMonth[m] = { sales: 0, cogs: 0, cash: 0, bills: 0, exp: 0 };
  pnlByMonth[m].exp += e.amount;
});

console.log('=== MONTHLY P&L BREAKDOWN ===');
let totSales = 0, totCogs = 0, totExp = 0, totNet = 0;

Object.keys(pnlByMonth).sort().forEach(m => {
  const d = pnlByMonth[m];
  const gross = d.sales - d.cogs;
  const net = gross - d.exp;
  const netMargin = d.sales > 0 ? ((net / d.sales) * 100).toFixed(1) : '0.0';
  const grossMargin = d.sales > 0 ? ((gross / d.sales) * 100).toFixed(1) : '0.0';
  
  totSales += d.sales;
  totCogs += d.cogs;
  totExp += d.exp;
  totNet += net;

  console.log(`${m}: Sales=₹${d.sales.toLocaleString('en-IN')} | COGS=₹${d.cogs.toLocaleString('en-IN')} | Exp=₹${d.exp.toLocaleString('en-IN')} | Gross=₹${gross.toLocaleString('en-IN')} (${grossMargin}%) | Net=₹${net.toLocaleString('en-IN')} (${netMargin}%) | Cash=₹${d.cash.toLocaleString('en-IN')}`);
});

console.log('=============================');
console.log(`TOTAL ALL-TIME SALES: ₹${totSales.toLocaleString('en-IN')}`);
console.log(`TOTAL ALL-TIME COGS: ₹${totCogs.toLocaleString('en-IN')} (${((totCogs/totSales)*100).toFixed(2)}%)`);
console.log(`TOTAL ALL-TIME OVERHEAD EXPENSES: ₹${totExp.toLocaleString('en-IN')} (${((totExp/totSales)*100).toFixed(2)}%)`);
console.log(`TOTAL ALL-TIME NET PROFIT: ₹${totNet.toLocaleString('en-IN')} (${((totNet/totSales)*100).toFixed(2)}% Net Margin)`);
console.log(`TOTAL BILLS COUNT: ${allBills.length}`);
console.log(`TOTAL EXPENSES COUNT: ${allExpenses.length}`);

// Validate Daily P&L for October 1 to 12
console.log('\n=== OCTOBER DAILY P&L (1 to 12) ===');
const pnlByDay = {};
allBills.filter(b => b.dateStr.startsWith('2026-10')).forEach(b => {
  if (!pnlByDay[b.dateStr]) pnlByDay[b.dateStr] = { sales: 0, cogs: 0, bills: 0 };
  pnlByDay[b.dateStr].sales += b.total;
  pnlByDay[b.dateStr].bills++;
  (b.items || []).forEach(it => {
    pnlByDay[b.dateStr].cogs += (it.product.purchasePrice || 0) * (it.quantity || 1);
  });
});

Object.keys(pnlByDay).sort().forEach(d => {
  const row = pnlByDay[d];
  const gross = row.sales - row.cogs;
  const margin = ((gross / row.sales) * 100).toFixed(1);
  console.log(`${d}: Bills=${row.bills} | Sales=₹${row.sales.toLocaleString('en-IN')} | Gross Profit=₹${gross.toLocaleString('en-IN')} (${margin}%)`);
});

// Write to seedData1Year.json
const outputData = {
  products: updatedProducts,
  expenses: allExpenses,
  bills: allBills
};

fs.writeFileSync(seedPath, JSON.stringify(outputData, null, 2), 'utf8');
console.log('\nSuccessfully saved to seedData1Year.json!');
