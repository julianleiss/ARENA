// ARENA V1.0 - Zod GeoJSON Validation Schemas (Iteration 10)
// Reusable schemas for validating geographic data

import { z } from 'zod'

/**
 * GeoJSON Position - [longitude, latitude, altitude?]
 * @example [lng, lat] or [lng, lat, alt]
 */
export const Position = z
  .tuple([z.number(), z.number()])
  .rest(z.number().optional())

/**
 * GeoJSON LinearRing - Closed array of positions (first = last)
 * Minimum 4 positions for a valid ring
 */
export const LinearRing = z.array(Position).min(4)

/**
 * GeoJSON Point geometry
 */
export const Point = z.object({
  type: z.literal('Point'),
  coordinates: Position,
})

/**
 * GeoJSON LineString geometry
 */
export const LineString = z.object({
  type: z.literal('LineString'),
  coordinates: z.array(Position).min(2),
})

/**
 * GeoJSON Polygon geometry
 */
export const Polygon = z.object({
  type: z.literal('Polygon'),
  coordinates: z.array(LinearRing),
})

/**
 * GeoJSON MultiPoint geometry
 */
export const MultiPoint = z.object({
  type: z.literal('MultiPoint'),
  coordinates: z.array(Position),
})

/**
 * GeoJSON MultiLineString geometry
 */
export const MultiLineString = z.object({
  type: z.literal('MultiLineString'),
  coordinates: z.array(z.array(Position).min(2)),
})

/**
 * GeoJSON MultiPolygon geometry
 */
export const MultiPolygon = z.object({
  type: z.literal('MultiPolygon'),
  coordinates: z.array(z.array(LinearRing)),
})

/**
 * Union of all GeoJSON geometry types
 */
export const Geometry = z.union([
  Point,
  LineString,
  Polygon,
  MultiPoint,
  MultiLineString,
  MultiPolygon,
])

/**
 * GeoJSON Feature with typed geometry
 */
export const Feature = z.object({
  type: z.literal('Feature'),
  geometry: Geometry,
  properties: z.record(z.string(), z.any()).nullable(),
})

/**
 * GeoJSON FeatureCollection
 */
export const FeatureCollection = z.object({
  type: z.literal('FeatureCollection'),
  features: z.array(Feature),
})

/**
 * Generic GeoJSON object (permissive - for unknown structures)
 */
export const GeoJSONAny = z.object({ type: z.string() }).passthrough()

// Type exports for TypeScript inference
export type Position = z.infer<typeof Position>
export type LinearRing = z.infer<typeof LinearRing>
export type Point = z.infer<typeof Point>
export type LineString = z.infer<typeof LineString>
export type Polygon = z.infer<typeof Polygon>
export type MultiPoint = z.infer<typeof MultiPoint>
export type MultiLineString = z.infer<typeof MultiLineString>
export type MultiPolygon = z.infer<typeof MultiPolygon>
export type Geometry = z.infer<typeof Geometry>
export type Feature = z.infer<typeof Feature>
export type FeatureCollection = z.infer<typeof FeatureCollection>
export type GeoJSONAny = z.infer<typeof GeoJSONAny>
