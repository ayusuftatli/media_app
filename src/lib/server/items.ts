import { isMediaStatus, isMediaType, type MediaStatusValue, type MediaTypeValue } from '#lib/media.ts';
import type { MediaItem, NewMediaItem } from './db/schema';

export type FieldErrors = Partial<Record<string, string>>;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string) {
	return UUID.test(value);
}

function text(form: FormData, name: string) {
	const value = form.get(name);
	if (typeof value !== 'string') return null;
	const trimmed = value.trim();
	return trimmed === '' ? null : trimmed;
}

function int(form: FormData, name: string, min: number, max: number, errors: FieldErrors) {
	const value = text(form, name);
	if (value === null) return null;
	const number = Number(value);
	if (!Number.isInteger(number) || number < min || number > max) {
		errors[name] = `Enter a whole number from ${min} to ${max}`;
		return null;
	}
	return number;
}

// The fields that describe the title itself: used by the add form and "Edit details"
export function parseDetails(form: FormData) {
	const errors: FieldErrors = {};
	const rawType = form.get('type');
	const type: MediaTypeValue = isMediaType(rawType) ? rawType : 'movie';
	if (!isMediaType(rawType)) errors.type = 'Pick movie, TV or book';

	const title = text(form, 'title');
	if (!title) errors.title = 'Title is required';

	const coverUrl = text(form, 'cover_url');
	if (coverUrl && !/^https?:\/\//i.test(coverUrl)) {
		errors.cover_url = 'Must start with http:// or https://';
	}

	const year = int(form, 'year', 1000, 2100, errors);
	const length = type === 'tv' ? null : int(form, 'length', 1, 100_000, errors);
	const seasonsTotal = type === 'tv' ? int(form, 'seasons_total', 1, 500, errors) : null;

	return {
		errors,
		values: {
			type,
			title: title ?? '',
			creator: text(form, 'creator'),
			year,
			length,
			seasonsTotal,
			coverUrl
		} satisfies Partial<NewMediaItem>
	};
}

// What was typed, unparsed, so a form with errors can be shown again as entered
export function rawDetails(form: FormData) {
	const raw = (name: string) => String(form.get(name) ?? '');
	const type = form.get('type');
	return {
		type: isMediaType(type) ? type : 'movie',
		title: raw('title'),
		creator: raw('creator'),
		year: raw('year'),
		length: raw('length'),
		seasonsTotal: raw('seasons_total'),
		coverUrl: raw('cover_url'),
		heardFrom: raw('heard_from')
	};
}

// Status, progress and my own notes about it: used by the item screen
export function parseProgress(form: FormData, type: MediaTypeValue) {
	const errors: FieldErrors = {};
	const rawStatus = form.get('status');
	const status: MediaStatusValue = isMediaStatus(rawStatus) ? rawStatus : 'want';
	if (!isMediaStatus(rawStatus)) errors.status = 'Pick a status';

	const currentSeason = type === 'tv' ? int(form, 'current_season', 1, 500, errors) : null;
	// Rating only belongs to finished items
	const rating = status === 'finished' ? int(form, 'rating', 1, 10, errors) : null;

	return {
		errors,
		values: {
			status,
			currentSeason,
			rating,
			notes: text(form, 'notes'),
			heardFrom: text(form, 'heard_from')
		} satisfies Partial<NewMediaItem>
	};
}

// started_at is set the first time an item goes in progress (or straight to finished);
// finished_at is set on finishing and cleared if it's reopened
export function statusTimestamps(
	previous: Pick<MediaItem, 'status' | 'startedAt' | 'finishedAt'>,
	next: MediaStatusValue,
	now = new Date()
) {
	let { startedAt, finishedAt } = previous;
	if ((next === 'in_progress' || next === 'finished') && !startedAt) startedAt = now;
	if (next === 'finished' && previous.status !== 'finished') finishedAt = now;
	if (next !== 'finished') finishedAt = null;
	return { startedAt, finishedAt };
}

export function hasErrors(errors: FieldErrors) {
	return Object.keys(errors).length > 0;
}
