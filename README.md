# Handoff: Abhiruchulu Restaurant Website

## Overview

Complete customer-facing website for **Abhiruchulu**, a South Indian restaurant in Sheffield (est. 2000, 142 Ecclesall Road). The site complements an existing admin panel (which the team already has — see screenshots referenced in `/admin-reference/` if shipped) and gives customers a way to browse the menu, learn about the restaurant, redeem promo codes, contact the team, and place orders with online payment.

**Six tabs**: Home, Menu, Order, Offers, About, Contact.

## About the Design Files

The files in `design/` are **design references created in HTML/React-via-Babel** — interactive prototypes showing the intended look and behaviour, not production code to copy directly. They run in the browser via `@babel/standalone` (slow, dev-only) and use ad-hoc global scope, which is fine for a clickable mock but is **not** how you should ship it.

Your task: **recreate these designs in the project's target codebase**. If the team is using Next.js / Remix / Vite + React (most likely for a restaurant site of this kind), implement it there using their existing component library and conventions. If no environment exists yet, recommended stack:

- **Next.js 14+ (App Router)** with TypeScript
- **Tailwind CSS** for styling (design tokens map cleanly — see Design Tokens section)
- **shadcn/ui** for primitives (buttons, inputs, dialogs)
- **Stripe** for the payment step (currently mocked)
- **React Hook Form + Zod** for the checkout form validation
- **Zustand** (or React Context, as the prototype uses) for cart state
- Persist cart to `localStorage` (or, for logged-in users, a server-side cart)

## Fidelity

**High-fidelity.** Final colours, typography, spacing, animations, and copy are all production-ready. Recreate pixel-perfectly using the codebase's component library. Treat the HTML files as the visual source of truth — open them side-by-side as you build.

The only intentionally rough areas:

- **Food imagery uses emoji as placeholders** — replace with real food photography (square 1:1 hero shots for the menu grid, with a transparent or food-on-board treatment that works on dark backgrounds).
- **Map on Contact page** is a stylised SVG — swap for Mapbox / Google Maps embed pinned to `S11 8JD`.
- **Payment is mocked** — wire to Stripe Payment Element.
- **Order tracking** is a faked 4-step timeline that auto-advances after 1.8s — wire to a real order-status webhook or polling endpoint.

---

## Screens / Views

### 1. Home (`/`)

**Purpose**: Brand statement, drive to menu / order / about.

**Layout** (top to bottom):

1. **Sticky header** (60px tall, blurred backdrop)
2. **Hero section** (~720px tall): two-column grid `1.1fr 1fr`, 64px gap
   - Left: pill badge, oversized headline (96px), 540px-max body copy, two CTAs, 4-column stat strip
   - Right: 2×2 card grid — featured hero card (Hyderabadi Biryani) spans 2 rows, two smaller cards stack on the right (Andhra Fish Curry, Chicken 65)
3. **Popular dishes** — auto-fit grid, min 280px columns, dishes with `popular: true` flag
4. **Story strip** (full-width tinted band) — two-col layout with copy on left, 2×2 icon-card grid on right
5. **Reviews** — three glass cards with star ratings, italic serif quote, avatar+name
6. **CTA card** — large warm-gradient card with "Tonight's biryani is calling" headline
7. **Footer** — four-col grid (brand, explore, visit, hours)

**Key copy**:

- Eyebrow pill: `🏅 Sheffield's No. 1 South Indian Restaurant`
- Headline: `Authentic Taste of` / `South India` (gradient) / `— In Sheffield's Heart` (italic, smaller)
- Body: `From the aromatic biryanis of Hyderabad to the fiery curries of Andhra Pradesh — experience the rich culinary heritage of Telangana, right here on Ecclesall Road, Sheffield.`
- Stats: `20K+ Happy Customers · 4.9★ Google Rating · 25yr Heritage · 2 hrs Sheffield Delivery`

### 2. Menu (`/menu`)

**Purpose**: Browse all 15 dishes with filtering and search.

**Layout**:

