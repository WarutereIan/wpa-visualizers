#!/usr/bin/env node
/**
 * Fetch, simplify, normalize, and write default choropleth GeoJSON into public/geo/.
 *
 * Usage: npm run prepare:geo
 */
import { mkdir, readFile, writeFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createRequire } from "node:module";

const execFileAsync = promisify(execFile);
const require = createRequire(import.meta.url);

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(ROOT, "public", "geo");
const VENDOR_WORLD = join(
  ROOT,
  "packages/redash-viz/src/visualizations/choropleth/maps/countries.geo.json",
);

const FETCH_HEADERS = {
  "User-Agent": "bi-dimes-prepare-geo/1.0 (https://github.com)",
  Accept: "application/json, application/geo+json, */*",
};

const NATURAL_EARTH_URLS = [
  "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson",
  "https://cdn.jsdelivr.net/gh/nvkelso/natural-earth-vector@master/geojson/ne_110m_admin_0_countries.geojson",
];

const GEOBOUNDARIES_API = {
  ADM1: "https://www.geoboundaries.org/api/current/gbOpen/KEN/ADM1/",
  ADM2: "https://www.geoboundaries.org/api/current/gbOpen/KEN/ADM2/",
};

const GEOBOUNDARIES_FALLBACKS = {
  ADM1: [
    "https://cdn.jsdelivr.net/gh/wmgeolab/geoBoundaries@9469f09/releaseData/gbOpen/KEN/ADM1/geoBoundaries-KEN-ADM1_simplified.geojson",
    "https://github.com/wmgeolab/geoBoundaries/raw/9469f09/releaseData/gbOpen/KEN/ADM1/geoBoundaries-KEN-ADM1_simplified.geojson",
    "https://cdn.jsdelivr.net/gh/wmgeolab/geoBoundaries@9469f09/releaseData/gbOpen/KEN/ADM1/geoBoundaries-KEN-ADM1.geojson",
  ],
  ADM2: [
    "https://cdn.jsdelivr.net/gh/wmgeolab/geoBoundaries@9469f09/releaseData/gbOpen/KEN/ADM2/geoBoundaries-KEN-ADM2_simplified.geojson",
    "https://github.com/wmgeolab/geoBoundaries/raw/9469f09/releaseData/gbOpen/KEN/ADM2/geoBoundaries-KEN-ADM2_simplified.geojson",
    "https://cdn.jsdelivr.net/gh/wmgeolab/geoBoundaries@9469f09/releaseData/gbOpen/KEN/ADM2/geoBoundaries-KEN-ADM2.geojson",
  ],
};

/** ISO 3166-1 codes used when Natural Earth continent is missing (vendored fallback). */
const AFRICA_ISO = new Set([
  "AO", "BF", "BI", "BJ", "BW", "CD", "CF", "CG", "CI", "CM", "CV", "DJ", "DZ",
  "EG", "EH", "ER", "ET", "GA", "GH", "GM", "GN", "GQ", "GW", "KE", "KM", "LR",
  "LS", "LY", "MA", "MG", "ML", "MR", "MU", "MW", "MZ", "NA", "NE", "NG", "RW",
  "SC", "SD", "SL", "SN", "SO", "SS", "ST", "SZ", "TD", "TG", "TN", "TZ", "UG",
  "ZA", "ZM", "ZW",
  "AGO", "BDI", "BEN", "BFA", "BWA", "CAF", "CIV", "CMR", "COD", "COG", "COM",
  "CPV", "DJI", "DZA", "EGY", "ERI", "ESH", "ETH", "GAB", "GHA", "GIN", "GMB",
  "GNB", "GNQ", "KEN", "LBR", "LBY", "LSO", "MAR", "MDG", "MLI", "MOZ", "MRT",
  "MUS", "MWI", "NAM", "NER", "NGA", "RWA", "SDN", "SEN", "SLE", "SOM", "SSD",
  "STP", "SWZ", "SYC", "TCD", "TGO", "TUN", "TZA", "UGA", "ZAF", "ZMB", "ZWE",
  "SAH", "SOL",
]);

