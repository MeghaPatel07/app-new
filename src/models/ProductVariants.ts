// Enhanced Product Variant System
// Designed for dynamic, interactive variant selection with luxury UI

export interface ProductVariantOption {
  id: string;
  name: string; // "Small", "Red", "Silk", etc.
  value: string;
  priceModifier: number; // Price adjustment (+/- from base price)
  available: boolean;
  stockQuantity?: number;
  image?: string; // For color swatches, material samples, etc.
  description?: string; // Additional details about this option
}

export interface ProductVariantCategory {
  id: string;
  name: string; // "Size", "Color", "Material", "Style", etc.
  displayName: string; // Formatted display name
  type: 'single' | 'multiple'; // Single selection or multi-select
  required: boolean; // Must user select an option?
  displayType: 'buttons' | 'dropdown' | 'swatches' | 'cards'; // UI display style
  options: ProductVariantOption[];
  helpText?: string; // Size guide, care instructions, etc.
}

export interface ProductVariantSelection {
  categoryId: string;
  selectedOptions: string[]; // Array of option IDs
}

export interface ProductWithVariants {
  baseProduct: any; // Existing product interface
  variantCategories: ProductVariantCategory[];
  defaultSelections?: ProductVariantSelection[];
}

// Helper functions for variant management
export class VariantManager {
  static calculateTotalPrice(
    basePrice: number, 
    selections: ProductVariantSelection[], 
    categories: ProductVariantCategory[]
  ): number {
    let totalModifier = 0;
    
    selections.forEach(selection => {
      const category = categories.find(cat => cat.id === selection.categoryId);
      if (category) {
        selection.selectedOptions.forEach(optionId => {
          const option = category.options.find(opt => opt.id === optionId);
          if (option) {
            totalModifier += option.priceModifier;
          }
        });
      }
    });
    
    return basePrice + totalModifier;
  }
  
  static validateSelections(
    selections: ProductVariantSelection[],
    categories: ProductVariantCategory[]
  ): { isValid: boolean; missingRequired: string[] } {
    const missingRequired: string[] = [];
    
    categories.forEach(category => {
      if (category.required) {
        const selection = selections.find(sel => sel.categoryId === category.id);
        if (!selection || selection.selectedOptions.length === 0) {
          missingRequired.push(category.displayName);
        }
      }
    });
    
    return {
      isValid: missingRequired.length === 0,
      missingRequired
    };
  }
  
  static getSelectedOptionDetails(
    selections: ProductVariantSelection[],
    categories: ProductVariantCategory[]
  ): { categoryName: string; optionNames: string[] }[] {
    return selections.map(selection => {
      const category = categories.find(cat => cat.id === selection.categoryId);
      const optionNames = selection.selectedOptions.map(optionId => {
        const option = category?.options.find(opt => opt.id === optionId);
        return option?.name || 'Unknown';
      });
      
      return {
        categoryName: category?.displayName || 'Unknown Category',
        optionNames
      };
    });
  }
}

// Sample variant data for demonstration
export const sampleProductVariants: ProductVariantCategory[] = [
  {
    id: 'size',
    name: 'size',
    displayName: 'Size',
    type: 'single',
    required: true,
    displayType: 'buttons',
    helpText: 'Professional measurement available',
    options: [
      { id: 'xs', name: 'XS', value: 'extra-small', priceModifier: 0, available: true },
      { id: 's', name: 'S', value: 'small', priceModifier: 0, available: true },
      { id: 'm', name: 'M', value: 'medium', priceModifier: 0, available: true },
      { id: 'l', name: 'L', value: 'large', priceModifier: 2000, available: true },
      { id: 'xl', name: 'XL', value: 'extra-large', priceModifier: 4000, available: true },
      { id: 'xxl', name: 'XXL', value: 'double-extra-large', priceModifier: 6000, available: false }
    ]
  },
  {
    id: 'color',
    name: 'color',
    displayName: 'Color',
    type: 'single',
    required: true,
    displayType: 'swatches',
    helpText: 'Colors may vary slightly from screen display',
    options: [
      { id: 'red', name: 'Royal Red', value: 'royal-red', priceModifier: 0, available: true, image: '#DC2626' },
      { id: 'gold', name: 'Golden', value: 'golden', priceModifier: 5000, available: true, image: '#F59E0B' },
      { id: 'maroon', name: 'Maroon', value: 'maroon', priceModifier: 2000, available: true, image: '#7C2D12' },
      { id: 'pink', name: 'Rose Pink', value: 'rose-pink', priceModifier: 1000, available: true, image: '#EC4899' },
      { id: 'blue', name: 'Royal Blue', value: 'royal-blue', priceModifier: 3000, available: true, image: '#1D4ED8' }
    ]
  },
  {
    id: 'material',
    name: 'material',
    displayName: 'Fabric Material',
    type: 'single',
    required: true,
    displayType: 'cards',
    helpText: 'Premium materials with authenticity guarantee',
    options: [
      { 
        id: 'silk', 
        name: 'Pure Silk', 
        value: 'pure-silk', 
        priceModifier: 0, 
        available: true,
        description: 'Luxurious pure silk with natural sheen'
      },
      { 
        id: 'velvet', 
        name: 'Rich Velvet', 
        value: 'rich-velvet', 
        priceModifier: 8000, 
        available: true,
        description: 'Premium velvet for royal elegance'
      },
      { 
        id: 'brocade', 
        name: 'Silk Brocade', 
        value: 'silk-brocade', 
        priceModifier: 12000, 
        available: true,
        description: 'Handwoven silk brocade with intricate patterns'
      }
    ]
  },
  {
    id: 'embellishments',
    name: 'embellishments',
    displayName: 'Embellishments',
    type: 'multiple',
    required: false,
    displayType: 'cards',
    helpText: 'Add premium embellishments (optional)',
    options: [
      { 
        id: 'zardozi', 
        name: 'Zardozi Work', 
        value: 'zardozi-embroidery', 
        priceModifier: 15000, 
        available: true,
        description: 'Traditional gold thread embroidery'
      },
      { 
        id: 'stones', 
        name: 'Stone Work', 
        value: 'stone-embellishment', 
        priceModifier: 10000, 
        available: true,
        description: 'Premium stone and crystal work'
      },
      { 
        id: 'pearls', 
        name: 'Pearl Details', 
        value: 'pearl-work', 
        priceModifier: 8000, 
        available: true,
        description: 'Elegant pearl embellishments'
      }
    ]
  }
];
