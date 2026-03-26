/**
 * Hook for vector search: calls findSimilarItems Cloud Function,
 * then fetches full product data for matching product IDs and
 * products from matching subcategories.
 */

import { useState, useEffect, useCallback } from 'react';
import { ProductModelClass, productUtils } from '../models/ProductModel';
import { ProductService } from '../services/productService';
import { findSimilarItems, FindSimilarItemsResponse } from '../services/vectorSearchService';

export interface VectorSearchState {
  products: ProductModelClass[];
  loading: boolean;
  error: string | null;
  rawResult: FindSimilarItemsResponse | null;
  hasVectorMatches: boolean;
}

const DEBOUNCE_MS = 400;
const MIN_QUERY_LENGTH = 2;
const MAX_PRODUCTS_FROM_VECTOR = 120;
const MIN_PRODUCT_SIMILARITY = 0.2;
const MIN_SUBCATEGORY_SIMILARITY = 0.18;
const SUBCATEGORY_SCORE_FACTOR = 0.92;

export function useVectorSearch(searchQuery: string, isEnabled: boolean = true): VectorSearchState {
  const [products, setProducts] = useState<ProductModelClass[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawResult, setRawResult] = useState<FindSimilarItemsResponse | null>(null);
  const [hasVectorMatches, setHasVectorMatches] = useState(false);

  const fetchProductsForVectorResult = useCallback(async (result: FindSimilarItemsResponse) => {
    const productIds = result.byType.products.map((p) => p.id);
    const subcategoryIds = result.byType.subcategories.map((s) => s.id);
    const seenDocIds = new Set<string>();
    const merged: ProductModelClass[] = [];

    // 1. Fetch direct product matches in parallel
    const productPromises = productIds.map(id =>
      ProductService.getProductById(id).catch(() => null)
    );
    const matchedProducts = await Promise.all(productPromises);

    for (const product of matchedProducts) {
      if (product && !seenDocIds.has(product.docId || '')) {
        seenDocIds.add(product.docId || '');
        merged.push(product);
      }
    }

    // 2. Fetch products from each matching subcategory in parallel
    const subcategoryPromises = subcategoryIds.map(subId =>
      ProductService.getProductsBySubcategory(subId).catch(() => [])
    );
    const subcategoryResults = await Promise.all(subcategoryPromises);

    for (const subProducts of subcategoryResults) {
      const sorted = productUtils.sortByPriority(subProducts);
      for (const p of sorted) {
        if (p.docId && !seenDocIds.has(p.docId)) {
          seenDocIds.add(p.docId);
          merged.push(p);
        }
      }
    }

    return merged;
  }, []);

  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!isEnabled || trimmed.length < MIN_QUERY_LENGTH) {
      setProducts([]);
      setLoading(false);
      setError(null);
      setRawResult(null);
      setHasVectorMatches(false);
      return;
    }

    let cancelled = false;
    const timeoutId = setTimeout(async () => {
      setLoading(true);
      setError(null);
      setRawResult(null);
      setHasVectorMatches(false);

      try {
        const result = await findSimilarItems(trimmed);
        if (cancelled) return;

        setRawResult(result);
        const productList = await fetchProductsForVectorResult(result);
        if (cancelled) return;

        setProducts(productList);
        setHasVectorMatches(productList.length > 0);
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'Vector search failed';
        setError(message);
        setProducts([]);
        setHasVectorMatches(false);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [searchQuery, fetchProductsForVectorResult, isEnabled]);

  return { products, loading, error, rawResult, hasVectorMatches };
}
