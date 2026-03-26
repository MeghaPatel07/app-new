import { Timestamp, DocumentSnapshot, QueryDocumentSnapshot } from 'firebase/firestore';

// TypeScript interface for AddnData (matches Dart AddnData exactly)
export interface AddnData {
  serviceId: string;
  serviceName: string;
  qty: number;
  additionalPrice: number;
}

// TypeScript class implementation for AddnData (matches Dart AddnData exactly)
export class AddnDataClass implements AddnData {
  serviceId: string;
  serviceName: string;
  qty: number;
  additionalPrice: number;

  constructor(data: Partial<AddnData>) {
    this.serviceId = data.serviceId || '';
    this.serviceName = data.serviceName || '';
    this.qty = data.qty || 0;
    this.additionalPrice = data.additionalPrice || 0;
  }

  /// Create an AddnData instance from JSON (matches Dart fromJson method)
  static fromJson(json: Record<string, any>): AddnDataClass {
    return new AddnDataClass({
      serviceId: json['serviceId'] ?? '',
      serviceName: json['serviceName'] ?? '',
      qty: json['qty'] ?? 0,
      additionalPrice: json['additionalPrice'] ?? 0,
    });
  }

  /// Convert an AddnData instance to JSON (matches Dart toJson method)
  toJson(): Record<string, any> {
    return {
      'serviceId': this.serviceId,
      'serviceName': this.serviceName,
      'qty': this.qty,
      'additionalPrice': this.additionalPrice,
    };
  }
}

// TypeScript interface for PointsModel — matches Dart schema exactly
export interface PointsModel {
  serviceId: string;
  serviceName: string;
  serviceUnit: string;
  serviceQty: number;
}

// TypeScript class implementation for PointsModel
export class PointsModelClass implements PointsModel {
  serviceId: string;
  serviceName: string;
  serviceUnit: string;
  serviceQty: number;

  constructor(data: Partial<PointsModel> & Record<string, any>) {
    // Support Dart naming (serviceId/serviceName/serviceQty) with fallback to old TS naming (pointId/pointName/pointValue)
    this.serviceId   = data.serviceId   ?? data.pointId   ?? '';
    this.serviceName = data.serviceName ?? data.pointName ?? '';
    this.serviceUnit = data.serviceUnit ?? '';
    this.serviceQty  = Number(data.serviceQty ?? data.pointValue ?? 0);
  }

  static fromJson(json: Record<string, any>): PointsModelClass {
    return new PointsModelClass({
      serviceId:   json['serviceId']   ?? json['pointId']   ?? '',
      serviceName: json['serviceName'] ?? json['pointName'] ?? '',
      serviceUnit: json['serviceUnit'] ?? '',
      serviceQty:  Number(json['serviceQty'] ?? json['pointValue'] ?? 0),
    });
  }

  toJson(): Record<string, any> {
    return {
      serviceId:   this.serviceId,
      serviceName: this.serviceName,
      serviceUnit: this.serviceUnit,
      serviceQty:  this.serviceQty,
    };
  }
}

// TypeScript interface for PackagePurchaseModel (matches Dart PackagePurchaseModel exactly)
export interface PackagePurchaseModel {
  docId: string;
  packageName: string;
  packagePrice: number;
  description: string;
  validity: number;
  packageColor: string;
  points: PointsModel[];
  extraServices: AddnData[];
  extraServicesAmount: number;
  discountedPrice: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  purchaseAt: Date;
  uid: string;
  userName: string;
  shareCode: string;
  userEmail: string;
  userPhone: string;
  sharedBy: string[];
  isPaid: boolean;
  totalAmount: number;
  paidAmount: number;
  remainingPoints: PointsModel[];
  // Payment & transaction linkage fields
  orderId?: string;                  // PayU txnid (e.g. PKG-1234-abcde)
  transactionId?: string;            // Firestore docId of the matching transactions doc
  totalConsultationHours?: number;   // Snapshot of total consultation hours at purchase time
  usedConsultationHours?: number;    // Running total of hours consumed via bookings
  quantity?: number;                 // Units purchased (>1 only for non-primary add-on packages)
  consultantId?: string;             // Auto-assigned consultant from teamMember collection
  stylerId?: string;                 // Auto-assigned styler from teamMember collection
  sessionId?: string;                // Auto-created session linked to this package order
  isPrimary?: boolean;               // Whether this is a primary package (base package)
  packageId?: string;                // Reference to the original package docId
}

