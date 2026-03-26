import { useState, useEffect, useMemo } from 'react';
import { ProductModelClass } from '../models/ProductModel';
import { DynamicFilterService, DynamicFilter } from '../services/dynamicFilterService';

interface UseDynamicFiltersResult {
  filters: DynamicFilter[];
  loading: boolean;
  error: string | null;
}

/**
 * Hook to compute dynamic filters based on displayed products
 * Filters are computed from subcategories' allData and only shown if present in >50% of products
 */
export const useDynamicFilters = (
  products: ProductModelClass[],
  threshold: number = 0.5
): UseDynamicFiltersResult => {
  const [filters, setFilters] = useState<DynamicFilter[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Memoize products to avoid unnecessary recalculations
  const productsKey = useMemo(() => {
    // Create a key based on product IDs to detect changes
    return products.map(p => p.docId).sort().join(',');
  }, [products]);

  useEffect(() => {
    console.log("========================",filters)
    const computeFilters = async () => {
      // Skip if no products
      if (products.length === 0) {
        setFilters([]);
        setLoading(false);
        setError(null);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        console.log(`useDynamicFilters: Computing filters for ${products.length} products`);

        const dynamicFilters = await DynamicFilterService.getDynamicFilters(products, threshold);
        
        console.log(`useDynamicFilters: Computed ${dynamicFilters.length} filters`);
        setFilters(dynamicFilters);
      } catch (err) {
        console.error('useDynamicFilters: Error computing filters:', err);
        setError('Failed to load dynamic filters');
        setFilters([]);
      } finally {
        setLoading(false);
      }
    };

    computeFilters();
  }, [productsKey, threshold]); // Recompute when products change or threshold changes

  return { filters, loading, error };
};

export default useDynamicFilters;

