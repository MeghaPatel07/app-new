import { useState, useEffect } from 'react';
import { FeaturedCollectionService } from '../services/featuredCollectionService';
import { FeaturedCollectionModelClass } from '../models/FeaturedCollectionModel';

// Hook to get all active featured collections
export const useActiveFeaturedCollections = () => {
  const [collections, setCollections] = useState<FeaturedCollectionModelClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('useActiveFeaturedCollections: Fetching active featured collections...');
        const data = await FeaturedCollectionService.getActiveFeaturedCollections();
        console.log('useActiveFeaturedCollections: Fetched featured collections:', data.length);
        setCollections(data);
      } catch (err) {
        console.error('useActiveFeaturedCollections: Error fetching featured collections:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch featured collections');
      } finally {
        setLoading(false);
      }
    };

    fetchCollections();
  }, []);

  return { collections, loading, error };
};

// Hook to get all featured collections (including inactive)
export const useAllFeaturedCollections = () => {
  const [collections, setCollections] = useState<FeaturedCollectionModelClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('useAllFeaturedCollections: Fetching all featured collections...');
        const data = await FeaturedCollectionService.getAllFeaturedCollections();
        console.log('useAllFeaturedCollections: Fetched featured collections:', data.length);
        setCollections(data);
      } catch (err) {
        console.error('useAllFeaturedCollections: Error fetching featured collections:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch featured collections');
      } finally {
        setLoading(false);
      }
    };

    fetchCollections();
  }, []);

  return { collections, loading, error };
};

// Hook to get featured collections by tag
export const useFeaturedCollectionsByTag = (tag: string | null) => {
  const [collections, setCollections] = useState<FeaturedCollectionModelClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCollections = async () => {
      if (!tag) {
        setCollections([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        console.log(`useFeaturedCollectionsByTag: Fetching featured collections with tag: ${tag}`);
        const data = await FeaturedCollectionService.getFeaturedCollectionsByTag(tag);
        console.log(`useFeaturedCollectionsByTag: Fetched ${data.length} featured collections with tag: ${tag}`);
        setCollections(data);
      } catch (err) {
        console.error('useFeaturedCollectionsByTag: Error fetching featured collections:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch featured collections');
      } finally {
        setLoading(false);
      }
    };

    fetchCollections();
  }, [tag]);

  return { collections, loading, error };
};

// Hook to get featured collections (top priority)
export const useFeaturedCollections = (limit: number = 6) => {
  const [collections, setCollections] = useState<FeaturedCollectionModelClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log(`useFeaturedCollections: Fetching ${limit} featured collections...`);
        const data = await FeaturedCollectionService.getFeaturedCollections(limit);
        console.log(`useFeaturedCollections: Fetched ${data.length} featured collections`);
        setCollections(data);
      } catch (err) {
        console.error('useFeaturedCollections: Error fetching featured collections:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch featured collections');
      } finally {
        setLoading(false);
      }
    };

    fetchCollections();
  }, [limit]);

  return { collections, loading, error };
};

// Hook to get a single featured collection by ID
export const useFeaturedCollection = (id: string | null) => {
  const [collection, setCollection] = useState<FeaturedCollectionModelClass | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCollection = async () => {
      if (!id) {
        setCollection(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        console.log(`useFeaturedCollection: Fetching featured collection with ID: ${id}`);
        const data = await FeaturedCollectionService.getFeaturedCollectionById(id);
        console.log(`useFeaturedCollection: Fetched featured collection:`, data?.name);
        setCollection(data);
      } catch (err) {
        console.error('useFeaturedCollection: Error fetching featured collection:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch featured collection');
      } finally {
        setLoading(false);
      }
    };

    fetchCollection();
  }, [id]);

  return { collection, loading, error };
};

