import { fail, redirect } from '@sveltejs/kit';
import { checkPassword, safeRedirectTarget, startSession } from '#lib/server/auth.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals, url }) => {
	if (locals.authenticated) redirect(303, safeRedirectTarget(url.searchParams.get('redirectTo')));
};

export const actions: Actions = {
	default: async ({ request, cookies, url }) => {
		const password = (await request.formData()).get('password');

		if (typeof password !== 'string' || !checkPassword(password)) {
			// Slows down guessing; single user, so no lockout needed
			await new Promise((r) => setTimeout(r, 1000));
			return fail(401, { incorrect: true });
		}

		startSession(cookies);
		redirect(303, safeRedirectTarget(url.searchParams.get('redirectTo')));
	}
};