const FIELD_LABELS = {
  name: "Name",
  code: "Code",
  iso_a2: "ISO 3166-1 alpha-2",
  iso_a3: "ISO 3166-1 alpha-3",
  iso_n3: "ISO 3166-1 numeric",
  name_long: "Long name",
  abbrev: "Abbreviation",
  continent: "Continent",
  ADMIN: "Admin name",
  NAME: "Natural Earth name",
  NAME_LONG: "Natural Earth long name",
  ISO_A2: "ISO alpha-2 (Natural Earth)",
  ISO_A3: "ISO alpha-3 (Natural Earth)",
  CONTINENT: "Continent (Natural Earth)",
  REGION_UN: "UN region",
  SUBREGION: "Subregion",
  shapeName: "Shape name",
  shapeID: "Shape ID",
  shapeGroup: "Shape group",
  shapeType: "Shape type",
};

function log(message) {
  console.log(`[prepare-geo] ${message}`);
}

function warn(message) {
  console.warn(`[prepare-geo] WARN: ${message}`);
}

function githubToJsdelivr(url) {
  const match = String(url).match(
    /^https:\/\/(?:github\.com\/([^/]+\/[^/]+)\/raw|raw\.githubusercontent\.com\/([^/]+\/[^/]+))\/([^/]+)\/(.+)$/,
  );
  if (!match) return null;
  const repo = match[1] || match[2];
  return `https://cdn.jsdelivr.net/gh/${repo}@${match[3]}/${match[4]}`;
}

function isLfsPointer(text) {
  return text.startsWith("version https://git-lfs.github.com");
}

