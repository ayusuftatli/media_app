import { and, eq, inArray } from 'drizzle-orm';
import type { MediaTypeValue } from '#lib/media.ts';
import { db } from '../db';
import { mediaItems } from '../db/schema';
import { openLibraryDetails, searchOpenLibrary } from './openlibrary';
import { searchTmdb, tmdbDetails } from './tmdb';
import { SourceError, type ItemDetails, type SearchResult } from './types';

export { SourceError, type SearchResult };

export async function search(type: MediaTypeValue, query: string): Promise<SearchResult[]> {
	const results = type === 'book' ? await searchOpenLibrary(query) : await searchTmdb(type, query);
	if (results.length === 0) return results;

	// Mark hits that are already saved so the list can say so instead of offering a duplicate
	const source = results[0].source;
	const saved = await db
		.select({ id: mediaItems.id, sourceId: mediaItems.sourceId })
		.from(mediaItems)
		.where(
			and(
				eq(mediaItems.source, source),
				inArray(
					mediaItems.sourceId,
					results.map((r) => r.sourceId)
				)
			)
		);
	const savedIds = new Map(saved.map((s) => [s.sourceId, s.id]));
	return results.map((r) => ({ ...r, savedId: savedIds.get(r.sourceId) ?? null }));
}

export function details(source: string, sourceId: string): Promise<ItemDetails> {
	if (source === 'tmdb') return tmdbDetails(sourceId);
	if (source === 'openlibrary') return openLibraryDetails(sourceId);
	throw new SourceError('Unknown source', 400);
}

export async function findSaved(source: 'tmdb' | 'openlibrary', sourceId: string) {
	const [existing] = await db
		.select({ id: mediaItems.id })
		.from(mediaItems)
		.where(and(eq(mediaItems.source, source), eq(mediaItems.sourceId, sourceId)));
	return existing?.id ?? null;
}
