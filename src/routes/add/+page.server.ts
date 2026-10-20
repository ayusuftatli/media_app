import { fail } from '@sveltejs/kit';
import { db } from '#lib/server/db/index.ts';
import { mediaItems } from '#lib/server/db/schema.ts';
import { SourceError, details, findSaved } from '#lib/server/sources/index.ts';
import type { Actions } from './$types';

function isUniqueViolation(err: unknown) {
	// Drizzle wraps the driver's error; Postgres code 23505 is unique_violation
	const e = err as { code?: string; cause?: { code?: string } };
	return e?.code === '23505' || e?.cause?.code === '23505';
}

export const actions: Actions = {
	// Save a search result: fetch full details only now, then insert as "Want to"
	save: async ({ request }) => {
		const form = await request.formData();
		const source = form.get('source');
		const sourceId = String(form.get('source_id') ?? '');
		const heardFrom = String(form.get('heard_from') ?? '').trim() || null;

		if ((source !== 'tmdb' && source !== 'openlibrary') || !sourceId) {
			return fail(400, { message: 'Missing search result' });
		}

		const existingId = await findSaved(source, sourceId);
		if (existingId) return fail(409, { duplicateId: existingId });

		let item;
		try {
			item = await details(source, sourceId);
		} catch (err) {
			if (err instanceof SourceError) return fail(err.status, { message: err.message });
			if (err instanceof Error && err.name === 'TimeoutError') {
				return fail(504, { message: 'The lookup timed out. Try again.' });
			}
			throw err;
		}

		try {
			const [row] = await db
				.insert(mediaItems)
				.values({ ...item, heardFrom })
				.returning({ id: mediaItems.id });
			return { savedId: row.id };
		} catch (err) {
			// Two saves racing past the check above: the unique constraint has the final say
			if (isUniqueViolation(err)) {
				return fail(409, { duplicateId: await findSaved(source, sourceId) });
			}
			throw err;
		}
	}
};
