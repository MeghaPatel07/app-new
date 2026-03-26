import { Timestamp, DocumentSnapshot, QueryDocumentSnapshot } from 'firebase/firestore';

// TypeScript interface for Product data structure
export interface ProductModel {
  docId: string;
  name: string;
  lowerName: string;
  combinationNames: string[];
  mainCatDocId: string;
  defaultSubCatDocId: string;
  subcatIds: string[];
  vendorDocId: string;
  defaultImage: string;
  show: boolean;
  description: string;
  sku: string;
  userType: string;
  createdAt: Date;
  topSelling: boolean;
  minPrice: number;
  maxPrice: number;
  quantitySold: number;
  totalSalesAmount: number;
  tags: string[];
  detailsList: string[];
  priorityNo: number;
  rating: number;
  numberOfRating: number;
  images?: string[];
  occasionCollectionIds?: string[];
}

// TypeScript class implementation with methods
export class ProductModelClass implements ProductModel {
  docId: string;
  name: string;
  lowerName: string;
  combinationNames: string[];
  mainCatDocId: string;
  defaultSubCatDocId: string;
  subcatIds: string[];
  vendorDocId: string;
  defaultImage: string;
  show: boolean;
  description: string;
  sku: string;
  userType: string;
  createdAt: Date;
  topSelling: boolean;
  minPrice: number;
  maxPrice: number;
  quantitySold: number;
  totalSalesAmount: number;
  tags: string[];
  detailsList: string[];
  priorityNo: number;
  rating: number;
  numberOfRating: number;
  images: string[];
  occasionCollectionIds: string[];

  constructor(data: ProductModel & { occasionCollectionIds?: string[] }) {
    this.docId = data.docId;
    this.name = data.name;
    this.lowerName = data.lowerName;
    this.combinationNames = data.combinationNames;
    this.mainCatDocId = data.mainCatDocId;
    this.defaultSubCatDocId = data.defaultSubCatDocId;
    this.subcatIds = data.subcatIds;
    this.vendorDocId = data.vendorDocId;
    this.defaultImage = data.defaultImage;
    this.show = data.show;
    this.description = data.description;
    this.sku = data.sku;
    this.userType = data.userType;
    this.createdAt = data.createdAt;
    this.topSelling = data.topSelling;
    this.minPrice = data.minPrice;
    this.maxPrice = data.maxPrice;
    this.quantitySold = data.quantitySold;
    this.totalSalesAmount = data.totalSalesAmount;
    this.tags = data.tags;
    this.detailsList = data.detailsList;
    this.priorityNo = data.priorityNo;
    this.rating = data.rating || 0;
    this.numberOfRating = data.numberOfRating || 0;
    this.images = data.images || [];
    this.occasionCollectionIds = data.occasionCollectionIds || [];
  }

  // Converts ProductModel instance to JSON for Firestore
  toJson(): Record<string, any> {
    return {
      docId: this.docId,
      name: this.name,
      lowerName: this.lowerName,
      combinationNames: this.combinationNames,
      mainCatDocId: this.mainCatDocId,
      subCatDocId: this.defaultSubCatDocId,
      subcatIds: this.subcatIds,
      vendorDocId: this.vendorDocId,
      show: this.show,
      description: this.description,
      userType: this.userType,
      createdAt: Timestamp.fromDate(this.createdAt),
      sku: this.sku,
      topSelling: this.topSelling,
      defaultImage: this.defaultImage,
      minPrice: this.minPrice,
      maxPrice: this.maxPrice,
      quantitySold: this.quantitySold,
      totalSalesAmount: this.totalSalesAmount,
      tags: this.tags,
      detailsList: this.detailsList,
      priorityNo: this.priorityNo,
      rating: this.rating,
      numberOfRating: this.numberOfRating,
      images: this.images,
      occasionCollectionIds: this.occasionCollectionIds,
    };
  }