1. Centered page header with pill, gradient headline, lead copy
2. **Filter card** — horizontal flex row:
   - Search input (icon left), flex 1
   - Category pills: `All · Starters · Mains · Breads · Rice · Desserts · Drinks`
   - View toggle: `Grid · List`
3. **Item grid** (default) — auto-fit grid, min 280px
   OR **Item list** — vertical stack of horizontal cards with 80px emoji block on left, copy in middle, price + add button on right
4. Empty state when no matches: 🤔 emoji + "No dishes match"
5. Bottom CTA card: "Ready to order? → Start your order"

**Item card** (grid mode):

- 22px padding, 24px radius
- Top row: veg/non-veg badge (green/red dot pill) + optional 🔥 Popular badge
- Centered 74px emoji on 110px tall area
- 22px dish name (Fraunces, 700)
- 13.5px description, 60px min-height (reserves space so cards align)
- Bottom row: price (26px gradient Fraunces) + Add button OR quantity stepper if already in cart

### 3. Order (`/order`) — **The new tab**

4-step flow with a top stepper that shows progress.

**Step 1 — Build basket** (`stage: "build"`)

- Two-column: menu list (left) + sticky basket sidebar (right, 380px wide, `top: 100px`)
- Left: same category pill bar as Menu page, then **row-mode** menu cards
- Right basket sidebar:
  - Header: "Your basket" + item count
  - Scrollable item list (`max-height: 280px`) with quantity steppers
  - Promo code input with 3 suggested chip codes (SHEFFIELD10, BIRYANI20, WELCOME15) — tap to apply
  - Totals block (subtotal, discount if applied, delivery, **total**)
  - Min-order warning (£15) — orange/yellow alert if subtotal too low
  - Free-delivery progress nudge — "Add £X for free delivery" if subtotal < £35
  - Disabled Continue button until min order met

**Step 2 — Delivery details** (`stage: "details"`)

Same two-column layout (form + sticky `OrderSummaryCard` on the right).

Cards stacked in the form:
1. **Order type** — 2-button selector: 🚲 Delivery (£2.99 · 35 min) / 🏪 Collection (FREE · 20 min)
2. **Contact** — Full name, phone, email
3. **Delivery address** (only if Delivery) — street, postcode
4. **When?** — ASAP / Schedule for later (datetime-local input when scheduled)
5. **Notes for the kitchen** (optional textarea)

Validation: all required fields must be filled; address+postcode only required for delivery. Persist details to `localStorage` so they survive refresh.

**Step 3 — Payment** (`stage: "payment"`)

Same two-column layout.

Form:
1. **Payment method** — 3 cards: 💳 Card / 🍎 Apple Pay / 💷 Cash on delivery
2. **Card details** (if card) — Card number (auto-formats to `4242 4242 4242 4242`), name on card, expiry (MM/YY auto-formats), CVC. Show Visa/MC/Amex brand chips top-right.
3. T&Cs checkbox (required)
4. Place order button: `🔒 Place order · £{total}` — disabled until form valid + agreed. On submit, show spinner + "Processing payment…" for 1.6s, then jump to confirmation.

**Step 4 — Confirmation** (`stage: "confirm"`)

Centered max-width 860px column:

1. **Hero card** (green-tinted) — large ✓ icon, "Order placed!" headline, email confirmation note, info pill with: Order #, ETA, Total paid
2. **Live tracking card** — vertical timeline with 4 steps (delivery) or 3 (collection):
   - Order received → Preparing → Out for delivery → Delivered
   - Active step pulses orange; completed steps glow orange; progress line interpolates green→orange
   - Auto-advances first step after 1.8s for demo (replace with real status feed)
3. **Two-column info cards** — "Delivering to" address + "Payment" method
4. **Order items card** — itemised list + totals
5. **Action buttons** — Back to home / Order again / 🖨️ Print receipt

### 4. Offers (`/offers`)

**Purpose**: Show 4 active promo codes and the loyalty programme.

**Layout**:

1. Centered hero header — pill, gradient headline ("Save on tonight's order"), lead copy
2. **Coupon grid** — `auto-fit, minmax(340px, 1fr)`, 24px gap
3. **How it works** — 3 numbered cards (01/02/03) with steps
4. **Loyalty block** — large warm card with copy on left, 3 tier rows on right (100/250/500 pts)

**Coupon card** (`CouponCard` in pages.jsx):

- Two halves separated by **dashed border** (the "ticket" effect)
- Top half (warm gradient): "Promo code" eyebrow, large gradient code (Fraunces 40px), one-line title
- Bottom half: 2-col grid (discount value, min spend), expiry date, Copy button
- "★ Featured" badge top-right on first card
- Click copy → `navigator.clipboard.writeText(code)` → button flips to ✓ Copied! for 1.4s

The 4 coupons (must match admin panel):
- `SHEFFIELD10` — 10% off, min £25, expires 2026-12-31
- `BIRYANI20` — 20% off, min £15, expires 2026-08-31
- `WELCOME15` — 15% off, min £20, expires 2026-12-31
- `SAVE5` — £5 flat off, min £30, expires 2026-09-30

### 5. About (`/about`)

**Purpose**: Brand story, values, history.

**Layout**:

1. **Hero** — 2-col: copy on left ("The Reddy family kitchen — now your local."), chef portrait card on right (👨‍🍳 emoji placeholder for actual Chef Ravi photo)
2. **Values** — 3-col grid of value cards (🌶️ Fresh masalas / 🔥 Charcoal tandoor / 🌾 Aged basmati)
3. **Timeline** — vertical timeline, 5 entries (2000, 2008, 2014, 2020, 2026), year on left rail, glow dot, card with title+description on right
4. **CTA** — "Come hungry. Leave family."

### 6. Contact (`/contact`)

**Purpose**: Visit info + reservation form.

**Layout** — 2-col grid `1fr 1.2fr`:

**Left column** — 4 stacked info cards (Visit / Call / Email / Hours), each with gradient icon block on left, label + value + sub on right. Hours card expands to show all 3 day-ranges.

**Right column**:
1. **Map card** — 280px tall, stylised SVG (grid lines + curved roads) with a pulsing orange pin and address overlay. **Replace with real map embed.**
2. **Contact form card** — name, email, subject (select: Reservation/Catering/Feedback/General), message textarea. On submit, swap to success state for 3.5s.

---

## Interactions & Behaviour

### Navigation

- Top nav `Home · Menu · Order · Offers · About · Contact` — pill style, active tab has `rgba(234,88,12,0.18)` background and orange-300 text
- Tab change → smooth scroll to top, hash updates (`#home`, `#menu`, etc) — back/forward should work
- Logo click → home
- Cross-tab navigation events use a custom `nav` event dispatched on `document`

### Cart (`useCart`)

Global context (`CartProvider`) wrapping the whole app. Reads/writes to `localStorage` keys:
- `abhi_cart` — array of `{ id, name, price, emoji, veg, qty }`
- `abhi_coupon` — applied coupon code (string)
- `abhi_details` — last-used delivery details object

Methods:
- `add(item, qty=1)` — increments if already in cart, shows toast
- `setQty(id, qty)` — removes if qty ≤ 0
- `remove(id)`, `clear()`
- `applyCoupon(code)` — validates against `COUPONS` list + min-order, toasts result
- Computed: `subtotal`, `discount`, `deliveryFee` (free over £35, else £2.99), `total`, `count`

### Cart drawer

- Slides in from right (240ms ease-out cubic)
- Backdrop with blur (`backdrop-filter: blur(4px)`)
- Empty state with 🍽️ + "Browse menu" CTA
- Each row: 56px emoji block, name+price+qty stepper, Remove link
- Footer: totals + Checkout button (closes drawer, switches to Order tab)

### Toast

- Bottom-center, orange gradient pill
- Triggered by `add()`, `applyCoupon()`, etc.
- Auto-dismiss after 1.8s with pop-in animation

