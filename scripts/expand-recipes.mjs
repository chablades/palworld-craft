/**
 * One-shot expansion helper: merges additional curated recipes into recipes.json.
 * Run: node scripts/expand-recipes.mjs
 */
import fs from "node:fs";
import path from "node:path";

const file = path.join("src", "data", "recipes.json");
const book = JSON.parse(fs.readFileSync(file, "utf8"));
const recipes = book.recipes;

const additions = {
  // --- Raw materials ---
  Wheat: {
    type: "RAW",
    sources: ["Wheat plantations", "Farming"],
    drops: ["Caprity", "Gumoss"],
    category: "Food",
  },
  Egg: {
    type: "RAW",
    sources: ["Ranch", "Bird pals"],
    drops: ["Chikipi", "Tocotoco"],
    category: "Food",
  },
  Milk: {
    type: "RAW",
    sources: ["Ranch"],
    drops: ["Mozzarina", "Melpaca"],
    category: "Food",
  },
  Meat: {
    type: "RAW",
    sources: ["Hunting", "Butchering"],
    drops: ["Lamball", "Rushoar", "Caprity", "Mammorest"],
    category: "Food",
  },
  Honey: {
    type: "RAW",
    sources: ["Beehive", "Ranch"],
    drops: ["Beegarde", "Elizabee"],
    category: "Food",
  },
  Horn: {
    type: "RAW",
    sources: ["Hunting horned pals"],
    drops: ["Incineram", "Univolt", "Eikthyrdeer"],
    category: "Pal Materials",
  },
  "Beautiful Flower": {
    type: "RAW",
    sources: ["Flower patches", "Ranch"],
    drops: ["Flopie", "Petallia", "Lyleen"],
    category: "Natural Resources",
  },
  Tomato: {
    type: "RAW",
    sources: ["Tomato plantations", "Farming"],
    drops: ["Caprity"],
    category: "Food",
  },
  Lettuce: {
    type: "RAW",
    sources: ["Lettuce plantations", "Farming"],
    category: "Food",
  },
  "Low Grade Medical Supplies": {
    type: "RAW",
    sources: ["Chests", "Merchants"],
    category: "Components",
  },
  "Medical Supplies": {
    type: "RAW",
    sources: ["Chests", "Merchants", "Crafting upgrade"],
    category: "Components",
  },

  // --- Food ---
  Flour: {
    station: "Mill",
    ingredients: { Wheat: 1 },
    techLevel: 8,
    category: "Food",
  },
  Bread: {
    station: "Cooking Pot",
    ingredients: { Flour: 1 },
    techLevel: 8,
    category: "Food",
  },
  "Fried Eggs": {
    station: "Campfire",
    ingredients: { Egg: 1 },
    techLevel: 1,
    category: "Food",
  },
  Pancake: {
    station: "Cooking Pot",
    ingredients: { Flour: 1, Egg: 1, Milk: 1 },
    techLevel: 9,
    category: "Food",
  },
  "Jam-filled Bun": {
    station: "Cooking Pot",
    ingredients: { Flour: 1, "Red Berries": 2, Milk: 1 },
    techLevel: 10,
    category: "Food",
  },
  "Honey Glazed Lamball": {
    station: "Cooking Pot",
    ingredients: { Meat: 2, Honey: 2 },
    techLevel: 12,
    category: "Food",
  },
  Salad: {
    station: "Cooking Pot",
    ingredients: { "Red Berries": 2, Tomato: 2, Lettuce: 2 },
    techLevel: 14,
    category: "Food",
  },
  "Grilled Meat": {
    station: "Campfire",
    ingredients: { Meat: 1 },
    techLevel: 1,
    category: "Food",
  },
  "Berry Salad": {
    station: "Cooking Pot",
    ingredients: { "Red Berries": 3, Honey: 1 },
    techLevel: 6,
    category: "Food",
  },

  // --- Armor ---
  "Feathered Hair Band": {
    station: "Primitive Workbench",
    ingredients: { Fiber: 10, "Beautiful Flower": 1 },
    techLevel: 5,
    category: "Armor",
  },
  "Heat Resistant Pelt Armor": {
    station: "High Quality Workbench",
    ingredients: { Leather: 15, "Flame Organ": 5 },
    techLevel: 9,
    category: "Armor",
  },
  "Cold Resistant Pelt Armor": {
    station: "High Quality Workbench",
    ingredients: { Leather: 15, "Ice Organ": 5 },
    techLevel: 9,
    category: "Armor",
  },
  "Heat Resistant Metal Armor": {
    station: "High Quality Workbench",
    ingredients: { Ingot: 40, Leather: 10, "Flame Organ": 8 },
    techLevel: 15,
    category: "Armor",
  },
  "Cold Resistant Metal Armor": {
    station: "High Quality Workbench",
    ingredients: { Ingot: 40, Leather: 10, "Ice Organ": 8 },
    techLevel: 15,
    category: "Armor",
  },
  "Metal Shield": {
    station: "High Quality Workbench",
    ingredients: { Ingot: 20, "Paldium Fragment": 15, Leather: 10 },
    techLevel: 12,
    category: "Armor",
  },
  "Heat Resistant Undershirt": {
    station: "Primitive Workbench",
    ingredients: { Cloth: 3, "Flame Organ": 2 },
    techLevel: 6,
    category: "Armor",
  },
  "Thermal Underwear": {
    station: "Primitive Workbench",
    ingredients: { Cloth: 3, "Ice Organ": 2 },
    techLevel: 6,
    category: "Armor",
  },

  // --- Weapons ---
  "Makeshift Handgun": {
    station: "Weapon Workbench",
    ingredients: { Ingot: 20, "High Quality Pal Oil": 5 },
    techLevel: 12,
    category: "Weapons",
  },
  "Metal Spear": {
    station: "Weapon Workbench",
    ingredients: { Ingot: 10, Wood: 20 },
    techLevel: 8,
    category: "Weapons",
  },
  "Double-barreled Shotgun": {
    station: "Weapon Assembly Line",
    ingredients: { "Refined Ingot": 30, Polymer: 8, "Carbon Fiber": 10 },
    techLevel: 26,
    category: "Weapons",
  },
  "Pump-action Shotgun": {
    station: "Weapon Assembly Line",
    ingredients: { "Refined Ingot": 40, Polymer: 10, "Carbon Fiber": 15 },
    techLevel: 30,
    category: "Weapons",
  },
  "Rocket Launcher": {
    station: "Weapon Assembly Line II",
    ingredients: { "Pal Metal Ingot": 50, Polymer: 20, "Carbon Fiber": 30 },
    techLevel: 40,
    category: "Weapons",
  },
  Sword: {
    station: "Weapon Workbench",
    ingredients: { Ingot: 25, Wood: 15, Stone: 10 },
    techLevel: 10,
    category: "Weapons",
  },
  Katana: {
    station: "Weapon Assembly Line",
    ingredients: { "Refined Ingot": 30, "High Quality Cloth": 5 },
    techLevel: 28,
    category: "Weapons",
  },

  // --- Tools ---
  "Metal Axe": {
    station: "High Quality Workbench",
    ingredients: { Ingot: 10, Wood: 15 },
    techLevel: 8,
    category: "Tools",
  },
  "Metal Pickaxe": {
    station: "High Quality Workbench",
    ingredients: { Ingot: 10, Wood: 15 },
    techLevel: 8,
    category: "Tools",
  },
  "Refined Metal Axe": {
    station: "Production Assembly Line",
    ingredients: { "Refined Ingot": 15, Wood: 20 },
    techLevel: 18,
    category: "Tools",
  },
  "Refined Metal Pickaxe": {
    station: "Production Assembly Line",
    ingredients: { "Refined Ingot": 15, Wood: 20 },
    techLevel: 18,
    category: "Tools",
  },
  Torch: {
    station: "Primitive Workbench",
    ingredients: { Wood: 2, "Red Berries": 1 },
    techLevel: 1,
    category: "Tools",
  },

  // --- Ammo ---
  "Shotgun Shells": {
    station: "Weapon Workbench",
    ingredients: { "Refined Ingot": 1, Gunpowder: 2 },
    techLevel: 26,
    category: "Ammo",
  },
  "Rocket Ammo": {
    station: "Weapon Assembly Line II",
    ingredients: { "Pal Metal Ingot": 2, Gunpowder: 5 },
    techLevel: 40,
    category: "Ammo",
  },
  "Explosive Arrow": {
    station: "Weapon Workbench",
    ingredients: { Wood: 5, Stone: 5, Gunpowder: 1 },
    techLevel: 17,
    category: "Ammo",
  },
  "Decoy Grenade": {
    station: "Weapon Workbench",
    ingredients: { Fiber: 10, "Flame Organ": 1 },
    techLevel: 15,
    category: "Ammo",
  },
  "Frag Grenade": {
    station: "Weapon Workbench",
    ingredients: { Fiber: 10, Gunpowder: 2, "Flame Organ": 1 },
    techLevel: 22,
    category: "Ammo",
  },
  "Shock Grenade": {
    station: "Weapon Workbench",
    ingredients: { Fiber: 10, "Electric Organ": 2 },
    techLevel: 20,
    category: "Ammo",
  },

  // --- Spheres ---
  "Exotic Sphere": {
    station: "Sphere Assembly Line II",
    ingredients: {
      "Paldium Fragment": 15,
      "Pal Metal Ingot": 8,
      "Carbon Fiber": 5,
      Cement: 8,
    },
    techLevel: 45,
    techType: "ancient",
    category: "Spheres",
  },
  "Ultimate Sphere": {
    station: "Sphere Assembly Line II",
    ingredients: {
      "Paldium Fragment": 20,
      "Pal Metal Ingot": 10,
      "Carbon Fiber": 8,
      Cement: 10,
    },
    techLevel: 48,
    techType: "ancient",
    category: "Spheres",
  },

  // --- Structures ---
  Palbox: {
    station: "Primitive Workbench",
    ingredients: { "Paldium Fragment": 1, Wood: 8, Stone: 3 },
    techLevel: 1,
    category: "Structures",
  },
  Campfire: {
    station: "Primitive Workbench",
    ingredients: { Wood: 10 },
    techLevel: 1,
    category: "Structures",
  },
  "Feed Box": {
    station: "Primitive Workbench",
    ingredients: { Wood: 20 },
    techLevel: 2,
    category: "Structures",
  },
  "Wooden Chest": {
    station: "Primitive Workbench",
    ingredients: { Wood: 15, Stone: 5 },
    techLevel: 2,
    category: "Structures",
  },
  "Wooden Structure Set": {
    station: "Primitive Workbench",
    ingredients: { Wood: 3 },
    techLevel: 2,
    category: "Structures",
  },
  "Stone Structure Set": {
    station: "High Quality Workbench",
    ingredients: { Stone: 5, Wood: 2 },
    techLevel: 10,
    category: "Structures",
  },
  "Berry Plantation": {
    station: "High Quality Workbench",
    ingredients: { Wood: 40, Stone: 20, Fiber: 40, "Pal Fluids": 10 },
    techLevel: 5,
    category: "Structures",
  },
  Ranch: {
    station: "High Quality Workbench",
    ingredients: { Wood: 50, Stone: 20, Fiber: 30 },
    techLevel: 5,
    category: "Structures",
  },
  "Logging Site": {
    station: "High Quality Workbench",
    ingredients: { Wood: 50, Stone: 20, "Paldium Fragment": 10 },
    techLevel: 7,
    category: "Structures",
  },
  "Stone Pit": {
    station: "High Quality Workbench",
    ingredients: { Wood: 50, Stone: 20, "Paldium Fragment": 10 },
    techLevel: 7,
    category: "Structures",
  },
  "Ore Mining Site": {
    station: "High Quality Workbench",
    ingredients: { Ingot: 50, Wood: 50, Stone: 40, "Paldium Fragment": 20 },
    techLevel: 15,
    category: "Structures",
  },
  "Coal Mine": {
    station: "Production Assembly Line",
    ingredients: {
      "Refined Ingot": 50,
      Wood: 50,
      Stone: 40,
      "Paldium Fragment": 20,
    },
    techLevel: 22,
    category: "Structures",
  },
  "Sphere Workbench": {
    station: "High Quality Workbench",
    ingredients: { "Paldium Fragment": 10, Wood: 30, Stone: 20 },
    techLevel: 2,
    category: "Structures",
  },
  "Weapon Workbench": {
    station: "High Quality Workbench",
    ingredients: { Ingot: 15, Wood: 40, Stone: 20 },
    techLevel: 3,
    category: "Structures",
  },
  "Primitive Furnace": {
    station: "Primitive Workbench",
    ingredients: { Wood: 20, Stone: 50 },
    techLevel: 2,
    category: "Structures",
  },
  Crusher: {
    station: "High Quality Workbench",
    ingredients: { Wood: 50, Stone: 40, "Paldium Fragment": 10 },
    techLevel: 6,
    category: "Structures",
  },
  "Cooking Pot": {
    station: "Primitive Workbench",
    ingredients: { Wood: 20, Ingot: 10 },
    techLevel: 4,
    category: "Structures",
  },
  Mill: {
    station: "High Quality Workbench",
    ingredients: { Wood: 50, Stone: 40, Ingot: 10 },
    techLevel: 8,
    category: "Structures",
  },

  // --- Components ---
  "Nail Gun": {
    station: "High Quality Workbench",
    ingredients: { Ingot: 20, Nail: 20 },
    techLevel: 11,
    category: "Tools",
  },
  "Repair Kit": {
    station: "Primitive Workbench",
    ingredients: { Ingot: 5, Stone: 10 },
    techLevel: 3,
    category: "Components",
  },
  "Small Feed Bag": {
    station: "Primitive Workbench",
    ingredients: { Fiber: 5, "Red Berries": 5 },
    techLevel: 2,
    category: "Components",
  },
};

