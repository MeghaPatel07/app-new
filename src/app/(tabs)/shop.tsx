import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

// ── App-new hooks & stores ──────────────────────────────────────────────────
import { useProducts, usePriceRange } from '../../hooks/useProducts';
import { ProductCard, type ProductTag } from '../../components/product/ProductCard';
import { useCartStore } from '../../store/cartStore';
import { T, SHADOW, F } from '../../constants/tokens';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { Icon } from '../../components/primitives/Icon';

// ── Hooks (local copies from helpers) ────────────────────────────────────────
import { useActiveOfferings } from '../../hooks/useOfferings';
import { useActiveFeaturedCollections } from '../../hooks/useFeaturedCollections';
import { useOccasions } from '../../hooks/useOccasions';
import { useAlgoliaSearch } from '../../hooks/useAlgoliaSearch';
import { useVectorSearch } from '../../hooks/useVectorSearch';
import { useSubCategoriesByOffering } from '../../hooks/useSubCategories';
import { useDynamicFilters as useHelperDynamicFilters } from '../../hooks/useDynamicFilters';

// ── Services (local copies from helpers) ─────────────────────────────────────
import { ReviewService } from '../../services/reviewService';
import { DynamicFilterService } from '../../services/dynamicFilterService';

// ── Models ───────────────────────────────────────────────────────────────────
import type { ProductModelClass } from '../../models/ProductModel';
import type { OfferingsModelClass } from '../../models/OfferingsModel';
import type { DynamicFilter } from '../../services/dynamicFilterService';

// ── Constants ───────────────────────────────────────────────────────────────
const FALLBACK_CATEGORIES = ['All', 'Lehenga', 'Saree', 'Jewellery', 'Accessories'];

const SORT_OPTIONS = [
  { label: 'Featured', value: 'featured' },
  { label: 'Price: Low to High', value: 'price-low' },
  { label: 'Price: High to Low', value: 'price-high' },
  { label: 'Newest', value: 'newest' },
  { label: 'Best Rating', value: 'rating' },
  { label: 'Most Popular', value: 'popular' },
];

const ITEMS_PER_PAGE = 35;

// ── Types ───────────────────────────────────────────────────────────────────
interface FilterState {
  minPrice: number;
  maxPrice: number;
  dynamicFilters: Record<string, string[]>; // e.g. { color: ['Red'], size: ['M'] }
  specialFilters: {
    newArrivals: boolean;
    bestSellers: boolean;
    trending: boolean;
  };
}

// ── Rating Badge (uses ReviewService from helpers) ──────────────────────────
const RatingBadge = React.memo(({ productId, initialRating, initialCount }: {
  productId: string;
  initialRating?: number;
  initialCount?: number;
}) => {
  const [ratings, setRatings] = useState<{ average: number; count: number } | null>(
    initialRating !== undefined && initialCount !== undefined
      ? { average: initialRating, count: initialCount }
      : null
  );

  useEffect(() => {
    if (productId && (!ratings || ratings.count === 0)) {
      ReviewService.getProductRatings(productId)
        .then(data => { if (data.count > 0) setRatings(data); })
        .catch(() => {});
    }
  }, [productId]);

  if (!ratings || ratings.count === 0) return null;

  return (
    <View style={ratingStyles.container}>
      {[1, 2, 3, 4, 5].map(star => (
        <Text key={star} style={[
          ratingStyles.star,
          star <= Math.round(ratings.average) ? ratingStyles.starFilled : ratingStyles.starEmpty,
        ]}>
          {'\u2605'}
        </Text>
      ))}
      <Text style={ratingStyles.text}>
        {ratings.average.toFixed(1)} ({ratings.count})
      </Text>
    </View>
  );
});

