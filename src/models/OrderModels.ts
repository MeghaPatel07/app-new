import { Timestamp, DocumentSnapshot, QueryDocumentSnapshot } from 'firebase/firestore';
import { AddressModel } from './AddressModels';

// TypeScript interface for OrderModel data structure (matches Dart OrderModel exactly)
export interface OrderModel {
  docId: string;
  orderId: string;
  createdAt: Date;
  createdByDocId: string;
  uid: string;
  sessionId: string;
  userConfirmed?: boolean;
  isPaid: boolean;
  paidOn?: Date;
  statusUpdatedAt?: Date;
  statusUpdatedBy?: string;
  userConfirmedOn?: Date;
  charges: ChargeModel[];
  orderProductData: OrderProductData[];
  isDirectOrder: boolean;
  totalAmount: number;
  paidAmount: number;
  address?: string;
  orderStatus: string;
  previousDocIds: string[];
  rejectionReason?: string;
  /** Structured shipping address captured at order time */
  shippingAddress?: AddressModel;
  /** Shipping method chosen at checkout: 'standard' or 'express' */
  shippingMethod?: 'standard' | 'express';
  /** Currency in which the customer saw prices when placing the order: INR, EUR, or USD */
  preferredCurrency?: 'INR' | 'EUR' | 'USD';
  /** Order total in that preferred currency (for display/audit) */
  preferredCurrencyValue?: number;
  /** Exchange rate used at order time (INR → preferred currency). 1 for INR, or rate for USD/EUR */
  currentConversionRate?: number | null;
  /** Separate delivery address if different from shipping address */
  deliveryAddress?: AddressModel | null;
  /** Billing address for the invoice */
  billingAddress?: AddressModel | null;
  /** GST invoice details if requested by customer */
  gstDetails?: { needsGst: boolean; gstNumber: string; companyName: string } | null;
  /** Firestore doc ID of the booking record created on package purchase */
  bookingId?: string;
  /** True when this order is for a wedding package (not a product) */
  isPackageOrder?: boolean;
  /** The Firestore doc ID of the package that was purchased */
  packageId?: string;
  /** Map of productId -> reviewId for products in this order */
  reviewedProducts?: Record<string, string> | null;
}

// TypeScript class implementation with methods (matches Dart OrderModel exactly)
export class OrderModelClass implements OrderModel {
  docId: string;
  orderId: string;
  createdAt: Date;
  createdByDocId: string;
  uid: string;
  sessionId: string;
  userConfirmed?: boolean;
  isPaid: boolean;
  paidOn?: Date;
  statusUpdatedAt?: Date;
  statusUpdatedBy?: string;
  userConfirmedOn?: Date;
  charges: ChargeModel[];
  orderProductData: OrderProductData[];
  isDirectOrder: boolean;
  totalAmount: number;
  paidAmount: number;
  address?: string;
  orderStatus: string;
  previousDocIds: string[];
  rejectionReason?: string;
  shippingAddress?: AddressModel;
  shippingMethod?: 'standard' | 'express';
  preferredCurrency?: 'INR' | 'EUR' | 'USD';
  preferredCurrencyValue?: number;
  currentConversionRate?: number | null;
  deliveryAddress?: AddressModel | null;
  billingAddress?: AddressModel | null;
  gstDetails?: { needsGst: boolean; gstNumber: string; companyName: string } | null;
  bookingId?: string;
  isPackageOrder?: boolean;
  packageId?: string;
  reviewedProducts?: Record<string, string> | null;

  constructor(data: Partial<OrderModel>) {
    this.docId = data.docId || '';
    this.orderId = data.orderId || '';
    this.createdAt = data.createdAt || new Date();
    this.createdByDocId = data.createdByDocId || '';
    this.uid = data.uid || '';
    this.sessionId = data.sessionId || '';
    this.userConfirmed = data.userConfirmed;
    this.isPaid = data.isPaid || false;
    this.paidOn = data.paidOn;
    this.statusUpdatedAt = data.statusUpdatedAt;
    this.statusUpdatedBy = data.statusUpdatedBy;
    this.userConfirmedOn = data.userConfirmedOn;
    this.charges = data.charges || [];
    this.orderProductData = data.orderProductData || [];
    this.isDirectOrder = data.isDirectOrder || false;
    this.totalAmount = data.totalAmount || 0;
    this.paidAmount = data.paidAmount || 0;
    this.address = data.address;
    this.orderStatus = data.orderStatus || '';
    this.previousDocIds = data.previousDocIds || [];
    this.rejectionReason = data.rejectionReason;
    this.shippingAddress = data.shippingAddress;
    this.shippingMethod = data.shippingMethod;
    this.preferredCurrency = data.preferredCurrency;
    this.preferredCurrencyValue = data.preferredCurrencyValue;
    this.currentConversionRate = data.currentConversionRate;
    this.deliveryAddress = data.deliveryAddress ?? null;
    this.billingAddress = data.billingAddress ?? null;
    this.gstDetails = data.gstDetails ?? null;
    this.bookingId = data.bookingId;
    this.isPackageOrder = data.isPackageOrder;
    this.packageId = data.packageId;
    this.reviewedProducts = data.reviewedProducts ?? null;
  }

