import { and, eq, ilike, inArray, isNotNull, lte, or, type SQL } from 'drizzle-orm';
import { LENGTH_FILTERS, type Filters } from '#lib/filters.ts';
import { mediaItems } from './db/schema';

// Escape LIKE wildcards so a search for "100%" matches literally
function likePattern(text: string) {
	return `%${text.replace(/[\\%_]/g, '\\$&')}%`;
}

export function filterWhere(filters: Filters): SQL | undefined {
	const conditions: (SQL | undefined)[] = [];

	if (filters.type) conditions.push(eq(mediaItems.type, filters.type));

	if (filters.status === 'active') {
		conditions.push(inArray(mediaItems.status, ['want', 'in_progress']));
	} else if (filters.status !== 'all') {
		conditions.push(eq(mediaItems.status, filters.status));
	}

	if (filters.length) {
		// Unknown length never counts as short; the type is implied by the limit
		const { type, max } = LENGTH_FILTERS[filters.length];
		conditions.push(
			eq(mediaItems.type, type),
			isNotNull(mediaItems.length),
			lte(mediaItems.length, max)
		);
	}

	if (filters.q) {
		const pattern = likePattern(filters.q);
		conditions.push(
			or(
				ilike(mediaItems.title, pattern),
				ilike(mediaItems.creator, pattern),
				ilike(mediaItems.heardFrom, pattern),
				ilike(mediaItems.notes, pattern)
			)
		);
	}

	return and(...conditions);
}
