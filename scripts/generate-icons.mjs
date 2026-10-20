// Renders the app icons into static/icons from the SVG below.
// Run after changing the artwork: node scripts/generate-icons.mjs
import { mkdir, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const BG = '#2f5d50';

// Four book spines on a shelf, drawn on a 512 grid (shifted left to balance the leaning one)
const ART = `<g transform="translate(-16 0)">
	<rect x="132" y="150" width="58" height="232" rx="8" fill="#f2efe6"/>
	<rect x="202" y="110" width="50" height="272" rx="8" fill="#8cc4b0"/>
	<rect x="264" y="176" width="54" height="206" rx="8" fill="#e8b04a"/>
	<rect x="336" y="140" width="52" height="246" rx="8" fill="#f2efe6" transform="rotate(12 362 386)"/>
	<rect x="112" y="382" width="318" height="18" rx="9" fill="#f2efe6"/>
	<rect x="146" y="190" width="30" height="8" rx="4" fill="${BG}" opacity="0.35"/>
	<rect x="146" y="206" width="30" height="8" rx="4" fill="${BG}" opacity="0.35"/>
	<rect x="214" y="150" width="26" height="8" rx="4" fill="${BG}" opacity="0.35"/>
</g>`;

// "any": rounded tile. "maskable": full-bleed square with the art shrunk into the safe zone
// (Android crops maskable icons to a circle or squircle covering the middle 80%).
function svg({ maskable }) {
	const background = maskable
		? `<rect width="512" height="512" fill="${BG}"/>`
		: `<rect width="512" height="512" rx="112" fill="${BG}"/>`;
	const art = maskable ? `<g transform="translate(256 256) scale(0.78) translate(-256 -256)">${ART}</g>` : ART;
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${background}${art}</svg>`;
}

const outputs = [
	{ file: 'icon-192.png', size: 192, maskable: false },
	{ file: 'icon-512.png', size: 512, maskable: false },
	{ file: 'icon-maskable-512.png', size: 512, maskable: true },
	// iOS ignores transparency and applies its own rounding, so it gets the full-bleed version
	{ file: 'apple-touch-icon.png', size: 180, maskable: true }
];

await mkdir('static/icons', { recursive: true });
for (const { file, size, maskable } of outputs) {
	await sharp(Buffer.from(svg({ maskable }))).resize(size, size).png().toFile(`static/icons/${file}`);
}
await writeFile('src/lib/assets/favicon.svg', svg({ maskable: false }) + '\n');

console.log(`Wrote ${outputs.length} icons to static/icons and src/lib/assets/favicon.svg`);
