import type { MediaTypeValue } from './media';

// Shared by the search endpoint and the Add screen.

// One search hit, trimmed to what the result list shows
export type SearchResult = {
	source: 'tmdb' | 'openlibrary';
	sourceId: string;
	type: MediaTypeValue;
	title: string;
	year: number | null;
	creator: string | null;
	coverUrl: string | null;
	// Short line shown under the title when there's no creator (TMDB search has none)
	blurb: string | null;
	// Filled in by the endpoint: already on my shelf?
	savedId?: string | null;
};
