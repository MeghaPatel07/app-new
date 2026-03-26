import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { ProductModelClass } from '../models/ProductModel';
import { VariantModelClass } from './variantService';

export interface DynamicFilter {
  filterKey: string;         // e.g., "colors", "sizes", "materials"
  values: string[];         // From variant detailTypes
}

export class DynamicFilterService {
  // Cache for variant documents grouped by productId
  private static variantCache: Map<string, any[]> = new Map();

  /**
   * Standardize keys to merge variations like "color" and "colors"
   */
  private static standardizeKey(key: string): string {
    const k = key.toLowerCase().trim();
    if (k === 'colors') return 'color';
    if (k === 'sizes') return 'size';
    if (k === 'fabrics') return 'fabric';
    if (k === 'materials') return 'material';
    if (k === 'styles') return 'style';
    if (k === 'designs') return 'design';
    return k;
  }

  /**
   * Get dynamic filters based on products' variants
   * @param products - Array of products currently displayed
   * @param threshold - Minimum percentage of products that must have a filter key (default 0)
   * @returns Promise resolving to array of dynamic filters
   */
  static async getDynamicFilters(
    products: ProductModelClass[],
    threshold: number = 0
  ): Promise<DynamicFilter[]> {
    try {
      if (products.length === 0) return [];

      // Step 0: Ensure variants are cached
      const productIdsToFetch = products
        .map(p => p.docId)
        .filter(id => !this.variantCache.has(id));

      if (productIdsToFetch.length > 0) {
        const batches = [];
        for (let i = 0; i < productIdsToFetch.length; i += 30) {
          batches.push(productIdsToFetch.slice(i, i + 30));
        }

        const variantsRef = collection(db, 'variants');
        const fetchPromises = batches.map(async (batch) => {
          const q = query(variantsRef, where('productId', 'in', batch));
          const snap = await getDocs(q);
          const batchResults: Record<string, VariantModelClass[]> = {};
          batch.forEach(id => batchResults[id] = []);
          
          snap.forEach(doc => {
            const variant = VariantModelClass.fromSnap(doc as any);
            const productId = variant.productId;
            if (productId && batchResults[productId]) {
              batchResults[productId].push(variant);
            }
          });
          return batchResults;
        });

        const allBatchResults = await Promise.all(fetchPromises);
        allBatchResults.forEach(batchRes => {
          Object.entries(batchRes).forEach(([pid, variants]) => {
            this.variantCache.set(pid, variants);
          });
        });
      }

      // Step 1: Collect unique keys from variant detailTypes
      const keyVariationsMap = new Map<string, Set<string>>();
      products.forEach(product => {
        const variants = this.variantCache.get(product.docId) || [];
        variants.forEach(variant => {
          const detailTypes = variant.detailTypes || variant.variantDetailTypes || {};
          Object.keys(detailTypes).forEach(originalKey => {
            const val = detailTypes[originalKey];
            if (originalKey && val !== undefined && val !== null && val !== '') {
              const stdKey = this.standardizeKey(originalKey);
              if (!keyVariationsMap.has(stdKey)) {
                keyVariationsMap.set(stdKey, new Set<string>());
              }
              keyVariationsMap.get(stdKey)!.add(originalKey);
            }
          });
        });
      });

      const stdKeys = Array.from(keyVariationsMap.keys());
      if (stdKeys.length === 0) return [];

      // Step 2: Initialize counts and values
      const keyCounts = new Map<string, number>();
      const keyValuesMap = new Map<string, Map<string, string>>();

      stdKeys.forEach(stdKey => {
        keyCounts.set(stdKey, 0);
        keyValuesMap.set(stdKey, new Map<string, string>());
      });

      // Step 3: Count product occurrences and collect unique values
      products.forEach(product => {
        const productVariants = this.variantCache.get(product.docId) || [];
        
        stdKeys.forEach(stdKey => {
          const originalKeyVariations = keyVariationsMap.get(stdKey) || new Set();
          const valuesMap = keyValuesMap.get(stdKey)!;
          let hasKey = false;

          productVariants.forEach(variant => {
            const detailTypes = variant.detailTypes || variant.variantDetailTypes || {};
            for (const originalKey of originalKeyVariations) {
                const value = detailTypes[originalKey];
                const values = Array.isArray(value) ? value : [value];

                values.forEach(val => {
                  if (val === undefined || val === null || val === '') return;
                  
                  const valueStr = String(val).trim();
                  if (valueStr === '') return;

                  // Handle potential comma-separated values within a single value
                  const parts = valueStr.includes(',') 
                    ? valueStr.split(',').map(p => p.trim())
                    : [valueStr];

                  parts.forEach(part => {
                    const normalizedValue = part.toLowerCase();
                    if (normalizedValue !== 'null' && normalizedValue !== '') {
                      if (!valuesMap.has(normalizedValue)) {
                        valuesMap.set(normalizedValue, part); // Preserve casing of first occurrence
                      }
                      hasKey = true;
                    }
                  });
                });
            }
          });

          if (hasKey) {
            keyCounts.set(stdKey, (keyCounts.get(stdKey) || 0) + 1);
          }
        });
      });

      // Step 4: Apply threshold and build Result
      const totalProducts = products.length;
      const minCount = Math.ceil(totalProducts * threshold);
      const filteredResults: DynamicFilter[] = [];

      keyCounts.forEach((count, stdKey) => {
        if (count >= minCount) {
          const valuesMap = keyValuesMap.get(stdKey)!;
          // Sort values alphabetically
          const values = Array.from(valuesMap.values()).sort((a, b) => 
            a.toLowerCase().localeCompare(b.toLowerCase())
          );
          
          if (values.length > 0) {
            filteredResults.push({
              filterKey: stdKey,
              values: values
            });
          }
        }
      });

      return filteredResults.sort((a, b) => a.filterKey.localeCompare(b.filterKey));
    } catch (error) {
      console.error('DynamicFilterService: Error computing dynamic filters:', error);
      return [];
    }
  }