  /// Convert a OrderModel instance to JSON (matches Dart toJson method)
  toJson(): Record<string, any> {
    // Convert charges array to Map for Firebase storage
    const chargesMap: Record<string, string> = {};
    this.charges.forEach(charge => {
      chargesMap[charge.chargeName] = charge.price;
    });

    const json: Record<string, any> = {
      'orderId': this.orderId,
      'createdAt': this.createdAt.getTime(), // Convert to epoch time
      'createdByDocId': this.createdByDocId,
      'uid': this.uid,
      'isPaid': this.isPaid,
      'isDirectOrder': this.isDirectOrder,
      'sessionId': this.sessionId,
      'charges': chargesMap, // Store as Map, not array
      'orderProductData': this.orderProductData.map((e) => e instanceof OrderProductDataClass ? e.toJson() : e),
      'paidAmount': this.paidAmount,
      'totalAmount': this.totalAmount,
      'orderStatus': this.orderStatus,
      // Always include these fields (even if null) to match Dart schema
      'userConfirmed': this.userConfirmed || null,
      'paidOn': this.paidOn ? this.paidOn.getTime() : null, // Convert to epoch time or null
      'statusUpdatedAt': this.statusUpdatedAt ? this.statusUpdatedAt.getTime() : null, // Convert to epoch time or null
      'statusUpdatedBy': this.statusUpdatedBy || null,
      'userConfirmedOn': this.userConfirmedOn ? this.userConfirmedOn.getTime() : null, // Convert to epoch time or null
      'address': this.address || null,
      'rejectionReason': this.rejectionReason || null,
      'shippingAddress': this.shippingAddress ?? null,
      'shippingMethod': this.shippingMethod ?? null,
      'previousDocIds': this.previousDocIds || [],
      'preferredCurrency': this.preferredCurrency ?? null,
      'preferredCurrencyValue': this.preferredCurrencyValue ?? null,
      'currentConversionRate': this.currentConversionRate ?? null,
      'deliveryAddress': this.deliveryAddress ?? null,
      'billingAddress': this.billingAddress ?? null,
      'gstDetails': this.gstDetails ?? null,
      'bookingId': this.bookingId ?? null,
      'isPackageOrder': this.isPackageOrder ?? null,
      'packageId': this.packageId ?? null,
      'reviewedProducts': this.reviewedProducts ?? null,
    };

    return json;
  }

  /// Create a OrderModel instance from JSON (matches Dart fromJson method)
  static fromJson(json: Record<string, any>): OrderModelClass | null {
    try {
      return new OrderModelClass({
        docId: json['docId'] || '',
        orderId: json['orderId'] || '',
        createdAt: new Date(json['createdAt']), // Convert from epoch time
        createdByDocId: json['createdByDocId'] || '',
        uid: json['uid'] || '',
        sessionId: json['sessionId'] || '',
        userConfirmed: json['userConfirmed'],
        isDirectOrder: json['isDirectOrder'],
        isPaid: json['isPaid'] || false,
        paidOn: json['paidOn'] ? new Date(json['paidOn']) : undefined, // Convert from epoch time
        statusUpdatedAt: json['statusUpdatedAt'] ? new Date(json['statusUpdatedAt']) : undefined, // Convert from epoch time
        statusUpdatedBy: json['statusUpdatedBy'],
        userConfirmedOn: json['userConfirmedOn'] ? new Date(json['userConfirmedOn']) : undefined, // Convert from epoch time
        charges: (json['charges'] as Record<string, any> || {})
          ? Object.entries(json['charges'])
            .map(([key, value]) => new ChargeModelClass({ chargeName: key, price: value.toString() }))
          : [],
        orderProductData: (json['orderProductData'] as any[] || [])
          .map((e) => OrderProductDataClass.fromJson(e)),
        paidAmount: json['paidAmount'] || 0,
        totalAmount: json['totalAmount'] || 0,
        address: json['address'],
        orderStatus: json['orderStatus'],
        rejectionReason: json['rejectionReason'],
        previousDocIds: Array.isArray(json['previousDocIds']) ? json['previousDocIds'] : [],
        shippingAddress: json['shippingAddress'] ? (json['shippingAddress'] as AddressModel) : undefined,
        shippingMethod: json['shippingMethod'] || undefined,
        preferredCurrency: json['preferredCurrency'] ?? undefined,
        preferredCurrencyValue: json['preferredCurrencyValue'] ?? undefined,
        currentConversionRate: json['currentConversionRate'] ?? undefined,
        deliveryAddress: json['deliveryAddress'] ?? null,
        billingAddress: json['billingAddress'] ?? null,
        gstDetails: json['gstDetails'] ?? null,
        bookingId: json['bookingId'] ?? undefined,
        isPackageOrder: json['isPackageOrder'] ?? undefined,
        packageId: json['packageId'] ?? undefined,
        reviewedProducts: json['reviewedProducts'] ?? null,
      });
    } catch (e) {
      return null;
    }
  }

