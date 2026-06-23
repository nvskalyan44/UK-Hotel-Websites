import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL ?? "postgresql://kalyan@localhost:5432/abhiruchulu",
});
const prisma = new PrismaClient({ adapter } as any);

type V = { label: string; price: number };
type Item = {
  id: string; name: string; desc: string; price: number;
  category: string; emoji: string; veg: boolean;
  variants?: V[];
};

const biryaniV = (half: number, full: number): V[] => [
  { label: "Half", price: half },
  { label: "Full", price: full },
];
const wingsV = (s: number, m: number, l: number): V[] => [
  { label: "6 pcs", price: s },
  { label: "10 pcs", price: m },
  { label: "12 pcs", price: l },
];
const pizzaV = (sm: number, md: number, lg: number): V[] => [
  { label: `7" Small`, price: sm },
  { label: `10" Medium`, price: md },
  { label: `12" Large`, price: lg },
];

const ITEMS: Item[] = [
  // ── TIFFINS ──────────────────────────────────────────────────────
  { id: "plain-dosa", name: "Plain Dosa", desc: "A crispy, golden South Indian crepe made from fermented rice and lentil batter.", price: 3.99, category: "Tiffins", emoji: "🫓", veg: true },
  { id: "onion-dosa", name: "Onion Dosa", desc: "Crispy dosa topped with finely chopped onions for extra flavour and crunch.", price: 4.99, category: "Tiffins", emoji: "🧅", veg: true },
  { id: "masala-dosa", name: "Masala Dosa", desc: "Classic dosa filled with spiced mashed potato masala, served with chutney and sambar.", price: 5.49, category: "Tiffins", emoji: "🫓", veg: true },
  { id: "mysore-masala-dosa", name: "Mysore Masala Dosa", desc: "A spicy twist with Mysore chutney and stuffed with flavourful potato masala.", price: 5.99, category: "Tiffins", emoji: "🫓", veg: true },
  { id: "ghee-podi-dosa", name: "Ghee Podi Dosa", desc: "Dosa spread with aromatic ghee and sprinkled with spiced lentil podi.", price: 5.99, category: "Tiffins", emoji: "🫓", veg: true },
  { id: "ghee-karam-dosa", name: "Ghee Karam Dosa", desc: "Crispy dosa coated with ghee and fiery karam spice mix.", price: 5.99, category: "Tiffins", emoji: "🫓", veg: true },
  { id: "egg-dosa", name: "Egg Dosa", desc: "Dosa topped with a seasoned egg layer, freshly cooked on the griddle.", price: 5.99, category: "Tiffins", emoji: "🍳", veg: false },
  { id: "chicken-masala-dosa", name: "Chicken Masala Dosa", desc: "A hearty dosa filled with rich and flavourful chicken masala.", price: 6.99, category: "Tiffins", emoji: "🫓", veg: false },
  { id: "plain-idly", name: "Plain Idly (4 pcs)", desc: "Soft, fluffy steamed rice cakes served with chutney.", price: 4.99, category: "Tiffins", emoji: "🍚", veg: true },
  { id: "sambar-idly", name: "Sambar Idly (4 pcs)", desc: "Idlies soaked in hot, flavourful lentil sambar.", price: 5.99, category: "Tiffins", emoji: "🍲", veg: true },
  { id: "ghee-podi-idly", name: "Ghee Podi Idly (9 pcs)", desc: "Mini idlies tossed in ghee and coated with aromatic spiced podi.", price: 5.99, category: "Tiffins", emoji: "🍚", veg: true },
  { id: "mysore-bonda", name: "Mysore Bonda (5 pcs)", desc: "Crispy outside and soft inside, deep-fried savoury dumplings.", price: 5.99, category: "Tiffins", emoji: "🟤", veg: true },
  { id: "poori-with-curry", name: "Poori (2) with Curry", desc: "Fluffy fried bread served with a deliciously spiced curry.", price: 5.99, category: "Tiffins", emoji: "🫓", veg: true },
  { id: "chapathi-with-curry", name: "Chapathi (2) with Curry", desc: "Soft whole wheat flatbreads served with flavourful curry.", price: 5.99, category: "Tiffins", emoji: "🫓", veg: true },
  { id: "paratha-with-sherwa", name: "Paratha (2) with Sherwa", desc: "Layered, flaky flatbreads served with rich, aromatic gravy.", price: 5.99, category: "Tiffins", emoji: "🫓", veg: true },
  { id: "khichdi-with-sherwa", name: "Khichdi with Sherwa", desc: "Comforting rice and lentil dish served with spiced gravy.", price: 6.99, category: "Tiffins", emoji: "🍲", veg: true },

  // ── SNACKS ───────────────────────────────────────────────────────
  { id: "punugulu", name: "Punugulu (Approx. 16)", desc: "Crispy deep-fried dumplings made from fermented dosa batter, soft inside and crunchy outside.", price: 4.99, category: "Snacks", emoji: "🟤", veg: true },
  { id: "ghee-karam-punugulu", name: "Ghee Karam Punugulu (Approx. 16)", desc: "Punugulu tossed in aromatic ghee and spicy karam powder for extra flavour.", price: 5.99, category: "Snacks", emoji: "🟤", veg: true },
  { id: "mirchi-bajji", name: "Mirchi Bajji", desc: "Large green chillies dipped in gram flour batter and deep-fried to perfection.", price: 3.00, category: "Snacks", emoji: "🌶️", veg: true },
  { id: "cut-bajji", name: "Cut Bajji", desc: "Sliced mirchi bajji topped with onions, chutneys, and spices for a street-style taste.", price: 3.49, category: "Snacks", emoji: "🌶️", veg: true },
  { id: "onion-pakoda", name: "Onion Pakoda", desc: "Crispy fritters made with sliced onions, gram flour, and spices.", price: 2.99, category: "Snacks", emoji: "🧅", veg: true },
  { id: "pani-puri", name: "Pani Puri (8 pcs)", desc: "Crispy hollow puris filled with spicy tangy water, potatoes, and chickpeas.", price: 3.00, category: "Snacks", emoji: "🫙", veg: true },
  { id: "veg-spring-rolls", name: "Veg Spring Rolls (2 pcs)", desc: "Crispy rolls stuffed with seasoned vegetables.", price: 2.49, category: "Snacks", emoji: "🥢", veg: true },
  { id: "veg-samosa", name: "Veg Samosa (4 pcs)", desc: "Golden fried pastry filled with spiced potatoes and peas.", price: 3.29, category: "Snacks", emoji: "🥟", veg: true },
  { id: "chicken-samosa", name: "Chicken Samosa (4 pcs)", desc: "Crispy pastry stuffed with flavourful minced chicken filling.", price: 3.49, category: "Snacks", emoji: "🥟", veg: false },
  { id: "mix-snack", name: "Mix", desc: "A combo of 1 veg spring roll, 1 veg samosa, and 1 chicken samosa.", price: 3.49, category: "Snacks", emoji: "🥟", veg: false },
  { id: "onion-rings-snack", name: "Onion Rings (6 pcs)", desc: "Crispy battered onion rings, deep-fried until golden.", price: 3.99, category: "Snacks", emoji: "🧅", veg: true },
  { id: "mozzarella-sticks-snack", name: "Mozzarella Sticks (6 pcs)", desc: "Breaded sticks filled with melted mozzarella cheese.", price: 4.99, category: "Snacks", emoji: "🧀", veg: true },
  { id: "indian-omelette", name: "Indian Style Omelette", desc: "Fluffy omelette cooked with onions, green chillies, and spices.", price: 1.99, category: "Snacks", emoji: "🍳", veg: false },

  // ── STARTERS ─────────────────────────────────────────────────────
  { id: "veg-manchurian", name: "Veg Manchurian", desc: "Crispy vegetable balls tossed in a tangy Indo-Chinese sauce.", price: 5.99, category: "Starters", emoji: "🥦", veg: true },
  { id: "gobi-manchurian", name: "Gobi Manchurian", desc: "Fried cauliflower florets coated in spicy Manchurian sauce.", price: 5.99, category: "Starters", emoji: "🥦", veg: true },
  { id: "chilli-paneer", name: "Chilli Paneer", desc: "Paneer cubes stir-fried with peppers and onions in a spicy chilli sauce.", price: 7.99, category: "Starters", emoji: "🧀", veg: true },
  { id: "chilli-gobi", name: "Chilli Gobi", desc: "Crispy cauliflower tossed in a hot and tangy chilli sauce.", price: 6.99, category: "Starters", emoji: "🥦", veg: true },
  { id: "paneer-65", name: "Paneer 65", desc: "Deep-fried paneer pieces coated in a spicy South Indian marinade.", price: 6.99, category: "Starters", emoji: "🧀", veg: true },
  { id: "gobi-65", name: "Gobi 65", desc: "Crispy cauliflower bites with bold spices and herbs.", price: 5.99, category: "Starters", emoji: "🥦", veg: true },
  { id: "garlic-mushroom", name: "Garlic Mushroom", desc: "Mushrooms sautéed in garlic, herbs, and light spices.", price: 6.49, category: "Starters", emoji: "🍄", veg: true },
  { id: "chicken-wings", name: "Chicken Wings", desc: "Juicy wings available in Tandoori, Spicy, BBQ, or Buffalo flavours.", price: 5.99, category: "Starters", emoji: "🍗", veg: false, variants: wingsV(5.99, 8.99, 9.99) },
  { id: "chicken-strips", name: "Chicken Strips", desc: "Crispy chicken strips, perfectly seasoned and fried.", price: 5.99, category: "Starters", emoji: "🍗", veg: false, variants: wingsV(5.99, 8.99, 9.99) },
  { id: "chicken-bites", name: "Chicken Bites", desc: "Bite-sized crispy chicken pieces, great for sharing.", price: 5.99, category: "Starters", emoji: "🍗", veg: false, variants: wingsV(5.99, 8.99, 9.99) },
  { id: "nuggets", name: "Nuggets", desc: "Classic golden chicken nuggets with a crunchy coating.", price: 4.99, category: "Starters", emoji: "🍗", veg: false, variants: wingsV(4.99, 6.99, 7.99) },
  { id: "mozzarella-sticks-starter", name: "Mozzarella Sticks", desc: "Crispy outside with gooey melted cheese inside.", price: 4.99, category: "Starters", emoji: "🧀", veg: true, variants: wingsV(4.99, 6.99, 7.99) },
  { id: "onion-rings-starter", name: "Onion Rings", desc: "Crunchy battered onion rings served hot.", price: 3.99, category: "Starters", emoji: "🧅", veg: true, variants: wingsV(3.99, 5.49, 5.99) },
  { id: "chicken-manchurian", name: "Chicken Manchurian", desc: "Crispy chicken tossed in a spicy Indo-Chinese sauce.", price: 6.99, category: "Starters", emoji: "🍗", veg: false },
  { id: "chilli-chicken", name: "Chilli Chicken", desc: "Fried chicken pieces cooked with peppers in a spicy chilli sauce.", price: 6.99, category: "Starters", emoji: "🍗", veg: false },
  { id: "chilli-prawn", name: "Chilli Prawn", desc: "Juicy prawns stir-fried in a bold and spicy chilli sauce.", price: 7.99, category: "Starters", emoji: "🍤", veg: false },
  { id: "chicken-65", name: "Chicken 65", desc: "Popular South Indian spicy fried chicken with curry leaves.", price: 6.49, category: "Starters", emoji: "🍗", veg: false },
  { id: "prawn-65", name: "Prawn 65", desc: "Crispy prawns coated in aromatic spices.", price: 7.49, category: "Starters", emoji: "🍤", veg: false },
  { id: "chicken-pakoda", name: "Chicken Pakoda", desc: "Deep-fried chicken fritters with flour and spices.", price: 5.99, category: "Starters", emoji: "🍗", veg: false },
  { id: "dragon-chicken", name: "Dragon Chicken", desc: "Crispy chicken tossed in a sweet, spicy, and tangy sauce.", price: 6.49, category: "Starters", emoji: "🍗", veg: false },
  { id: "pepper-chicken", name: "Pepper Chicken", desc: "Chicken cooked with freshly ground black pepper for a bold flavour.", price: 6.49, category: "Starters", emoji: "🍗", veg: false },
  { id: "chicken-lollipop", name: "Chicken Lollipop (4 pcs)", desc: "Frenched chicken wings fried and coated in spicy sauce.", price: 6.99, category: "Starters", emoji: "🍗", veg: false },
  { id: "chicken-ghee-roast", name: "Chicken Ghee Roast", desc: "Rich and spicy chicken cooked in ghee with roasted spices.", price: 6.99, category: "Starters", emoji: "🍗", veg: false },
  { id: "lamb-pepper-fry", name: "Lamb Pepper Fry", desc: "Tender lamb cooked with black pepper and spices.", price: 7.49, category: "Starters", emoji: "🥩", veg: false },
  { id: "lamb-ghee-roast", name: "Lamb Ghee Roast", desc: "Slow-cooked lamb in ghee with aromatic spices.", price: 7.49, category: "Starters", emoji: "🥩", veg: false },
  { id: "prawn-pepper-fry", name: "Prawn Pepper Fry", desc: "Prawns sautéed with black pepper and spices.", price: 7.49, category: "Starters", emoji: "🍤", veg: false },
  { id: "prawn-ghee-roast", name: "Prawn Ghee Roast", desc: "Juicy prawns cooked in rich ghee and roasted spices.", price: 7.49, category: "Starters", emoji: "🍤", veg: false },

  // ── BIRYANIS ─────────────────────────────────────────────────────
  { id: "chicken-dum-biryani", name: "Chicken Dum Biryani (Bone)", desc: "Aromatic basmati rice slow-cooked with bone-in chicken, herbs, and traditional spices.", price: 6.00, category: "Biryanis", emoji: "🍛", veg: false, variants: biryaniV(6.00, 11.99) },
  { id: "chicken-boneless-biryani", name: "Chicken Boneless Biryani", desc: "Fragrant rice cooked with tender boneless chicken pieces and rich spices.", price: 6.00, category: "Biryanis", emoji: "🍛", veg: false, variants: biryaniV(6.00, 11.99) },
  { id: "chicken-lollipop-biryani", name: "Chicken Lollipop Biryani", desc: "Spiced rice served with crispy, flavourful chicken lollipops.", price: 7.00, category: "Biryanis", emoji: "🍛", veg: false, variants: biryaniV(7.00, 13.99) },
  { id: "chicken-65-biryani", name: "Chicken 65 Biryani (Boneless)", desc: "Biryani topped with spicy, deep-fried Chicken 65 pieces.", price: 7.00, category: "Biryanis", emoji: "🍛", veg: false, variants: biryaniV(7.00, 13.99) },
  { id: "fry-piece-biryani", name: "Fry Piece Biryani (Bone)", desc: "Rice served with crispy fried chicken pieces infused with spices.", price: 7.49, category: "Biryanis", emoji: "🍛", veg: false, variants: biryaniV(7.49, 14.99) },
  { id: "gongura-chicken-biryani", name: "Gongura Chicken Biryani", desc: "Tangy gongura leaves blended with spiced chicken and aromatic rice.", price: 7.49, category: "Biryanis", emoji: "🍛", veg: false, variants: biryaniV(7.49, 14.99) },
  { id: "chicken-mughalai-biryani", name: "Chicken Mughalai Biryani", desc: "Rich and creamy Mughal-style biryani with mild spices and tender chicken.", price: 8.49, category: "Biryanis", emoji: "🍛", veg: false, variants: biryaniV(8.49, 15.99) },
  { id: "lamb-biryani", name: "Lamb Biryani", desc: "Slow-cooked basmati rice with tender lamb and traditional spices.", price: 8.00, category: "Biryanis", emoji: "🍛", veg: false, variants: biryaniV(8.00, 15.99) },
  { id: "gongura-lamb-biryani", name: "Gongura Lamb Biryani", desc: "A tangy twist with gongura leaves and succulent lamb pieces.", price: 8.49, category: "Biryanis", emoji: "🍛", veg: false, variants: biryaniV(8.49, 16.99) },
  { id: "prawn-biryani", name: "Prawn Biryani", desc: "Flavourful rice cooked with juicy prawns and aromatic spices.", price: 7.49, category: "Biryanis", emoji: "🍛", veg: false, variants: biryaniV(7.49, 14.99) },
  { id: "prawn-65-biryani", name: "Prawn 65 Biryani", desc: "Flavourful rice topped with spicy, deep-fried prawn pieces.", price: 7.99, category: "Biryanis", emoji: "🍛", veg: false, variants: biryaniV(7.99, 15.99) },
  { id: "egg-biryani", name: "Egg Biryani", desc: "Spiced rice layered with boiled eggs and aromatic masala.", price: 6.49, category: "Biryanis", emoji: "🍛", veg: false, variants: biryaniV(6.49, 11.99) },
  { id: "veg-biryani", name: "Veg Biryani", desc: "A mix of fresh vegetables cooked with fragrant basmati rice and spices.", price: 6.00, category: "Biryanis", emoji: "🍛", veg: true, variants: biryaniV(6.00, 11.99) },
  { id: "mushroom-biryani", name: "Mushroom Biryani", desc: "Aromatic rice cooked with mushrooms and mild spices.", price: 6.49, category: "Biryanis", emoji: "🍛", veg: true, variants: biryaniV(6.49, 12.99) },
  { id: "paneer-biryani", name: "Paneer Biryani", desc: "Soft paneer cubes cooked with flavoured rice and spices.", price: 7.00, category: "Biryanis", emoji: "🍛", veg: true, variants: biryaniV(7.00, 13.99) },
  { id: "kaju-paneer-biryani", name: "Kaju Paneer Biryani", desc: "Rich biryani with paneer and cashews for a creamy, nutty taste.", price: 7.49, category: "Biryanis", emoji: "🍛", veg: true, variants: biryaniV(7.49, 14.99) },

  // ── CURRIES ──────────────────────────────────────────────────────
  { id: "dal-tadka", name: "Dal Tadka", desc: "Yellow lentils tempered with garlic, cumin, and spices.", price: 6.99, category: "Curries", emoji: "🫕", veg: true },
  { id: "spinach-dal", name: "Spinach Dal (Palak Dal)", desc: "Lentils cooked with fresh spinach and mild spices.", price: 7.49, category: "Curries", emoji: "🫕", veg: true },
  { id: "vegetable-kurma", name: "Vegetable Kurma", desc: "Mixed vegetables in a creamy coconut-based curry.", price: 6.99, category: "Curries", emoji: "🫕", veg: true },
  { id: "paneer-masala", name: "Paneer Masala", desc: "Paneer cubes cooked in a rich tomato-based gravy.", price: 7.49, category: "Curries", emoji: "🫕", veg: true },
  { id: "paneer-butter-masala", name: "Paneer Butter Masala", desc: "Creamy and mildly sweet curry with butter and paneer.", price: 7.99, category: "Curries", emoji: "🫕", veg: true },
  { id: "paneer-tikka-masala", name: "Paneer Tikka Masala", desc: "Grilled paneer cooked in a spiced, smoky masala sauce.", price: 7.99, category: "Curries", emoji: "🫕", veg: true },
  { id: "egg-masala-curry", name: "Egg Masala Curry", desc: "Boiled eggs cooked in a rich and spicy gravy.", price: 6.99, category: "Curries", emoji: "🥚", veg: false },
  { id: "chicken-masala-curry", name: "Chicken Masala Curry", desc: "Classic chicken curry with aromatic spices.", price: 7.49, category: "Curries", emoji: "🍛", veg: false },
  { id: "butter-chicken", name: "Butter Chicken Masala", desc: "Creamy tomato-based curry with tender chicken.", price: 7.99, category: "Curries", emoji: "🍛", veg: false },
  { id: "chicken-tikka-masala", name: "Chicken Tikka Masala", desc: "Grilled chicken pieces in a rich, spiced sauce.", price: 7.99, category: "Curries", emoji: "🍛", veg: false },
  { id: "chicken-milagu-curry", name: "Chicken Milagu Curry", desc: "South Indian style pepper chicken curry with bold flavours.", price: 7.49, category: "Curries", emoji: "🍛", veg: false },
  { id: "gongura-chicken-curry", name: "Gongura Chicken Curry", desc: "Tangy gongura leaves cooked with chicken and spices.", price: 7.49, category: "Curries", emoji: "🍛", veg: false },
  { id: "chicken-kurma", name: "Chicken Kurma", desc: "Mild, creamy chicken curry with coconut and spices.", price: 7.99, category: "Curries", emoji: "🍛", veg: false },
  { id: "gongura-lamb-curry", name: "Gongura Lamb Curry", desc: "Lamb cooked with tangy gongura leaves and spices.", price: 8.49, category: "Curries", emoji: "🥩", veg: false },
  { id: "lamb-masala-curry", name: "Lamb Masala Curry", desc: "Rich and flavourful lamb curry with traditional spices.", price: 8.49, category: "Curries", emoji: "🥩", veg: false },
  { id: "lamb-kurma", name: "Lamb Kurma", desc: "Creamy coconut-based lamb curry.", price: 8.49, category: "Curries", emoji: "🥩", veg: false },
  { id: "lamb-milagu-curry", name: "Lamb Milagu Curry", desc: "Spicy black pepper lamb curry.", price: 8.49, category: "Curries", emoji: "🥩", veg: false },
  { id: "prawn-masala-curry", name: "Prawn Masala Curry", desc: "Prawns cooked in a rich and spicy masala gravy.", price: 8.99, category: "Curries", emoji: "🍤", veg: false },

  // ── RICE ─────────────────────────────────────────────────────────
  { id: "plain-rice", name: "Plain Rice", desc: "Steamed basmati rice.", price: 2.99, category: "Rice", emoji: "🍚", veg: true },
  { id: "pulao-rice", name: "Pulao Rice", desc: "Lightly spiced rice with vegetables.", price: 3.49, category: "Rice", emoji: "🍚", veg: true },
  { id: "ghee-rice", name: "Ghee Rice", desc: "Aromatic rice cooked with clarified butter.", price: 3.99, category: "Rice", emoji: "🍚", veg: true },
  { id: "jeera-rice", name: "Jeera Rice", desc: "Fragrant rice tempered with cumin seeds.", price: 3.99, category: "Rice", emoji: "🍚", veg: true },
  { id: "mushroom-rice", name: "Mushroom Rice", desc: "Rice cooked with mushrooms and spices.", price: 4.49, category: "Rice", emoji: "🍄", veg: true },
  { id: "plain-egg-rice", name: "Plain Egg Rice", desc: "Fried rice with egg and mild seasoning.", price: 4.49, category: "Rice", emoji: "🥚", veg: false },

  // ── FRIED RICE & NOODLES ─────────────────────────────────────────
  { id: "veg-fried-rice", name: "Veg Fried Rice", desc: "Classic stir-fried rice with vegetables.", price: 6.99, category: "Fried Rice & Noodles", emoji: "🍚", veg: true },
  { id: "veg-manchurian-fried-rice", name: "Veg Manchurian Fried Rice", desc: "Rice tossed with Manchurian-style vegetables.", price: 7.49, category: "Fried Rice & Noodles", emoji: "🍚", veg: true },
  { id: "gobi-manchurian-fried-rice", name: "Gobi Manchurian Fried Rice", desc: "Fried rice with crispy cauliflower Manchurian.", price: 7.49, category: "Fried Rice & Noodles", emoji: "🍚", veg: true },
  { id: "mushroom-fried-rice", name: "Mushroom Fried Rice", desc: "Rice stir-fried with mushrooms.", price: 7.49, category: "Fried Rice & Noodles", emoji: "🍄", veg: true },
  { id: "paneer-fried-rice", name: "Paneer Fried Rice", desc: "Rice with paneer cubes and spices.", price: 7.99, category: "Fried Rice & Noodles", emoji: "🧀", veg: true },
  { id: "egg-fried-rice", name: "Egg Fried Rice", desc: "Rice stir-fried with eggs and seasoning.", price: 7.99, category: "Fried Rice & Noodles", emoji: "🥚", veg: false },
  { id: "chicken-fried-rice", name: "Chicken Fried Rice", desc: "Classic chicken stir-fried rice.", price: 7.99, category: "Fried Rice & Noodles", emoji: "🍗", veg: false },
  { id: "chicken-manchurian-fried-rice", name: "Chicken Manchurian Fried Rice", desc: "Rice mixed with spicy chicken Manchurian.", price: 8.49, category: "Fried Rice & Noodles", emoji: "🍗", veg: false },
  { id: "prawn-fried-rice", name: "Prawn Fried Rice", desc: "Rice stir-fried with prawns and spices.", price: 8.49, category: "Fried Rice & Noodles", emoji: "🍤", veg: false },
  { id: "veg-noodles", name: "Veg Noodles", desc: "Stir-fried noodles with vegetables.", price: 6.99, category: "Fried Rice & Noodles", emoji: "🍜", veg: true },
  { id: "veg-manchurian-noodles", name: "Veg Manchurian Noodles", desc: "Noodles tossed with Manchurian-style vegetables.", price: 7.49, category: "Fried Rice & Noodles", emoji: "🍜", veg: true },
  { id: "gobi-manchurian-noodles", name: "Gobi Manchurian Noodles", desc: "Noodles with crispy cauliflower Manchurian.", price: 7.49, category: "Fried Rice & Noodles", emoji: "🍜", veg: true },
  { id: "mushroom-noodles", name: "Mushroom Noodles", desc: "Noodles stir-fried with mushrooms.", price: 7.49, category: "Fried Rice & Noodles", emoji: "🍜", veg: true },
  { id: "paneer-noodles", name: "Paneer Noodles", desc: "Noodles with paneer and spices.", price: 7.99, category: "Fried Rice & Noodles", emoji: "🍜", veg: true },
  { id: "egg-noodles", name: "Egg Noodles", desc: "Noodles stir-fried with egg.", price: 7.99, category: "Fried Rice & Noodles", emoji: "🍜", veg: false },
  { id: "chicken-noodles", name: "Chicken Noodles", desc: "Classic chicken stir-fried noodles.", price: 7.99, category: "Fried Rice & Noodles", emoji: "🍜", veg: false },
  { id: "prawn-noodles", name: "Prawn Noodles", desc: "Noodles with prawns and spices.", price: 8.49, category: "Fried Rice & Noodles", emoji: "🍜", veg: false },

  // ── PIZZA ────────────────────────────────────────────────────────
  { id: "pizza-cheese-tomato", name: "Cheese & Tomato Pizza", desc: "Classic pizza with tomatoes or BBQ sauce and melted cheese.", price: 3.99, category: "Pizza", emoji: "🍕", veg: true, variants: pizzaV(3.99, 6.99, 7.99) },
  { id: "pizza-trawlers", name: "Trawlers Pizza", desc: "Pepperoni, spiced ground beef, turkey ham, mushroom, and green peppers.", price: 4.49, category: "Pizza", emoji: "🍕", veg: false, variants: pizzaV(4.49, 7.49, 8.49) },
  { id: "pizza-chicken-sweetcorn", name: "Chicken Sweetcorn Pizza", desc: "Pizza topped with chicken and sweetcorn.", price: 4.49, category: "Pizza", emoji: "🍕", veg: false, variants: pizzaV(4.49, 7.49, 8.49) },
  { id: "pizza-pollo", name: "Pollo Pizza", desc: "Pizza with chicken, mushroom, and herbs.", price: 4.49, category: "Pizza", emoji: "🍕", veg: false, variants: pizzaV(4.49, 7.49, 8.49) },
  { id: "pepperoni-pizza", name: "Pepperoni Pizza", desc: "Classic pepperoni pizza with generous toppings.", price: 4.49, category: "Pizza", emoji: "🍕", veg: false, variants: pizzaV(4.49, 7.49, 8.49) },
  { id: "veggie-supreme-pizza", name: "Veggie Supreme Pizza", desc: "Green peppers, onion, tomatoes, sweetcorn, and mushroom.", price: 4.49, category: "Pizza", emoji: "🍕", veg: true, variants: pizzaV(4.49, 7.49, 8.49) },
  { id: "pizza-chicken-feast", name: "Chicken Feast Pizza", desc: "Pizza loaded with chicken, sweetcorn, and mushroom.", price: 4.49, category: "Pizza", emoji: "🍕", veg: false, variants: pizzaV(4.49, 7.49, 8.49) },
  { id: "pizza-indian-tandoor-hot", name: "Indian Tandoor Hot Pizza", desc: "Green pepper, onion, tandoori chicken, mushroom, and jalapenos.", price: 4.49, category: "Pizza", emoji: "🍕", veg: false, variants: pizzaV(4.49, 7.49, 8.49) },
  { id: "pizza-meat-feast", name: "Meat Feast Pizza", desc: "Pepperoni, spiced ground beef, and turkey ham.", price: 4.99, category: "Pizza", emoji: "🍕", veg: false, variants: pizzaV(4.99, 8.49, 9.49) },

  // ── BURGERS & WRAPS ──────────────────────────────────────────────
  { id: "cheese-burger", name: "Cheese Burger", desc: "Classic cheese burger, available in ¼LB or ½LB, with or without chips.", price: 3.99, category: "Burgers & Wraps", emoji: "🍔", veg: false, variants: [{ label: "¼LB", price: 3.99 }, { label: "½LB", price: 5.99 }, { label: "¼LB + Chips", price: 5.49 }, { label: "½LB + Chips", price: 6.49 }] },
  { id: "chicken-burger", name: "Chicken Burger", desc: "Juicy chicken burger, available in ¼LB or ½LB, with or without chips.", price: 3.99, category: "Burgers & Wraps", emoji: "🍔", veg: false, variants: [{ label: "¼LB", price: 3.99 }, { label: "½LB", price: 5.99 }, { label: "¼LB + Chips", price: 5.49 }, { label: "½LB + Chips", price: 6.49 }] },
  { id: "peri-peri-chicken-burger", name: "Peri-Peri Chicken Burger", desc: "Peri-peri seasoned chicken burger with a fiery kick.", price: 3.99, category: "Burgers & Wraps", emoji: "🍔", veg: false, variants: [{ label: "¼LB", price: 3.99 }, { label: "½LB", price: 5.99 }, { label: "¼LB + Chips", price: 5.49 }, { label: "½LB + Chips", price: 6.49 }] },
  { id: "veg-burger", name: "Veg Burger", desc: "Crispy vegetarian burger patty, available in ¼LB or ½LB.", price: 3.99, category: "Burgers & Wraps", emoji: "🍔", veg: true, variants: [{ label: "¼LB", price: 3.99 }, { label: "½LB", price: 5.99 }, { label: "¼LB + Chips", price: 5.49 }, { label: "½LB + Chips", price: 6.49 }] },
  { id: "chicken-donner-wrap", name: "Chicken Donner Wrap", desc: "Chicken donner in a warm flatbread, served solo or with chips.", price: 3.99, category: "Burgers & Wraps", emoji: "🌯", veg: false, variants: [{ label: "Solo", price: 3.99 }, { label: "With Chips", price: 5.49 }] },
  { id: "meat-donner-wrap", name: "Meat Donner Wrap", desc: "Meat donner in a warm flatbread, served solo or with chips.", price: 3.99, category: "Burgers & Wraps", emoji: "🌯", veg: false, variants: [{ label: "Solo", price: 3.99 }, { label: "With Chips", price: 5.49 }] },
  { id: "paneer-wrap", name: "Paneer Wrap", desc: "Paneer wrap served solo or with chips.", price: 4.49, category: "Burgers & Wraps", emoji: "🌯", veg: true, variants: [{ label: "Solo", price: 4.49 }, { label: "With Chips", price: 5.99 }] },

  // ── FISH & CHIPS ─────────────────────────────────────────────────
  { id: "fish-and-chips", name: "Fish & Chips", desc: "Golden battered fish served with chips. Choose your sauce: Curry, Gravy, Beans, Mushy Peas, or No Sauce.", price: 9.00, category: "Fish & Chips", emoji: "🐟", veg: false, variants: [{ label: "Regular", price: 9.00 }, { label: "Large", price: 13.00 }] },
  { id: "fish", name: "Fish", desc: "Classic battered fish fillet, available in regular or large.", price: 8.00, category: "Fish & Chips", emoji: "🐟", veg: false, variants: [{ label: "Regular", price: 8.00 }, { label: "Large", price: 10.00 }] },
  { id: "chips", name: "Chips", desc: "Freshly cooked golden chips.", price: 2.49, category: "Fish & Chips", emoji: "🍟", veg: true, variants: [{ label: "Regular", price: 2.49 }, { label: "Large", price: 3.49 }] },
  { id: "fish-cake", name: "Fish Cake", desc: "Classic fish cake, crispy on the outside.", price: 2.49, category: "Fish & Chips", emoji: "🐟", veg: false },
  { id: "chicken-mushroom-pie", name: "Chicken & Mushroom Pie", desc: "Hearty pie filled with chicken and mushroom.", price: 3.49, category: "Fish & Chips", emoji: "🥧", veg: false },
  { id: "chicken-donner", name: "Chicken Donner", desc: "Chicken donner served with chips or naan bread.", price: 5.49, category: "Fish & Chips", emoji: "🥙", veg: false, variants: [{ label: "Regular", price: 5.49 }, { label: "Large", price: 6.99 }] },

  // ── BEVERAGES ────────────────────────────────────────────────────
  { id: "vanilla-thick-shake", name: "Vanilla Thick Shake", desc: "Rich and creamy vanilla-flavoured thick shake.", price: 3.99, category: "Beverages", emoji: "🥤", veg: true },
  { id: "oreo-thick-shake", name: "Oreo Thick Shake", desc: "Creamy shake with crushed Oreo biscuits.", price: 4.49, category: "Beverages", emoji: "🥤", veg: true },
  { id: "nutella-thick-shake", name: "Nutella Thick Shake", desc: "Chocolate hazelnut shake with Nutella.", price: 4.49, category: "Beverages", emoji: "🥤", veg: true },
  { id: "vanilla-milkshake", name: "Vanilla Milkshake", desc: "Classic smooth vanilla shake.", price: 3.49, category: "Beverages", emoji: "🥛", veg: true },
  { id: "banana-milkshake", name: "Banana Milkshake", desc: "Fresh banana blended into a creamy shake.", price: 3.99, category: "Beverages", emoji: "🍌", veg: true },
  { id: "strawberry-milkshake", name: "Strawberry Milkshake", desc: "Sweet strawberry-flavoured shake.", price: 3.99, category: "Beverages", emoji: "🍓", veg: true },
  { id: "salty-lassi", name: "Salty Lassi", desc: "Refreshing yogurt drink with a pinch of salt.", price: 1.99, category: "Beverages", emoji: "🥛", veg: true },
  { id: "sweet-lassi", name: "Sweet Lassi", desc: "Traditional sweet yogurt drink.", price: 2.49, category: "Beverages", emoji: "🥛", veg: true },
  { id: "mango-lassi", name: "Mango Lassi", desc: "Creamy yogurt blended with mango pulp.", price: 2.99, category: "Beverages", emoji: "🥭", veg: true },
  { id: "coke-can", name: "Coke Can (330ml)", desc: "Chilled Coca-Cola 330ml can.", price: 1.30, category: "Beverages", emoji: "🥤", veg: true },
  { id: "masala-tea", name: "Masala Tea", desc: "Aromatic spiced Indian chai.", price: 1.00, category: "Beverages", emoji: "☕", veg: true },

  // ── DESSERTS ─────────────────────────────────────────────────────
  { id: "gulab-jamun", name: "Gulab Jamun (4 pcs)", desc: "Soft milk-solid dumplings soaked in rose-flavoured sugar syrup.", price: 2.99, category: "Desserts", emoji: "🍮", veg: true },
  { id: "gulab-jamun-ice-cream", name: "Gulab Jamun with Ice Cream", desc: "Warm gulab jamun served with a scoop of vanilla ice cream.", price: 3.99, category: "Desserts", emoji: "🍨", veg: true },
  { id: "double-ka-meetha", name: "Double Ka Meetha", desc: "Traditional Hyderabadi bread pudding soaked in milk, sugar, and dry fruits.", price: 3.49, category: "Desserts", emoji: "🍮", veg: true },
];

async function main() {
  const cats = await prisma.menuCategory.findMany();
  const catMap = Object.fromEntries(cats.map(c => [c.name, c.id]));

  let created = 0, updated = 0, skipped = 0;

  for (const item of ITEMS) {
    const catId = catMap[item.category];
    if (!catId) { console.log(`⚠ Category not found: ${item.category} for ${item.name}`); skipped++; continue; }

    const variantsJson = JSON.stringify(item.variants ?? []);
    const data = {
      name: item.name,
      description: item.desc,
      price: item.price,
      categoryId: catId,
      emoji: item.emoji,
      isVegetarian: item.veg,
      variants: variantsJson,
    };

    const existing = await prisma.menuItem.findUnique({ where: { id: item.id } });
    if (existing) {
      await prisma.menuItem.update({ where: { id: item.id }, data });
      updated++;
    } else {
      await prisma.menuItem.create({ data: { id: item.id, ...data } });
      created++;
    }
  }

  console.log(`✅ Done: ${created} created, ${updated} updated, ${skipped} skipped`);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
