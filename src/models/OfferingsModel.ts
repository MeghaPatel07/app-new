import { Timestamp, DocumentSnapshot, QueryDocumentSnapshot } from 'firebase/firestore';

// TypeScript interface for Offerings data structure
export interface OfferingsModel {
  docId: string;
  name: string;
  desc: string;
  image: string;
  createdAt: Date;
  priorityNo: number;
  isActive: boolean;
  combinationNames: string[];
  tags: string[];
}

// TypeScript class implementation with methods
export class OfferingsModelClass implements OfferingsModel {
  docId: string;
  name: string;
  desc: string;
  image: string;
  createdAt: Date;
  priorityNo: number;
  isActive: boolean;
  combinationNames: string[];
  tags: string[];

  constructor(data: OfferingsModel) {
    this.docId = data.docId;
    this.name = data.name;
    this.desc = data.desc;
    this.image = data.image;
    this.createdAt = data.createdAt;
    this.priorityNo = data.priorityNo;
    this.isActive = data.isActive;
    this.combinationNames = data.combinationNames;
    this.tags = data.tags;
  }

  // Converts OfferingsModel instance to JSON for Firestore
  toJson(): Record<string, any> {
    return {
      docId: this.docId,
      name: this.name,
      desc: this.desc,
      image: this.image,
      createdAt: Timestamp.fromDate(this.createdAt),
      priorityNo: this.priorityNo,
      isActive: this.isActive,
      combinationNames: this.combinationNames,
      tags: this.tags,
    };
  }

  // Creates OfferingsModel instance from JSON map
  static fromJson(json: Record<string, any>): OfferingsModelClass {
    return new OfferingsModelClass({
      docId: json.docId || '',
      name: json.name || '',
      desc: json.desc || '',
      image: json.image || '',
      createdAt: json.createdAt instanceof Timestamp
        ? json.createdAt.toDate()
        : json.createdAt instanceof Date
          ? json.createdAt
          : new Date(),
      priorityNo: typeof json.priorityNo === 'number'
        ? json.priorityNo
        : parseInt(json.priorityNo) || 0,
      isActive: Boolean(json.isActive),
      combinationNames: Array.isArray(json.combinationNames)
        ? json.combinationNames
        : [],
      tags: Array.isArray(json.tags)
        ? json.tags
        : [],
    });
  }

  // Creates OfferingsModel instance from Firestore document snapshot
  static fromFirestore(doc: DocumentSnapshot | QueryDocumentSnapshot): OfferingsModelClass {
    const data = doc.data();
    if (!data) {
      throw new Error(`No data found in document ${doc.id}`);
    }

    // Handle different possible field names and formats
    const name = data.name || data.title || '';
    const desc = data.desc || data.description || data.content || '';
    const image = data.image || data.thumbnail || data.imageUrl || '';

    // Handle date fields
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

    // Handle priority number
    const priorityNo = typeof data.priorityNo === 'number'
      ? data.priorityNo
      : typeof data.priorityNo === 'string'
        ? parseInt(data.priorityNo) || 0
        : data.priority || 0;

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

    return new OfferingsModelClass({
      docId: doc.id,
      name,
      desc,
      image,
      createdAt,
      priorityNo,
      isActive: Boolean(data.isActive !== false), // Default to true if not specified
      combinationNames,
      tags,
    });
  }

  // Helper methods
  getFormattedCreatedDate(): string {
    return this.createdAt.toLocaleDateString('en-US', {
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

  hasTag(tag: string): boolean {
    return this.tags.includes(tag);
  }

  hasCombination(combination: string): boolean {
    return this.combinationNames.includes(combination);
  }

  getExcerpt(maxLength: number = 150): string {
    if (this.desc.length <= maxLength) {
      return this.desc;
    }
    return this.desc.substring(0, maxLength).trim() + '...';
  }
}

// Utility functions for working with offerings
export const offeringsUtils = {
  // Filter active offerings
  filterActive: (offerings: OfferingsModelClass[]): OfferingsModelClass[] => {
    return offerings.filter(offering => offering.isActive);
  },

  // Sort by priority number (ascending)
  sortByPriority: (offerings: OfferingsModelClass[]): OfferingsModelClass[] => {
    return [...offerings].sort((a, b) => a.priorityNo - b.priorityNo);
  },

  // Sort by creation date (newest first)
  sortByDate: (offerings: OfferingsModelClass[]): OfferingsModelClass[] => {
    return [...offerings].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  // Filter by tag
  filterByTag: (offerings: OfferingsModelClass[], tag: string): OfferingsModelClass[] => {
    return offerings.filter(offering => offering.hasTag(tag));
  },

  // Filter by combination
  filterByCombination: (offerings: OfferingsModelClass[], combination: string): OfferingsModelClass[] => {
    return offerings.filter(offering => offering.hasCombination(combination));
  },

  // Search offerings by name or description
  searchOfferings: (offerings: OfferingsModelClass[], query: string): OfferingsModelClass[] => {
    const lowerQuery = query.toLowerCase();
    return offerings.filter(offering =>
      offering.name.toLowerCase().includes(lowerQuery) ||
      offering.desc.toLowerCase().includes(lowerQuery) ||
      offering.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
      offering.combinationNames.some(combo => combo.toLowerCase().includes(lowerQuery))
    );
  },

  // Get unique tags from all offerings
  getAllTags: (offerings: OfferingsModelClass[]): string[] => {
    const tagsSet = new Set<string>();
    offerings.forEach(offering => {
      offering.tags.forEach(tag => tagsSet.add(tag));
    });
    return Array.from(tagsSet).sort();
  },

  // Get unique combinations from all offerings
  getAllCombinations: (offerings: OfferingsModelClass[]): string[] => {
    const combinationsSet = new Set<string>();
    offerings.forEach(offering => {
      offering.combinationNames.forEach(combo => combinationsSet.add(combo));
    });
    return Array.from(combinationsSet).sort();
  },

  // Get featured offerings (top priority and active)
  getFeaturedOfferings: (offerings: OfferingsModelClass[], limit: number = 3): OfferingsModelClass[] => {
    return offeringsUtils.sortByPriority(offeringsUtils.filterActive(offerings)).slice(0, limit);
  }
};

export default OfferingsModelClass;