  /// Create a OrderModel instance from Firestore DocumentSnapshot (matches Dart fromDocSnap method)
  static fromDocSnap(snapshot: DocumentSnapshot): OrderModelClass {
    const data = snapshot.data();
    if (!data) {
      throw new Error('Document data is null');
    }

    return new OrderModelClass({
      docId: snapshot.id,
      orderId: data['orderId'],
      createdByDocId: data['createdByDocId'],
      uid: data['uid'],
      isPaid: data['isPaid'],
      isDirectOrder: data['isDirectOrder'],
      sessionId: data['sessionId'] || '',
      statusUpdatedAt: data['statusUpdatedAt'] ? new Date(data['statusUpdatedAt']) : undefined, // Convert from epoch time
      statusUpdatedBy: data['statusUpdatedBy'],
      charges: (data['charges'] as Record<string, any> || {})
        ? Object.entries(data['charges'])
          .map(([key, value]) => new ChargeModelClass({ chargeName: key, price: value.toString() }))
        : [],
      orderProductData: (data['orderProductData'] as any[] || [])
        .map((e) => OrderProductDataClass.fromJson(e)),
      paidAmount: data['paidAmount'] || 0,
      totalAmount: data.data()?.hasOwnProperty('totalAmount') ? (data['totalAmount'] || 0) : 0,
      address: data['address'],
      orderStatus: data['orderStatus'],
      createdAt: new Date(data['createdAt']), // Convert from epoch time
      userConfirmed: data['userConfirmed'],
      rejectionReason: data.data()?.hasOwnProperty('rejectionReason') ? data['rejectionReason'] : undefined,
      paidOn: data['paidOn'] ? new Date(data['paidOn']) : undefined, // Convert from epoch time
      userConfirmedOn: data['userConfirmedOn'] ? new Date(data['userConfirmedOn']) : undefined,
      shippingAddress: data['shippingAddress'] ? (data['shippingAddress'] as AddressModel) : undefined,
      shippingMethod: data['shippingMethod'] || undefined,
      previousDocIds: Array.isArray(data['previousDocIds']) ? data['previousDocIds'] : [],
      preferredCurrency: data['preferredCurrency'] ?? undefined,
      preferredCurrencyValue: data['preferredCurrencyValue'] ?? undefined,
      currentConversionRate: data['currentConversionRate'] ?? undefined,
      deliveryAddress: data['deliveryAddress'] ?? null,
      gstDetails: data['gstDetails'] ?? null,
      bookingId: data['bookingId'] ?? undefined,
      isPackageOrder: data['isPackageOrder'] ?? undefined,
      packageId: data['packageId'] ?? undefined,
      reviewedProducts: data['reviewedProducts'] ?? null,
    });
  }

  /// Create a OrderModel instance from Firestore QueryDocumentSnapshot (matches Dart fromSnap method)
  static fromSnap(snapshot: QueryDocumentSnapshot): OrderModelClass {
    const data = snapshot.data();

    return new OrderModelClass({
      docId: snapshot.id,
      orderId: data['orderId'],
      createdByDocId: data['createdByDocId'],
      uid: data['uid'],
      sessionId: data['sessionId'] || '',
      isPaid: data['isPaid'],
      isDirectOrder: data['isDirectOrder'],
      rejectionReason: data.data().hasOwnProperty('rejectionReason') ? data['rejectionReason'] : undefined,
      charges: (data['charges'] as Record<string, any> || {})
        ? Object.entries(data['charges'])
          .map(([key, value]) => new ChargeModelClass({ chargeName: key, price: value.toString() }))
        : [],
      statusUpdatedAt: data['statusUpdatedAt'] ? new Date(data['statusUpdatedAt']) : undefined, // Convert from epoch time
      statusUpdatedBy: data['statusUpdatedBy'],
      orderProductData: (data['orderProductData'] as any[] || [])
        .map((e) => OrderProductDataClass.fromJson(e)),
      orderStatus: data['orderStatus'],
      paidAmount: data['paidAmount'] || 0,
      totalAmount: data.data().hasOwnProperty('totalAmount') ? (data['totalAmount'] || 0) : 0,
      address: data['address'],
      createdAt: new Date(data['createdAt']), // Convert from epoch time
      userConfirmed: data['userConfirmed'],
      paidOn: data['paidOn'] ? new Date(data['paidOn']) : undefined, // Convert from epoch time
      userConfirmedOn: data['userConfirmedOn'] ? new Date(data['userConfirmedOn']) : undefined, // Convert from epoch time
      shippingAddress: data['shippingAddress'] ? (data['shippingAddress'] as AddressModel) : undefined,
      shippingMethod: data['shippingMethod'] || undefined,
      previousDocIds: Array.isArray(data['previousDocIds']) ? data['previousDocIds'] : [],
      preferredCurrency: data['preferredCurrency'] ?? undefined,
      preferredCurrencyValue: data['preferredCurrencyValue'] ?? undefined,
      currentConversionRate: data['currentConversionRate'] ?? undefined,
      deliveryAddress: data['deliveryAddress'] ?? null,
      gstDetails: data['gstDetails'] ?? null,
      bookingId: data['bookingId'] ?? undefined,
      isPackageOrder: data['isPackageOrder'] ?? undefined,
      packageId: data['packageId'] ?? undefined,
      reviewedProducts: data['reviewedProducts'] ?? null,
    });
  }
}

