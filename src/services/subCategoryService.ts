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
import { SubCategoryModelClass } from '../models/SubCategoryModel';

export class SubCategoryService {
  private static collectionName = 'subcategories';

  // Get all subcategories from Firestore
  static async getAllSubCategories(): Promise<SubCategoryModelClass[]> {
    try {
      console.log('Fetching all subcategories from Firestore...');
      const subCategoriesRef = collection(db, this.collectionName);
      const querySnapshot = await getDocs(subCategoriesRef);

      const subCategories: SubCategoryModelClass[] = [];
      querySnapshot.forEach((doc) => {
        try {
          const subCategory = SubCategoryModelClass.fromFirestore(doc);
          subCategories.push(subCategory);
        } catch (error) {
          console.error(`Error parsing subcategory document ${doc.id}:`, error);
        }
      });

      console.log(`Successfully fetched ${subCategories.length} subcategories`);
      return subCategories;
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      throw error;
    }
  }

  // Get only active subcategories
  static async getActiveSubCategories(): Promise<SubCategoryModelClass[]> {
    try {
      console.log('Fetching active subcategories from Firestore...');
      const subCategoriesRef = collection(db, this.collectionName);
      const q = query(subCategoriesRef, where('isActive', '==', true));
      const querySnapshot = await getDocs(q);

      const subCategories: SubCategoryModelClass[] = [];
      querySnapshot.forEach((doc) => {
        try {
          const subCategory = SubCategoryModelClass.fromFirestore(doc);
          subCategories.push(subCategory);
        } catch (error) {
          console.error(`Error parsing subcategory document ${doc.id}:`, error);
        }
      });

      console.log(`Successfully fetched ${subCategories.length} active subcategories`);
      return subCategories;
    } catch (error) {
      console.error('Error fetching active subcategories:', error);
      // If the query fails, fall back to getting all and filtering
      const allSubCategories = await this.getAllSubCategories();
      return allSubCategories.filter(subCategory => subCategory.isActive);
    }
  }

