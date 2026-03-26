import { DocumentSnapshot, QueryDocumentSnapshot } from 'firebase/firestore';
import { AddressModel } from './AddressModels';
import { PointsModel } from './PackageModels';

export interface UserModel {
  docId?: string;
  name?: string;
  phone?: string;
  email: string;
  password: string;
  defaultAddressId?: string;
  favourites?: string[];
  addresses: AddressModel[];
  services: PointsModel[];
  currency?: 'INR' | 'USD' | 'EUR'; // User's preferred currency
  isVerified?: boolean;
  isValidated?: boolean;
}

export class UserModelClass implements UserModel {
  docId?: string;
  name?: string;
  phone?: string;
  email: string;
  password: string;
  defaultAddressId?: string;
  favourites?: string[];
  addresses: AddressModel[];
  services: PointsModel[];
  currency?: 'INR' | 'USD' | 'EUR';
  isVerified?: boolean;
  isValidated?: boolean;

  constructor(data: UserModel) {
    this.docId = data.docId;
    this.name = data.name;
    this.phone = data.phone;
    this.email = data.email;
    this.password = data.password;
    this.defaultAddressId = data.defaultAddressId;
    this.favourites = data.favourites || [];

    // Robustly handle addresses - conversion if it's an object/Map from raw Firestore data
    let addresses: AddressModel[] = [];
    if (data.addresses) {
      if (Array.isArray(data.addresses)) {
        addresses = data.addresses;
      } else if (typeof data.addresses === 'object') {
        addresses = Object.entries(data.addresses).map(([id, addr]: [string, any]) => ({
          id: id,
          name: addr.name || '',
          phone: addr.phone || '',
          label: addr.label || '',
          flatHouse: addr.flatHouse || '',
          area: addr.area || '',
          city: addr.city || '',
          state: addr.state || '',
          country: addr.country || '',
          pincode: addr.pincode || '',
          isDefault: !!addr.isDefault
        }));
      }
    }
    this.addresses = addresses;

    this.services = data.services || [];
    this.currency = data.currency || 'INR';
    this.isVerified = data.isVerified || false;
    this.isValidated = data.isValidated || false;
  }

  /**
   * Create a UserModel instance from JSON
   * Handles addresses as a Map/Object where keys are address IDs
   */
  static fromJson(json: Record<string, any>): UserModelClass {
    // Handle addresses - can be a Map/Object or an array
    let addresses: AddressModel[] = [];
    if (json['addresses']) {
      if (Array.isArray(json['addresses'])) {
        // If it's an array, map directly
        addresses = json['addresses'].map((addr: any) => ({
          id: addr.id || '',
          name: addr.name || '',
          phone: addr.phone || '',
          label: addr.label || '',
          flatHouse: addr.flatHouse || '',
          area: addr.area || '',
          city: addr.city || '',
          state: addr.state || '',
          country: addr.country || '',
          pincode: addr.pincode || '',
          isDefault: !!addr.isDefault
        }));
      } else if (typeof json['addresses'] === 'object') {
        // If it's a Map/Object, convert entries to array
        addresses = Object.entries(json['addresses']).map(([id, addressData]: [string, any]) => ({
          id: id,
          name: addressData.name || '',
          phone: addressData.phone || '',
          label: addressData.label || '',
          flatHouse: addressData.flatHouse || '',
          area: addressData.area || '',
          city: addressData.city || '',
          state: addressData.state || '',
          country: addressData.country || '',
          pincode: addressData.pincode || '',
          isDefault: !!addressData.isDefault
        }));
      }
    }

    // Handle favourites - ensure it's an array of strings
    let favourites: string[] = [];
    if (json['favourites'] !== undefined) {
      if (Array.isArray(json['favourites'])) {
        favourites = json['favourites'].map((item: any) => String(item));
      }
    }

    // Handle services - map PointsModel
    let services: PointsModel[] = [];
    if (json['services'] && Array.isArray(json['services'])) {
      services = json['services'].map((service: any) => ({
        serviceId: service.serviceId || '',
        serviceName: service.serviceName || '',
        serviceQty: service.serviceQty || 0,
        serviceUnit: service.serviceUnit || ''
      }));
    }

    return new UserModelClass({
      docId: json['docId'] || undefined,
      name: json['name'] || undefined,
      phone: json['phone'] || undefined,
      email: json['email'] || '',
      password: json['password'] || '',
      defaultAddressId: json['defaultAddressId'] || undefined,
      favourites: favourites,
      addresses: addresses,
      services: services,
      currency: (json['currency'] === 'USD' || json['currency'] === 'INR' || json['currency'] === 'EUR') ? json['currency'] : 'INR',
      isVerified: json['isVerified'] || false,
      isValidated: json['isValidated'] || false
    });
  }

