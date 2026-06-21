import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const DB_URL = process.env.DATABASE_URL ?? "postgresql://kalyan@localhost:5432/abhiruchulu";
const adapter = new PrismaPg({ connectionString: DB_URL });
const db = new PrismaClient({ adapter } as any);

// ── helpers ──────────────────────────────────────────────
const rnd = (min: number, max: number) =>
  Math.round((Math.random() * (max - min) + min) * 100) / 100;
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86_400_000);
const addHours = (d: Date, h: number) => new Date(d.getTime() + h * 3_600_000);
const addMins = (d: Date, m: number) => new Date(d.getTime() + m * 60_000);

const TODAY = new Date("2026-05-16T00:00:00.000Z");
const YEAR_START = new Date("2025-05-17T00:00:00.000Z");

let orderSeq = 1000;
const nextOrderId = () => `#${++orderSeq}`;

// ── Categories ────────────────────────────────────────────
const CATS = [
  { name: "Tiffins",              displayOrder: 1 },
  { name: "Snacks",               displayOrder: 2 },
  { name: "Starters",             displayOrder: 3 },
  { name: "Biryanis",             displayOrder: 4 },
  { name: "Curries",              displayOrder: 5 },
  { name: "Rice",                 displayOrder: 6 },
  { name: "Fried Rice & Noodles", displayOrder: 7 },
  { name: "Pizza",                displayOrder: 8 },
  { name: "Burgers & Wraps",      displayOrder: 9 },
  { name: "Fish & Chips",         displayOrder: 10 },
  { name: "Beverages",            displayOrder: 11 },
  { name: "Desserts",             displayOrder: 12 },
];

