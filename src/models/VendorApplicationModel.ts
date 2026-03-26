import { DocumentSnapshot, QueryDocumentSnapshot, Timestamp } from 'firebase/firestore';

export type VendorApplicationStatus = 'pending' | 'approved' | 'rejected';
export type ActivationStatus = 'not_started' | 'submitted' | 'approved';

export interface PackagingCapability {
  standard: boolean;
  branded: boolean;
  ecoFriendly: boolean;
}

export interface VendorApplicationModel {
  // --- Registration fields ---
  docId: string;
  businessName: string;
  brandName: string;
  websiteUrl: string;
  gstNumber: string;
  firstName: string;
  lastName: string;
  name?: string;
  whatsappNumber: string;
  email: string;
  businessCategory: string;
  marketplaceLinks: string;
  country: string;
  state: string;
  city: string;
  instagramLink: string;
  websiteType: string;
  status: VendorApplicationStatus;
  createdAt: Date | Timestamp;

  // --- Activation fields (Section 1: Legal & Compliance) ---
  activationGstNumber?: string;
  businessPanCardUrl?: string;
  businessRegistrationCertUrl?: string;
  iecCode?: string;
  msmeCertUrl?: string;

  // --- Activation fields (Section 2: Banking) ---
  bankName?: string;
  accountHolderName?: string;
  accountNumber?: string;
  ifscCode?: string;
  cancelledChequeUrl?: string;

  // --- Activation fields (Section 3: Operational & Fulfilment) ---
  productCategoriesOffered?: string;
  priceRangeMin?: string;
  priceRangeMax?: string;
  minimumOrderQuantity?: string;
  averageDispatchTimeline?: string;
  returnExchangePolicy?: string;
  packagingCapability?: PackagingCapability;
  internationalShipping?: boolean;
  shippingPartnerName?: string;
  customsDutiesBornBy?: 'vendor' | 'customer';

  // --- Activation fields (Section 4: Website & Inventory) ---
  websiteManagedBy?: 'internal' | 'agency' | 'freelancer' | 'other';
  catalogManagerName?: string;
  catalogManagerEmail?: string;
  catalogManagerPhone?: string;
  stockUpdateFrequency?: 'daily' | 'alternateDays' | 'weekly' | 'onlyWhenRequired';

  // --- Activation fields (Section 5: Commercial & Payment) ---
  commissionPercentage?: string;
  paymentCycle?: '7days' | '15days' | '30days';
  settlementMethod?: 'bankTransfer' | 'other';
  settlementMethodOther?: string;
  gstInvoicingResponsibility?: 'vendor' | 'platform';

  // --- Declaration ---
  authorizedSignatoryName?: string;
  declarationDate?: string;
  signatureUrl?: string;
  declarationAccepted?: boolean;

  // --- Activation metadata ---
  activationStatus?: ActivationStatus;
  activationSubmittedAt?: Date | Timestamp;
}

export class VendorApplicationModelClass implements VendorApplicationModel {
  docId: string;
  businessName: string;
  brandName: string;
  websiteUrl: string;
  gstNumber: string;
  firstName: string;
  lastName: string;
  name?: string;
  whatsappNumber: string;
  email: string;
  businessCategory: string;
  marketplaceLinks: string;
  country: string;
  state: string;
  city: string;
  instagramLink: string;
  websiteType: string;
  status: VendorApplicationStatus;
  createdAt: Date | Timestamp;

  activationGstNumber?: string;
  businessPanCardUrl?: string;
  businessRegistrationCertUrl?: string;
  iecCode?: string;
  msmeCertUrl?: string;

  bankName?: string;
  accountHolderName?: string;
  accountNumber?: string;
  ifscCode?: string;
  cancelledChequeUrl?: string;

  productCategoriesOffered?: string;
  priceRangeMin?: string;
  priceRangeMax?: string;
  minimumOrderQuantity?: string;
  averageDispatchTimeline?: string;
  returnExchangePolicy?: string;
  packagingCapability?: PackagingCapability;
  internationalShipping?: boolean;
  shippingPartnerName?: string;
  customsDutiesBornBy?: 'vendor' | 'customer';

