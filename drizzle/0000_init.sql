CREATE TYPE "public"."media_source" AS ENUM('tmdb', 'openlibrary', 'manual');--> statement-breakpoint
CREATE TYPE "public"."media_status" AS ENUM('want', 'in_progress', 'finished', 'dropped');--> statement-breakpoint
CREATE TYPE "public"."media_type" AS ENUM('movie', 'tv', 'book');--> statement-breakpoint
CREATE TABLE "media_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "media_type" NOT NULL,
	"title" text NOT NULL,
	"creator" text,
	"year" integer,
	"cover_url" text,
	"length" integer,
	"seasons_total" integer,
	"current_season" integer,
	"status" "media_status" DEFAULT 'want' NOT NULL,
	"rating" smallint,
	"notes" text,
	"heard_from" text,
	"source" "media_source" NOT NULL,
	"source_id" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "media_items_source_source_id_unique" UNIQUE("source","source_id"),
	CONSTRAINT "media_items_rating_range" CHECK ("media_items"."rating" between 1 and 10)
);
--> statement-breakpoint
CREATE INDEX "media_items_status_idx" ON "media_items" USING btree ("status");--> statement-breakpoint
CREATE INDEX "media_items_type_idx" ON "media_items" USING btree ("type");