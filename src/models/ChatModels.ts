// TypeScript interface for SessionModel (matches Dart SessionModel exactly)
export interface SessionModel {
  docId: string;
  uId: string;
  createdAt: Date;
  updatedAt?: Date; // Epoch timestamp when session is updated
  variantIds: string[];
  finalVariantIds: ToOrderVariantData[];
  finalVariantIds2?: Record<string, any>; // Map stored in Firebase
  inquiryId: string;
  consultantId: string;
  stylerId: string;
  endedOn?: Date;
  userName: string;
  isActive: boolean;
  lastMessage?: Record<string, any>;
  budget?: number;
  packageOrderDocId?: string;
}

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read';

export interface MessagesModel {
  docId: string;
  type: string; // MESSAGE TYPE
  sessionId: string;
  loadingText?: string; // TO SHOW DATA WHILE LOADING
  data: Record<string, any>;
  senderId: string;
  sendAt: Date;
  status?: MessageStatus;
}

export interface ToOrderVariantData {
  variantId: string;
  qty: number;
  deliveryDate?: Date;
  customNote: string;
  id: string;
}

export class MessageTypes {
  static readonly TEXT = 'text';
  static readonly ORDER_ACC_REJ = 'orderAccRej';
  static readonly BOOKING = 'booking';
  static readonly PACKAGE = 'package';
  static readonly IMAGES = 'images';
  static readonly FILE = 'file';
  static readonly DOCUMENT = 'document';
  static readonly SET = 'set';
  static readonly INFO = 'info';
  static readonly DELIVERY_DETAILS = 'deliveryDetails';
  static readonly PAYMENT = 'payment';
  static readonly GET_PRICE = 'getPrice';
  static readonly MULTI_PROD = 'multiprod';
}

// TypeScript class implementation with methods (matches Dart SessionModel exactly)
export class SessionModelClass implements SessionModel {
  docId: string;
  uId: string;
  createdAt: Date;
  updatedAt?: Date; // Epoch timestamp when session is updated
  variantIds: string[];
  finalVariantIds: ToOrderVariantData[];
  finalVariantIds2?: Record<string, any>; // Map stored in Firebase
  inquiryId: string;
  consultantId: string;
  stylerId: string;
  endedOn?: Date;
  userName: string;
  isActive: boolean;
  lastMessage?: Record<string, any>;
  budget?: number;
  packageOrderDocId?: string;

  constructor(data: SessionModel) {
    this.docId = data.docId;
    this.uId = data.uId;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.variantIds = data.variantIds;
    this.finalVariantIds = data.finalVariantIds;
    this.finalVariantIds2 = data.finalVariantIds2;
    this.inquiryId = data.inquiryId;
    this.consultantId = data.consultantId;
    this.stylerId = data.stylerId;
    this.endedOn = data.endedOn;
    this.userName = data.userName;
    this.isActive = data.isActive;
    this.lastMessage = data.lastMessage;
    this.budget = data.budget;
    this.packageOrderDocId = data.packageOrderDocId;
  }

  /// Convert SessionModel to JSON (matches Dart toJson method exactly)
  toJson(): Record<string, any> {
    const json: Record<string, any> = {
      'uId': this.uId,
      'createdAt': this.createdAt.getTime(), // Convert to epoch time
      'variantIds': this.variantIds,
      'inquiryId': this.inquiryId,
      'consultantId': this.consultantId,
      'stylerId': this.stylerId,
      'isActive': this.isActive,
      'userName': this.userName,
    };

    // Conditionally include optional fields
    if (this.endedOn !== undefined && this.endedOn !== null) json['endedOn'] = this.endedOn.getTime(); // Convert to epoch time
    if (this.updatedAt !== undefined && this.updatedAt !== null) json['updatedAt'] = this.updatedAt.getTime(); // Convert to epoch time
    if (this.lastMessage !== undefined && this.lastMessage !== null) json['lastMessage'] = this.lastMessage;
    if (this.budget !== undefined) json['budget'] = this.budget;
    if (this.packageOrderDocId) json['packageOrderDocId'] = this.packageOrderDocId;

    // Handle finalVariantIds2 - store as Map in Firebase (matches Dart schema)
    if (this.finalVariantIds2) {
      // Use the raw Map from Firebase if available
      console.log('🔍 Using existing finalVariantIds2:', this.finalVariantIds2);
      json['finalVariantIds2'] = this.finalVariantIds2;
    } else if (this.finalVariantIds && this.finalVariantIds.length > 0) {
      // Convert finalVariantIds to Map format for Firebase
      const finalVariantIdsMap: Record<string, any> = {};
      this.finalVariantIds.forEach(variant => {
        if (variant instanceof ToOrderVariantDataClass) {
          finalVariantIdsMap[variant.id] = variant.toJson2();
        } else {
          // Handle interface case
          const variantClass = new ToOrderVariantDataClass(variant);
          finalVariantIdsMap[variant.id] = variantClass.toJson2();
        }
      });
      console.log('🔍 Converting finalVariantIds to Map:', finalVariantIdsMap);
      json['finalVariantIds2'] = finalVariantIdsMap;
    } else {
      // Always include finalVariantIds2 field, even if empty (matches Dart schema)
      console.log('🔍 Setting empty finalVariantIds2 Map');
      json['finalVariantIds2'] = {};
    }

    return json;
  }

