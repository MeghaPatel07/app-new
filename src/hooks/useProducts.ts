import { useQuery } from '@tanstack/react-query';
import { collection, query, where, getDocs, getDoc, doc, orderBy as fsOrderBy, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import type { Product } from '../types';

export type ProductSortField = 'priority' | 'price' | 'price-low' | 'price-high' | 'createdAt' | 'name' | 'rating' | 'newest';
export type SortDirection = 'asc' | 'desc';

interface UseProductsOptions {
  category?: string;
  mainCatDocId?: string;
  subcategoryId?: string;
  search?: string;
  sortBy?: ProductSortField;
  sortDir?: SortDirection;
  minPrice?: number;
  maxPrice?: number;
}

/**
 * Process image URL (especially Google Drive links)
 */
function processImageUrl(url: string): string {
  if (!url) return '';
  if (url.includes('drive.google.com')) {
    const fileId = url.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1];
    if (fileId) {
      return `https://drive.google.com/uc?export=view&id=${fileId}`;
    }
  }
  return url;
}


/**
 * Batch-fetch default variant prices for products that have minPrice=0 & maxPrice=0.
 * Single Firestore query: all variants where defaultt==true, build productId→fixedprice map.
 */
async function fetchDefaultVariantPriceMap(): Promise<Map<string, number>> {
  const priceMap = new Map<string, number>();
  try {
    const variantsRef = collection(db, 'variants');
    const q = query(variantsRef, where('defaultt', '==', true));
    const snap = await getDocs(q);

    snap.docs.forEach((d) => {
      const data = d.data();
      const productId = data.productId;
      const price = data.fixedprice || data.variantPrice || data.sellingprice || data.originalprice || 0;
      if (productId && price > 0) {
        priceMap.set(productId, price);
      }
    });
    console.log(`[fetchDefaultVariantPriceMap] Mapped ${priceMap.size} variant prices`);
  } catch (error) {
    console.error('[fetchDefaultVariantPriceMap] Error:', error);
  }
  return priceMap;
}

/**
 * Fetch all products from Firestore.
 * For products with minPrice=0 & maxPrice=0, uses the default variant's fixedprice.
 */
async function fetchAllProducts(): Promise<Product[]> {
  try {
    // Parallel fetch: all products + default variant price map
    const [productsSnap, variantPriceMap] = await Promise.all([
      getDocs(collection(db, 'products')),
      fetchDefaultVariantPriceMap(),
    ]);

    console.log(`[fetchAllProducts] Total docs: ${productsSnap.size} | Variant prices: ${variantPriceMap.size}`);

    const products: Product[] = [];

    productsSnap.docs.forEach((d) => {
      const data = d.data();
      const images = (data.images || []).map(processImageUrl).filter((img: string) => img);
      const fallbackImages = images.length === 0 && data.defaultImage ? [processImageUrl(data.defaultImage)] : [];
      const finalImages = images.length > 0 ? images : fallbackImages;

      let price = data.minPrice || 0;
      let originalPrice = data.maxPrice || data.minPrice || 0;

      // Fallback: if both are 0, use default variant's fixedprice
      if (price === 0 && originalPrice === 0) {
        const variantPrice = variantPriceMap.get(d.id) || 0;
        if (variantPrice > 0) {
          price = variantPrice;
          originalPrice = variantPrice;
        }
      }

      products.push({
        id: d.id,
        docId: d.id,
        name: data.name || '',
        category: data.mainCatDocId || data.category || '',
        subcategory: data.defaultSubCatDocId || data.subcategory || '',
        price,
        originalPrice,
        rating: data.rating ?? 0,
        reviews: data.numberOfRating ?? 0,
        images: finalImages,
        description: data.description || '',
        features: data.detailsList || [],
        trending: data.topSelling ?? false,
        newArrival: isNewArrival(data.createdAt),
        bestSeller: data.topSelling ?? false,
        tags: data.tags || [],
        createdAt: data.createdAt,
        priorityNo: data.priorityNo || 999,
      } as Product);
    });

    const zeroPriceCount = products.filter(p => p.price === 0).length;
    console.log(`[fetchAllProducts] Total: ${products.length} | Still zero-price: ${zeroPriceCount}`);
    return products;
  } catch (error) {
    console.error('Error fetching all products:', error);
    return [];
  }
}

