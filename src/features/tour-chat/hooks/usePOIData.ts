import { useState, useEffect } from 'react';
import { POI } from '../types';
import { fetchPOIData } from '../services/poi.service';

export const usePOIData = (poiId: string) => {
  const [poi, setPOI] = useState<POI | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPOI = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchPOIData(poiId);
        setPOI(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load POI data');
      } finally {
        setLoading(false);
      }
    };

    if (poiId) {
      loadPOI();
    }
  }, [poiId]);

  return { poi, loading, error };
};