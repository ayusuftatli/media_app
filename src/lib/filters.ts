// List filters live in the URL so List and Pick share them and they survive reloads.
// Shared by server (to build the query) and browser (to build links).
import { isMediaType, type MediaTypeValue } from './media';

export const STATUS_FILTERS = {
	active: 'Up next', // Want to + In progress
	want: 'Want to',
	in_progress: 'In progress',
	finished: 'Finished',
	dropped: 'Dropped',
	all: 'Everything'
} as const;

// Length limits only make sense for one type each: runtime for movies, pages for books
export const LENGTH_FILTERS = {
	under90: { label: 'Under 90 min', type: 'movie', max: 90 },
	under120: { label: 'Under 2 h', type: 'movie', max: 120 },
	under300p: { label: 'Under 300 pages', type: 'book', max: 300 }
} as const satisfies Record<string, { label: string; type: MediaTypeValue; max: number }>;

export type StatusFilter = keyof typeof STATUS_FILTERS;
export type LengthFilter = keyof typeof LENGTH_FILTERS;

export type Filters = {
	type: MediaTypeValue | null;
	status: StatusFilter;
	length: LengthFilter | null;
	q: string;
};

export const DEFAULT_FILTERS: Filters = { type: null, status: 'active', length: null, q: '' };

function isStatusFilter(value: unknown): value is StatusFilter {
	return typeof value === 'string' && value in STATUS_FILTERS;
}

function isLengthFilter(value: unknown): value is LengthFilter {
	return typeof value === 'string' && value in LENGTH_FILTERS;
}

export function lengthOptionsFor(type: MediaTypeValue | null): LengthFilter[] {
	return (Object.keys(LENGTH_FILTERS) as LengthFilter[]).filter(
		(key) => !type || LENGTH_FILTERS[key].type === type
	);
}

export function parseFilters(params: URLSearchParams): Filters {
	const type = params.get('type');
	const status = params.get('status');
	const length = params.get('length');
	const parsedType = isMediaType(type) ? type : null;

	return {
		type: parsedType,
		status: isStatusFilter(status) ? status : DEFAULT_FILTERS.status,
		// Drop a length that can't apply to the chosen type (e.g. pages with Movie)
		length: isLengthFilter(length) && lengthOptionsFor(parsedType).includes(length) ? length : null,
		q: (params.get('q') ?? '').trim().slice(0, 100)
	};
}

// Only non-default values, so URLs stay short: "?type=movie&length=under120"
export function filtersToParams(filters: Filters, extra: Record<string, string> = {}) {
	const params = new URLSearchParams();
	if (filters.type) params.set('type', filters.type);
	if (filters.status !== DEFAULT_FILTERS.status) params.set('status', filters.status);
	if (filters.length) params.set('length', filters.length);
	if (filters.q) params.set('q', filters.q);
	for (const [key, value] of Object.entries(extra)) params.set(key, value);
	return params;
}

export function filtersQuery(filters: Filters, extra?: Record<string, string>) {
	const query = filtersToParams(filters, extra).toString();
	return query ? `?${query}` : '';
}

export function hasActiveFilters(filters: Filters) {
	return filtersToParams(filters).size > 0;
}
