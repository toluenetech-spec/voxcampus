/**
 * Inline SVG avatars.
 *
 * The app previously fell back to `ui-avatars.com`, which meant every avatar
 * broke into a blank box whenever the network was unavailable (or slow).
 * These are generated locally, so they always render and never leak a request
 * to a third party.
 */

const PALETTE = [
  ['#1F6AE1', '#0ea5b7'],
  ['#E916E6', '#7c3aed'],
  ['#0ea5e9', '#22d3ee'],
  ['#f59e0b', '#ef4444'],
  ['#10b981', '#0ea5b7'],
  ['#8b5cf6', '#E916E6'],
];

export function initialsOf(name) {
  const parts = String(name ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function colorPairFor(seed) {
  const key = String(seed ?? '');
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) % 100000;
  }
  return PALETTE[hash % PALETTE.length];
}

export function avatarDataUri(name) {
  const initials = initialsOf(name);
  const [from, to] = colorPairFor(name || initials);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${from}"/><stop offset="100%" stop-color="${to}"/></linearGradient></defs>
<rect width="128" height="128" rx="64" fill="url(#g)"/>
<text x="64" y="64" font-family="Inter, system-ui, sans-serif" font-size="52" font-weight="700" fill="#ffffff" text-anchor="middle" dominant-baseline="central">${initials}</text>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
