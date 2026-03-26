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
  limit as firestoreLimit,
  startAfter,
  getCountFromServer,
  QueryConstraint,
  QueryDocumentSnapshot,
  DocumentData
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { SubCategoryService } from './subCategoryService';
import { ProductModelClass } from '../models/ProductModel';

// Interface for paginated product results
export interface PaginatedProductsResult {
  products: ProductModelClass[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
  totalCount?: number;
}

export class ProductService {
  private static collectionName = 'products';

  // Get all products from Firestore
  static async getAllProducts(): Promise<ProductModelClass[]> {
    try {
      console.log('Fetching all products from Firestore...');
      const productsRef = collection(db, this.collectionName);
      const querySnapshot = await getDocs(productsRef);

      const products: ProductModelClass[] = [];
      querySnapshot.forEach((doc) => {
        try {
          const product = ProductModelClass.fromFirestore(doc);
          products.push(product);
        } catch (error) {
          console.error(`Error parsing product document ${doc.id}:`, error);
        }
      });

      console.log(`Successfully fetched ${products.length} products`);
      return products;
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }

  // Get only visible products
  static async getVisibleProducts(): Promise<ProductModelClass[]> {
    try {
      console.log('Fetching visible products from Firestore via single query...');

      // Optimization: Instead of looping through subcategories (N queries), 
      // fetch all products directly in one query and then filter/sort.
      const products = await this.getAllProducts();

      // If we still want to filter by active subcategories (original logic), 
      // we can fetch them once and filter the products in memory.
      const allSubCategories = await SubCategoryService.getActiveSubCategories();
      const activeSubCatIds = new Set(allSubCategories.map(sc => sc.docId));

      const visibleProducts = products.filter(product =>
        // Either it's in an active subcategory or we just show it if it's generally visible
        product.subcatIds.some(id => activeSubCatIds.has(id)) ||
        activeSubCatIds.has(product.defaultSubCatDocId)
      );

      // Sort by priorityNo on the client side
      visibleProducts.sort((a, b) => (a.priorityNo || 0) - (b.priorityNo || 0));

      console.log(`Successfully fetched ${visibleProducts.length} visible products (optimized)`);
      return visibleProducts;
    } catch (error) {
      console.error('Error fetching visible products:', error);
      // Fallback to all products if anything complex fails
      return this.getAllProducts();
    }
  }

  // Get product by ID
  static async getProductById(id: string): Promise<ProductModelClass | null> {
    try {
      console.log(`Fetching product with ID: ${id}`);
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const product = ProductModelClass.fromFirestore(docSnap);
        console.log(`Successfully fetched product: ${product.name}`);
        return product;
      } else {
        console.log(`No product found with ID: ${id}`);
        return null;
      }
    } catch (error) {
      console.error(`Error fetching product with ID ${id}:`, error);
      throw error;
    }
  }

  // Get products by main category
  static async getProductsByMainCategory(categoryId: string): Promise<ProductModelClass[]> {
    try {
      console.log(`Fetching products for main category (optimized): ${categoryId}`);

      // Direct query by mainCatDocId is much more efficient than looping through subcategories
      const productsRef = collection(db, this.collectionName);
      const q = query(productsRef, where('mainCatDocId', '==', categoryId));
      const querySnapshot = await getDocs(q);

      const products: ProductModelClass[] = [];
      querySnapshot.forEach((doc) => {
        try {
          const product = ProductModelClass.fromFirestore(doc);
          products.push(product);
        } catch (error) {
          console.error(`Error parsing product document ${doc.id}:`, error);
        }
      });

      // Sort by priorityNo on the client side
      products.sort((a, b) => (a.priorityNo || 0) - (b.priorityNo || 0));

      console.log(`Successfully fetched ${products.length} products for main category: ${categoryId}`);
      return products;
    } catch (error) {
      console.error(`Error fetching products by main category ${categoryId}:`, error);
      // If the query fails, fall back to getting all and filtering
      const allProducts = await this.getVisibleProducts();
      return allProducts.filter(product => product.mainCatDocId === categoryId);
    }
  }

