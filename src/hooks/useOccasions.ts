import { useState, useEffect } from 'react';
import { OccasionCollectionService, OccasionCollectionModel } from '../services/occasionCollectionService';

export const useOccasions = () => {
  const [occasions, setOccasions] = useState<OccasionCollectionModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOccasions = async () => {
      try {
        setLoading(true);
        const data = await OccasionCollectionService.getActiveOccasions();
        setOccasions(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch occasions');
      } finally {
        setLoading(false);
      }
    };

    fetchOccasions();
  }, []);

  return { occasions, loading, error };
};
