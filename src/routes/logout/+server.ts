import { redirect } from '@sveltejs/kit';
import { endSession } from '#lib/server/auth.ts';
import type { RequestHandler } from './$types';

// POST only, so a stray link or prefetch can't end the session
export const POST: RequestHandler = ({ cookies }) => {
	endSession(cookies);
	redirect(303, '/login');
};
