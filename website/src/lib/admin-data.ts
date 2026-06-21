export type OrderStatus = "confirmed" | "preparing" | "out-for-delivery" | "delivered" | "cancelled" | "pending";
export type PaymentStatus = "paid" | "pending" | "refunded";

export interface AdminOrder {
  id: string;
  customer: string;
  email: string;
  items: string;
  itemCount: number;
  total: number;
  status: OrderStatus;
  payment: PaymentStatus;
  time: string;
  date: string;
  address: string;
  phone: string;
}

export interface AdminCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  orders: number;
  spent: number;
  points: number;
  joined: string;
  lastOrder: string;
  status: "active" | "inactive";
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  stock: number;
  unit: string;
  minStock: number;
  maxStock: number;
  lastUpdated: string;
}

export interface WeeklyRevenue {
  day: string;
  revenue: number;
  orders: number;
}

export interface MonthlyRevenue {
  month: string;
  revenue: number;
  orders: number;
}

export const ADMIN_STATS = {
  todayRevenue: 1284,
  todayRevenueChange: 12.5,
  activeOrders: 8,
  activeOrdersChange: 3,
  totalCustomers: 342,
  totalCustomersChange: 5.2,
  avgOrderValue: 28.4,
  avgOrderValueChange: 2.1,
  tablesTurnover: 6,
  tablesTurnoverChange: 1,
  menuItemsSold: 147,
  menuItemsSoldChange: 18,
};

export const WEEKLY_REVENUE: WeeklyRevenue[] = [
  { day: "Mon", revenue: 820, orders: 29 },
  { day: "Tue", revenue: 940, orders: 33 },
  { day: "Wed", revenue: 1100, orders: 39 },
  { day: "Thu", revenue: 1050, orders: 37 },
  { day: "Fri", revenue: 1480, orders: 52 },
  { day: "Sat", revenue: 1720, orders: 61 },
  { day: "Sun", revenue: 1284, orders: 45 },
];

export const MONTHLY_REVENUE: MonthlyRevenue[] = [
  { month: "Jan", revenue: 18400, orders: 652 },
  { month: "Feb", revenue: 21200, orders: 748 },
  { month: "Mar", revenue: 19800, orders: 699 },
  { month: "Apr", revenue: 24600, orders: 868 },
  { month: "May", revenue: 22100, orders: 780 },
  { month: "Jun", revenue: 28900, orders: 1021 },
  { month: "Jul", revenue: 31200, orders: 1102 },
  { month: "Aug", revenue: 29400, orders: 1038 },
  { month: "Sep", revenue: 26800, orders: 947 },
  { month: "Oct", revenue: 30100, orders: 1063 },
  { month: "Nov", revenue: 27600, orders: 975 },
  { month: "Dec", revenue: 34800, orders: 1230 },
];

export const CATEGORY_BREAKDOWN = [
  { name: "Biryani", value: 38, color: "#ea580c" },
  { name: "Curries", value: 27, color: "#f59e0b" },
  { name: "Starters", value: 19, color: "#3b82f6" },
  { name: "Desserts", value: 16, color: "#8b5cf6" },
];