  /// Create SessionModel from JSON (matches Dart fromJson method exactly)
  static fromJson(json: Record<string, any>, docId: string): SessionModelClass {
    // Handle lastMessage with proper timestamp conversion and null safety
    let lastMessage = undefined;
    if (json['lastMessage'] && typeof json['lastMessage'] === 'object' && json['lastMessage'] !== null) {
      lastMessage = { ...json['lastMessage'] };
      // Convert sendAt from timestamp to epoch time if it's a timestamp
      if (lastMessage.sendAt && typeof lastMessage.sendAt.toDate === 'function') {
        lastMessage.sendAt = lastMessage.sendAt.toDate().getTime();
      } else if (lastMessage.sendAt && typeof lastMessage.sendAt === 'number') {
        // Already epoch time, keep as is
        lastMessage.sendAt = lastMessage.sendAt;
      }
    }
    
    // Handle finalVariantIds2 with enhanced null safety
    let finalVariantIds: ToOrderVariantData[] = [];
    if (json['finalVariantIds2'] && 
        typeof json['finalVariantIds2'] === 'object' && 
        json['finalVariantIds2'] !== null &&
        !Array.isArray(json['finalVariantIds2'])) {
      try {
        finalVariantIds = Object.entries(json['finalVariantIds2']).map(([key, value]) => {
          if (value && typeof value === 'object') {
            return ToOrderVariantDataClass.fromJson(key, value as Record<string, any>);
          }
          return null;
        }).filter(item => item !== null) as ToOrderVariantData[];
      } catch (error) {
        console.warn('Error parsing finalVariantIds2:', error);
        finalVariantIds = [];
      }
    }
    
    return new SessionModelClass({
      docId: docId,
      uId: json['uId'] || '',
      userName: json['userName'] || '',
      createdAt: json['createdAt'] ? new Date(json['createdAt']) : new Date(), // Convert from epoch time with fallback
      variantIds: Array.isArray(json['variantIds']) ? json['variantIds'] : [],
      finalVariantIds: finalVariantIds,
      finalVariantIds2: json['finalVariantIds2'] || undefined, // Store the raw Map from Firebase
      inquiryId: json['inquiryId'] || '',
      consultantId: json['consultantId'] || '',
      stylerId: json['stylerId'] || '',
      endedOn: json['endedOn'] ? new Date(json['endedOn']) : undefined, // Convert from epoch time
      updatedAt: json['updatedAt'] ? new Date(json['updatedAt']) : undefined, // Convert from epoch time
      isActive: Boolean(json['isActive']),
      lastMessage: lastMessage,
      budget: typeof json['budget'] === 'number' ? json['budget'] : undefined,
      packageOrderDocId: json['packageOrderDocId'],
    });
  }

