export interface VariantDetails {
  id: string;
  name: string;
  description: string;
  image: string;
  variantId: string;
  productId: string;
  addedOn: number;
  addedBy: string;
  addedByType: string;
  price: number;           // Discounted / selling price
  originalPrice?: number;  // Pre-discount price (for showing savings)
}

export interface UserWishlistModel {
  docId?: string;
  uId: string;
  title: string;
  desc: string;
  createdAt: number; // Epoch timestamp
  createdBy: string; // User ID
  createdByType: string;
  variantIds: VariantDetails[];
}
