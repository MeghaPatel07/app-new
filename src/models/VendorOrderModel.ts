import { DocumentSnapshot, QueryDocumentSnapshot } from 'firebase/firestore';
import { OrderProductData, OrderProductDataClass } from './OrderModels';

// TypeScript interface for VendorOrderModel (matches Dart VendorOrderModel exactly)
export interface VendorOrderModel {
  docId: string;
  orderId: string;
  orderDocId: string;
  vendorId: string;
  orderProducts: OrderProductData[];
  createdAt: Date;
  statusUpdatedAt: Date;
  createdBy: string;
  status: string;
  statusUpdatedBy?: string;
}

// TypeScript class implementation for VendorOrderModel (matches Dart VendorOrderModel exactly)
export class VendorOrderModelClass implements VendorOrderModel {
  docId: string;
  orderId: string;
  orderDocId: string;
  vendorId: string;
  orderProducts: OrderProductData[];
  createdAt: Date;
  statusUpdatedAt: Date;
  createdBy: string;
  status: string;
  statusUpdatedBy?: string;

  constructor(data: Partial<VendorOrderModel>) {
    this.docId = data.docId || '';
    this.orderId = data.orderId || '';
    this.orderDocId = data.orderDocId || '';
    this.vendorId = data.vendorId || '';
    this.orderProducts = data.orderProducts || [];
    this.createdAt = data.createdAt || new Date();
    this.statusUpdatedAt = data.statusUpdatedAt || new Date();
    this.createdBy = data.createdBy || '';
    this.status = data.status || 'Created';
    this.statusUpdatedBy = data.statusUpdatedBy;
  }

  /// Convert JSON to VendorOrderModel (matches Dart fromJson method)
  static fromJson(json: Record<string, any>): VendorOrderModelClass {
    return new VendorOrderModelClass({
      docId: json['docId'] || '',
      orderId: json['orderId'] || '',
      orderDocId: json.hasOwnProperty('orderDocId') ? json['orderDocId'] : '',
      vendorId: json['vendorId'] || '',
      orderProducts: (json['orderProducts'] as any[] || []).map((product) =>
        OrderProductDataClass.fromJson(product)
      ),
      createdAt: json['createdAt'] ? (typeof json['createdAt'] === 'number' ? new Date(json['createdAt']) : new Date(json['createdAt'])) : new Date(), // Convert from epoch time
      statusUpdatedAt: json['statusUpdatedAt'] ? (typeof json['statusUpdatedAt'] === 'number' ? new Date(json['statusUpdatedAt']) : new Date(json['statusUpdatedAt'])) : new Date(), // Convert from epoch time
      createdBy: json['createdBy'] || '',
      status: json['status'] || 'Created',
      statusUpdatedBy: json['statusUpdatedBy'],
    });
  }

  /// Convert VendorOrderModel to JSON (matches Dart toJson method)
  toJson(): Record<string, any> {
    return {
      'orderId': this.orderId,
      'orderDocId': this.orderDocId,
      'vendorId': this.vendorId,
      'orderProducts': this.orderProducts.map((product) =>
        product instanceof OrderProductDataClass ? product.toJson() : product
      ),
      'createdAt': this.createdAt.getTime(), // Convert to epoch time
      'statusUpdatedAt': this.statusUpdatedAt.getTime(), // Convert to epoch time
      'createdBy': this.createdBy,
      'status': this.status,
      'statusUpdatedBy': this.statusUpdatedBy,
    };
  }

  /// Convert Firestore QueryDocumentSnapshot to VendorOrderModel (matches Dart fromSnap method)
  static fromSnap(snapshot: QueryDocumentSnapshot): VendorOrderModelClass {
    const data = snapshot.data();
    const createdAt = data['createdAt'];
    const statusUpdatedAt = data['statusUpdatedAt'];
    return new VendorOrderModelClass({
      docId: snapshot.id,
      orderId: data['orderId'] || '',
      orderDocId: data.hasOwnProperty('orderDocId') ? data['orderDocId'] : '',
      vendorId: data['vendorId'] || '',
      orderProducts: (data['orderProducts'] as any[] || []).map((product) =>
        OrderProductDataClass.fromJson(product)
      ),
      createdAt: createdAt ? (typeof createdAt === 'number' ? new Date(createdAt) : new Date(createdAt)) : new Date(), // Convert from epoch time
      statusUpdatedAt: statusUpdatedAt ? (typeof statusUpdatedAt === 'number' ? new Date(statusUpdatedAt) : new Date(statusUpdatedAt)) : new Date(), // Convert from epoch time
      createdBy: data['createdBy'] || '',
      status: data['status'] || 'Created',
      statusUpdatedBy: data['statusUpdatedBy'],
    });
  }

  /// Convert Firestore DocumentSnapshot to VendorOrderModel (matches Dart fromDocSnap method)
  static fromDocSnap(snapshot: DocumentSnapshot): VendorOrderModelClass {
    const data = snapshot.data();
    if (!data) {
      throw new Error('Document data is null');
    }
    const createdAt = data['createdAt'];
    const statusUpdatedAt = data['statusUpdatedAt'];
    return new VendorOrderModelClass({
      docId: snapshot.id,
      orderId: data['orderId'] || '',
      orderDocId: data.hasOwnProperty('orderDocId') ? data['orderDocId'] : '',
      vendorId: data['vendorId'] || '',
      orderProducts: (data['orderProducts'] as any[] || []).map((product) =>
        OrderProductDataClass.fromJson(product)
      ),
      createdAt: createdAt ? (typeof createdAt === 'number' ? new Date(createdAt) : new Date(createdAt)) : new Date(), // Convert from epoch time
      statusUpdatedAt: statusUpdatedAt ? (typeof statusUpdatedAt === 'number' ? new Date(statusUpdatedAt) : new Date(statusUpdatedAt)) : new Date(), // Convert from epoch time
      createdBy: data['createdBy'] || '',
      status: data['status'] || 'Created',
      statusUpdatedBy: data['statusUpdatedBy'],
    });
  }
}