  /**
   * Clear the caches (useful for testing or when data changes)
   */
  static clearCache(): void {
    this.variantCache.clear();
    console.log('DynamicFilterService: Caches cleared');
  }

  /**
   * Get the minimum price from cached variants for a product
   */
  static getMinPriceForProduct(productId: string): number | null {
    const variants = this.variantCache.get(productId) || [];
    if (variants.length === 0) return null;

    let min = Infinity;
    variants.forEach(v => {
      const price = v.variantPrice || 0;
      if (price > 0 && price < min) {
        min = price;
      }
    });

    return min === Infinity ? null : min;
  }

  /**
   * Get cache size (for debugging)
   */
  static getCacheSize(): number {
    return this.variantCache.size;
  }

  /**
   * Check if a product matches a filter value.
   * MATCHES ONLY AGAINST VARIANT DETAILTYPES PER USER REQUEST.
   */
  static productMatchesFilter(
    product: ProductModelClass,
    filterKey: string,
    filterValue: string
  ): boolean {
    const stdFilterKey = this.standardizeKey(filterKey);
    const normalizedFilterValue = String(filterValue).toLowerCase().trim();

    // ── Variant-level detailTypes matching (EXCLUSIVE SOURCE) ────────────────
    const variants = this.variantCache.get(product.docId) || [];
    
    // If no variants cached, we can't match strictly against detailTypes
    if (variants.length === 0) return false;

    for (const variant of variants) {
      const detailTypes = variant.detailTypes || variant.variantDetailTypes || {};
      for (const key in detailTypes) {
        if (this.standardizeKey(key) === stdFilterKey) {
          const val = detailTypes[key];
          if (val === undefined || val === null) continue;
          
          const valStr = String(val).trim();
          // Handle potential comma-separated values
          const parts = valStr.includes(',') 
            ? valStr.split(',').map(p => p.trim())
            : [valStr];

          if (parts.some(p => p.toLowerCase() === normalizedFilterValue)) {
            return true;
          }
        }
      }
    }

    return false;
  }
}

export default DynamicFilterService;
