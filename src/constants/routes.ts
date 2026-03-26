/**
 * Centralised route-name constants.
 *
 * Use these instead of raw strings so renames only touch one file.
 */

/* -- Auth ------------------------------------------------------------------ */
export const AUTH_LOGIN    = '/auth/login'    as const;
export const AUTH_REGISTER = '/auth/register' as const;
export const AUTH_OTP      = '/auth/otp'      as const;

/* -- Client Tabs ----------------------------------------------------------- */
export const TABS_HOME     = '/(tabs)/home'    as const;
export const TABS_SHOP     = '/(tabs)/shop'    as const;
export const TABS_CONSULT  = '/(tabs)/consult' as const;
export const TABS_EASEBOT  = '/(tabs)/easebot' as const;
export const TABS_CHAT     = '/(tabs)/chat'    as const;
export const TABS_PROFILE  = '/(tabs)/profile' as const;

/* -- Stylist Tabs ---------------------------------------------------------- */
export const STYLIST_HOME     = '/(stylist-tabs)'          as const;
export const STYLIST_MESSAGES = '/(stylist-tabs)/messages'  as const;
export const STYLIST_SESSIONS = '/(stylist-tabs)/sessions'  as const;
export const STYLIST_EASEBOT  = '/(stylist-tabs)/easebot'   as const;
export const STYLIST_PROFILE  = '/(stylist-tabs)/profile'   as const;

/* -- Top-level Screens (legacy) -------------------------------------------- */
export const CART           = '/cart'           as const;
export const CHECKOUT       = '/checkout'       as const;
export const ORDER_CONFIRM  = '/order-confirm'  as const;
export const ORDERS         = '/orders'         as const;
export const EDIT_PROFILE   = '/edit-profile'   as const;
export const PACKAGES       = '/packages'       as const;

/* -- Dynamic Screens (legacy) ---------------------------------------------- */
export const ORDER_DETAIL   = '/order/[id]'     as const;
export const PRODUCT_DETAIL = '/product/[id]'   as const;

/* -- Shop Screens ---------------------------------------------------------- */
export const SHOP_LISTING        = '/screens/shop/listing'        as const;
export const SHOP_PRODUCT_DETAIL = '/screens/shop/product-detail' as const;
export const SHOP_CART           = '/screens/shop/cart'            as const;
export const SHOP_CHECKOUT       = '/screens/shop/checkout'       as const;

/* -- Order Screens --------------------------------------------------------- */
export const ORDERS_LIST         = '/screens/orders/list'         as const;
export const ORDERS_TRACKING     = '/screens/orders/tracking'     as const;
export const ORDERS_CONFIRMATION = '/screens/orders/confirmation' as const;

/* -- Consultation Screens -------------------------------------------------- */
export const CONSULT_FREE_FORM        = '/screens/consult/free-form'        as const;
export const CONSULT_SLOT_PICKER      = '/screens/consult/slot-picker'      as const;
export const CONSULT_BOOKING_CONFIRMED = '/screens/consult/booking-confirmed' as const;
export const CONSULT_DETAIL           = '/screens/consult/detail'           as const;
export const CONSULT_BOOK_SESSION     = '/screens/consult/book-session'     as const;
export const CONSULT_VIDEO_CALL       = '/screens/consult/video-call'       as const;

/* -- Session Screens ------------------------------------------------------- */
export const SESSION_COMPLETE = '/screens/session/complete' as const;
export const SESSION_HISTORY  = '/screens/session/history'  as const;

/* -- Package Screens ------------------------------------------------------- */
export const PACKAGES_LIST        = '/screens/packages/list'        as const;
export const PACKAGES_DETAIL      = '/screens/packages/detail'      as const;
export const PACKAGES_ADDON_DETAIL = '/screens/packages/addon-detail' as const;

/* -- Profile Screens ------------------------------------------------------- */
export const PROFILE_EDIT             = '/screens/profile/edit'             as const;
export const PROFILE_SETTINGS         = '/screens/profile/settings'         as const;
export const PROFILE_PASSWORD_PRIVACY = '/screens/profile/password-privacy' as const;
export const PROFILE_FAMILY_MEMBERS   = '/screens/profile/family-members'   as const;
export const PROFILE_SHARED_DOCUMENTS = '/screens/profile/shared-documents' as const;

/* -- Style Board Screens --------------------------------------------------- */
export const STYLE_BOARD_LIST   = '/screens/style-board/list'   as const;
export const STYLE_BOARD_DETAIL = '/screens/style-board/detail' as const;

/* -- Stylist Screens ------------------------------------------------------- */
export const STYLIST_CLIENT_PROFILE       = '/screens/stylist/client-profile'       as const;
export const STYLIST_CLIENT_MESSAGES      = '/screens/stylist/client-messages'      as const;
export const STYLIST_RECOMMEND_PRODUCTS   = '/screens/stylist/recommend-products'   as const;
export const STYLIST_FREE_CONSULT_REQUESTS = '/screens/stylist/free-consult-requests' as const;
export const STYLIST_ORDER_NOTIFICATIONS  = '/screens/stylist/order-notifications'  as const;

/* -- Brand Screen ---------------------------------------------------------- */
export const BRAND = '/screens/brand' as const;

/* -- Protected route names (segments, not paths) for AuthGuard ------------- */
export const PROTECTED_SEGMENTS = [
  // 'cart' and 'checkout' intentionally omitted — guests can add to cart and checkout
  'order-confirm',
  'orders',
  'order',
  'edit-profile',
  'screens',
] as const;
