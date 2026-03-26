/**
 * Typed navigation helpers for WeddingEase.
 *
 * Usage:
 *   import { navigate } from '@/utils/navigation';
 *   navigate.toProductDetail('abc123');
 */

import { router } from 'expo-router';

export const navigate = {
  // ── Shop ──────────────────────────────────────────────────────────────────
  toShopListing: () =>
    router.push('/screens/shop/listing'),
  toProductDetail: (id: string) =>
    router.push(`/screens/shop/product-detail?id=${id}`),
  toCart: () =>
    router.push('/screens/shop/cart'),
  toCheckout: () =>
    router.push('/screens/shop/checkout'),

  // ── Orders ────────────────────────────────────────────────────────────────
  toOrdersList: () =>
    router.push('/screens/orders/list'),
  toOrderTracking: (id: string) =>
    router.push(`/screens/orders/tracking?id=${id}`),
  toOrderConfirmation: (id?: string) =>
    router.push(id ? `/screens/orders/confirmation?id=${id}` : '/screens/orders/confirmation'),

  // ── Consultations ─────────────────────────────────────────────────────────
  toFreeConsultForm: () =>
    router.push('/screens/consult/free-form'),
  toSlotPicker: (stylistId?: string) =>
    router.push(stylistId ? `/screens/consult/slot-picker?stylistId=${stylistId}` : '/screens/consult/slot-picker'),
  toBookingConfirmed: (params?: { name?: string; date?: string; time?: string }) => {
    const qs = params
      ? `?name=${encodeURIComponent(params.name ?? '')}&date=${encodeURIComponent(params.date ?? '')}&time=${encodeURIComponent(params.time ?? '')}`
      : '';
    router.push(`/screens/consult/booking-confirmed${qs}`);
  },
  toConsultDetail: (id: string) =>
    router.push(`/screens/consult/detail?id=${id}`),
  toBookSession: (reschedule?: boolean) =>
    router.push(reschedule ? '/screens/consult/book-session?reschedule=1' : '/screens/consult/book-session'),
  toVideoCall: (sessionId: string) =>
    router.push(`/screens/consult/video-call?sessionId=${sessionId}`),

  // ── Sessions ──────────────────────────────────────────────────────────────
  toSessionComplete: (sessionId: string) =>
    router.push(`/screens/session/complete?sessionId=${sessionId}`),
  toSessionHistory: () =>
    router.push('/screens/session/history'),

  // ── Packages ──────────────────────────────────────────────────────────────
  toPackagesList: () =>
    router.push('/screens/packages/list'),
  toPackageDetail: (id: string) =>
    router.push(`/screens/packages/detail?id=${id}`),
  toAddonDetail: (id: string) =>
    router.push(`/screens/packages/addon-detail?id=${id}`),

  // ── Profile ───────────────────────────────────────────────────────────────
  toEditProfile: () =>
    router.push('/screens/profile/edit'),
  toSettings: () =>
    router.push('/screens/profile/settings'),
  toPasswordPrivacy: () =>
    router.push('/screens/profile/password-privacy'),
  toFamilyMembers: () =>
    router.push('/screens/profile/family-members'),
  toSharedDocuments: () =>
    router.push('/screens/profile/shared-documents'),

  // ── Style Board ───────────────────────────────────────────────────────────
  toStyleBoardList: () =>
    router.push('/screens/style-board/list'),
  toStyleBoardDetail: (id: string) =>
    router.push(`/screens/style-board/detail?id=${id}`),

  // ── Stylist ───────────────────────────────────────────────────────────────
  toClientProfile: (id: string) =>
    router.push(`/screens/stylist/client-profile?id=${id}`),
  toClientMessages: (id: string) =>
    router.push(`/screens/stylist/client-messages?id=${id}`),
  toRecommendProducts: (clientId: string) =>
    router.push(`/screens/stylist/recommend-products?clientId=${clientId}`),
  toFreeConsultRequests: () =>
    router.push('/screens/stylist/free-consult-requests'),
  toOrderNotifications: () =>
    router.push('/screens/stylist/order-notifications'),

  // ── Brand ─────────────────────────────────────────────────────────────────
  toBrand: () =>
    router.push('/screens/brand'),

  // ── Auth ──────────────────────────────────────────────────────────────────
  toLogin: () =>
    router.push('/auth/login'),
  toRegister: () =>
    router.push('/auth/register'),

  // ── Tab groups ────────────────────────────────────────────────────────────
  toHome: () =>
    router.replace('/(tabs)/home'),
  toStylistHome: () =>
    router.replace('/(stylist-tabs)'),

  // ── Chat ──────────────────────────────────────────────────────────────────
  toChat: () =>
    router.push('/(tabs)/chat'),
} as const;
