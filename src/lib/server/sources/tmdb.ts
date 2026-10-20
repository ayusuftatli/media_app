import { TMDB_TOKEN } from '$app/env/private';
import { SourceError, truncate, yearOf, type ItemDetails, type SearchResult } from './types';

// https://developer.themoviedb.org/reference
const API = 'https://api.themoviedb.org/3';
const IMAGES = 'https://image.tmdb.org/t/p';

type Genre = { id: number; name: string };

type MovieSearchHit = {
	id: number;
	title: string;
	release_date?: string;
	poster_path: string | null;
	overview?: string;
};

type TvSearchHit = {
	id: number;
	name: string;
	first_air_date?: string;
	poster_path: string | null;
	overview?: string;
};

type MovieDetails = MovieSearchHit & {
	runtime: number | null;
	genres: Genre[];
	original_title?: string;
	imdb_id?: string | null;
	credits?: { crew: { job: string; name: string }[] };
};

type TvDetails = TvSearchHit & {
	number_of_seasons: number | null;
	genres: Genre[];
	original_name?: string;
	created_by: { name: string }[];
};

async function get<T>(path: string, params: Record<string, string> = {}): Promise<T> {
	if (!TMDB_TOKEN) throw new SourceError('TMDB_TOKEN is not set', 503);

	const url = new URL(API + path);
	for (const [key, value] of Object.entries({ language: 'en-US', ...params })) {
		url.searchParams.set(key, value);
	}

	const response = await fetch(url, {
		headers: { Authorization: `Bearer ${TMDB_TOKEN}`, Accept: 'application/json' },
		signal: AbortSignal.timeout(8000)
	});
	if (response.status === 404) throw new SourceError('Not found on TMDB', 404);
	if (!response.ok) throw new SourceError(`TMDB responded ${response.status}`);
	return response.json();
}

function poster(path: string | null, size: 'w185' | 'w342') {
	return path ? `${IMAGES}/${size}${path}` : null;
}

export async function searchTmdb(type: 'movie' | 'tv', query: string): Promise<SearchResult[]> {
	if (type === 'movie') {
		const data = await get<{ results: MovieSearchHit[] }>('/search/movie', {
			query,
			include_adult: 'false'
		});
		return data.results.slice(0, 20).map((hit) => ({
			source: 'tmdb',
			sourceId: `movie:${hit.id}`,
			type,
			title: hit.title,
			year: yearOf(hit.release_date),
			creator: null,
			coverUrl: poster(hit.poster_path, 'w185'),
			blurb: truncate(hit.overview, 120)
		}));
	}

	const data = await get<{ results: TvSearchHit[] }>('/search/tv', {
		query,
		include_adult: 'false'
	});
	return data.results.slice(0, 20).map((hit) => ({
		source: 'tmdb',
		sourceId: `tv:${hit.id}`,
		type,
		title: hit.name,
		year: yearOf(hit.first_air_date),
		creator: null,
		coverUrl: poster(hit.poster_path, 'w185'),
		blurb: truncate(hit.overview, 120)
	}));
}

// sourceId is "movie:<id>" or "tv:<id>": TMDB movie and TV ids overlap, so the kind is part of the id
export async function tmdbDetails(sourceId: string): Promise<ItemDetails> {
	const [kind, id] = sourceId.split(':');
	if ((kind !== 'movie' && kind !== 'tv') || !/^\d+$/.test(id ?? '')) {
		throw new SourceError('Bad TMDB id', 400);
	}

	if (kind === 'movie') {
		const movie = await get<MovieDetails>(`/movie/${id}`, { append_to_response: 'credits' });
		const directors = movie.credits?.crew.filter((c) => c.job === 'Director').map((c) => c.name);
		return {
			type: 'movie',
			title: movie.title,
			creator: directors?.length ? directors.join(', ') : null,
			year: yearOf(movie.release_date),
			coverUrl: poster(movie.poster_path, 'w342'),
			length: movie.runtime || null,
			seasonsTotal: null,
			source: 'tmdb',
			sourceId,
			metadata: {
				genres: movie.genres.map((g) => g.name),
				overview: movie.overview || null,
				originalTitle: movie.original_title ?? null,
				imdbId: movie.imdb_id ?? null
			}
		};
	}

	const show = await get<TvDetails>(`/tv/${id}`);
	return {
		type: 'tv',
		title: show.name,
		creator: show.created_by.length ? show.created_by.map((c) => c.name).join(', ') : null,
		year: yearOf(show.first_air_date),
		coverUrl: poster(show.poster_path, 'w342'),
		length: null,
		seasonsTotal: show.number_of_seasons || null,
		source: 'tmdb',
		sourceId,
		metadata: {
			genres: show.genres.map((g) => g.name),
			overview: show.overview || null,
			originalTitle: show.original_name ?? null
		}
	};
}