async function fetchText(url) {
  const res = await fetch(url, { headers: FETCH_HEADERS, redirect: "follow" });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText} for ${url}`);
  }
  return res.text();
}

async function fetchJson(url) {
  const text = await fetchText(url);
  if (isLfsPointer(text)) {
    throw new Error(`Git LFS pointer (not file contents) at ${url}`);
  }
  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error(`Invalid JSON from ${url}: ${err.message}`);
  }
}

async function fetchJsonWithFallbacks(urls, label) {
  const errors = [];
  const seen = new Set();
  const queue = [];
  for (const url of urls) {
    if (url && !seen.has(url)) {
      seen.add(url);
      queue.push(url);
    }
    const cdn = url ? githubToJsdelivr(url) : null;
    if (cdn && !seen.has(cdn)) {
      seen.add(cdn);
      queue.push(cdn);
    }
  }

  for (const url of queue) {
    try {
      log(`Fetching ${label}: ${url}`);
      const data = await fetchJson(url);
      return { data, url };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      warn(`${label} failed (${url}): ${msg}`);
      errors.push(`${url}: ${msg}`);
    }
  }

  throw new Error(
    `All sources failed for ${label}. Tried:\n  - ${errors.join("\n  - ")}`,
  );
}

function prop(properties, keys) {
  for (const key of keys) {
    const value = properties?.[key];
    if (value == null) continue;
    const text = String(value).trim();
    if (!text || text === "-99" || text.toLowerCase() === "null") continue;
    return text;
  }
  return null;
}

function humanizeKey(key) {
  if (FIELD_LABELS[key]) return FIELD_LABELS[key];
  return key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function fieldNamesFromFeatures(features) {
  const keys = new Set();
  for (const feature of features) {
    for (const key of Object.keys(feature.properties || {})) keys.add(key);
  }
  const names = {};
  for (const key of [...keys].sort()) names[key] = humanizeKey(key);
  return names;
}

function isAfricaFeature(properties) {
  const continent = prop(properties, ["CONTINENT", "continent", "REGION_UN"]);
  if (continent && continent.toLowerCase() === "africa") return true;
  const iso = prop(properties, ["iso_a2", "ISO_A2", "iso_a3", "ISO_A3"]);
  return iso ? AFRICA_ISO.has(iso.toUpperCase()) : false;
}

const COUNTRY_KEEP = [
  "name",
  "name_long",
  "abbrev",
  "iso_a2",
  "iso_a3",
  "iso_n3",
  "continent",
  "NAME",
  "NAME_LONG",
  "ADMIN",
  "ABBREV",
  "ISO_A2",
  "ISO_A3",
  "ISO_N3",
  "CONTINENT",
  "REGION_UN",
  "SUBREGION",
];

function pickKept(raw, keys) {
  const out = {};
  for (const key of keys) {
    if (raw[key] != null && raw[key] !== "") out[key] = raw[key];
  }
  return out;
}

function normalizeCountryFeature(feature) {
  const raw = { ...(feature.properties || {}) };
  const isoA2 = prop(raw, ["iso_a2", "ISO_A2", "ISO_A2_EH"]);
  const isoA3 = prop(raw, ["iso_a3", "ISO_A3", "ISO_A3_EH", "ADM0_A3"]);
  const name =
    prop(raw, ["name", "NAME", "name_long", "NAME_LONG", "ADMIN"]) ||
    isoA2 ||
    isoA3 ||
    "Unknown";
  const code = isoA2 || isoA3 || name;
  const continent = prop(raw, ["continent", "CONTINENT"]);

  return {
    type: "Feature",
    geometry: feature.geometry,
    properties: {
      ...pickKept(raw, COUNTRY_KEEP),
      name,
      code,
      ...(isoA2 ? { iso_a2: isoA2 } : {}),
      ...(isoA3 ? { iso_a3: isoA3 } : {}),
      ...(continent ? { continent } : {}),
    },
  };
}

function normalizeKenyaFeature(feature) {
  const raw = { ...(feature.properties || {}) };
  const name =
    prop(raw, ["name", "shapeName", "ADM2_EN", "ADM1_EN", "NAME_2", "NAME_1"]) ||
    "Unknown";
  // Prefer ISO 3166-2 / pcode (shapeISO) when present; ADM2 often has empty shapeISO.
  const code =
    prop(raw, [
      "code",
      "shapeISO",
      "ADM2_PCODE",
      "ADM1_PCODE",
      "shapeID",
      "shapeName",
    ]) || name;

  return {
    type: "Feature",
    geometry: feature.geometry,
    properties: {
      ...pickKept(raw, ["shapeName", "shapeISO", "shapeID", "shapeGroup", "shapeType"]),
      name,
      code,
    },
  };
}

function asFeatureCollection(data, label) {
  if (data?.type === "FeatureCollection" && Array.isArray(data.features)) {
    return data;
  }
  if (data?.type === "Feature") {
    return { type: "FeatureCollection", features: [data] };
  }
  throw new Error(`${label} is not a GeoJSON Feature or FeatureCollection`);
}

function assertNormalized(collection, label) {
  if (collection.type !== "FeatureCollection") {
    throw new Error(`${label}: expected FeatureCollection`);
  }
  if (!collection.features.length) {
    throw new Error(`${label}: no features`);
  }
  for (let i = 0; i < collection.features.length; i++) {
    const props = collection.features[i].properties || {};
    if (typeof props.name !== "string" || !props.name) {
      throw new Error(`${label}: feature ${i} missing properties.name`);
    }
    if (typeof props.code !== "string" || !props.code) {
      throw new Error(`${label}: feature ${i} missing properties.code`);
    }
  }
}

async function resolveMapshaperBin() {
  try {
    return require.resolve("mapshaper/bin/mapshaper");
  } catch {
    return require.resolve("mapshaper/mapshaper");
  }
}

async function simplifyCollection(collection, percent, label) {
  const workDir = await mkdtemp(join(tmpdir(), "prepare-geo-"));
  const inputPath = join(workDir, "input.geojson");
  const outputPath = join(workDir, "output.geojson");
  try {
    await writeFile(inputPath, JSON.stringify(collection));
    const bin = await resolveMapshaperBin();
    const args = [
      "-i",
      inputPath,
      "-simplify",
      "visvalingam",
      `${percent}%`,
      "keep-shapes",
      "-o",
      outputPath,
      "geojson-type=FeatureCollection",
      "precision=0.00001",
    ];
    log(`Simplifying ${label} at ${percent}% (${bin})`);
    await execFileAsync(process.execPath, [bin, ...args], {
      windowsHide: true,
      maxBuffer: 64 * 1024 * 1024,
    });
    return JSON.parse(await readFile(outputPath, "utf8"));
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}

async function simplifyUnderBudget(collection, { percent, maxBytes, label }) {
  let current = await simplifyCollection(collection, percent, label);
  let json = JSON.stringify(current);
  let size = Buffer.byteLength(json);

  let nextPercent = percent;
  while (maxBytes && size > maxBytes && nextPercent > 2) {
    nextPercent = Math.max(2, Math.floor(nextPercent / 2));
    warn(`${label} is ${(size / 1024 / 1024).toFixed(2)} MB; retrying simplify at ${nextPercent}%`);
    current = await simplifyCollection(collection, nextPercent, label);
    json = JSON.stringify(current);
    size = Buffer.byteLength(json);
  }

  if (maxBytes && size > maxBytes) {
    warn(
      `${label} is still ${(size / 1024 / 1024).toFixed(2)} MB after ${nextPercent}% simplify (target ${(maxBytes / 1024 / 1024).toFixed(1)} MB)`,
    );
  }
  return current;
}

async function loadWorld() {
  try {
    const { data, url } = await fetchJsonWithFallbacks(
      NATURAL_EARTH_URLS,
      "Natural Earth 110m countries",
    );
    return {
      collection: asFeatureCollection(data, "Natural Earth"),
      source: `Natural Earth 110m Admin-0 countries (${url})`,
      license: "Public Domain (Natural Earth)",
    };
  } catch (err) {
    warn(`Natural Earth fetch failed; using vendored countries.geo.json. ${err.message}`);
    const text = await readFile(VENDOR_WORLD, "utf8");
    return {
      collection: asFeatureCollection(JSON.parse(text), "vendored world"),
      source:
        "Vendored Redash choropleth map (packages/redash-viz/.../countries.geo.json); derived from Natural Earth",
      license: "Public Domain (Natural Earth)",
    };
  }
}

function kenyaDownloadUrls(meta, level) {
  const urls = [];
  if (meta?.simplifiedGeometryGeoJSON) urls.push(meta.simplifiedGeometryGeoJSON);
  if (meta?.gjDownloadURL) urls.push(meta.gjDownloadURL);
  urls.push(...GEOBOUNDARIES_FALLBACKS[level]);
  return urls;
}

async function loadKenya(level) {
  const apiUrl = GEOBOUNDARIES_API[level];
  let meta = null;
  try {
    log(`Fetching geoBoundaries metadata: ${apiUrl}`);
    meta = await fetchJson(apiUrl);
  } catch (err) {
    warn(`geoBoundaries API ${level} failed: ${err.message}`);
  }

  const { data, url } = await fetchJsonWithFallbacks(
    kenyaDownloadUrls(meta, level),
    `Kenya ${level}`,
  );

  const sourceBits = [
    `geoBoundaries gbOpen Kenya ${level}`,
    meta?.boundaryCanonical ? `(${meta.boundaryCanonical})` : "",
    meta?.boundaryYearRepresented ? `year ${meta.boundaryYearRepresented}` : "",
    `(${url})`,
  ]
    .filter(Boolean)
    .join(" ");

  const sourceLicense =
    meta?.boundaryLicense && meta.boundaryLicense !== "nan"
      ? `${meta.boundaryLicense}; distributed by geoBoundaries under CC BY 4.0`
      : "CC BY 4.0 (geoBoundaries gbOpen)";

  return {
    collection: asFeatureCollection(data, `Kenya ${level}`),
    source: sourceBits,
    license: sourceLicense,
    meta,
    url,
  };
}

async function writeGeojson(filename, collection) {
  const path = join(OUT_DIR, filename);
  const json = JSON.stringify(collection);
  await writeFile(path, json);
  const bytes = Buffer.byteLength(json);
  log(`Wrote ${filename} (${(bytes / 1024).toFixed(1)} KB, ${collection.features.length} features)`);
  return { path, bytes, featureCount: collection.features.length };
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const world = await loadWorld();
  const worldFeatures = world.collection.features.map(normalizeCountryFeature);
  const worldCollection = { type: "FeatureCollection", features: worldFeatures };
  const worldOut = await simplifyUnderBudget(worldCollection, {
    percent: 80,
    label: "world-countries",
  });
  assertNormalized(worldOut, "world-countries");

  const africaFeatures = worldOut.features.filter((f) => isAfricaFeature(f.properties));
  if (!africaFeatures.length) {
    throw new Error("Africa filter produced 0 features");
  }
  const africaOut = { type: "FeatureCollection", features: africaFeatures };
  assertNormalized(africaOut, "africa-countries");

  const kenyaAdm1 = await loadKenya("ADM1");
  const kenyaCounties = await simplifyUnderBudget(
    {
      type: "FeatureCollection",
      features: kenyaAdm1.collection.features.map(normalizeKenyaFeature),
    },
    { percent: 40, maxBytes: 1.5 * 1024 * 1024, label: "kenya-counties" },
  );
  assertNormalized(kenyaCounties, "kenya-counties");

  const kenyaAdm2 = await loadKenya("ADM2");
  const kenyaSubcounties = await simplifyUnderBudget(
    {
      type: "FeatureCollection",
      features: kenyaAdm2.collection.features.map(normalizeKenyaFeature),
    },
    { percent: 20, maxBytes: 2.5 * 1024 * 1024, label: "kenya-subcounties" },
  );
  assertNormalized(kenyaSubcounties, "kenya-subcounties");

  const written = {
    world: await writeGeojson("world-countries.geojson", worldOut),
    africa: await writeGeojson("africa-countries.geojson", africaOut),
    kenyaCounties: await writeGeojson("kenya-counties.geojson", kenyaCounties),
    kenyaSubcounties: await writeGeojson("kenya-subcounties.geojson", kenyaSubcounties),
  };

  const maps = [
    {
      id: "world-countries",
      file: "world-countries.geojson",
      targetField: "code",
      fieldNames: fieldNamesFromFeatures(worldOut.features),
      source: world.source,
      license: world.license,
      featureCount: worldOut.features.length,
      bytes: written.world.bytes,
    },
    {
      id: "africa-countries",
      file: "africa-countries.geojson",
      targetField: "code",
      fieldNames: fieldNamesFromFeatures(africaOut.features),
      source: `${world.source}; filtered to Africa (continent or ISO region)`,
      license: world.license,
      featureCount: africaOut.features.length,
      bytes: written.africa.bytes,
    },
    {
      id: "kenya-counties",
      file: "kenya-counties.geojson",
      targetField: "code",
      fieldNames: fieldNamesFromFeatures(kenyaCounties.features),
      source: kenyaAdm1.source,
      license: kenyaAdm1.license,
      featureCount: kenyaCounties.features.length,
      bytes: written.kenyaCounties.bytes,
    },
    {
      id: "kenya-subcounties",
      file: "kenya-subcounties.geojson",
      targetField: "code",
      fieldNames: fieldNamesFromFeatures(kenyaSubcounties.features),
      source: kenyaAdm2.source,
      license: kenyaAdm2.license,
      featureCount: kenyaSubcounties.features.length,
      bytes: written.kenyaSubcounties.bytes,
    },
  ];

  const manifest = {
    generatedBy: "scripts/prepare-geo.mjs",
    generatedAt: new Date().toISOString(),
    maps,
  };
  await writeFile(join(OUT_DIR, "MANIFEST.json"), JSON.stringify(manifest, null, 2) + "\n");
  log("Wrote MANIFEST.json");
}

main().catch((err) => {
  console.error(`[prepare-geo] ERROR: ${err.stack || err.message}`);
  process.exit(1);
});