### Animations

| Element              | Property                | Duration | Easing                           |
| -------------------- | ----------------------- | -------- | -------------------------------- |
| Button hover         | translateY              | 180ms    | ease                             |
| Card hover           | translateY -2px + bg    | 200ms    | ease                             |
| Nav tab change       | background + color      | 160ms    | ease                             |
| Cart drawer in       | translateX              | 240ms    | cubic-bezier(0.16, 1, 0.3, 1)    |
| Toast in             | scale + opacity         | 240ms    | cubic-bezier(0.16, 1, 0.3, 1)    |
| Active tracking step | pulse box-shadow        | 2s       | infinite                         |
| Payment spinner      | rotate                  | 700ms    | linear infinite                  |
| Coupon copy feedback | content swap            | 1.4s     | timeout                          |

### Form validation

- All required fields use native HTML `required`
- Submit disabled until all required filled (button shows 0.5 opacity + not-allowed cursor)
- Card number formats live: digits-only, max 16, grouped every 4
- Expiry formats live: digits-only, max 4, `MM/YY`
- Postcode upper-cases on input
- Server-side, validate before charging — the prototype does not.

### Responsive

The prototype is desktop-first (1320px max container, 48px side padding). For mobile:
- Header: hide nav tabs (replace with hamburger menu opening a sheet), shrink logo to 44px, hide subtitle
- 2-col hero → single column
- Order page side-by-side → tabs or accordion (basket below, or open in cart drawer)
- All grids → 1 column at <600px, 2 col at <900px

Don't ship the prototype's hamburger replacement — design that for mobile separately.

---

## State Management

```ts
// Cart state (Context or Zustand)
type CartItem = { id: string; name: string; price: number; emoji: string; veg: boolean; qty: number };
type CartState = {
  items: CartItem[];
  coupon: string;
  // computed
  subtotal: number; discount: number; deliveryFee: number; total: number; count: number;
  appliedCoupon: Coupon | null;
  // actions
  add(item: MenuItem, qty?: number): void;
  setQty(id: string, qty: number): void;
  remove(id: string): void;
  clear(): void;
  applyCoupon(code: string): boolean;
  setCoupon(code: string): void;
};

// Order page local state (per stage)
type Stage = "build" | "details" | "payment" | "confirm";
type Details = {
  type: "delivery" | "collection";
  name: string; phone: string; email: string;
  address: string; postcode: string;          // delivery only
  time: "asap" | "scheduled"; scheduledTime: string;
  instructions: string;
};
type PlacedOrder = {
  id: string; items: CartItem[];
  subtotal: number; discount: number; coupon?: string; deliveryFee: number; total: number;
  method: "card" | "applepay" | "cash";
  details: Details; eta: number; placedAt: string;
};
```

### Data fetching

Replace the static `data.js` with API calls:

- `GET /api/menu` → returns the 15 menu items (with stock status from inventory)
- `GET /api/coupons/active` → returns currently-active coupons (admin can toggle)
- `GET /api/restaurant` → name, address, phone, hours, deliveryCharge, etc. (driven by admin Site Settings)
- `POST /api/orders` → creates the order, returns `{ id, eta }`
- `POST /api/payments/intent` (Stripe) — replace the `setTimeout(1.6s)` mock
- `GET /api/orders/:id` → for live tracking, poll every 10–15s (or use a WebSocket / Server-Sent Events)
- `POST /api/contact` → contact-form submissions
- `POST /api/loyalty/redeem` — for future loyalty reward redemption

---

## Design Tokens

### Colors