  // Creates ProductModel instance from JSON map
  static fromJson(json: Record<string, any>): ProductModelClass {
    return new ProductModelClass({
      docId: json.docId || '',
      name: json.name || '',
      lowerName: json.lowerName || json.name?.toLowerCase() || '',
      combinationNames: Array.isArray(json.combinationNames)
        ? json.combinationNames
        : [],
      mainCatDocId: json.mainCatDocId || json.mainCategoryId || '',
      defaultSubCatDocId: json.subCatDocId || json.defaultSubCatDocId || json.subcategoryId || '',
      subcatIds: Array.isArray(json.subcatIds)
        ? json.subcatIds
        : Array.isArray(json.subcategoryIds)
          ? json.subcategoryIds
          : [],
      vendorDocId: json.vendorDocId || json.vendorId || '',
      defaultImage: json.defaultImage || json.image || json.thumbnail || '',
      show: Boolean(json.show !== false), // Default to true if not specified
      description: json.description || '',
      sku: json.sku || json.SKU || '',
      userType: json.userType || json.user_type || 'customer',
      createdAt: json.createdAt instanceof Timestamp
        ? json.createdAt.toDate()
        : json.createdAt instanceof Date
          ? json.createdAt
          : new Date(),
      topSelling: Boolean(json.topSelling),
      minPrice: typeof json.minPrice === 'number' ? json.minPrice : 0,
      maxPrice: typeof json.maxPrice === 'number' ? json.maxPrice : 0,
      quantitySold: typeof json.quantitySold === 'number' ? json.quantitySold : 0,
      totalSalesAmount: typeof json.totalSalesAmount === 'number' ? json.totalSalesAmount : 0,
      tags: Array.isArray(json.tags) ? json.tags : [],
      detailsList: Array.isArray(json.detailsList)
        ? json.detailsList
        : Array.isArray(json.details)
          ? json.details
          : [],
      priorityNo: typeof json.priorityNo === 'number' ? json.priorityNo : 0,
      rating: typeof json.rating === 'number' ? json.rating : 0,
      numberOfRating: typeof json.numberOfRating === 'number' ? json.numberOfRating : 0,
      images: Array.isArray(json.images) ? json.images : [],
      occasionCollectionIds: Array.isArray(json.occasionCollectionIds) ? json.occasionCollectionIds : [],
    } as ProductModel & { occasionCollectionIds?: string[] });
  }

  // ... (previous static fromFirestore code block up until return new ProductModelClass(...))
  static fromFirestore(doc: DocumentSnapshot | QueryDocumentSnapshot): ProductModelClass {
    const data = doc.data();
    if (!data) {
      throw new Error(`No data found in document ${doc.id}`);
    }

    // Handle different possible field names and formats
    const name = data.name || data.title || data.productName || '';
    const lowerName = data.lowerName || name.toLowerCase() || '';
    const defaultImage = data.defaultImage || data.image || data.thumbnail || data.imageUrl || '';
    const description = data.description || data.desc || data.productDescription || '';
    const sku = data.sku || data.SKU || data.productCode || '';

    // Handle category relationships
    const mainCatDocId = data.mainCatDocId || data.mainCategoryId || data.categoryId || '';
    const defaultSubCatDocId = data.subCatDocId || data.defaultSubCatDocId || data.subcategoryId || '';
    const subcatIds = Array.isArray(data.subcatIds)
      ? data.subcatIds
      : Array.isArray(data.subcategoryIds)
        ? data.subcategoryIds
        : [];

    // Handle vendor information
    const vendorDocId = data.vendorDocId || data.vendorId || data.sellerId || '';

    // Handle arrays
    const combinationNames = Array.isArray(data.combinationNames)
      ? data.combinationNames
      : Array.isArray(data.combinations)
        ? data.combinations
        : [];

    const tags = Array.isArray(data.tags)
      ? data.tags
      : Array.isArray(data.categories)
        ? data.categories
        : [];

    const detailsList = Array.isArray(data.detailsList)
      ? data.detailsList
      : Array.isArray(data.details)
        ? data.details
        : Array.isArray(data.features)
          ? data.features
          : [];

    const occasionCollectionIds = Array.isArray(data.occasionCollectionIds)
      ? data.occasionCollectionIds
      : [];

    // Handle dates
    let createdAt: Date;
    if (data.createdAt instanceof Timestamp) {
      createdAt = data.createdAt.toDate();
    } else if (data.createdAt instanceof Date) {
      createdAt = data.createdAt;
    } else if (typeof data.createdAt === 'string') {
      createdAt = new Date(data.createdAt);
    } else {
      createdAt = new Date();
    }

    // Handle numeric fields
    const minPrice = typeof data.minPrice === 'number' ? data.minPrice :
      typeof data.min_price === 'number' ? data.min_price :
        typeof data.price === 'number' ? data.price : 0;

    const maxPrice = typeof data.maxPrice === 'number' ? data.maxPrice :
      typeof data.max_price === 'number' ? data.max_price :
        minPrice > 0 ? minPrice : 0;

    const quantitySold = typeof data.quantitySold === 'number' ? data.quantitySold :
      typeof data.quantity_sold === 'number' ? data.quantity_sold :
        typeof data.sold === 'number' ? data.sold : 0;

    const totalSalesAmount = typeof data.totalSalesAmount === 'number' ? data.totalSalesAmount :
      typeof data.total_sales === 'number' ? data.total_sales :
        typeof data.salesAmount === 'number' ? data.salesAmount : 0;

    const priorityNo = typeof data.priorityNo === 'number' ? data.priorityNo :
      typeof data.priority === 'number' ? data.priority :
        typeof data.order === 'number' ? data.order : 0;

    const rating = typeof data.rating === 'number' ? data.rating :
      typeof data.averageRating === 'number' ? data.averageRating :
        typeof data.stars === 'number' ? data.stars : 0;

    const numberOfRating = typeof data.numberOfRating === 'number' ? data.numberOfRating :
      typeof data.reviewCount === 'number' ? data.reviewCount :
        typeof data.numRatings === 'number' ? data.numRatings : 0;

    return new ProductModelClass({
      docId: doc.id,
      name,
      lowerName,
      combinationNames,
      mainCatDocId,
      defaultSubCatDocId,
      subcatIds,
      vendorDocId,
      defaultImage,
      show: Boolean(data.show !== false), // Default to true if not specified
      description,
      sku,
      userType: data.userType || data.user_type || 'customer',
      createdAt,
      topSelling: Boolean(data.topSelling || data.top_selling || data.bestseller),
      minPrice,
      maxPrice,
      quantitySold,
      totalSalesAmount,
      tags,
      detailsList,
      priorityNo,
      rating,
      numberOfRating,
      images: Array.isArray(data.images) ? data.images : (defaultImage ? [defaultImage] : []),
      occasionCollectionIds,
    } as ProductModel & { occasionCollectionIds?: string[] });
  }

