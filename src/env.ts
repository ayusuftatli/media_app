import { defineEnvVars } from '@sveltejs/kit/env';

function required(name: string) {
	return (value: string | undefined) => {
		if (!value) throw new Error(`${name} must be set`);
		return value;
	};
}

// All private: read from the environment when the server starts, never sent to the browser.
export const variables = defineEnvVars({
	DATABASE_URL: {
		description: 'Postgres connection string',
		schema: required('DATABASE_URL')
	},
	APP_PASSWORD: {
		description: 'The one login password',
		schema: required('APP_PASSWORD')
	},
	SESSION_SECRET: {
		description: 'Signs the session cookie',
		schema: (value) => {
			if (!value || value.length < 32) throw new Error('SESSION_SECRET must be at least 32 characters');
			return value;
		}
	},
	TMDB_TOKEN: {
		description: 'TMDB API read access token; may be empty until search is built'
	}
});