// ── Menu items (representative set for order seeding) ─────
const ITEMS = [
  // Tiffins
  { id: "masala-dosa",           cat: "Tiffins",              name: "Masala Dosa",                price: 5.49,  emoji: "🫓",  veg: true,  popular: true },
  { id: "plain-idly",            cat: "Tiffins",              name: "Plain Idly (4 pcs)",         price: 4.99,  emoji: "🍚",  veg: true  },
  { id: "chicken-masala-dosa",   cat: "Tiffins",              name: "Chicken Masala Dosa",        price: 6.99,  emoji: "🫓",  veg: false },
  // Snacks
  { id: "mirchi-bajji",          cat: "Snacks",               name: "Mirchi Bajji",               price: 3.00,  emoji: "🌶️", veg: true  },
  { id: "veg-samosa",            cat: "Snacks",               name: "Veg Samosa (4 pcs)",         price: 3.29,  emoji: "🥟",  veg: true  },
  { id: "chicken-samosa",        cat: "Snacks",               name: "Chicken Samosa (4 pcs)",     price: 3.49,  emoji: "🥟",  veg: false },
  // Starters
  { id: "chilli-paneer",         cat: "Starters",             name: "Chilli Paneer",              price: 7.99,  emoji: "🧀",  veg: true,  popular: true },
  { id: "chicken-wings",         cat: "Starters",             name: "Chicken Wings (6 pcs)",      price: 5.99,  emoji: "🍗",  veg: false, popular: true },
  { id: "chicken-65",            cat: "Starters",             name: "Chicken 65",                 price: 6.49,  emoji: "🌶️", veg: false, popular: true },
  { id: "prawn-65",              cat: "Starters",             name: "Prawn 65",                   price: 7.49,  emoji: "🦐",  veg: false },
  { id: "chicken-ghee-roast",    cat: "Starters",             name: "Chicken Ghee Roast",         price: 6.99,  emoji: "🍗",  veg: false },
  { id: "lamb-pepper-fry",       cat: "Starters",             name: "Lamb Pepper Fry",            price: 7.49,  emoji: "🥩",  veg: false },
  // Biryanis
  { id: "chicken-dum-biryani",   cat: "Biryanis",             name: "Chicken Dum Biryani",        price: 11.99, emoji: "🍛",  veg: false, popular: true, hero: true },
  { id: "lamb-biryani",          cat: "Biryanis",             name: "Lamb Biryani",               price: 15.99, emoji: "🍛",  veg: false },
  { id: "veg-biryani",           cat: "Biryanis",             name: "Veg Biryani",                price: 11.99, emoji: "🍛",  veg: true  },
  { id: "prawn-biryani",         cat: "Biryanis",             name: "Prawn Biryani",              price: 14.99, emoji: "🍛",  veg: false },
  // Curries
  { id: "butter-chicken",        cat: "Curries",              name: "Butter Chicken Masala",      price: 7.99,  emoji: "🍲",  veg: false, popular: true },
  { id: "paneer-butter-masala",  cat: "Curries",              name: "Paneer Butter Masala",       price: 7.99,  emoji: "🧀",  veg: true,  popular: true },
  { id: "dal-tadka",             cat: "Curries",              name: "Dal Tadka",                  price: 6.99,  emoji: "🫘",  veg: true  },
  { id: "prawn-masala-curry",    cat: "Curries",              name: "Prawn Masala Curry",         price: 8.99,  emoji: "🦐",  veg: false },
  // Rice
  { id: "jeera-rice",            cat: "Rice",                 name: "Jeera Rice",                 price: 3.99,  emoji: "🍚",  veg: true  },
  { id: "plain-rice",            cat: "Rice",                 name: "Plain Rice",                 price: 2.99,  emoji: "🍚",  veg: true  },
  // Fried Rice & Noodles
  { id: "chicken-fried-rice",    cat: "Fried Rice & Noodles", name: "Chicken Fried Rice",         price: 7.99,  emoji: "🍳",  veg: false },
  { id: "veg-fried-rice",        cat: "Fried Rice & Noodles", name: "Veg Fried Rice",             price: 6.99,  emoji: "🍳",  veg: true  },
  { id: "chicken-noodles",       cat: "Fried Rice & Noodles", name: "Chicken Noodles",            price: 7.99,  emoji: "🍜",  veg: false },
  // Pizza
  { id: "pepperoni-pizza",       cat: "Pizza",                name: "Pepperoni Pizza",            price: 7.49,  emoji: "🍕",  veg: false, popular: true },
  { id: "veggie-supreme-pizza",  cat: "Pizza",                name: "Veggie Supreme Pizza",       price: 7.49,  emoji: "🍕",  veg: true  },
  // Burgers & Wraps
  { id: "peri-peri-chicken-burger", cat: "Burgers & Wraps",   name: "Peri-Peri Chicken Burger",  price: 3.99,  emoji: "🍔",  veg: false, popular: true },
  { id: "chicken-donner-wrap",   cat: "Burgers & Wraps",      name: "Chicken Donner Wrap",        price: 3.99,  emoji: "🌯",  veg: false },
  // Fish & Chips
  { id: "fish-and-chips",        cat: "Fish & Chips",         name: "Fish & Chips (Regular)",     price: 9.00,  emoji: "🐟",  veg: false, popular: true },
  // Beverages
  { id: "mango-lassi",           cat: "Beverages",            name: "Mango Lassi",                price: 2.99,  emoji: "🥭",  veg: true,  popular: true },
  { id: "coke-can",              cat: "Beverages",            name: "Coke Can (330ml)",           price: 1.30,  emoji: "🥤",  veg: true  },
  { id: "masala-tea",            cat: "Beverages",            name: "Masala Tea",                 price: 1.00,  emoji: "🍵",  veg: true  },
  // Desserts
  { id: "gulab-jamun",           cat: "Desserts",             name: "Gulab Jamun (4 pcs)",        price: 2.99,  emoji: "🍮",  veg: true,  popular: true },
  { id: "double-ka-meetha",      cat: "Desserts",             name: "Double Ka Meetha",           price: 3.49,  emoji: "🍞",  veg: true  },
];

