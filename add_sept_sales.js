const fs = require('fs');
const path = require('path');

const seedPath = path.join(__dirname, 'frontend', 'src', 'seedData1Year.json');
const productsPath = path.join(__dirname, 'frontend', 'src', 'products60.json');

const seed = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));

// Filter out bills >= 2026-09-27 to regenerate cleanly
seed.bills = seed.bills.filter(b => !(b.dateStr >= '2026-09-27' && b.dateStr <= '2026-09-30'));

let maxId = Math.max(...seed.bills.map(b => b.id || 0), 12500);

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
  { name: 'Walk-in Retail Customer', phone: '+91-98000-00000', city: 'Local Area' }
];

const cashiers = ['Ajay Sharma'];

const datesToGenerate = [
  { dateStr: '2026-09-27', count: 85, cashProportion: 0.88 },
  { dateStr: '2026-09-28', count: 95, cashProportion: 0.88 },
  { dateStr: '2026-09-29', count: 110, cashProportion: 0.90 },
  { dateStr: '2026-09-30', count: 125, cashProportion: 0.90 }
];

const newBills = [];

datesToGenerate.forEach(dInfo => {
  for (let i = 0; i < dInfo.count; i++) {
    maxId++;
    const hour = 8 + Math.floor((i / dInfo.count) * 13); // 8 AM to 9 PM
    const minute = (i * 17) % 60;
    const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    const cust = customers[(i + maxId) % customers.length];
    const cashier = cashiers[i % cashiers.length];

    // Pick 3 to 6 distinct items from products for realistic grocery basket size
    const itemCount = 3 + (i % 4);
    const selectedProds = [];
    const prodStart = (i * 5 + maxId) % products.length;
    for (let j = 0; j < itemCount; j++) {
      selectedProds.push(products[(prodStart + j) % products.length]);
    }

    const billItems = selectedProds.map((p, pIdx) => {
      const qty = 1 + ((i + pIdx) % 3);
      const sp = p.sellingPrice;
      const subtotal = sp * qty;
      return {
        product: { ...p },
        quantity: qty,
        sellingPrice: sp,
        subtotal: subtotal
      };
    });

    const subtotal = billItems.reduce((acc, it) => acc + it.subtotal, 0);
    const gst = Math.round(subtotal * 0.05);
    const total = subtotal + gst;

    const isCash = (i / dInfo.count) < dInfo.cashProportion;
    const paymentMode = isCash ? 'CASH' : 'UPI';

    newBills.push({
      id: maxId,
      billNo: `INV-${maxId}`,
      date: `${dInfo.dateStr} ${timeStr}`,
      dateStr: dInfo.dateStr,
      timestamp: `${dInfo.dateStr}T${timeStr}:00.000Z`,
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
      cashier: cashier,
      shiftId: 'SHIFT-AJAY-M'
    });
  }
});

console.log('Generated new bills count:', newBills.length);
const addedCash = newBills.filter(b => b.paymentMode === 'CASH').reduce((a,b)=>a+b.total, 0);
const addedUpi = newBills.filter(b => b.paymentMode === 'UPI').reduce((a,b)=>a+b.total, 0);
console.log('Added Cash:', addedCash, 'Added UPI:', addedUpi, 'Added Total:', addedCash + addedUpi);

seed.bills = [...newBills.reverse(), ...seed.bills];

// Let's verify September totals now
const sept = seed.bills.filter(b => b.dateStr && b.dateStr.startsWith('2026-09'));
const septCash = sept.filter(b => b.paymentMode === 'CASH').reduce((a,b)=>a+b.total, 0);
const septUpi = sept.filter(b => b.paymentMode === 'UPI').reduce((a,b)=>a+b.total, 0);
const septRev = sept.reduce((a,b)=>a+b.total, 0);
const septCogs = sept.reduce((a,b)=>a+b.items.reduce((acc,it)=>acc+((it.product.purchasePrice||0)*it.quantity),0),0);
const septExp = seed.expenses.filter(e=>e.date&&e.date.startsWith('2026-09')).reduce((a,b)=>a+b.amount,0);
const netProfit = septRev - septCogs - septExp;

console.log('Updated September bills count:', sept.length);
console.log('Updated September Cash: ₹' + septCash, 'Target 350000 Achieved:', septCash >= 350000);
console.log('Updated September UPI: ₹' + septUpi);
console.log('Updated September Total Sales: ₹' + septRev);
console.log('Updated September COGS: ₹' + septCogs);
console.log('Updated September Expenses: ₹' + septExp);
console.log('Updated September Net Profit After Expenses: ₹' + netProfit, 'Margin:', ((netProfit/septRev)*100).toFixed(2)+'%');

fs.writeFileSync(seedPath, JSON.stringify(seed, null, 2), 'utf8');
console.log('Successfully saved to seedData1Year.json!');
