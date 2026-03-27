# WeddingEase Mobile App — Technical Product Requirements Document

**Version**: 1.0
**Date**: 2026-03-27
**Source of Truth**: `/Wedding-Ease-User-Interface/` (web platform)
**Target**: `/weddingease-app/` (Expo React Native)
**Audience**: Engineering agents implementing feature parity with the web platform

---

## 0. Executive Summary

WeddingEase is a full-stack wedding fashion & styling platform. The web app is the canonical feature reference. This PRD maps every web feature to its mobile implementation, calls out gaps, enforces platform-appropriate patterns, and specifies persistence contracts so state survives background kills and app relaunches.

The mobile app already has scaffolding for most screens. The work is: **completing data wiring, closing functional gaps, enforcing persistence, and aligning UX flows** with the web reference — not rebuilding from scratch.

---

## 1. Stack & Architecture Conventions

| Concern | Mobile Stack | Notes |
|---|---|---|
| Framework | Expo SDK 54 / React Native 0.81 | File-based routing via expo-router 6 |
| Language | TypeScript strict | All new code must be typed |
| State | Zustand 5 + AsyncStorage persist | No Context API — use Zustand |
| Server state | TanStack Query v5 | Cache + real-time hybrid |
| Realtime | Firebase Firestore listeners | via `onSnapshot` |
| Auth | Firebase Auth | Email, Google, Phone OTP |
| Payments | Razorpay (`react-native-razorpay`) | Web uses PayU — mobile uses Razorpay |
| Search | Algolia + Vector Search | Same as web |
| Push | Expo Notifications + FCM | Already wired |
| Design tokens | `src/constants/tokens.ts` | Warm ivory bg, role-based accents |
| Navigation | Expo Router (file-based) | Route constants in `src/constants/routes.ts` |
| Data layer | Firebase SDK direct (Firestore + Auth + Storage + callable Functions) | **No REST API calls.** All data ops go through the Firebase SDK. Use `httpsCallable` for server-side-only work (payment signing, claim refresh, AI chat). |
| Local persistence | AsyncStorage | Cart, wishlist (guest), pending payments |

### Persistence Contract (Critical)

Every piece of user state that affects UX on next open **must** survive process kill:

| State | Persistence Mechanism | Notes |
|---|---|---|
| Auth token | Firebase Auth SDK built-in | Automatic |
| User profile | Zustand `authStore` (no persist needed — re-fetched on auth) | Firestore re-fetch on app launch |
| Cart | Zustand `cartStore` + AsyncStorage persist | Already wired, verify completeness |
| Wishlist (guest) | Zustand `wishlistStore` + AsyncStorage | Already wired |
| Wishlist (user) | Firestore real-time listener | Initialized by `useWishlist` hook |
| Pending package purchase | AsyncStorage key `pendingPackagePurchase` | Already used in `_layout.tsx` |
| Checkout in-progress | AsyncStorage key `checkoutDraft` | **NEW** — save draft on each step |
| Preferred currency | AsyncStorage + `userPrefsStore` | **NEW** — required for multi-currency |
| Notification read state | Zustand `notifStore` (no persist) | OK — re-fetched from Firestore |
| EaseBot session ID | AsyncStorage key `easebotSessionId` | **NEW** |
| Chat trial count | Firestore `chatSessions/{uid}` | Not local — server-authoritative |

---

## 2. User Roles & Access Gates

Four roles exist. The `useAccess()` hook already computes flags — all feature gating must go through it, never inline role checks.

| Role | How Determined | Access Summary |
|---|---|---|
| `guest` | No Firebase auth | Browse shop, packages, brand. No orders, no chat, no consult. |
| `free` | Auth + no `packageId` in `users/{uid}` | + Wishlist, Cart, Checkout, 10-msg chat trial, free consultation booking |
| `premium` | Auth + `packageId` set | + Unlimited chat, EaseBot, paid consultation sessions, style boards |
| `stylist` | Auth + doc exists at `team/{uid}` | Stylist-tabs group, client management, session notes, order feed |

**Rule**: All screens rendering behind a role gate must show `<AccessGate>` or `<UpgradePrompt>` — never a blank screen or crash.

---

## 3. Feature Specifications

---

### 3.1 Authentication & Onboarding

**Reference**: `/auth`, `/verify`, `/verifysignup` on web

**Status**: Login + Register + OTP screens exist. Gaps identified below.

#### 3.1.1 Login Screen (`/auth/login`)

**Must implement:**
- Email/password sign-in
- Google Sign-In (Expo auth-session — already wired)
- "Forgot Password" → email reset link via Firebase Auth `sendPasswordResetEmail`
- Keyboard-aware scroll (use `KeyboardAvoidingView`)
- Error messages mapped from Firebase error codes to human-readable strings
- Loading state on button while auth in-flight

**Persistence**: On successful login, `authStore` is populated by `useAuth` hook. No extra persistence needed.

#### 3.1.2 Register Screen (`/auth/register`)

**Must implement:**
- Name, email, password, phone fields
- Wedding date picker (DateTimePicker)
- Wedding role selector: Bride / Groom / Friend / Family / Other (matches web role picker)
- Phone field with country code selector (international format)
- On submit: Firebase Auth `createUserWithEmailAndPassword` → `setDoc(doc(db, 'users', uid), { name, email, phone, weddingDate, weddingRole, freeConsultUsed: false, createdAt: serverTimestamp() })` → navigate to OTP if phone provided, else to tabs
- Validation: email format, password ≥ 8 chars, phone optional but if present must be valid

#### 3.1.3 OTP Verification (`/auth/otp`)

**Must implement:**
- 6-digit OTP input (auto-advance between digits)
- Resend OTP with 60-second cooldown timer
- OTP sent via Firebase Phone Auth (`signInWithPhoneNumber`)
- On verify: mark phone as verified in Firestore `users/{uid}.phoneVerified = true`
- Support for both: signup OTP verification AND login via phone OTP

#### 3.1.4 Post-Auth Recovery

On every app launch after auth, `_layout.tsx` must:
1. Check `AsyncStorage.getItem('pendingPackagePurchase')` — if exists, navigate to package checkout after profile load
2. Check `AsyncStorage.getItem('checkoutDraft')` — if exists and cart is non-empty, show resume-checkout prompt on Home tab

---

### 3.2 Home Tab (`/(tabs)/home`)

**Reference**: Web `/account` dashboard hub

**Must implement per role:**

| Role | Home Content |
|---|---|
| Guest | Hero banner, featured collections, "Sign in" CTA, trending products carousel |
| Free | Welcome with name, upcoming consultation card (if booked), recent order card (if any), featured products, chat trial usage badge |
| Premium | Stylist assignment card, upcoming session, style board previews, curated picks from stylist, EaseBot quick-access |
| Stylist | Today's sessions count, pending free-consult requests badge, unread client messages, recent orders needing action |

**Components needed:**
- `HeroBanner` — image carousel with CTA buttons
- `FeaturedCollectionCarousel` — horizontal scroll of collection tiles (uses `useFeaturedCollections`)
- `ConsultationStatusCard` — shows next booking date/time with "Join" button if within 15 min
- `RecentOrderCard` — latest order with status badge and tracking CTA
- `StyleBoardPreview` — card grid (premium only)
- `StylistCard` — assigned stylist info with "Chat" button
- `EaseBotQuickAccess` — locked card with upgrade prompt for free users

**Persistence**: No local state needed. React Query cache + Firestore listeners handle data.

---

### 3.3 Shop Tab (`/(tabs)/shop`) + Product Screens

**Reference**: Web `/products`, `/product-detail/:id`, `/cart`, `/wishlist`, `/checkout`

#### 3.3.1 Product Listing (`/screens/shop/listing`)

**Must implement:**
- Search bar wired to Algolia (`useAlgoliaSearch`) with debounce 300ms
- Vector search fallback when Algolia returns 0 results (`useVectorSearch`)
- Dynamic filters sidebar/bottom-sheet (`useDynamicFilters`):
  - Category, Subcategory, Price range slider, Color chips, Size multi-select, Sort (Price ↑↓, Newest, Top Selling)
