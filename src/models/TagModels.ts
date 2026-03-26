export interface TagModel {
  docId: string;
  name: string;
  type: string;
  typeId: string;
  tags: string[];
}

export class TypeModel {
  static readonly CATEGORY = "cat";
  static readonly SUBCATEGORY = "subcat";
  static readonly PRODUCT = "product";
  static readonly BLOG = "blog";
  static readonly OFFERING = "offering";
}

export interface TagMetadata {
  docId: string;
  name: string;
  type: string;
  typeId: string;
  tags: string[];
  createdAt: Date;
  isActive: boolean;
}
