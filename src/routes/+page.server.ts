import { desc, inArray } from 'drizzle-orm';
import { db } from '#lib/server/db/index.ts';
import { mediaItems } from '#lib/server/db/schema.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	// Default view is what's still ahead; ?show=all includes finished and dropped
	const showAll = url.searchParams.get('show') === 'all';

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
		.where(showAll ? undefined : inArray(mediaItems.status, ['want', 'in_progress']))
		.orderBy(desc(mediaItems.addedAt));

	return { items, showAll };
};
