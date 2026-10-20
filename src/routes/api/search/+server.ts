import { error, json } from '@sveltejs/kit';
import { isMediaType } from '#lib/media.ts';
import { SourceError, search } from '#lib/server/sources/index.ts';
import type { RequestHandler } from './$types';

// GET /api/search?type=movie|tv|book&q=… → trimmed results; the browser never talks to TMDB or Open Library
export const GET: RequestHandler = async ({ url }) => {
	const type = url.searchParams.get('type');
	const query = url.searchParams.get('q')?.trim() ?? '';
	if (!isMediaType(type)) error(400, 'type must be movie, tv or book');
	if (query.length < 2) return json([]);

	try {
		return json(await search(type, query.slice(0, 200)));
	} catch (err) {
		if (err instanceof SourceError) error(err.status, err.message);
		if (err instanceof Error && err.name === 'TimeoutError') error(504, 'Search timed out');
		throw err;
	}
};