// ── Customers ─────────────────────────────────────────────
const CUSTOMERS = [
  { id: "C001", name: "Priya Sharma",    email: "priya.sharma@email.com",  phone: "+44 7700 900123", joined: new Date("2024-01-15") },
  { id: "C002", name: "James Wilson",    email: "j.wilson@email.com",      phone: "+44 7700 900456", joined: new Date("2024-03-22") },
  { id: "C003", name: "Ananya Reddy",    email: "ananya.r@email.com",      phone: "+44 7700 900789", joined: new Date("2023-11-08") },
  { id: "C004", name: "Michael Chen",    email: "m.chen@email.com",        phone: "+44 7700 900321", joined: new Date("2024-06-01") },
  { id: "C005", name: "Sarah Thompson",  email: "s.thompson@email.com",    phone: "+44 7700 900654", joined: new Date("2024-02-14") },
  { id: "C006", name: "Rahul Mehta",     email: "r.mehta@email.com",       phone: "+44 7700 900987", joined: new Date("2024-08-19") },
  { id: "C007", name: "Emma Davis",      email: "e.davis@email.com",       phone: "+44 7700 900111", joined: new Date("2023-12-01") },
  { id: "C008", name: "David Park",      email: "d.park@email.com",        phone: "+44 7700 900222", joined: new Date("2024-09-05") },
  { id: "C009", name: "Aisha Khan",      email: "a.khan@email.com",        phone: "+44 7700 900333", joined: new Date("2024-04-11") },
  { id: "C010", name: "Oliver Brown",    email: "o.brown@email.com",       phone: "+44 7700 900444", joined: new Date("2025-01-20") },
  { id: "C011", name: "Deepika Nair",    email: "d.nair@email.com",        phone: "+44 7700 900555", joined: new Date("2025-02-28") },
  { id: "C012", name: "Tom Williams",    email: "t.williams@email.com",    phone: "+44 7700 900666", joined: new Date("2025-04-03") },
];

// ── Per-month revenue targets ──────────────────────────────
const MONTHLY_TARGETS = [
  { label: "May 25",  base: 28_400,  orders: 420 },
  { label: "Jun 25",  base: 31_200,  orders: 462 },
  { label: "Jul 25",  base: 34_800,  orders: 515 },
  { label: "Aug 25",  base: 32_100,  orders: 476 },
  { label: "Sep 25",  base: 29_600,  orders: 439 },
  { label: "Oct 25",  base: 27_300,  orders: 405 },
  { label: "Nov 25",  base: 30_100,  orders: 446 },
  { label: "Dec 25",  base: 38_900,  orders: 577 },
  { label: "Jan 26",  base: 22_400,  orders: 332 },
  { label: "Feb 26",  base: 24_800,  orders: 368 },
  { label: "Mar 26",  base: 27_600,  orders: 409 },
  { label: "Apr 26",  base: 30_400,  orders: 451 },
];

// ── Realistic order combos ────────────────────────────────
const COMBOS = [
  [{ id: "chicken-dum-biryani",   qty: 1 }, { id: "mango-lassi",          qty: 1 }],
  [{ id: "butter-chicken",        qty: 1 }, { id: "jeera-rice",           qty: 1 }, { id: "mango-lassi",       qty: 1 }],
  [{ id: "lamb-biryani",          qty: 1 }, { id: "dal-tadka",            qty: 1 }],
  [{ id: "fish-and-chips",        qty: 1 }, { id: "coke-can",             qty: 1 }],
  [{ id: "chicken-65",            qty: 1 }, { id: "veg-biryani",          qty: 1 }, { id: "mango-lassi",       qty: 1 }],
  [{ id: "chicken-wings",         qty: 1 }, { id: "pepperoni-pizza",      qty: 1 }],
  [{ id: "paneer-butter-masala",  qty: 1 }, { id: "dal-tadka",            qty: 1 }, { id: "plain-rice",        qty: 2 }],
  [{ id: "chilli-paneer",         qty: 1 }, { id: "butter-chicken",       qty: 1 }, { id: "jeera-rice",        qty: 1 }],
  [{ id: "veg-biryani",           qty: 1 }, { id: "gulab-jamun",          qty: 1 }],
  [{ id: "prawn-biryani",         qty: 1 }, { id: "prawn-65",             qty: 1 }],
  [{ id: "masala-dosa",           qty: 1 }, { id: "masala-tea",           qty: 2 }],
  [{ id: "chicken-dum-biryani",   qty: 2 }, { id: "gulab-jamun",          qty: 2 }],
  [{ id: "veg-samosa",            qty: 1 }, { id: "paneer-butter-masala", qty: 1 }, { id: "masala-tea",        qty: 2 }],
  [{ id: "chicken-65",            qty: 1 }, { id: "butter-chicken",       qty: 1 }, { id: "jeera-rice",        qty: 2 }, { id: "double-ka-meetha", qty: 1 }],
  [{ id: "peri-peri-chicken-burger", qty: 2 }, { id: "coke-can",          qty: 2 }],
  [{ id: "fish-and-chips",        qty: 2 }, { id: "coke-can",             qty: 2 }],
  [{ id: "chicken-fried-rice",    qty: 1 }, { id: "chicken-noodles",      qty: 1 }],
  [{ id: "lamb-pepper-fry",       qty: 1 }, { id: "lamb-biryani",         qty: 1 }],
];