// TypeScript interface for OrderProductData (matches Dart OrderProductData exactly)
export interface OrderProductData {
  id: string;
  productId: string;
  variantId: string;
  vendorId: string;
  qty: number;
  currentStatus?: string;
  purchasePrice: number;
  sellingPrice: number;
  userNote: string;
  adminNote: string;
  productSKu: string;
  deliveryDate?: Date;
  orderProductExtraData?: OrderProductExtraData;
}

// TypeScript class implementation for OrderProductData (matches Dart OrderProductData exactly)
export class OrderProductDataClass implements OrderProductData {
  id: string;
  productId: string;
  variantId: string;
  vendorId: string;
  qty: number;
  currentStatus?: string;
  purchasePrice: number;
  sellingPrice: number;
  userNote: string;
  adminNote: string;
  productSKu: string;
  deliveryDate?: Date;
  orderProductExtraData?: OrderProductExtraData;

  constructor(data: Partial<OrderProductData>) {
    this.id = data.id || '';
    this.productId = data.productId || '';
    this.variantId = data.variantId || '';
    this.vendorId = data.vendorId || '';
    this.qty = data.qty || 0;
    this.currentStatus = data.currentStatus;
    this.purchasePrice = data.purchasePrice || 0;
    this.sellingPrice = data.sellingPrice || 0;
    this.userNote = data.userNote || '';
    this.adminNote = data.adminNote || '';
    this.productSKu = data.productSKu || '';
    this.deliveryDate = data.deliveryDate;
    this.orderProductExtraData = data.orderProductExtraData;
  }

  /// Convert JSON to OrderProductData (matches Dart fromJson method)
  static fromJson(json: Record<string, any>): OrderProductDataClass {
    return new OrderProductDataClass({
      id: json['id'] || '',
      productId: json['productId'] || '',
      variantId: json['variantId'] || '',
      vendorId: json['vendorId'] || '',
      qty: json['qty'] || 0,
      currentStatus: json['currentStatus'],
      purchasePrice: json['purchasePrice'],
      sellingPrice: json['sellingPrice'],
      userNote: json['userNote'],
      adminNote: json['adminNote'],
      productSKu: json['productSKu'],
      deliveryDate: json['deliveryDate'] ? new Date(json['deliveryDate']) : undefined,
      orderProductExtraData: (json.hasOwnProperty('orderProductExtraData') && json['orderProductExtraData'] != null)
        ? OrderProductExtraDataClass.fromJson(json['orderProductExtraData'])
        : undefined,
    });
  }

  /// Convert OrderProductData to JSON (matches Dart toJson method)
  toJson(): Record<string, any> {
    const json: Record<string, any> = {
      'id': this.id,
      'productId': this.productId,
      'variantId': this.variantId,
      'vendorId': this.vendorId,
      'qty': this.qty,
      'purchasePrice': this.purchasePrice,
      'sellingPrice': this.sellingPrice,
      'userNote': this.userNote,
      'adminNote': this.adminNote,
      'productSKu': this.productSKu,
      // Always include optional fields as null if undefined (Firebase format requirement)
      'currentStatus': this.currentStatus !== undefined ? this.currentStatus : null,
      'deliveryDate': this.deliveryDate !== undefined && this.deliveryDate !== null
        ? this.deliveryDate.getTime()
        : null,
      'orderProductExtraData': this.orderProductExtraData !== undefined && this.orderProductExtraData !== null
        ? (this.orderProductExtraData instanceof OrderProductExtraDataClass
          ? this.orderProductExtraData.toJson()
          : this.orderProductExtraData)
        : null,
    };

    return json;
  }

  /// Convert to partial delivered JSON (matches Dart toPartialDeliveredJson method)
  toPartialDeliveredJson(currentStatus: string, deliveredQty: number): Record<string, any> {
    return {
      'id': this.id,
      'productId': this.productId,
      'variantId': this.variantId,
      'qty': deliveredQty,
      'currentStatus': currentStatus,
      'purchasePrice': this.purchasePrice,
      'sellingPrice': this.sellingPrice,
      'userNote': this.userNote,
      'adminNote': this.adminNote,
      'productSKu': this.productSKu,
      'deliveryDate': this.deliveryDate?.getTime(),
      'orderProductExtraData': this.orderProductExtraData instanceof OrderProductExtraDataClass ? this.orderProductExtraData.toJson() : this.orderProductExtraData,
    };
  }
}

// TypeScript interface for OrderProductExtraData (matches Dart OrderProductExtraData exactly)
export interface OrderProductExtraData {
  vendorDocId: string;
  vendorName: string;
  vendorEmail: string;
  vendorPhone: string;
  productDocId: string;
  productSku: string;
  productName: string;
  productDesc: string;
  variantDocId: string;
  variantImage: string;
  variantPurchasePrice?: number;
  originalPrice?: number;
  variantDescription: string;
  variantDetailTypes: Record<string, any>;
}

// TypeScript class implementation for OrderProductExtraData (matches Dart OrderProductExtraData exactly)
export class OrderProductExtraDataClass implements OrderProductExtraData {
  vendorDocId: string;
  vendorName: string;
  vendorEmail: string;
  vendorPhone: string;
  productDocId: string;
  productSku: string;
  productName: string;
  productDesc: string;
  variantDocId: string;
  variantImage: string;
  variantPurchasePrice?: number;
  originalPrice?: number;
  variantDescription: string;
  variantDetailTypes: Record<string, any>;

