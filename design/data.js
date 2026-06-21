/* ============================================================
   Data — menu items, coupons, restaurant config
   Matches what's defined in the Admin panel screenshots
   ============================================================ */

const RESTAURANT = {
  name: "Abhiruchulu",
  tagline: "Authentic South Indian Cuisine in the Heart of Sheffield",
  est: 2000,
  address: "142 Ecclesall Road, Sheffield, S11 8JD",
  phone: "+44 114 267 8899",
  email: "hello@abhiruchulu.co.uk",
  hours: [
    { day: "Mon – Thu", time: "12:00pm – 10:00pm" },
    { day: "Fri – Sat", time: "12:00pm – 11:00pm" },
    { day: "Sunday",    time: "12:00pm – 9:30pm" },
  ],
  minOrder: 15,
  deliveryCharge: 2.99,
  freeDeliveryThreshold: 35,
};

const CATEGORIES = ["All", "Starters", "Mains", "Breads", "Rice", "Desserts", "Drinks"];

const MENU = [
  // Starters
  { id: "veg-samosa",    name: "Veg Samosa",      price: 4.99,  category: "Starters", veg: true,  emoji: "🥟", desc: "Crispy golden pastry stuffed with spiced potatoes and peas, served with tamarind chutney." },
  { id: "paneer-tikka",  name: "Paneer Tikka",    price: 6.99,  category: "Starters", veg: true,  emoji: "🧀", desc: "Cubes of paneer marinated in yoghurt and spices, char-grilled in the tandoor.", popular: true },
  { id: "prawn-fry",     name: "Prawn Fry",       price: 9.99,  category: "Starters", veg: false, emoji: "🦐", desc: "Andhra-style prawns tossed with curry leaves, mustard seeds and dry red chillies." },
  { id: "chicken-65",    name: "Chicken 65",      price: 7.99,  category: "Starters", veg: false, emoji: "🌶️", desc: "Sheffield's favourite — spicy, deep-fried chicken tossed with green chilli and curry leaves.", popular: true },

  // Mains
  { id: "butter-chicken",  name: "Butter Chicken",     price: 13.99, category: "Mains", veg: false, emoji: "🍲", desc: "Tandoori chicken simmered in silky tomato-cream gravy with fenugreek leaves." },
  { id: "palak-paneer",    name: "Palak Paneer",       price: 11.99, category: "Mains", veg: true,  emoji: "🥬", desc: "Soft paneer cubes in a smooth, fragrant spinach gravy." },
  { id: "andhra-fish-curry",name:"Andhra Fish Curry",  price: 16.99, category: "Mains", veg: false, emoji: "🐟", desc: "Fiery Andhra-style curry with tamarind, mustard and fresh sea bass.", popular: true },
  { id: "dal-makhani",     name: "Dal Makhani",        price: 10.99, category: "Mains", veg: true,  emoji: "🫘", desc: "Slow-cooked black lentils, butter, cream, finished with smoke." },
  { id: "lamb-rogan-josh", name: "Lamb Rogan Josh",    price: 15.99, category: "Mains", veg: false, emoji: "🥩", desc: "Kashmiri-style lamb braised with yoghurt, ginger and aromatic Kashmiri chilli." },

  // Breads
  { id: "garlic-naan",     name: "Garlic Naan",       price: 3.49, category: "Breads", veg: true,  emoji: "🫓", desc: "Tandoor-baked leavened bread brushed with garlic butter." },

  // Rice
  { id: "veg-biryani",        name: "Veg Biryani",       price: 11.99, category: "Rice", veg: true,  emoji: "🍚", desc: "Layered basmati and saffron with seasonal vegetables, slow-dum cooked." },
  { id: "jeera-rice",         name: "Jeera Rice",        price: 4.49,  category: "Rice", veg: true,  emoji: "🍚", desc: "Basmati rice tempered with whole cumin and ghee." },
  { id: "hyderabadi-biryani", name: "Hyderabadi Chicken Biryani", price: 14.99, category: "Rice", veg: false, emoji: "🍛", desc: "Our signature — chicken marinated overnight, dum-cooked under sealed dough.", popular: true, hero: true },

  // Desserts
  { id: "gulab-jamun", name: "Gulab Jamun", price: 4.99, category: "Desserts", veg: true, emoji: "🍮", desc: "Warm milk dumplings drenched in cardamom-rose syrup." },

  // Drinks
  { id: "mango-lassi", name: "Mango Lassi", price: 3.99, category: "Drinks", veg: true, emoji: "🥭", desc: "Chilled, creamy Alphonso mango yoghurt drink." },
];

const COUPONS = [
  { code: "SHEFFIELD10", title: "10% off for Sheffield locals", discount: 10, type: "percent", minOrder: 25, expiry: "2026-12-31" },
  { code: "BIRYANI20",   title: "20% off any Biryani dish",    discount: 20, type: "percent", minOrder: 15, expiry: "2026-08-31" },
  { code: "WELCOME15",   title: "15% off your first order",    discount: 15, type: "percent", minOrder: 20, expiry: "2026-12-31" },
  { code: "SAVE5",       title: "£5 off orders over £30",      discount: 5,  type: "flat",    minOrder: 30, expiry: "2026-09-30" },
];

const REVIEWS = [
  { name: "Priya Krishnan",  rating: 5, text: "The Hyderabadi biryani took me straight back to my grandmother's kitchen. Best South Indian food in Sheffield, hands down.", role: "Local regular" },
  { name: "James Holloway",  rating: 5, text: "Andhra Fish Curry is fierce, fragrant and unforgettable. We come back every Friday.", role: "Verified diner" },
  { name: "Aarti Sharma",    rating: 5, text: "Chicken 65 with a cold mango lassi — Sheffield's perfect Saturday night. Service is warm, food arrives fast.", role: "Loyalty member" },
];

window.__DATA = { RESTAURANT, CATEGORIES, MENU, COUPONS, REVIEWS };