// ═════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════
export default function ShopTab() {
  const router = useRouter();

  // ── Category & navigation state ────────────────────────────────────────
  const [activeCategory, setActiveCategory] = useState<string | undefined>(undefined);
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(null);
  const [activeCollection, setActiveCollection] = useState<string | null>(null);
  const [activeOccasion, setActiveOccasion] = useState<string | null>(null);

  // ── Search state ───────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const isSearchActive = searchQuery.trim().length >= 2;

  // ── Sort & filter state ────────────────────────────────────────────────
  const [sortBy, setSortBy] = useState('featured');
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [expandedFilters, setExpandedFilters] = useState<Set<string>>(new Set(['price']));
  const [filters, setFilters] = useState<FilterState>({
    minPrice: 0,
    maxPrice: 200000,
    dynamicFilters: {},
    specialFilters: {
      newArrivals: false,
      bestSellers: false,
      trending: false,
    },
  });
  const [pendingPriceMin, setPendingPriceMin] = useState('0');
  const [pendingPriceMax, setPendingPriceMax] = useState('200000');

  // ── Pagination state ───────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);

  // ── Reset pagination on filter/sort/category/collection/occasion changes ──
  useEffect(() => { setCurrentPage(1); }, [activeCategory, activeCollection, activeOccasion, sortBy, filters, searchQuery]);
  useEffect(() => {
    setActiveSubcategory(null);
    setActiveCollection(null);
    setActiveOccasion(null);
    setCurrentPage(1);
  }, [activeCategory]);

  // ═══════════════════════════════════════════════════════════════════════
  // DATA FETCHING — hooks from helpers + app-new
  // ═══════════════════════════════════════════════════════════════════════

  // Cart
  const cartItems = useCartStore(s => s.items);
  const cartCount = cartItems.reduce((sum, i) => sum + i.qty, 0);

  // Products — ALWAYS fetch ALL visible products from Firestore (single query).
  // Category filtering is applied client-side in the pipeline so that
  // totalFilteredCount always reflects the true post-filter count.
  const { data: allProducts = [], isLoading: productsLoading, error: productsError } =
    useProducts();

  // Debug: confirm what the hook returned
  console.log('[SHOP] useProducts() returned', allProducts.length, 'products | loading:', productsLoading);

  // Offerings = dynamic categories (from helpers)
  const { offerings, loading: offeringsLoading } = useActiveOfferings();
  // Featured collections (from helpers)
  const { collections: featuredCollections, loading: collectionsLoading } =
    useActiveFeaturedCollections();

  // Occasions (from helpers)
  const { occasions, loading: occasionsLoading } = useOccasions();

  // Subcategories for active category (from helpers)
  const { subCategories, loading: subCategoriesLoading } = useSubCategoriesByOffering(
    activeCategory ?? null,
    !!activeCategory && !isSearchActive
  );

  // Algolia search (from helpers — primary search when active)
  const {
    products: algoliaProducts,
    loading: algoliaLoading,
    isConfigured: algoliaConfigured,
  } = useAlgoliaSearch(searchQuery, isSearchActive);

  // Vector search (from helpers — fallback when Algolia not configured)
  const {
    products: vectorProducts,
    loading: vectorLoading,
  } = useVectorSearch(searchQuery, isSearchActive && !algoliaConfigured);

  // Dynamic filters from variants (from helpers)
  // Computed from category-filtered products so filter options are relevant
  // (but computed before dynamic/special filters for faceted UX)
  const categoryFilteredForDynamic = useMemo(() => {
    let result = allProducts;
    if (activeCategory) {
      result = result.filter(p =>
        p.category === activeCategory ||
        (p as any).mainCatDocId === activeCategory
      );
    }
    return result;
  }, [allProducts, activeCategory]);

  const productModelsForFilters = useMemo(() => {
    return categoryFilteredForDynamic.map(p => ({
      docId: p.id || p.docId,
      name: p.name,
      tags: p.tags || [],
      minPrice: p.price,
      maxPrice: p.originalPrice || p.price,
    })) as unknown as ProductModelClass[];
  }, [categoryFilteredForDynamic]);

  const {
    filters: helperDynamicFilters,
    loading: dynamicFiltersLoading,
  } = useHelperDynamicFilters(productModelsForFilters, 0);

  // Build category chips from offerings (or fallback to hardcoded)
  const categoryChips = useMemo(() => {
    if (offerings.length > 0) {
      const validOfferings = offerings.filter((o: any) => o.name && o.name.trim());
      if (validOfferings.length > 0) {
        return [
          { label: 'All', value: undefined as string | undefined },
          ...validOfferings.map((o: any) => ({
            label: o.name,
            value: o.docId,
          })),
        ];
      }
    }
    return FALLBACK_CATEGORIES.map(cat => ({
      label: cat,
      value: cat === 'All' ? undefined : cat,
    }));
  }, [offerings]);

  // Build subcategory chips
  const subcategoryChips = useMemo(() => {
    if (!subCategories || subCategories.length === 0) return [];
    return [
      { label: 'All', value: null as string | null },
      ...subCategories.map((sc: any) => ({ label: sc.name, value: sc.docId })),
    ];
  }, [subCategories]);

  // ── Helper: convert search-source products to local shape ──────────────
  const mapSearchProduct = useCallback((p: any) => ({
    id: p.docId,
    docId: p.docId,
    name: p.name || '',
    category: p.mainCatDocId || '',
    subcategory: p.defaultSubCatDocId || '',
    price: p.minPrice || 0,
    originalPrice: p.maxPrice || p.minPrice || 0,
    rating: p.rating ?? 0,
    reviews: p.numberOfRating ?? 0,
    images: p.images || [],
    description: p.description || '',
    features: p.detailsList || [],
    trending: p.topSelling ?? false,
    newArrival: false,
    bestSeller: p.topSelling ?? false,
    tags: p.tags || [],
    createdAt: p.createdAt,
    priorityNo: p.priorityNo || 999,
  }), []);

  // ═══════════════════════════════════════════════════════════════════════
  // PRODUCT PIPELINE  (PRD: search → filter → sort → paginate)
  // ═══════════════════════════════════════════════════════════════════════

  // Step 1: Determine base products (search results OR all products from hook)
  // PRD §7: When search is active, IGNORES category/subcategory/occasion/collection
  //         When search is inactive, returns ALL products — category filter is in Step 2
  const baseProducts = useMemo(() => {
    console.log('[PIPELINE] Step 1 — allProducts:', allProducts.length, '| activeCategory:', activeCategory ?? 'ALL');

    if (isSearchActive) {
      // Algolia primary
      if (algoliaConfigured && algoliaProducts.length > 0) {
        console.log('[PIPELINE] Search source: Algolia →', algoliaProducts.length);
        return algoliaProducts.map(mapSearchProduct);
      }
      // Vector fallback
      if (vectorProducts.length > 0) {
        console.log('[PIPELINE] Search source: Vector →', vectorProducts.length);
        return vectorProducts.map(mapSearchProduct);
      }
      // Client-side text fallback
      const q = searchQuery.toLowerCase();
      const matched = allProducts.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        (p.tags ?? []).some((t: string) => t.toLowerCase().includes(q))
      );
      console.log('[PIPELINE] Search source: client-side →', matched.length);
      return matched;
    }

    return allProducts;
  }, [isSearchActive, searchQuery, algoliaConfigured, algoliaProducts, vectorProducts, allProducts, mapSearchProduct]);

  // Step 2: Apply ALL client-side filters (category first, then the rest)
  // PRD: category → subcategory → collection → occasion → price → dynamic → special
  const filteredProducts = useMemo(() => {
    let result = [...baseProducts];
    console.log('[PIPELINE] Step 2 — START (all products):', result.length);

    // 2a) Category filter — applied client-side so totalFilteredCount is accurate
    if (activeCategory) {
      result = result.filter(p =>
        p.category === activeCategory ||
        (p as any).mainCatDocId === activeCategory
      );
      console.log('[PIPELINE]   after category:', result.length, '| cat:', activeCategory);
    }

    // 2b) Subcategory filter (PRD §2 — match by subcategory docId or name)
    if (activeSubcategory) {
      result = result.filter(p =>
        p.subcategory === activeSubcategory ||
        (p as any).defaultSubCatDocId === activeSubcategory
      );
      console.log('[PIPELINE]   after subcategory:', result.length, '| sub:', activeSubcategory);
    }

    // 2c) Collection filter (PRD §6 — product.tags includes collection tag)
    if (activeCollection) {
      result = result.filter(p => {
        const tags = (p.tags || []) as string[];
        return tags.some(t =>
          t.toLowerCase().includes(activeCollection!.toLowerCase())
        );
      });
      console.log('[PIPELINE]   after collection:', result.length, '| col:', activeCollection);
    }

    // 2d) Occasion filter (PRD §5 — product.tags includes occasion tag)
    if (activeOccasion) {
      result = result.filter(p => {
        const tags = (p.tags || []) as string[];
        return tags.some(t =>
          t.toLowerCase().includes(activeOccasion!.toLowerCase())
        );
      });
      console.log('[PIPELINE]   after occasion:', result.length, '| occ:', activeOccasion);
    }

    // 2e) Price filter (PRD §3)
    //     Only apply when user has changed defaults — avoids dropping 0-priced products
    const priceChanged = filters.minPrice > 0 || filters.maxPrice < 200000;
    if (priceChanged) {
      const before = result.length;
      result = result.filter(p => {
        const price = typeof p.price === 'string'
          ? parseInt((p.price as string).replace(/[^0-9]/g, ''), 10)
          : p.price;
        return price >= filters.minPrice && price <= filters.maxPrice;
      });
      console.log('[PIPELINE]   after price:', before, '→', result.length, `(₹${filters.minPrice}–₹${filters.maxPrice})`);
    }

    // 2f) Dynamic attribute filters (PRD §4 — AND across keys, OR within each key)
    const activeFilterEntries = Object.entries(filters.dynamicFilters)
      .filter(([, values]) => values.length > 0);

    if (activeFilterEntries.length > 0) {
      const before = result.length;
      result = result.filter(product => {
        return activeFilterEntries.every(([filterKey, selectedValues]) => {
          const productTags = (product.tags || []) as string[];
          return selectedValues.some(val =>
            productTags.some(tag =>
              tag.toLowerCase().includes(val.toLowerCase()) ||
              tag.toLowerCase().includes(`${filterKey}-${val}`.toLowerCase())
            )
          ) || DynamicFilterService.productMatchesFilter(
            { docId: product.id || (product as any).docId, tags: productTags } as any,
            filterKey,
            selectedValues[0]
          );
        });
      });
      console.log('[PIPELINE]   after dynamic filters:', before, '→', result.length,
        activeFilterEntries.map(([k, v]) => `${k}:[${v}]`).join(', '));
    }

    // 2g) Special filters (PRD §1 — trending, new arrivals, best sellers)
    if (filters.specialFilters.newArrivals) {
      const b = result.length;
      result = result.filter(p => p.newArrival === true);
      console.log('[PIPELINE]   after newArrivals:', b, '→', result.length);
    }
    if (filters.specialFilters.bestSellers) {
      const b = result.length;
      result = result.filter(p => p.bestSeller === true || (p as any).topSelling === true);
      console.log('[PIPELINE]   after bestSellers:', b, '→', result.length);
    }
    if (filters.specialFilters.trending) {
      const b = result.length;
      result = result.filter(p => p.trending === true || (p as any).topSelling === true);
      console.log('[PIPELINE]   after trending:', b, '→', result.length);
    }

    console.log('[PIPELINE] Step 2 — FINAL:', result.length);
    return result;
  }, [baseProducts, activeCategory, activeSubcategory, activeCollection, activeOccasion, filters]);

  // Step 3: Sort (PRD §6 — featured, price-low, price-high, newest, rating)
  const sortedProducts = useMemo(() => {
    const sorted = [...filteredProducts];
    switch (sortBy) {
      case 'price-low':
        sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'price-high':
        sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case 'rating':
        sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'popular':
        sorted.sort((a, b) => ((b as any).reviews || (b as any).numberOfRating || 0) - ((a as any).reviews || (a as any).numberOfRating || 0));
        break;
      case 'newest':
        sorted.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt as any).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt as any).getTime() : 0;
          return dateB - dateA;
        });
        break;
      default:
        // Featured = priority order
        sorted.sort((a, b) => ((a as any).priorityNo || 999) - ((b as any).priorityNo || 999));
        break;
    }
    console.log('[PIPELINE] Step 3 — sorted:', sorted.length, '| sortBy:', sortBy);
    return sorted;
  }, [filteredProducts, sortBy]);

  // Step 4: Paginate (PRD §3 — 35 per page, skip = (page-1) * 35)
  const totalFilteredCount = sortedProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalFilteredCount / ITEMS_PER_PAGE));
  const paginatedProducts = useMemo(() => {
    const skip = (currentPage - 1) * ITEMS_PER_PAGE;
    const page = sortedProducts.slice(skip, skip + ITEMS_PER_PAGE);
    console.log(
      `[PIPELINE] Step 4 — page ${currentPage}/${totalPages} | showing ${page.length} of ${totalFilteredCount} | skip ${skip}`
    );
    return page;
  }, [sortedProducts, currentPage, totalPages, totalFilteredCount]);

  // ═══════════════════════════════════════════════════════════════════════
  // FILTER HELPERS
  // ═══════════════════════════════════════════════════════════════════════

  const toggleFilterExpansion = useCallback((key: string) => {
    setExpandedFilters(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const toggleDynamicFilter = useCallback((filterKey: string, value: string) => {
    setFilters(prev => {
      const current = prev.dynamicFilters[filterKey] || [];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      return {
        ...prev,
        dynamicFilters: { ...prev.dynamicFilters, [filterKey]: updated },
      };
    });
  }, []);

  const toggleSpecialFilter = useCallback((filterType: 'newArrivals' | 'bestSellers' | 'trending') => {
    setFilters(prev => ({
      ...prev,
      specialFilters: {
        ...prev.specialFilters,
        [filterType]: !prev.specialFilters[filterType],
      },
    }));
  }, []);

  // PRD: handleResetFilters() - Clear dynamic/special filters but keep price range
  const resetFilters = useCallback(() => {
    setFilters(prev => ({
      minPrice: prev.minPrice,
      maxPrice: prev.maxPrice,
      dynamicFilters: {},
      specialFilters: { newArrivals: false, bestSellers: false, trending: false },
    }));
    setCurrentPage(1);
  }, []);

  // PRD: handleClearAllFilters() - Clear ALL filters including category/price/dynamic
  const clearAllFilters = useCallback(() => {
    setActiveCategory(undefined);
    setActiveSubcategory(null);
    setActiveCollection(null);
    setActiveOccasion(null);
    setFilters({
      minPrice: 0,
      maxPrice: 200000,
      dynamicFilters: {},
      specialFilters: { newArrivals: false, bestSellers: false, trending: false },
    });
    setPendingPriceMin('0');
    setPendingPriceMax('200000');
    setCurrentPage(1);
  }, []);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (activeCategory) count++;
    if (activeSubcategory) count++;
    if (activeCollection) count++;
    if (activeOccasion) count++;
    if (filters.minPrice > 0 || filters.maxPrice < 200000) count++;
    Object.values(filters.dynamicFilters).forEach(vals => { if (vals.length > 0) count++; });
    if (filters.specialFilters.newArrivals) count++;
    if (filters.specialFilters.bestSellers) count++;
    if (filters.specialFilters.trending) count++;
    return count;
  }, [activeCategory, activeSubcategory, activeCollection, activeOccasion, filters]);

  // ── Loading state ──────────────────────────────────────────────────────
  const isLoading = productsLoading || (isSearchActive && (algoliaLoading || vectorLoading));

  // ── Product badges helper ──────────────────────────────────────────────
  const getProductTags = useCallback((product: any): ProductTag[] => {
    const tags: ProductTag[] = [];
    if (product.newArrival) tags.push({ label: 'New', variant: 'newArrival' });
    if (product.bestSeller || product.topSelling) tags.push({ label: 'Best Seller', variant: 'bestseller' });
    if (product.trending) tags.push({ label: 'Trending', variant: 'custom' });
    const orig = product.originalPrice || product.maxPrice || 0;
    const curr = product.price || product.minPrice || 0;
    if (orig > curr && curr > 0) {
      const discount = Math.round(((orig - curr) / orig) * 100);
      if (discount > 0) tags.push({ label: `${discount}% OFF`, variant: 'sale' });
    }
    return tags;
  }, []);

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════
  return (
    <SafeAreaView style={styles.safe}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerEyebrow}>WeddingEase Studio</Text>
          <Text style={styles.title}>Shop</Text>
        </View>
        <TouchableOpacity
          testID="cart-tab"
          style={styles.cartBtn}
          onPress={() => router.push('/cart')}
          accessibilityRole="button"
          accessibilityLabel="Cart"
        >
          <Text style={styles.cartIcon}>{'\uD83D\uDECD'}</Text>
          {cartCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.headerDivider} />

      {/* ── Search bar ──────────────────────────────────────────────────── */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={16} color={T.muted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          placeholderTextColor={T.muted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          testID="search-input"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Icon name="x" size={16} color={T.muted} />
          </TouchableOpacity>
        )}
      </View>

      {/* ── Search source indicator ─────────────────────────────────────── */}
      {isSearchActive && !isLoading && (
        <View style={styles.searchIndicator}>
          <Text style={styles.searchIndicatorText}>
            {algoliaConfigured ? 'Powered by Algolia' : 'Searching...'}
            {' \u00B7 '}{totalFilteredCount} results
          </Text>
        </View>
      )}

      {/* ── Controls: Filter & Sort ─────────────────────────────────────── */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.controlBtn}
          onPress={() => {
            setPendingPriceMin(filters.minPrice.toString());
            setPendingPriceMax(filters.maxPrice.toString());
            setShowFilters(true);
          }}
          testID="filter-btn"
        >
          <Icon name="sliders" size={16} color={T.accent} />
          <Text style={styles.controlText}>Filter</Text>
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.controlBtn}
          onPress={() => setShowSort(true)}
          testID="sort-btn"
        >
          <Icon name="arrow-down" size={16} color={T.accent} />
          <Text style={styles.controlText}>Sort</Text>
        </TouchableOpacity>
        {activeFilterCount > 0 && (
          <TouchableOpacity onPress={clearAllFilters}>
            <Text style={styles.clearFiltersText}>Clear</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.resultCount}>
          {totalFilteredCount} items{totalPages > 1 ? ` · pg ${currentPage}/${totalPages}` : ''}
        </Text>
      </View>

      {/* ── Active filter tags (quick-remove pills) ──────────────────────── */}
      {activeFilterCount > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.activeTagsRow}
        >
          {activeCategory && (
            <TouchableOpacity style={styles.activeTag} onPress={() => setActiveCategory(undefined)}>
              <Text style={styles.activeTagText}>
                {categoryChips.find(c => c.value === activeCategory)?.label ?? 'Category'}
              </Text>
              <Icon name="x" size={10} color={T.accent} />
            </TouchableOpacity>
          )}
          {activeSubcategory && (
            <TouchableOpacity style={styles.activeTag} onPress={() => { setActiveSubcategory(null); setCurrentPage(1); }}>
              <Text style={styles.activeTagText}>
                {subcategoryChips.find(s => s.value === activeSubcategory)?.label ?? 'Subcategory'}
              </Text>
              <Icon name="x" size={10} color={T.accent} />
            </TouchableOpacity>
          )}
          {activeCollection && (
            <TouchableOpacity style={styles.activeTag} onPress={() => setActiveCollection(null)}>
              <Text style={styles.activeTagText}>
                {featuredCollections.find((c: any) => c.docId === activeCollection)?.name ?? 'Collection'}
              </Text>
              <Icon name="x" size={10} color={T.accent} />
            </TouchableOpacity>
          )}
          {activeOccasion && (
            <TouchableOpacity style={styles.activeTag} onPress={() => setActiveOccasion(null)}>
              <Text style={styles.activeTagText}>
                {occasions.find((o: any) => (o.docId || o.name) === activeOccasion)?.name ?? 'Occasion'}
              </Text>
              <Icon name="x" size={10} color={T.accent} />
            </TouchableOpacity>
          )}
          {(filters.minPrice > 0 || filters.maxPrice < 200000) && (
            <TouchableOpacity style={styles.activeTag} onPress={() => {
              setFilters(prev => ({ ...prev, minPrice: 0, maxPrice: 200000 }));
              setPendingPriceMin('0');
              setPendingPriceMax('200000');
            }}>
              <Text style={styles.activeTagText}>{`₹${filters.minPrice}–₹${filters.maxPrice}`}</Text>
              <Icon name="x" size={10} color={T.accent} />
            </TouchableOpacity>
          )}
          {filters.specialFilters.newArrivals && (
            <TouchableOpacity style={styles.activeTag} onPress={() => toggleSpecialFilter('newArrivals')}>
              <Text style={styles.activeTagText}>New Arrivals</Text>
              <Icon name="x" size={10} color={T.accent} />
            </TouchableOpacity>
          )}
          {filters.specialFilters.bestSellers && (
            <TouchableOpacity style={styles.activeTag} onPress={() => toggleSpecialFilter('bestSellers')}>
              <Text style={styles.activeTagText}>Best Sellers</Text>
              <Icon name="x" size={10} color={T.accent} />
            </TouchableOpacity>
          )}
          {filters.specialFilters.trending && (
            <TouchableOpacity style={styles.activeTag} onPress={() => toggleSpecialFilter('trending')}>
              <Text style={styles.activeTagText}>Trending</Text>
              <Icon name="x" size={10} color={T.accent} />
            </TouchableOpacity>
          )}
          {Object.entries(filters.dynamicFilters).map(([key, vals]) =>
            vals.map(val => (
              <TouchableOpacity key={`${key}-${val}`} style={styles.activeTag} onPress={() => toggleDynamicFilter(key, val)}>
                <Text style={styles.activeTagText}>{val}</Text>
                <Icon name="x" size={10} color={T.accent} />
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}

      {/* ── Product grid ────────────────────────────────────────────────── */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={T.gold} />
          {isSearchActive && <Text style={styles.searchingText}>Searching...</Text>}
        </View>
      ) : productsError ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>Could not load products.</Text>
        </View>
      ) : paginatedProducts.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>
            {isSearchActive
              ? `No products found for "${searchQuery}"`
              : 'No products found.'}
          </Text>
          {activeFilterCount > 0 && (
            <TouchableOpacity style={styles.clearBtn} onPress={clearAllFilters}>
              <Text style={styles.clearBtnText}>Clear Filters</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={paginatedProducts}
          numColumns={2}
          keyExtractor={item => item.id || (item as any).docId}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            totalPages > 1 ? (
              <View style={styles.pagination}>
                <TouchableOpacity
                  disabled={currentPage === 1}
                  onPress={() => setCurrentPage(p => Math.max(1, p - 1))}
                  style={[styles.pageBtn, currentPage === 1 && styles.pageBtnDisabled]}
                  testID="prev-btn"
                >
                  <Icon name="chevron-left" size={18} color={currentPage === 1 ? T.muted : T.heading} />
                </TouchableOpacity>

                <Text style={styles.pageText}>
                  Page {currentPage} of {totalPages} ({totalFilteredCount} items)
                </Text>

                <TouchableOpacity
                  disabled={currentPage === totalPages}
                  onPress={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  style={[styles.pageBtn, currentPage === totalPages && styles.pageBtnDisabled]}
                  testID="next-btn"
                >
                  <Icon name="chevron-right" size={18} color={currentPage === totalPages ? T.muted : T.heading} />
                </TouchableOpacity>
              </View>
            ) : null
          }
          renderItem={({ item, index }) => (
            <ProductCard
              testID={`product-card-${index}`}
              id={item.id || (item as any).docId}
              name={item.name}
              brand={item.category}
              price={item.price}
              originalPrice={(item as any).originalPrice || (item as any).maxPrice}
              imageUrl={item.images?.[0]}
              imageUrls={item.images}
              tags={getProductTags(item)}
              rating={item.rating}
              reviews={(item as any).reviews || (item as any).numberOfRating}
              role="free"
              style={styles.card}
              onPress={id => router.push(`/product/${id}`)}
            />
          )}
        />
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          FILTER MODAL
          ═══════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={showFilters}
        animationType="slide"
        onRequestClose={() => setShowFilters(false)}
        testID="filter-modal"
      >
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filters</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Icon name="x" size={20} color={T.heading} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* ── Category ─────────────────────────────────────────────── */}
            <View style={styles.filterSection}>
              <TouchableOpacity
                style={styles.filterSectionHeader}
                onPress={() => toggleFilterExpansion('category')}
              >
                <Text style={styles.filterLabel}>Category</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  {activeCategory && (
                    <View style={styles.filterCountBadge}>
                      <Text style={styles.filterCountText}>1</Text>
                    </View>
                  )}
                  <Icon
                    name={expandedFilters.has('category') ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={T.muted}
                  />
                </View>
              </TouchableOpacity>
              {expandedFilters.has('category') && (
                <View style={styles.filterOptionsGrid}>
                  {categoryChips.map(cat => {
                    const isSelected = cat.value === activeCategory;
                    return (
                      <TouchableOpacity
                        key={cat.label}
                        style={[styles.filterOption, isSelected && styles.filterOptionSelected]}
                        onPress={() => setActiveCategory(isSelected ? undefined : cat.value)}
                      >
                        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                          {isSelected && <Icon name="check" size={10} color={T.white} />}
                        </View>
                        <Text style={[
                          styles.filterOptionText,
                          isSelected && styles.filterOptionTextSelected,
                        ]}>
                          {cat.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>

            {/* ── Subcategory (visible when a category is selected) ───── */}
            {activeCategory && subcategoryChips.length > 1 && (
              <View style={styles.filterSection}>
                <TouchableOpacity
                  style={styles.filterSectionHeader}
                  onPress={() => toggleFilterExpansion('subcategory')}
                >
                  <Text style={styles.filterLabel}>Subcategory</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    {activeSubcategory && (
                      <View style={styles.filterCountBadge}>
                        <Text style={styles.filterCountText}>1</Text>
                      </View>
                    )}
                    <Icon
                      name={expandedFilters.has('subcategory') ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      color={T.muted}
                    />
                  </View>
                </TouchableOpacity>
                {expandedFilters.has('subcategory') && (
                  <View style={styles.filterOptionsGrid}>
                    {subcategoryChips.map((sc, idx) => {
                      const isSelected = sc.value === activeSubcategory;
                      return (
                        <TouchableOpacity
                          key={`${sc.value}-${idx}`}
                          style={[styles.filterOption, isSelected && styles.filterOptionSelected]}
                          onPress={() => { setActiveSubcategory(isSelected ? null : sc.value); setCurrentPage(1); }}
                        >
                          <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                            {isSelected && <Icon name="check" size={10} color={T.white} />}
                          </View>
                          <Text style={[
                            styles.filterOptionText,
                            isSelected && styles.filterOptionTextSelected,
                          ]}>
                            {sc.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            )}

            {/* ── Featured Collections ─────────────────────────────────── */}
            {featuredCollections.length > 0 && (
              <View style={styles.filterSection}>
                <TouchableOpacity
                  style={styles.filterSectionHeader}
                  onPress={() => toggleFilterExpansion('collection')}
                >
                  <Text style={styles.filterLabel}>Collection</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    {activeCollection && (
                      <View style={styles.filterCountBadge}>
                        <Text style={styles.filterCountText}>1</Text>
                      </View>
                    )}
                    <Icon
                      name={expandedFilters.has('collection') ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      color={T.muted}
                    />
                  </View>
                </TouchableOpacity>
                {expandedFilters.has('collection') && (
                  <View style={styles.filterOptionsGrid}>
                    {featuredCollections.map((col: any) => {
                      const isSelected = activeCollection === col.docId;
                      return (
                        <TouchableOpacity
                          key={col.docId}
                          style={[styles.filterOption, isSelected && styles.filterOptionSelected]}
                          onPress={() => setActiveCollection(isSelected ? null : col.docId)}
                        >
                          <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                            {isSelected && <Icon name="check" size={10} color={T.white} />}
                          </View>
                          <Text style={[
                            styles.filterOptionText,
                            isSelected && styles.filterOptionTextSelected,
                          ]}>
                            {col.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            )}

            {/* ── Occasion ─────────────────────────────────────────────── */}
            {occasions.length > 0 && (
              <View style={styles.filterSection}>
                <TouchableOpacity
                  style={styles.filterSectionHeader}
                  onPress={() => toggleFilterExpansion('occasion')}
                >
                  <Text style={styles.filterLabel}>Occasion</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    {activeOccasion && (
                      <View style={styles.filterCountBadge}>
                        <Text style={styles.filterCountText}>1</Text>
                      </View>
                    )}
                    <Icon
                      name={expandedFilters.has('occasion') ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      color={T.muted}
                    />
                  </View>
                </TouchableOpacity>
                {expandedFilters.has('occasion') && (
                  <View style={styles.filterOptionsGrid}>
                    {occasions.map((occ: any) => {
                      const occId = occ.docId || occ.name;
                      const isSelected = activeOccasion === occId;
                      return (
                        <TouchableOpacity
                          key={occId}
                          style={[styles.filterOption, isSelected && styles.filterOptionSelected]}
                          onPress={() => setActiveOccasion(isSelected ? null : occId)}
                        >
                          <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                            {isSelected && <Icon name="check" size={10} color={T.white} />}
                          </View>
                          <Text style={[
                            styles.filterOptionText,
                            isSelected && styles.filterOptionTextSelected,
                          ]}>
                            {occ.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            )}

            {/* ── Price Range ─────────────────────────────────────────── */}
            <View style={styles.filterSection}>
              <TouchableOpacity
                style={styles.filterSectionHeader}
                onPress={() => toggleFilterExpansion('price')}
              >
                <Text style={styles.filterLabel}>Price Range</Text>
                <Icon
                  name={expandedFilters.has('price') ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={T.muted}
                />
              </TouchableOpacity>
              {expandedFilters.has('price') && (
                <View style={styles.priceInputRow}>
                  <TextInput
                    style={styles.priceInput}
                    placeholder="Min"
                    placeholderTextColor={T.muted}
                    value={pendingPriceMin}
                    onChangeText={setPendingPriceMin}
                    keyboardType="number-pad"
                  />
                  <Text style={styles.priceInputSeparator}>{'\u2014'}</Text>
                  <TextInput
                    style={styles.priceInput}
                    placeholder="Max"
                    placeholderTextColor={T.muted}
                    value={pendingPriceMax}
                    onChangeText={setPendingPriceMax}
                    keyboardType="number-pad"
                  />
                </View>
              )}
            </View>

            {/* ── Special Filters (Trending, New Arrivals, Best Sellers) ──── */}
            <View style={styles.filterSection}>
              <TouchableOpacity
                style={styles.filterSectionHeader}
                onPress={() => toggleFilterExpansion('special')}
              >
                <Text style={styles.filterLabel}>Special Filters</Text>
                <Icon
                  name={expandedFilters.has('special') ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={T.muted}
                />
              </TouchableOpacity>
              {expandedFilters.has('special') && (
                <View style={styles.filterOptionsGrid}>
                  {[
                    { key: 'newArrivals', label: 'New Arrivals' },
                    { key: 'bestSellers', label: 'Best Sellers' },
                    { key: 'trending', label: 'Trending' },
                  ].map(({ key, label }) => {
                    const isSelected = filters.specialFilters[key as keyof typeof filters.specialFilters];
                    return (
                      <TouchableOpacity
                        key={key}
                        style={[styles.filterOption, isSelected && styles.filterOptionSelected]}
                        onPress={() => toggleSpecialFilter(key as 'newArrivals' | 'bestSellers' | 'trending')}
                      >
                        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                          {isSelected && <Icon name="check" size={10} color={T.white} />}
                        </View>
                        <Text style={[
                          styles.filterOptionText,
                          isSelected && styles.filterOptionTextSelected,
                        ]}>
                          {label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>

            {/* ── Dynamic Filters (from helpers DynamicFilterService) ──── */}
            {helperDynamicFilters.map((df: DynamicFilter) => (
              <View key={df.filterKey} style={styles.filterSection}>
                <TouchableOpacity
                  style={styles.filterSectionHeader}
                  onPress={() => toggleFilterExpansion(df.filterKey)}
                >
                  <Text style={styles.filterLabel}>
                    {df.filterKey.charAt(0).toUpperCase() + df.filterKey.slice(1)}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    {(filters.dynamicFilters[df.filterKey]?.length || 0) > 0 && (
                      <View style={styles.filterCountBadge}>
                        <Text style={styles.filterCountText}>
                          {filters.dynamicFilters[df.filterKey].length}
                        </Text>
                      </View>
                    )}
                    <Icon
                      name={expandedFilters.has(df.filterKey) ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      color={T.muted}
                    />
                  </View>
                </TouchableOpacity>

                {expandedFilters.has(df.filterKey) && (
                  <View style={styles.filterOptionsGrid}>
                    {df.values.map(val => {
                      const isSelected = (filters.dynamicFilters[df.filterKey] || []).includes(val);
                      return (
                        <TouchableOpacity
                          key={val}
                          style={[styles.filterOption, isSelected && styles.filterOptionSelected]}
                          onPress={() => toggleDynamicFilter(df.filterKey, val)}
                        >
                          <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                            {isSelected && <Icon name="check" size={10} color={T.white} />}
                          </View>
                          <Text style={[
                            styles.filterOptionText,
                            isSelected && styles.filterOptionTextSelected,
                          ]}>
                            {val}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            ))}

            {dynamicFiltersLoading && (
              <View style={{ paddingVertical: 12, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={T.accent} />
                <Text style={styles.searchingText}>Loading filters...</Text>
              </View>
            )}
          </ScrollView>

          {/* ── Apply / Reset ─────────────────────────────────────────── */}
          <View style={styles.filterActions}>
            <TouchableOpacity style={styles.resetBtn} onPress={clearAllFilters}>
              <Text style={styles.resetBtnText}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.applyBtn}
              onPress={() => {
                setFilters(prev => ({
                  ...prev,
                  minPrice: parseInt(pendingPriceMin) || 0,
                  maxPrice: parseInt(pendingPriceMax) || 200000,
                }));
                setCurrentPage(1);
                setShowFilters(false);
              }}
              testID="apply-filters"
            >
              <Text style={styles.applyBtnText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* ═══════════════════════════════════════════════════════════════════
          SORT MODAL
          ═══════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={showSort}
        animationType="slide"
        onRequestClose={() => setShowSort(false)}
        testID="sort-modal"
      >
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Sort By</Text>
            <TouchableOpacity onPress={() => setShowSort(false)}>
              <Icon name="x" size={20} color={T.heading} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {SORT_OPTIONS.map(option => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.sortOption,
                  sortBy === option.value && styles.sortOptionActive,
                ]}
                onPress={() => {
                  setSortBy(option.value);
                  setCurrentPage(1);
                  setShowSort(false);
                }}
                testID={`sort-${option.value}`}
              >
                <Text style={[
                  styles.sortOptionText,
                  sortBy === option.value && styles.sortOptionTextActive,
                ]}>
                  {option.label}
                </Text>
                {sortBy === option.value && (
                  <Icon name="check" size={18} color={T.accent} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// STYLES
// ═════════════════════════════════════════════════════════════════════════════
const ratingStyles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  star: { fontSize: 10 },
  starFilled: { color: '#C17B67' },
  starEmpty: { color: '#C17B67', opacity: 0.2 },
  text: { fontSize: 10, color: T.muted, fontFamily: F.sans },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: T.bg },

  // ── Header ──────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerEyebrow: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
    color: T.muted,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: T.heading,
    letterSpacing: 0.2,
  },
  headerDivider: {
    height: 1,
    backgroundColor: T.border,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },

  // ── Search ──────────────────────────────────────────────────────────────
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
    backgroundColor: T.s1,
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.lg,
    paddingLeft: Spacing.md,
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: T.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: T.heading,
    padding: 0,
    fontFamily: F.sans,
  },
  searchIndicator: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  searchIndicatorText: {
    fontSize: 11,
    color: T.muted,
    fontFamily: F.sans,
    fontStyle: 'italic',
  },
  searchingText: {
    fontSize: 12,
    color: T.muted,
    marginTop: 8,
    fontFamily: F.sans,
  },

  // ── Cart button ─────────────────────────────────────────────────────────
  cartBtn: {
    position: 'relative',
    backgroundColor: T.s2,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: T.border,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartIcon: { fontSize: 20 },
  cartBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: T.accent,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: { color: T.white, fontSize: 9, fontWeight: '700' },

  // ── Controls ────────────────────────────────────────────────────────────
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  controlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: T.s1,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: T.border,
  },
  controlText: {
    fontSize: 13,
    color: T.body,
    fontWeight: '500',
    fontFamily: F.sans,
  },
  filterBadge: {
    backgroundColor: T.accent,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  filterBadgeText: { color: T.white, fontSize: 9, fontWeight: '700' },
  clearFiltersText: {
    fontSize: 12,
    color: T.accent,
    fontWeight: '600',
    fontFamily: F.sans,
  },
  resultCount: {
    marginLeft: 'auto',
    fontSize: 12,
    color: T.muted,
    fontFamily: F.sans,
  },

  // ── Active filter tags ──────────────────────────────────────────────────
  activeTagsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  activeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    backgroundColor: T.s2,
    borderWidth: 1,
    borderColor: T.accent,
  },
  activeTagText: {
    fontSize: 11,
    color: T.accent,
    fontWeight: '600',
    fontFamily: F.sans,
  },

  // ── Grid ────────────────────────────────────────────────────────────────
  grid: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.xl },
  row: { justifyContent: 'space-between' },
  card: { width: '48%', marginBottom: Spacing.md },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyText: { color: T.muted, fontSize: 14, fontFamily: F.sans, textAlign: 'center' },
  errorText: { color: T.rose, textAlign: 'center', fontSize: 14, fontFamily: F.sans },
  clearBtn: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: T.accent,
  },
  clearBtnText: { color: T.accent, fontSize: 13, fontWeight: '600', fontFamily: F.sans },

  // ── Pagination ──────────────────────────────────────────────────────────
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    gap: Spacing.lg,
  },
  pageBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: T.s1,
    borderWidth: 1,
    borderColor: T.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageBtnDisabled: { opacity: 0.4 },
  pageText: {
    fontSize: 14,
    color: T.heading,
    fontWeight: '600',
    fontFamily: F.sans,
  },

  // ── Modal shared ────────────────────────────────────────────────────────
  modalSafe: { flex: 1, backgroundColor: T.bg },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: T.heading,
    fontFamily: F.serif,
  },
  modalContent: { flex: 1, padding: Spacing.lg },

  // ── Filter modal ────────────────────────────────────────────────────────
  filterSection: { marginBottom: Spacing.lg },
  filterSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: T.heading,
    fontFamily: F.sans,
  },
  priceInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  priceInput: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: BorderRadius.md,
    backgroundColor: T.s1,
    fontSize: 14,
    color: T.heading,
    fontFamily: F.sans,
  },
  priceInputSeparator: { color: T.muted, fontSize: 14 },
  filterOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: T.border,
    backgroundColor: T.s1,
  },
  filterOptionSelected: {
    borderColor: T.accent,
    backgroundColor: T.s2,
  },
  filterOptionText: { fontSize: 12, color: T.body, fontFamily: F.sans },
  filterOptionTextSelected: { color: T.accent, fontWeight: '600' },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: T.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: { backgroundColor: T.accent, borderColor: T.accent },
  filterCountBadge: {
    backgroundColor: T.accent,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  filterCountText: { color: T.white, fontSize: 9, fontWeight: '700' },
  filterActions: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
  },
  resetBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: T.border,
  },
  resetBtnText: { color: T.body, fontSize: 14, fontWeight: '600', fontFamily: F.sans },
  applyBtn: {
    flex: 2,
    backgroundColor: T.accent,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  applyBtnText: { color: T.white, fontSize: 14, fontWeight: '700', fontFamily: F.sans },

  // ── Sort modal ──────────────────────────────────────────────────────────
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  sortOptionActive: { backgroundColor: T.s2 },
  sortOptionText: { fontSize: 14, color: T.body, fontFamily: F.sans },
  sortOptionTextActive: { color: T.accent, fontWeight: '600' },
});
