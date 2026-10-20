import { error, redirect } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit/hooks';
import { SESSION_COOKIE, isValidSession } from '#lib/server/auth.ts';

// Everything except these paths needs a session
const PUBLIC_PATHS = new Set(['/login']);

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.authenticated = isValidSession(event.cookies.get(SESSION_COOKIE));

	if (!event.locals.authenticated && !PUBLIC_PATHS.has(event.url.pathname)) {
		// API calls get a plain 401; pages send the browser to the login form
		if (event.url.pathname.startsWith('/api/')) error(401, 'Not logged in');

		const target = event.url.pathname + event.url.search;
		redirect(303, target === '/' ? '/login' : `/login?redirectTo=${encodeURIComponent(target)}`);
	}

	return resolve(event);
};
