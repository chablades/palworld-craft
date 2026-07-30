import fs from "node:fs";
import path from "node:path";

const recipes = JSON.parse(
  fs.readFileSync(path.join("src", "data", "recipes.json"), "utf8"),
).recipes;

const dir = path.join("public", "items");
fs.mkdirSync(dir, { recursive: true });

const catTheme = {
  Ammo: { bg: "#f59e0b", fg: "#422006", glyph: "A" },
  Ancient: { bg: "#a78bfa", fg: "#2e1065", glyph: "*" },
  Armor: { bg: "#64748b", fg: "#0f172a", glyph: "H" },
  Components: { bg: "#38bdf8", fg: "#0c4a6e", glyph: "C" },
  Food: { bg: "#fb7185", fg: "#881337", glyph: "F" },
  Ingots: { bg: "#fbbf24", fg: "#78350f", glyph: "I" },
  "Natural Resources": { bg: "#4ade80", fg: "#14532d", glyph: "N" },
  Ores: { bg: "#94a3b8", fg: "#1e293b", glyph: "O" },
  "Pal Materials": { bg: "#f472b6", fg: "#831843", glyph: "P" },
  Spheres: { bg: "#60a5fa", fg: "#1e3a8a", glyph: "S" },
  Tools: { bg: "#2dd4bf", fg: "#134e4a", glyph: "T" },
  Weapons: { bg: "#f87171", fg: "#7f1d1d", glyph: "W" },
  Other: { bg: "#94a3b8", fg: "#1e293b", glyph: "?" },
};

function slug(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function initials(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

let count = 0;
for (const [name, entry] of Object.entries(recipes)) {
  const category = entry?.category || "Other";
  const theme = catTheme[category] || catTheme.Other;
  const h = hash(name);
  const init = initials(name);
  const rot = h % 40;
  const label = escapeXml(name);

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128" role="img" aria-label="${label}">
  <defs>
    <linearGradient id="g${h}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${theme.bg}"/>
      <stop offset="100%" stop-color="${theme.bg}" stop-opacity="0.72"/>
    </linearGradient>
    <pattern id="p${h}" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(${rot})">
      <circle cx="2" cy="2" r="1.2" fill="${theme.fg}" fill-opacity="0.12"/>
    </pattern>
  </defs>
  <rect width="128" height="128" rx="20" fill="url(#g${h})"/>
  <rect width="128" height="128" rx="20" fill="url(#p${h})"/>
  <rect x="10" y="10" width="108" height="108" rx="14" fill="none" stroke="${theme.fg}" stroke-opacity="0.18" stroke-width="3"/>
  <text x="64" y="48" text-anchor="middle" font-size="22" font-weight="700" fill="${theme.fg}" fill-opacity="0.35" font-family="Segoe UI, Arial, sans-serif">${theme.glyph}</text>
  <text x="64" y="86" text-anchor="middle" font-size="28" font-weight="700" fill="${theme.fg}" font-family="Segoe UI, Arial, sans-serif" letter-spacing="1">${init}</text>
</svg>
`;

  fs.writeFileSync(path.join(dir, `${slug(name)}.svg`), svg);
  count += 1;
}

console.log(`wrote ${count} placeholders to ${dir}`);
