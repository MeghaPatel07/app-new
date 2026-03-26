import { Timestamp } from 'firebase/firestore';

export interface ProductReview {
  id: string; // Firestore doc ID
  productId: string;
  variantId?: string;
  orderId: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  rating: number; // 1-5
  comment: string;
  images: string[]; // Array of media URLs
  createdAt: Date;
  updatedAt: Date;
  status: 'pending' | 'approved' | 'rejected';
  verifiedPurchase: boolean;
  helpfulCount: number;
  reportCount: number;
}

export class ProductReviewClass implements ProductReview {
  id: string;
  productId: string;
  variantId?: string;
  orderId: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  rating: number;
  comment: string;
  images: string[];
  createdAt: Date;
  updatedAt: Date;
  status: 'pending' | 'approved' | 'rejected';
  verifiedPurchase: boolean;
  helpfulCount: number;
  reportCount: number;

  constructor(data: Partial<ProductReview>) {
    this.id = data.id || '';
    this.productId = data.productId || '';
    this.variantId = data.variantId;
    this.orderId = data.orderId || '';
    this.userId = data.userId || '';
    this.userName = data.userName || '';
    this.userPhoto = data.userPhoto;
    this.rating = data.rating || 0;
    this.comment = data.comment || '';
    this.images = data.images || [];
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.status = data.status || 'pending';
    this.verifiedPurchase = data.verifiedPurchase || false;
    this.helpfulCount = data.helpfulCount || 0;
    this.reportCount = data.reportCount || 0;
  }

  toJson(): Record<string, any> {
    return {
      productId: this.productId,
      variantId: this.variantId || null,
      orderId: this.orderId,
      userId: this.userId,
      userName: this.userName,
      userPhoto: this.userPhoto || null,
      rating: this.rating,
      comment: this.comment,
      images: this.images,
      createdAt: this.createdAt.getTime(),
      updatedAt: this.updatedAt.getTime(),
      status: this.status,
      verifiedPurchase: this.verifiedPurchase,
      helpfulCount: this.helpfulCount,
      reportCount: this.reportCount,
    };
  }

  static fromJson(docId: string, json: Record<string, any>): ProductReviewClass {
    return new ProductReviewClass({
      id: docId,
      productId: json['productId'],
      variantId: json['variantId'],
      orderId: json['orderId'],
      userId: json['userId'],
      userName: json['userName'],
      userPhoto: json['userPhoto'],
      rating: json['rating'],
      comment: json['comment'],
      images: json['images'] || [],
      createdAt: new Date(json['createdAt']),
      updatedAt: new Date(json['updatedAt']),
      status: json['status'],
      verifiedPurchase: json['verifiedPurchase'],
      helpfulCount: json['helpfulCount'] || 0,
      reportCount: json['reportCount'] || 0,
    });
  }
}