  // Helper methods
  getMainImage(): string {
    return this.defaultImage || '/images/placeholder.svg';
  }

  isVisible(): boolean {
    return this.show;
  }

  isTopSelling(): boolean {
    return this.topSelling;
  }

  hasTag(tag: string): boolean {
    return this.tags.includes(tag);
  }

  hasCombination(combination: string): boolean {
    return this.combinationNames.includes(combination);
  }

  getPriceRange(): string {
    // Import formatPrice utility
    const formatPrice = (amount: number) => `₹${amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;

    if (this.minPrice && this.maxPrice && this.minPrice !== this.maxPrice) {
      return `${formatPrice(this.minPrice)} - ${formatPrice(this.maxPrice)}`;
    } else if (this.minPrice) {
      return formatPrice(this.minPrice);
    } else if (this.maxPrice) {
      return formatPrice(this.maxPrice);
    }
    return 'Price on request';
  }

  getFormattedPrice(): string {
    if (this.minPrice) {
      return `₹${this.minPrice.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
    }
    return 'Price on request';
  }

  getFormattedCreatedDate(): string {
    return this.createdAt.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getRatingStars(): string {
    const fullStars = Math.floor(this.rating);
    const hasHalfStar = this.rating % 1 >= 0.5;
    return '★'.repeat(fullStars) + (hasHalfStar ? '☆' : '') + '☆'.repeat(5 - fullStars - (hasHalfStar ? 1 : 0));
  }

  getFormattedRating(): string {
    return this.rating.toFixed(1);
  }

  getSalesInfo(): { quantity: number; amount: number; formatted: string } {
    return {
      quantity: this.quantitySold,
      amount: this.totalSalesAmount,
      formatted: `${this.quantitySold} sold • ₹${this.totalSalesAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })} revenue`
    };
  }

  getDiscountPercentage(): number {
    if (this.maxPrice && this.minPrice && this.maxPrice > this.minPrice) {
      return Math.round(((this.maxPrice - this.minPrice) / this.maxPrice) * 100);
    }
    return 0;
  }

  isInSubcategory(subcategoryId: string): boolean {
    return this.subcatIds.includes(subcategoryId) || this.defaultSubCatDocId === subcategoryId;
  }

  isFromVendor(vendorId: string): boolean {
    return this.vendorDocId === vendorId;
  }

  isInMainCategory(categoryId: string): boolean {
    return this.mainCatDocId === categoryId;
  }

  // Get a short description (excerpt)
  getExcerpt(maxLength: number = 150): string {
    if (this.description.length <= maxLength) {
      return this.description;
    }
    return this.description.substring(0, maxLength).trim() + '...';
  }

  // Check if product is available (has stock or is visible)
  isAvailable(): boolean {
    return this.show && this.minPrice > 0;
  }

  // Get product status
  getStatus(): 'available' | 'out_of_stock' | 'hidden' | 'discontinued' {
    if (!this.show) return 'hidden';
    if (this.minPrice <= 0) return 'discontinued';
    if (this.quantitySold > 0) return 'available';
    return 'out_of_stock';
  }

  // Get product badges/labels
  getBadges(): string[] {
    const badges: string[] = [];
    if (this.topSelling) badges.push('Top Selling');
    if (this.rating >= 4.5) badges.push('Highly Rated');
    if (this.getDiscountPercentage() > 0) badges.push(`${this.getDiscountPercentage()}% Off`);
    if (this.quantitySold > 100) badges.push('Popular');
    return badges;
  }
}

// Utility functions for working with products
export const productUtils = {
  // Filter visible products
  filterVisible: (products: ProductModelClass[]): ProductModelClass[] => {
    return products.filter(product => product.show);
  },

  // Filter by main category
  filterByMainCategory: (products: ProductModelClass[], categoryId: string): ProductModelClass[] => {
    return products.filter(product => product.mainCatDocId === categoryId);
  },

  // Filter by subcategory
  filterBySubcategory: (products: ProductModelClass[], subcategoryId: string): ProductModelClass[] => {
    return products.filter(product => product.isInSubcategory(subcategoryId));
  },

  // Filter by vendor
  filterByVendor: (products: ProductModelClass[], vendorId: string): ProductModelClass[] => {
    return products.filter(product => product.vendorDocId === vendorId);
  },

  // Sort by priority
  sortByPriority: (products: ProductModelClass[]): ProductModelClass[] => {
    return [...products].sort((a, b) => a.priorityNo - b.priorityNo);
  },

  // Sort by price (low to high)
  sortByPriceLowToHigh: (products: ProductModelClass[]): ProductModelClass[] => {
    return [...products].sort((a, b) => a.minPrice - b.minPrice);
  },

  // Sort by price (high to low)
  sortByPriceHighToLow: (products: ProductModelClass[]): ProductModelClass[] => {
    return [...products].sort((a, b) => b.minPrice - a.minPrice);
  },

  // Sort by rating
  sortByRating: (products: ProductModelClass[]): ProductModelClass[] => {
    return [...products].sort((a, b) => b.rating - a.rating);
  },

  // Sort by popularity (quantity sold)
  sortByPopularity: (products: ProductModelClass[]): ProductModelClass[] => {
    return [...products].sort((a, b) => b.quantitySold - a.quantitySold);
  },

  // Sort by newest first
  sortByNewest: (products: ProductModelClass[]): ProductModelClass[] => {
    return [...products].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  // Filter by tag
  filterByTag: (products: ProductModelClass[], tag: string): ProductModelClass[] => {
    return products.filter(product => product.hasTag(tag));
  },

  // Filter by combination
  filterByCombination: (products: ProductModelClass[], combination: string): ProductModelClass[] => {
    return products.filter(product => product.hasCombination(combination));
  },

  // Filter by price range
  filterByPriceRange: (products: ProductModelClass[], minPrice?: number, maxPrice?: number): ProductModelClass[] => {
    return products.filter(product => {
      if (minPrice && product.maxPrice && product.maxPrice < minPrice) {
        return false;
      }
      if (maxPrice && product.minPrice && product.minPrice > maxPrice) {
        return false;
      }
      return true;
    });
  },

  // Filter by rating
  filterByRating: (products: ProductModelClass[], minRating: number): ProductModelClass[] => {
    return products.filter(product => product.rating >= minRating);
  },

  // Filter top selling products
  filterTopSelling: (products: ProductModelClass[]): ProductModelClass[] => {
    return products.filter(product => product.topSelling);
  },

  // Search products by name, description, or tags
  searchProducts: (products: ProductModelClass[], query: string): ProductModelClass[] => {
    const lowerQuery = query.toLowerCase();
    return products.filter(product =>
      product.name.toLowerCase().includes(lowerQuery) ||
      product.lowerName.includes(lowerQuery) ||
      product.description.toLowerCase().includes(lowerQuery) ||
      product.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
      product.combinationNames.some(combo => combo.toLowerCase().includes(lowerQuery)) ||
      product.detailsList.some(detail => detail.toLowerCase().includes(lowerQuery)) ||
      product.sku.toLowerCase().includes(lowerQuery)
    );
  },

  // Get unique tags from all products
  getAllTags: (products: ProductModelClass[]): string[] => {
    const tagsSet = new Set<string>();
    products.forEach(product => {
      product.tags.forEach(tag => tagsSet.add(tag));
    });
    return Array.from(tagsSet).sort();
  },

  // Get unique combinations from all products
  getAllCombinations: (products: ProductModelClass[]): string[] => {
    const combinationsSet = new Set<string>();
    products.forEach(product => {
      product.combinationNames.forEach(combo => combinationsSet.add(combo));
    });
    return Array.from(combinationsSet).sort();
  },

  // Get unique vendors from all products
  getAllVendors: (products: ProductModelClass[]): string[] => {
    const vendorsSet = new Set<string>();
    products.forEach(product => {
      if (product.vendorDocId) {
        vendorsSet.add(product.vendorDocId);
      }
    });
    return Array.from(vendorsSet);
  },

  // Get unique main categories from all products
  getAllMainCategories: (products: ProductModelClass[]): string[] => {
    const categoriesSet = new Set<string>();
    products.forEach(product => {
      if (product.mainCatDocId) {
        categoriesSet.add(product.mainCatDocId);
      }
    });
    return Array.from(categoriesSet);
  },

  // Get unique subcategories from all products
  getAllSubcategories: (products: ProductModelClass[]): string[] => {
    const subcategoriesSet = new Set<string>();
    products.forEach(product => {
      if (product.defaultSubCatDocId) {
        subcategoriesSet.add(product.defaultSubCatDocId);
      }
      product.subcatIds.forEach(subcatId => subcategoriesSet.add(subcatId));
    });
    return Array.from(subcategoriesSet);
  },

  // Group products by main category
  groupByMainCategory: (products: ProductModelClass[]): Record<string, ProductModelClass[]> => {
    const grouped: Record<string, ProductModelClass[]> = {};
    products.forEach(product => {
      if (!grouped[product.mainCatDocId]) {
        grouped[product.mainCatDocId] = [];
      }
      grouped[product.mainCatDocId].push(product);
    });
    return grouped;
  },

  // Group products by subcategory
  groupBySubcategory: (products: ProductModelClass[]): Record<string, ProductModelClass[]> => {
    const grouped: Record<string, ProductModelClass[]> = {};
    products.forEach(product => {
      if (product.defaultSubCatDocId) {
        if (!grouped[product.defaultSubCatDocId]) {
          grouped[product.defaultSubCatDocId] = [];
        }
        grouped[product.defaultSubCatDocId].push(product);
      }
    });
    return grouped;
  },

  // Get price range across all products
  getPriceRange: (products: ProductModelClass[]): { min: number | null, max: number | null } => {
    let min: number | null = null;
    let max: number | null = null;

    products.forEach(product => {
      if (product.minPrice > 0) {
        min = min === null ? product.minPrice : Math.min(min, product.minPrice);
      }
      if (product.maxPrice > 0) {
        max = max === null ? product.maxPrice : Math.max(max, product.maxPrice);
      }
    });

    return { min, max };
  },

  // Get products with best ratings
  getBestRated: (products: ProductModelClass[], limit: number = 10): ProductModelClass[] => {
    return productUtils.sortByRating(products).slice(0, limit);
  },

  // Get trending products (top selling + high rating)
  getTrendingProducts: (products: ProductModelClass[], limit: number = 10): ProductModelClass[] => {
    return products
      .filter(product => product.rating >= 4.0 || product.topSelling)
      .sort((a, b) => {
        // Sort by combination of rating and sales
        const scoreA = a.rating * 0.6 + (a.quantitySold / 100) * 0.4;
        const scoreB = b.rating * 0.6 + (b.quantitySold / 100) * 0.4;
        return scoreB - scoreA;
      })
      .slice(0, limit);
  }
};

export default ProductModelClass;