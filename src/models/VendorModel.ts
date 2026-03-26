import { DocumentSnapshot, QueryDocumentSnapshot, Timestamp } from 'firebase/firestore';

export interface SubCatMap {
  subCatdocId: string;
  subCatApiId: string;
}

export interface PurSellPerModel {
  subCatId: string;
  purchasePer: number;
  sellingPer: number;
}

export interface VendorModel {
  docId: string;
  name: string;
  email: string;
  contactPerson: string;
  phone: string;
  createdAt: Date | Timestamp;
  lastUpdatedOn: Date | Timestamp;
  address: string;
  subcatids: string[];
  apiSubCatIds: SubCatMap[];
  city: string;
  state: string;
  country: string;
  password: string;
  level: string;
  serviceDescription: string;
  websiteLink?: string | null;
  isActive: boolean;
  apiRequiredData: Record<string, any>;
  purSalePerData: PurSellPerModel[];
  userType?: string;
  selectedApi?: string;
  businessCategory?: string;
}

export class SubCatMapClass implements SubCatMap {
  subCatdocId: string;
  subCatApiId: string;

  constructor(data: SubCatMap) {
    this.subCatdocId = data.subCatdocId;
    this.subCatApiId = data.subCatApiId;
  }

  static fromJson(json: Record<string, any>): SubCatMapClass {
    return new SubCatMapClass({
      subCatApiId: json['subCatApiId'] || '',
      subCatdocId: json['subCatdocId'] || ''
    });
  }

  toJson(): Record<string, any> {
    return {
      subCatApiId: this.subCatApiId,
      subCatdocId: this.subCatdocId
    };
  }
}

export class PurSellPerModelClass implements PurSellPerModel {
  subCatId: string;
  purchasePer: number;
  sellingPer: number;

  constructor(data: PurSellPerModel) {
    this.subCatId = data.subCatId;
    this.purchasePer = data.purchasePer;
    this.sellingPer = data.sellingPer;
  }

  static fromJson(subCatId: string, json: Record<string, any>): PurSellPerModelClass {
    return new PurSellPerModelClass({
      subCatId: subCatId,
      purchasePer: json['purPercentage'] || 0,
      sellingPer: json['sellPercentage'] || 0
    });
  }

  toJson(): Record<string, any> {
    return {
      [this.subCatId]: {
        purPercentage: this.purchasePer,
        sellPercentage: this.sellingPer
      }
    };
  }
}

export class VendorModelClass implements VendorModel {
  docId: string;
  name: string;
  email: string;
  contactPerson: string;
  phone: string;
  createdAt: Date | Timestamp;
  lastUpdatedOn: Date | Timestamp;
  address: string;
  subcatids: string[];
  apiSubCatIds: SubCatMap[];
  city: string;
  state: string;
  country: string;
  password: string;
  level: string;
  serviceDescription: string;
  websiteLink?: string | null;
  isActive: boolean;
  apiRequiredData: Record<string, any>;
  purSalePerData: PurSellPerModel[];
  userType?: string;
  selectedApi?: string;
  businessCategory?: string;

  constructor(data: VendorModel) {
    this.docId = data.docId;
    this.name = data.name;
    this.email = data.email;
    this.contactPerson = data.contactPerson;
    this.phone = data.phone;
    this.createdAt = data.createdAt;
    this.lastUpdatedOn = data.lastUpdatedOn;
    this.address = data.address;
    this.subcatids = data.subcatids || [];
    this.apiSubCatIds = data.apiSubCatIds || [];
    this.city = data.city;
    this.state = data.state;
    this.country = data.country || '';
    this.password = data.password;
    this.level = data.level;
    this.serviceDescription = data.serviceDescription;
    this.websiteLink = data.websiteLink;
    this.isActive = data.isActive;
    this.apiRequiredData = data.apiRequiredData || {};
    this.purSalePerData = data.purSalePerData || [];
    this.userType = data.userType || 'Vendor';
    this.selectedApi = data.selectedApi;
    this.businessCategory = data.businessCategory;
  }

