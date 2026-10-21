ALTER TABLE "media_items" DROP CONSTRAINT "media_items_rating_range";--> statement-breakpoint
-- Ratings move from 1–10 to whole stars 1–5; half stars round up (7 → 4)
UPDATE "media_items" SET "rating" = round("rating" / 2.0) WHERE "rating" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "media_items" ADD CONSTRAINT "media_items_rating_range" CHECK ("media_items"."rating" between 1 and 5);