  websiteManagedBy?: 'internal' | 'agency' | 'freelancer' | 'other';
  catalogManagerName?: string;
  catalogManagerEmail?: string;
  catalogManagerPhone?: string;
  stockUpdateFrequency?: 'daily' | 'alternateDays' | 'weekly' | 'onlyWhenRequired';

  commissionPercentage?: string;
  paymentCycle?: '7days' | '15days' | '30days';
  settlementMethod?: 'bankTransfer' | 'other';
  settlementMethodOther?: string;
  gstInvoicingResponsibility?: 'vendor' | 'platform';

  authorizedSignatoryName?: string;
  declarationDate?: string;
  signatureUrl?: string;
  declarationAccepted?: boolean;

  activationStatus?: ActivationStatus;
  activationSubmittedAt?: Date | Timestamp;

  constructor(data: VendorApplicationModel) {
    this.docId = data.docId;
    this.businessName = data.businessName;
    this.brandName = data.brandName || '';
    this.websiteUrl = data.websiteUrl || '';
    this.gstNumber = data.gstNumber || '';
    this.firstName = data.firstName;
    this.lastName = data.lastName;
    this.name = data.name || '';
    this.whatsappNumber = data.whatsappNumber;
    this.email = data.email;
    this.businessCategory = data.businessCategory;
    this.marketplaceLinks = data.marketplaceLinks || '';
    this.country = data.country || '';
    this.state = data.state || '';
    this.city = data.city;
    this.instagramLink = data.instagramLink || '';
    this.websiteType = data.websiteType || '';
    this.status = data.status || 'pending';
    this.createdAt = data.createdAt || new Date();

    this.activationGstNumber = data.activationGstNumber;
    this.businessPanCardUrl = data.businessPanCardUrl;
    this.businessRegistrationCertUrl = data.businessRegistrationCertUrl;
    this.iecCode = data.iecCode;
    this.msmeCertUrl = data.msmeCertUrl;

    this.bankName = data.bankName;
    this.accountHolderName = data.accountHolderName;
    this.accountNumber = data.accountNumber;
    this.ifscCode = data.ifscCode;
    this.cancelledChequeUrl = data.cancelledChequeUrl;

    this.productCategoriesOffered = data.productCategoriesOffered;
    this.priceRangeMin = data.priceRangeMin;
    this.priceRangeMax = data.priceRangeMax;
    this.minimumOrderQuantity = data.minimumOrderQuantity;
    this.averageDispatchTimeline = data.averageDispatchTimeline;
    this.returnExchangePolicy = data.returnExchangePolicy;
    this.packagingCapability = data.packagingCapability;
    this.internationalShipping = data.internationalShipping;
    this.shippingPartnerName = data.shippingPartnerName;
    this.customsDutiesBornBy = data.customsDutiesBornBy;

    this.websiteManagedBy = data.websiteManagedBy;
    this.catalogManagerName = data.catalogManagerName;
    this.catalogManagerEmail = data.catalogManagerEmail;
    this.catalogManagerPhone = data.catalogManagerPhone;
    this.stockUpdateFrequency = data.stockUpdateFrequency;

    this.commissionPercentage = data.commissionPercentage;
    this.paymentCycle = data.paymentCycle;
    this.settlementMethod = data.settlementMethod;
    this.settlementMethodOther = data.settlementMethodOther;
    this.gstInvoicingResponsibility = data.gstInvoicingResponsibility;

    this.authorizedSignatoryName = data.authorizedSignatoryName;
    this.declarationDate = data.declarationDate;
    this.signatureUrl = data.signatureUrl;
    this.declarationAccepted = data.declarationAccepted;

    this.activationStatus = data.activationStatus;
    this.activationSubmittedAt = data.activationSubmittedAt;
  }

  static fromSnap(snapshot: QueryDocumentSnapshot): VendorApplicationModelClass {
    const data = snapshot.data() as Record<string, any>;
    return VendorApplicationModelClass.fromJson({ docId: snapshot.id, ...data });
  }

