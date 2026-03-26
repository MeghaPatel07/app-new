export interface ShareActivityPayload {
  uId: string;
  userName?: string;
  userEmail?: string;
  productId: string;
  productVariantId?: string;
  productName?: string;
  platform?: string;
  eventType: string;
  shareUrl?: string;
  pagePath?: string;
  userAgent?: string;
  createdAt: number;
  createdBy: string;
}

export interface ShareActivityModel extends ShareActivityPayload {
  docId?: string;
}
