import { DocumentSnapshot, QueryDocumentSnapshot } from 'firebase/firestore';

// TypeScript interface for SubCategory data structure
export interface SubCategoryModel {
  docId: string;
  name: string;
  image: string;
  isActive: boolean;
  isManualCreated: boolean;
  combinationNames: string[];
  offeringId: string;
  minPrice?: number;
  maxPrice?: number;
  tags: string[];
  detailTypes: Record<string, any>[];
  marginPercentage: number;
  allData: Record<string, string[]>;
}

// TypeScript class implementation with methods
export class SubCategoryModelClass implements SubCategoryModel {
  docId: string;
  name: string;
  image: string;
  isActive: boolean;
  isManualCreated: boolean;
  combinationNames: string[];
  offeringId: string;
  minPrice?: number;
  maxPrice?: number;
  tags: string[];
  detailTypes: Record<string, any>[];
  marginPercentage: number;
  allData: Record<string, string[]>;

  constructor(data: SubCategoryModel) {
    this.docId = data.docId;
    this.name = data.name;
    this.image = data.image;
    this.isActive = data.isActive;
    this.isManualCreated = data.isManualCreated;
    this.combinationNames = data.combinationNames;
    this.offeringId = data.offeringId;
    this.minPrice = data.minPrice;
    this.maxPrice = data.maxPrice;
    this.tags = data.tags;
    this.detailTypes = data.detailTypes;
    this.marginPercentage = data.marginPercentage;
    this.allData = data.allData;
  }

  // Converts SubCategoryModel instance to JSON for Firestore
  toJson(): Record<string, any> {
    return {
      docId: this.docId,
      name: this.name,
      image: this.image,
      isActive: this.isActive,
      isManualCreated: this.isManualCreated,
      combinationNames: this.combinationNames,
      offeringId: this.offeringId,
      minPrice: this.minPrice,
      maxPrice: this.maxPrice,
      tags: this.tags,
      detailTypes: this.detailTypes,
      marginPercentage: this.marginPercentage,
      allData: this.allData,
    };
  }

  // Creates SubCategoryModel instance from JSON map
  static fromJson(json: Record<string, any>): SubCategoryModelClass {
    return new SubCategoryModelClass({
      docId: json.docId || '',
      name: json.name || '',
      image: json.image || '',
      isActive: Boolean(json.isActive),
      isManualCreated: Boolean(json.isManualCreated),
      combinationNames: Array.isArray(json.combinationNames) 
        ? json.combinationNames 
        : [],
      offeringId: json.offeringId || '',
      minPrice: typeof json.minPrice === 'number' ? json.minPrice : undefined,
      maxPrice: typeof json.maxPrice === 'number' ? json.maxPrice : undefined,
      tags: Array.isArray(json.tags) ? json.tags : [],
      detailTypes: Array.isArray(json.detailTypes) ? json.detailTypes : [],
      marginPercentage: typeof json.marginPercentage === 'number' 
        ? json.marginPercentage 
        : 0,
      allData: json.allData && typeof json.allData === 'object' 
        ? this.parseAllData(json.allData) 
        : {},
    });
  }

