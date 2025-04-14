-- Migration to expand company address fields with more detailed components

-- Add new address fields
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "street_address" TEXT;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "city" TEXT;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "state" TEXT;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "postal_code" TEXT;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "country" TEXT;

-- Transfer existing address data to street_address (if possible)
UPDATE "companies" SET "street_address" = "address" WHERE "address" IS NOT NULL;

-- Keep the legacy address column for backward compatibility
-- We'll eventually remove it in a future migration after all code is updated