  constructor(data: Partial<OrderProductExtraData>) {
    this.vendorDocId = data.vendorDocId || '';
    this.vendorName = data.vendorName || '';
    this.vendorEmail = data.vendorEmail || '';
    this.vendorPhone = data.vendorPhone || '';
    this.productDocId = data.productDocId || '';
    this.productSku = data.productSku || '';
    this.productName = data.productName || '';
    this.productDesc = data.productDesc || '';
    this.variantDocId = data.variantDocId || '';
    this.variantImage = data.variantImage || '';
    this.variantPurchasePrice = data.variantPurchasePrice;
    this.originalPrice = data.originalPrice;
    this.variantDescription = data.variantDescription || '';
    this.variantDetailTypes = data.variantDetailTypes || {};
  }

  /// Convert JSON to OrderProductExtraData (matches Dart fromJson method)
  static fromJson(json: Record<string, any>): OrderProductExtraDataClass {
    return new OrderProductExtraDataClass({
      vendorDocId: json['vendorDocId'] || '',
      vendorName: json['vendorName'] || '',
      vendorEmail: json['vendorEmail'] || '',
      vendorPhone: json['vendorPhone'] || '',
      productDocId: json['productDocId'] || '',
      productSku: json['productSku'] || '',
      productName: json['productName'] || '',
      productDesc: json['productDesc'] || '',
      variantDocId: json['variantDocId'] || '',
      variantImage: json['variantImage'] || '',
      variantPurchasePrice: json['variantPurchasePrice'],
      originalPrice: json['originalPrice'],
      variantDescription: json['variantDescription'] || '',
      variantDetailTypes: json['variantDetailTypes'] || {},
    });
  }

  /// Convert OrderProductExtraData to JSON (matches Dart toJson method)
  toJson(): Record<string, any> {
    const json: Record<string, any> = {
      'vendorDocId': this.vendorDocId,
      'vendorName': this.vendorName,
      'vendorEmail': this.vendorEmail,
      'vendorPhone': this.vendorPhone,
      'productDocId': this.productDocId,
      'productSku': this.productSku,
      'productName': this.productName,
      'productDesc': this.productDesc,
      'variantDocId': this.variantDocId,
      'variantImage': this.variantImage,
      'variantDescription': this.variantDescription,
      'variantDetailTypes': this.variantDetailTypes,
      // Always include optional fields as null if undefined (Firebase format requirement)
      'variantPurchasePrice': this.variantPurchasePrice !== undefined && this.variantPurchasePrice !== null
        ? this.variantPurchasePrice
        : null,
      'originalPrice': this.originalPrice !== undefined && this.originalPrice !== null
        ? this.originalPrice
        : null,
    };

    return json;
  }
}

// TypeScript interface for TransactionModel (matches Dart TransactionModel exactly)
export interface TransactionModel {
  docId: string;
  amount: number;
  orderId: string;
  isDebit: boolean;
  paymentTime?: Date;
  note: string;
  uId: string;
  isPaid: boolean;
  paymentLink: string;
  transactionId?: string;
  method?: string;
  createdAt: Date;
  inquiryId: string;
  messageId: string;
  /** Identifies the category of the purchase: 'product' for ecommerce orders, 'package' for wedding packages */
  forCategory?: 'product' | 'package';
}

// TypeScript class implementation for TransactionModel (matches Dart TransactionModel exactly)
export class TransactionModelClass implements TransactionModel {
  docId: string;
  amount: number;
  orderId: string;
  isDebit: boolean;
  paymentTime?: Date;
  note: string;
  uId: string;
  isPaid: boolean;
  paymentLink: string;
  transactionId?: string;
  method?: string;
  createdAt: Date;
  inquiryId: string;
  messageId: string;
  forCategory?: 'product' | 'package';

  constructor(data: Partial<TransactionModel>) {
    this.docId = data.docId || '';
    this.amount = data.amount || 0;
    this.orderId = data.orderId || '';
    this.isDebit = data.isDebit || false;
    this.paymentTime = data.paymentTime;
    this.note = data.note || '';
    this.uId = data.uId || '';
    this.isPaid = data.isPaid || false;
    this.paymentLink = data.paymentLink || '';
    this.transactionId = data.transactionId;
    this.method = data.method;
    this.createdAt = data.createdAt || new Date();
    this.inquiryId = data.inquiryId || '';
    this.messageId = data.messageId || '';
    this.forCategory = data.forCategory;
  }

  /// From JSON (matches Dart fromJson method)
  static fromJson(json: Record<string, any>): TransactionModelClass {
    return new TransactionModelClass({
      docId: json['docId'],
      amount: json['amount'],
      orderId: json['orderId'],
      isDebit: json['isDebit'],
      paymentTime: json['paymentTime'] ? new Date(json['paymentTime']) : undefined, // Convert from epoch time
      note: json['note'],
      uId: json['uId'],
      isPaid: json['isPaid'],
      paymentLink: json['paymentLink'],
      transactionId: json['transactionId'],
      method: json['method'],
      createdAt: new Date(json['createdAt']), // Convert from epoch time
      inquiryId: json['inquiryId'],
      messageId: json['messageId'],
      forCategory: json['forCategory'] || undefined,
    });
  }