// Fill missing drops on existing raws
const dropPatches = {
  "Crude Oil": {
    // Not a typical pal drop — keep sources authoritative; add mining companions that work oil fields
    drops: ["Dumud"],
  },
  Hexolite: {
    drops: ["Xenovader", "Selyne"],
  },
  "Paldium Fragment": {
    drops: ["Digtoise", "Astegon"],
  },
  "Pure Quartz": {
    drops: ["Digtoise", "Anubis"],
  },
  "Solarite Ingot": {
    drops: ["Xenovader", "Silvegis"],
  },
  Sulfur: {
    drops: ["Digtoise", "Blazamut"],
  },
};

let added = 0;
let skipped = 0;
for (const [name, entry] of Object.entries(additions)) {
  if (recipes[name]) {
    skipped += 1;
    continue;
  }
  recipes[name] = entry;
  added += 1;
}

let patched = 0;
for (const [name, patch] of Object.entries(dropPatches)) {
  const existing = recipes[name];
  if (!existing || existing.type !== "RAW") continue;
  if (!existing.drops || existing.drops.length === 0) {
    existing.drops = patch.drops;
    patched += 1;
  }
}

const sorted = Object.fromEntries(
  Object.entries(recipes).sort(([a], [b]) => a.localeCompare(b)),
);
book.recipes = sorted;
fs.writeFileSync(file, `${JSON.stringify(book, null, 2)}\n`);
console.log(`added ${added}, skipped existing ${skipped}, drop-patched ${patched}, total ${Object.keys(sorted).length}`);