  /// Create SessionModel from Firestore DocumentSnapshot (matches Dart fromSnap method exactly)
  static fromSnap(snapshot: any): SessionModelClass {
    const data = snapshot.data();
    
    // Handle lastMessage with proper timestamp conversion and null safety
    let lastMessage = undefined;
    if (data['lastMessage'] && typeof data['lastMessage'] === 'object' && data['lastMessage'] !== null) {
      lastMessage = { ...data['lastMessage'] };
      // Convert sendAt from timestamp to epoch time if it's a timestamp
      if (lastMessage.sendAt && typeof lastMessage.sendAt.toDate === 'function') {
        lastMessage.sendAt = lastMessage.sendAt.toDate().getTime();
      } else if (lastMessage.sendAt && typeof lastMessage.sendAt === 'number') {
        // Already epoch time, keep as is
        lastMessage.sendAt = lastMessage.sendAt;
      }
    }
    
    // Handle finalVariantIds2 with enhanced null safety
    let finalVariantIds: ToOrderVariantData[] = [];
    if (data['finalVariantIds2'] && 
        typeof data['finalVariantIds2'] === 'object' && 
        data['finalVariantIds2'] !== null &&
        !Array.isArray(data['finalVariantIds2'])) {
      try {
        finalVariantIds = Object.entries(data['finalVariantIds2']).map(([key, value]) => {
          if (value && typeof value === 'object') {
            return ToOrderVariantDataClass.fromJson(key, value as Record<string, any>);
          }
          return null;
        }).filter(item => item !== null) as ToOrderVariantData[];
      } catch (error) {
        console.warn('Error parsing finalVariantIds2:', error);
        finalVariantIds = [];
      }
    }
    
    return new SessionModelClass({
      docId: snapshot.id,
      uId: data['uId'] || '',
      userName: data['userName'] || '',
      createdAt: data['createdAt']?.toDate ? data['createdAt'].toDate() : new Date(data['createdAt']), // Handle both Timestamp and epoch
      variantIds: Array.isArray(data['variantIds']) ? data['variantIds'] : [],
      finalVariantIds: finalVariantIds,
      finalVariantIds2: data['finalVariantIds2'] || undefined, // Store the raw Map from Firebase
      inquiryId: data['inquiryId'] || '',
      consultantId: data['consultantId'] || '',
      stylerId: data['stylerId'] || '',
      endedOn: data['endedOn'] ? (data['endedOn']?.toDate ? data['endedOn'].toDate() : new Date(data['endedOn'])) : undefined, // Handle both Timestamp and epoch
      updatedAt: data['updatedAt'] ? (data['updatedAt']?.toDate ? data['updatedAt'].toDate() : new Date(data['updatedAt'])) : undefined, // Handle both Timestamp and epoch
      isActive: Boolean(data['isActive']),
      lastMessage: lastMessage,
      budget: typeof data['budget'] === 'number' ? data['budget'] : undefined,
      packageOrderDocId: data['packageOrderDocId'],
    });
  }
}

// TypeScript class implementation for ToOrderVariantData (matches Dart exactly)
export class ToOrderVariantDataClass implements ToOrderVariantData {
  variantId: string;
  qty: number;
  deliveryDate?: Date;
  customNote: string;
  id: string;

  constructor(data: ToOrderVariantData) {
    this.variantId = data.variantId;
    this.qty = data.qty;
    this.deliveryDate = data.deliveryDate;
    this.customNote = data.customNote;
    this.id = data.id;
  }

  /// Convert ToOrderVariantData to JSON (matches Dart toJson method exactly)
  toJson(): Record<string, any> {
    return {
      [this.id]: {
        'variantId': this.variantId,
        'qty': this.qty,
        'deliveryDate': this.deliveryDate?.getTime(), // Convert to epoch time
        'customNote': this.customNote,
      }
    };
  }

  /// Convert ToOrderVariantData to JSON2 (matches Dart toJson2 method exactly)
  toJson2(): Record<string, any> {
    return {
      'variantId': this.variantId,
      'qty': this.qty,
      'deliveryDate': this.deliveryDate?.getTime(), // Convert to epoch time
      'customNote': this.customNote,
    };
  }

  /// Create ToOrderVariantData from JSON (matches Dart fromJson method exactly)
  static fromJson(id: string, json: Record<string, any>): ToOrderVariantDataClass {
    return new ToOrderVariantDataClass({
      id: id,
      variantId: json['variantId'] || '',
      qty: json['qty'] || 0,
      deliveryDate: json['deliveryDate'] ? new Date(json['deliveryDate']) : undefined, // Convert from epoch time
      customNote: json['customNote'] || '',
    });
  }
}

// TypeScript class implementation for MessagesModel (matches Dart exactly)
export class MessagesModelClass implements MessagesModel {
  docId: string;
  type: string;
  sessionId: string;
  loadingText?: string;
  data: Record<string, any>;
  senderId: string;
  sendAt: Date;

  constructor(data: MessagesModel) {
    this.docId = data.docId;
    this.type = data.type;
    this.sessionId = data.sessionId;
    this.loadingText = data.loadingText;
    this.data = data.data;
    this.senderId = data.senderId;
    this.sendAt = data.sendAt;
  }