  // Helper method to parse allData field
  private static parseAllData(allData: any): Record<string, string[]> {
    const result: Record<string, string[]> = {};
    
    if (typeof allData === 'object' && allData !== null) {
      Object.entries(allData).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          result[key] = value.map(item => String(item));
        } else if (value !== null && value !== undefined) {
          result[key] = [String(value)];
        } else {
          result[key] = [];
        }
      });
    }
    
    return result;
  }

  // Creates SubCategoryModel instance from Firestore document snapshot
  static fromFirestore(doc: DocumentSnapshot | QueryDocumentSnapshot): SubCategoryModelClass {
    const data = doc.data();
    if (!data) {
      throw new Error(`No data found in document ${doc.id}`);
    }

    console.log('Parsing subcategory document:', doc.id, data);

    // Handle different possible field names and formats
    const name = data.name || data.title || '';
    const image = data.image || data.thumbnail || data.imageUrl || '';
    const offeringId = data.offeringId || data.offering_id || data.parentId || '';

    // Handle price fields
    const minPrice = typeof data.minPrice === 'number' ? data.minPrice : 
                     typeof data.min_price === 'number' ? data.min_price : undefined;
    const maxPrice = typeof data.maxPrice === 'number' ? data.maxPrice : 
                     typeof data.max_price === 'number' ? data.max_price : undefined;

    // Handle margin percentage
    const marginPercentage = typeof data.marginPercentage === 'number' ? data.marginPercentage :
                            typeof data.margin_percentage === 'number' ? data.margin_percentage :
                            typeof data.margin === 'number' ? data.margin : 0;

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

    const detailTypes = Array.isArray(data.detailTypes) 
      ? data.detailTypes 
      : Array.isArray(data.detail_types)
      ? data.detail_types
      : [];

    // Handle allData object
    const allData = this.parseAllData(data.allData || data.all_data || {});

    return new SubCategoryModelClass({
      docId: doc.id,
      name,
      image,
      isActive: Boolean(data.isActive !== false), // Default to true if not specified
      isManualCreated: Boolean(data.isManualCreated === true), // Default to false if not specified
      combinationNames,
      offeringId,
      minPrice,
      maxPrice,
      tags,
      detailTypes,
      marginPercentage,
      allData,
    });
  }

  // Helper methods
  getMainImage(): string {
    return this.image || '/images/placeholder.svg';
  }

  isPublished(): boolean {
    return this.isActive;
  }

  hasTag(tag: string): boolean {
    return this.tags.includes(tag);
  }

  hasCombination(combination: string): boolean {
    return this.combinationNames.includes(combination);
  }

  getPriceRange(): string {
    if (this.minPrice && this.maxPrice) {
      return `$${this.minPrice} - $${this.maxPrice}`;
    } else if (this.minPrice) {
      return `From $${this.minPrice}`;
    } else if (this.maxPrice) {
      return `Up to $${this.maxPrice}`;
    }
    return 'Price on request';
  }

  getFormattedMargin(): string {
    return `${this.marginPercentage}%`;
  }

  // Get available options from allData
  getAvailableOptions(): Record<string, string[]> {
    return { ...this.allData };
  }

  // Get specific option values (e.g., colors, sizes, materials)
  getOptionValues(optionKey: string): string[] {
    return this.allData[optionKey] || [];
  }

  // Check if subcategory has specific option value
  hasOptionValue(optionKey: string, value: string): boolean {
    const options = this.getOptionValues(optionKey);
    return options.includes(value);
  }

  // Get all available option keys
  getOptionKeys(): string[] {
    return Object.keys(this.allData);
  }

  // Get colors if available
  getColors(): string[] {
    return this.getOptionValues('colors') || this.getOptionValues('color') || [];
  }

  // Get sizes if available
  getSizes(): string[] {
    return this.getOptionValues('sizes') || this.getOptionValues('size') || [];
  }

  // Get materials if available
  getMaterials(): string[] {
    return this.getOptionValues('materials') || this.getOptionValues('material') || [];
  }

  // Get detail types as formatted string
  getDetailTypesFormatted(): string[] {
    return this.detailTypes.map(detail => {
      if (typeof detail === 'string') {
        return detail;
      } else if (typeof detail === 'object' && detail.name) {
        return detail.name;
      } else if (typeof detail === 'object' && detail.type) {
        return detail.type;
      }
      return JSON.stringify(detail);
    });
  }
}

