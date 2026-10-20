import type { NewMediaItem } from '../db/schema';

export type { SearchResult } from '#lib/search.ts';

// Everything needed to insert the item, fetched only when it's saved
export type ItemDetails = Pick<
	NewMediaItem,
	| 'type'
	| 'title'
	| 'creator'
	| 'year'
	| 'coverUrl'
	| 'length'
	| 'seasonsTotal'
	| 'source'
	| 'sourceId'
	| 'metadata'
>;

export class SourceError extends Error {
	constructor(
		message: string,
		readonly status = 502
	) {
		super(message);
	}
}

export function yearOf(date: string | null | undefined) {
	const year = Number(date?.slice(0, 4));
	return Number.isInteger(year) && year > 0 ? year : null;
}

export function truncate(text: string | null | undefined, max: number) {
	if (!text) return null;
	return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
}