  /// To JSON (matches Dart toJson method)
  toJson(): Record<string, any> {
    return {
      'amount': this.amount,
      'orderId': this.orderId,
      'isDebit': this.isDebit,
      'paymentTime': this.paymentTime,
      'note': this.note,
      'uId': this.uId,
      'isPaid': this.isPaid,
      'paymentLink': this.paymentLink,
      'transactionId': this.transactionId,
      'method': this.method,
      'createdAt': this.createdAt.getTime(), // Convert to epoch time
      'inquiryId': this.inquiryId,
      'messageId': this.messageId,
      'forCategory': this.forCategory || null,
    };
  }

  /// From Firestore DocumentSnapshot (matches Dart fromDocSnap method)
  static fromDocSnap(snapshot: DocumentSnapshot): TransactionModelClass {
    const data = snapshot.data();
    if (!data) {
      throw new Error('Document data is null');
    }

    return new TransactionModelClass({
      docId: snapshot.id,
      amount: data['amount'],
      orderId: data['orderId'],
      isDebit: data['isDebit'],
      paymentTime: data['paymentTime'] ? new Date(data['paymentTime']) : undefined,
      note: data['note'],
      uId: data['uId'],
      isPaid: data['isPaid'],
      paymentLink: data['paymentLink'],
      transactionId: data['transactionId'],
      method: data['method'],
      createdAt: new Date(data['createdAt']),
      inquiryId: data['inquiryId'],
      messageId: data['messageId'],
      forCategory: data['forCategory'] || undefined,
    });
  }

  /// From Firestore QueryDocumentSnapshot (matches Dart fromSnap method)
  static fromSnap(snapshot: QueryDocumentSnapshot): TransactionModelClass {
    const data = snapshot.data();

    return new TransactionModelClass({
      docId: snapshot.id,
      amount: data['amount'],
      orderId: data['orderId'],
      isDebit: data['isDebit'],
      paymentTime: data['paymentTime'] ? new Date(data['paymentTime']) : undefined,
      note: data['note'],
      uId: data['uId'],
      isPaid: data['isPaid'],
      paymentLink: data['paymentLink'],
      transactionId: data['transactionId'],
      method: data['method'],
      createdAt: new Date(data['createdAt']),
      inquiryId: data['inquiryId'],
      messageId: data['messageId'],
      forCategory: data['forCategory'] || undefined,
    });
  }
}

// TypeScript interface for DeliveryDetailsModel (matches Dart DeliveryDetailsModel exactly)
export interface DeliveryDetailsModel {
  docId: string;
  deliveryPartner: string;
  trackingId: string;
  trackingLink: string;
  dispatchedOn?: Date;
  dispatchedProduct: DeliveryProductData[];
  teamMemberDocId: string;
  location: string;
  userAddress?: any; // AddressModel - would need to be imported
  orderId: string;
  inquiryId: string;
  messageId: string;
  uId: string;
  charges: number;
  createdAt: Date;
  deliveredOn?: Date;
  isDelivered: boolean;
}

// TypeScript class implementation for DeliveryDetailsModel (matches Dart DeliveryDetailsModel exactly)
export class DeliveryDetailsModelClass implements DeliveryDetailsModel {
  docId: string;
  deliveryPartner: string;
  trackingId: string;
  trackingLink: string;
  dispatchedOn?: Date;
  dispatchedProduct: DeliveryProductData[];
  teamMemberDocId: string;
  location: string;
  userAddress?: any;
  orderId: string;
  inquiryId: string;
  messageId: string;
  uId: string;
  charges: number;
  createdAt: Date;
  deliveredOn?: Date;
  isDelivered: boolean;

  constructor(data: Partial<DeliveryDetailsModel>) {
    this.docId = data.docId || '';
    this.deliveryPartner = data.deliveryPartner || '';
    this.trackingId = data.trackingId || '';
    this.trackingLink = data.trackingLink || '';
    this.dispatchedOn = data.dispatchedOn;
    this.dispatchedProduct = data.dispatchedProduct || [];
    this.teamMemberDocId = data.teamMemberDocId || '';
    this.location = data.location || '';
    this.userAddress = data.userAddress;
    this.orderId = data.orderId || '';
    this.inquiryId = data.inquiryId || '';
    this.messageId = data.messageId || '';
    this.uId = data.uId || '';
    this.charges = data.charges || 0;
    this.createdAt = data.createdAt || new Date();
    this.deliveredOn = data.deliveredOn;
    this.isDelivered = data.isDelivered || false;
  }

