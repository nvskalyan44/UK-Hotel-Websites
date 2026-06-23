export interface MenuVariant {
  label: string;
  price: number;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  veg: boolean;
  emoji: string;
  desc: string;
  popular?: boolean;
  hero?: boolean;
  available?: boolean;
  availabilityType?: string;
  allergens?: string[];
  variants?: MenuVariant[];
  image?: string | null;
}

export interface Coupon {
  id?: string;
  code: string;
  title: string;
  discount: number;
  type: "percent" | "flat";
  minOrder: number;
  expiry: string;
  active?: boolean;
  uses?: number;
  maxUses?: number;
  startsAt?: string;
  firstOrderOnly?: boolean;
  usageLimitPerUser?: number;
  applicableCategories?: string[];
  applicableItems?: string[];
  orderType?: string;
}

export interface Review {
  name: string;
  rating: number;
  text: string;
  role: string;
}

export interface RestaurantConfig {
  name: string;
  tagline: string;
  est: number;
  address: string;
  phone: string;
  email: string;
  hours: { day: string; time: string }[];
  minOrder: number;
  deliveryCharge: number;
  freeDeliveryThreshold: number;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  emoji: string;
  veg: boolean;
  qty: number;
  variant?: string;
}

export type OrderType = "delivery" | "collection";
export type TimePreference = "asap" | "scheduled";

export interface OrderDetails {
  type: OrderType;
  name: string;
  phone: string;
  email: string;
  address: string;
  postcode: string;
  time: TimePreference;
  scheduledTime: string;
  instructions: string;
}

export type PaymentMethod = "card" | "applepay" | "cash";
export type OrderStage = "build" | "details" | "payment" | "confirm";

export interface PlacedOrder {
  id: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  coupon?: string;
  deliveryFee: number;
  total: number;
  method: PaymentMethod;
  details: OrderDetails;
  eta: number;
  placedAt: string;
}
