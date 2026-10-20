import { desc } from 'drizzle-orm';
import { parseFilters } from '#lib/filters.ts';
import { db } from '#lib/server/db/index.ts';
import { mediaItems } from '#lib/server/db/schema.ts';
import { filterWhere } from '#lib/server/filters.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const filters = parseFilters(url.searchParams);

	const items = await db
		.select({
			id: mediaItems.id,
			type: mediaItems.type,
			title: mediaItems.title,
			creator: mediaItems.creator,
			year: mediaItems.year,
			coverUrl: mediaItems.coverUrl,
			length: mediaItems.length,
			status: mediaItems.status,
			currentSeason: mediaItems.currentSeason,
			rating: mediaItems.rating
		})
		.from(mediaItems)
		.where(filterWhere(filters))
		.orderBy(desc(mediaItems.addedAt));

	return { items, filters };
};