  /// From JSON (matches Dart fromJson method)
  static fromJson(json: Record<string, any>): DeliveryDetailsModelClass {
    return new DeliveryDetailsModelClass({
      docId: json['docId'] || '',
      deliveryPartner: json['deliveryPartner'] || '',
      trackingId: json['trackingId'] || '',
      trackingLink: json['trackingLink'] || '',
      dispatchedOn: json['dispatchedOn'] ? new Date(json['dispatchedOn']) : undefined,
      dispatchedProduct: (json['dispatchedProduct'] as any[] || [])
        .map((e) => DeliveryProductDataClass.fromJson(e)),
      teamMemberDocId: json['teamMemberDocId'] || '',
      location: json['location'] || '',
      userAddress: json.hasOwnProperty('userAddress') && json['userAddress'] != null
        ? json['userAddress'] // Would need proper AddressModel handling
        : undefined,
      orderId: json['orderId'] || '',
      inquiryId: json['inquiryId'] || '',
      messageId: json['messageId'] || '',
      uId: json['uId'] || '',
      charges: json['charges'],
      createdAt: new Date(json['createdAt']),
      deliveredOn: json['deliveredOn'] ? new Date(json['deliveredOn']) : undefined,
      isDelivered: json['isDelivered'],
    });
  }

  /// To JSON (matches Dart toJson method)
  toJson(): Record<string, any> {
    return {
      'deliveryPartner': this.deliveryPartner,
      'trackingId': this.trackingId,
      'trackingLink': this.trackingLink,
      'dispatchedOn': this.dispatchedOn?.getTime(),
      'dispatchedProduct': this.dispatchedProduct.map((e) => e instanceof DeliveryProductDataClass ? e.toJson() : e),
      'teamMemberDocId': this.teamMemberDocId,
      'location': this.location,
      'orderId': this.orderId,
      'inquiryId': this.inquiryId,
      'userAddress': this.userAddress, // Would need proper AddressModel handling
      'messageId': this.messageId,
      'uId': this.uId,
      'charges': this.charges,
      'createdAt': this.createdAt.getTime(), // Convert to epoch time
      'deliveredOn': this.deliveredOn,
      'isDelivered': this.isDelivered,
    };
  }

  /// From Firestore DocumentSnapshot (matches Dart fromDocSnap method)
  static fromDocSnap(snapshot: DocumentSnapshot): DeliveryDetailsModelClass {
    const data = snapshot.data();
    if (!data) {
      throw new Error('Document data is null');
    }

    return new DeliveryDetailsModelClass({
      docId: snapshot.id,
      deliveryPartner: data['deliveryPartner'] || '',
      trackingId: data['trackingId'] || '',
      trackingLink: data['trackingLink'] || '',
      dispatchedOn: data['dispatchedOn'] ? new Date(data['dispatchedOn']) : undefined,
      dispatchedProduct: (data['dispatchedProduct'] as any[] || [])
        .map((e) => DeliveryProductDataClass.fromJson(e)),
      teamMemberDocId: data['teamMemberDocId'] || '',
      location: data['location'] || '',
      userAddress: data.hasOwnProperty('userAddress') && data['userAddress'] != null
        ? data['userAddress'] // Would need proper AddressModel handling
        : undefined,
      orderId: data['orderId'] || '',
      inquiryId: data['inquiryId'] || '',
      messageId: data['messageId'] || '',
      uId: data['uId'] || '',
      charges: data['charges'],
      createdAt: new Date(data['createdAt']),
      isDelivered: data['isDelivered'],
      deliveredOn: data['deliveredOn'] ? new Date(data['deliveredOn']) : undefined,
    });
  }

  /// From Firestore QueryDocumentSnapshot (matches Dart fromSnap method)
  static fromSnap(snapshot: QueryDocumentSnapshot): DeliveryDetailsModelClass {
    const data = snapshot.data();

    return new DeliveryDetailsModelClass({
      docId: snapshot.id,
      deliveryPartner: data['deliveryPartner'] || '',
      trackingId: data['trackingId'] || '',
      trackingLink: data['trackingLink'] || '',
      dispatchedOn: data['dispatchedOn'] ? new Date(data['dispatchedOn']) : undefined,
      dispatchedProduct: (data['dispatchedProduct'] as any[] || [])
        .map((e) => DeliveryProductDataClass.fromJson(e)),
      teamMemberDocId: data['teamMemberDocId'] || '',
      location: data['location'] || '',
      userAddress: data.hasOwnProperty('userAddress') && data['userAddress'] != null
        ? data['userAddress'] // Would need proper AddressModel handling
        : undefined,
      orderId: data['orderId'] || '',
      inquiryId: data['inquiryId'] || '',
      messageId: data['messageId'] || '',
      uId: data['uId'] || '',
      charges: data['charges'],
      createdAt: new Date(data['createdAt']),
      isDelivered: data['isDelivered'],
      deliveredOn: data['deliveredOn'] ? new Date(data['deliveredOn']) : undefined,
    });
  }
}

// TypeScript interface for DeliveryProductData (matches Dart DeliveryProductData exactly)
export interface DeliveryProductData {
  id: string;
  productId: string;
  variantId: string;
  qty: number;
  currentStatus?: string;
  purchasePrice: number;
  sellingPrice: number;
  userNote: string;
  adminNote: string;
  productSKu: string;
  deliveryDate?: Date;
}

// TypeScript class implementation for DeliveryProductData (matches Dart DeliveryProductData exactly)
export class DeliveryProductDataClass implements DeliveryProductData {
  id: string;
  productId: string;
  variantId: string;
  qty: number;
  currentStatus?: string;
  purchasePrice: number;
  sellingPrice: number;
  userNote: string;
  adminNote: string;
  productSKu: string;
  deliveryDate?: Date;