  static fromDocSnap(snapshot: DocumentSnapshot): VendorApplicationModelClass {
    const data = snapshot.data();
    if (!data) throw new Error('Document data is empty');
    return VendorApplicationModelClass.fromJson({ docId: snapshot.id, ...data });
  }

  static fromJson(json: Record<string, any>): VendorApplicationModelClass {
    const createdAt = json['createdAt']?.toDate
      ? json['createdAt'].toDate()
      : new Date(json['createdAt'] || Date.now());

    const activationSubmittedAt = json['activationSubmittedAt']?.toDate
      ? json['activationSubmittedAt'].toDate()
      : json['activationSubmittedAt']
        ? new Date(json['activationSubmittedAt'])
        : undefined;

    return new VendorApplicationModelClass({
      docId: json['docId'] || '',
      businessName: json['businessName'] || '',
      brandName: json['brandName'] || '',
      websiteUrl: json['websiteUrl'] || '',
      gstNumber: json['gstNumber'] || '',
      firstName: json['firstName'] || '',
      lastName: json['lastName'] || '',
      name: json['name'] || '',
      whatsappNumber: json['whatsappNumber'] || '',
      email: json['email'] || '',
      businessCategory: json['businessCategory'] || '',
      marketplaceLinks: json['marketplaceLinks'] || '',
      country: json['country'] || '',
      state: json['state'] || '',
      city: json['city'] || '',
      instagramLink: json['instagramLink'] || '',
      websiteType: json['websiteType'] || '',
      status: json['status'] || 'pending',
      createdAt,

      activationGstNumber: json['activationGstNumber'],
      businessPanCardUrl: json['businessPanCardUrl'],
      businessRegistrationCertUrl: json['businessRegistrationCertUrl'],
      iecCode: json['iecCode'],
      msmeCertUrl: json['msmeCertUrl'],

      bankName: json['bankName'],
      accountHolderName: json['accountHolderName'],
      accountNumber: json['accountNumber'],
      ifscCode: json['ifscCode'],
      cancelledChequeUrl: json['cancelledChequeUrl'],

      productCategoriesOffered: json['productCategoriesOffered'],
      priceRangeMin: json['priceRangeMin'],
      priceRangeMax: json['priceRangeMax'],
      minimumOrderQuantity: json['minimumOrderQuantity'],
      averageDispatchTimeline: json['averageDispatchTimeline'],
      returnExchangePolicy: json['returnExchangePolicy'],
      packagingCapability: json['packagingCapability'],
      internationalShipping: json['internationalShipping'],
      shippingPartnerName: json['shippingPartnerName'],
      customsDutiesBornBy: json['customsDutiesBornBy'],

      websiteManagedBy: json['websiteManagedBy'],
      catalogManagerName: json['catalogManagerName'],
      catalogManagerEmail: json['catalogManagerEmail'],
      catalogManagerPhone: json['catalogManagerPhone'],
      stockUpdateFrequency: json['stockUpdateFrequency'],

      commissionPercentage: json['commissionPercentage'],
      paymentCycle: json['paymentCycle'],
      settlementMethod: json['settlementMethod'],
      settlementMethodOther: json['settlementMethodOther'],
      gstInvoicingResponsibility: json['gstInvoicingResponsibility'],

      authorizedSignatoryName: json['authorizedSignatoryName'],
      declarationDate: json['declarationDate'],
      signatureUrl: json['signatureUrl'],
      declarationAccepted: json['declarationAccepted'],

      activationStatus: json['activationStatus'],
      activationSubmittedAt,
    });
  }