// TypeScript class implementation for PackagePurchaseModel (matches Dart PackagePurchaseModel exactly)
export class PackagePurchaseModelClass implements PackagePurchaseModel {
  docId: string;
  packageName: string;
  packagePrice: number;
  description: string;
  validity: number;
  packageColor: string;
  points: PointsModel[];
  extraServices: AddnData[];
  extraServicesAmount: number;
  discountedPrice: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  purchaseAt: Date;
  uid: string;
  userName: string;
  shareCode: string;
  userEmail: string;
  userPhone: string;
  sharedBy: string[];
  isPaid: boolean;
  totalAmount: number;
  paidAmount: number;
  remainingPoints: PointsModel[];
  orderId?: string;
  transactionId?: string;
  totalConsultationHours?: number;
  usedConsultationHours?: number;
  consultantId?: string;
  stylerId?: string;
  sessionId?: string;
  isPrimary?: boolean;
  packageId?: string;

  constructor(data: Partial<PackagePurchaseModel>) {
    this.docId = data.docId || '';
    this.packageName = data.packageName || '';
    this.packagePrice = data.packagePrice || 0;
    this.description = data.description || '';
    this.validity = data.validity || 0;
    this.packageColor = data.packageColor || '';
    this.points = data.points || [];
    this.extraServices = data.extraServices || [];
    this.extraServicesAmount = data.extraServicesAmount || 0;
    this.discountedPrice = data.discountedPrice || 0;
    this.isActive = data.isActive || false;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.purchaseAt = data.purchaseAt || new Date();
    this.uid = data.uid || '';
    this.userName = data.userName || '';
    this.shareCode = data.shareCode || '123456';
    this.userEmail = data.userEmail || '';
    this.userPhone = data.userPhone || '';
    this.sharedBy = data.sharedBy || [];
    this.isPaid = data.isPaid || false;
    this.totalAmount = data.totalAmount || 0;
    this.paidAmount = data.paidAmount || 0;
    this.remainingPoints = data.remainingPoints || [];
    this.orderId = data.orderId;
    this.transactionId = data.transactionId;
    this.totalConsultationHours = data.totalConsultationHours;
    this.usedConsultationHours = data.usedConsultationHours;
    this.consultantId = data.consultantId;
    this.stylerId = data.stylerId;
    this.sessionId = data.sessionId;
    this.isPrimary = data.isPrimary ?? false;
    this.packageId = data.packageId || '';
  }

  /// Convert a PackagePurchaseModel instance to JSON (matches Dart toJson method exactly)
  toJson(): Record<string, any> {
    // Store in flat structure matching Dart schema exactly
    return {
      'packageName': this.packageName,
      'packagePrice': this.packagePrice,
      'description': this.description,
      'discountedPrice': this.discountedPrice,
      'updatedAt': this.updatedAt.getTime(), // Convert to epoch time
      'validity': this.validity,
      'packageColor': this.packageColor,
      'points': this.points.map((e) => e instanceof PointsModelClass ? e.toJson() : e),
      'isActive': this.isActive,
      'createdAt': this.createdAt.getTime(), // Convert to epoch time
      'purchaseAt': this.purchaseAt.getTime(), // Convert to epoch time
      'uid': this.uid,
      'userName': this.userName,
      'userEmail': this.userEmail,
      'userPhone': this.userPhone,
      'remainingPoints': this.remainingPoints.map((e) => e instanceof PointsModelClass ? e.toJson() : e),
      'extraServices': this.extraServices.map((e) => e instanceof AddnDataClass ? e.toJson() : e),
      'extraServicesAmount': this.extraServicesAmount,
      'isPaid': this.isPaid,
      'totalAmount': this.totalAmount,
      'paidAmount': this.paidAmount,
      'sharedBy': this.sharedBy,
      'shareCode': this.shareCode,
      ...(this.orderId !== undefined && { 'orderId': this.orderId }),
      ...(this.transactionId !== undefined && { 'transactionId': this.transactionId }),
      ...(this.totalConsultationHours !== undefined && { 'totalConsultationHours': this.totalConsultationHours }),
      ...(this.usedConsultationHours !== undefined && { 'usedConsultationHours': this.usedConsultationHours }),
      ...(this.consultantId !== undefined && { 'consultantId': this.consultantId }),
      ...(this.stylerId !== undefined && { 'stylerId': this.stylerId }),
      ...(this.sessionId !== undefined && { 'sessionId': this.sessionId }),
      'isPrimary': this.isPrimary ?? false,
      'packageId': this.packageId || '',
    };
  }

