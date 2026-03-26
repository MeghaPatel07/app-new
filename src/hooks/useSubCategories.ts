import { useState, useEffect } from 'react';
import { SubCategoryModelClass, subCategoryUtils } from '../models/SubCategoryModel';
import { SubCategoryService } from '../services/subCategoryService';

// Hook for fetching all subcategories
export const useSubCategories = () => {
  const [subCategories, setSubCategories] = useState<SubCategoryModelClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('useSubCategories: Fetching subcategories data...');

        const subCategoriesData = await SubCategoryService.getAllSubCategories();
        console.log(`useSubCategories: Fetched ${subCategoriesData.length} subcategories from Firestore:`, subCategoriesData);
        console.log('Subcategory names:', subCategoriesData.map(s => s.name));

        // Sort by name by default
        const sortedSubCategories = subCategoryUtils.sortByName(subCategoriesData);

        if (sortedSubCategories.length === 0) {
          console.log('No subcategories found in Firestore, using fallback data');
          setSubCategories(getFallbackSubCategories());
          setError('No subcategories found in database. Showing sample data.');
        } else {
          setSubCategories(sortedSubCategories);
        }
      } catch (err) {
        console.error('Error fetching subcategories:', err);
        setSubCategories(getFallbackSubCategories());
        setError('Failed to load subcategories from database. Showing sample data.');
      } finally {
        setLoading(false);
      }
    };

    fetchSubCategories();
  }, []);

  return { subCategories, loading, error };
};

// Hook for fetching only active subcategories
export const useActiveSubCategories = () => {
  const [subCategories, setSubCategories] = useState<SubCategoryModelClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActiveSubCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('useActiveSubCategories: Fetching active subcategories data...');

        const subCategoriesData = await SubCategoryService.getActiveSubCategories();
        console.log(`useActiveSubCategories: Fetched ${subCategoriesData.length} active subcategories from Firestore:`, subCategoriesData);

        // Sort by name by default
        const sortedSubCategories = subCategoryUtils.sortByName(subCategoriesData);

        if (sortedSubCategories.length === 0) {
          console.log('No active subcategories found in Firestore, using fallback data');
          setSubCategories(getFallbackSubCategories());
          setError('No active subcategories found in database. Showing sample data.');
        } else {
          setSubCategories(sortedSubCategories);
        }
      } catch (err) {
        console.error('Error fetching active subcategories:', err);
        setSubCategories(getFallbackSubCategories());
        setError('Failed to load active subcategories from database. Showing sample data.');
      } finally {
        setLoading(false);
      }
    };

    fetchActiveSubCategories();
  }, []);

  return { subCategories, loading, error };
};

// Hook for fetching subcategories by offering ID
export const useSubCategoriesByOffering = (offeringId: string | null, isEnabled: boolean = true) => {
  const [subCategories, setSubCategories] = useState<SubCategoryModelClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!offeringId || !isEnabled) {
      setSubCategories([]);
      setLoading(false);
      return;
    }

    const fetchSubCategoriesByOffering = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log(`useSubCategoriesByOffering: Fetching subcategories for offering: ${offeringId}`);

        const subCategoriesData = await SubCategoryService.getSubCategoriesByOfferingId(offeringId);
        console.log(`useSubCategoriesByOffering: Fetched ${subCategoriesData.length} subcategories for offering ${offeringId}:`, subCategoriesData);

        // Sort by name by default
        const sortedSubCategories = subCategoryUtils.sortByName(subCategoriesData);
        setSubCategories(sortedSubCategories);
      } catch (err) {
        console.error(`Error fetching subcategories for offering ${offeringId}:`, err);
        setSubCategories([]);
        setError(`Failed to load subcategories for offering "${offeringId}".`);
      } finally {
        setLoading(false);
      }
    };

    fetchSubCategoriesByOffering();
  }, [offeringId, isEnabled]);

  return { subCategories, loading, error };
};

