import { useState } from 'react';
import { MapFeatureSelection } from '@/types/mapFeatures';

export function useMapFeatureSelection() {
  const [selection, setSelection] = useState<MapFeatureSelection>({
    feature: null,
    coordinates: null
  });

  const clearSelection = () => {
    setSelection({ feature: null, coordinates: null });
  };

  return {
    selection,
    setSelection,
    clearSelection
  };
}