  constructor(data: Partial<DeliveryProductData>) {
    this.id = data.id || '';
    this.productId = data.productId || '';
    this.variantId = data.variantId || '';
    this.qty = data.qty || 0;
    this.currentStatus = data.currentStatus;
    this.purchasePrice = data.purchasePrice || 0;
    this.sellingPrice = data.sellingPrice || 0;
    this.userNote = data.userNote || '';
    this.adminNote = data.adminNote || '';
    this.productSKu = data.productSKu || '';
    this.deliveryDate = data.deliveryDate;
  }

  /// Convert JSON to DeliveryProductData (matches Dart fromJson method)
  static fromJson(json: Record<string, any>): DeliveryProductDataClass {
    return new DeliveryProductDataClass({
      id: json['id'] || '',
      productId: json['productId'] || '',
      variantId: json['variantId'] || '',
      qty: json['qty'] || 0,
      currentStatus: json['currentStatus'],
      purchasePrice: json['purchasePrice'],
      sellingPrice: json['sellingPrice'],
      userNote: json['userNote'],
      adminNote: json['adminNote'],
      productSKu: json['productSKu'],
      deliveryDate: json['deliveryDate'] ? new Date(json['deliveryDate']) : undefined,
    });
  }

  /// Convert DeliveryProductData to JSON (matches Dart toJson method)
  toJson(): Record<string, any> {
    return {
      'id': this.id,
      'productId': this.productId,
      'variantId': this.variantId,
      'qty': this.qty,
      'currentStatus': this.currentStatus,
      'purchasePrice': this.purchasePrice,
      'sellingPrice': this.sellingPrice,
      'userNote': this.userNote,
      'adminNote': this.adminNote,
      'productSKu': this.productSKu,
      'deliveryDate': this.deliveryDate?.getTime(),
    };
  }

  /// Convert to partial delivered JSON (matches Dart toPartialDeliveredJson method)
  toPartialDeliveredJson(currentStatus: string, deliveredQty: number): Record<string, any> {
    return {
      'id': this.id,
      'productId': this.productId,
      'variantId': this.variantId,
      'qty': deliveredQty,
      'currentStatus': currentStatus,
      'purchasePrice': this.purchasePrice,
      'sellingPrice': this.sellingPrice,
      'userNote': this.userNote,
      'adminNote': this.adminNote,
      'productSKu': this.productSKu,
      'deliveryDate': this.deliveryDate?.getTime(),
    };
  }
}

// TypeScript interface for ChargeModel (matches Dart ChargeModel exactly)
export interface ChargeModel {
  chargeName: string;
  price: string;
}

// TypeScript class implementation for ChargeModel (matches Dart ChargeModel exactly)
export class ChargeModelClass implements ChargeModel {
  chargeName: string;
  price: string;

  constructor(data: Partial<ChargeModel>) {
    this.chargeName = data.chargeName || '';
    this.price = data.price || '';
  }

  /// Convert JSON to ChargeModel (matches Dart fromJson method)
  static fromJson(chargeName: string, price: string): ChargeModelClass {
    return new ChargeModelClass({
      chargeName: chargeName,
      price: price,
    });
  }

  /// Convert ChargeModel to JSON (matches Dart toJson method)
  toJson(): Record<string, any> {
    return {
      [this.chargeName]: this.price,
    };
  }
}

// Package Order Models (keeping existing ones for backward compatibility)
export interface PackageOrderModel {
  docId: string;
  packageModel: PackageModel;
  extraServices: AddnData[];
  packageAmount: number;
  extraServicesAmount: number;
  uid: string;
  selectedAddressId: string;
  username: string;
  createdAt: Date;
  isPaid: boolean;
  paidon?: Date;
  totalAmount: number;
  paidAmount: number;
}

export interface AddnData {
  serviceId: string;
  serviceName: string;
  qty: number;
  additionalPrice: number;
}

export interface PackageModel {
  docId: string;
  packageName: string;
  packageDescription: string;
  packagePrice: number;
  packageImage: string;
  packageServices: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Order Status Constants
export class OrderStatus {
  static readonly ORDER_COMPLETED = 'Order Delivered';
  static readonly CANCELLED = 'Order Cancelled';
  static readonly PROCESSING = 'Processing';
  static readonly USER_CONFIRMATION = 'Waiting for User Action';
  static readonly PAYMENT_PENDING = 'paymentPending';
  // Legacy statuses for backward compatibility
  static readonly PENDING = 'Pending';
  static readonly CONFIRMED = 'Confirmed';
  static readonly SHIPPED = 'Shipped';
  static readonly DELIVERED = 'Delivered';
  static readonly REJECTED = 'Rejected';
}

export class OrderProductStatus {
  static readonly PENDING = 'pending';
  static readonly CONFIRMED = 'confirmed';
  static readonly PROCESSING = 'processing';
  static readonly OUT_FOR_DELIVERY = 'outfordeliver';
  static readonly DELIVERED = 'delivered';
  static readonly CANCELLED = 'cancelled';
}