  /**
   * Create a UserModel instance from Firestore DocumentSnapshot
   */
  static fromDocSnap(snapshot: DocumentSnapshot): UserModelClass {
    const data = snapshot.data();
    if (!data) {
      throw new Error('Document data is empty');
    }

    // Handle addresses - check if it's a Map/Object
    let addresses: AddressModel[] = [];
    if (data['addresses']) {
      if (Array.isArray(data['addresses'])) {
        addresses = data['addresses'].map((addr: any, index: number) => ({
          id: addr.id || `address_${index}`,
          name: addr.name || '',
          phone: addr.phone || '',
          label: addr.label || '',
          flatHouse: addr.flatHouse || '',
          area: addr.area || '',
          city: addr.city || '',
          state: addr.state || '',
          country: addr.country || '',
          pincode: addr.pincode || '',
          isDefault: !!addr.isDefault
        }));
      } else if (typeof data['addresses'] === 'object') {
        // Convert Map/Object to array
        addresses = Object.entries(data['addresses']).map(([id, addressData]: [string, any]) => ({
          id: id,
          name: addressData.name || '',
          phone: addressData.phone || '',
          label: addressData.label || '',
          flatHouse: addressData.flatHouse || '',
          area: addressData.area || '',
          city: addressData.city || '',
          state: addressData.state || '',
          country: addressData.country || '',
          pincode: addressData.pincode || '',
          isDefault: !!addressData.isDefault
        }));
      }
    }

    // Handle favourites
    let favourites: string[] = [];
    if (data['favourites'] !== undefined && Array.isArray(data['favourites'])) {
      favourites = data['favourites'].map((item: any) => String(item));
    }

    // Handle services
    let services: PointsModel[] = [];
    if (data['services'] && Array.isArray(data['services'])) {
      services = data['services'].map((service: any) => ({
        serviceId: service.serviceId || '',
        serviceName: service.serviceName || '',
        serviceQty: service.serviceQty || 0,
        serviceUnit: service.serviceUnit || ''
      }));
    }

    return new UserModelClass({
      docId: snapshot.id,
      name: data['name'] || undefined,
      phone: data['phone'] || undefined,
      email: data['email'] || '',
      password: data['password'] || '',
      defaultAddressId: data['defaultAddressId'] || undefined,
      favourites: favourites,
      addresses: addresses,
      services: services,
      currency: (data['currency'] === 'USD' || data['currency'] === 'INR' || data['currency'] === 'EUR') ? data['currency'] : 'INR',
      isVerified: data['isVerified'] || false,
      isValidated: data['isValidated'] || false
    });
  }