```css
/* Backgrounds */
--bg-0: #0d0604;   /* darkest — body */
--bg-1: #1a0a05;
--bg-2: #2a1208;
--bg-3: #3a1c0d;

/* Brand orange */
--orange-50:  #fff1e6;
--orange-100: #ffd8b3;
--orange-200: #fed7aa;   /* tagline copy */
--orange-300: #fdba74;   /* active nav text */
--orange-400: #fb923c;
--orange-500: #f97316;   /* primary CTAs */
--orange-600: #ea580c;   /* CTA gradient end */
--orange-700: #c2410c;

/* Yellow accent */
--yellow-300: #fde047;
--yellow-400: #fbbf24;   /* statuses, ribbons */
--yellow-500: #f59e0b;

/* Semantics */
--green-400: #34d399; --green-500: #10b981;   /* success, veg, delivered */
--red-400:   #f87171; --red-500:   #ef4444;   /* non-veg dot, destructive */
--blue-400:  #60a5fa;                          /* info */
--purple-400:#a78bfa;                          /* out-for-delivery badge */

/* Text */
--ink:    #fff5e8;
--ink-dim:#e6d4bd;
--muted:  rgba(255, 235, 210, 0.6);
--faint:  rgba(255, 235, 210, 0.35);

/* Cards */
--card-bg:     rgba(40, 18, 8, 0.55);
--card-border: rgba(253, 186, 116, 0.14);
--card-bg-hi:  rgba(60, 28, 12, 0.7);   /* hover */
```

**Body background** is a layered radial gradient:

```css
background:
  radial-gradient(ellipse 80% 60% at 80% 20%, rgba(234, 88, 12, 0.35), transparent 60%),
  radial-gradient(ellipse 70% 50% at 20% 80%, rgba(180, 60, 10, 0.35), transparent 60%),
  radial-gradient(ellipse 100% 100% at 50% 50%, #2a1208 0%, #1a0a05 50%, #0d0604 100%);
```

Plus a 32px dot-grid overlay at 4% opacity for texture.

### Typography

| Role          | Family                                    | Size                | Weight | Letter-spacing |
| ------------- | ----------------------------------------- | ------------------- | ------ | -------------- |
| Display / H1  | Fraunces (variable, opsz 9-144)           | clamp(48px, 6vw, 80–96px) | 700    | -0.02em        |
| Section H2    | Fraunces                                  | clamp(36–40px, 5vw, 56–64px) | 700    | -0.02em        |
| Card H3       | Fraunces                                  | 22–28px             | 700    | -0.02em        |
| Body          | Inter                                     | 16–19px             | 400    | normal         |
| Body lead     | Inter                                     | 17–19px             | 400    | normal         |
| Caption / muted | Inter                                   | 13–14px             | 400    | normal         |
| Eyebrow / pill | Inter                                    | 11–13px             | 600    | 0.16–0.20em uppercase |
| Stats / price | Fraunces                                  | 22–40px             | 700–800| -0.01em        |

Load via Google Fonts:
```
Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700;9..144,800
Inter:wght@400;500;600;700
```

**Gradient text** (used on key words like "South India", "Save", "placed!"):

```css
background: linear-gradient(135deg, #fde047 0%, #fb923c 100%);
-webkit-background-clip: text;
background-clip: text;
color: transparent;
```

### Spacing

8px base. Common values: 4, 8, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 80px.

Section padding: 80px vertical (use 48px on mobile).
Container max-width: 1320px, side padding 48px (20px mobile).

### Radii

| Element           | Value |
| ----------------- | ----- |
| Buttons, pills    | 999px |
| Cards (large)     | 24px  |
| Cards (small)     | 16px  |
| Inputs            | 14px  |
| Icon tiles        | 14px  |
| Brand logo        | 14px  |

### Shadows

```css
/* Primary CTA */
box-shadow: 0 10px 30px -8px rgba(234, 88, 12, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.2);

/* Hover */
box-shadow: 0 14px 36px -8px rgba(234, 88, 12, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.25);

/* Cart badge */
box-shadow: 0 4px 12px rgba(234, 88, 12, 0.5);

/* Pulsing pin / status */
box-shadow: 0 0 0 8px rgba(234, 88, 12, 0.2), 0 0 0 16px rgba(234, 88, 12, 0.1), 0 12px 30px rgba(234, 88, 12, 0.4);

/* Card hover lift */
transform: translateY(-2px);
```

### Card style