- Product grid (2-col) with infinite scroll pagination
- Each `ProductCard` shows: image, name, price, wishlist toggle button
- Guest users: wishlist toggle stores to AsyncStorage; logged-in users: Firestore
- Pull-to-refresh

**Persistence**: Filter selections stored in Zustand `shopFilterStore` (new store, no AsyncStorage persist needed — reset on unmount is acceptable).

#### 3.3.2 Product Detail (`/screens/shop/product-detail`)

**Must implement:**
- Image gallery (horizontal swipe, thumbnail strip below)
- Product name, price (in preferred currency), description
- Variant selector: Size chips + Color swatches (mutually exclusive selection per attribute)
- "Add to Cart" button — adds selected variant to `cartStore`
- "Save to Wishlist" heart icon — `wishlistStore.toggleWishlist`
- Stock badge ("Only 3 left" if quantity ≤ 5)
- Review section (static list from `reviewService`)
- "Request Price" button → sends GET_PRICE message type to stylist chat if user has active session
- Related products horizontal carousel

**Variant selection state**: Local component state only. Do NOT persist.

#### 3.3.3 Cart (`/screens/shop/cart`)

**Must implement:**
- Cart items from `cartStore.items`
- Per-item: image, name, variant (size + color), price, quantity stepper, remove button
- Subtotal, estimated shipping, total (currency-aware — see §3.9)
- "Proceed to Checkout" CTA → navigates to `/screens/shop/checkout`
- Guest CTA: "Sign in to checkout" with guest-checkout option
- Empty state illustration with "Start Shopping" button
- Swipe-to-delete on each item

**Guest cart**: `cartStore` already uses AsyncStorage persist. On login, merge guest cart into Firestore cart doc via `cartService.mergeGuestCart(uid, guestItems)` — implement this merge on auth state change in `useAuth`.

**Persistence**: `cartStore` + AsyncStorage. No additional work needed if persist middleware is configured.

#### 3.3.4 Checkout Flow (`/screens/shop/checkout`)

**Reference**: Web multi-stage checkout: Cart → Address → Shipping → Payment

**This is the most complex flow. Implement as a step-wizard within a single screen using a local `step` state.**

**Steps:**

**Step 1 — Cart Review**
- Editable quantity, remove items
- Show price breakdown (subtotal, estimated shipping placeholder)

**Step 2 — Delivery Address**
- List saved addresses from `users/{uid}.addresses[]`
- "Add new address" form: line1, line2, city, state, pincode, country
- Address validation (pincode format per country)
- Option: "Same as shipping for billing"

**Step 3 — Shipping Method**
- Standard (free or INR 99 flat) vs Express (INR 199, 2-day)
- Recalculate total on selection

**Step 4 — GST Invoice (Optional toggle)**
- Fields: Company name, GST number, billing address
- Only shown if user toggles "I need a GST invoice"

**Step 5 — Payment**
- Summary: items + address + shipping + tax + total
- Currency selector (INR / USD / EUR) — see §3.9
- "Pay Now" → Razorpay checkout

**Razorpay Integration (payment signing MUST stay server-side — use Firebase Cloud Functions callable):**
```
1. const createRazorpayOrder = httpsCallable(functions, 'createRazorpayOrder')
   const { data } = await createRazorpayOrder({ amount, currency, orderId })
   // receives { razorpayOrderId, key }

2. RazorpayCheckout.open({ key, amount, currency, order_id: razorpayOrderId,
     name: 'WeddingEase', description: 'Order Payment', prefill: { email, contact } })

3. On success callback { razorpay_payment_id, razorpay_order_id, razorpay_signature }:
   const verifyPayment = httpsCallable(functions, 'verifyRazorpayPayment')
   await verifyPayment({ razorpay_payment_id, razorpay_order_id, razorpay_signature })

4. On verification success: write order doc directly to Firestore —
   await setDoc(doc(db, 'orders', orderId), { ...orderData, paymentId: razorpay_payment_id, status: 'pending' })
   Navigate to /screens/orders/confirmation

5. On failure: show error sheet with retry option
```

> **Why Cloud Functions for payment?** The Razorpay secret key and signature verification must never be on the client. Everything else (order doc creation, status reads) is direct Firestore.

**Draft persistence**: On each step completion, write to `AsyncStorage.setItem('checkoutDraft', JSON.stringify({ step, address, shipping, gst, orderId }))`. Clear on successful payment or explicit cancel.

**Order document schema (Firestore `orders/{orderId}`):**
```typescript
{
  orderId: string,                   // UUID generated client-side
  uid: string,
  items: OrderItem[],               // snapshot of cart at checkout time
  shippingAddress: Address,
  billingAddress?: Address,
  gstDetails?: GSTDetails,
  shippingMethod: 'standard' | 'express',
  subtotal: number,
  shippingCost: number,
  taxAmount: number,
  charges: Record<string, number>,
  total: number,
  preferredCurrency: 'INR' | 'USD' | 'EUR',
  conversionRate: number,
  preferredCurrencyValue: number,   // total in user's chosen currency
  paymentId: string,                // Razorpay payment ID
  razorpayOrderId: string,
  status: OrderStatus,
  statusHistory: StatusEvent[],
  createdAt: Timestamp,
  updatedAt: Timestamp,
  stylistId?: string,
}
```

#### 3.3.5 Order Confirmation (`/screens/orders/confirmation`)

- "Order Placed!" success animation (Lottie or React Native Animated)
- Order ID display
- Estimated delivery date
- CTA: "Track Order" → `/screens/orders/tracking`
- CTA: "Continue Shopping" → clears draft, navigates to shop tab
- Clear `checkoutDraft` from AsyncStorage

---

### 3.4 Order Tracking (`/screens/orders/list` + `/screens/orders/tracking`)

**Reference**: Web `/account/order` + 11-status pipeline

#### 3.4.1 Order List

- Fetch all orders for `uid` from Firestore `orders` collection (ordered by `createdAt` desc)
- `useOrders()` hook with React Query + Firestore real-time subscription
- Each `OrderCard`: order ID, date, total, status badge, item thumbnails (max 3), "Track" CTA
- Tabs: All / Active / Completed / Cancelled
- Empty state per tab

#### 3.4.2 Order Tracking Screen

**StatusTimeline component** — vertical timeline with 11 nodes:

```
paymentPending → pending → processing → confirmed →
packed → shipped → outForDelivery → delivered
                                    ↳ cancelled
                                    ↳ returnRequested → returned
```

Each node: icon, label, timestamp (if reached), color (completed = gold, active = pulsing, future = grey).

**Real-time**: `onSnapshot` on `orders/{orderId}` — UI updates automatically as status changes.

**Additional sections:**
- Delivery address card
- Items ordered (collapsible list)
- Price breakdown with currency info
- "Cancel Order" button (visible only when status is `pending` or `processing`) → confirmation dialog → `updateDoc(doc(db, 'orders', orderId), { status: 'cancelled', cancelledAt: serverTimestamp() })`
- "Return/Exchange" button (visible when status is `delivered` and within 7 days) → reason picker → `updateDoc(doc(db, 'orders', orderId), { status: 'returnRequested', returnReason, returnRequestedAt: serverTimestamp() })`
- Download Invoice button → generate PDF or navigate to invoice web view (Firebase Hosting URL)

#### 3.4.3 FCM Notifications for Order Status

Each status transition triggers an FCM notification. In `useNotifications`:
- Receive notification → parse `data.orderId` + `data.newStatus`
- Update cached order in React Query via `queryClient.setQueryData`
- Show in-app toast if app is foreground

---

### 3.5 Wishlist

**Reference**: Web `/account/wishlist` + WishlistContext

**Already partially implemented. Verify and complete:**