  /// Convert MessagesModel to JSON (matches Dart toJson method exactly)
  toJson(): Record<string, any> {
    return {
      'type': this.type,
      'sessionId': this.sessionId,
      'loadingText': this.loadingText,
      'data': this.data,
      'senderId': this.senderId,
      'sendAt': this.sendAt.getTime(), // Convert to epoch time
    };
  }

  /// Create MessagesModel from JSON (matches Dart fromJson method exactly)
  static fromJson(json: Record<string, any>): MessagesModelClass {
    return new MessagesModelClass({
      docId: json['docId'] || '',
      type: json['type'] || '',
      sessionId: json['sessionId'] || '',
      loadingText: json['loadingText'],
      data: json['data'] || {},
      senderId: json['senderId'] || '',
      sendAt: new Date(json['sendAt']), // Convert from epoch time
    });
  }

  /// Create MessagesModel from Firestore DocumentSnapshot (matches Dart fromSnap method exactly)
  static fromSnap(snapshot: any): MessagesModelClass {
    const data = snapshot.data();
    return new MessagesModelClass({
      docId: snapshot.id,
      type: data['type'] || '',
      sessionId: data['sessionId'] || '',
      loadingText: data['loadingText'],
      data: data['data'] || {},
      senderId: data['senderId'] || '',
      sendAt: data['sendAt']?.toDate ? data['sendAt'].toDate() : new Date(data['sendAt']), // Handle both Timestamp and epoch
    });
  }
}

// TypeScript interface for StylerProducts (matches Dart exactly)
export interface StylerProducts {
  docId: string;
  title: string;
  selectedProducts: SelectedProduct[];
}

// TypeScript class implementation for StylerProducts (matches Dart exactly)
export class StylerProductsClass implements StylerProducts {
  docId: string;
  title: string;
  selectedProducts: SelectedProduct[];

  constructor(data: StylerProducts) {
    this.docId = data.docId;
    this.title = data.title;
    this.selectedProducts = data.selectedProducts;
  }

  /// Convert StylerProducts to JSON (matches Dart toJson method exactly)
  toJson(): Record<string, any> {
    return {
      'title': this.title,
      'products': this.selectedProducts.map(product => {
        if (product instanceof SelectedProductClass) {
          return product.toJson();
        } else {
          // Handle interface case
          const productClass = new SelectedProductClass(product);
          return productClass.toJson();
        }
      }),
    };
  }

  /// Create StylerProducts from JSON (matches Dart fromJson method exactly)
  static fromJson(json: Record<string, any>): StylerProductsClass {
    return new StylerProductsClass({
      docId: json['docId'] || '',
      title: json['title'] || '',
      selectedProducts: (json['products'] || []).map((product: any) => 
        SelectedProductClass.fromJson(product)
      ),
    });
  }

  /// Create StylerProducts from Firestore DocumentSnapshot (matches Dart fromSnap method exactly)
  static fromSnap(snapshot: any): StylerProductsClass {
    const data = snapshot.data();
    return new StylerProductsClass({
      docId: snapshot.id,
      title: data['title'] || '',
      selectedProducts: (data['products'] || []).map((product: any) => 
        SelectedProductClass.fromJson(product)
      ),
    });
  }
}

// TypeScript interface for SelectedProduct (matches Dart exactly)
export interface SelectedProduct {
  variantId: string;
  isSelected: boolean;
}

// TypeScript class implementation for SelectedProduct (matches Dart exactly)
export class SelectedProductClass implements SelectedProduct {
  variantId: string;
  isSelected: boolean;

  constructor(data: SelectedProduct) {
    this.variantId = data.variantId;
    this.isSelected = data.isSelected;
  }

  /// Convert SelectedProduct to JSON (matches Dart toJson method exactly)
  toJson(): Record<string, any> {
    return {
      'variantId': this.variantId,
      'isSelected': this.isSelected,
    };
  }

  /// Create SelectedProduct from JSON (matches Dart fromJson method exactly)
  static fromJson(json: Record<string, any>): SelectedProductClass {
    return new SelectedProductClass({
      variantId: json['variantId'] || '',
      isSelected: json['isSelected'] || false,
    });
  }
}

export interface SessionProducts {
  catName: string;
  variants: any[]; // You can replace 'any' with your variant model type
}