  // Get subcategory by ID
  static async getSubCategoryById(id: string): Promise<SubCategoryModelClass | null> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const subCategory = SubCategoryModelClass.fromFirestore(docSnap);
        console.log(`Successfully fetched subcategory: ${subCategory.name}`);
        return subCategory;
      } else {
        console.log(`No subcategory found with ID: ${id}`);
        return null;
      }
    } catch (error) {
      console.error(`Error fetching subcategory with ID ${id}:`, error);
      throw error;
    }
  }

  // Get subcategories by offering ID
  static async getSubCategoriesByOfferingId(offeringId: string): Promise<SubCategoryModelClass[]> {
    try {
      console.log(`Fetching subcategories for offering ID: ${offeringId}`);
      const subCategoriesRef = collection(db, this.collectionName);
      const q = query(
        subCategoriesRef,
        where('offeringId', '==', offeringId),
        where('isActive', '==', true)
      );
      const querySnapshot = await getDocs(q);

      const subCategories: SubCategoryModelClass[] = [];
      querySnapshot.forEach((doc) => {
        try {
          const subCategory = SubCategoryModelClass.fromFirestore(doc);
          subCategories.push(subCategory);
        } catch (error) {
          console.error(`Error parsing subcategory document ${doc.id}:`, error);
        }
      });

      console.log(`Successfully fetched ${subCategories.length} subcategories for offering: ${offeringId}`);
      return subCategories;
    } catch (error) {
      console.error(`Error fetching subcategories by offering ID ${offeringId}:`, error);
      // If the query fails, fall back to getting all and filtering
      const allSubCategories = await this.getActiveSubCategories();
      return allSubCategories.filter(subCategory => subCategory.offeringId === offeringId);
    }
  }

  // Get subcategories by tag
  static async getSubCategoriesByTag(tag: string): Promise<SubCategoryModelClass[]> {
    try {
      console.log(`Fetching subcategories with tag: ${tag}`);
      const subCategoriesRef = collection(db, this.collectionName);
      const q = query(
        subCategoriesRef,
        where('tags', 'array-contains', tag),
        where('isActive', '==', true)
      );
      const querySnapshot = await getDocs(q);

      const subCategories: SubCategoryModelClass[] = [];
      querySnapshot.forEach((doc) => {
        try {
          const subCategory = SubCategoryModelClass.fromFirestore(doc);
          subCategories.push(subCategory);
        } catch (error) {
          console.error(`Error parsing subcategory document ${doc.id}:`, error);
        }
      });

      console.log(`Successfully fetched ${subCategories.length} subcategories with tag: ${tag}`);
      return subCategories;
    } catch (error) {
      console.error(`Error fetching subcategories by tag ${tag}:`, error);
      // If the query fails, fall back to getting all and filtering
      const allSubCategories = await this.getActiveSubCategories();
      return allSubCategories.filter(subCategory => subCategory.hasTag(tag));
    }
  }

  // Get subcategories by combination
  static async getSubCategoriesByCombination(combination: string): Promise<SubCategoryModelClass[]> {
    try {
      console.log(`Fetching subcategories with combination: ${combination}`);
      const subCategoriesRef = collection(db, this.collectionName);
      const q = query(
        subCategoriesRef,
        where('combinationNames', 'array-contains', combination),
        where('isActive', '==', true)
      );
      const querySnapshot = await getDocs(q);

      const subCategories: SubCategoryModelClass[] = [];
      querySnapshot.forEach((doc) => {
        try {
          const subCategory = SubCategoryModelClass.fromFirestore(doc);
          subCategories.push(subCategory);
        } catch (error) {
          console.error(`Error parsing subcategory document ${doc.id}:`, error);
        }
      });

      console.log(`Successfully fetched ${subCategories.length} subcategories with combination: ${combination}`);
      return subCategories;
    } catch (error) {
      console.error(`Error fetching subcategories by combination ${combination}:`, error);
      // If the query fails, fall back to getting all and filtering
      const allSubCategories = await this.getActiveSubCategories();
      return allSubCategories.filter(subCategory => subCategory.hasCombination(combination));
    }
  }

  // Get subcategories by price range
  static async getSubCategoriesByPriceRange(minPrice?: number, maxPrice?: number): Promise<SubCategoryModelClass[]> {
    try {
      console.log(`Fetching subcategories with price range: ${minPrice} - ${maxPrice}`);
      const subCategoriesRef = collection(db, this.collectionName);

      // Build query constraints
      const constraints: QueryConstraint[] = [where('isActive', '==', true)];

      if (minPrice !== undefined) {
        constraints.push(where('minPrice', '>=', minPrice));
      }
      if (maxPrice !== undefined) {
        constraints.push(where('maxPrice', '<=', maxPrice));
      }

      const q = query(subCategoriesRef, ...constraints);
      const querySnapshot = await getDocs(q);

      const subCategories: SubCategoryModelClass[] = [];
      querySnapshot.forEach((doc) => {
        try {
          const subCategory = SubCategoryModelClass.fromFirestore(doc);
          subCategories.push(subCategory);
        } catch (error) {
          console.error(`Error parsing subcategory document ${doc.id}:`, error);
        }
      });

      console.log(`Successfully fetched ${subCategories.length} subcategories in price range`);
      return subCategories;
    } catch (error) {
      console.error(`Error fetching subcategories by price range:`, error);
      // If the query fails, fall back to getting all and filtering client-side
      const allSubCategories = await this.getActiveSubCategories();
      return allSubCategories.filter(subCategory => {
        if (minPrice && subCategory.maxPrice && subCategory.maxPrice < minPrice) {
          return false;
        }
        if (maxPrice && subCategory.minPrice && subCategory.minPrice > maxPrice) {
          return false;
        }
        return true;
      });
    }
  }

  // Search subcategories by name or description
  static async searchSubCategories(searchTerm: string): Promise<SubCategoryModelClass[]> {
    try {
      console.log(`Searching subcategories for: ${searchTerm}`);
      // Firestore doesn't support full-text search, so we'll get all active subcategories
      // and filter them client-side
      const allSubCategories = await this.getActiveSubCategories();
      const lowerSearchTerm = searchTerm.toLowerCase();

      const matchingSubCategories = allSubCategories.filter(subCategory =>
        subCategory.name.toLowerCase().includes(lowerSearchTerm) ||
        subCategory.tags.some(tag => tag.toLowerCase().includes(lowerSearchTerm)) ||
        subCategory.combinationNames.some(combo => combo.toLowerCase().includes(lowerSearchTerm)) ||
        Object.keys(subCategory.allData).some(key => key.toLowerCase().includes(lowerSearchTerm)) ||
        Object.values(subCategory.allData).some(values =>
          values.some(value => value.toLowerCase().includes(lowerSearchTerm))
        )
      );

      console.log(`Found ${matchingSubCategories.length} subcategories matching: ${searchTerm}`);
      return matchingSubCategories;
    } catch (error) {
      console.error(`Error searching subcategories for ${searchTerm}:`, error);
      throw error;
    }
  }

  // Create new subcategory
  static async createSubCategory(subCategoryData: Omit<SubCategoryModelClass, 'docId'>): Promise<string> {
    try {
      console.log('Creating new subcategory:', subCategoryData.name);
      const subCategoriesRef = collection(db, this.collectionName);
      const subCategory = new SubCategoryModelClass({ ...subCategoryData, docId: '' });
      const docRef = await addDoc(subCategoriesRef, subCategory.toJson());

      console.log(`Successfully created subcategory with ID: ${docRef.id}`);
      return docRef.id;
    } catch (error) {
      console.error('Error creating subcategory:', error);
      throw error;
    }
  }

  // Update existing subcategory
  static async updateSubCategory(id: string, updates: Partial<SubCategoryModelClass>): Promise<void> {
    try {
      console.log(`Updating subcategory with ID: ${id}`);
      const docRef = doc(db, this.collectionName, id);

      // Convert updates to Firestore format
      const firestoreUpdates: Record<string, any> = {};
      Object.entries(updates).forEach(([key, value]) => {
        firestoreUpdates[key] = value;
      });

      await updateDoc(docRef, firestoreUpdates);
      console.log(`Successfully updated subcategory with ID: ${id}`);
    } catch (error) {
      console.error(`Error updating subcategory with ID ${id}:`, error);
      throw error;
    }
  }

  // Delete subcategory
  static async deleteSubCategory(id: string): Promise<void> {
    try {
      console.log(`Deleting subcategory with ID: ${id}`);
      const docRef = doc(db, this.collectionName, id);
      await deleteDoc(docRef);
      console.log(`Successfully deleted subcategory with ID: ${id}`);
    } catch (error) {
      console.error(`Error deleting subcategory with ID ${id}:`, error);
      throw error;
    }
  }

  // Get subcategories with custom query
  static async getSubCategoriesWithQuery(constraints: QueryConstraint[]): Promise<SubCategoryModelClass[]> {
    try {
      console.log('Fetching subcategories with custom query...');
      const subCategoriesRef = collection(db, this.collectionName);
      const q = query(subCategoriesRef, ...constraints);
      const querySnapshot = await getDocs(q);

      const subCategories: SubCategoryModelClass[] = [];
      querySnapshot.forEach((doc) => {
        try {
          const subCategory = SubCategoryModelClass.fromFirestore(doc);
          subCategories.push(subCategory);
        } catch (error) {
          console.error(`Error parsing subcategory document ${doc.id}:`, error);
        }
      });

      console.log(`Successfully fetched ${subCategories.length} subcategories with custom query`);
      return subCategories;
    } catch (error) {
      console.error('Error fetching subcategories with custom query:', error);
      throw error;
    }
  }

  // Get subcategories grouped by offering ID
  static async getSubCategoriesGroupedByOffering(): Promise<Record<string, SubCategoryModelClass[]>> {
    try {
      console.log('Fetching subcategories grouped by offering...');
      const allSubCategories = await this.getActiveSubCategories();

      const grouped: Record<string, SubCategoryModelClass[]> = {};
      allSubCategories.forEach(subCategory => {
        if (!grouped[subCategory.offeringId]) {
          grouped[subCategory.offeringId] = [];
        }
        grouped[subCategory.offeringId].push(subCategory);
      });

      console.log(`Successfully grouped subcategories by ${Object.keys(grouped).length} offerings`);
      return grouped;
    } catch (error) {
      console.error('Error fetching subcategories grouped by offering:', error);
      throw error;
    }
  }

  // Get available filter options
  static async getFilterOptions(): Promise<{
    tags: string[];
    combinations: string[];
    offeringIds: string[];
    priceRange: { min: number | null; max: number | null };
    allDataKeys: string[];
  }> {
    try {
      console.log('Fetching filter options...');
      const allSubCategories = await this.getActiveSubCategories();

      const tagsSet = new Set<string>();
      const combinationsSet = new Set<string>();
      const offeringIdsSet = new Set<string>();
      const allDataKeysSet = new Set<string>();
      let minPrice: number | null = null;
      let maxPrice: number | null = null;

      allSubCategories.forEach(subCategory => {
        // Collect tags
        subCategory.tags.forEach(tag => tagsSet.add(tag));

        // Collect combinations
        subCategory.combinationNames.forEach(combo => combinationsSet.add(combo));

        // Collect offering IDs
        if (subCategory.offeringId) {
          offeringIdsSet.add(subCategory.offeringId);
        }

        // Collect allData keys
        Object.keys(subCategory.allData).forEach(key => allDataKeysSet.add(key));

        // Calculate price range
        if (subCategory.minPrice !== undefined) {
          minPrice = minPrice === null ? subCategory.minPrice : Math.min(minPrice, subCategory.minPrice);
        }
        if (subCategory.maxPrice !== undefined) {
          maxPrice = maxPrice === null ? subCategory.maxPrice : Math.max(maxPrice, subCategory.maxPrice);
        }
      });

      const filterOptions = {
        tags: Array.from(tagsSet).sort(),
        combinations: Array.from(combinationsSet).sort(),
        offeringIds: Array.from(offeringIdsSet).sort(),
        priceRange: { min: minPrice, max: maxPrice },
        allDataKeys: Array.from(allDataKeysSet).sort(),
      };

      console.log('Successfully fetched filter options:', filterOptions);
      return filterOptions;
    } catch (error) {
      console.error('Error fetching filter options:', error);
      throw error;
    }
  }
}

export default SubCategoryService;