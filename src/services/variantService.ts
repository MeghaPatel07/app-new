import { collection, query, where, getDocs, getDoc, doc, DocumentSnapshot, QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';

// TypeScript interface for VariantModel (matches the expected structure)
export interface VariantModel {
  docId: string;
  productId: string;
  variantName: string;
  variantDescription: string;
  variantPrice: number;
  variantImage: string;
  variantImages?: string[]; // Array of images for carousel support
  sku: string;
  stock: number;
  isActive: boolean;
  detailTypes?: Record<string, any>;
  variantDetailTypes?: Record<string, any>;
  defaultt?: boolean; // Flag to indicate if this is the default variant
  createdAt: Date;
  updatedAt: Date;
}

// TypeScript class implementation for VariantModel
export class VariantModelClass implements VariantModel {
  docId: string;
  productId: string;
  variantName: string;
  variantDescription: string;
  variantPrice: number;
  variantImage: string;
  variantImages?: string[]; // Array of images for carousel support
  sku: string;
  stock: number;
  isActive: boolean;
  detailTypes?: Record<string, any>;
  variantDetailTypes?: Record<string, any>;
  defaultt?: boolean; // Flag to indicate if this is the default variant
  createdAt: Date;
  updatedAt: Date;

  constructor(data: Partial<VariantModel>) {
    this.docId = data.docId || '';
    this.productId = data.productId || '';
    this.variantName = data.variantName || '';
    this.variantDescription = data.variantDescription || '';
    this.variantPrice = data.variantPrice || 0;
    this.variantImage = data.variantImage || '';
    // Set variantImages array - use provided array or create from variantImage or images
    if (data.variantImages && Array.isArray(data.variantImages) && data.variantImages.length > 0) {
      this.variantImages = data.variantImages;
    } else if (data.variantImage) {
      this.variantImages = [data.variantImage];
    } else {
      this.variantImages = [];
    }
    this.sku = data.sku || '';
    this.stock = data.stock || 0;
    this.isActive = data.isActive || true;
    this.detailTypes = data.detailTypes || {};
    this.variantDetailTypes = data.variantDetailTypes || {};
    this.defaultt = data.defaultt || false;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  /// Convert VariantModel to JSON
  toJson(): Record<string, any> {
    return {
      'productId': this.productId,
      'variantName': this.variantName,
      'variantDescription': this.variantDescription,
      'variantPrice': this.variantPrice,
      'variantImage': this.variantImage,
      'sku': this.sku,
      'stock': this.stock,
      'isActive': this.isActive,
      'detailTypes': this.detailTypes,
      'variantDetailTypes': this.variantDetailTypes,
      'createdAt': this.createdAt.getTime(),
      'updatedAt': this.updatedAt.getTime(),
    };
  }

  /// Create VariantModel from JSON
  static fromJson(docId: string, json: Record<string, any>): VariantModelClass {
    // Map Firebase field names to model fields (support both old and new field names)
    const variantName = json['variantName'] || json['lowerName'] || '';
    const variantDescription = json['variantDescription'] || json['description'] || '';
    const variantPrice = json['variantPrice'] || json['fixedprice'] || json['sellingprice'] || json['originalprice'] || 0;
    
    // Handle images - can be array or string
    let variantImage = json['variantImage'] || '';
    let variantImages: string[] = [];
    
    // Support for images array
    if (Array.isArray(json['images']) && json['images'].length > 0) {
      variantImages = json['images'].filter((img: any) => typeof img === 'string' && img.trim() !== '');
      if (!variantImage && variantImages.length > 0) {
        variantImage = variantImages[0];
      }
    } else if (Array.isArray(json['variantImages']) && json['variantImages'].length > 0) {
      variantImages = json['variantImages'].filter((img: any) => typeof img === 'string' && img.trim() !== '');
      if (!variantImage && variantImages.length > 0) {
        variantImage = variantImages[0];
      }
    } else if (typeof json['image'] === 'string' && json['image'].trim() !== '') {
      variantImage = json['image'];
      variantImages = [json['image']];
    } else if (variantImage) {
      variantImages = [variantImage];
    }
    
    // Handle isActive/show field - support both field names
    const isActive = json['isActive'] !== false && (json['show'] !== false || json['isActive'] === true || json['show'] === true);
    
    return new VariantModelClass({
      docId: docId,
      productId: json['productId'] || '',
      variantName: variantName,
      variantDescription: variantDescription,
      variantPrice: variantPrice,
      variantImage: variantImage,
      variantImages: variantImages,
      sku: json['sku'] || json['id'] || '',
      stock: json['stock'] || 0,
      isActive: isActive,
      detailTypes: json['detailTypes'] || {},
      variantDetailTypes: json['variantDetailTypes'] || json['detailTypes'] || {},
      defaultt: json['defaultt'] === true,
      createdAt: json['createdAt'] ? new Date(json['createdAt']) : new Date(),
      updatedAt: json['updatedAt'] ? new Date(json['updatedAt']) : new Date(),
    });
  }

  /// Create VariantModel from Firestore DocumentSnapshot
  static fromDocSnap(snapshot: DocumentSnapshot): VariantModelClass {
    const data = snapshot.data();
    if (!data) {
      throw new Error('Document data is null');
    }

    // Map Firebase field names to model fields (support both old and new field names)
    const variantName = data['variantName'] || data['lowerName'] || '';
    const variantDescription = data['variantDescription'] || data['description'] || '';
    const variantPrice = data['variantPrice'] || data['fixedprice'] || data['sellingprice'] || data['originalprice'] || 0;
    
    // Handle images - can be array or string
    let variantImage = data['variantImage'] || '';
    let variantImages: string[] = [];
    
    // Support for images array
    if (Array.isArray(data['images']) && data['images'].length > 0) {
      variantImages = data['images'].filter((img: any) => typeof img === 'string' && img.trim() !== '');
      if (!variantImage && variantImages.length > 0) {
        variantImage = variantImages[0];
      }
    } else if (Array.isArray(data['variantImages']) && data['variantImages'].length > 0) {
      variantImages = data['variantImages'].filter((img: any) => typeof img === 'string' && img.trim() !== '');
      if (!variantImage && variantImages.length > 0) {
        variantImage = variantImages[0];
      }
    } else if (typeof data['image'] === 'string' && data['image'].trim() !== '') {
      variantImage = data['image'];
      variantImages = [data['image']];
    } else if (variantImage) {
      variantImages = [variantImage];
    }
    
    // Handle isActive/show field - support both field names
    const isActive = data['isActive'] !== false && (data['show'] !== false || data['isActive'] === true || data['show'] === true);

    return new VariantModelClass({
      docId: snapshot.id,
      productId: data['productId'] || '',
      variantName: variantName,
      variantDescription: variantDescription,
      variantPrice: variantPrice,
      variantImage: variantImage,
      variantImages: variantImages,
      sku: data['sku'] || data['id'] || '',
      stock: data['stock'] || 0,
      isActive: isActive,
      detailTypes: data['detailTypes'] || {},
      variantDetailTypes: data['variantDetailTypes'] || data['detailTypes'] || {},
      defaultt: data['defaultt'] === true,
      createdAt: data['createdAt'] ? (data['createdAt'].toDate ? data['createdAt'].toDate() : new Date(data['createdAt'])) : new Date(),
      updatedAt: data['updatedAt'] ? (data['updatedAt'].toDate ? data['updatedAt'].toDate() : new Date(data['updatedAt'])) : new Date(),
    });
  }

  /// Create VariantModel from Firestore QueryDocumentSnapshot
  static fromSnap(snapshot: QueryDocumentSnapshot): VariantModelClass {
    const data = snapshot.data();
    
    // Map Firebase field names to model fields (support both old and new field names)
    const variantName = data['variantName'] || data['lowerName'] || '';
    const variantDescription = data['variantDescription'] || data['description'] || '';
    const variantPrice = data['variantPrice'] || data['fixedprice'] || data['sellingprice'] || data['originalprice'] || 0;
    
    // Handle images - can be array or string
    let variantImage = data['variantImage'] || '';
    let variantImages: string[] = [];
    
    // Support for images array
    if (Array.isArray(data['images']) && data['images'].length > 0) {
      variantImages = data['images'].filter((img: any) => typeof img === 'string' && img.trim() !== '');
      if (!variantImage && variantImages.length > 0) {
        variantImage = variantImages[0];
      }
    } else if (Array.isArray(data['variantImages']) && data['variantImages'].length > 0) {
      variantImages = data['variantImages'].filter((img: any) => typeof img === 'string' && img.trim() !== '');
      if (!variantImage && variantImages.length > 0) {
        variantImage = variantImages[0];
      }
    } else if (typeof data['image'] === 'string' && data['image'].trim() !== '') {
      variantImage = data['image'];
      variantImages = [data['image']];
    } else if (variantImage) {
      variantImages = [variantImage];
    }
    
    // Handle isActive/show field - support both field names
    const isActive = data['isActive'] !== false && (data['show'] !== false || data['isActive'] === true || data['show'] === true);
    
    return new VariantModelClass({
      docId: snapshot.id,
      productId: data['productId'] || '',
      variantName: variantName,
      variantDescription: variantDescription,
      variantPrice: variantPrice,
      variantImage: variantImage,
      variantImages: variantImages,
      sku: data['sku'] || data['id'] || '',
      stock: data['stock'] || 0,
      isActive: isActive,
      detailTypes: data['detailTypes'] || {},
      variantDetailTypes: data['variantDetailTypes'] || data['detailTypes'] || {},
      defaultt: data['defaultt'] === true,
      createdAt: data['createdAt'] ? (data['createdAt'].toDate ? data['createdAt'].toDate() : new Date(data['createdAt'])) : new Date(),
      updatedAt: data['updatedAt'] ? (data['updatedAt'].toDate ? data['updatedAt'].toDate() : new Date(data['updatedAt'])) : new Date(),
    });
  }
}

// Variant Service class with static methods
class VariantService {
  /// Helper function to calculate price with margin
  /// Gets the margin from vendor's purSalePerData based on variant's subCatId
  /// Checks both direct subCatId match and linkSubCatIds array
  static async calculatePriceWithMargin(
    fixedPrice: number,
    variantSubCatId: string | null | undefined,
    productVendorDocId: string | null | undefined
  ): Promise<number> {
    console.log('🔍 [calculatePriceWithMargin] Starting margin calculation');
    console.log('📊 [calculatePriceWithMargin] Input parameters:', {
      fixedPrice,
      variantSubCatId,
      productVendorDocId
    });

    // If no margin data available, return original price
    if (!variantSubCatId || !productVendorDocId || fixedPrice <= 0) {
      console.log('⚠️ [calculatePriceWithMargin] Missing required data:', {
        hasVariantSubCatId: !!variantSubCatId,
        hasProductVendorDocId: !!productVendorDocId,
        hasValidPrice: fixedPrice > 0
      });
      console.log('⚠️ [calculatePriceWithMargin] Returning original price:', fixedPrice);
      return fixedPrice;
    }

    try {
      // Fetch vendor data - get raw document to access linkSubCatIds
      console.log(`🔍 [calculatePriceWithMargin] Fetching vendor document: ${productVendorDocId}`);
      const vendorRef = doc(db, 'vendors', productVendorDocId);
      const vendorDoc = await getDoc(vendorRef);
      
      if (!vendorDoc.exists()) {
        console.log(`⚠️ [calculatePriceWithMargin] Vendor ${productVendorDocId} not found, using original price`);
        return fixedPrice;
      }

      const vendorData = vendorDoc.data();
      console.log('📦 [calculatePriceWithMargin] Vendor data retrieved:', {
        vendorId: productVendorDocId,
        vendorName: vendorData.name || 'N/A',
        hasPurSalePerData: !!vendorData.purSalePerData,
        purSalePerDataType: typeof vendorData.purSalePerData
      });

      const purSalePerData = vendorData.purSalePerData;

      if (!purSalePerData || typeof purSalePerData !== 'object') {
        console.log(`⚠️ [calculatePriceWithMargin] No purSalePerData found for vendor ${productVendorDocId}, using original price`);
        console.log('📊 [calculatePriceWithMargin] purSalePerData value:', purSalePerData);
        return fixedPrice;
      }

      console.log('📋 [calculatePriceWithMargin] purSalePerData structure:', {
        keys: Object.keys(purSalePerData),
        fullData: JSON.stringify(purSalePerData, null, 2)
      });

      // Find matching subCatId in purSalePerData
      // First check direct key match
      console.log(`🔍 [calculatePriceWithMargin] Looking for subCatId: ${variantSubCatId}`);
      let marginData = purSalePerData[variantSubCatId];
      
      if (marginData) {
        console.log('✅ [calculatePriceWithMargin] Found direct match in purSalePerData:', marginData);
      } else {
        console.log('⚠️ [calculatePriceWithMargin] No direct match found, checking linkSubCatIds...');
      }
      
      // If not found, check linkSubCatIds in all entries
      if (!marginData) {
        for (const [key, value] of Object.entries(purSalePerData)) {
          const entry = value as any;
          console.log(`🔍 [calculatePriceWithMargin] Checking entry key: ${key}`, {
            entry,
            hasLinkSubCatIds: Array.isArray(entry?.linkSubCatIds),
            linkSubCatIds: entry?.linkSubCatIds
          });
          
          if (entry && Array.isArray(entry.linkSubCatIds) && entry.linkSubCatIds.includes(variantSubCatId)) {
            console.log(`✅ [calculatePriceWithMargin] Found match in linkSubCatIds for key: ${key}`);
            marginData = entry;
            break;
          }
        }
      }

      if (!marginData) {
        console.log(`⚠️ [calculatePriceWithMargin] No margin data found for subCatId ${variantSubCatId} in vendor ${productVendorDocId}`);
        console.log('📊 [calculatePriceWithMargin] Available subCatIds in purSalePerData:', Object.keys(purSalePerData));
        console.log('⚠️ [calculatePriceWithMargin] Returning original price:', fixedPrice);
        return fixedPrice;
      }

      console.log('📊 [calculatePriceWithMargin] Margin data found:', {
        marginData,
        sellPercentage: marginData.sellPercentage,
        sellingPer: marginData.sellingPer,
        purPercentage: marginData.purPercentage
      });

      // Get sellPercentage as margin
      const margin = marginData.sellPercentage || marginData.sellingPer || 0;
      console.log('💰 [calculatePriceWithMargin] Margin value to apply:', margin);

      // Calculate final price: fixedPrice * (100 + margin) / 100
      const calculation = `(${fixedPrice} * (100 + ${margin}) / 100)`;
      const finalPrice = fixedPrice * (100 + margin) / 100;
      const roundedPrice = Math.round(finalPrice);
      
      console.log('🧮 [calculatePriceWithMargin] Price calculation:', {
        formula: calculation,
        calculation: `${fixedPrice} * ${(100 + margin)} / 100`,
        result: finalPrice,
        rounded: roundedPrice
      });
      
      console.log(`✅ [calculatePriceWithMargin] Final price with margin: ${roundedPrice} (original: ${fixedPrice}, margin: ${margin}%)`);
      return roundedPrice;
    } catch (error) {
      console.error('❌ [calculatePriceWithMargin] Error calculating price with margin:', error);
      console.error('❌ [calculatePriceWithMargin] Error stack:', error instanceof Error ? error.stack : 'N/A');
      // Return original price on error
      return fixedPrice;
    }
  }
  /// Get variants by product ID
  static async getVariantsByProductId(productId: string): Promise<VariantModelClass[]> {
    try {
      console.log('🔍 [getVariantsByProductId] Fetching variants for productId:', productId);
      const variantsRef = collection(db, 'variants');
      
      // Query for variants with productId match and either show==true OR isActive==true
      // Firestore doesn't support OR in a single query, so we'll fetch all matching productId
      // and filter in memory, or use two queries
      const q = query(variantsRef, where('productId', '==', productId));
      const querySnapshot = await getDocs(q);
      
      console.log('📦 [getVariantsByProductId] Raw query result count:', querySnapshot.size);
      
      const variants: VariantModelClass[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const isDefault = data['defaultt'] === true;
        
        // Default variants should always be included regardless of isActive/show status
        // For non-default variants, check if they're active
        let shouldInclude = false;
        
        if (isDefault) {
          // Always include default variants
          shouldInclude = true;
          console.log('✅ [getVariantsByProductId] Adding default variant:', doc.id, {
            variantName: data['variantName'] || data['lowerName'],
            show: data['show'],
            isActive: data['isActive'],
            productId: data['productId'],
            defaultt: data['defaultt']
          });
        } else {
          // For non-default variants, use more lenient logic: include if not explicitly false
          // This matches the logic in VariantModelClass.fromSnap()
          const isActive = data['isActive'] !== false && 
                          (data['show'] !== false || data['isActive'] === true || data['show'] === true);
          shouldInclude = isActive;
          
          if (shouldInclude) {
            console.log('✅ [getVariantsByProductId] Adding active variant:', doc.id, {
              variantName: data['variantName'] || data['lowerName'],
              show: data['show'],
              isActive: data['isActive'],
              productId: data['productId'],
              defaultt: data['defaultt']
            });
        } else {
          console.log('⚠️ [getVariantsByProductId] Skipping inactive variant:', doc.id, {
            show: data['show'],
            isActive: data['isActive']
          });
          }
        }
        
        if (shouldInclude) {
          variants.push(VariantModelClass.fromSnap(doc as QueryDocumentSnapshot));
        }
      });
      
      console.log('✅ [getVariantsByProductId] Returning', variants.length, 'active variants');
      return variants;
    } catch (error) {
      console.error('❌ [getVariantsByProductId] Error fetching variants:', error);
      return [];
    }
  }

  /// Get available filters from variants (dynamic generation from detailTypes keys)
  /// Returns filters with all unique values (case-insensitive, stored in lowercase)
  static getAvailableFilters(variants: VariantModelClass[]): Record<string, string[]> {
    const filters: Record<string, string[]> = {};
    
    if (variants.length === 0) return filters;
    
    // Get all detailTypes keys from first variant (like old Flutter code)
    const firstVariant = variants[0];
    const firstDetailTypes = firstVariant.detailTypes || firstVariant.variantDetailTypes || {};
    const filterKeys = Object.keys(firstDetailTypes);
    
    // Initialize filters with empty arrays
    filterKeys.forEach(key => {
      filters[key] = [];
    });
    
    // Collect all unique values for each filter from all variants (case-insensitive)
    variants.forEach(variant => {
      const detailTypes = variant.detailTypes || variant.variantDetailTypes || {};
      
      Object.entries(detailTypes).forEach(([key, value]) => {
        if (typeof value === 'string' && value.trim() !== '' && value.toLowerCase().trim() !== 'null') {
          const normalizedValue = value.toLowerCase().trim();
          if (!filters[key]?.includes(normalizedValue)) {
            if (filters[key]) {
              filters[key].push(normalizedValue);
            }
          }
        }
      });
    });
    
    // Sort filter keys alphabetically (like old Flutter code)
    const sortedFilters: Record<string, string[]> = {};
    Object.keys(filters).sort().forEach(key => {
      sortedFilters[key] = filters[key].sort();
    });
    
    return sortedFilters;
  }
  
  /// Get available filter values for a specific filter key based on current selections
  /// Used for cascading filter logic - returns values that are available given current filter selections
  static getAvailableFilterValues(
    variants: VariantModelClass[],
    filterKey: string,
    currentFilters: Record<string, string>
  ): string[] {
    // Get variants that match current filter selections (excluding the filterKey we're calculating for)
    const matchingVariants = variants.filter(variant => {
      const detailTypes = variant.detailTypes || variant.variantDetailTypes || {};
      
      return Object.entries(currentFilters).every(([key, value]) => {
        if (key === filterKey) return true; // Skip the filter we're calculating for
        const variantValue = detailTypes[key];
        if (typeof variantValue === 'string') {
          return variantValue.toLowerCase().trim() === value.toLowerCase().trim();
        }
        return false;
      });
    });
    
    // Extract unique values for the filterKey from matching variants
    const values: string[] = [];
    matchingVariants.forEach(variant => {
      const detailTypes = variant.detailTypes || variant.variantDetailTypes || {};
      const value = detailTypes[filterKey];
      if (typeof value === 'string' && value.trim() !== '' && value.toLowerCase().trim() !== 'null') {
        const normalizedValue = value.toLowerCase().trim();
        if (!values.includes(normalizedValue)) {
          values.push(normalizedValue);
        }
      }
    });
    
    return values.sort();
  }
  
  /// Check if a filter option is available (has matching variants)
  /// Used for grey-out logic
  static isFilterOptionAvailable(
    variants: VariantModelClass[],
    filterKey: string,
    filterValue: string,
    currentFilters: Record<string, string>
  ): boolean {
    // Create a test filter set with this option selected
    const testFilters = { ...currentFilters, [filterKey]: filterValue };
    
    // Check if any variant matches all filters including this option
    return variants.some(variant => {
      const detailTypes = variant.detailTypes || variant.variantDetailTypes || {};
      
      return Object.entries(testFilters).every(([key, value]) => {
        const variantValue = detailTypes[key];
        if (typeof variantValue === 'string') {
          return variantValue.toLowerCase().trim() === value.toLowerCase().trim();
        }
        return false;
      });
    });
  }

  /// Get default variant (checks for defaultt field first, like old Flutter code)
  static getDefaultVariant(variants: VariantModelClass[]): VariantModelClass | null {
    if (variants.length === 0) return null;
    
    // First, try to find variant with defaultt == true (need to check Firestore directly)
    // Since VariantModelClass doesn't have defaultt field, we'll check in the service method
    // For now, return first variant with stock > 0, or first variant
    const inStockVariant = variants.find(v => v.stock > 0);
    return inStockVariant || variants[0];
  }
  
  /// Get default variant by checking defaultt field in Firestore
  static async getDefaultVariantFromFirestore(productId: string): Promise<VariantModelClass | null> {
    try {
      console.log('🔍 [getDefaultVariantFromFirestore] Fetching default variant for productId:', productId);
      const variantsRef = collection(db, 'variants');
      
      // Query for variants where productId matches and defaultt is true
      // Note: Firestore doesn't support OR queries, so we'll fetch all with productId and filter in memory
      const q = query(
        variantsRef, 
        where('productId', '==', productId),
        where('defaultt', '==', true)
      );
      const querySnapshot = await getDocs(q);
      
      console.log('📦 [getDefaultVariantFromFirestore] Found', querySnapshot.size, 'variants with defaultt=true');
      
      // Default variants should always be included, regardless of isActive/show status
      // But we'll still prefer active ones if available
      for (const doc of querySnapshot.docs) {
        const data = doc.data();
        const isActive = data['isActive'] !== false && 
                        (data['show'] !== false || data['isActive'] === true || data['show'] === true);
        
        // Always include default variants, but prefer active ones
        if (isActive) {
          console.log('✅ [getDefaultVariantFromFirestore] Found active default variant:', doc.id);
          return VariantModelClass.fromSnap(doc as QueryDocumentSnapshot);
        }
      }
      
      // If no active default variant found, return the first default variant anyway
      if (querySnapshot.docs.length > 0) {
        const firstDoc = querySnapshot.docs[0];
        console.log('⚠️ [getDefaultVariantFromFirestore] No active default variant, returning first default variant:', firstDoc.id);
        return VariantModelClass.fromSnap(firstDoc as QueryDocumentSnapshot);
      }
      
      // Fallback: get first active variant (check both show and isActive)
      console.log('⚠️ [getDefaultVariantFromFirestore] No default variant found, trying fallback...');
      const fallbackQ = query(
        variantsRef,
        where('productId', '==', productId)
      );
      const fallbackSnapshot = await getDocs(fallbackQ);
      
      for (const doc of fallbackSnapshot.docs) {
        const data = doc.data();
        // Use more lenient logic: include if not explicitly false
        const isActive = data['isActive'] !== false && 
                        (data['show'] !== false || data['isActive'] === true || data['show'] === true);
        
        if (isActive) {
          console.log('✅ [getDefaultVariantFromFirestore] Found active fallback variant:', doc.id);
          return VariantModelClass.fromSnap(doc as QueryDocumentSnapshot);
        }
      }
      
      console.log('⚠️ [getDefaultVariantFromFirestore] No active variants found');
      return null;
    } catch (error) {
      console.error('❌ [getDefaultVariantFromFirestore] Error fetching default variant:', error);
      return null;
    }
  }

  /// Get default variant by product ID (where defaultt is true)
  /// Returns raw variant data with id, lowerName, and fixedprice (with margin applied)
  static async getDefaultVariantByProductId(productId: string): Promise<{ id: string; lowerName: string; fixedprice: number } | null> {
    console.log('🔍 [getDefaultVariantByProductId] Starting for product:', productId);
    try {
      // First, get the product to get vendorDocId
      console.log(`🔍 [getDefaultVariantByProductId] Fetching product: ${productId}`);
      const productRef = doc(db, 'products', productId);
      const productDoc = await getDoc(productRef);
      
      if (!productDoc.exists()) {
        console.log(`⚠️ [getDefaultVariantByProductId] Product ${productId} not found`);
        return null;
      }
      
      const productData = productDoc.data();
      const vendorDocId = productData.vendorDocId || productData.vendorId || null;
      console.log('📊 [getDefaultVariantByProductId] Product data:', {
        productId,
        vendorDocId,
        productName: productData.name || 'N/A'
      });

      const variantsRef = collection(db, 'variants');
      // Query for variants where productId matches and defaultt is true
      const q = query(
        variantsRef, 
        where('productId', '==', productId),
        where('defaultt', '==', true)
      );
      const querySnapshot = await getDocs(q);
      
      // Filter for active variants from defaultt=true results
      for (const doc of querySnapshot.docs) {
        const data = doc.data();
        const isActive = (data['isActive'] === true || data['show'] === true) && 
                        (data['isActive'] !== false && data['show'] !== false);
        
        if (isActive) {
          const variantDoc = doc;
          const variantData = variantDoc.data();
          const basePrice = variantData.fixedprice || 0;
          const variantSubCatId = variantData.subCatId || null;
          
          console.log('📊 [getDefaultVariantByProductId] Default variant found:', {
            variantId: variantDoc.id,
            variantName: variantData.lowerName || 'N/A',
            basePrice,
            variantSubCatId,
            vendorDocId
          });
          
          // Calculate price with margin
          console.log('💰 [getDefaultVariantByProductId] Calculating price with margin...');
          const finalPrice = await this.calculatePriceWithMargin(basePrice, variantSubCatId, vendorDocId);
          
          const variantResult = {
            id: variantDoc.id, // Use Firestore document ID
            lowerName: variantData.lowerName || '',
            fixedprice: finalPrice
          };
          
          console.log(`✅ [getDefaultVariantByProductId] Final result for product ${productId}:`, {
            variantName: variantResult.lowerName,
            variantId: variantResult.id,
            basePrice,
            finalPrice: variantResult.fixedprice,
            marginApplied: finalPrice !== basePrice
          });
          return variantResult;
        }
      }
      
      // If no active default variant found, try fallback
      console.log(`⚠️ No active default variant found for product ${productId} (defaultt == true), trying fallback...`);
      // Fallback: try to get first active variant if no default variant found
      const fallbackQ = query(
        variantsRef,
        where('productId', '==', productId)
      );
      const fallbackSnapshot = await getDocs(fallbackQ);
      // Filter for active variants in memory
      let fallbackDoc = null;
      for (const doc of fallbackSnapshot.docs) {
        const data = doc.data();
        const isActive = (data['isActive'] === true || data['show'] === true) && 
                        (data['isActive'] !== false && data['show'] !== false);
        
        if (isActive) {
          fallbackDoc = doc;
          break;
        }
      }
      
      if (fallbackDoc) {
        console.log(`✅ [getDefaultVariantByProductId] Using first active variant as fallback for product ${productId}`);
        const fallbackData = fallbackDoc.data();
        const basePrice = fallbackData.fixedprice || 0;
        const variantSubCatId = fallbackData.subCatId || null;
        
        console.log('📊 [getDefaultVariantByProductId] Fallback variant data:', {
          variantId: fallbackDoc.id,
          basePrice,
          variantSubCatId,
          vendorDocId
        });
        
        // Calculate price with margin
        console.log('💰 [getDefaultVariantByProductId] Calculating price with margin for fallback variant...');
        const finalPrice = await this.calculatePriceWithMargin(basePrice, variantSubCatId, vendorDocId);
        
        const result = {
          id: fallbackDoc.id, // Use Firestore document ID
          lowerName: fallbackData.lowerName || '',
          fixedprice: finalPrice
        };
        
        console.log(`✅ [getDefaultVariantByProductId] Fallback result:`, {
          variantName: result.lowerName,
          basePrice,
          finalPrice: result.fixedprice
        });
        
        return result;
      }
      return null;
    } catch (error) {
      console.error('❌ Error fetching default variant by product ID:', error);
      return null;
    }
  }

  /// Get full default variant details by product ID (including variantDetailTypes, variantImage, etc.)
  /// Returns full variant data for order creation (with margin applied to price)
  static async getDefaultVariantDetailsByProductId(productId: string): Promise<{
    variantDocId: string;
    variantImage: string;
    variantDescription: string;
    variantDetailTypes: Record<string, any>;
    variantPrice: number;
  } | null> {
    try {
      // First, get the product to get vendorDocId
      const productRef = doc(db, 'products', productId);
      const productDoc = await getDoc(productRef);
      
      if (!productDoc.exists()) {
        console.log(`⚠️ Product ${productId} not found`);
        return null;
      }
      
      const productData = productDoc.data();
      const vendorDocId = productData.vendorDocId || productData.vendorId || null;

      const variantsRef = collection(db, 'variants');
      // Query for variants where productId matches and defaultt is true
      const q = query(
        variantsRef, 
        where('productId', '==', productId),
        where('defaultt', '==', true)
      );
      const querySnapshot = await getDocs(q);
      
      // Default variants should always be included, but prefer active ones
      let activeDefaultVariant = null;
      let firstDefaultVariant = null;
      
      for (const doc of querySnapshot.docs) {
        const data = doc.data();
        const isActive = data['isActive'] !== false && 
                        (data['show'] !== false || data['isActive'] === true || data['show'] === true);
        
        const variantDoc = doc;
        const variantData = variantDoc.data();
        
        // Store first default variant as fallback
        if (!firstDefaultVariant) {
          firstDefaultVariant = { doc: variantDoc, data: variantData };
        }
        
        // Prefer active default variant
        if (isActive && !activeDefaultVariant) {
          activeDefaultVariant = { doc: variantDoc, data: variantData };
        }
      }
      
      // Use active default variant if available, otherwise use first default variant
      const selectedVariant = activeDefaultVariant || firstDefaultVariant;
      
      if (selectedVariant) {
        const variantDoc = selectedVariant.doc;
        const variantData = selectedVariant.data;
        const basePrice = variantData.fixedprice || variantData.variantPrice || 0;
        const variantSubCatId = variantData.subCatId || null;
        
        console.log('📊 [getDefaultVariantDetailsByProductId] Default variant found:', {
          variantDocId: variantDoc.id,
          basePrice,
          variantSubCatId,
          vendorDocId,
          isActive: activeDefaultVariant !== null
        });
        
        // Calculate price with margin
        console.log('💰 [getDefaultVariantDetailsByProductId] Calculating price with margin...');
        const finalPrice = await this.calculatePriceWithMargin(basePrice, variantSubCatId, vendorDocId);
        
        const result = {
          variantDocId: variantDoc.id,
          variantImage: variantData.variantImage || variantData.image || (Array.isArray(variantData.images) && variantData.images.length > 0 ? variantData.images[0] : ''),
          variantDescription: variantData.variantDescription || variantData.description || '',
          variantDetailTypes: variantData.variantDetailTypes || variantData.detailTypes || {},
          variantPrice: finalPrice
        };
        
        console.log(`✅ [getDefaultVariantDetailsByProductId] Final result for product ${productId}:`, {
          variantDocId: result.variantDocId,
          basePrice,
          finalPrice: result.variantPrice,
          marginApplied: finalPrice !== basePrice
        });
        
        return result;
      }
      
      // If no default variant found at all, try fallback
      console.log(`⚠️ No default variant found for product ${productId} (defaultt == true), trying fallback...`);
      // Fallback: try to get first active variant if no default variant found
      const fallbackQ = query(
        variantsRef,
        where('productId', '==', productId)
      );
      const fallbackSnapshot = await getDocs(fallbackQ);
      
      // Filter for active variants in memory (use lenient logic)
      for (const doc of fallbackSnapshot.docs) {
        const data = doc.data();
        // Use lenient logic: include if not explicitly false
        const isActive = data['isActive'] !== false && 
                        (data['show'] !== false || data['isActive'] === true || data['show'] === true);
        
        if (isActive) {
          console.log(`✅ [getDefaultVariantDetailsByProductId] Using first active variant as fallback for product ${productId}`);
          const fallbackData = doc.data();
          const basePrice = fallbackData.fixedprice || fallbackData.variantPrice || 0;
          const variantSubCatId = fallbackData.subCatId || null;
          
          console.log('📊 [getDefaultVariantDetailsByProductId] Fallback variant data:', {
            variantDocId: doc.id,
            basePrice,
            variantSubCatId,
            vendorDocId
          });
          
          // Calculate price with margin
          console.log('💰 [getDefaultVariantDetailsByProductId] Calculating price with margin for fallback variant...');
          const finalPrice = await this.calculatePriceWithMargin(basePrice, variantSubCatId, vendorDocId);
          
          const result = {
            variantDocId: doc.id,
            variantImage: fallbackData.variantImage || fallbackData.image || (Array.isArray(fallbackData.images) && fallbackData.images.length > 0 ? fallbackData.images[0] : ''),
            variantDescription: fallbackData.variantDescription || fallbackData.description || '',
            variantDetailTypes: fallbackData.variantDetailTypes || fallbackData.detailTypes || {},
            variantPrice: finalPrice
          };
          
          console.log(`✅ [getDefaultVariantDetailsByProductId] Fallback result:`, {
            variantDocId: result.variantDocId,
            basePrice,
            finalPrice: result.variantPrice
          });
          
          return result;
        }
      }
      return null;
    } catch (error) {
      console.error('❌ Error fetching default variant details by product ID:', error);
      return null;
    }
  }

  /// Filter variants based on selected filters
  /// Get filtered variants (case-insensitive matching, like old Flutter code)
  static getFilteredVariants(variants: VariantModelClass[], filters: Record<string, string>): VariantModelClass[] {
    return variants.filter(variant => {
      const detailTypes = variant.detailTypes || variant.variantDetailTypes || {};
      
      return Object.entries(filters).every(([key, value]) => {
        const variantValue = detailTypes[key];
        if (typeof variantValue === 'string' && typeof value === 'string') {
          return variantValue.toLowerCase().trim() === value.toLowerCase().trim();
        }
        return false;
      });
    });
  }

  /// Get variant by ID
  static async getVariantById(variantId: string): Promise<VariantModelClass | null> {
    try {
      const variantsRef = collection(db, 'variants');
      const q = query(variantsRef, where('__name__', '==', variantId));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }
      
      const doc = querySnapshot.docs[0];
      return VariantModelClass.fromSnap(doc as QueryDocumentSnapshot);
    } catch (error) {
      console.error('Error fetching variant by ID:', error);
      return null;
    }
  }

  /// Get variants by multiple IDs
  static async getVariantsByIds(variantIds: string[]): Promise<VariantModelClass[]> {
    try {
      const variants: VariantModelClass[] = [];
      
      for (const variantId of variantIds) {
        const variant = await this.getVariantById(variantId);
        if (variant) {
          variants.push(variant);
        }
      }
      
      return variants;
    } catch (error) {
      console.error('Error fetching variants by IDs:', error);
      return [];
    }
  }
}

export default VariantService;

