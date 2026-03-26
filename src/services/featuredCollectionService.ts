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
import { FeaturedCollectionModelClass } from '../models/FeaturedCollectionModel';

export class FeaturedCollectionService {
  private static collectionName = 'featuredCollection';

  // Get all featured collections from Firestore
  static async getAllFeaturedCollections(): Promise<FeaturedCollectionModelClass[]> {
    try {
      console.log('Fetching all featured collections from Firestore...');
      const collectionsRef = collection(db, this.collectionName);
      const querySnapshot = await getDocs(collectionsRef);
      
      const collections: FeaturedCollectionModelClass[] = [];
      querySnapshot.forEach((doc) => {
        try {
          const collection = FeaturedCollectionModelClass.fromFirestore(doc);
          collections.push(collection);
        } catch (error) {
          console.error(`Error parsing featured collection document ${doc.id}:`, error);
        }
      });

      console.log(`Successfully fetched ${collections.length} featured collections`);
      return collections;
    } catch (error) {
      console.error('Error fetching featured collections:', error);
      throw error;
    }
  }

  // Get only active featured collections
  static async getActiveFeaturedCollections(): Promise<FeaturedCollectionModelClass[]> {
    try {
      console.log('Fetching active featured collections from Firestore...');
      const collectionsRef = collection(db, this.collectionName);
      // Simplified query without orderBy to avoid index issues
      const q = query(collectionsRef, where('isActive', '==', true));
      const querySnapshot = await getDocs(q);
      
      const collections: FeaturedCollectionModelClass[] = [];
      querySnapshot.forEach((doc) => {
        try {
          const collection = FeaturedCollectionModelClass.fromFirestore(doc);
          collections.push(collection);
        } catch (error) {
          console.error(`Error parsing featured collection document ${doc.id}:`, error);
        }
      });

      // Sort client-side to avoid index requirements
      const sortedCollections = collections.sort((a, b) => a.priorityNo - b.priorityNo);

      console.log(`Successfully fetched ${sortedCollections.length} active featured collections`);
      return sortedCollections;
    } catch (error) {
      console.error('Error fetching active featured collections:', error);
      // If the query fails (e.g., missing index), fall back to getting all and filtering
      const allCollections = await this.getAllFeaturedCollections();
      return allCollections.filter(collection => collection.isActive).sort((a, b) => a.priorityNo - b.priorityNo);
    }
  }

