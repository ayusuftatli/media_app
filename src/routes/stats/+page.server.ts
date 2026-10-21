import { and, avg, count, desc, eq, isNotNull, sql } from 'drizzle-orm';
import { MEDIA_TYPES, type MediaStatusValue, type MediaTypeValue } from '#lib/media.ts';
import { db } from '#lib/server/db/index.ts';
import { mediaItems } from '#lib/server/db/schema.ts';
import type { PageServerLoad } from './$types';

type YearRow = { year: number; total: number } & Record<MediaTypeValue, number>;

export const load: PageServerLoad = async () => {
	const finishedYear = sql<number>`extract(year from ${mediaItems.finishedAt})::int`;
	const finished = and(eq(mediaItems.status, 'finished'), isNotNull(mediaItems.finishedAt));

	const [perYearRows, ratingRows, statusRows] = await Promise.all([
		db
			.select({ year: finishedYear, type: mediaItems.type, count: count() })
			.from(mediaItems)
			.where(finished)
			.groupBy(finishedYear, mediaItems.type)
			.orderBy(desc(finishedYear)),
		db
			.select({
				type: mediaItems.type,
				average: avg(mediaItems.rating).mapWith(Number),
				rated: count(mediaItems.rating)
			})
			.from(mediaItems)
			.where(and(eq(mediaItems.status, 'finished'), isNotNull(mediaItems.rating)))
			.groupBy(mediaItems.type),
		db
			.select({ status: mediaItems.status, count: count() })
			.from(mediaItems)
			.groupBy(mediaItems.status)
	]);

	// One row per year with a count for each type, newest year first
	const years = new Map<number, YearRow>();
	for (const { year, type, count } of perYearRows) {
		const row = years.get(year) ?? { year, total: 0, movie: 0, tv: 0, book: 0 };
		row[type] = count;
		row.total += count;
		years.set(year, row);
	}

	const ratings = MEDIA_TYPES.map((type) => {
		const row = ratingRows.find((r) => r.type === type);
		return { type, average: row?.average ?? null, rated: row?.rated ?? 0 };
	});

	const statusCounts = Object.fromEntries(statusRows.map((r) => [r.status, r.count])) as Partial<
		Record<MediaStatusValue, number>
	>;

	return { years: [...years.values()], ratings, statusCounts };
};
