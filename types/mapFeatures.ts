export type MapFeatureType = 'building' | 'street' | 'park' | 'unknown';

export interface MapFeature {
  id: string | number;
  type: MapFeatureType;
  geometry: GeoJSON.Geometry;
  properties: Record<string, any>;
}

export interface MapFeatureSelection {
  feature: MapFeature | null;
  coordinates: [number, number] | null;
}