**Guest mode (no auth):**
- `wishlistStore.guestItems: GuestWishlistItem[]` persisted via AsyncStorage
- `toggleWishlist(productId)` writes to AsyncStorage immediately
- Heart icons on product cards reflect `wishlistStore.isInWishlist(productId)`

**Logged-in mode:**
- `wishlistStore.favourites: string[]` (product IDs) synced from Firestore `favourites/{uid}`
- Real-time listener set up in `useWishlist` → calls `wishlistStore.initializeUser(uid)`
- On login: `wishlistStore.migrateOnLogin(uid)` — merge guest items to Firestore then clear guest store
- Support named wishlists (multiple wishlists per user): Firestore `wishlists/{wishlistId}` collection with `userId`, `name`, `description`, `products[]`

**Wishlist Tab/Screen** (`/screens/shop/listing` with wishlist filter OR dedicated screen):
- Grid of saved products
- Remove button per item
- "Add to Cart" from wishlist
- Empty state with "Explore Shop" CTA

---

### 3.6 Consultations (`/(tabs)/consult`)

**Reference**: Web `/free-consultation`, `/account/bookings`

#### 3.6.1 Free Consultation Request (`/screens/consult/free-form`)

**Form fields (matching web exactly):**
- Name (pre-filled from profile)
- Email (pre-filled, editable)
- Phone (pre-filled with country code)
- Wedding role: Bride / Groom / Friend / Family / Other (radio pills)
- Wedding date (DateTimePicker)
- Preferred date for consultation (DateTimePicker, min: today + 2 days)
- Preferred time slot (morning / afternoon / evening radio)
- Timezone selector (18+ timezones: IST, GST, EST, CST, MST, PST, GMT, CET, AEST, NZST, SGT, JST, HKT, KST, IST-Israel, MSK, BRT, ART)
- Notes/special requests (multiline text, optional)

**Submit flow:**
1. Check `users/{uid}.freeConsultUsed` via `getDoc` — if `true`, show "already submitted" state and exit
2. Write directly to Firestore:
   ```
   await setDoc(doc(db, 'freeConsultations', email), {
     email, name, phone, weddingRole, weddingDate,
     preferredDate, preferredTime, timezone, notes,
     status: 'pending', aiMessagesUsed: 0,
     submittedAt: serverTimestamp()
   })
   await updateDoc(doc(db, 'users', uid), { freeConsultUsed: true })
   ```
3. Navigate to `/screens/consult/booking-confirmed` with confirmation details

**Persistence**: Form state in local component state. On background (not kill), React Navigation preserves stack. No AsyncStorage needed.

#### 3.6.2 Slot Picker (`/screens/consult/slot-picker`)

**For paid session bookings (premium users):**
- Calendar view (current month + next month)
- Available time slots rendered as chips per selected date
- Slots fetched directly from Firestore:
  ```
  query(collection(db, 'slots'),
    where('stylistId', '==', stylistId),
    where('date', '==', selectedDate),
    where('isBooked', '==', false)
  )
  ```
- Selected slot highlighted
- "Confirm Slot" CTA → navigate to `/screens/consult/book-session`
- Show "No slots available" state with "Try another date" prompt

**Slot display timezone**: Convert UTC slots to user's device timezone using `Intl.DateTimeFormat`

#### 3.6.3 Book Session (`/screens/consult/book-session`) — Premium Only

**Access gate**: `useAccess().canBookPaidSession` must be true, else show `<UpgradePrompt>`

**Fields:**
- Selected slot (readonly display, "Change" link back to slot picker)
- Session type (Style Consultation / Shopping Assistance / Wedding Planning)
- Notes for stylist (optional multiline)
- Deduct from package hours OR direct payment

**Submit flow:**
1. Write directly to Firestore in a batch:
   ```
   const batch = writeBatch(db)
   const consultRef = doc(collection(db, 'consultations'))
   batch.set(consultRef, {
     clientId: uid, stylistId, slotId,
     date, startTime, endTime, timezone,
     sessionType, notes, isFree: false,
     status: 'pending', createdAt: serverTimestamp()
   })
   // Mark slot as booked
   batch.update(doc(db, 'slots', slotId), { isBooked: true, bookedBy: uid })
   // If package: deduct service hours
   batch.update(doc(db, 'users', uid), {
     services: updatedServicesArray   // pre-computed with decremented qty
   })
   await batch.commit()
   ```
2. FCM notification to stylist is triggered server-side by a Firestore `onCreate` trigger on `consultations` — no client call needed
3. Navigate to `/screens/consult/booking-confirmed`

#### 3.6.4 Booking Confirmed (`/screens/consult/booking-confirmed`)

- Success animation
- Date, time, stylist name, Google Meet / Teams link (if generated)
- "Add to Calendar" using `expo-calendar`
- "Chat with Stylist" CTA → opens chat with assigned stylist
- "View All Bookings" link

#### 3.6.5 Consultation Detail (`/screens/consult/detail`)

- Shows: date, time, stylist, status badge, meeting link (active 15 min before)
- "Join Call" button (deep-links to Teams/Meet URL) — enabled only within 15 min window
- "Reschedule" → slot picker flow (24-hour policy: check client-side `consultation.date - now < 24h`, show error if too close) → on confirm: `writeBatch` — update `consultations/{id}` with new slot + mark old slot `isBooked: false` + mark new slot `isBooked: true`
- "Cancel" with reason selector (24-hour policy enforced client-side) → `updateDoc(doc(db, 'consultations', id), { status: 'cancelled', cancelReason, cancelledAt: serverTimestamp() })`
- Post-session: stylist session summary visible here
- Status: `pending → confirmed → completed → cancelled`

#### 3.6.6 Bookings List (in Consult tab)

- Tabs: Upcoming / Past
- `ConsultCard` per booking with status, date, stylist name
- Pull-to-refresh
- Real-time via Firestore `consultations` query by `clientId`

---

### 3.7 EaseBot AI Chat (`/(tabs)/easebot`)

**Reference**: Web `/consultation-chat` — AI Concierge with 10-message limit

**Access**: `useAccess().canEaseBot` — locked for `guest` and `free` users (show `<EaseBotLocked>` with upgrade CTA).

#### 3.7.1 Session Initialization

On entering EaseBot screen:
1. Check `AsyncStorage.getItem('easebotSessionId')` → if exists and matches `uid`, use it
2. Else: query Firestore for existing session —
   ```
   const q = query(collection(db, 'aiChatSessions'),
     where('userId', '==', uid), limit(1))
   const snap = await getDocs(q)
   ```
   If found: use `snap.docs[0].id`. If not: create one —
   ```
   const sessionRef = await addDoc(collection(db, 'aiChatSessions'), {
     userId: uid, messageCount: 0,
     createdAt: serverTimestamp(), lastActiveAt: serverTimestamp()
   })
   ```
   Store `sessionId` in AsyncStorage
3. Load message history via Firestore query:
   ```
   query(collection(db, 'aiChatSessions', sessionId, 'messages'),
     orderBy('createdAt', 'asc'))
   ```
4. Subscribe with `onSnapshot` on same query for real-time updates

**Persistence**: Session ID in AsyncStorage. Message history in Firestore (server-authoritative).

#### 3.7.2 Chat UI

- Full-screen chat layout with keyboard-aware scroll
- Message bubbles: user (right, gold), assistant (left, ivory)
- Markdown rendering for assistant messages (bold, lists, links)
- **Product cards**: When AI response contains product links (`/products/:id`), render inline `ProductMiniCard` with image + name + price + "View" button
- **Progressive reveal**: Render assistant response word-by-word at ~18ms per word (stream via SSE or animate locally after receiving full response)
- Suggested prompts shown when session is new:
  - "What jewelry should I look at for my wedding budget?"
  - "Show me traditional bridal outfit options"
  - "Tell me about WeddingEase packages"
  - "What should I prepare for my consultation?"

#### 3.7.3 Message Limit