  /**
   * Create a UserModel instance from Firestore QueryDocumentSnapshot
   */
  static fromSnap(snapshot: QueryDocumentSnapshot): UserModelClass {
    const data = snapshot.data() as Record<string, any>;

    // Handle addresses
    let addresses: AddressModel[] = [];
    if (data['addresses']) {
      if (Array.isArray(data['addresses'])) {
        addresses = data['addresses'].map((addr: any, index: number) => ({
          id: addr.id || `address_${index}`,
          name: addr.name || '',
          phone: addr.phone || '',
          label: addr.label || '',
          flatHouse: addr.flatHouse || '',
          area: addr.area || '',
          city: addr.city || '',
          state: addr.state || '',
          country: addr.country || '',
          pincode: addr.pincode || '',
          isDefault: !!addr.isDefault
        }));
      } else if (typeof data['addresses'] === 'object') {
        // Convert Map/Object to array
        addresses = Object.entries(data['addresses']).map(([id, addressData]: [string, any]) => ({
          id: id,
          name: addressData.name || '',
          phone: addressData.phone || '',
          label: addressData.label || '',
          flatHouse: addressData.flatHouse || '',
          area: addressData.area || '',
          city: addressData.city || '',
          state: addressData.state || '',
          country: addressData.country || '',
          pincode: addressData.pincode || '',
          isDefault: !!addressData.isDefault
        }));
      }
    }

    // Handle favourites
    let favourites: string[] = [];
    if (data['favourites'] !== undefined && Array.isArray(data['favourites'])) {
      favourites = data['favourites'].map((item: any) => String(item));
    }

    // Handle services
    let services: PointsModel[] = [];
    if (data['services'] && Array.isArray(data['services'])) {
      services = data['services'].map((service: any) => ({
        serviceId: service.serviceId || '',
        serviceName: service.serviceName || '',
        serviceQty: service.serviceQty || 0,
        serviceUnit: service.serviceUnit || ''
      }));
    }

    return new UserModelClass({
      docId: snapshot.id,
      name: data['name'] || undefined,
      phone: data['phone'] || undefined,
      email: data['email'] || '',
      password: data['password'] || '',
      defaultAddressId: data['defaultAddressId'] || undefined,
      favourites: favourites,
      addresses: addresses,
      services: services,
      currency: (data['currency'] === 'USD' || data['currency'] === 'INR' || data['currency'] === 'EUR') ? data['currency'] : 'INR',
      isVerified: data['isVerified'] || false,
      isValidated: data['isValidated'] || false
    });
  }

  /**
   * Convert UserModel instance to JSON
   * Converts addresses array back to Map/Object structure for Firestore
   */
  toJson(): Record<string, any> {
    // Convert addresses array to Map/Object structure (matching Dart's toJson2 format)
    const addressesMap: Record<string, any> = {};
    this.addresses.forEach((address) => {
      const addressId = address.id || `address_${Date.now()}`;
      addressesMap[addressId] = {
        name: address.name,
        phone: address.phone || '',
        label: address.label || '',
        flatHouse: address.flatHouse,
        area: address.area,
        city: address.city,
        state: address.state,
        country: address.country,
        pincode: address.pincode,
        isDefault: !!address.isDefault
      };
    });

    return {
      docId: this.docId,
      name: this.name,
      phone: this.phone,
      email: this.email,
      password: this.password || '', // Include password (empty for Google sign-in, Firebase Auth handles hashing for email/password)
      favourites: this.favourites,
      addresses: addressesMap,
      currency: this.currency || 'INR',
      isVerified: this.isVerified,
      isValidated: this.isValidated
      // Note: services are excluded from toJson (not in Dart toJson either)
    };
  }

  /**
   * Convert addresses to JSON format matching Dart's toJson2 method
   * This is a helper method for address serialization
   */
  addressesToJson(): Record<string, any> {
    const addressesMap: Record<string, any> = {};
    this.addresses.forEach((address) => {
      const addressId = address.id || `address_${Date.now()}`;
      addressesMap[addressId] = {
        name: address.name,
        flatHouse: address.flatHouse,
        area: address.area,
        city: address.city,
        state: address.state,
        country: address.country,
        pincode: address.pincode
      };
    });
    return addressesMap;
  }
}