async function main() {
  console.log("🌱 Seeding Abhiruchulu database…");

  // ── 1. Clean existing data ────────────────────────────
  await db.couponRedemption.deleteMany();
  await db.coupon.deleteMany();
  await db.review.deleteMany();
  await db.orderItem.deleteMany();
  await db.order.deleteMany();
  await db.customer.deleteMany();
  await db.menuItem.deleteMany();
  await db.menuCategory.deleteMany();
  await db.inventoryItem.deleteMany();
  console.log("  ✓ Cleared existing data");

  // ── 2. Categories ─────────────────────────────────────
  const catRecords = await Promise.all(
    CATS.map(c =>
      db.menuCategory.create({ data: { name: c.name, displayOrder: c.displayOrder } })
    )
  );
  const catMap = Object.fromEntries(catRecords.map(c => [c.name, c.id]));
  console.log(`  ✓ Created ${catRecords.length} categories`);

  // ── 3. Menu items ─────────────────────────────────────
  for (const item of ITEMS) {
    await db.menuItem.create({
      data: {
        id: item.id,
        categoryId: catMap[item.cat],
        name: item.name,
        price: item.price,
        emoji: item.emoji,
        isVegetarian: item.veg,
        isPopular: item.popular ?? false,
        isHero: item.hero ?? false,
        isAvailable: true,
      },
    });
  }
  const itemMap = Object.fromEntries(ITEMS.map(i => [i.id, i]));
  console.log(`  ✓ Created ${ITEMS.length} menu items`);

  // ── 4. Customers ──────────────────────────────────────
  for (const c of CUSTOMERS) {
    await db.customer.create({
      data: {
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        loyaltyPoints: 0,
        totalSpent: 0,
        totalOrders: 0,
        status: "active",
        joinedAt: c.joined,
      },
    });
  }
  console.log(`  ✓ Created ${CUSTOMERS.length} customers`);

  // ── 5. Coupons ────────────────────────────────────────
  await db.coupon.createMany({
    data: [
      { code: "SHEFFIELD10", title: "10% off for Sheffield locals",  discountType: "percent", discountValue: 10, minOrderAmount: 25, currentUses: 124, isActive: true  },
      { code: "BIRYANI20",   title: "20% off any Biryani dish",      discountType: "percent", discountValue: 20, minOrderAmount: 15, currentUses: 87,  isActive: true  },
      { code: "WELCOME15",   title: "15% off your first order",      discountType: "percent", discountValue: 15, minOrderAmount: 20, currentUses: 312, isActive: true  },
      { code: "SAVE5",       title: "£5 off orders over £30",        discountType: "flat",    discountValue: 5,  minOrderAmount: 30, currentUses: 43,  isActive: false },
    ],
  });
  console.log("  ✓ Created coupons");

  // ── 6. Inventory ──────────────────────────────────────
  const inventory = [
    { id: "I001", name: "Basmati Rice",      category: "Grains",     currentStock: 45,  unit: "kg",   minStockLevel: 20,  maxStockLevel: 100 },
    { id: "I002", name: "Chicken (Fresh)",   category: "Protein",    currentStock: 8,   unit: "kg",   minStockLevel: 15,  maxStockLevel: 50  },
    { id: "I003", name: "Lamb/Mutton",       category: "Protein",    currentStock: 6,   unit: "kg",   minStockLevel: 10,  maxStockLevel: 30  },
    { id: "I004", name: "Tomatoes",          category: "Vegetables", currentStock: 12,  unit: "kg",   minStockLevel: 10,  maxStockLevel: 40  },
    { id: "I005", name: "Onions",            category: "Vegetables", currentStock: 28,  unit: "kg",   minStockLevel: 15,  maxStockLevel: 60  },
    { id: "I006", name: "Ginger",            category: "Spices",     currentStock: 3,   unit: "kg",   minStockLevel: 5,   maxStockLevel: 15  },
    { id: "I007", name: "Ghee",              category: "Dairy",      currentStock: 18,  unit: "L",    minStockLevel: 10,  maxStockLevel: 40  },
    { id: "I008", name: "Paneer",            category: "Dairy",      currentStock: 9,   unit: "kg",   minStockLevel: 8,   maxStockLevel: 25  },
    { id: "I009", name: "Biryani Masala",    category: "Spices",     currentStock: 7,   unit: "kg",   minStockLevel: 5,   maxStockLevel: 20  },
    { id: "I010", name: "Saffron",           category: "Spices",     currentStock: 0.2, unit: "kg",   minStockLevel: 0.5, maxStockLevel: 2   },
    { id: "I011", name: "Cooking Oil",       category: "Oils",       currentStock: 40,  unit: "L",    minStockLevel: 20,  maxStockLevel: 80  },
    { id: "I012", name: "Yoghurt",           category: "Dairy",      currentStock: 22,  unit: "kg",   minStockLevel: 10,  maxStockLevel: 40  },
  ];
  for (const item of inventory) {
    await db.inventoryItem.create({ data: item });
  }
  console.log("  ✓ Created inventory items");

  // ── 7. Historical orders — bulk insert via createMany ────
  let totalOrdersCreated = 0;
  const customerSpend: Record<string, number> = {};
  const customerOrderCount: Record<string, number> = {};

  const allOrderRows: any[] = [];
  const allOrderItemRows: any[] = [];

  for (let m = 0; m < 12; m++) {
    const monthStart = new Date(YEAR_START);
    monthStart.setMonth(monthStart.getMonth() + m);
    const monthEnd = new Date(monthStart);
    monthEnd.setMonth(monthEnd.getMonth() + 1);

    const target = MONTHLY_TARGETS[m];
    const numOrders = target.orders;
    const avgPerOrder = target.base / numOrders;

    for (let o = 0; o < numOrders; o++) {
      const daysInMonth = Math.floor((monthEnd.getTime() - monthStart.getTime()) / 86_400_000);
      const orderDay = addDays(monthStart, Math.floor(Math.random() * daysInMonth));
      const orderDate = addHours(orderDay, rnd(11, 22));

      if (orderDate >= TODAY) continue;

      const customer = pick(CUSTOMERS);
      const combo = pick(COMBOS);

      let subtotal = 0;
      const lineItems = combo.map(li => {
        const item = itemMap[li.id];
        const lineTotal = item.price * li.qty;
        subtotal += lineTotal;
        return { ...li, item, lineTotal };
      });

      const scaleFactor = Math.max(0.8, Math.min(2.0, avgPerOrder / (subtotal || 1)));
      const adjustedSubtotal = Math.round(subtotal * scaleFactor * 100) / 100;
      const deliveryFee = adjustedSubtotal >= 35 ? 0 : 2.99;
      const total = adjustedSubtotal + deliveryFee;
      const orderId = nextOrderId();

      customerSpend[customer.id] = (customerSpend[customer.id] ?? 0) + total;
      customerOrderCount[customer.id] = (customerOrderCount[customer.id] ?? 0) + 1;
      totalOrdersCreated++;

      allOrderRows.push({
        id: orderId,
        customerId: customer.id,
        orderType: Math.random() > 0.4 ? "delivery" : "collection",
        status: "delivered",
        paymentStatus: "paid",
        paymentMethod: pick(["card", "card", "card", "applepay", "cash"]),
        subtotal: adjustedSubtotal,
        discountAmount: 0,
        deliveryFee,
        total,
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone ?? "",
        deliveryAddress: "Sheffield, UK",
        deliveryPostcode: "S11 8JD",
        estimatedMinutes: Math.floor(rnd(25, 45)),
        placedAt: orderDate,
      });

      for (const li of lineItems) {
        allOrderItemRows.push({
          orderId,
          menuItemId: li.id,
          itemName: li.item.name,
          itemEmoji: li.item.emoji,
          unitPrice: Math.round(li.item.price * scaleFactor * 100) / 100,
          quantity: li.qty,
          lineTotal: Math.round(li.lineTotal * scaleFactor * 100) / 100,
        });
      }
    }
  }

  // Two bulk inserts — orders then items
  await db.order.createMany({ data: allOrderRows });
  await db.orderItem.createMany({ data: allOrderItemRows });
  console.log(`  ✓ Created ${totalOrdersCreated} historical orders (bulk)`);

  // ── 8. Today's orders ────────────────────────────────
  const todayStatuses: Array<{ status: string; hoursAgo: number }> = [
    { status: "delivered",         hoursAgo: 6 },
    { status: "delivered",         hoursAgo: 5.5 },
    { status: "delivered",         hoursAgo: 4.8 },
    { status: "delivered",         hoursAgo: 4.2 },
    { status: "delivered",         hoursAgo: 3.5 },
    { status: "out-for-delivery",  hoursAgo: 1.2 },
    { status: "out-for-delivery",  hoursAgo: 0.8 },
    { status: "preparing",         hoursAgo: 0.6 },
    { status: "preparing",         hoursAgo: 0.4 },
    { status: "confirmed",         hoursAgo: 0.2 },
    { status: "confirmed",         hoursAgo: 0.1 },
    { status: "cancelled",         hoursAgo: 5 },
  ];

  const todayOrderRows: any[] = [];
  const todayItemRows: any[] = [];
  for (let i = 0; i < todayStatuses.length; i++) {
    const { status, hoursAgo } = todayStatuses[i];
    const customer = CUSTOMERS[i % CUSTOMERS.length];
    const combo = COMBOS[i % COMBOS.length];
    const orderDate = addHours(TODAY, 9 + (12 - hoursAgo));

    let subtotal = 0;
    const lineItems = combo.map(li => {
      const item = itemMap[li.id];
      const lineTotal = item.price * li.qty;
      subtotal += lineTotal;
      return { ...li, item, lineTotal };
    });
    subtotal = Math.round(subtotal * 100) / 100;
    const deliveryFee = subtotal >= 35 ? 0 : 2.99;
    const total = Math.round((subtotal + deliveryFee) * 100) / 100;

    const orderId = nextOrderId();

    if (status !== "cancelled") {
      customerSpend[customer.id] = (customerSpend[customer.id] ?? 0) + total;
      customerOrderCount[customer.id] = (customerOrderCount[customer.id] ?? 0) + 1;
    }

    todayOrderRows.push({
      id: orderId,
      customerId: customer.id,
      orderType: "delivery",
      status,
      paymentStatus: status === "cancelled" ? "refunded" : "paid",
      paymentMethod: "card",
      subtotal,
      discountAmount: 0,
      deliveryFee,
      total,
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone ?? "",
      deliveryAddress: "Sheffield, UK",
      deliveryPostcode: "S11 8JD",
      estimatedMinutes: 35,
      placedAt: orderDate,
    });

    for (const li of lineItems) {
      todayItemRows.push({
        orderId,
        menuItemId: li.id,
        itemName: li.item.name,
        itemEmoji: li.item.emoji,
        unitPrice: li.item.price,
        quantity: li.qty,
        lineTotal: li.lineTotal,
      });
    }
  }
  await db.order.createMany({ data: todayOrderRows });
  await db.orderItem.createMany({ data: todayItemRows });
  console.log("  ✓ Created today's orders");

  // ── 9. This week's orders (Mon–Sat before today) ──────
  const WEEK_MON = new Date("2026-05-11T00:00:00.000Z");
  const weekDays = [
    { day: 0, label: "Mon", ordersCount: 32, avgVal: 26 },
    { day: 1, label: "Tue", ordersCount: 29, avgVal: 27 },
    { day: 2, label: "Wed", ordersCount: 38, avgVal: 28 },
    { day: 3, label: "Thu", ordersCount: 35, avgVal: 27 },
    { day: 4, label: "Fri", ordersCount: 54, avgVal: 30 },
    { day: 5, label: "Sat", ordersCount: 62, avgVal: 31 },
  ];
  let weekOrderCount = 0;
  const weekOrderRows: any[] = [];
  const weekItemRows: any[] = [];
  for (const wd of weekDays) {
    const dayStart = addDays(WEEK_MON, wd.day);
    for (let o = 0; o < wd.ordersCount; o++) {
      const orderDate = addMins(addHours(dayStart, 11), Math.floor(Math.random() * 660));
      const customer = pick(CUSTOMERS);
      const combo = pick(COMBOS);

      let subtotal = 0;
      const lineItems = combo.map(li => {
        const item = itemMap[li.id];
        const lineTotal = item.price * li.qty;
        subtotal += lineTotal;
        return { ...li, item, lineTotal };
      });
      subtotal = Math.round(subtotal * 100) / 100;
      const deliveryFee = subtotal >= 35 ? 0 : 2.99;
      const total = Math.round((subtotal + deliveryFee) * 100) / 100;

      const orderId = nextOrderId();
      customerSpend[customer.id] = (customerSpend[customer.id] ?? 0) + total;
      customerOrderCount[customer.id] = (customerOrderCount[customer.id] ?? 0) + 1;
      weekOrderCount++;

      weekOrderRows.push({
        id: orderId,
        customerId: customer.id,
        orderType: "delivery",
        status: "delivered",
        paymentStatus: "paid",
        paymentMethod: pick(["card", "card", "applepay"]),
        subtotal, discountAmount: 0, deliveryFee, total,
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone ?? "",
        deliveryAddress: "Sheffield, UK",
        deliveryPostcode: "S11 8JD",
        estimatedMinutes: 35,
        placedAt: orderDate,
      });

      for (const li of lineItems) {
        weekItemRows.push({
          orderId,
          menuItemId: li.id,
          itemName: li.item.name,
          itemEmoji: li.item.emoji,
          unitPrice: li.item.price,
          quantity: li.qty,
          lineTotal: li.lineTotal,
        });
      }
    }
  }
  await db.order.createMany({ data: weekOrderRows });
  await db.orderItem.createMany({ data: weekItemRows });
  console.log(`  ✓ Created ${weekOrderCount} orders for Mon–Sat this week`);

  // ── 10. Update customer totals ─────────────────────────
  for (const [id, spent] of Object.entries(customerSpend)) {
    const points = Math.floor(spent * 2);
    await db.customer.update({
      where: { id },
      data: {
        totalSpent: Math.round(spent * 100) / 100,
        totalOrders: customerOrderCount[id] ?? 0,
        loyaltyPoints: points,
        lastOrderAt: new Date(),
      },
    });
  }
  console.log("  ✓ Updated customer totals");

  // ── 11. Reviews ───────────────────────────────────────
  await db.review.createMany({
    data: [
      { id: "R001", customerId: "C001", menuItemId: "chicken-dum-biryani", customerName: "Priya Sharma",   avatarInitials: "PS", rating: 5, reviewText: "Absolutely phenomenal biryani! The rice was perfectly cooked and the spices were balanced just right. Reminds me of home cooking in Hyderabad.", helpfulCount: 8,  status: "published", publishedAt: addDays(TODAY, -2) },
      { id: "R002", customerId: "C002", menuItemId: "fish-and-chips",       customerName: "James Wilson",   avatarInitials: "JW", rating: 4, reviewText: "Proper fish and chips — batter was crispy and the curry sauce was delicious. Delivery was slightly late but worth the wait.", helpfulCount: 5, status: "published", publishedAt: addDays(TODAY, -4) },
      { id: "R003", customerId: "C007", menuItemId: "veg-biryani",          customerName: "Emma Davis",     avatarInitials: "ED", rating: 5, reviewText: "Best vegetarian biryani I've had in Sheffield. Loved the whole spices and the saffron flavour. Great value for money.", helpfulCount: 12, status: "published", publishedAt: addDays(TODAY, -7) },
      { id: "R004", customerId: "C004", menuItemId: "chicken-65",           customerName: "Michael Chen",   avatarInitials: "MC", rating: 3, reviewText: "Good flavour but portion size was smaller than expected for the price. The dipping sauce was excellent though.", helpfulCount: 2, status: "pending" },
      { id: "R005", customerId: "C003", menuItemId: "masala-dosa",          customerName: "Ananya Reddy",   avatarInitials: "AR", rating: 5, reviewText: "This masala dosa brought tears to my eyes — it tasted exactly like my grandmother's recipe. A rare find in the UK.", helpfulCount: 19, status: "published", publishedAt: addDays(TODAY, -14) },
    ],
  });
  console.log("  ✓ Created reviews");

  const orderTotal = await db.order.count();
  const customerTotal = await db.customer.count();
  console.log(`\n✅ Seed complete! ${orderTotal} orders, ${customerTotal} customers in DB.`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