// Utility functions for working with subcategories
export const subCategoryUtils = {
  // Filter active subcategories
  filterActive: (subcategories: SubCategoryModelClass[]): SubCategoryModelClass[] => {
    return subcategories.filter(subcategory => subcategory.isActive);
  },

  // Filter by offering ID
  filterByOfferingId: (subcategories: SubCategoryModelClass[], offeringId: string): SubCategoryModelClass[] => {
    return subcategories.filter(subcategory => subcategory.offeringId === offeringId);
  },

  // Sort by name
  sortByName: (subcategories: SubCategoryModelClass[]): SubCategoryModelClass[] => {
    return [...subcategories].sort((a, b) => a.name.localeCompare(b.name));
  },

  // Sort by price (min price)
  sortByPrice: (subcategories: SubCategoryModelClass[]): SubCategoryModelClass[] => {
    return [...subcategories].sort((a, b) => {
      const priceA = a.minPrice || 0;
      const priceB = b.minPrice || 0;
      return priceA - priceB;
    });
  },

  // Filter by tag
  filterByTag: (subcategories: SubCategoryModelClass[], tag: string): SubCategoryModelClass[] => {
    return subcategories.filter(subcategory => subcategory.hasTag(tag));
  },

  // Filter by combination
  filterByCombination: (subcategories: SubCategoryModelClass[], combination: string): SubCategoryModelClass[] => {
    return subcategories.filter(subcategory => subcategory.hasCombination(combination));
  },

  // Filter by price range
  filterByPriceRange: (subcategories: SubCategoryModelClass[], minPrice?: number, maxPrice?: number): SubCategoryModelClass[] => {
    return subcategories.filter(subcategory => {
      if (minPrice && subcategory.maxPrice && subcategory.maxPrice < minPrice) {
        return false;
      }
      if (maxPrice && subcategory.minPrice && subcategory.minPrice > maxPrice) {
        return false;
      }
      return true;
    });
  },

  // Search subcategories by name or tags
  searchSubCategories: (subcategories: SubCategoryModelClass[], query: string): SubCategoryModelClass[] => {
    const lowerQuery = query.toLowerCase();
    return subcategories.filter(subcategory => 
      subcategory.name.toLowerCase().includes(lowerQuery) ||
      subcategory.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
      subcategory.combinationNames.some(combo => combo.toLowerCase().includes(lowerQuery)) ||
      Object.keys(subcategory.allData).some(key => key.toLowerCase().includes(lowerQuery)) ||
      Object.values(subcategory.allData).some(values => 
        values.some(value => value.toLowerCase().includes(lowerQuery))
      )
    );
  },

  // Get unique tags from all subcategories
  getAllTags: (subcategories: SubCategoryModelClass[]): string[] => {
    const tagsSet = new Set<string>();
    subcategories.forEach(subcategory => {
      subcategory.tags.forEach(tag => tagsSet.add(tag));
    });
    return Array.from(tagsSet).sort();
  },

  // Get unique combinations from all subcategories
  getAllCombinations: (subcategories: SubCategoryModelClass[]): string[] => {
    const combinationsSet = new Set<string>();
    subcategories.forEach(subcategory => {
      subcategory.combinationNames.forEach(combo => combinationsSet.add(combo));
    });
    return Array.from(combinationsSet).sort();
  },

  // Get unique offering IDs
  getAllOfferingIds: (subcategories: SubCategoryModelClass[]): string[] => {
    const offeringIdsSet = new Set<string>();
    subcategories.forEach(subcategory => {
      if (subcategory.offeringId) {
        offeringIdsSet.add(subcategory.offeringId);
      }
    });
    return Array.from(offeringIdsSet);
  },

  // Get all unique option keys across all subcategories
  getAllOptionKeys: (subcategories: SubCategoryModelClass[]): string[] => {
    const optionKeysSet = new Set<string>();
    subcategories.forEach(subcategory => {
      subcategory.getOptionKeys().forEach(key => optionKeysSet.add(key));
    });
    return Array.from(optionKeysSet).sort();
  },

  // Get all unique values for a specific option key
  getAllOptionValues: (subcategories: SubCategoryModelClass[], optionKey: string): string[] => {
    const valuesSet = new Set<string>();
    subcategories.forEach(subcategory => {
      subcategory.getOptionValues(optionKey).forEach(value => valuesSet.add(value));
    });
    return Array.from(valuesSet).sort();
  },

  // Group subcategories by offering ID
  groupByOfferingId: (subcategories: SubCategoryModelClass[]): Record<string, SubCategoryModelClass[]> => {
    const grouped: Record<string, SubCategoryModelClass[]> = {};
    subcategories.forEach(subcategory => {
      if (!grouped[subcategory.offeringId]) {
        grouped[subcategory.offeringId] = [];
      }
      grouped[subcategory.offeringId].push(subcategory);
    });
    return grouped;
  },

  // Get price range across all subcategories
  getPriceRange: (subcategories: SubCategoryModelClass[]): { min: number | null, max: number | null } => {
    let min: number | null = null;
    let max: number | null = null;

    subcategories.forEach(subcategory => {
      if (subcategory.minPrice !== undefined) {
        min = min === null ? subcategory.minPrice : Math.min(min, subcategory.minPrice);
      }
      if (subcategory.maxPrice !== undefined) {
        max = max === null ? subcategory.maxPrice : Math.max(max, subcategory.maxPrice);
      }
    });

    return { min, max };
  }
};

export default SubCategoryModelClass;