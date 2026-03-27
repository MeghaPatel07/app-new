import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import type { PackagePurchaseRecord } from '../types';

const PURCHASE_COLLECTION = 'packageOrders';

/** Generate a unique PKG- prefixed order ID matching the web app format. */
export function generateOrderId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 11);
  return `PKG-${timestamp}-${random}`;
}

function mapDocToPurchase(docSnap: any): PackagePurchaseRecord {
  const d = docSnap.data();
  return {
    docId: docSnap.id,
    uid: d.uid ?? '',
    userName: d.userName ?? '',
    userEmail: d.userEmail ?? '',
    userPhone: d.userPhone ?? '',
    packageName: d.packageName ?? '',
    packagePrice: d.packagePrice ?? 0,
    description: d.description ?? '',
    validity: d.validity ?? 30,
    points: d.points ?? [],
    remainingPoints: d.remainingPoints ?? [],
    isActive: d.isActive ?? false,
    isPaid: d.isPaid ?? false,
    paidAmount: d.paidAmount ?? 0,
    totalAmount: d.totalAmount ?? 0,
    orderId: d.orderId ?? '',
    transactionId: d.transactionId,
    razorpayOrderId: d.razorpayOrderId,
    razorpayPaymentId: d.razorpayPaymentId,
    quantity: d.quantity ?? 1,
    isAddon: d.isAddon ?? false,
    totalConsultationHours: d.totalConsultationHours ?? 0,
    usedConsultationHours: d.usedConsultationHours ?? 0,
    createdAt: d.createdAt?.toDate?.() ?? d.createdAt ?? new Date(),
    purchaseAt: d.purchaseAt?.toDate?.() ?? d.purchaseAt,
  };
}

/** Create a pending package order in Firestore. Returns the new doc ID. */
export async function createPackagePurchase(
  data: Omit<PackagePurchaseRecord, 'docId'>
): Promise<string> {
  const ref = await addDoc(collection(db, PURCHASE_COLLECTION), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

/** Mark a package order as paid after successful Razorpay verification. */
export async function markPackagePaid(
  docId: string,
  razorpayOrderId: string,
  razorpayPaymentId: string,
  paidAmount: number
): Promise<void> {
  await updateDoc(doc(db, PURCHASE_COLLECTION, docId), {
    isPaid: true,
    isActive: true,
    paidAmount,
    razorpayOrderId,
    razorpayPaymentId,
    transactionId: razorpayPaymentId,
    purchaseAt: serverTimestamp(),
  });
}

/** Update users/{uid} with packageId after successful purchase. */
export async function updateUserPackageId(
  uid: string,
  packageId: string,
  packageOrderDocId: string
): Promise<void> {
  await updateDoc(doc(db, 'users', uid), {
    packageId,
    packageOrderId: packageOrderDocId,
    updatedAt: serverTimestamp(),
  });
}

/** Get the active paid package purchase for a user, or null if none. */
export async function getActivePackagePurchase(
  uid: string
): Promise<PackagePurchaseRecord | null> {
  const q = query(
    collection(db, PURCHASE_COLLECTION),
    where('uid', '==', uid),
    where('isActive', '==', true),
    where('isPaid', '==', true)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const docs = snap.docs.map(mapDocToPurchase);
  docs.sort((a, b) => {
    const aTime = a.purchaseAt instanceof Date ? a.purchaseAt.getTime() : 0;
    const bTime = b.purchaseAt instanceof Date ? b.purchaseAt.getTime() : 0;
    return bTime - aTime;
  });
  return docs[0];
}

/** Get a package purchase by its PKG- orderId. */
export async function getPackagePurchaseByOrderId(
  orderId: string
): Promise<PackagePurchaseRecord | null> {
  const q = query(
    collection(db, PURCHASE_COLLECTION),
    where('orderId', '==', orderId)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return mapDocToPurchase(snap.docs[0]);
}

/** Namespace-style export for consumers that prefer object access. */
export const packagePurchaseService = {
  generateOrderId,
  createPackagePurchase,
  markPackagePaid,
  updateUserPackageId,
  getActivePackagePurchase,
  getPackagePurchaseByOrderId,
};
