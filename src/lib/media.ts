// Shared by server and browser: enum values, labels and display helpers.

export const MEDIA_TYPES = ['movie', 'tv', 'book'] as const;
export const MEDIA_STATUSES = ['want', 'in_progress', 'finished', 'dropped'] as const;
export const MEDIA_SOURCES = ['tmdb', 'openlibrary', 'manual'] as const;

export type MediaTypeValue = (typeof MEDIA_TYPES)[number];
export type MediaStatusValue = (typeof MEDIA_STATUSES)[number];

export const TYPE_LABELS: Record<MediaTypeValue, string> = {
	movie: 'Movie',
	tv: 'TV',
	book: 'Book'
};

export const STATUS_LABELS: Record<MediaStatusValue, string> = {
	want: 'Want to',
	in_progress: 'In progress',
	finished: 'Finished',
	dropped: 'Dropped'
};

export function isMediaType(value: unknown): value is MediaTypeValue {
	return MEDIA_TYPES.includes(value as MediaTypeValue);
}

export function isMediaStatus(value: unknown): value is MediaStatusValue {
	return MEDIA_STATUSES.includes(value as MediaStatusValue);
}

// "1 h 52 min" for movies, "320 pages" for books, nothing for TV
export function formatLength(type: MediaTypeValue, length: number | null) {
	if (length == null || type === 'tv') return null;
	if (type === 'book') return `${length} pages`;
	const hours = Math.floor(length / 60);
	const minutes = length % 60;
	if (!hours) return `${minutes} min`;
	return minutes ? `${hours} h ${minutes} min` : `${hours} h`;
}

export function lengthLabel(type: MediaTypeValue) {
	return type === 'book' ? 'Pages' : 'Runtime (minutes)';
}

export function creatorLabel(type: MediaTypeValue) {
	return { movie: 'Director', tv: 'Creator', book: 'Author' }[type];
}
