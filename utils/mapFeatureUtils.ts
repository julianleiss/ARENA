import { MapFeature, MapFeatureType } from '@/types/mapFeatures';

export function parseMapboxFeature(
  mapboxFeature: mapboxgl.MapboxGeoJSONFeature
): MapFeature {
  // Determine type based on layer
  const type: MapFeatureType =
    mapboxFeature.layer?.id.includes('building') ? 'building' :
    mapboxFeature.layer?.id.includes('road') ? 'street' :
    'unknown';

  return {
    id: mapboxFeature.id ?? `feature-${Date.now()}`,
    type,
    geometry: mapboxFeature.geometry,
    properties: mapboxFeature.properties ?? {}
  };
}