// Hook for fetching subcategories by tag
export const useSubCategoriesByTag = (tag: string | null) => {
  const [subCategories, setSubCategories] = useState<SubCategoryModelClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tag) {
      setSubCategories([]);
      setLoading(false);
      return;
    }

    const fetchSubCategoriesByTag = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log(`useSubCategoriesByTag: Fetching subcategories with tag: ${tag}`);

        const subCategoriesData = await SubCategoryService.getSubCategoriesByTag(tag);
        console.log(`useSubCategoriesByTag: Fetched ${subCategoriesData.length} subcategories with tag ${tag}:`, subCategoriesData);

        // Sort by name by default
        const sortedSubCategories = subCategoryUtils.sortByName(subCategoriesData);
        setSubCategories(sortedSubCategories);
      } catch (err) {
        console.error(`Error fetching subcategories by tag ${tag}:`, err);
        setSubCategories([]);
        setError(`Failed to load subcategories with tag "${tag}".`);
      } finally {
        setLoading(false);
      }
    };

    fetchSubCategoriesByTag();
  }, [tag]);

  return { subCategories, loading, error };
};

// Hook for fetching subcategories by price range
export const useSubCategoriesByPriceRange = (minPrice?: number, maxPrice?: number) => {
  const [subCategories, setSubCategories] = useState<SubCategoryModelClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubCategoriesByPriceRange = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log(`useSubCategoriesByPriceRange: Fetching subcategories with price range: ${minPrice} - ${maxPrice}`);

        const subCategoriesData = await SubCategoryService.getSubCategoriesByPriceRange(minPrice, maxPrice);
        console.log(`useSubCategoriesByPriceRange: Fetched ${subCategoriesData.length} subcategories in price range:`, subCategoriesData);

        // Sort by price by default
        const sortedSubCategories = subCategoryUtils.sortByPrice(subCategoriesData);
        setSubCategories(sortedSubCategories);
      } catch (err) {
        console.error(`Error fetching subcategories by price range:`, err);
        setSubCategories([]);
        setError(`Failed to load subcategories in price range.`);
      } finally {
        setLoading(false);
      }
    };

    fetchSubCategoriesByPriceRange();
  }, [minPrice, maxPrice]);

  return { subCategories, loading, error };
};

// Hook for searching subcategories
export const useSubCategoriesSearch = (searchTerm: string) => {
  const [subCategories, setSubCategories] = useState<SubCategoryModelClass[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!searchTerm || searchTerm.trim().length < 2) {
      setSubCategories([]);
      setLoading(false);
      return;
    }

    const searchSubCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log(`useSubCategoriesSearch: Searching for: ${searchTerm}`);

        const subCategoriesData = await SubCategoryService.searchSubCategories(searchTerm.trim());
        console.log(`useSubCategoriesSearch: Found ${subCategoriesData.length} subcategories matching "${searchTerm}":`, subCategoriesData);

        // Sort by name by default
        const sortedSubCategories = subCategoryUtils.sortByName(subCategoriesData);
        setSubCategories(sortedSubCategories);
      } catch (err) {
        console.error(`Error searching subcategories for ${searchTerm}:`, err);
        setSubCategories([]);
        setError(`Failed to search subcategories for "${searchTerm}".`);
      } finally {
        setLoading(false);
      }
    };

    // Debounce the search
    const timeoutId = setTimeout(searchSubCategories, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  return { subCategories, loading, error };
};

// Hook for fetching a single subcategory by ID
export const useSubCategory = (id: string | null) => {
  const [subCategory, setSubCategory] = useState<SubCategoryModelClass | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setSubCategory(null);
      setLoading(false);
      return;
    }

    const fetchSubCategory = async () => {
      try {
        setLoading(true);
        setError(null);

        const subCategoryData = await SubCategoryService.getSubCategoryById(id);
        console.log(`useSubCategory: Fetched subcategory:`, subCategoryData);

        if (subCategoryData) {
          setSubCategory(subCategoryData);
        } else {
          setSubCategory(null);
          setError(`Subcategory with ID "${id}" not found.`);
        }
      } catch (err) {
        console.error(`Error fetching subcategory with ID ${id}:`, err);
        setSubCategory(null);
        setError(`Failed to load subcategory with ID "${id}".`);
      } finally {
        setLoading(false);
      }
    };

    fetchSubCategory();
  }, [id]);

  return { subCategory, loading, error };
};

