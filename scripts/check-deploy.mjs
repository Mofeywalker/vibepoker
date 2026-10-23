#!/usr/bin/env node
// Catches deployments where JS ships but the CSS bundle is stale (e.g. restored Vercel build cache).
// Usage: node scripts/check-deploy.mjs [https://site.example] [marker1,marker2]
const site = (process.argv[2] || process.env.SITE_URL || 'https://vibepoker-scrum.vercel.app').replace(/\/$/, '');
const markers = (process.argv[3] || '.colorful').split(',');

const html = await (await fetch(site)).text();
const cssUrls = [...new Set([...html.matchAll(/href="([^"]+\.css)"/g)].map((m) => new URL(m[1], site).href))];

if (cssUrls.length === 0) {
  console.error(`✗ ${site}: no stylesheet links found`);
  process.exit(1);
}

let matched = false;
for (const url of cssUrls) {
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`✗ ${site}: ${url} returned ${res.status}`);
    process.exit(1);
  }
  const css = await res.text();
  const missing = markers.filter((marker) => !css.includes(marker));
  if (missing.length === 0) matched = true;
  else console.error(`  ${url}: missing ${missing.join(', ')}`);
}

if (!matched) {
  console.error(`✗ ${site}: served CSS does not contain ${markers.join(', ')} — stale build?`);
  process.exit(1);
}

console.log(`✓ ${site}: CSS contains ${markers.join(', ')}`);
