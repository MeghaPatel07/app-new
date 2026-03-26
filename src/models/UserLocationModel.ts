/**
 * User Location Data Model
 * Stores geolocation data for users with timestamps for tracking and analytics
 */

import { Timestamp } from 'firebase/firestore';

export interface GeolocationDataPoint {
  // IP-based geolocation data
  ip: string;
  countryCode: string; // ISO 3166-1 alpha-2 (e.g., 'IN', 'US')
  countryCode3: string; // ISO 3166-1 alpha-3 (e.g., 'IND', 'USA')
  countryName: string;
  stateProv: string;
  city: string;
  zipcode: string;
  latitude: string;
  longitude: string;

  // Timezone information
  timezone?: {
    name: string;
    offset: number;
    currentTime: string;
  };

  // Currency information (if available from API)
  currency?: {
    code: string;
    name: string;
    symbol: string;
  };

  // Metadata
  timestamp: Timestamp | Date;
  detectedCurrency: 'INR' | 'USD' | 'EUR' | null; // Currency auto-detected based on location
  source: 'auto-detect' | 'manual-override'; // How currency was determined
}

export interface UserLocationData {
  docId?: string;
  userId: string; // Firebase Auth UID
  locationHistory: GeolocationDataPoint[]; // Array of location data points
  lastUpdated: Timestamp | Date;
  createdAt: Timestamp | Date;

  // Current location (most recent)
  currentLocation?: {
    countryCode: string;
    countryName: string;
    city: string;
    detectedCurrency: 'INR' | 'USD' | 'EUR' | null;
  };

  // Privacy and compliance flags
  dataRetentionDays?: number; // How long to keep this data (default: 90 days)
  consentGiven?: boolean; // User consent for location tracking
  consentTimestamp?: Timestamp | Date;
}

export class UserLocationDataClass implements UserLocationData {
  docId?: string;
  userId: string;
  locationHistory: GeolocationDataPoint[];
  lastUpdated: Timestamp | Date;
  createdAt: Timestamp | Date;
  currentLocation?: {
    countryCode: string;
    countryName: string;
    city: string;
    detectedCurrency: 'INR' | 'USD' | 'EUR' | null;
  };
  dataRetentionDays?: number;
  consentGiven?: boolean;
  consentTimestamp?: Timestamp | Date;

  constructor(data: UserLocationData) {
    this.docId = data.docId;
    this.userId = data.userId;
    this.locationHistory = data.locationHistory || [];
    this.lastUpdated = data.lastUpdated || new Date();
    this.createdAt = data.createdAt || new Date();
    this.currentLocation = data.currentLocation;
    this.dataRetentionDays = data.dataRetentionDays || 90; // Default 90 days retention
    this.consentGiven = data.consentGiven || false;
    this.consentTimestamp = data.consentTimestamp;
  }

  /**
   * Create UserLocationData from Firestore document
   */
  static fromFirestore(doc: any): UserLocationDataClass {
    const data = doc.data();

    // Convert Firestore Timestamps to Date objects
    const convertTimestamp = (ts: any): Date | Timestamp => {
      if (ts?.toDate) return ts.toDate();
      if (ts instanceof Date) return ts;
      if (ts?.seconds) return new Date(ts.seconds * 1000);
      return new Date();
    };

    return new UserLocationDataClass({
      docId: doc.id,
      userId: data.userId || '',
      locationHistory: (data.locationHistory || []).map((point: any) => ({
        ...point,
        timestamp: convertTimestamp(point.timestamp)
      })),
      lastUpdated: convertTimestamp(data.lastUpdated),
      createdAt: convertTimestamp(data.createdAt),
      currentLocation: data.currentLocation,
      dataRetentionDays: data.dataRetentionDays || 90,
      consentGiven: data.consentGiven || false,
      consentTimestamp: data.consentTimestamp ? convertTimestamp(data.consentTimestamp) : undefined
    });
  }

  /**
   * Convert to Firestore-compatible format
   */
  toFirestore(): Record<string, any> {
    return {
      userId: this.userId,
      locationHistory: this.locationHistory.map(point => ({
        ...point,
        timestamp: point.timestamp instanceof Date
          ? Timestamp.fromDate(point.timestamp)
          : point.timestamp
      })),
      lastUpdated: this.lastUpdated instanceof Date
        ? Timestamp.fromDate(this.lastUpdated)
        : this.lastUpdated,
      createdAt: this.createdAt instanceof Date
        ? Timestamp.fromDate(this.createdAt)
        : this.createdAt,
      currentLocation: this.currentLocation,
      dataRetentionDays: this.dataRetentionDays || 90,
      consentGiven: this.consentGiven || false,
      consentTimestamp: this.consentTimestamp
        ? (this.consentTimestamp instanceof Date
          ? Timestamp.fromDate(this.consentTimestamp)
          : this.consentTimestamp)
        : null
    };
  }

  /**
   * Add a new location data point
   */
  addLocationPoint(point: Omit<GeolocationDataPoint, 'timestamp'>): void {
    const newPoint: GeolocationDataPoint = {
      ...point,
      timestamp: new Date()
    };

    this.locationHistory.push(newPoint);
    this.lastUpdated = new Date();

    // Update current location
    this.currentLocation = {
      countryCode: point.countryCode,
      countryName: point.countryName,
      city: point.city,
      detectedCurrency: point.detectedCurrency || null
    };
  }

  /**
   * Get location history within date range
   */
  getLocationHistory(startDate?: Date, endDate?: Date): GeolocationDataPoint[] {
    if (!startDate && !endDate) {
      return this.locationHistory;
    }

    return this.locationHistory.filter(point => {
      const pointDate = point.timestamp instanceof Date
        ? point.timestamp
        : (point.timestamp as Timestamp).toDate();

      if (startDate && pointDate < startDate) return false;
      if (endDate && pointDate > endDate) return false;
      return true;
    });
  }

  /**
   * Clean up old location data based on retention policy
   */
  cleanupOldData(): number {
    const retentionDays = this.dataRetentionDays || 90;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const initialLength = this.locationHistory.length;
    this.locationHistory = this.locationHistory.filter(point => {
      const pointDate = point.timestamp instanceof Date
        ? point.timestamp
        : (point.timestamp as Timestamp).toDate();
      return pointDate >= cutoffDate;
    });

    const removed = initialLength - this.locationHistory.length;
    if (removed > 0) {
      this.lastUpdated = new Date();
    }

    return removed;
  }
}

