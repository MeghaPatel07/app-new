import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { T, F, RADIUS } from '../../../constants/tokens';
import { Spacing } from '../../../theme';
import { useProducts, useDynamicFilters, usePriceRange } from '../../../hooks/useProducts';
import { ProductCard } from '../../../components/product/ProductCard';
import { Ionicons } from '@expo/vector-icons';

const CATEGORIES = [
  { id: 'all', label: 'all' },
  { id: 'lehenga', label: 'Lehenga' },
  { id: 'saree', label: 'Saree' },
  { id: 'jewellery', label: 'Jewellery' },
  { id: 'accessories', label: 'Accessories' },
  { id: 'decor', label: 'Decor' },
];

const SORT_OPTIONS = [
  { id: 'priority', label: 'Featured' },
  { id: 'price-low', label: 'Price: Low to High' },
  { id: 'price-high', label: 'Price: High to Low' },
  { id: 'newest', label: 'Newest' },
  { id: 'rating', label: 'Highest Rated' },
];

const ITEMS_PER_PAGE = 20;

export default function ShopListingScreen() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('priority');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    priceRange: [0, 200000],
    colors: [],
    sizes: [],
    materials: [],
    occasions: [],
  });

  const { data: allProducts = [], isLoading, error } = useProducts({
    category: activeCategory === 'all' ? undefined : activeCategory,
    search: searchQuery.length >= 2 ? searchQuery : undefined,
    sortBy,
    minPrice: activeFilters.priceRange[0],
    maxPrice: activeFilters.priceRange[1],
  });

  const priceRange = usePriceRange(allProducts);
  const dynamicFilters = useDynamicFilters(allProducts);

  const filteredProducts = useMemo(() => {
    let result = [...allProducts];
    if (activeFilters.colors.length > 0) {
      result = result.filter(p =>
        activeFilters.colors.some(color => (p.tags || []).includes(`color-${color}`))
      );
    }
    if (activeFilters.sizes.length > 0) {
      result = result.filter(p =>
        activeFilters.sizes.some(size => (p.tags || []).includes(`size-${size}`))
      );
    }
    if (activeFilters.materials.length > 0) {
      result = result.filter(p =>
        activeFilters.materials.some(m => (p.tags || []).includes(`material-${m}`))
      );
    }
    if (activeFilters.occasions.length > 0) {
      result = result.filter(p =>
        activeFilters.occasions.some(o => (p.tags || []).includes(`occasion-${o}`))
      );
    }
    return result;
  }, [allProducts, activeFilters]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  const handlePriceChange = (minOrMax, value) => {
    const num = parseInt(value) || 0;
    setActiveFilters(prev => ({
      ...prev,
      priceRange: minOrMax === 'min'
        ? [num, prev.priceRange[1]]
        : [prev.priceRange[0], num],
    }));
  };

  const toggleAttributeFilter = (type, value) => {
    setActiveFilters(prev => {
      const current = prev[type];
      return {
        ...prev,
        [type]: current.includes(value)
          ? current.filter(v => v !== value)
          : [...current, value],
      };
    });
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={T.accent} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Failed to load products</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchSection}>
        <View style={styles.searchInputWrapper}>
          <Ionicons name="search" size={18} color={T.body} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor={T.body}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={T.body} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesScroll}
        contentContainerStyle={styles.categoriesContent}
      >
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.categoryPill,
              activeCategory === cat.id && styles.categoryPillActive,
            ]}
            onPress={() => {
              setActiveCategory(cat.id);
              setCurrentPage(1);
            }}
          >
            <Text
              style={[
                styles.categoryPillText,
                activeCategory === cat.id && styles.categoryPillTextActive,
              ]}
            >
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.controlsRow}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => setShowFilterModal(true)}
        >
          <Ionicons name="funnel" size={18} color={T.accent} />
          <Text style={styles.controlButtonText}>Filter</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => setShowSortModal(true)}
        >
          <Ionicons name="swap-vertical" size={18} color={T.accent} />
          <Text style={styles.controlButtonText}>Sort</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.productsContainer}>
        <View style={styles.productsGrid}>
          {paginatedProducts.map(product => (
            <TouchableOpacity
              key={product.id}
              style={styles.productWrapper}
              onPress={() => router.push({
                pathname: '/screens/shop/product-detail',
                params: { productId: product.id },
              })}
            >
              <ProductCard
                id={product.id}
                name={product.name}
                brand={product.category}
                price={product.price}
                originalPrice={product.originalPrice}
                imageUrl={product.images?.[0]}
                imageUrls={product.images || []}
                rating={product.rating || 0}
                reviews={product.reviews || 0}
                tags={[
                  product.newArrival ? { label: 'New', variant: 'newArrival' as const } : null,
                  product.bestSeller ? { label: 'Best Seller', variant: 'bestseller' as const } : null,
                  product.trending ? { label: 'Trending', variant: 'custom' as const } : null,
                ].filter(Boolean)}
              />
            </TouchableOpacity>
          ))}
        </View>

        {paginatedProducts.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No products found</Text>
          </View>
        )}
      </ScrollView>

      <Modal visible={showFilterModal} transparent animationType="slide" onRequestClose={() => setShowFilterModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={24} color={T.heading} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Price Range</Text>
                <View style={styles.priceInputs}>
                  <TextInput
                    style={styles.priceInput}
                    placeholder="Min"
                    keyboardType="numeric"
                    value={activeFilters.priceRange[0].toString()}
                    onChangeText={val => handlePriceChange('min', val)}
                  />
                  <TextInput
                    style={styles.priceInput}
                    placeholder="Max"
                    keyboardType="numeric"
                    value={activeFilters.priceRange[1].toString()}
                    onChangeText={val => handlePriceChange('max', val)}
                  />
                </View>
              </View>

              {dynamicFilters.colors.length > 0 && (
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>Colors</Text>
                  {dynamicFilters.colors.map(color => (
                    <TouchableOpacity
                      key={color}
                      style={styles.filterOption}
                      onPress={() => toggleAttributeFilter('colors', color)}
                    >
                      <Ionicons
                        name={activeFilters.colors.includes(color) ? 'checkbox' : 'square-outline'}
                        size={18}
                        color={activeFilters.colors.includes(color) ? T.accent : T.body}
                      />
                      <Text style={styles.filterOptionText}>{color}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalButton} onPress={() => setShowFilterModal(false)}>
                <Text style={styles.modalButtonText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showSortModal} transparent animationType="slide" onRequestClose={() => setShowSortModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sort By</Text>
              <TouchableOpacity onPress={() => setShowSortModal(false)}>
                <Ionicons name="close" size={24} color={T.heading} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {SORT_OPTIONS.map(option => (
                <TouchableOpacity
                  key={option.id}
                  style={styles.sortOption}
                  onPress={() => {
                    setSortBy(option.id);
                    setCurrentPage(1);
                    setShowSortModal(false);
                  }}
                >
                  <Text style={styles.sortOptionText}>{option.label}</Text>
                  {sortBy === option.id && <Ionicons name="checkmark" size={20} color={T.accent} />}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.cardBg },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  searchSection: { paddingHorizontal: 16, paddingVertical: 12 },
  searchInputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: T.border, borderRadius: RADIUS.md, paddingHorizontal: 12, height: 44 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontFamily: F.sans, fontSize: 14, color: T.heading },
  categoriesScroll: { maxHeight: 50 },
  categoriesContent: { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  categoryPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: RADIUS.full, borderWidth: 1, borderColor: T.border, backgroundColor: T.cardBg },
  categoryPillActive: { backgroundColor: T.accent, borderColor: T.accent },
  categoryPillText: { fontFamily: F.sans, fontSize: 12, fontWeight: '600', color: T.body },
  categoryPillTextActive: { color: T.white },
  controlsRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  controlButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderWidth: 1, borderColor: T.accent, borderRadius: RADIUS.md, backgroundColor: T.cardBg, gap: 6 },
  controlButtonText: { fontFamily: F.sans, fontSize: 14, fontWeight: '600', color: T.accent },
  productsContainer: { flex: 1, paddingHorizontal: 16 },
  productsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
  productWrapper: { width: '48%', marginBottom: 12 },
  emptyContainer: { justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontFamily: F.sans, fontSize: 16, color: T.body },
  errorText: { fontFamily: F.sans, fontSize: 16, color: '#e74c3c' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: T.cardBg, borderTopLeftRadius: RADIUS.lg, borderTopRightRadius: RADIUS.lg, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: T.border },
  modalTitle: { fontFamily: F.sans, fontSize: 18, fontWeight: '700', color: T.heading },
  modalBody: { paddingHorizontal: 16, paddingVertical: 16 },
  filterSection: { marginBottom: 24 },
  filterSectionTitle: { fontFamily: F.sans, fontSize: 14, fontWeight: '700', color: T.heading, marginBottom: 12 },
  priceInputs: { flexDirection: 'row', gap: 8 },
  priceInput: { flex: 1, borderWidth: 1, borderColor: T.border, borderRadius: RADIUS.md, paddingHorizontal: 12, height: 40, fontFamily: F.sans, fontSize: 14, color: T.heading },
  filterOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 10 },
  filterOptionText: { fontFamily: F.sans, fontSize: 14, color: T.heading },
  sortOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: T.border },
  sortOptionText: { fontFamily: F.sans, fontSize: 16, color: T.heading },
  modalFooter: { paddingHorizontal: 16, paddingVertical: 16, borderTopWidth: 1, borderTopColor: T.border },
  modalButton: { backgroundColor: T.accent, borderRadius: RADIUS.md, paddingVertical: 12, alignItems: 'center' },
  modalButtonText: { fontFamily: F.sans, fontSize: 16, fontWeight: '700', color: T.white },
});