- Premium users: 50 messages per session (or unlimited — confirm with backend team)
- Usage badge: "X messages remaining" shown below input
- When ≤ 2 remaining: show soft nudge inline ("You're almost at your limit for this session")
- When 0: show `UpsellModal` blocking input with "Start New Session" (for premium) or "Upgrade" (for free — shouldn't reach here)
- Counter tracked server-side in `aiChatSessions/{sessionId}.messageCount`

#### 3.7.4 Message Send Flow

The AI response MUST be server-side (Anthropic API key must not be on client). Use a Firebase Cloud Function callable:

```
1. User types message → add optimistic user bubble to local state immediately
   also write user message to Firestore:
   addDoc(collection(db, 'aiChatSessions', sessionId, 'messages'), {
     role: 'user', text, createdAt: serverTimestamp()
   })

2. const easeBotChat = httpsCallable(functions, 'freeConsultationChatMessage')
   easeBotChat({ sessionId, text })   ← do not await UI blocking; let onSnapshot handle response

3. Show typing indicator (animated dots) while waiting

4. The Cloud Function writes the assistant response to Firestore:
   aiChatSessions/{sessionId}/messages/{id} { role: 'assistant', text: '...' }
   The onSnapshot listener picks it up → animate word-by-word reveal on new assistant message

5. Cloud Function also increments aiChatSessions/{sessionId}.messageCount

6. On httpsCallable error: show "Retry" option on failed bubble, remove optimistic bubble
```

---

### 3.8 Chat with Stylist (`/(tabs)/chat`)

**Reference**: Web `/account/enquiries` — real-time stylist-customer messaging

#### 3.8.1 Session List

- List all chat sessions for current user: Firestore `sessions` query by `uId`
- Each row: stylist avatar, stylist name, last message preview, timestamp, unread badge
- "New Chat" FAB → creates new session (only if premium OR free trial not exhausted)
- Trial limit enforcement: `free` users get 10 messages total across all sessions
  - `TrialLimitBanner` shown when ≤ 3 messages remaining
  - After 10: banner blocks input, shows upgrade CTA
  - Counter tracked server-side: `chatSessions/{uid}.trialMessageCount`

#### 3.8.2 Chat Screen (`/screens/chat/{sessionId}` or via stack push)

**Message types to render:**

| Type | Render |
|---|---|
| `TEXT` | Standard bubble |
| `IMAGES` | Image grid (tap to expand) |
| `FILES` | Download card with filename + size |
| `BOOKING` | ConsultCard mini (date, time, stylist) |
| `PACKAGE` | PackageMiniCard with CTA |
| `ORDER_ACC_REJ` | Order status card (accepted/rejected) |
| `DELIVERY_DETAILS` | Shipping info card |
| `PAYMENT` | Payment request card with "Pay Now" CTA |
| `GET_PRICE` | Variant pricing card showing price after stylist fills it |
| `MULTI_PROD` | Horizontal scroll of ProductMiniCards |
| `SET` | Collection card with "View All" |
| `INFO` | System message (centered, muted) |

**Input bar features:**
- Text input
- Image picker (expo-image-picker) → uploads to Firebase Storage → sends IMAGES message
- Audio record button (expo-av) → press-hold to record, release to send → sends audio message
- Attach file (expo-document-picker) → sends FILES message

**Read receipts**:
- Message has `readBy: string[]` (array of uids)
- When user opens chat, call `markMessagesRead(sessionId, uid)` → updates Firestore
- Show double-tick on messages current user sent, that appear in other party's `readBy`
- Persist read state server-side (Firestore) — not local

**Real-time**: `onSnapshot` on `messages` collection filtered by `sessionId`, ordered by `sendAt`

#### 3.8.3 Product Recommendation in Chat (Stylist-side)

On stylist screens (`/screens/stylist/recommend-products`):
- Search products via Algolia
- Select variants
- Send as `MULTI_PROD` message type to client session
- Client sees product cards with "Add to Cart" directly from chat

---

### 3.9 Multi-Currency Support

**Reference**: Web CurrencyContext (INR / USD / EUR with live conversion)

**This is a new feature for mobile. Must be implemented end-to-end.**

#### 3.9.1 Currency Store (new: `src/store/currencyStore.ts`)

```typescript
interface CurrencyStore {
  currency: 'INR' | 'USD' | 'EUR';
  conversionRate: number;         // relative to INR base
  lastUpdated: number;            // timestamp
  setCurrency: (c: Currency) => void;
  setRate: (rate: number) => void;
}
```

Persist with AsyncStorage key `currencyPrefs`.

#### 3.9.2 Currency Hook (`src/hooks/useCurrency.ts`)

```typescript
function useCurrency() {
  // On mount: read from Firestore config doc —
  //   getDoc(doc(db, 'config', 'currencyRates'))
  //   returns { USD: 0.012, EUR: 0.011, updatedAt: Timestamp }
  // If stale (updatedAt > 1 hour ago): a scheduled Cloud Function refreshes this doc
  //   client always reads from Firestore — never calls an external currency API directly
  // Return: { currency, conversionRate, formatPrice(amountINR): string }
}
```

**Firestore config doc** `config/currencyRates`:
```
{ INR: 1, USD: 0.012, EUR: 0.011, updatedAt: Timestamp }
```
A scheduled Cloud Function (`updateCurrencyRates`, runs every hour) refreshes this doc from an external FX API. The client only reads Firestore.

`formatPrice(amountINR: number): string`:
- INR: `₹1,999`
- USD: `$24.10`
- EUR: `€22.30`
- Always convert from INR base using `conversionRate`

#### 3.9.3 Currency Selector UI

- Available in: Profile tab settings, Checkout step 5 header
- 3 flag+currency pills: 🇮🇳 INR | 🇺🇸 USD | 🇪🇺 EUR
- On change: update store → all `PriceTag` components reactively re-render

#### 3.9.4 Order Currency Snapshot

When creating an order, snapshot the currency state:
```typescript
{
  preferredCurrency: currencyStore.currency,
  conversionRate: currencyStore.conversionRate,
  preferredCurrencyValue: total * conversionRate,  // what user saw
  total: totalINR,                                  // always store base INR
}
```

---

### 3.10 Packages (`/(tabs)` — accessible from Home + Shop)

**Reference**: Web `/packages`, `/packages/:id`, `/account/packages`, `/package-checkout`

#### 3.10.1 Package Listing (`/screens/packages/list`)

- Fetch from `packages` Firestore collection (active packages only)
- Cards sorted by price, primary package highlighted
- Each `PackageCard`: name, price, validity, key services list (from `points[]`), color accent from `packageColor`
- "View Details" CTA → detail screen
- Guest / free users: full list visible, purchase CTA locked for guest ("Sign in first")

#### 3.10.2 Package Detail (`/screens/packages/detail`)

- Full package description
- Services breakdown (serviceName + serviceQty + serviceUnit per point)
- Validity period
- Included benefits list
- "Select Add-ons" section → navigates to `/screens/packages/addon-detail`
- Add-ons: extra services with qty + price (AddnData model)
- "Purchase Package" CTA

#### 3.10.3 Package Add-on Detail (`/screens/packages/addon-detail`)

- Grouped add-on services
- Qty stepper per add-on
- Running total calculator
- "Add to Package Order" → back to detail with selections confirmed

#### 3.10.4 Package Checkout (`/screens/packages/checkout`)

**Flow:**
1. Summary: base package + selected add-ons + total
2. Payment: Razorpay (same integration as product checkout)
3. On payment success (Razorpay callback):
   - Verify payment via Cloud Function callable (same as product checkout):
     ```
     const verifyPayment = httpsCallable(functions, 'verifyRazorpayPayment')
     await verifyPayment({ razorpay_payment_id, razorpay_order_id, razorpay_signature })
     ```
   - On verified, write directly to Firestore in a batch:
     ```
     const batch = writeBatch(db)
     const pkgOrderRef = doc(collection(db, 'packageOrders'))
     batch.set(pkgOrderRef, {
       uid, packageId, addons, total,
       paymentId: razorpay_payment_id, razorpayOrderId,
       status: 'active', createdAt: serverTimestamp()
     })
     batch.update(doc(db, 'users', uid), {
       packageId,
       services: servicePointsArray   // computed from package.points
     })
     await batch.commit()
     ```
   - Refresh Firebase Auth custom claim (must be Cloud Function — cannot set claims client-side):
     ```
     const refreshClaims = httpsCallable(functions, 'refreshUserClaims')
     await refreshClaims()
     await auth.currentUser.getIdToken(true)  // force token refresh
     ```
     This sets custom claim `role = 'premium'` so `useAccess()` updates immediately
   - Store pending purchase recovery BEFORE payment (before opening Razorpay):
     `AsyncStorage.setItem('pendingPackagePurchase', JSON.stringify({ packageId, orderId, razorpayOrderId }))`
   - Clear after all writes confirmed: `AsyncStorage.removeItem('pendingPackagePurchase')`
4. Navigate to package confirmation screen
5. Trigger stylist auto-assignment (backend responsibility)
6. Send FCM notification: "Welcome to Premium! Your stylist will reach out soon."

**Pending purchase recovery** (already in `_layout.tsx`):
- If app relaunches with `pendingPackagePurchase` in AsyncStorage AND payment was successful (verify via Razorpay API), complete the Firestore writes
- If payment was NOT successful, clear the key and show failure message

#### 3.10.5 My Packages (in Profile or dedicated screen)

- Current active package with expiry date
- Service hours remaining per service type (progress bars)
- "Book Session" CTA (deducts from hours)
- Package order history

---

### 3.11 Style Boards

**Reference**: Web — StyleBoard creation and stylist editing

#### 3.11.1 Client View (`/screens/style-board/list` + `/screens/style-board/detail`)

- List all style boards: Firestore `styleBoards` filtered by `clientId`
- Each board: cover image, title, product count, last updated
- Detail: product image grid, stylist notes, "Shop Now" CTA per product
- Read-only for clients (stylists can edit)

#### 3.11.2 Stylist View (`/screens/stylist/recommend-products` + style board editing)

- Create new board: title, client selector, cover image
- Add products from catalog search
- Write notes per product
- Publish board → notify client via FCM

---

### 3.12 Profile Tab (`/(tabs)/profile`)

**Reference**: Web `/account/profile` + settings

#### 3.12.1 Profile Screen

**Sections:**
- Avatar (tap to change via expo-image-picker → upload to Firebase Storage → update `photoURL`)
- Name, email, phone (read-only, "Edit" navigates to edit screen)
- Role badge (Free / Premium with upgrade CTA if free)
- Wedding date display
- **Account sections** (list rows with chevron):
  - My Orders
  - My Bookings
  - Wishlist
  - My Packages
  - Family Members
  - Shared Documents
  - Currency Preference
  - Notification Settings
  - Password & Privacy
  - Help & Support (links to web help center)
  - Terms & Privacy (web links)
  - Sign Out

#### 3.12.2 Edit Profile (`/screens/profile/edit`)

- Name, phone (with OTP re-verification if changed), wedding date, wedding role
- Save → PATCH `users/{uid}` in Firestore + `authStore.setProfile(updated)`

#### 3.12.3 Password & Privacy (`/screens/profile/password-privacy`)

- Change password (requires current password re-auth → `reauthenticateWithCredential`)
- Delete account (confirmation → `user.delete()` → clear all local state → navigate to login)
- Data export request (sends email to support)

#### 3.12.4 Family Members (`/screens/profile/family-members`)

- Add family members (name, relation, phone, wedding role)
- Stored in `users/{uid}.familyMembers[]`
- Each member can be shared in consultation context

#### 3.12.5 Notification Settings

- Toggles: Order updates, Chat messages, Consultation reminders, Promotions
- Stored in `users/{uid}.notificationPrefs`
- On toggle change: update Firestore + conditionally subscribe/unsubscribe FCM topics

---

### 3.13 Stylist Module (`/(stylist-tabs)`)

**Reference**: Web stylist flows

#### 3.13.1 Stylist Home (`/(stylist-tabs)`)

- Today's date + greeting
- Stats cards: Sessions today, Pending requests, Active clients, Orders to review
- Quick actions: "View Requests", "Open Messages", "Check Orders"
- Upcoming sessions timeline (next 3)

#### 3.13.2 Stylist Messages (`/(stylist-tabs)/messages`)

- All client chat sessions assigned to this stylist: `sessions` filtered by `stylerId`
- Same chat UI as client side (§3.8.2)
- Can send all message types
- Product recommendation: search products inline, send as MULTI_PROD

#### 3.13.3 Free Consult Requests (`/screens/stylist/free-consult-requests`)

- Queue of pending free consultation submissions from clients
- Each card: client name, email, phone, preferred date/time, notes, wedding role
- Actions: "Confirm" (assign slot + send confirmation) | "Decline" (with reason)
- Confirmed → generates meeting link via Cloud Function callable (Meet link creation needs server credentials):
  ```
  const confirmConsult = httpsCallable(functions, 'confirmFreeConsultation')
  const { data } = await confirmConsult({ consultationEmail, stylistId, scheduledDate, scheduledTime })
  // Cloud Function: creates Teams/Meet link, writes meetLink back to Firestore
  // freeConsultations/{email}.meetLink, status: 'confirmed'
  ```
  Client reads the updated doc via `onSnapshot` — meetLink appears automatically

#### 3.13.4 Sessions (`/(stylist-tabs)/sessions`)

**Tabs: Upcoming / Past**

- Upcoming: date, time, client name, session type, "Join" button (active 15 min before)
- Past: same list with status = completed
- Tap session → session detail with client profile link and session notes

#### 3.13.5 Session Notes & Summary

Post-session flow:
1. Tap "Complete Session" on `/screens/session/complete`
2. Summary form: key recommendations, products mentioned, action items, follow-up date
3. Submit → direct Firestore update:
   ```
   updateDoc(doc(db, 'consultations', consultationId), {
     summary: { recommendations, products, actionItems, followUpDate },
     status: 'completed',
     completedAt: serverTimestamp()
   })
   ```
4. Client reads summary via `onSnapshot` on their `consultations/{id}` doc — appears automatically

#### 3.13.6 Stylist Order Feed (`/screens/stylist/order-notifications`)

- Orders placed by clients assigned to this stylist
- Status: new / acknowledged / in progress
- "Acknowledge" CTA → `updateDoc(doc(db, 'orders', orderId), { stylistAcknowledged: true, acknowledgedAt: serverTimestamp() })`
- Real-time via Firestore listener on `orders` where `stylistId == uid`

#### 3.13.7 Client Profile View (`/screens/stylist/client-profile`)

- Client: name, photo, wedding date, wedding role, package info
- Their orders (read-only list)
- Their style boards (link to edit)
- Notes (private stylist notes) → read/write directly:
  ```
  // Read
  getDoc(doc(db, 'team', stylistId, 'clientNotes', clientId))
  // Write
  setDoc(doc(db, 'team', stylistId, 'clientNotes', clientId), { notes, updatedAt: serverTimestamp() }, { merge: true })
  ```

---

### 3.14 Notifications

**Already partially implemented. Verify and complete:**

- FCM setup in `src/firebase/messaging.ts` + `useNotifications` hook — verify token registration on every login
- Notification types and routing:

| Notification Type | `data` payload | Navigate to |
|---|---|---|
| `order_status` | `{ orderId, newStatus }` | `/screens/orders/tracking?id={orderId}` |
| `new_message` | `{ sessionId, senderName }` | Chat screen for `sessionId` |
| `consultation_confirmed` | `{ consultationId }` | `/screens/consult/detail?id={consultationId}` |
| `consultation_reminder` | `{ consultationId }` | `/screens/consult/detail?id={consultationId}` |
| `package_activated` | `{ packageId }` | `/screens/packages/detail?id={packageId}` |
| `stylist_assigned` | `{ stylistId }` | Profile tab |
| `style_board_published` | `{ boardId }` | `/screens/style-board/detail?id={boardId}` |

- Foreground: show `expo-notifications` presentationOptions banner + update `notifStore`
- Background/quit: deep-link on tap via `expo-notifications` response listener
- Notification center screen: list of past notifications with "mark all read"

---

## 4. Cross-Cutting Concerns

### 4.1 Offline Handling

- All Firestore reads use `getDocsFromCache` first, then network
- Show `OfflineBanner` (top of screen, orange) when `NetInfo.isConnected === false`
- Cart writes queue locally when offline (Firestore offline persistence enabled via `enableIndexedDbPersistence` equivalent for React Native: `initializeFirestore` with `experimentalForceLongPolling` if needed)
- Checkout: block "Pay Now" button when offline with tooltip "No internet connection"
- Chat: queue text messages offline, send when reconnected (Firestore offline support handles this automatically)

### 4.2 Error Handling

- All Firestore operations and `httpsCallable` calls wrapped in try/catch — surface errors via `Toast.show()` (use a library like `react-native-toast-message`)
- Firebase Auth errors → mapped to human strings (see `src/firebase/errorMessages.ts` — create if missing)
- Payment failures → dedicated failure screen with error reason + retry + support link
- Network errors → retry with exponential backoff (TanStack Query handles this)
- Zustand store errors → log to console, do not crash

### 4.3 Loading States

- Skeleton loaders (not spinners) for: product listing, order list, chat messages, package cards
- `ActivityIndicator` (brand color) for: button loading states, full-screen auth loading
- React Query `isLoading` / `isFetching` drives skeleton visibility

### 4.4 Empty States

Every list screen must have a designed empty state:
- Illustration (use SVGs from `/assets`)
- Title + subtitle
- CTA button where appropriate

### 4.5 Deep Linking

`app.json` already configures `weddingease://` scheme. Map all routes:

```
weddingease://product/:id         → /screens/shop/product-detail?id=:id
weddingease://order/:id           → /screens/orders/tracking?id=:id
weddingease://consultation/:id    → /screens/consult/detail?id=:id
weddingease://styleboard/:id      → /screens/style-board/detail?id=:id
weddingease://chat/:sessionId     → chat screen for session
weddingease://package/:id         → /screens/packages/detail?id=:id
```

### 4.6 Analytics

- Track all screen views: `Analytics.logEvent('screen_view', { screen_name })`
- Track key events: `add_to_cart`, `begin_checkout`, `purchase`, `consult_booked`, `easebot_message_sent`, `package_viewed`, `package_purchased`
- Use Firebase Analytics (already configured in `firebase/config.ts` — add if missing)

---

## 5. Implementation Phases

Phases are ordered by dependency. Each phase produces a shippable vertical slice.

---

### Phase 1 — Auth & Profile Hardening

**Goal**: Complete and robust auth flow with all edge cases handled.

**Tasks:**
1. Complete OTP screen: 6-digit input, resend cooldown, phone verification Firestore update
2. Add "Forgot Password" flow to login screen
3. Wedding role selector on register screen
4. Guest→auth cart merge in `useAuth` on login
5. Guest→auth wishlist migration (`wishlistStore.migrateOnLogin`)
6. Profile screen: all sections listed in §3.12.1
7. Edit profile with phone re-verification
8. Password change with re-auth
9. Account deletion
10. Notification preferences toggle screen
11. Firebase Auth error code → human string mapper

**Acceptance criteria:**
- A user can sign up, verify phone, log out, log back in, change password, and delete account with no crashes or stuck states
- Cart items added as guest appear in cart after login
- Wishlist items added as guest appear in wishlist after login

---

### Phase 2 — Shop, Cart & Checkout

**Goal**: Complete end-to-end purchase flow.

**Tasks:**
1. Algolia search wired with debounce
2. Vector search fallback
3. Dynamic filters bottom sheet
4. Infinite scroll pagination on product listing
5. Product detail: variant selector (size + color chips), stock badge
6. "Request Price" from product detail (sends GET_PRICE chat message)
7. Cart: swipe-to-delete, quantity stepper, currency-aware totals
8. Checkout wizard: 5 steps (Cart → Address → Shipping → GST → Payment)
9. Razorpay payment integration (full flow including failure handling)
10. Order document creation in Firestore on payment success
11. Draft checkout persistence in AsyncStorage
12. Order confirmation screen with animation
13. Multi-currency store + hook + UI selector
14. Currency conversion in all price displays

**Acceptance criteria:**
- A user can browse, filter, search, add to cart, go through 5-step checkout, pay via Razorpay, and see an order confirmation
- If app is killed during checkout, draft is recovered on next open
- Prices display correctly in INR/USD/EUR

---

### Phase 3 — Order Tracking

**Goal**: Full order lifecycle visibility.

**Tasks:**
1. 11-status `StatusTimeline` component
2. Order list with status tabs (All/Active/Completed/Cancelled)
3. Real-time Firestore listener on order detail
4. Cancel order flow (with 24-hour cutoff)
5. Return/exchange request flow
6. FCM notification → order status update in React Query cache
7. Invoice download (web view or PDF)
8. Deep linking: `weddingease://order/:id`

**Acceptance criteria:**
- Order status updates in real-time without refresh
- Cancel is disabled after order is shipped
- Notification tap opens the correct order tracking screen

---

### Phase 4 — Consultations

**Goal**: Full consultation booking and management.

**Tasks:**
1. Free consultation form (all fields from §3.6.1)
2. Submission blocks duplicate (check `freeConsultUsed` flag)
3. Slot picker calendar + time chips for paid sessions
4. Book session screen (premium gate)
5. Google Meet / Teams link opening from booking confirmation
6. "Add to Calendar" via expo-calendar
7. Booking detail: reschedule (24h policy), cancel (24h policy)
8. Consultation list: upcoming / past tabs
9. Post-session summary visible to client
10. Stylist: free consult request queue (confirm/decline)
11. Stylist: session notes + complete session flow

**Acceptance criteria:**
- Free user can submit consultation request once and see confirmation
- Premium user can pick slots, book, reschedule (with 24h check), and cancel
- Stylist sees requests in queue and can confirm/decline

---

### Phase 5 — Chat System

**Goal**: Real-time stylist chat with all message types and trial enforcement.

**Tasks:**
1. Session list with unread badge per session
2. Real-time messages via Firestore `onSnapshot`
3. All message type renderers (§3.8.2 table)
4. Text input + send
5. Image picker → Firebase Storage upload → IMAGES message
6. Audio recording with expo-av → Firebase Storage → audio message
7. File attachment → FILES message
8. Read receipts (Firestore-persisted)
9. Trial limit enforcement: `TrialLimitBanner`, counter from Firestore, block after 10
10. Stylist: product recommendation search + MULTI_PROD send
11. Client: "Add to Cart" directly from MULTI_PROD card in chat

**Acceptance criteria:**
- Free user can send 10 messages total, sees banner at 3 remaining, is blocked after 10 with upgrade CTA
- Images, audio, and files can be sent and received
- Read receipts update in real-time
- Messages persist across app kills (Firestore authoritative)

---

### Phase 6 — Packages & EaseBot

**Goal**: Package purchase with role upgrade + EaseBot AI chat.

**Tasks:**
1. Package listing (active packages from Firestore)
2. Package detail with services breakdown
3. Add-on selection with qty steppers and running total
4. Package checkout with Razorpay
5. Post-payment: Firestore writes, custom claim refresh, FCM notification
6. Pending purchase recovery from AsyncStorage
7. "My Packages" screen with service hours progress bars
8. EaseBot: session initialization + AsyncStorage persistence
9. EaseBot: message send flow with optimistic UI
10. EaseBot: word-by-word reveal animation
11. EaseBot: product card rendering from markdown/links
12. EaseBot: usage badge + soft nudge + upsell modal
13. EaseBot: suggested prompts on new session

**Acceptance criteria:**
- Purchasing a package upgrades role to `premium` without requiring re-login
- If app crashes mid-payment, next launch detects and completes the purchase
- EaseBot messages persist across sessions
- Product cards in EaseBot are tappable and navigate to product detail

---

### Phase 7 — Stylist Module

**Goal**: Complete stylist-facing experience.

**Tasks:**
1. Stylist home dashboard with live stats
2. Style board create/edit (stylist side)
3. Style board view (client side)
4. Client profile view for stylist
5. Stylist order feed with acknowledge CTA
6. Session history with notes
7. Private client notes (stored in `team/{stylistId}/clientNotes/{clientId}`)
8. Stylist availability management (slots)

**Acceptance criteria:**
- Stylist can view and manage all assigned clients
- Style boards publish to client with FCM notification
- Order feed updates in real-time

---

### Phase 8 — Polish, Accessibility & QA

**Goal**: Production-ready quality bar.

**Tasks:**
1. Skeleton loaders on all list/detail screens
2. Designed empty states with illustrations
3. Offline banner + offline-safe behavior
4. All deep links tested
5. Analytics events on key user actions
6. Accessibility: `accessibilityLabel` on all interactive elements, minimum touch target 44×44pt
7. Keyboard handling: `KeyboardAvoidingView` on all forms
8. Safe area: all screens use `SafeAreaView` or `useSafeAreaInsets`
9. Performance: FlatList `keyExtractor` + `getItemLayout` on large lists
10. Security: no secrets in client bundle (Razorpay secret, Anthropic key, calendar credentials all in Cloud Functions env), Firestore Security Rules enforce auth on all collections

---

## 6. Data Model Reference

### Firestore Collections Used by Mobile

```
users/{uid}
  email, name, phone, photoURL
  weddingDate, weddingRole
  packageId?,  stylistId?
  freeConsultUsed: boolean
  addresses: Address[]
  services: ServicePoint[]       ← package hours remaining
  notificationPrefs: {}
  familyMembers: FamilyMember[]
  currency: 'INR' | 'USD' | 'EUR'
  createdAt, updatedAt

team/{uid}                        ← stylist profile
  name, email, phone, photoURL
  bio, specializations[]
  rating, sessionCount
  isActive
  clientNotes/{clientUid}         ← sub-collection, private notes

products/{docId}
  name, description, price, originalPrice
  category, subcategory, vendorId
  images[], sizes[], colors[]
  stock, tags[], rating
  topSelling, trending, newArrival, bestSeller
  variants/{variantId}            ← sub-collection

orders/{orderId}
  uid, items[], total, preferredCurrency
  shippingAddress, billingAddress?
  gstDetails?, shippingMethod
  subtotal, shippingCost, taxAmount, charges{}
  conversionRate, preferredCurrencyValue
  paymentId, razorpayOrderId
  status: OrderStatus
  statusHistory: StatusEvent[]
  stylistId?, stylistAcknowledged
  createdAt, updatedAt

consultations/{id}
  clientId, stylistId, slotId?
  date, startTime, endTime, timezone
  sessionType, isFree
  packageOrderDocId?
  meetLink?
  status: 'pending'|'confirmed'|'completed'|'cancelled'
  summary?
  cancelReason?
  createdAt, updatedAt

freeConsultations/{email}         ← mirrors web schema
  email, name, phone, weddingRole
  preferredDate, preferredTime, timezone
  notes, weddingDate
  bookingId?
  aiChatSessionId?
  aiMessagesUsed: number
  meetLink?
  status: 'pending'|'confirmed'|'declined'|'completed'

packages/{docId}
  packageName, price, description
  points: PackagePoint[]          ← { serviceName, serviceQty, serviceUnit }
  isActive, isPrimary?, validity
  packageColor, imageUrl?, thumbnailUrl?

packageOrders/{id}
  uid, packageId, addons: AddnData[]
  total, paymentId, razorpayOrderId
  status, createdAt

sessions/{sessionId}              ← stylist-client chat
  uId, userName
  stylerId, stylistName
  isActive, budget?
  variantIds[], finalVariantIds2{}
  createdAt, lastMessageAt
  trialMessageCount: number       ← for free users

messages/{messageId}
  sessionId, senderId, type: MessageType
  data: {}                        ← type-specific payload
  readBy: string[]
  sendAt: Timestamp

aiChatSessions/{sessionId}
  userId, consultationEmail?
  messageCount: number
  createdAt, lastActiveAt
  messages/{messageId}            ← sub-collection

styleBoards/{boardId}
  title, clientId, stylistId?
  productIds[], notes?
  coverImage?, isPublished
  createdAt, updatedAt

favourites/{uid}
  productIds: string[]

wishlists/{wishlistId}
  userId, name, description
  products: { productDocId, variantDocId }[]
  coverImage?, createdAt
```

---

## 7. Component Library Checklist

All components below must exist and be used consistently. New screens must not introduce one-off implementations.

**Navigation & Layout**
- [ ] `AppShell` — safe area + status bar
- [ ] `ScreenHeader` — back button, title, optional right action
- [ ] `TabBarIcon` — consistent tab icons with badge support

**Actions**
- [ ] `Button` — variants: primary, secondary, ghost, danger; sizes: sm, md, lg
- [ ] `IconButton` — circular button with icon
- [ ] `FAB` — floating action button

**Input**
- [ ] `Input` — text input with label, error, helper text
- [ ] `PhoneInput` — country code picker + number
- [ ] `DatePicker` — wraps DateTimePicker
- [ ] `TimezoneSelector` — picker with 18+ zones
- [ ] `OTPInput` — 6-digit auto-advance
- [ ] `SearchBar` — with clear button and debounce

**Feedback**
- [ ] `Toast` — success / error / warning / info
- [ ] `OfflineBanner` — top bar when no network
- [ ] `TrialLimitBanner` — chat trial exhaustion
- [ ] `AccessGate` — role gate wrapper
- [ ] `UpgradePrompt` — upgrade CTA card
- [ ] `Skeleton` — loading placeholder (various shapes)

**Product**
- [ ] `ProductCard` — grid card with wishlist toggle
- [ ] `ProductMiniCard` — compact card for chat / EaseBot
- [ ] `PriceTag` — currency-aware price display
- [ ] `VariantSelector` — size chips + color swatches
- [ ] `WishlistButton` — heart icon with toggle

**Order**
- [ ] `OrderCard` — list item with status badge
- [ ] `StatusTimeline` — 11-node vertical timeline
- [ ] `DeliveryOptions` — shipping method selector

**Chat**
- [ ] `MessageBubble` — left/right with type-specific content
- [ ] `ChatInput` — text + image + audio + file
- [ ] `AudioPlayer` — inline audio playback
- [ ] `ReadReceipt` — double-tick indicator

**Consultation**
- [ ] `ConsultCard` — booking summary card
- [ ] `SlotPicker` — calendar + time chips
- [ ] `StylistCard` — stylist info card

**Package**
- [ ] `PackageCard` — feature list + CTA
- [ ] `ServiceHoursBar` — progress bar per service

**Misc**
- [ ] `RoleBadge` — Free / Premium / Stylist pill
- [ ] `StyleBoardCard` — board thumbnail + title
- [ ] `NotificationCard` — notification list item
- [ ] `EaseBotLocked` — lock screen with upgrade CTA
- [ ] `UpsellModal` — bottom sheet upgrade prompt

---

## 8. Firebase Operations Reference

**Rule**: All data operations use the Firebase SDK directly. No REST API calls. The only exceptions are Firebase Cloud Functions (callable via `httpsCallable`) for operations that require server-side secrets.

### 8.1 Direct Firestore Operations

All reads/writes use the Firebase JS SDK (`firebase/firestore`). Auth is handled automatically by Firestore Security Rules — the client does not attach tokens manually.

| Operation | Firestore Call |
|---|---|
| Register user | `setDoc(doc(db, 'users', uid), profile)` |
| Read user profile | `getDoc(doc(db, 'users', uid))` |
| Update user profile | `updateDoc(doc(db, 'users', uid), changes)` |
| List products | `getDocs(query(collection(db, 'products'), where(...), orderBy(...), limit(...)))` |
| Get product | `getDoc(doc(db, 'products', id))` |
| Get product variants | `getDocs(collection(db, 'products', id, 'variants'))` |
| Read cart | `getDoc(doc(db, 'carts', uid))` |
| Write cart | `setDoc(doc(db, 'carts', uid), cartData, { merge: true })` |
| Create order (post-payment) | `setDoc(doc(db, 'orders', orderId), orderData)` |
| List orders | `getDocs(query(collection(db, 'orders'), where('uid', '==', uid), orderBy('createdAt', 'desc')))` |
| Real-time order | `onSnapshot(doc(db, 'orders', orderId), callback)` |
| Cancel order | `updateDoc(doc(db, 'orders', orderId), { status: 'cancelled', cancelledAt: serverTimestamp() })` |
| Return request | `updateDoc(doc(db, 'orders', orderId), { status: 'returnRequested', returnReason, returnRequestedAt: serverTimestamp() })` |
| List packages | `getDocs(query(collection(db, 'packages'), where('isActive', '==', true)))` |
| Get package | `getDoc(doc(db, 'packages', id))` |
| Create package order | `setDoc(doc(db, 'packageOrders', orderId), packageOrderData)` |
| Currency rates | `getDoc(doc(db, 'config', 'currencyRates'))` |
| Submit free consult | `setDoc(doc(db, 'freeConsultations', email), formData)` |
| List consultations | `getDocs(query(collection(db, 'consultations'), where('clientId', '==', uid)))` |
| Get available slots | `getDocs(query(collection(db, 'slots'), where('stylistId', '==', id), where('date', '==', date), where('isBooked', '==', false)))` |
| Book session (batch) | `writeBatch` → set `consultations/{id}` + update `slots/{id}` + update `users/{uid}.services` |
| Cancel booking | `updateDoc(doc(db, 'consultations', id), { status: 'cancelled', cancelReason })` |
| Session notes | `updateDoc(doc(db, 'consultations', id), { summary, status: 'completed' })` |
| Stylist: pending requests | `getDocs(query(collection(db, 'freeConsultations'), where('status', '==', 'pending')))` |
| Stylist: decline | `updateDoc(doc(db, 'freeConsultations', email), { status: 'declined', declineReason })` |
| Stylist: ack order | `updateDoc(doc(db, 'orders', id), { stylistAcknowledged: true })` |
| Stylist: client notes | `setDoc(doc(db, 'team', stylistId, 'clientNotes', clientId), notes, { merge: true })` |
| Wishlist (user) | `updateDoc(doc(db, 'favourites', uid), { productIds: arrayUnion(id) })` / `arrayRemove` |
| Chat sessions list | `getDocs(query(collection(db, 'sessions'), where('uId', '==', uid)))` |
| Chat messages | `onSnapshot(query(collection(db, 'messages'), where('sessionId', '==', id), orderBy('sendAt')), cb)` |
| Send text message | `addDoc(collection(db, 'messages'), { sessionId, senderId, type: 'TEXT', data: { text }, readBy: [uid], sendAt: serverTimestamp() })` |
| Mark messages read | `writeBatch` → update `readBy` on all unread messages in session |
| EaseBot session | `addDoc(collection(db, 'aiChatSessions'), { userId, messageCount: 0, createdAt: serverTimestamp() })` |
| EaseBot history | `getDocs(query(collection(db, 'aiChatSessions', sessionId, 'messages'), orderBy('createdAt')))` |
| Style boards (client) | `getDocs(query(collection(db, 'styleBoards'), where('clientId', '==', uid)))` |
| Style board (stylist write) | `setDoc(doc(db, 'styleBoards', id), boardData)` |
| Publish style board | `updateDoc(doc(db, 'styleBoards', id), { isPublished: true, publishedAt: serverTimestamp() })` |

### 8.2 Firebase Cloud Functions (callable via `httpsCallable`)

Only these operations require server-side execution. Use `httpsCallable(functions, 'functionName')`.

| Function Name | Purpose | Why Server-Side |
|---|---|---|
| `createRazorpayOrder` | Create Razorpay order, return `{ razorpayOrderId, key }` | Razorpay secret key must not be on client |
| `verifyRazorpayPayment` | Verify payment signature `{ razorpay_payment_id, razorpay_order_id, razorpay_signature }` | Signature verification requires secret key |
| `refreshUserClaims` | Set Firebase custom claims `{ role: 'premium' }` after package purchase | Custom claims can only be set server-side |
| `freeConsultationChatMessage` | Send message `{ sessionId, text }` → LLM call → writes assistant response to Firestore | Anthropic API key must not be on client |
| `confirmFreeConsultation` | `{ consultationEmail, stylistId, scheduledDate }` → generates Meet/Teams link → writes `meetLink` to Firestore | Calendar API credentials must not be on client |

### 8.3 Firebase Storage Operations

| Operation | SDK Call |
|---|---|
| Upload chat image | `uploadBytes(ref(storage, \`chat/${sessionId}/${filename}\`), file)` → `getDownloadURL` |
| Upload audio message | `uploadBytes(ref(storage, \`audio/${sessionId}/${filename}\`), blob)` → `getDownloadURL` |
| Upload profile photo | `uploadBytes(ref(storage, \`avatars/${uid}\`), file)` → `getDownloadURL` → `updateDoc` user |
| Upload style board cover | `uploadBytes(ref(storage, \`styleboards/${boardId}/cover\`), file)` → `getDownloadURL` |

### 8.4 Algolia (Search Only — no Firestore for full-text search)

| Operation | Call |
|---|---|
| Product full-text search | `algoliaIndex.search(query, { filters, hitsPerPage, page })` |
| Vector/semantic search | `vectorSearchService.search(query)` → calls Firestore vector index or dedicated Algolia neural search |
| Dynamic filter facets | `algoliaIndex.searchForFacetValues(facet, query)` |

---

## 9. Environment Variables

All must be in `.env` (gitignored) and `.env.example`:

```
# Firebase (all data ops go through these — no separate backend URL needed)
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=wedding-ease-dc99a
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=

# Razorpay (public key only — secret key lives in Cloud Functions env)
EXPO_PUBLIC_RAZORPAY_KEY_ID=

# Algolia (search-only key — never the admin key)
EXPO_PUBLIC_ALGOLIA_APP_ID=
EXPO_PUBLIC_ALGOLIA_SEARCH_API_KEY=
EXPO_PUBLIC_ALGOLIA_PRODUCTS_INDEX=
```

> No `API_BASE_URL` or `CURRENCY_API_URL` — there is no custom REST backend called from the client. All data flows through Firebase SDK + Cloud Functions.

---

## 10. Out of Scope for Mobile

The following web features are **not** to be implemented in the mobile app:

| Web Feature | Reason |
|---|---|
| Vendor application (`/vendor/apply`, `/vendor-activation`) | Vendor onboarding is a web-only admin flow |
| Stylist application (`/stylist/apply`) | Web form for internal use |
| Admin panel features | Not in scope |
| Blog (`/blog`) | Web-only content, link to web blog from Profile |
| Invoice PDF generation | Use web URL or Firebase Storage link |
| Full vendor marketplace pages | Web-only |

---

## 11. Success Metrics (Post-Launch)

| Metric | Target |
|---|---|
| Cart → Order conversion | ≥ 30% |
| Free consult request completion | ≥ 70% of form starts |
| Package purchase post-free-consult | ≥ 15% |
| EaseBot messages per session | ≥ 6 (signals engagement) |
| Chat response time (stylist) | ≤ 4 hours (notification drives this) |
| Crash-free sessions | ≥ 99.5% |
| Checkout draft recovery | ≥ 95% (when draft exists) |

---

*This PRD is the single source of truth for mobile implementation. Web platform (`/Wedding-Ease-User-Interface`) is the UX reference. Any ambiguity in mobile implementation → defer to web behavior.*
