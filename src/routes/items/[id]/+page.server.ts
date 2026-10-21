import { error, fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '#lib/server/db/index.ts';
import { mediaItems } from '#lib/server/db/schema.ts';
import {
	hasErrors,
	isUuid,
	parseDetails,
	parseProgress,
	plainDescription,
	statusTimestamps
} from '#lib/server/items.ts';
import type { Actions, PageServerLoad } from './$types';

async function getItem(id: string) {
	// Postgres rejects malformed uuids with an error, so treat them as not found up front
	if (!isUuid(id)) error(404, 'Not found');
	const [item] = await db.select().from(mediaItems).where(eq(mediaItems.id, id));
	if (!item) error(404, 'Not found');
	return item;
}

export const load: PageServerLoad = async ({ params }) => {
	const { metadata, ...item } = await getItem(params.id);
	// Only the description from the source; the rest of metadata isn't shown
	const overview = plainDescription(
		typeof metadata.overview === 'string' ? metadata.overview : null
	);
	return { item, overview };
};

export const actions: Actions = {
	progress: async ({ params, request }) => {
		const item = await getItem(params.id);
		const { errors, values } = parseProgress(await request.formData(), item.type);
		if (hasErrors(errors)) return fail(400, { progressErrors: errors });

		await db
			.update(mediaItems)
			.set({ ...values, ...statusTimestamps(item, values.status) })
			.where(eq(mediaItems.id, item.id));
		return { saved: 'progress' as const };
	},

	details: async ({ params, request }) => {
		const item = await getItem(params.id);
		const form = await request.formData();
		// The type is fixed once saved: a book stays a book, whatever the form says
		form.set('type', item.type);
		const { errors, values } = parseDetails(form);
		if (hasErrors(errors)) return fail(400, { detailsErrors: errors });

		await db.update(mediaItems).set(values).where(eq(mediaItems.id, item.id));
		return { saved: 'details' as const };
	},

	delete: async ({ params }) => {
		const item = await getItem(params.id);
		await db.delete(mediaItems).where(eq(mediaItems.id, item.id));
		redirect(303, '/');
	}
};
