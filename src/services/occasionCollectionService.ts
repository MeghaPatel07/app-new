import { 
  collection, 
  getDocs, 
  query, 
  where 
} from 'firebase/firestore';
import { db } from '../firebase/config';

export interface OccasionCollectionModel {
  id: string;
  name: string;
  image: string;
  tag: string;
  priorityNo: number;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export class OccasionCollectionService {
  private static collectionName = 'occasionCollection';

  static async getActiveOccasions(): Promise<OccasionCollectionModel[]> {
    try {
      console.log('Fetching active occasions from Firestore...');
      const collectionsRef = collection(db, this.collectionName);
      const q = query(collectionsRef, where('isActive', '==', true));
      const querySnapshot = await getDocs(q);
      
      const occasions: OccasionCollectionModel[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        occasions.push({
          id: doc.id,
          name: data.name || '',
          image: data.image || '',
          tag: data.tag || '',
          priorityNo: typeof data.priorityNo === 'number' ? data.priorityNo : 0,
          isActive: data.isActive !== false,
          createdAt: data.createdAt || Date.now(),
          updatedAt: data.updatedAt || Date.now(),
        });
      });

      // Sort client-side
      return occasions.sort((a, b) => a.priorityNo - b.priorityNo);
    } catch (error) {
      console.error('Error fetching occasion collection:', error);
      throw error;
    }
  }
}

export default OccasionCollectionService;
