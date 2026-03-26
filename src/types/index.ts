import type { User } from 'firebase/auth';

export type FirebaseUser = User;

// ── Roles ────────────────────────────────────────────────────────────────────
export type UserRole = 'guest' | 'free' | 'premium' | 'stylist';
export type WeddingRole = 'bride' | 'groom' | 'family';

// ── Order Status Enum ────────────────────────────────────────────────────────
// Must match backend orderStatusController.js TRANSITIONS keys exactly
export enum OrderStatus {
  Payed = 'payed',
  VendorProcessing = 'vendor_processing',
  VendorDispatched = 'vendor_dispatched',
  VendorCancelled = 'vendor_cancelled',
  WarehouseOrderReceived = 'warehouse_order_received',
  WarehouseOrderProcessing = 'warehouse_order_processing',
  WarehouseOrderCancelled = 'warehouse_order_cancelled',
  VendorOrderReturned = 'vendor_order_returned',
  OrderDispatched = 'order_dispatched',
  OrderDelivered = 'order_delivered',
  UserOrderReturned = 'user_order_returned',
}

// ── Status Event (for order timeline) ────────────────────────────────────────
export interface StatusEvent {
  status: OrderStatus;
  timestamp: Date | string | number; // Firestore Timestamp
  note?: string;
  updatedBy?: string; // uid of who made the change
}

// ── User Profile ─────────────────────────────────────────────────────────────
export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  phone: string;
  weddingDate: string;
  weddingRole: WeddingRole;
  role: UserRole;
  packageId?: string;
  stylistId: string | null;
  photoURL?: string;
  fcmToken?: string;
  freeConsultUsed?: boolean;
  createdAt: Date | string | number;
  updatedAt: Date | string | number;
}

// ── Product ──────────────────────────────────────────────────────────────────
export interface Product {
  id: string;
  docId?: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  subcategory?: string;
  images: string[];
  sizes: string[];
  colors: string[];
  stock: number;
  tags?: string[];
  rating?: number;
  reviews?: number;
  numberOfRating?: number;
  vendorId?: string;
  sku?: string;
  topSelling?: boolean;
  trending?: boolean;
  newArrival?: boolean;
  bestSeller?: boolean;
  features?: string[];
  priorityNo?: number;
  createdAt: Date | string | number;
}

// ── Order ────────────────────────────────────────────────────────────────────
export interface OrderItem {
  productId: string;
  name: string;
  image?: string;
  qty: number;
  price: number;
  size?: string;
  color?: string;
}

export interface OrderAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country?: string;
}

export interface Order {
  id: string;
  userId: string;
  status: OrderStatus;
  items: OrderItem[];
  total: number;
  address: OrderAddress;
  paymentId?: string;
  razorpayOrderId?: string;
  couponCode?: string;
  statusHistory: StatusEvent[];
  stylistId?: string;
  createdAt: Date | string | number;
  updatedAt: Date | string | number;
}

// ── Chat ─────────────────────────────────────────────────────────────────────
export interface ChatMessage {
  id: string;
  senderId: string;
  text?: string;
  imageUrl?: string;
  audioUrl?: string;
  type: 'text' | 'image' | 'audio' | 'product';
  readBy: string[];
  createdAt: Date | string | number;
}

export interface TrialMeta {
  chatId: string;
  clientId: string;
  messageCount: number; // 0-10
  limitReached: boolean;
  updatedAt: Date | string | number;
}

// ── Consultation ─────────────────────────────────────────────────────────────
export interface Slot {
  id: string;
  date: string; // ISO date
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  isAvailable: boolean;
}

export interface Consultation {
  id: string;
  clientId: string;
  stylistId: string;
  slotId?: string;
  date: string;
  startTime: string;
  endTime: string;
  teamsLink?: string;
  isFree: boolean;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  summary?: string;
  packageOrderDocId?: string;
  createdAt: Date | string | number;
  updatedAt?: Date | string | number;
}

// ── Package ──────────────────────────────────────────────────────────────────
export interface PackagePoint {
  serviceId?: string;
  serviceName: string;
  serviceQty: number;
  serviceUnit?: string;
}

export interface Package {
  id: string;
  packageName: string;
  price: number;
  description: string;
  points: PackagePoint[];
  isActive: boolean;
  isPrimary?: boolean;
  validity: number; // in days
  packageColor: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  createdAt: Date | string | number;
  updatedAt: Date | string | number;
}

export interface AddOn {
  id: string;
  serviceId: string;
  serviceName: string;
  qty: number;
  additionalPrice: number;
}

// ── StyleBoard ───────────────────────────────────────────────────────────────
export interface StyleBoard {
  id: string;
  title: string;
  clientId: string;
  stylistId?: string;
  productIds: string[];
  notes?: string;
  coverImage?: string;
  createdAt: Date | string | number;
  updatedAt?: Date | string | number;
}

// ── Notification ─────────────────────────────────────────────────────────────
export interface Notification {
  id: string;
  title: string;
  body: string;
  type?: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: Date | string | number;
}

// ── Cart ─────────────────────────────────────────────────────────────────────
export interface CartItem {
  productId: string;
  name: string;
  image: string;
  price: number;
  qty: number;
  size?: string;
  color?: string;
}

// ── Delivery Option ──────────────────────────────────────────────────────────
export interface DeliveryOption {
  id: string;
  label: string;
  description: string;
  price: number;
  estimatedDays: number;
}

// ── Free Consult Request ─────────────────────────────────────────────────────
export interface FreeConsultRequest {
  id: string;
  clientId: string;
  clientName: string;
  clientEmail?: string;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date | string | number;
}

// ── Stylist Profile ──────────────────────────────────────────────────────────
export interface StylistProfile {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  photoURL?: string;
  bio?: string;
  specialties?: string[];
  rating?: number;
  clientIds?: string[];
  isActive: boolean;
  createdAt: Date | string | number;
}

// ── Coupon ───────────────────────────────────────────────────────────────────
export interface CouponValidation {
  valid: boolean;
  discountType: 'percent' | 'flat';
  discountValue: number;
  message?: string;
}

// ── Access Flags ─────────────────────────────────────────────────────────────
export interface AccessFlags {
  role: UserRole;
  accent: string;
  isGuest: boolean;
  isFree: boolean;
  isPremium: boolean;
  isStylist: boolean;
  canChat: boolean;
  canEaseBot: boolean;
  canShop: boolean;
  canWishlist: boolean;
  canViewOrders: boolean;
  canBookPaidSession: boolean;
  hasFreeConsult: boolean;
  hasUnlimitedChat: boolean;
  canViewStyleBoard: boolean;
  showUpgradePrompts: boolean;
  showLockIcons: boolean;
  isClientSide: boolean;
  isStylistSide: boolean;
}