  /// Create a PackagePurchaseModel instance from JSON (matches Dart fromJson method exactly)
  static fromJson(json: Record<string, any>): PackagePurchaseModelClass {
    return new PackagePurchaseModelClass({
      docId: json['docId'],
      packageName: json['packageName'],
      packagePrice: json['packagePrice'],
      description: json['description'],
      discountedPrice: json['discountedPrice'],
      validity: json['validity'],
      updatedAt: new Date(json['updatedAt']), // Convert from epoch time
      packageColor: json['packageColor'],
      points: (json['points'] as any[] || []).map((e) => PointsModelClass.fromJson(e)),
      shareCode: json['shareCode'] ?? '123456',
      isActive: json['isActive'],
      createdAt: new Date(json['createdAt']), // Convert from epoch time
      purchaseAt: new Date(json['purchaseAt']), // Convert from epoch time
      uid: json['uid'],
      userName: json['userName'],
      userEmail: json['userEmail'],
      userPhone: json['userPhone'],
      remainingPoints: (json['remainingPoints'] as any[] || []).map((e) => PointsModelClass.fromJson(e)),
      extraServices: (json['extraServices'] as any[] || []).map((e) => AddnDataClass.fromJson(e)),
      extraServicesAmount: json['extraServicesAmount'] ?? 0,
      isPaid: json['isPaid'] ?? false,
      totalAmount: json['totalAmount'] ?? 0,
      paidAmount: json['paidAmount'] ?? 0,
      sharedBy: Array.isArray(json['sharedBy']) ? json['sharedBy'] : [],
      orderId: json['orderId'],
      transactionId: json['transactionId'],
      totalConsultationHours: json['totalConsultationHours'] !== undefined ? Number(json['totalConsultationHours']) : undefined,
      usedConsultationHours: json['usedConsultationHours'] !== undefined ? Number(json['usedConsultationHours']) : undefined,
      consultantId: json['consultantId'],
      stylerId: json['stylerId'],
      sessionId: json['sessionId'],
      isPrimary: json['isPrimary'] || 
                (json['points'] || []).some((p: any) => 
                  String(p.serviceName || p.pointName || '').toLowerCase().includes('chat')
                ) || false,
      packageId: json['packageId'] || '',
    });
  }