/**
 * Fetch products by main category (offering)
 * Simple, direct approach without variant fetching at query time
 */
async function fetchProductsByCategory(mainCatDocId: string): Promise<Product[]> {
  try {
    const productsRef = collection(db, 'products');
    const q = query(
      productsRef,
      where('mainCatDocId', '==', mainCatDocId)
    );

    // Parallel fetch: category products + variant price fallback map
    const [snap, variantPriceMap] = await Promise.all([
      getDocs(q),
      fetchDefaultVariantPriceMap(),
    ]);

    const products: Product[] = [];

    snap.docs.forEach((d) => {
      const data = d.data();
      const images = (data.images || []).map(processImageUrl).filter((img: string) => img);
      const fallbackImages = images.length === 0 && data.defaultImage ? [processImageUrl(data.defaultImage)] : [];
      const finalImages = images.length > 0 ? images : fallbackImages;

      let price = data.minPrice || 0;
      let originalPrice = data.maxPrice || 0;

      // Fallback: if both are 0, use default variant's fixedprice
      if (price === 0 && originalPrice === 0) {
        const variantPrice = variantPriceMap.get(d.id) || 0;
        if (variantPrice > 0) {
          price = variantPrice;
          originalPrice = variantPrice;
        }
      }

      products.push({
        id: d.id,
        docId: d.id,
        name: data.name || '',
        category: mainCatDocId,
        subcategory: data.defaultSubCatDocId || '',
        price,
        originalPrice,
        rating: data.rating ?? 0,
        reviews: data.numberOfRating ?? 0,
        images: finalImages,
        description: data.description || '',
        features: data.detailsList || [],
        trending: data.topSelling ?? false,
        newArrival: isNewArrival(data.createdAt),
        bestSeller: data.topSelling ?? false,
        tags: data.tags || [],
        createdAt: data.createdAt,
        priorityNo: data.priorityNo || 999,
      } as Product);
    });

    console.log(`[fetchProductsByCategory] ${products.length} products for category: ${mainCatDocId}`);
    return products;
  } catch (error) {
    console.error('Error fetching products by category:', error);
    return [];
  }
}

/**
 * Check if product is a new arrival (created within last 30 days)
 */
function isNewArrival(createdAt: any): boolean {
  if (!createdAt) return false;
  const created = createdAt instanceof Timestamp
    ? createdAt.toDate()
    : new Date(createdAt);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return created > thirtyDaysAgo;
}

/**
 * Apply filters, search, and sorting to products
 */
function applyFiltersAndSort(
  products: Product[],
  opts: UseProductsOptions
): Product[] {
  let filtered = [...products];

  // ── Text search ─────────────────────────────────────────────────────────────
  if (opts.search && opts.search.trim().length >= 2) {
    const lowerSearch = opts.search.trim().toLowerCase();
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(lowerSearch) ||
      p.description?.toLowerCase().includes(lowerSearch) ||
      (p.tags ?? []).some(t => t.toLowerCase().includes(lowerSearch))
    );
  }

  // ── Price filtering ──────────────────────────────────────────────────────────
  if (opts.minPrice !== undefined || opts.maxPrice !== undefined) {
    const minPrice = opts.minPrice ?? 0;
    const maxPrice = opts.maxPrice ?? 200000;
    filtered = filtered.filter(p => p.price >= minPrice && p.price <= maxPrice);
  }

  // ── Sorting ──────────────────────────────────────────────────────────────────
  const sortBy = opts.sortBy || 'priority';
  switch (sortBy) {
    case 'priority':
      filtered.sort((a, b) => (a.priorityNo || 999) - (b.priorityNo || 999));
      break;
    case 'price-low':
      filtered.sort((a, b) => a.price - b.price);
      break;
    case 'price-high':
      filtered.sort((a, b) => b.price - a.price);
      break;
    case 'rating':
      filtered.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
      break;
    case 'newest':
    case 'createdAt': {
      filtered.sort((a, b) => {
        const ta = a.createdAt instanceof Timestamp
          ? a.createdAt.toDate().getTime()
          : new Date(a.createdAt).getTime();
        const tb = b.createdAt instanceof Timestamp
          ? b.createdAt.toDate().getTime()
          : new Date(b.createdAt).getTime();
        return tb - ta;
      });
      break;
    }
    case 'name':
      filtered.sort((a, b) => a.name.localeCompare(b.name));
      break;
    default:
      break;
  }

  return filtered;
}

