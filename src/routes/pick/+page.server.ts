import { error, redirect } from '@sveltejs/kit';
import { and, count, eq, ne, sql } from 'drizzle-orm';
import { parseFilters } from '#lib/filters.ts';
import { db } from '#lib/server/db/index.ts';
import { mediaItems } from '#lib/server/db/schema.ts';
import { filterWhere } from '#lib/server/filters.ts';
import { isUuid, statusTimestamps } from '#lib/server/items.ts';
import type { Actions, PageServerLoad } from './$types';

const pickColumns = {
	id: mediaItems.id,
	type: mediaItems.type,
	title: mediaItems.title,
	creator: mediaItems.creator,
	year: mediaItems.year,
	coverUrl: mediaItems.coverUrl,
	length: mediaItems.length,
	seasonsTotal: mediaItems.seasonsTotal,
	heardFrom: mediaItems.heardFrom,
	metadata: mediaItems.metadata
};

export const load: PageServerLoad = async ({ url }) => {
	// Always picks from "Want to", whatever the list's status filter says
	const filters = { ...parseFilters(url.searchParams), status: 'want' as const };
	const where = filterWhere(filters);
	const exclude = url.searchParams.get('not');

	const [{ total }] = await db.select({ total: count() }).from(mediaItems).where(where);

	// A reroll skips the item just shown, unless it's the only one left
	const skip = exclude && isUuid(exclude) && total > 1;
	const [row] = await db
		.select(pickColumns)
		.from(mediaItems)
		.where(skip ? and(where, ne(mediaItems.id, exclude)) : where)
		.orderBy(sql`random()`)
		.limit(1);

	return { filters, total, pick: row ? toPick(row) : null };
};

// Only the bits of metadata the card shows
function toPick<T extends { metadata: Record<string, unknown> }>({ metadata, ...item }: T) {
	return {
		...item,
		overview: typeof metadata.overview === 'string' ? metadata.overview : null,
		genres: Array.isArray(metadata.genres) ? (metadata.genres as string[]).slice(0, 3) : []
	};
}

export const actions: Actions = {
	// "Start it": move straight to In progress
	start: async ({ request }) => {
		const id = String((await request.formData()).get('id') ?? '');
		if (!isUuid(id)) error(400, 'Bad id');

		const [item] = await db.select().from(mediaItems).where(eq(mediaItems.id, id));
		if (!item) error(404, 'Not found');

		await db
			.update(mediaItems)
			.set({
				status: 'in_progress',
				...statusTimestamps(item, 'in_progress'),
				currentSeason: item.type === 'tv' ? (item.currentSeason ?? 1) : null
			})
			.where(eq(mediaItems.id, id));
		redirect(303, `/items/${id}`);
	}
};
