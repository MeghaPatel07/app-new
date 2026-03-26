import {
  collection,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  QueryConstraint
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { OfferingsModelClass } from '../models/OfferingsModel';

export class OfferingsService {
  private static collectionName = 'offerings';

  // Get all offerings from Firestore
  static async getAllOfferings(): Promise<OfferingsModelClass[]> {
    try {
      console.log('Fetching all offerings from Firestore...');
      const offeringsRef = collection(db, this.collectionName);
      const querySnapshot = await getDocs(offeringsRef);

      const offerings: OfferingsModelClass[] = [];
      querySnapshot.forEach((doc) => {
        try {
          const offering = OfferingsModelClass.fromFirestore(doc);
          offerings.push(offering);
        } catch (error) {
          console.error(`Error parsing offering document ${doc.id}:`, error);
        }
      });

      console.log(`Successfully fetched ${offerings.length} offerings`);
      return offerings;
    } catch (error) {
      console.error('Error fetching offerings:', error);
      throw error;
    }
  }

  // Get only active offerings
  static async getActiveOfferings(): Promise<OfferingsModelClass[]> {
    try {
      console.log('Fetching active offerings from Firestore...');
      const offeringsRef = collection(db, this.collectionName);
      // Simplified query without orderBy to avoid index issues
      const q = query(offeringsRef, where('isActive', '==', true));
      const querySnapshot = await getDocs(q);

      const offerings: OfferingsModelClass[] = [];
      querySnapshot.forEach((doc) => {
        try {
          const offering = OfferingsModelClass.fromFirestore(doc);
          offerings.push(offering);
        } catch (error) {
          console.error(`Error parsing offering document ${doc.id}:`, error);
        }
      });

      // Sort client-side to avoid index requirements
      const sortedOfferings = offerings.sort((a, b) => a.priorityNo - b.priorityNo);

      console.log(`Successfully fetched ${sortedOfferings.length} active offerings`);
      return sortedOfferings;
    } catch (error) {
      console.error('Error fetching active offerings:', error);
      // If the query fails (e.g., missing index), fall back to getting all and filtering
      const allOfferings = await this.getAllOfferings();
      return allOfferings.filter(offering => offering.isActive);
    }
  }

  // Get offering by ID
  static async getOfferingById(id: string): Promise<OfferingsModelClass | null> {
    try {
      console.log(`Fetching offering with ID: ${id}`);
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const offering = OfferingsModelClass.fromFirestore(docSnap);
        console.log(`Successfully fetched offering: ${offering.name}`);
        return offering;
      } else {
        console.log(`No offering found with ID: ${id}`);
        return null;
      }
    } catch (error) {
      console.error(`Error fetching offering with ID ${id}:`, error);
      throw error;
    }
  }

  // Get offerings by tag
  static async getOfferingsByTag(tag: string): Promise<OfferingsModelClass[]> {
    try {
      console.log(`Fetching offerings with tag: ${tag}`);
      const offeringsRef = collection(db, this.collectionName);
      // Simplified query without orderBy to avoid index issues
      const q = query(
        offeringsRef,
        where('tags', 'array-contains', tag),
        where('isActive', '==', true)
      );
      const querySnapshot = await getDocs(q);

      const offerings: OfferingsModelClass[] = [];
      querySnapshot.forEach((doc) => {
        try {
          const offering = OfferingsModelClass.fromFirestore(doc);
          offerings.push(offering);
        } catch (error) {
          console.error(`Error parsing offering document ${doc.id}:`, error);
        }
      });

      // Sort client-side to avoid index requirements
      const sortedOfferings = offerings.sort((a, b) => a.priorityNo - b.priorityNo);

      console.log(`Successfully fetched ${sortedOfferings.length} offerings with tag: ${tag}`);
      return sortedOfferings;
    } catch (error) {
      console.error(`Error fetching offerings by tag ${tag}:`, error);
      // If the query fails, fall back to getting all and filtering
      const allOfferings = await this.getActiveOfferings();
      return allOfferings.filter(offering => offering.hasTag(tag));
    }
  }

  // Get offerings by combination
  static async getOfferingsByCombination(combination: string): Promise<OfferingsModelClass[]> {
    try {
      console.log(`Fetching offerings with combination: ${combination}`);
      const offeringsRef = collection(db, this.collectionName);
      // Simplified query without orderBy to avoid index issues
      const q = query(
        offeringsRef,
        where('combinationNames', 'array-contains', combination),
        where('isActive', '==', true)
      );
      const querySnapshot = await getDocs(q);

      const offerings: OfferingsModelClass[] = [];
      querySnapshot.forEach((doc) => {
        try {
          const offering = OfferingsModelClass.fromFirestore(doc);
          offerings.push(offering);
        } catch (error) {
          console.error(`Error parsing offering document ${doc.id}:`, error);
        }
      });

      // Sort client-side to avoid index requirements
      const sortedOfferings = offerings.sort((a, b) => a.priorityNo - b.priorityNo);

      console.log(`Successfully fetched ${sortedOfferings.length} offerings with combination: ${combination}`);
      return sortedOfferings;
    } catch (error) {
      console.error(`Error fetching offerings by combination ${combination}:`, error);
      // If the query fails, fall back to getting all and filtering
      const allOfferings = await this.getActiveOfferings();
      return allOfferings.filter(offering => offering.hasCombination(combination));
    }
  }

  // Get featured offerings (top priority)
  static async getFeaturedOfferings(limitCount: number = 6): Promise<OfferingsModelClass[]> {
    try {
      console.log(`Fetching top ${limitCount} featured offerings...`);
      const offeringsRef = collection(db, this.collectionName);
      // Simplified query without orderBy to avoid index issues
      const q = query(
        offeringsRef,
        where('isActive', '==', true),
        limit(limitCount * 2) // Get more to ensure we have enough after filtering
      );
      const querySnapshot = await getDocs(q);

      const offerings: OfferingsModelClass[] = [];
      querySnapshot.forEach((doc) => {
        try {
          const offering = OfferingsModelClass.fromFirestore(doc);
          offerings.push(offering);
        } catch (error) {
          console.error(`Error parsing offering document ${doc.id}:`, error);
        }
      });

      // Sort client-side to avoid index requirements
      const sortedOfferings = offerings.sort((a, b) => a.priorityNo - b.priorityNo).slice(0, limitCount);

      console.log(`Successfully fetched ${sortedOfferings.length} featured offerings`);
      return sortedOfferings;
    } catch (error) {
      console.error('Error fetching featured offerings:', error);
      // If the query fails, fall back to getting all and filtering
      const allOfferings = await this.getActiveOfferings();
      return allOfferings.slice(0, limitCount);
    }
  }

  // Search offerings by name or description
  static async searchOfferings(searchTerm: string): Promise<OfferingsModelClass[]> {
    try {
      console.log(`Searching offerings for: ${searchTerm}`);
      // Firestore doesn't support full-text search, so we'll get all active offerings
      // and filter them client-side
      const allOfferings = await this.getActiveOfferings();
      const lowerSearchTerm = searchTerm.toLowerCase();

      const matchingOfferings = allOfferings.filter(offering =>
        offering.name.toLowerCase().includes(lowerSearchTerm) ||
        offering.desc.toLowerCase().includes(lowerSearchTerm) ||
        offering.tags.some(tag => tag.toLowerCase().includes(lowerSearchTerm)) ||
        offering.combinationNames.some(combo => combo.toLowerCase().includes(lowerSearchTerm))
      );

      console.log(`Found ${matchingOfferings.length} offerings matching: ${searchTerm}`);
      return matchingOfferings;
    } catch (error) {
      console.error(`Error searching offerings for ${searchTerm}:`, error);
      throw error;
    }
  }

  // Create new offering
  static async createOffering(offeringData: Omit<OfferingsModelClass, 'docId'>): Promise<string> {
    try {
      console.log('Creating new offering:', offeringData.name);
      const offeringsRef = collection(db, this.collectionName);
      const offering = new OfferingsModelClass({ ...offeringData, docId: '' });
      const docRef = await addDoc(offeringsRef, offering.toJson());

      console.log(`Successfully created offering with ID: ${docRef.id}`);
      return docRef.id;
    } catch (error) {
      console.error('Error creating offering:', error);
      throw error;
    }
  }

  // Update existing offering
  static async updateOffering(id: string, updates: Partial<OfferingsModelClass>): Promise<void> {
    try {
      console.log(`Updating offering with ID: ${id}`);
      const docRef = doc(db, this.collectionName, id);

      // Convert updates to Firestore format
      const firestoreUpdates: Record<string, any> = {};
      Object.entries(updates).forEach(([key, value]) => {
        if (key === 'createdAt' && value instanceof Date) {
          firestoreUpdates[key] = value;
        } else {
          firestoreUpdates[key] = value;
        }
      });

      await updateDoc(docRef, firestoreUpdates);
      console.log(`Successfully updated offering with ID: ${id}`);
    } catch (error) {
      console.error(`Error updating offering with ID ${id}:`, error);
      throw error;
    }
  }

  // Delete offering
  static async deleteOffering(id: string): Promise<void> {
    try {
      console.log(`Deleting offering with ID: ${id}`);
      const docRef = doc(db, this.collectionName, id);
      await deleteDoc(docRef);
      console.log(`Successfully deleted offering with ID: ${id}`);
    } catch (error) {
      console.error(`Error deleting offering with ID ${id}:`, error);
      throw error;
    }
  }

  // Get offerings with custom query
  static async getOfferingsWithQuery(constraints: QueryConstraint[]): Promise<OfferingsModelClass[]> {
    try {
      console.log('Fetching offerings with custom query...');
      const offeringsRef = collection(db, this.collectionName);
      const q = query(offeringsRef, ...constraints);
      const querySnapshot = await getDocs(q);

      const offerings: OfferingsModelClass[] = [];
      querySnapshot.forEach((doc) => {
        try {
          const offering = OfferingsModelClass.fromFirestore(doc);
          offerings.push(offering);
        } catch (error) {
          console.error(`Error parsing offering document ${doc.id}:`, error);
        }
      });

      console.log(`Successfully fetched ${offerings.length} offerings with custom query`);
      return offerings;
    } catch (error) {
      console.error('Error fetching offerings with custom query:', error);
      throw error;
    }
  }
}

export default OfferingsService;