  /**
   * Create a VendorModel instance from JSON
   */
  static fromJson(json: Record<string, any>): VendorModelClass {
    // Handle Timestamp conversion
    const createdAt = json['createdAt']?.toDate ? json['createdAt'].toDate() : new Date(json['createdAt'] || Date.now());
    const lastUpdatedOn = json['lastUpdatedOn']?.toDate ? json['lastUpdatedOn'].toDate() : new Date(json['lastUpdatedOn'] || Date.now());

    // Handle apiSubCatIds
    let apiSubCatIds: SubCatMap[] = [];
    if (json['apiSubCatIds'] && Array.isArray(json['apiSubCatIds'])) {
      apiSubCatIds = json['apiSubCatIds'].map((item: any) => 
        SubCatMapClass.fromJson(item)
      );
    }

    // Handle purSalePerData
    let purSalePerData: PurSellPerModel[] = [];
    if (json['purSalePerData']) {
      if (typeof json['purSalePerData'] === 'object' && !Array.isArray(json['purSalePerData'])) {
        // Convert Map/Object to array
        purSalePerData = Object.entries(json['purSalePerData']).map(([subCatId, data]: [string, any]) =>
          PurSellPerModelClass.fromJson(subCatId, data as Record<string, any>)
        );
      } else if (Array.isArray(json['purSalePerData'])) {
        purSalePerData = json['purSalePerData'].map((item: any) =>
          new PurSellPerModelClass({
            subCatId: item.subCatId || '',
            purchasePer: item.purchasePer || 0,
            sellingPer: item.sellingPer || 0
          })
        );
      }
    }

    return new VendorModelClass({
      docId: json['docId'] || '',
      name: json['name'] || '',
      email: json['email'] || '',
      contactPerson: json['contactPerson'] || '',
      phone: json['phone'] || '',
      createdAt: createdAt,
      lastUpdatedOn: lastUpdatedOn,
      address: json['address'] || '',
      subcatids: Array.isArray(json['subcatids']) ? json['subcatids'] : [],
      apiSubCatIds: apiSubCatIds,
      city: json['city'] || '',
      state: json['state'] || '',
      country: json['country'] || '',
      password: json['password'] || '',
      level: json['level'] || '',
      serviceDescription: json['serviceDescription'] || '',
      websiteLink: json['websiteLink'] || null,
      isActive: json['isActive'] !== undefined ? json['isActive'] : true,
      apiRequiredData: json['apiRequiredData'] || {},
      purSalePerData: purSalePerData,
      userType: json['userType'] || 'Vendor',
      selectedApi: json['selectedApi'],
      businessCategory: json['businessCategory']
    });
  }

  /**
   * Create a VendorModel instance from Firestore QueryDocumentSnapshot
   */
  static fromSnap(snapshot: QueryDocumentSnapshot): VendorModelClass {
    const data = snapshot.data() as Record<string, any>;

    // Handle Timestamp conversion
    const createdAt = data['createdAt']?.toDate ? data['createdAt'].toDate() : new Date();
    const lastUpdatedOn = data['lastUpdatedOn']?.toDate ? data['lastUpdatedOn'].toDate() : new Date();

    // Handle apiSubCatIds
    let apiSubCatIds: SubCatMap[] = [];
    if (data['apiSubCatIds'] && Array.isArray(data['apiSubCatIds'])) {
      apiSubCatIds = data['apiSubCatIds'].map((item: any) =>
        SubCatMapClass.fromJson(item)
      );
    }

    // Handle purSalePerData
    let purSalePerData: PurSellPerModel[] = [];
    if (data['purSalePerData']) {
      if (typeof data['purSalePerData'] === 'object' && !Array.isArray(data['purSalePerData'])) {
        purSalePerData = Object.entries(data['purSalePerData']).map(([subCatId, item]: [string, any]) =>
          PurSellPerModelClass.fromJson(subCatId, item as Record<string, any>)
        );
      }
    }

    return new VendorModelClass({
      docId: snapshot.id,
      name: data['name'] || '',
      email: data['email'] || '',
      contactPerson: data['contactPerson'] || '',
      phone: data['phone'] || '',
      createdAt: createdAt,
      lastUpdatedOn: lastUpdatedOn,
      address: data['address'] || '',
      subcatids: Array.isArray(data['subcatids']) ? data['subcatids'] : [],
      apiSubCatIds: apiSubCatIds,
      city: data['city'] || '',
      state: data['state'] || '',
      country: data['country'] || '',
      password: data['password'] || '',
      level: data['level'] || '',
      serviceDescription: data['serviceDescription'] || '',
      websiteLink: data['websiteLink'] || null,
      isActive: data['isActive'] !== undefined ? data['isActive'] : true,
      apiRequiredData: data['apiRequiredData'] || {},
      purSalePerData: purSalePerData,
      userType: data['userType'] || 'Vendor',
      selectedApi: data['selectedApi'],
      businessCategory: data['businessCategory']
    });
  }