export const ADMIN_ORDERS: AdminOrder[] = [
  {
    id: "#1042",
    customer: "Priya Sharma",
    email: "priya.sharma@email.com",
    items: "Chicken Biryani, Raita, Gulab Jamun",
    itemCount: 3,
    total: 32.5,
    status: "preparing",
    payment: "paid",
    time: "12:34 PM",
    date: "Today",
    address: "14 Devonshire St, Sheffield S3 7SF",
    phone: "+44 7700 900123",
  },
  {
    id: "#1041",
    customer: "James Wilson",
    email: "j.wilson@email.com",
    items: "Lamb Rogan Josh, Garlic Naan × 2",
    itemCount: 3,
    total: 27.0,
    status: "out-for-delivery",
    payment: "paid",
    time: "12:18 PM",
    date: "Today",
    address: "72 Broomhall St, Sheffield S3 7SF",
    phone: "+44 7700 900456",
  },
  {
    id: "#1040",
    customer: "Ananya Reddy",
    email: "ananya.r@email.com",
    items: "Veg Biryani, Dal Makhani, Mango Lassi",
    itemCount: 3,
    total: 24.75,
    status: "delivered",
    payment: "paid",
    time: "11:52 AM",
    date: "Today",
    address: "5 Collegiate Crescent, Sheffield S10 2BP",
    phone: "+44 7700 900789",
  },
  {
    id: "#1039",
    customer: "Michael Chen",
    email: "m.chen@email.com",
    items: "Hyderabadi Haleem, Mirchi Bajji × 2",
    itemCount: 3,
    total: 19.5,
    status: "confirmed",
    payment: "paid",
    time: "11:30 AM",
    date: "Today",
    address: "31 Glossop Rd, Sheffield S10 2GW",
    phone: "+44 7700 900321",
  },
  {
    id: "#1038",
    customer: "Sarah Thompson",
    email: "s.thompson@email.com",
    items: "Chicken 65, Butter Naan, Rose Kheer",
    itemCount: 3,
    total: 22.0,
    status: "delivered",
    payment: "paid",
    time: "10:45 AM",
    date: "Today",
    address: "88 Ecclesall Rd, Sheffield S11 8JB",
    phone: "+44 7700 900654",
  },
  {
    id: "#1037",
    customer: "Rahul Mehta",
    email: "r.mehta@email.com",
    items: "Pesarattu Set, Filter Coffee × 2",
    itemCount: 3,
    total: 16.5,
    status: "cancelled",
    payment: "refunded",
    time: "10:12 AM",
    date: "Today",
    address: "22 Division St, Sheffield S1 4GF",
    phone: "+44 7700 900987",
  },
  {
    id: "#1036",
    customer: "Emma Davis",
    email: "e.davis@email.com",
    items: "Mutton Curry, Paratha × 2, Gulab Jamun",
    itemCount: 4,
    total: 34.0,
    status: "delivered",
    payment: "paid",
    time: "Yesterday",
    date: "Yesterday",
    address: "44 West St, Sheffield S1 4EX",
    phone: "+44 7700 900111",
  },
  {
    id: "#1035",
    customer: "David Park",
    email: "d.park@email.com",
    items: "Paneer Tikka, Veg Biryani, Lassi",
    itemCount: 3,
    total: 28.25,
    status: "delivered",
    payment: "paid",
    time: "Yesterday",
    date: "Yesterday",
    address: "9 Fargate, Sheffield S1 2HD",
    phone: "+44 7700 900222",
  },
];

export const ADMIN_CUSTOMERS: AdminCustomer[] = [
  {
    id: "C001",
    name: "Priya Sharma",
    email: "priya.sharma@email.com",
    phone: "+44 7700 900123",
    orders: 24,
    spent: 612.5,
    points: 1225,
    joined: "Jan 2024",
    lastOrder: "Today",
    status: "active",
  },
  {
    id: "C002",
    name: "James Wilson",
    email: "j.wilson@email.com",
    phone: "+44 7700 900456",
    orders: 18,
    spent: 441.0,
    points: 882,
    joined: "Mar 2024",
    lastOrder: "Today",
    status: "active",
  },
  {
    id: "C003",
    name: "Ananya Reddy",
    email: "ananya.r@email.com",
    phone: "+44 7700 900789",
    orders: 31,
    spent: 784.25,
    points: 1568,
    joined: "Nov 2023",
    lastOrder: "Today",
    status: "active",
  },
  {
    id: "C004",
    name: "Michael Chen",
    email: "m.chen@email.com",
    phone: "+44 7700 900321",
    orders: 9,
    spent: 198.0,
    points: 396,
    joined: "Jun 2024",
    lastOrder: "Today",
    status: "active",
  },
  {
    id: "C005",
    name: "Sarah Thompson",
    email: "s.thompson@email.com",
    phone: "+44 7700 900654",
    orders: 15,
    spent: 367.5,
    points: 735,
    joined: "Feb 2024",
    lastOrder: "Today",
    status: "active",
  },
  {
    id: "C006",
    name: "Rahul Mehta",
    email: "r.mehta@email.com",
    phone: "+44 7700 900987",
    orders: 7,
    spent: 142.0,
    points: 142,
    joined: "Aug 2024",
    lastOrder: "2 days ago",
    status: "active",
  },
  {
    id: "C007",
    name: "Emma Davis",
    email: "e.davis@email.com",
    phone: "+44 7700 900111",
    orders: 22,
    spent: 589.0,
    points: 1178,
    joined: "Dec 2023",
    lastOrder: "Yesterday",
    status: "active",
  },
  {
    id: "C008",
    name: "David Park",
    email: "d.park@email.com",
    phone: "+44 7700 900222",
    orders: 5,
    spent: 118.75,
    points: 237,
    joined: "Sep 2024",
    lastOrder: "Yesterday",
    status: "inactive",
  },
];