  // Get products by subcategory
  static async getProductsBySubcategory(subcategoryId: string): Promise<ProductModelClass[]> {
    try {
      console.log(`Fetching products for subcategory: ${subcategoryId}`);

      // Check if the subcategory exists
      const subCategory = await SubCategoryService.getSubCategoryById(subcategoryId);
      if (!subCategory) {
        console.log(`Subcategory ${subcategoryId} not found`);
        return [];
      }

      // Fetch products regardless of isManualCreated flag
      const productsRef = collection(db, this.collectionName);

      // Try to query by subcatIds array first
      let q = query(
        productsRef,
        where('subcatIds', 'array-contains', subcategoryId)
      );

      let querySnapshot = await getDocs(q);
      const products: ProductModelClass[] = [];

      querySnapshot.forEach((doc) => {
        try {
          const product = ProductModelClass.fromFirestore(doc);
          products.push(product);
        } catch (error) {
          console.error(`Error parsing product document ${doc.id}:`, error);
        }
      });

      // Also try to query by defaultSubCatDocId
      try {
        q = query(
          productsRef,
          where('subCatDocId', '==', subcategoryId)
        );

        querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
          try {
            const product = ProductModelClass.fromFirestore(doc);
            // Avoid duplicates
            if (!products.find(p => p.docId === product.docId)) {
              products.push(product);
            }
          } catch (error) {
            console.error(`Error parsing product document ${doc.id}:`, error);
          }
        });
      } catch (error) {
        console.warn('Secondary subcategory query failed:', error);
      }

      // Sort by priorityNo on the client side
      products.sort((a, b) => (a.priorityNo || 0) - (b.priorityNo || 0));