  /**
   * Create a VendorModel instance from Firestore DocumentSnapshot
   */
  static fromDocSnap(snapshot: DocumentSnapshot): VendorModelClass {
    const data = snapshot.data();
    if (!data) {
      throw new Error('Document data is empty');
    }

    // Handle Timestamp conversion
    const createdAt = data['createdAt']?.toDate ? data['createdAt'].toDate() : new Date();
    const lastUpdatedOn = data['lastUpdatedOn']?.toDate ? data['lastUpdatedOn'].toDate() : new Date();

    // Handle apiSubCatIds
    let apiSubCatIds: SubCatMap[] = [];
    if (data['apiSubCatIds'] && Array.isArray(data['apiSubCatIds'])) {
      apiSubCatIds = data['apiSubCatIds'].map((item: any) =>
        SubCatMapClass.fromJson(item)
      );
    }

    // Handle purSalePerData
    let purSalePerData: PurSellPerModel[] = [];
    if (data['purSalePerData']) {
      if (typeof data['purSalePerData'] === 'object' && !Array.isArray(data['purSalePerData'])) {
        purSalePerData = Object.entries(data['purSalePerData']).map(([subCatId, item]: [string, any]) =>
          PurSellPerModelClass.fromJson(subCatId, item as Record<string, any>)
        );
      }
    }

    return new VendorModelClass({
      docId: snapshot.id,
      name: data['name'] || '',
      email: data['email'] || '',
      contactPerson: data['contactPerson'] || '',
      phone: data['phone'] || '',
      createdAt: createdAt,
      lastUpdatedOn: lastUpdatedOn,
      address: data['address'] || '',
      subcatids: Array.isArray(data['subcatids']) ? data['subcatids'] : [],
      apiSubCatIds: apiSubCatIds,
      city: data['city'] || '',
      state: data['state'] || '',
      country: data['country'] || '',
      password: data['password'] || '',
      level: data['level'] || '',
      serviceDescription: data['serviceDescription'] || '',
      websiteLink: data['websiteLink'] || null,
      isActive: data['isActive'] !== undefined ? data['isActive'] : true,
      apiRequiredData: data['apiRequiredData'] || {},
      purSalePerData: purSalePerData,
      userType: data['userType'] || 'Vendor',
      selectedApi: data['selectedApi'],
      businessCategory: data['businessCategory']
    });
  }

  /**
   * Convert VendorModel instance to JSON for Firestore
   */
  toJson(): Record<string, any> {
    // Convert purSalePerData array to Map/Object structure
    const purSalePerDataMap: Record<string, any> = {};
    this.purSalePerData.forEach((item) => {
      purSalePerDataMap[item.subCatId] = {
        purPercentage: item.purchasePer,
        sellPercentage: item.sellingPer
      };
    });

    return {
      docId: this.docId,
      name: this.name,
      email: this.email,
      contactPerson: this.contactPerson,
      phone: this.phone,
      createdAt: this.createdAt instanceof Date ? Timestamp.fromDate(this.createdAt) : this.createdAt,
      lastUpdatedOn: this.lastUpdatedOn instanceof Date ? Timestamp.fromDate(this.lastUpdatedOn) : this.lastUpdatedOn,
      address: this.address,
      subcatids: this.subcatids,
      apiSubCatIds: this.apiSubCatIds.map(item =>
        item instanceof SubCatMapClass ? item.toJson() : new SubCatMapClass(item).toJson()
      ),
      city: this.city,
      state: this.state,
      country: this.country,
      password: this.password,
      level: this.level,
      serviceDescription: this.serviceDescription,
      websiteLink: this.websiteLink,
      isActive: this.isActive,
      apiRequiredData: this.apiRequiredData,
      purSalePerData: purSalePerDataMap,
      userType: this.userType || 'Vendor',
      selectedApi: this.selectedApi,
      businessCategory: this.businessCategory || ''
    };
  }
}

