<script lang="ts" module>
	// Stroke icons on a 24px grid; colour comes from currentColor
	const PATHS = {
		search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
		shuffle:
			'<path d="M16 3h5v5"/><path d="M4 20 21 3"/><path d="M21 16v5h-5"/><path d="m15 15 6 6"/><path d="m4 4 5 5"/>',
		shelf:
			'<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="9" rx="1.5"/><rect x="3" y="15" width="7" height="6" rx="1.5"/><rect x="14" y="15" width="7" height="6" rx="1.5"/>',
		add: '<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
		stats: '<path d="M4 20V10M10 20V4M16 20v-7M21 20H3"/>',
		back: '<path d="m15 18-6-6 6-6"/>',
		more: '<path d="M5 12h.01M12 12h.01M19 12h.01"/>',
		check: '<path d="M20 6 9 17l-5-5"/>',
		play: '<path d="M7 4v16l13-8z"/>',
		close: '<path d="M18 6 6 18M6 6l12 12"/>'
	} as const;

	export type IconName = keyof typeof PATHS;
</script>

<script lang="ts">
	let { name, size = 20, stroke = 2 }: { name: IconName; size?: number; stroke?: number } =
		$props();
</script>

<svg
	class="icon"
	aria-hidden="true"
	width={size}
	height={size}
	style:width="{size}px"
	style:height="{size}px"
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width={stroke}
	stroke-linecap="round"
	stroke-linejoin="round">{@html PATHS[name]}</svg
>
