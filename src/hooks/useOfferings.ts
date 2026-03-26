import { useState, useEffect } from 'react';
import { OfferingsService } from '../services/offeringsService';
import { OfferingsModelClass } from '../models/OfferingsModel';

// Hook to get all active offerings
export const useActiveOfferings = () => {
  const [offerings, setOfferings] = useState<OfferingsModelClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOfferings = async () => {
      try {
        setLoading(true);
        console.log('useActiveOfferings: Fetching active offerings...');
        const data = await OfferingsService.getActiveOfferings();
        console.log('useActiveOfferings: Fetched offerings:', data.length);
        setOfferings(data);
      } catch (err) {
        console.error('useActiveOfferings: Error fetching offerings:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch offerings');
      } finally {
        setLoading(false);
      }
    };

    fetchOfferings();
  }, []);

  return { offerings, loading, error };
};

// Hook to get all offerings (including inactive)
export const useAllOfferings = () => {
  const [offerings, setOfferings] = useState<OfferingsModelClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOfferings = async () => {
      try {
        setLoading(true);
        console.log('useAllOfferings: Fetching all offerings...');
        const data = await OfferingsService.getAllOfferings();
        console.log('useAllOfferings: Fetched offerings:', data.length);
        setOfferings(data);
      } catch (err) {
        console.error('useAllOfferings: Error fetching offerings:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch offerings');
      } finally {
        setLoading(false);
      }
    };

    fetchOfferings();
  }, []);

  return { offerings, loading, error };
};

// Hook to get offerings by tag
export const useOfferingsByTag = (tag: string | null) => {
  const [offerings, setOfferings] = useState<OfferingsModelClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOfferings = async () => {
      if (!tag) {
        setOfferings([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log(`useOfferingsByTag: Fetching offerings with tag: ${tag}`);
        const data = await OfferingsService.getOfferingsByTag(tag);
        console.log(`useOfferingsByTag: Fetched ${data.length} offerings with tag: ${tag}`);
        setOfferings(data);
      } catch (err) {
        console.error('useOfferingsByTag: Error fetching offerings:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch offerings');
      } finally {
        setLoading(false);
      }
    };

    fetchOfferings();
  }, [tag]);

  return { offerings, loading, error };
};

// Hook to get offerings by combination
export const useOfferingsByCombination = (combination: string | null) => {
  const [offerings, setOfferings] = useState<OfferingsModelClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOfferings = async () => {
      if (!combination) {
        setOfferings([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log(`useOfferingsByCombination: Fetching offerings with combination: ${combination}`);
        const data = await OfferingsService.getOfferingsByCombination(combination);
        console.log(`useOfferingsByCombination: Fetched ${data.length} offerings with combination: ${combination}`);
        setOfferings(data);
      } catch (err) {
        console.error('useOfferingsByCombination: Error fetching offerings:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch offerings');
      } finally {
        setLoading(false);
      }
    };

    fetchOfferings();
  }, [combination]);

  return { offerings, loading, error };
};

// Hook to get featured offerings
export const useFeaturedOfferings = (limit: number = 6) => {
  const [offerings, setOfferings] = useState<OfferingsModelClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOfferings = async () => {
      try {
        setLoading(true);
        console.log(`useFeaturedOfferings: Fetching ${limit} featured offerings...`);
        const data = await OfferingsService.getFeaturedOfferings(limit);
        console.log(`useFeaturedOfferings: Fetched ${data.length} featured offerings`);
        setOfferings(data);
      } catch (err) {
        console.error('useFeaturedOfferings: Error fetching offerings:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch offerings');
      } finally {
        setLoading(false);
      }
    };

    fetchOfferings();
  }, [limit]);

  return { offerings, loading, error };
};