  /// Create a PackagePurchaseModel instance from Firestore QueryDocumentSnapshot (matches Dart fromSnap method exactly)
  static fromSnap(snapshot: QueryDocumentSnapshot): PackagePurchaseModelClass {
    const data = snapshot.data();
    
    // Handle transition from old nested structure to new flat structure
    const packageModel = data['packageModel'] || {};
    
    return new PackagePurchaseModelClass({
      docId: snapshot.id,
      // Use flat structure (new Dart schema) with fallback to nested structure (old data)
      packageName: data['packageName'] || packageModel['packageName'] || '',
      packagePrice: data['packagePrice'] || packageModel['packagePrice'] || 0,
      description: data['description'] || packageModel['packageDescription'] || '',
      discountedPrice: data['discountedPrice'] || 0,
      updatedAt: new Date(data['updatedAt'] || packageModel['updatedAt'] || Date.now()),
      validity: data['validity'] || 0,
      packageColor: data['packageColor'] || '',
      points: (data['points'] as any[] || []).map((e) => PointsModelClass.fromJson(e)),
      isActive: data['isActive'] || packageModel['isActive'] || false,
      createdAt: new Date(data['createdAt'] || packageModel['createdAt'] || Date.now()),
      purchaseAt: new Date(data['purchaseAt'] || Date.now()),
      uid: data['uid'] || '',
      userName: data['userName'] || data['username'] || '', // Handle both userName and username
      userEmail: data['userEmail'] || '',
      userPhone: data['userPhone'] || '',
      shareCode: data['shareCode'] ?? '123456',
      remainingPoints: (data['remainingPoints'] as any[] || []).map((e) => PointsModelClass.fromJson(e)),
      extraServices: (data['extraServices'] as any[] || []).map((e) => AddnDataClass.fromJson(e)),
      extraServicesAmount: data['extraServicesAmount'] ?? 0,
      isPaid: data['isPaid'] === true || 
              (Number(data['paidAmount'] || 0) >= Number(data['totalAmount'] || data['packageAmount'] || 0) && Number(data['totalAmount'] || data['packageAmount'] || 0) > 0),
      totalAmount: data['totalAmount'] || data['packageAmount'] || 0, // Handle both totalAmount and packageAmount
      paidAmount: data['paidAmount'] ?? 0,
      sharedBy: Array.isArray(data['sharedBy']) ? data['sharedBy'] : [],
      orderId: data['orderId'],
      transactionId: data['transactionId'],
      totalConsultationHours: data['totalConsultationHours'] !== undefined ? Number(data['totalConsultationHours']) : undefined,
      usedConsultationHours: data['usedConsultationHours'] !== undefined ? Number(data['usedConsultationHours']) : undefined,
      consultantId: data['consultantId'],
      stylerId: data['stylerId'],
      sessionId: data['sessionId'],
      isPrimary: data['isPrimary'] || packageModel['isPrimary'] || 
                (data['points'] || packageModel['points'] || []).some((p: any) => 
                  String(p.serviceName || p.pointName || '').toLowerCase().includes('chat')
                ) || false,
      packageId: data['packageId'] || packageModel['docId'] || '',
    });
  }

  /// Create a PackagePurchaseModel instance from Firestore DocumentSnapshot (matches Dart fromDocSnap method exactly)
  static fromDocSnap(snapshot: DocumentSnapshot): PackagePurchaseModelClass {
    const data = snapshot.data();
    if (!data) {
      throw new Error('Document data is null');
    }
    
    // Handle transition from old nested structure to new flat structure
    const packageModel = data['packageModel'] || {};
    
    return new PackagePurchaseModelClass({
      docId: snapshot.id,
      // Use flat structure (new Dart schema) with fallback to nested structure (old data)
      packageName: data['packageName'] || packageModel['packageName'] || '',
      packagePrice: data['packagePrice'] || packageModel['packagePrice'] || 0,
      description: data['description'] || packageModel['packageDescription'] || '',
      discountedPrice: data['discountedPrice'] || 0,
      updatedAt: new Date(data['updatedAt'] || packageModel['updatedAt'] || Date.now()),
      validity: data['validity'] || 0,
      packageColor: data['packageColor'] || '',
      points: (data['points'] as any[] || []).map((e) => PointsModelClass.fromJson(e)),
      isActive: data['isActive'] || packageModel['isActive'] || false,
      createdAt: new Date(data['createdAt'] || packageModel['createdAt'] || Date.now()),
      purchaseAt: new Date(data['purchaseAt'] || Date.now()),
      uid: data['uid'] || '',
      userName: data['userName'] || data['username'] || '', // Handle both userName and username
      userEmail: data['userEmail'] || '',
      userPhone: data['userPhone'] || '',
      remainingPoints: (data['remainingPoints'] as any[] || []).map((e) => PointsModelClass.fromJson(e)),
      shareCode: data['shareCode'] ?? '123456',
      extraServices: (data['extraServices'] as any[] || []).map((e) => AddnDataClass.fromJson(e)),
      extraServicesAmount: data['extraServicesAmount'] ?? 0,
      isPaid: data['isPaid'] === true || 
              (Number(data['paidAmount'] || 0) >= Number(data['totalAmount'] || data['packageAmount'] || 0) && Number(data['totalAmount'] || data['packageAmount'] || 0) > 0),
      totalAmount: data['totalAmount'] || data['packageAmount'] || 0, // Handle both totalAmount and packageAmount
      paidAmount: data['paidAmount'] ?? 0,
      sharedBy: Array.isArray(data['sharedBy']) ? data['sharedBy'] : [],
      orderId: data['orderId'],
      transactionId: data['transactionId'],
      totalConsultationHours: data['totalConsultationHours'] !== undefined ? Number(data['totalConsultationHours']) : undefined,
      usedConsultationHours: data['usedConsultationHours'] !== undefined ? Number(data['usedConsultationHours']) : undefined,
      consultantId: data['consultantId'],
      stylerId: data['stylerId'],
      sessionId: data['sessionId'],
      isPrimary: data['isPrimary'] || packageModel['isPrimary'] || 
                (data['points'] || packageModel['points'] || []).some((p: any) => 
                  String(p.serviceName || p.pointName || '').toLowerCase().includes('chat')
                ) || false,
      packageId: data['packageId'] || packageModel['docId'] || '',
    });
  }