export const INVENTORY_ITEMS: InventoryItem[] = [
  { id: "I001", name: "Basmati Rice", category: "Grains", stock: 45, unit: "kg", minStock: 20, maxStock: 100, lastUpdated: "Today" },
  { id: "I002", name: "Chicken (Fresh)", category: "Protein", stock: 8, unit: "kg", minStock: 15, maxStock: 50, lastUpdated: "Today" },
  { id: "I003", name: "Lamb/Mutton", category: "Protein", stock: 6, unit: "kg", minStock: 10, maxStock: 30, lastUpdated: "Today" },
  { id: "I004", name: "Tomatoes", category: "Vegetables", stock: 12, unit: "kg", minStock: 10, maxStock: 40, lastUpdated: "Today" },
  { id: "I005", name: "Onions", category: "Vegetables", stock: 28, unit: "kg", minStock: 15, maxStock: 60, lastUpdated: "Yesterday" },
  { id: "I006", name: "Ginger", category: "Spices", stock: 3, unit: "kg", minStock: 5, maxStock: 15, lastUpdated: "Today" },
  { id: "I007", name: "Garlic", category: "Spices", stock: 4, unit: "kg", minStock: 5, maxStock: 15, lastUpdated: "Yesterday" },
  { id: "I008", name: "Ghee", category: "Dairy", stock: 18, unit: "L", minStock: 10, maxStock: 40, lastUpdated: "2 days ago" },
  { id: "I009", name: "Paneer", category: "Dairy", stock: 9, unit: "kg", minStock: 8, maxStock: 25, lastUpdated: "Today" },
  { id: "I010", name: "Yoghurt", category: "Dairy", stock: 22, unit: "kg", minStock: 10, maxStock: 40, lastUpdated: "Today" },
  { id: "I011", name: "Biryani Masala", category: "Spices", stock: 7, unit: "kg", minStock: 5, maxStock: 20, lastUpdated: "3 days ago" },
  { id: "I012", name: "Refined Flour (Maida)", category: "Grains", stock: 30, unit: "kg", minStock: 20, maxStock: 80, lastUpdated: "Yesterday" },
  { id: "I013", name: "Cooking Oil", category: "Oils", stock: 40, unit: "L", minStock: 20, maxStock: 80, lastUpdated: "2 days ago" },
  { id: "I014", name: "Saffron", category: "Spices", stock: 0.2, unit: "kg", minStock: 0.5, maxStock: 2, lastUpdated: "5 days ago" },
  { id: "I015", name: "Cardamom", category: "Spices", stock: 1.8, unit: "kg", minStock: 1, maxStock: 5, lastUpdated: "3 days ago" },
  { id: "I016", name: "Mango Pulp", category: "Fruits", stock: 15, unit: "cans", minStock: 10, maxStock: 48, lastUpdated: "Yesterday" },
];

export const ADMIN_REVIEWS = [
  {
    id: "R001",
    customer: "Priya Sharma",
    avatar: "PS",
    rating: 5,
    date: "2 days ago",
    item: "Chicken Biryani",
    text: "Absolutely phenomenal biryani! The rice was perfectly cooked and the spices were balanced just right. Reminds me of home cooking in Hyderabad. Will definitely order again.",
    status: "published",
    helpful: 8,
  },
  {
    id: "R002",
    customer: "James Wilson",
    avatar: "JW",
    rating: 4,
    date: "4 days ago",
    item: "Lamb Rogan Josh",
    text: "Really enjoyed the Rogan Josh. The lamb was tender and the gravy had good depth of flavour. Naan bread was also excellent. Only minor point — delivery was slightly late.",
    status: "published",
    helpful: 5,
  },
  {
    id: "R003",
    customer: "Emma Davis",
    avatar: "ED",
    rating: 5,
    date: "1 week ago",
    item: "Veg Biryani",
    text: "Best vegetarian biryani I've had in Sheffield. Loved the whole spices and the saffron flavour. The raita complemented it perfectly. Great value for money.",
    status: "published",
    helpful: 12,
  },
  {
    id: "R004",
    customer: "Michael Chen",
    avatar: "MC",
    rating: 3,
    date: "1 week ago",
    item: "Chicken 65",
    text: "Good flavour but portion size was smaller than expected for the price. The dipping sauce was excellent though. Would try other dishes next time.",
    status: "pending",
    helpful: 2,
  },
  {
    id: "R005",
    customer: "Ananya Reddy",
    avatar: "AR",
    rating: 5,
    date: "2 weeks ago",
    item: "Hyderabadi Haleem",
    text: "This haleem brought tears to my eyes — it tasted exactly like what my grandmother used to make. The slow-cooked texture and spicing are absolutely authentic. A rare find in the UK.",
    status: "published",
    helpful: 19,
  },
];
