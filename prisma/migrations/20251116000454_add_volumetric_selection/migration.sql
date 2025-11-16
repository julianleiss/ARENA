-- AlterTable
ALTER TABLE "proposals" ADD COLUMN     "targetFeatureId" TEXT,
ADD COLUMN     "targetFeatureType" TEXT,
ADD COLUMN     "targetGeometry" JSONB,
ADD COLUMN     "targetProperties" JSONB;
