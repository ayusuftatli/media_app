import { SourceError, type ItemDetails, type SearchResult } from './types';

// https://openlibrary.org/dev/docs/api/search and https://openlibrary.org/dev/docs/api/covers
const API = 'https://openlibrary.org';
// Open Library asks API clients to identify themselves
const HEADERS = { 'User-Agent': 'MediaShelf/0.1 (personal self-hosted app)', Accept: 'application/json' };
const SEARCH_FIELDS = 'key,title,author_name,first_publish_year,cover_i,number_of_pages_median';

type SearchDoc = {
	key: string;
	title: string;
	author_name?: string[];
	first_publish_year?: number;
	cover_i?: number;
	number_of_pages_median?: number;
};

type Work = {
	title: string;
	description?: string | { value: string };
	subjects?: string[];
	covers?: number[];
};

async function get<T>(path: string, params: Record<string, string> = {}): Promise<T> {
	const url = new URL(API + path);
	for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);

	const response = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(8000) });
	if (response.status === 404) throw new SourceError('Not found on Open Library', 404);
	if (!response.ok) throw new SourceError(`Open Library responded ${response.status}`);
	return response.json();
}

function cover(id: number | undefined, size: 'S' | 'M' | 'L') {
	return id ? `https://covers.openlibrary.org/b/id/${id}-${size}.jpg` : null;
}

// "/works/OL123W" -> "OL123W"
function workId(key: string) {
	return key.replace(/^\/works\//, '');
}

export async function searchOpenLibrary(query: string): Promise<SearchResult[]> {
	const data = await get<{ docs: SearchDoc[] }>('/search.json', {
		q: query,
		fields: SEARCH_FIELDS,
		limit: '20'
	});
	return data.docs.map((doc) => ({
		source: 'openlibrary',
		sourceId: workId(doc.key),
		type: 'book',
		title: doc.title,
		year: doc.first_publish_year ?? null,
		creator: doc.author_name?.slice(0, 2).join(', ') ?? null,
		coverUrl: cover(doc.cover_i, 'M'),
		blurb: null
	}));
}

// Search gives author, year and median page count; the work record adds description and subjects
export async function openLibraryDetails(sourceId: string): Promise<ItemDetails> {
	if (!/^OL\d+W$/.test(sourceId)) throw new SourceError('Bad Open Library id', 400);

	const [search, work] = await Promise.all([
		get<{ docs: SearchDoc[] }>('/search.json', {
			q: `key:/works/${sourceId}`,
			fields: SEARCH_FIELDS,
			limit: '1'
		}),
		get<Work>(`/works/${sourceId}.json`)
	]);
	const doc = search.docs[0];
	const description = typeof work.description === 'string' ? work.description : work.description?.value;

	return {
		type: 'book',
		title: doc?.title ?? work.title,
		creator: doc?.author_name?.slice(0, 2).join(', ') ?? null,
		year: doc?.first_publish_year ?? null,
		coverUrl: cover(doc?.cover_i ?? work.covers?.find((id) => id > 0), 'L'),
		length: doc?.number_of_pages_median ?? null,
		seasonsTotal: null,
		source: 'openlibrary',
		sourceId,
		metadata: {
			overview: description ?? null,
			// Drop list tags like "nyt:combined-print-and-e-book-fiction=2022-07-24"
			genres: (work.subjects ?? []).filter((s) => !s.includes(':')).slice(0, 8)
		}
	};
}
