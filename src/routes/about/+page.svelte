<svelte:head>
	<title>About · Media Shelf</title>
</svelte:head>

<h1>About</h1>

<p>
	Media Shelf is a personal list of books, movies and TV shows to get to. It's self-hosted and
	used by one person.
</p>

<h2>Data sources</h2>

<section class="credit">
	<h3>The Movie Database (TMDB)</h3>
	<p>Movie and TV titles, posters, runtimes, seasons, directors, creators and genres.</p>
	<p class="notice">This product uses the TMDB API but is not endorsed or certified by TMDB.</p>
	<p><a href="https://www.themoviedb.org" rel="external noopener">themoviedb.org</a></p>
</section>

<section class="credit">
	<h3>Open Library</h3>
	<p>
		Book titles, authors, publication years, page counts, descriptions and covers, from the
		Internet Archive's open catalogue.
	</p>
	<p><a href="https://openlibrary.org" rel="external noopener">openlibrary.org</a></p>
</section>

<style>
	h1 {
		font-size: var(--text-xl);
		margin-bottom: var(--space-3);
	}
	h2 {
		font-size: 1.05rem;
		margin: var(--space-5) 0 var(--space-3);
	}
	h3 {
		font-size: 1rem;
		margin-bottom: var(--space-1);
	}
	.credit {
		padding: var(--space-4);
		margin-bottom: var(--space-3);
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
	}
	.credit p {
		margin: var(--space-1) 0;
		font-size: var(--text-sm);
	}
	.notice {
		font-weight: 600;
	}
</style>