// Hook for fetching subcategories grouped by offering
export const useSubCategoriesGroupedByOffering = () => {
  const [groupedSubCategories, setGroupedSubCategories] = useState<Record<string, SubCategoryModelClass[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGroupedSubCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('useSubCategoriesGroupedByOffering: Fetching grouped subcategories...');

        const groupedData = await SubCategoryService.getSubCategoriesGroupedByOffering();
        console.log(`useSubCategoriesGroupedByOffering: Fetched subcategories grouped by ${Object.keys(groupedData).length} offerings:`, groupedData);

        setGroupedSubCategories(groupedData);
      } catch (err) {
        console.error('Error fetching grouped subcategories:', err);
        setGroupedSubCategories({});
        setError('Failed to load grouped subcategories from database.');
      } finally {
        setLoading(false);
      }
    };

    fetchGroupedSubCategories();
  }, []);

  return { groupedSubCategories, loading, error };
};

// Hook for fetching filter options
export const useSubCategoryFilters = () => {
  const [filterOptions, setFilterOptions] = useState<{
    tags: string[];
    combinations: string[];
    offeringIds: string[];
    priceRange: { min: number | null; max: number | null };
    allDataKeys: string[];
  }>({
    tags: [],
    combinations: [],
    offeringIds: [],
    priceRange: { min: null, max: null },
    allDataKeys: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('useSubCategoryFilters: Fetching filter options...');

        const options = await SubCategoryService.getFilterOptions();
        console.log('useSubCategoryFilters: Fetched filter options:', options);

        setFilterOptions(options);
      } catch (err) {
        console.error('Error fetching filter options:', err);
        setError('Failed to load filter options.');
      } finally {
        setLoading(false);
      }
    };

    fetchFilterOptions();
  }, []);

  return { filterOptions, loading, error };
};