  toJson(): Record<string, any> {
    return {
      docId: this.docId,
      businessName: this.businessName,
      brandName: this.brandName,
      websiteUrl: this.websiteUrl,
      gstNumber: this.gstNumber,
      firstName: this.firstName,
      lastName: this.lastName,
      ...(this.name !== undefined && { name: this.name }),
      whatsappNumber: this.whatsappNumber,
      email: this.email,
      businessCategory: this.businessCategory,
      marketplaceLinks: this.marketplaceLinks,
      country: this.country,
      state: this.state,
      city: this.city,
      instagramLink: this.instagramLink,
      websiteType: this.websiteType,
      status: this.status,
      createdAt: this.createdAt instanceof Date
        ? Timestamp.fromDate(this.createdAt)
        : this.createdAt,

      ...(this.activationGstNumber !== undefined && { activationGstNumber: this.activationGstNumber }),
      ...(this.businessPanCardUrl !== undefined && { businessPanCardUrl: this.businessPanCardUrl }),
      ...(this.businessRegistrationCertUrl !== undefined && { businessRegistrationCertUrl: this.businessRegistrationCertUrl }),
      ...(this.iecCode !== undefined && { iecCode: this.iecCode }),
      ...(this.msmeCertUrl !== undefined && { msmeCertUrl: this.msmeCertUrl }),

      ...(this.bankName !== undefined && { bankName: this.bankName }),
      ...(this.accountHolderName !== undefined && { accountHolderName: this.accountHolderName }),
      ...(this.accountNumber !== undefined && { accountNumber: this.accountNumber }),
      ...(this.ifscCode !== undefined && { ifscCode: this.ifscCode }),
      ...(this.cancelledChequeUrl !== undefined && { cancelledChequeUrl: this.cancelledChequeUrl }),

      ...(this.productCategoriesOffered !== undefined && { productCategoriesOffered: this.productCategoriesOffered }),
      ...(this.priceRangeMin !== undefined && { priceRangeMin: this.priceRangeMin }),
      ...(this.priceRangeMax !== undefined && { priceRangeMax: this.priceRangeMax }),
      ...(this.minimumOrderQuantity !== undefined && { minimumOrderQuantity: this.minimumOrderQuantity }),
      ...(this.averageDispatchTimeline !== undefined && { averageDispatchTimeline: this.averageDispatchTimeline }),
      ...(this.returnExchangePolicy !== undefined && { returnExchangePolicy: this.returnExchangePolicy }),
      ...(this.packagingCapability !== undefined && { packagingCapability: this.packagingCapability }),
      ...(this.internationalShipping !== undefined && { internationalShipping: this.internationalShipping }),
      ...(this.shippingPartnerName !== undefined && { shippingPartnerName: this.shippingPartnerName }),
      ...(this.customsDutiesBornBy !== undefined && { customsDutiesBornBy: this.customsDutiesBornBy }),

      ...(this.websiteManagedBy !== undefined && { websiteManagedBy: this.websiteManagedBy }),
      ...(this.catalogManagerName !== undefined && { catalogManagerName: this.catalogManagerName }),
      ...(this.catalogManagerEmail !== undefined && { catalogManagerEmail: this.catalogManagerEmail }),
      ...(this.catalogManagerPhone !== undefined && { catalogManagerPhone: this.catalogManagerPhone }),
      ...(this.stockUpdateFrequency !== undefined && { stockUpdateFrequency: this.stockUpdateFrequency }),

      ...(this.commissionPercentage !== undefined && { commissionPercentage: this.commissionPercentage }),
      ...(this.paymentCycle !== undefined && { paymentCycle: this.paymentCycle }),
      ...(this.settlementMethod !== undefined && { settlementMethod: this.settlementMethod }),
      ...(this.settlementMethodOther !== undefined && { settlementMethodOther: this.settlementMethodOther }),
      ...(this.gstInvoicingResponsibility !== undefined && { gstInvoicingResponsibility: this.gstInvoicingResponsibility }),

      ...(this.authorizedSignatoryName !== undefined && { authorizedSignatoryName: this.authorizedSignatoryName }),
      ...(this.declarationDate !== undefined && { declarationDate: this.declarationDate }),
      ...(this.signatureUrl !== undefined && { signatureUrl: this.signatureUrl }),
      ...(this.declarationAccepted !== undefined && { declarationAccepted: this.declarationAccepted }),

      ...(this.activationStatus !== undefined && { activationStatus: this.activationStatus }),
      ...(this.activationSubmittedAt !== undefined && {
        activationSubmittedAt: this.activationSubmittedAt instanceof Date
          ? Timestamp.fromDate(this.activationSubmittedAt)
          : this.activationSubmittedAt,
      }),
    };
  }
}
