import { fail, redirect } from '@sveltejs/kit';
import { db } from '#lib/server/db/index.ts';
import { mediaItems } from '#lib/server/db/schema.ts';
import { hasErrors, parseDetails, rawDetails } from '#lib/server/items.ts';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request }) => {
		const form = await request.formData();
		const { errors, values } = parseDetails(form);

		if (hasErrors(errors)) {
			return fail(400, { errors, values: rawDetails(form) });
		}

		const heardFrom = String(form.get('heard_from') ?? '').trim() || null;
		await db.insert(mediaItems).values({ ...values, heardFrom, source: 'manual' });
		redirect(303, '/');
	}
};