// Fallback subcategories data for development/empty collections
const getFallbackSubCategories = (): SubCategoryModelClass[] => {
  const fallbackData = [
    {
      docId: 'fallback-subcategory-1',
      name: 'Bridal Lehengas',
      image: '/images/celebration-new-1.jpg',
      isActive: true,
      combinationNames: ['Bridal', 'Traditional', 'Luxury'],
      offeringId: 'fallback-1', // Wedding Attire offering
      minPrice: 5000,
      maxPrice: 25000,
      tags: ['bridal', 'lehenga', 'traditional', 'wedding'],
      detailTypes: [
        { type: 'fabric', name: 'Silk' },
        { type: 'embroidery', name: 'Zardozi' },
        { type: 'style', name: 'A-Line' }
      ],
      marginPercentage: 30,
      allData: {
        colors: ['Red', 'Maroon', 'Pink', 'Gold', 'Cream'],
        sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
        materials: ['Silk', 'Velvet', 'Georgette', 'Chiffon'],
        styles: ['A-Line', 'Mermaid', 'Ball Gown'],
        embroidery: ['Zardozi', 'Thread Work', 'Mirror Work', 'Sequins']
      },
      isManualCreated: false
    },
    {
      docId: 'fallback-subcategory-2',
      name: 'Groom Sherwanis',
      image: '/images/celebration-new-2.jpg',
      isActive: true,
      combinationNames: ['Groom', 'Traditional', 'Formal'],
      offeringId: 'fallback-1', // Wedding Attire offering
      minPrice: 3000,
      maxPrice: 15000,
      tags: ['groom', 'sherwani', 'traditional', 'formal'],
      detailTypes: [
        { type: 'fabric', name: 'Silk' },
        { type: 'collar', name: 'Band Collar' },
        { type: 'fit', name: 'Slim Fit' }
      ],
      marginPercentage: 25,
      allData: {
        colors: ['Ivory', 'Gold', 'Maroon', 'Navy', 'Black'],
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        materials: ['Silk', 'Brocade', 'Jacquard', 'Cotton Silk'],
        styles: ['Classic', 'Indo-Western', 'Royal'],
        collars: ['Band Collar', 'High Neck', 'Nehru Collar']
      },
      isManualCreated: false
    },
    {
      docId: 'fallback-subcategory-3',
      name: 'Bridal Jewelry Sets',
      image: '/images/celebration-new-3.jpg',
      isActive: true,
      combinationNames: ['Bridal', 'Jewelry', 'Complete Set'],
      offeringId: 'fallback-2', // Luxury Jewelry offering
      minPrice: 8000,
      maxPrice: 50000,
      tags: ['jewelry', 'bridal', 'necklace', 'earrings', 'sets'],
      detailTypes: [
        { type: 'metal', name: 'Gold Plated' },
        { type: 'stones', name: 'Kundan' },
        { type: 'style', name: 'Traditional' }
      ],
      marginPercentage: 40,
      allData: {
        metals: ['Gold Plated', 'Silver', 'Rose Gold', 'Antique Gold'],
        stones: ['Kundan', 'Polki', 'Pearls', 'CZ Diamonds', 'Emerald'],
        styles: ['Traditional', 'Contemporary', 'Vintage', 'Royal'],
        sets: ['Necklace + Earrings', 'Full Set', 'Choker Set', 'Long Set'],
        occasions: ['Wedding', 'Engagement', 'Reception', 'Sangeet']
      },
      isManualCreated: false
    },
    {
      docId: 'fallback-subcategory-4',
      name: 'Wedding Invitations',
      image: '/images/invites1.png',
      isActive: true,
      combinationNames: ['Invitations', 'Stationery', 'Custom Design'],
      offeringId: 'fallback-3', // Invites & Stationery offering
      minPrice: 50,
      maxPrice: 500,
      tags: ['invitations', 'cards', 'stationery', 'custom'],
      detailTypes: [
        { type: 'paper', name: 'Premium Card' },
        { type: 'printing', name: 'Digital' },
        { type: 'finish', name: 'Matte' }
      ],
      marginPercentage: 50,
      allData: {
        papers: ['Premium Card', 'Handmade Paper', 'Textured', 'Metallic'],
        printing: ['Digital', 'Offset', 'Letterpress', 'Foil Stamping'],
        finishes: ['Matte', 'Glossy', 'Satin', 'UV Spot'],
        styles: ['Traditional', 'Modern', 'Minimalist', 'Floral'],
        languages: ['English', 'Hindi', 'Regional Languages']
      },
      isManualCreated: false
    },
    {
      docId: 'fallback-subcategory-5',
      name: 'Bridal Accessories',
      image: '/images/accesories1.png',
      isActive: true,
      combinationNames: ['Bridal', 'Accessories', 'Complete Look'],
      offeringId: 'fallback-4', // Gifts & Accessories offering
      minPrice: 500,
      maxPrice: 5000,
      tags: ['accessories', 'bridal', 'clutch', 'shoes', 'veil'],
      detailTypes: [
        { type: 'category', name: 'Clutch' },
        { type: 'material', name: 'Satin' },
        { type: 'color', name: 'Matching' }
      ],
      marginPercentage: 35,
      allData: {
        categories: ['Clutch', 'Shoes', 'Veil', 'Hair Accessories', 'Bangles'],
        materials: ['Satin', 'Silk', 'Leather', 'Beaded', 'Crystal'],
        colors: ['Matching', 'Gold', 'Silver', 'Rose Gold', 'Pearl White'],
        styles: ['Traditional', 'Contemporary', 'Vintage', 'Minimalist'],
        occasions: ['Wedding', 'Reception', 'Sangeet', 'Mehendi']
      },
      isManualCreated: false
    },
    {
      docId: 'fallback-subcategory-6',
      name: 'Photography Packages',
      image: '/images/wedding-portrait.jpg',
      isActive: true,
      combinationNames: ['Photography', 'Wedding Package', 'Professional'],
      offeringId: 'fallback-1', // Wedding Photography offering
      minPrice: 25000,
      maxPrice: 100000,
      tags: ['photography', 'wedding', 'candid', 'traditional'],
      detailTypes: [
        { type: 'style', name: 'Candid' },
        { type: 'duration', name: 'Full Day' },
        { type: 'deliverables', name: 'Digital + Album' }
      ],
      marginPercentage: 20,
      allData: {
        styles: ['Candid', 'Traditional', 'Cinematic', 'Documentary'],
        packages: ['Pre-Wedding', 'Wedding Day', 'Reception', 'Complete Package'],
        deliverables: ['Digital Gallery', 'Photo Album', 'Video Highlights', 'Raw Files'],
        duration: ['Half Day', 'Full Day', 'Multi-Day', 'Custom'],
        team: ['Solo Photographer', 'Photographer + Assistant', 'Full Team']
      },
      isManualCreated: false
    }
  ];

  return fallbackData.map(data => new SubCategoryModelClass(data as any));
};

export default useSubCategories;