  // Get featured collection by ID
  static async getFeaturedCollectionById(id: string): Promise<FeaturedCollectionModelClass | null> {
    try {
      console.log(`Fetching featured collection with ID: ${id}`);
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const collection = FeaturedCollectionModelClass.fromFirestore(docSnap);
        console.log(`Successfully fetched featured collection: ${collection.name}`);
        return collection;
      } else {
        console.log(`No featured collection found with ID: ${id}`);
        return null;
      }
    } catch (error) {
      console.error(`Error fetching featured collection with ID ${id}:`, error);
      throw error;
    }
  }

  // Get featured collections by tag
  static async getFeaturedCollectionsByTag(tag: string): Promise<FeaturedCollectionModelClass[]> {
    try {
      console.log(`Fetching featured collections with tag: ${tag}`);
      const collectionsRef = collection(db, this.collectionName);
      // Simplified query without orderBy to avoid index issues
      const q = query(
        collectionsRef, 
        where('tag', '==', tag),
        where('isActive', '==', true)
      );
      const querySnapshot = await getDocs(q);
      
      const collections: FeaturedCollectionModelClass[] = [];
      querySnapshot.forEach((doc) => {
        try {
          const collection = FeaturedCollectionModelClass.fromFirestore(doc);
          collections.push(collection);
        } catch (error) {
          console.error(`Error parsing featured collection document ${doc.id}:`, error);
        }
      });

      // Sort client-side to avoid index requirements
      const sortedCollections = collections.sort((a, b) => a.priorityNo - b.priorityNo);

      console.log(`Successfully fetched ${sortedCollections.length} featured collections with tag: ${tag}`);
      return sortedCollections;
    } catch (error) {
      console.error(`Error fetching featured collections by tag ${tag}:`, error);
      // If the query fails, fall back to getting all and filtering
      const allCollections = await this.getActiveFeaturedCollections();
      return allCollections.filter(collection => collection.tag.toLowerCase() === tag.toLowerCase());
    }
  }

  // Get featured collections (top priority)
  static async getFeaturedCollections(limitCount: number = 6): Promise<FeaturedCollectionModelClass[]> {
    try {
      console.log(`Fetching top ${limitCount} featured collections...`);
      const collectionsRef = collection(db, this.collectionName);
      // Simplified query without orderBy to avoid index issues
      const q = query(
        collectionsRef, 
        where('isActive', '==', true),
        limit(limitCount * 2) // Get more to ensure we have enough after filtering
      );
      const querySnapshot = await getDocs(q);
      
      const collections: FeaturedCollectionModelClass[] = [];
      querySnapshot.forEach((doc) => {
        try {
          const collection = FeaturedCollectionModelClass.fromFirestore(doc);
          collections.push(collection);
        } catch (error) {
          console.error(`Error parsing featured collection document ${doc.id}:`, error);
        }
      });

      // Sort client-side to avoid index requirements
      const sortedCollections = collections.sort((a, b) => a.priorityNo - b.priorityNo).slice(0, limitCount);

      console.log(`Successfully fetched ${sortedCollections.length} featured collections`);
      return sortedCollections;
    } catch (error) {
      console.error('Error fetching featured collections:', error);
      // If the query fails, fall back to getting all and filtering
      const allCollections = await this.getActiveFeaturedCollections();
      return allCollections.slice(0, limitCount);
    }
  }

  // Search featured collections by name or tag
  static async searchFeaturedCollections(searchTerm: string): Promise<FeaturedCollectionModelClass[]> {
    try {
      console.log(`Searching featured collections for: ${searchTerm}`);
      // Firestore doesn't support full-text search, so we'll get all active collections
      // and filter them client-side
      const allCollections = await this.getActiveFeaturedCollections();
      const lowerSearchTerm = searchTerm.toLowerCase();
      
      const matchingCollections = allCollections.filter(collection => 
        collection.name.toLowerCase().includes(lowerSearchTerm) ||
        collection.tag.toLowerCase().includes(lowerSearchTerm)
      );

      console.log(`Found ${matchingCollections.length} featured collections matching: ${searchTerm}`);
      return matchingCollections;
    } catch (error) {
      console.error(`Error searching featured collections for ${searchTerm}:`, error);
      throw error;
    }
  }

  // Create new featured collection
  static async createFeaturedCollection(collectionData: Omit<FeaturedCollectionModelClass, 'docId'>): Promise<string> {
    try {
      console.log('Creating new featured collection:', collectionData.name);
      const collectionsRef = collection(db, this.collectionName);
      const newCollection = new FeaturedCollectionModelClass({ ...collectionData, docId: '' });
      const docRef = await addDoc(collectionsRef, newCollection.toJson());
      
      console.log(`Successfully created featured collection with ID: ${docRef.id}`);
      return docRef.id;
    } catch (error) {
      console.error('Error creating featured collection:', error);
      throw error;
    }
  }

  // Update existing featured collection
  static async updateFeaturedCollection(id: string, updates: Partial<FeaturedCollectionModelClass>): Promise<void> {
    try {
      console.log(`Updating featured collection with ID: ${id}`);
      const docRef = doc(db, this.collectionName, id);
      
      // Convert updates to Firestore format
      const firestoreUpdates: Record<string, any> = {};
      Object.entries(updates).forEach(([key, value]) => {
        if (key !== 'docId') {
          firestoreUpdates[key] = value;
        }
      });
      
      await updateDoc(docRef, firestoreUpdates);
      console.log(`Successfully updated featured collection with ID: ${id}`);
    } catch (error) {
      console.error(`Error updating featured collection with ID ${id}:`, error);
      throw error;
    }
  }

  // Delete featured collection
  static async deleteFeaturedCollection(id: string): Promise<void> {
    try {
      console.log(`Deleting featured collection with ID: ${id}`);
      const docRef = doc(db, this.collectionName, id);
      await deleteDoc(docRef);
      console.log(`Successfully deleted featured collection with ID: ${id}`);
    } catch (error) {
      console.error(`Error deleting featured collection with ID ${id}:`, error);
      throw error;
    }
  }

  // Get featured collections with custom query
  static async getFeaturedCollectionsWithQuery(constraints: QueryConstraint[]): Promise<FeaturedCollectionModelClass[]> {
    try {
      console.log('Fetching featured collections with custom query...');
      const collectionsRef = collection(db, this.collectionName);
      const q = query(collectionsRef, ...constraints);
      const querySnapshot = await getDocs(q);
      
      const collections: FeaturedCollectionModelClass[] = [];
      querySnapshot.forEach((doc) => {
        try {
          const collection = FeaturedCollectionModelClass.fromFirestore(doc);
          collections.push(collection);
        } catch (error) {
          console.error(`Error parsing featured collection document ${doc.id}:`, error);
        }
      });

      console.log(`Successfully fetched ${collections.length} featured collections with custom query`);
      return collections;
    } catch (error) {
      console.error('Error fetching featured collections with custom query:', error);
      throw error;
    }
  }
}

export default FeaturedCollectionService;