      console.log(`Successfully fetched ${products.length} products for subcategory: ${subcategoryId}`);
      return products;
    } catch (error) {
      console.error(`Error fetching products by subcategory ${subcategoryId}:`, error);
      // If the query fails, fall back to getting all and filtering
      const allProducts = await this.getVisibleProducts();
      return allProducts.filter(product => product.isInSubcategory(subcategoryId));
    }
  }

  // Get products by vendor
  static async getProductsByVendor(vendorId: string): Promise<ProductModelClass[]> {
    try {
      console.log(`Fetching products for vendor: ${vendorId}`);
      const productsRef = collection(db, this.collectionName);
      const q = query(
        productsRef,
        where('vendorDocId', '==', vendorId)
      );
      const querySnapshot = await getDocs(q);

      const products: ProductModelClass[] = [];
      querySnapshot.forEach((doc) => {
        try {
          const product = ProductModelClass.fromFirestore(doc);
          products.push(product);
        } catch (error) {
          console.error(`Error parsing product document ${doc.id}:`, error);
        }
      });

      // Sort by priorityNo on the client side
      products.sort((a, b) => (a.priorityNo || 0) - (b.priorityNo || 0));

      console.log(`Successfully fetched ${products.length} products for vendor: ${vendorId}`);
      return products;
    } catch (error) {
      console.error(`Error fetching products by vendor ${vendorId}:`, error);
      // If the query fails, fall back to getting all and filtering
      const allProducts = await this.getVisibleProducts();
      return allProducts.filter(product => product.vendorDocId === vendorId);
    }
  }

  // Get products by tag
  static async getProductsByTag(tag: string): Promise<ProductModelClass[]> {
    try {
      console.log(`Fetching products with tag: ${tag}`);
      const productsRef = collection(db, this.collectionName);
      const q = query(
        productsRef,
        where('tags', 'array-contains', tag)
      );
      const querySnapshot = await getDocs(q);

      const products: ProductModelClass[] = [];
      querySnapshot.forEach((doc) => {
        try {
          const product = ProductModelClass.fromFirestore(doc);
          products.push(product);
        } catch (error) {
          console.error(`Error parsing product document ${doc.id}:`, error);
        }
      });

      // Sort by priorityNo on the client side
      products.sort((a, b) => (a.priorityNo || 0) - (b.priorityNo || 0));

      console.log(`Successfully fetched ${products.length} products with tag: ${tag}`);
      return products;
    } catch (error) {
      console.error(`Error fetching products by tag ${tag}:`, error);
      // If the query fails, fall back to getting all and filtering
      const allProducts = await this.getVisibleProducts();
      return allProducts.filter(product => product.hasTag(tag));
    }
  }

  // Get products by price range
  static async getProductsByPriceRange(minPrice?: number, maxPrice?: number): Promise<ProductModelClass[]> {
    try {
      console.log(`Fetching products with price range: ${minPrice} - ${maxPrice}`);
      const productsRef = collection(db, this.collectionName);

      // Build query constraints
      const constraints: QueryConstraint[] = [];

      if (minPrice !== undefined) {
        constraints.push(where('minPrice', '>=', minPrice));
      }
      if (maxPrice !== undefined) {
        constraints.push(where('maxPrice', '<=', maxPrice));
      }

      // Remove orderBy to avoid index requirements

      const q = query(productsRef, ...constraints);
      const querySnapshot = await getDocs(q);

      const products: ProductModelClass[] = [];
      querySnapshot.forEach((doc) => {
        try {
          const product = ProductModelClass.fromFirestore(doc);
          products.push(product);
        } catch (error) {
          console.error(`Error parsing product document ${doc.id}:`, error);
        }
      });

      // Sort by priorityNo on the client side
      products.sort((a, b) => (a.priorityNo || 0) - (b.priorityNo || 0));

      console.log(`Successfully fetched ${products.length} products in price range`);
      return products;
    } catch (error) {
      console.error(`Error fetching products by price range:`, error);
      // If the query fails, fall back to getting all and filtering client-side
      const allProducts = await this.getVisibleProducts();
      return allProducts.filter(product => {
        if (minPrice && product.maxPrice && product.maxPrice < minPrice) {
          return false;
        }
        if (maxPrice && product.minPrice && product.minPrice > maxPrice) {
          return false;
        }
        return true;
      });
    }
  }

  // Get top selling products
  static async getTopSellingProducts(limitCount: number = 10): Promise<ProductModelClass[]> {
    try {
      console.log(`Fetching top ${limitCount} selling products...`);
      const productsRef = collection(db, this.collectionName);
      const q = query(
        productsRef,
        where('topSelling', '==', true)
      );
      const querySnapshot = await getDocs(q);

      const products: ProductModelClass[] = [];
      querySnapshot.forEach((doc) => {
        try {
          const product = ProductModelClass.fromFirestore(doc);
          products.push(product);
        } catch (error) {
          console.error(`Error parsing product document ${doc.id}:`, error);
        }
      });

      // Sort by quantitySold on the client side and limit
      products.sort((a, b) => b.quantitySold - a.quantitySold);
      const limitedProducts = products.slice(0, limitCount);

      console.log(`Successfully fetched ${limitedProducts.length} top selling products`);
      return limitedProducts;
    } catch (error) {
      console.error('Error fetching top selling products:', error);
      // If the query fails, fall back to getting all and filtering
      const allProducts = await this.getVisibleProducts();
      return allProducts
        .filter(product => product.topSelling)
        .sort((a, b) => b.quantitySold - a.quantitySold)
        .slice(0, limitCount);
    }
  }

  // Get products with highest ratings
  static async getHighestRatedProducts(limitCount: number = 10): Promise<ProductModelClass[]> {
    try {
      console.log(`Fetching top ${limitCount} rated products...`);
      const productsRef = collection(db, this.collectionName);
      const q = query(productsRef);
      const querySnapshot = await getDocs(q);

      const products: ProductModelClass[] = [];
      querySnapshot.forEach((doc) => {
        try {
          const product = ProductModelClass.fromFirestore(doc);
          products.push(product);
        } catch (error) {
          console.error(`Error parsing product document ${doc.id}:`, error);
        }
      });

      // Sort by rating on the client side and limit
      products.sort((a, b) => b.rating - a.rating);
      const limitedProducts = products.slice(0, limitCount);

      console.log(`Successfully fetched ${limitedProducts.length} highest rated products`);
      return limitedProducts;
    } catch (error) {
      console.error('Error fetching highest rated products:', error);
      // If the query fails, fall back to getting all and filtering
      const allProducts = await this.getVisibleProducts();
      return allProducts
        .sort((a, b) => b.rating - a.rating)
        .slice(0, limitCount);
    }
  }

  // Get newest products
  static async getNewestProducts(limitCount: number = 10): Promise<ProductModelClass[]> {
    try {
      console.log(`Fetching ${limitCount} newest products...`);
      const productsRef = collection(db, this.collectionName);
      const q = query(productsRef);
      const querySnapshot = await getDocs(q);

      const products: ProductModelClass[] = [];
      querySnapshot.forEach((doc) => {
        try {
          const product = ProductModelClass.fromFirestore(doc);
          products.push(product);
        } catch (error) {
          console.error(`Error parsing product document ${doc.id}:`, error);
        }
      });

      // Sort by createdAt on the client side and limit
      products.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const limitedProducts = products.slice(0, limitCount);

      console.log(`Successfully fetched ${limitedProducts.length} newest products`);
      return limitedProducts;
    } catch (error) {
      console.error('Error fetching newest products:', error);
      // If the query fails, fall back to getting all and filtering
      const allProducts = await this.getVisibleProducts();
      return allProducts
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, limitCount);
    }
  }

  // Search products by name or description
  static async searchProducts(searchTerm: string): Promise<ProductModelClass[]> {
    try {
      console.log(`Searching products for: ${searchTerm}`);
      // Firestore doesn't support full-text search, so we'll get all visible products
      // and filter them client-side
      const allProducts = await this.getVisibleProducts();
      const lowerSearchTerm = searchTerm.toLowerCase();

      const matchingProducts = allProducts.filter(product =>
        product.name.toLowerCase().includes(lowerSearchTerm) ||
        product.lowerName.includes(lowerSearchTerm) ||
        product.description.toLowerCase().includes(lowerSearchTerm) ||
        product.tags.some(tag => tag.toLowerCase().includes(lowerSearchTerm)) ||
        product.combinationNames.some(combo => combo.toLowerCase().includes(lowerSearchTerm)) ||
        product.detailsList.some(detail => detail.toLowerCase().includes(lowerSearchTerm)) ||
        product.sku.toLowerCase().includes(lowerSearchTerm)
      );

      console.log(`Found ${matchingProducts.length} products matching: ${searchTerm}`);
      return matchingProducts;
    } catch (error) {
      console.error(`Error searching products for ${searchTerm}:`, error);
      throw error;
    }
  }

  // Create new product
  static async createProduct(productData: Omit<ProductModelClass, 'docId'>): Promise<string> {
    try {
      console.log('Creating new product:', productData.name);
      const productsRef = collection(db, this.collectionName);
      const product = new ProductModelClass({ ...productData, docId: '' });
      const docRef = await addDoc(productsRef, product.toJson());

      console.log(`Successfully created product with ID: ${docRef.id}`);
      return docRef.id;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  }

  // Update existing product
  static async updateProduct(id: string, updates: Partial<ProductModelClass>): Promise<void> {
    try {
      console.log(`Updating product with ID: ${id}`);
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
      console.log(`Successfully updated product with ID: ${id}`);
    } catch (error) {
      console.error(`Error updating product with ID ${id}:`, error);
      throw error;
    }
  }

  // Delete product
  static async deleteProduct(id: string): Promise<void> {
    try {
      console.log(`Deleting product with ID: ${id}`);
      const docRef = doc(db, this.collectionName, id);
      await deleteDoc(docRef);
      console.log(`Successfully deleted product with ID: ${id}`);
    } catch (error) {
      console.error(`Error deleting product with ID ${id}:`, error);
      throw error;
    }
  }

  // Get products with custom query
  static async getProductsWithQuery(constraints: QueryConstraint[]): Promise<ProductModelClass[]> {
    try {
      console.log('Fetching products with custom query...');
      const productsRef = collection(db, this.collectionName);
      const q = query(productsRef, ...constraints);
      const querySnapshot = await getDocs(q);

      const products: ProductModelClass[] = [];
      querySnapshot.forEach((doc) => {
        try {
          const product = ProductModelClass.fromFirestore(doc);
          products.push(product);
        } catch (error) {
          console.error(`Error parsing product document ${doc.id}:`, error);
        }
      });

      console.log(`Successfully fetched ${products.length} products with custom query`);
      return products;
    } catch (error) {
      console.error('Error fetching products with custom query:', error);
      throw error;
    }
  }

  // Get products grouped by main category
  static async getProductsGroupedByCategory(): Promise<Record<string, ProductModelClass[]>> {
    try {
      console.log('Fetching products grouped by category...');
      const allProducts = await this.getVisibleProducts();

      const grouped: Record<string, ProductModelClass[]> = {};
      allProducts.forEach(product => {
        if (!grouped[product.mainCatDocId]) {
          grouped[product.mainCatDocId] = [];
        }
        grouped[product.mainCatDocId].push(product);
      });

      console.log(`Successfully grouped products by ${Object.keys(grouped).length} categories`);
      return grouped;
    } catch (error) {
      console.error('Error fetching products grouped by category:', error);
      throw error;
    }
  }

  // Get visible products with pagination - optimized to fetch only required products
  static async getVisibleProductsPaginated(
    pageSize: number = 12,
    lastDoc: QueryDocumentSnapshot<DocumentData> | null = null,
    sortBy: 'priority' | 'price-low' | 'price-high' | 'newest' | 'rating' = 'priority'
  ): Promise<PaginatedProductsResult> {
    try {
      console.log(`Fetching visible products (paginated): pageSize=${pageSize}, sortBy=${sortBy}`);

      // Query products directly from the products collection with proper pagination
      // This is more efficient than fetching from multiple subcategories
      const productsRef = collection(db, this.collectionName);
      const constraints: QueryConstraint[] = [];

      // Add sorting
      if (sortBy === 'price-low') {
        constraints.push(orderBy('minPrice', 'asc'));
      } else if (sortBy === 'price-high') {
        constraints.push(orderBy('minPrice', 'desc'));
      } else if (sortBy === 'newest') {
        constraints.push(orderBy('createdAt', 'desc'));
      } else if (sortBy === 'rating') {
        constraints.push(orderBy('rating', 'desc'));
      } else {
        // priority
        constraints.push(orderBy('priorityNo', 'asc'));
      }

      // Add pagination cursor
      if (lastDoc) {
        constraints.push(startAfter(lastDoc));
      }

      // Fetch only the exact number needed
      constraints.push(firestoreLimit(pageSize + 1)); // Fetch one extra to check if there are more

      const q = query(productsRef, ...constraints);
      const querySnapshot = await getDocs(q);

      const products: ProductModelClass[] = [];
      let lastDocument: QueryDocumentSnapshot<DocumentData> | null = null;

      querySnapshot.forEach((doc) => {
        try {
          const product = ProductModelClass.fromFirestore(doc);
          products.push(product);
          lastDocument = doc;
        } catch (error) {
          console.error(`Error parsing product document ${doc.id}:`, error);
        }
      });

      // Check if we have more products
      const hasMore = products.length > pageSize;
      if (hasMore) {
        products.pop(); // Remove the extra product
        // Keep lastDocument as the cursor for next page
      } else {
        lastDocument = null; // No more products
      }

      // Sort on client side if needed (for complex sorts)
      if (sortBy === 'priority') {
        products.sort((a, b) => (a.priorityNo || 0) - (b.priorityNo || 0));
      }

      // Fetch total count for this query
      let totalCount = products.length;
      try {
        const countSnapshot = await getCountFromServer(query(productsRef));
        totalCount = countSnapshot.data().count;
      } catch (countError) {
        console.warn('Error fetching total product count:', countError);
      }

      console.log(`Fetched ${products.length} products (hasMore: ${hasMore}, totalCount: ${totalCount})`);

      return {
        products,
        lastDoc: hasMore ? lastDocument : null,
        hasMore,
        totalCount
      };
    } catch (error) {
      console.error('Error fetching visible products (paginated):', error);
      return { products: [], lastDoc: null, hasMore: false };
    }
  }

  // Get products by main category with pagination - optimized to fetch only required products
  static async getProductsByMainCategoryPaginated(
    categoryId: string,
    pageSize: number = 12,
    lastDoc: QueryDocumentSnapshot<DocumentData> | null = null,
    sortBy: 'priority' | 'price-low' | 'price-high' | 'newest' | 'rating' = 'priority'
  ): Promise<PaginatedProductsResult> {
    try {
      console.log(`Fetching products for main category (paginated): ${categoryId}, pageSize=${pageSize}`);

      // Query products directly by mainCatDocId with proper pagination
      const productsRef = collection(db, this.collectionName);
      const constraints: QueryConstraint[] = [
        where('mainCatDocId', '==', categoryId)
      ];

      // Add sorting
      if (sortBy === 'price-low') {
        constraints.push(orderBy('minPrice', 'asc'));
      } else if (sortBy === 'price-high') {
        constraints.push(orderBy('minPrice', 'desc'));
      } else if (sortBy === 'newest') {
        constraints.push(orderBy('createdAt', 'desc'));
      } else if (sortBy === 'rating') {
        constraints.push(orderBy('rating', 'desc'));
      } else {
        // priority
        constraints.push(orderBy('priorityNo', 'asc'));
      }

      // Add pagination cursor
      if (lastDoc) {
        constraints.push(startAfter(lastDoc));
      }

      // Fetch only the exact number needed
      constraints.push(firestoreLimit(pageSize + 1)); // Fetch one extra to check if there are more

      const q = query(productsRef, ...constraints);
      const querySnapshot = await getDocs(q);

      const products: ProductModelClass[] = [];
      let lastDocument: QueryDocumentSnapshot<DocumentData> | null = null;

      querySnapshot.forEach((doc) => {
        try {
          const product = ProductModelClass.fromFirestore(doc);
          products.push(product);
          lastDocument = doc;
        } catch (error) {
          console.error(`Error parsing product document ${doc.id}:`, error);
        }
      });

      // Check if we have more products
      const hasMore = products.length > pageSize;
      if (hasMore) {
        products.pop(); // Remove the extra product
        // Keep lastDocument as the cursor for next page
      } else {
        lastDocument = null; // No more products
      }

      // Sort on client side if needed (for complex sorts)
      if (sortBy === 'priority') {
        products.sort((a, b) => (a.priorityNo || 0) - (b.priorityNo || 0));
      }

      // Fetch total count for this query
      let totalCount = products.length;
      try {
        const countQuery = query(productsRef, where('mainCatDocId', '==', categoryId));
        const countSnapshot = await getCountFromServer(countQuery);
        totalCount = countSnapshot.data().count;
      } catch (countError) {
        console.warn('Error fetching total category product count:', countError);
      }

      console.log(`Fetched ${products.length} products for category ${categoryId} (hasMore: ${hasMore}, totalCount: ${totalCount})`);

      return {
        products,
        lastDoc: hasMore ? lastDocument : null,
        hasMore,
        totalCount
      };
    } catch (error) {
      console.error(`Error fetching products by main category (paginated) ${categoryId}:`, error);
      return { products: [], lastDoc: null, hasMore: false };
    }
  }

  // Get products by subcategory with pagination
  static async getProductsBySubcategoryPaginated(
    subcategoryId: string,
    pageSize: number = 12,
    lastDoc: QueryDocumentSnapshot<DocumentData> | null = null,
    sortBy: 'priority' | 'price-low' | 'price-high' | 'newest' | 'rating' = 'priority'
  ): Promise<PaginatedProductsResult> {
    try {
      console.log(`Fetching products for subcategory (paginated): ${subcategoryId}, pageSize=${pageSize}`);

      const subCategory = await SubCategoryService.getSubCategoryById(subcategoryId);
      if (!subCategory) {
        return { products: [], lastDoc: null, hasMore: false };
      }

      const productsRef = collection(db, this.collectionName);
      const constraints: QueryConstraint[] = [
        where('subcatIds', 'array-contains', subcategoryId)
      ];

      // Add sorting
      if (sortBy === 'price-low') {
        constraints.push(orderBy('minPrice', 'asc'));
      } else if (sortBy === 'price-high') {
        constraints.push(orderBy('minPrice', 'desc'));
      } else if (sortBy === 'newest') {
        constraints.push(orderBy('createdAt', 'desc'));
      } else if (sortBy === 'rating') {
        constraints.push(orderBy('rating', 'desc'));
      } else {
        // priority
        constraints.push(orderBy('priorityNo', 'asc'));
      }

      // Add pagination
      if (lastDoc) {
        constraints.push(startAfter(lastDoc));
      }
      constraints.push(firestoreLimit(pageSize));

      const q = query(productsRef, ...constraints);
      const querySnapshot = await getDocs(q);

      const products: ProductModelClass[] = [];
      querySnapshot.forEach((doc) => {
        try {
          const product = ProductModelClass.fromFirestore(doc);
          products.push(product);
        } catch (error) {
          console.error(`Error parsing product document ${doc.id}:`, error);
        }
      });

      // If we got fewer results than requested, also try the defaultSubCatDocId query
      if (products.length < pageSize) {
        try {
          const additionalConstraints: QueryConstraint[] = [
            where('subCatDocId', '==', subcategoryId)
          ];

          if (sortBy === 'price-low') {
            additionalConstraints.push(orderBy('minPrice', 'asc'));
          } else if (sortBy === 'price-high') {
            additionalConstraints.push(orderBy('minPrice', 'desc'));
          } else if (sortBy === 'newest') {
            additionalConstraints.push(orderBy('createdAt', 'desc'));
          } else if (sortBy === 'rating') {
            additionalConstraints.push(orderBy('rating', 'desc'));
          } else {
            additionalConstraints.push(orderBy('priorityNo', 'asc'));
          }

          if (lastDoc) {
            additionalConstraints.push(startAfter(lastDoc));
          }
          additionalConstraints.push(firestoreLimit(pageSize - products.length));

          const q2 = query(productsRef, ...additionalConstraints);
          const querySnapshot2 = await getDocs(q2);

          querySnapshot2.forEach((doc) => {
            try {
              const product = ProductModelClass.fromFirestore(doc);
              // Avoid duplicates
              if (!products.find(p => p.docId === product.docId)) {
                products.push(product);
              }
            } catch (error) {
              console.error(`Error parsing product document ${doc.id}:`, error);
            }
          });
        } catch (error) {
          console.warn('Secondary subcategory query failed:', error);
        }
      }

      // Sort on client side if needed (for complex sorts)
      if (sortBy === 'priority') {
        products.sort((a, b) => (a.priorityNo || 0) - (b.priorityNo || 0));
      }

      const lastDocument = querySnapshot.docs.length > 0
        ? querySnapshot.docs[querySnapshot.docs.length - 1]
        : null;
      const hasMore = querySnapshot.docs.length === pageSize;

      // Fetch total count for this query
      let totalCount = products.length;
      try {
        const count1Snapshot = await getCountFromServer(query(productsRef, where('subcatIds', 'array-contains', subcategoryId)));
        const count2Snapshot = await getCountFromServer(query(productsRef, where('subCatDocId', '==', subcategoryId)));
        // Approximate total count - might have some overlap but better than nothing
        // In most cases, these will return the same set of products
        totalCount = Math.max(count1Snapshot.data().count, count2Snapshot.data().count);
      } catch (countError) {
        console.warn('Error fetching total subcategory product count:', countError);
      }

      console.log(`Fetched ${products.length} products for subcategory ${subcategoryId} (hasMore: ${hasMore}, totalCount: ${totalCount})`);

      return {
        products,
        lastDoc: lastDocument,
        hasMore,
        totalCount
      };
    } catch (error) {
      console.error(`Error fetching products by subcategory (paginated) ${subcategoryId}:`, error);
      return { products: [], lastDoc: null, hasMore: false };
    }
  }

  // Helper method to sort products
  private static sortProducts(
    products: ProductModelClass[],
    sortBy: 'priority' | 'price-low' | 'price-high' | 'newest' | 'rating'
  ): void {
    switch (sortBy) {
      case 'price-low':
        products.sort((a, b) => (a.minPrice || 0) - (b.minPrice || 0));
        break;
      case 'price-high':
        products.sort((a, b) => (b.minPrice || 0) - (a.minPrice || 0));
        break;
      case 'newest':
        products.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        break;
      case 'rating':
        products.sort((a, b) => b.rating - a.rating);
        break;
      case 'priority':
      default:
        products.sort((a, b) => (a.priorityNo || 0) - (b.priorityNo || 0));
        break;
    }
  }

  // Get available filter options
  static async getFilterOptions(): Promise<{
    tags: string[];
    combinations: string[];
    vendors: string[];
    mainCategories: string[];
    subcategories: string[];
    priceRange: { min: number | null; max: number | null };
    ratingRange: { min: number; max: number };
  }> {
    try {
      console.log('Fetching filter options...');
      const allProducts = await this.getVisibleProducts();

      const tagsSet = new Set<string>();
      const combinationsSet = new Set<string>();
      const vendorsSet = new Set<string>();
      const mainCategoriesSet = new Set<string>();
      const subcategoriesSet = new Set<string>();
      let minPrice: number | null = null;
      let maxPrice: number | null = null;
      let minRating = 5;
      let maxRating = 0;

      allProducts.forEach(product => {
        // Collect tags
        product.tags.forEach(tag => tagsSet.add(tag));

        // Collect combinations
        product.combinationNames.forEach(combo => combinationsSet.add(combo));

        // Collect vendors
        if (product.vendorDocId) {
          vendorsSet.add(product.vendorDocId);
        }

        // Collect main categories
        if (product.mainCatDocId) {
          mainCategoriesSet.add(product.mainCatDocId);
        }

        // Collect subcategories
        if (product.defaultSubCatDocId) {
          subcategoriesSet.add(product.defaultSubCatDocId);
        }
        product.subcatIds.forEach(subcatId => subcategoriesSet.add(subcatId));

        // Calculate price range
        if (product.minPrice > 0) {
          minPrice = minPrice === null ? product.minPrice : Math.min(minPrice, product.minPrice);
        }
        if (product.maxPrice > 0) {
          maxPrice = maxPrice === null ? product.maxPrice : Math.max(maxPrice, product.maxPrice);
        }

        // Calculate rating range
        if (product.rating > 0) {
          minRating = Math.min(minRating, product.rating);
          maxRating = Math.max(maxRating, product.rating);
        }
      });

      const filterOptions = {
        tags: Array.from(tagsSet).sort(),
        combinations: Array.from(combinationsSet).sort(),
        vendors: Array.from(vendorsSet).sort(),
        mainCategories: Array.from(mainCategoriesSet).sort(),
        subcategories: Array.from(subcategoriesSet).sort(),
        priceRange: { min: minPrice, max: maxPrice },
        ratingRange: { min: minRating, max: maxRating },
      };

      console.log('Successfully fetched filter options:', filterOptions);
      return filterOptions;
    } catch (error) {
      console.error('Error fetching filter options:', error);
      throw error;
    }
  }
}

export default ProductService;