```css
background: rgba(40, 18, 8, 0.55);
border: 1px solid rgba(253, 186, 116, 0.14);
border-radius: 24px;
backdrop-filter: blur(20px);
```

---

## Assets

The prototype uses **emoji as image placeholders** throughout — none of these are final assets.

Replace with:

| Use                  | Asset needed                            | Where it appears                               |
| -------------------- | --------------------------------------- | ---------------------------------------------- |
| Brand mark           | Logo lockup (light + dark variants)     | Header, footer, admin panel (already in use)   |
| Dish photography     | 15 square food photos (min 800×800)     | Menu cards, Home hero, Cart, Order summary     |
| Chef portrait        | Photo of Chef Ravi Reddy                | About page hero                                |
| Restaurant interior  | 1–2 hero shots                          | Home/About story strip background candidates   |
| Map embed            | Mapbox / Google Maps pinned to S11 8JD  | Contact page                                   |
| Icons                | Currently inline SVG (Lucide-style) — keep using Lucide React in the new codebase |

Until photography arrives, the emoji placeholders ship — they're on-brand-warm and read clearly on the dark theme.

---

## Files

```
design/
├── index.html        # Entry — links scripts, fonts, prints styles
├── styles.css        # Full design system: tokens, layout, components, animations
├── data.js           # Restaurant config + menu + coupons + reviews (replace with API)
├── components.jsx    # CartProvider, Header, Footer, CartDrawer, MenuItemCard, etc.
├── pages.jsx         # HomePage, MenuPage, AboutPage, OffersPage, ContactPage
├── order.jsx         # OrderPage with 4-stage flow
└── app.jsx           # Root <App> with hash-based routing
```

To preview the design: open `index.html` in a browser (no build step). Data persists to localStorage, so you can test the full cart → checkout → confirmation flow end-to-end with mock card details (any 16-digit number works; payment is a 1.6s setTimeout).

### Recommended file layout for the production build (Next.js App Router suggestion)

```
app/
├── (marketing)/
│   ├── page.tsx                 # Home
│   ├── menu/page.tsx
│   ├── offers/page.tsx
│   ├── about/page.tsx
│   └── contact/page.tsx
├── order/
│   ├── page.tsx                 # Build stage
│   ├── details/page.tsx
│   ├── payment/page.tsx
│   └── confirmation/[orderId]/page.tsx
├── api/
│   ├── menu/route.ts
│   ├── orders/route.ts
│   └── payments/route.ts
└── layout.tsx                   # Header, Footer, CartProvider, ToastHost

components/
├── cart/                        # CartDrawer, CartProvider, useCart hook
├── menu/                        # MenuItemCard, CategoryFilter
├── order/                       # Stepper, BasketSidebar, OrderSummaryCard, payment forms
├── marketing/                   # Hero, ReviewCard, CouponCard, Timeline, etc.
└── ui/                          # Button, Pill, Badge, Card primitives

lib/
├── data/                        # Migrate menu/coupons fetchers here
├── cart-store.ts                # Zustand or context
└── utils.ts

styles/globals.css               # Design tokens as CSS vars + Tailwind base
tailwind.config.ts               # Map tokens to Tailwind theme
```

---

## Open questions / decisions to make

1. **Authentication** — currently no login. Loyalty programme implies accounts. Decide between guest checkout only, account-optional, or account-required.
2. **Real-time order tracking** — polling, SSE, or WebSocket? The admin panel already shows live orders, so the backend likely already pushes status changes — reuse that pipe.
3. **Stripe vs alternatives** — Apple Pay button works through Stripe's Payment Request API; check whether the existing admin POS uses a different processor that should be matched.
4. **Reservation handling** — Contact form currently lumps "Reservation" with feedback. Consider a dedicated `/reserve` flow with a calendar widget if reservation volume is high.
5. **i18n** — Telugu/Hindi opt-in? Probably not for v1 but the type system should allow it.
6. **Admin handoff** — the admin panel is already built (and shown in design references); confirm it's reading from the same data sources you're writing to here.