  /// Create a PackagePurchaseModel instance for next snap (matches Dart forNextSnap method exactly)
  static forNextSnap(docSnap: DocumentSnapshot): PackagePurchaseModelClass {
    const data = docSnap.data() as Record<string, any>;
    if (!data) {
      throw new Error('Document data is null');
    }
    
    // Handle transition from old nested structure to new flat structure
    const packageModel = data['packageModel'] || {};
    
    return new PackagePurchaseModelClass({
      docId: docSnap.id,
      // Use flat structure (new Dart schema) with fallback to nested structure (old data)
      packageName: data['packageName'] || packageModel['packageName'] || '',
      packagePrice: data['packagePrice'] || packageModel['packagePrice'] || 0,
      description: data['description'] || packageModel['packageDescription'] || '',
      discountedPrice: data['discountedPrice'] || 0,
      shareCode: data['shareCode'] ?? '123456',
      updatedAt: new Date(data['updatedAt'] || packageModel['updatedAt'] || Date.now()),
      validity: data['validity'] || 0,
      packageColor: data['packageColor'] || '',
      points: (data['points'] as any[] || []).map((e) => PointsModelClass.fromJson(e)),
      isActive: data['isActive'] || packageModel['isActive'] || false,
      createdAt: new Date(data['createdAt'] || packageModel['createdAt'] || Date.now()),
      purchaseAt: new Date(data['purchaseAt'] || Date.now()),
      uid: data['uid'] || '',
      userName: data['userName'] || data['username'] || '', // Handle both userName and username
      userEmail: data['userEmail'] || '',
      userPhone: data['userPhone'] || '',
      remainingPoints: (data['remainingPoints'] as any[] || []).map((e) => PointsModelClass.fromJson(e)),
      extraServices: (data['extraServices'] as any[] || []).map((e) => AddnDataClass.fromJson(e)),
      extraServicesAmount: data['extraServicesAmount'] ?? 0,
      isPaid: data['isPaid'] === true || 
              (Number(data['paidAmount'] || 0) >= Number(data['totalAmount'] || data['packageAmount'] || 0) && Number(data['totalAmount'] || data['packageAmount'] || 0) > 0),
      totalAmount: data['totalAmount'] || data['packageAmount'] || 0, // Handle both totalAmount and packageAmount
      paidAmount: data['paidAmount'] ?? 0,
      sharedBy: Array.isArray(data['sharedBy']) ? data['sharedBy'] : [],
      orderId: data['orderId'],
      transactionId: data['transactionId'],
      totalConsultationHours: data['totalConsultationHours'] !== undefined ? Number(data['totalConsultationHours']) : undefined,
      usedConsultationHours: data['usedConsultationHours'] !== undefined ? Number(data['usedConsultationHours']) : undefined,
      consultantId: data['consultantId'],
      stylerId: data['stylerId'],
      sessionId: data['sessionId'],
      isPrimary: data['isPrimary'] || packageModel['isPrimary'] || 
                (data['points'] || packageModel['points'] || []).some((p: any) => 
                  String(p.serviceName || p.pointName || '').toLowerCase().includes('chat')
                ) || false,
      packageId: data['packageId'] || packageModel['docId'] || '',
    });
  }
}