/**
 * Hook: Fetch all visible products (no pagination)
 */
export function useProducts(opts: UseProductsOptions = {}) {
  const { category } = opts;

  return useQuery({
    queryKey: category
      ? ['products', 'category', category]
      : ['products', 'all-visible'],
    queryFn: async () => {
      console.log('[useProducts] queryFn called — category:', category ?? 'ALL');
      const products = category
        ? await fetchProductsByCategory(category)
        : await fetchAllProducts();
      console.log('[useProducts] Returned', products.length, 'products');
      return products;
    },
    staleTime: 2 * 60_000, // 2 minutes
  });
}

/**
 * Hook: Fetch products by main category (offering)
 */
export function useProductsByCategory(mainCatDocId: string | null, opts: Omit<UseProductsOptions, 'mainCatDocId'> = {}) {
  return useQuery({
    queryKey: [
      'products-by-category',
      mainCatDocId || 'all',
      opts.search ?? '',
      opts.sortBy ?? 'priority',
    ],
    queryFn: async () => {
      const products = mainCatDocId
        ? await fetchProductsByCategory(mainCatDocId)
        : await fetchAllProducts();
      return applyFiltersAndSort(products, opts);
    },
    enabled: !!mainCatDocId,
    staleTime: 5 * 60_000,
  });
}

/**
 * Hook: Fetch single product by ID
 */
export function useProduct(productId: string) {
  return useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      const snap = await getDoc(doc(db, 'products', productId));
      if (!snap.exists()) throw new Error('Product not found');
      const data = snap.data();
      return {
        id: snap.id,
        docId: snap.id,
        name: data.name || '',
        category: data.mainCatDocId || '',
        subcategory: data.defaultSubCatDocId || '',
        price: data.minPrice || 0,
        originalPrice: data.maxPrice || 0,
        rating: data.rating ?? 0,
        reviews: data.numberOfRating ?? 0,
        images: (data.images || []).map(processImageUrl),
        description: data.description || '',
        features: data.detailsList || [],
        trending: data.topSelling ?? false,
        newArrival: isNewArrival(data.createdAt),
        bestSeller: data.topSelling ?? false,
        tags: data.tags || [],
        createdAt: data.createdAt,
      } as Product;
    },
    enabled: !!productId,
  });
}

/**
 * Hook: Compute price range from products
 */
export function usePriceRange(products: Product[] = []) {
  return {
    min: products.length > 0 ? Math.min(...products.map(p => p.price || 0)) : 0,
    max: products.length > 0 ? Math.max(...products.map(p => p.originalPrice || p.price || 0)) : 200000,
  };
}

/**
 * Hook: Compute available filter values (faceted filtering)
 */
export function useDynamicFilters(products: Product[] = []) {
  const colors = new Set<string>();
  const sizes = new Set<string>();
  const materials = new Set<string>();
  const occasions = new Set<string>();

  products.forEach(p => {
    (p.tags || []).forEach(tag => {
      // Simple tag-based filtering
      if (tag.match(/^color-/i)) colors.add(tag.replace(/^color-/i, ''));
      if (tag.match(/^size-/i)) sizes.add(tag.replace(/^size-/i, ''));
      if (tag.match(/^material-/i)) materials.add(tag.replace(/^material-/i, ''));
      if (tag.match(/^occasion-/i)) occasions.add(tag.replace(/^occasion-/i, ''));
    });
  });

  return {
    colors: Array.from(colors),
    sizes: Array.from(sizes),
    materials: Array.from(materials),
    occasions: Array.from(occasions),
  };
}
