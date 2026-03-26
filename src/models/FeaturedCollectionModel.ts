import { Timestamp, DocumentSnapshot, QueryDocumentSnapshot } from 'firebase/firestore';

// TypeScript interface for FeaturedCollection data structure
export interface FeaturedCollectionModel {
  docId: string;
  name: string;
  image: string;
  tag: string;
  createdAt: number;
  updatedAt: number;
  priorityNo: number;
  isActive: boolean;
}

// TypeScript class implementation with methods
export class FeaturedCollectionModelClass implements FeaturedCollectionModel {
  docId: string;
  name: string;
  image: string;
  tag: string;
  createdAt: number;
  updatedAt: number;
  priorityNo: number;
  isActive: boolean;

  constructor(data: FeaturedCollectionModel) {
    this.docId = data.docId;
    this.name = data.name;
    this.image = data.image;
    this.tag = data.tag;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.priorityNo = data.priorityNo;
    this.isActive = data.isActive;
  }

  // Converts FeaturedCollectionModel instance to JSON for Firestore
  toJson(): Record<string, any> {
    return {
      docId: this.docId,
      name: this.name,
      image: this.image,
      tag: this.tag,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      priorityNo: this.priorityNo,
      isActive: this.isActive,
    };
  }

  // Creates FeaturedCollectionModel instance from JSON map
  static fromJson(json: Record<string, any>): FeaturedCollectionModelClass {
    // Transform "High in Demand" or "In High Demand" to "High Demand" for display
    const name = json.name || '';
    let transformedName = name.replace(/high\s+in\s+demand/gi, 'High Demand');
    transformedName = transformedName.replace(/in\s+high\s+demand/gi, 'High Demand');

    return new FeaturedCollectionModelClass({
      docId: json.docId || '',
      name: transformedName,
      image: json.image || '',
      tag: json.tag || '',
      createdAt: typeof json.createdAt === 'number' 
        ? json.createdAt 
        : json.createdAt instanceof Timestamp 
        ? json.createdAt.toMillis()
        : json.createdAt instanceof Date
        ? json.createdAt.getTime()
        : Date.now(),
      updatedAt: typeof json.updatedAt === 'number' 
        ? json.updatedAt 
        : json.updatedAt instanceof Timestamp 
        ? json.updatedAt.toMillis()
        : json.updatedAt instanceof Date
        ? json.updatedAt.getTime()
        : Date.now(),
      priorityNo: typeof json.priorityNo === 'number' 
        ? json.priorityNo 
        : parseInt(json.priorityNo) || 0,
      isActive: Boolean(json.isActive),
    });
  }

  // Creates FeaturedCollectionModel instance from Firestore document snapshot
  static fromFirestore(doc: DocumentSnapshot | QueryDocumentSnapshot): FeaturedCollectionModelClass {
    const data = doc.data();
    if (!data) {
      throw new Error(`No data found in document ${doc.id}`);
    }

    console.log('Parsing featured collection document:', doc.id, data);

    // Handle different possible field names and formats
    const name = data.name || data.title || '';
    const image = data.image || data.imageUrl || data.thumbnail || '';
    const tag = data.tag || data.tags || '';
    
    // Handle createdAt field (can be number, Timestamp, or Date)
    let createdAt: number;
    if (typeof data.createdAt === 'number') {
      createdAt = data.createdAt;
    } else if (data.createdAt instanceof Timestamp) {
      createdAt = data.createdAt.toMillis();
    } else if (data.createdAt instanceof Date) {
      createdAt = data.createdAt.getTime();
    } else {
      createdAt = Date.now();
    }

    // Handle updatedAt field (can be number, Timestamp, or Date)
    let updatedAt: number;
    if (typeof data.updatedAt === 'number') {
      updatedAt = data.updatedAt;
    } else if (data.updatedAt instanceof Timestamp) {
      updatedAt = data.updatedAt.toMillis();
    } else if (data.updatedAt instanceof Date) {
      updatedAt = data.updatedAt.getTime();
    } else {
      updatedAt = createdAt; // Fallback to createdAt if updatedAt is missing
    }

    // Handle priority number
    const priorityNo = typeof data.priorityNo === 'number' 
      ? data.priorityNo 
      : typeof data.priorityNo === 'string' 
      ? parseInt(data.priorityNo) || 0
      : data.priority || 0;

    // Transform "High in Demand" or "In High Demand" to "High Demand" for display
    let transformedName = name.replace(/high\s+in\s+demand/gi, 'High Demand');
    transformedName = transformedName.replace(/in\s+high\s+demand/gi, 'High Demand');

    return new FeaturedCollectionModelClass({
      docId: doc.id,
      name: transformedName,
      image,
      tag,
      createdAt,
      updatedAt,
      priorityNo,
      isActive: Boolean(data.isActive !== false), // Default to true if not specified
    });
  }

  // Helper methods
  getFormattedCreatedDate(): string {
    return new Date(this.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getFormattedUpdatedDate(): string {
    return new Date(this.updatedAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getMainImage(): string {
    return this.image || '/images/placeholder.svg';
  }

  isPublished(): boolean {
    return this.isActive;
  }

  getCreatedDate(): Date {
    return new Date(this.createdAt);
  }

  getUpdatedDate(): Date {
    return new Date(this.updatedAt);
  }
}

// Utility functions for working with featured collections
export const featuredCollectionUtils = {
  // Filter active featured collections
  filterActive: (collections: FeaturedCollectionModelClass[]): FeaturedCollectionModelClass[] => {
    return collections.filter(collection => collection.isActive);
  },

  // Sort by priority number (ascending)
  sortByPriority: (collections: FeaturedCollectionModelClass[]): FeaturedCollectionModelClass[] => {
    return [...collections].sort((a, b) => a.priorityNo - b.priorityNo);
  },

  // Sort by creation date (newest first)
  sortByDate: (collections: FeaturedCollectionModelClass[]): FeaturedCollectionModelClass[] => {
    return [...collections].sort((a, b) => b.createdAt - a.createdAt);
  },

  // Sort by update date (newest first)
  sortByUpdatedDate: (collections: FeaturedCollectionModelClass[]): FeaturedCollectionModelClass[] => {
    return [...collections].sort((a, b) => b.updatedAt - a.updatedAt);
  },

  // Filter by tag
  filterByTag: (collections: FeaturedCollectionModelClass[], tag: string): FeaturedCollectionModelClass[] => {
    return collections.filter(collection => collection.tag.toLowerCase() === tag.toLowerCase());
  },

  // Search featured collections by name or tag
  searchCollections: (collections: FeaturedCollectionModelClass[], query: string): FeaturedCollectionModelClass[] => {
    const lowerQuery = query.toLowerCase();
    return collections.filter(collection => 
      collection.name.toLowerCase().includes(lowerQuery) ||
      collection.tag.toLowerCase().includes(lowerQuery)
    );
  },

  // Get unique tags from all collections
  getAllTags: (collections: FeaturedCollectionModelClass[]): string[] => {
    const tagsSet = new Set<string>();
    collections.forEach(collection => {
      if (collection.tag) {
        tagsSet.add(collection.tag);
      }
    });
    return Array.from(tagsSet).sort();
  },

  // Get featured collections (top priority and active)
  getFeaturedCollections: (collections: FeaturedCollectionModelClass[], limit: number = 3): FeaturedCollectionModelClass[] => {
    return featuredCollectionUtils.sortByPriority(featuredCollectionUtils.filterActive(collections)).slice(0, limit);
  }
};

export default FeaturedCollectionModelClass;

