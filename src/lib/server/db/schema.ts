import { sql } from 'drizzle-orm';
import {
	check,
	index,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	smallint,
	text,
	timestamp,
	unique,
	uuid
} from 'drizzle-orm/pg-core';
import { MEDIA_SOURCES, MEDIA_STATUSES, MEDIA_TYPES } from '../../media';

export const mediaType = pgEnum('media_type', MEDIA_TYPES);
export const mediaStatus = pgEnum('media_status', MEDIA_STATUSES);
export const mediaSource = pgEnum('media_source', MEDIA_SOURCES);

export const mediaItems = pgTable(
	'media_items',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		type: mediaType('type').notNull(),
		title: text('title').notNull(),
		// Director, showrunner or author
		creator: text('creator'),
		// Release or publication year
		year: integer('year'),
		coverUrl: text('cover_url'),
		// Minutes for movies, pages for books, empty for TV
		length: integer('length'),
		seasonsTotal: integer('seasons_total'),
		currentSeason: integer('current_season'),
		status: mediaStatus('status').notNull().default('want'),
		rating: smallint('rating'),
		notes: text('notes'),
		// Person, article, podcast
		heardFrom: text('heard_from'),
		source: mediaSource('source').notNull(),
		// Empty for manual entries
		sourceId: text('source_id'),
		// Genres, overview, anything extra from the source API
		metadata: jsonb('metadata').$type<Record<string, unknown>>().notNull().default({}),
		addedAt: timestamp('added_at', { withTimezone: true }).notNull().defaultNow(),
		startedAt: timestamp('started_at', { withTimezone: true }),
		finishedAt: timestamp('finished_at', { withTimezone: true }),
		updatedAt: timestamp('updated_at', { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date())
	},
	(t) => [
		// Blocks saving the same title twice; NULL source_ids (manual) never collide
		unique('media_items_source_source_id_unique').on(t.source, t.sourceId),
		check('media_items_rating_range', sql`${t.rating} between 1 and 5`),
		index('media_items_status_idx').on(t.status),
		index('media_items_type_idx').on(t.type)
	]
);

export type MediaItem = typeof mediaItems.$inferSelect;
export type NewMediaItem = typeof mediaItems.$inferInsert;
