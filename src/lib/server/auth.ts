import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import type { Cookies } from '@sveltejs/kit';
import { dev } from '$app/env';
import { APP_PASSWORD, SESSION_SECRET } from '$app/env/private';

export const SESSION_COOKIE = 'session';
const SESSION_DAYS = 180;

function sign(value: string) {
	return createHmac('sha256', SESSION_SECRET).update(value).digest('base64url');
}

// Compares fixed-length digests so neither length nor content leaks through timing
function safeEqual(a: string, b: string) {
	const digest = (s: string) => createHash('sha256').update(s).digest();
	return timingSafeEqual(digest(a), digest(b));
}

export function checkPassword(password: string) {
	return safeEqual(password, APP_PASSWORD);
}

// Token is "<expiry ms>.<signature>": nothing secret inside, only proof the server issued it
export function startSession(cookies: Cookies) {
	const expires = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
	const token = `${expires}.${sign(String(expires))}`;
	cookies.set(SESSION_COOKIE, token, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: !dev,
		expires: new Date(expires)
	});
}

export function endSession(cookies: Cookies) {
	cookies.delete(SESSION_COOKIE, { path: '/' });
}

export function isValidSession(token: string | undefined) {
	if (!token) return false;
	const [expires, signature] = token.split('.');
	if (!expires || !signature || !safeEqual(signature, sign(expires))) return false;
	return Number(expires) > Date.now();
}

// Only same-site paths, so the login form can't be used as an open redirect
export function safeRedirectTarget(target: string | null) {
	return target && target.startsWith('/') && !target.startsWith('//') ? target : '/';
}
