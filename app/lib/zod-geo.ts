// ARENA - GeoJSON Zod Validation Schemas
import { z } from 'zod'

// GeoJSON Position: [longitude, latitude]
export const PositionSchema = z.tuple([z.number(), z.number()])

// GeoJSON Point
export const PointSchema = z.object({
  type: z.literal('Point'),
  coordinates: PositionSchema,
})

// GeoJSON Polygon (exterior ring + optional holes)
export const PolygonSchema = z.object({
  type: z.literal('Polygon'),
  coordinates: z.array(z.array(PositionSchema)).min(1),
})

// GeoJSON LineString
export const LineStringSchema = z.object({
  type: z.literal('LineString'),
  coordinates: z.array(PositionSchema).min(2),
})

// Generic GeoJSON Geometry
export const GeometrySchema = z.union([
  PointSchema,
  PolygonSchema,
  LineStringSchema,
])

// Export types
export type Position = z.infer<typeof PositionSchema>
export type Point = z.infer<typeof PointSchema>
export type Polygon = z.infer<typeof PolygonSchema>
export type LineString = z.infer<typeof LineStringSchema>
export type Geometry = z.infer<typeof GeometrySchema>
