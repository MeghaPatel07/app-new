import {
  collection,
  getDocs,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import type { Package } from '../types';

/**
 * Fetch all active packages from Firestore, sorted by price ascending.
 * Returns an empty array on error rather than throwing, to keep the UI resilient.
 */
export async function getActivePackages(): Promise<Package[]> {
  try {
    const snapshot = await getDocs(collection(db, 'packages'));
    const packages: Package[] = [];

    snapshot.forEach((docSnap) => {
      const d = docSnap.data();
      if (d.isActive === false) return; // skip explicitly inactive

      packages.push({
        id: docSnap.id,
        packageName: d.packageName ?? '',
        price: d.price ?? 0,
        description: d.description ?? '',
        points: (d.points ?? []).map((p: any) => ({
          serviceId: p.serviceId,
          serviceName: p.serviceName ?? '',
          serviceQty: p.serviceQty ?? 0,
          serviceUnit: p.serviceUnit,
        })),
        isActive: d.isActive !== false,
        isPrimary: d.isPrimary ?? false,
        validity: d.validity ?? 0,
        packageColor: d.packageColor ?? '',
        imageUrl: d.imageUrl,
        thumbnailUrl: d.thumbnailUrl,
        createdAt: d.createdAt?.toDate?.() ?? d.createdAt ?? new Date(),
        updatedAt: d.updatedAt?.toDate?.() ?? d.updatedAt ?? new Date(),
      });
    });

    packages.sort((a, b) => a.price - b.price);
    return packages;
  } catch {
    return [];
  }
}
