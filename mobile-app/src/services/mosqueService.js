/**
 * Mosque Service — Nearby Mosques via OpenStreetMap Overpass API
 *
 * Uses the completely free Overpass API to query OSM for mosques/prayer rooms.
 * No API key required.
 *
 * OSM Tags used:
 *   amenity=place_of_worship + religion=muslim
 *   building=mosque
 */

const OVERPASS_API = 'https://overpass-api.de/api/interpreter';

/**
 * Calculate distance between two lat/lng points in km (Haversine formula)
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate bearing from point A to point B (in degrees)
 */
function calculateBearing(lat1, lon1, lat2, lon2) {
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const radLat1 = (lat1 * Math.PI) / 180;
  const radLat2 = (lat2 * Math.PI) / 180;

  const y = Math.sin(dLon) * Math.cos(radLat2);
  const x =
    Math.cos(radLat1) * Math.sin(radLat2) -
    Math.sin(radLat1) * Math.cos(radLat2) * Math.cos(dLon);

  let bearing = (Math.atan2(y, x) * 180) / Math.PI;
  return (bearing + 360) % 360;
}

/**
 * Convert bearing degrees to a compass direction (N, NE, E, etc.)
 */
function bearingToDirection(bearing) {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(bearing / 45) % 8;
  return directions[index];
}

/**
 * Build the Overpass QL query for mosques/prayer rooms near a coordinate.
 *
 * @param {number} lat  - Latitude
 * @param {number} lon  - Longitude
 * @param {number} radiusMeters - Search radius in meters (default 5000 = 5 km)
 */
function buildOverpassQuery(lat, lon, radiusMeters = 5000) {
  return `
[out:json][timeout:25];
(
  // Nodes & ways tagged as Muslim place of worship
  node["amenity"="place_of_worship"]["religion"="muslim"](around:${radiusMeters},${lat},${lon});
  way["amenity"="place_of_worship"]["religion"="muslim"](around:${radiusMeters},${lat},${lon});
  relation["amenity"="place_of_worship"]["religion"="muslim"](around:${radiusMeters},${lat},${lon});
  // Buildings tagged as mosque
  node["building"="mosque"](around:${radiusMeters},${lat},${lon});
  way["building"="mosque"](around:${radiusMeters},${lat},${lon});
);
out center body;
>;
out skel qt;
`.trim();
}

/**
 * Parse raw Overpass JSON into a clean mosque list.
 */
function parseOverpassResponse(data, userLat, userLon) {
  if (!data || !data.elements) return [];

  const seen = new Set();
  const mosques = [];

  for (const el of data.elements) {
    // Skip elements without tags (skeleton elements from `>; out skel qt;`)
    if (!el.tags) continue;

    // Determine latitude / longitude
    let lat = el.lat;
    let lon = el.lon;
    if (!lat && el.center) {
      lat = el.center.lat;
      lon = el.center.lon;
    }
    if (!lat || !lon) continue;

    // Dedup by coordinate (rounded to ~11 m)
    const key = `${lat.toFixed(4)},${lon.toFixed(4)}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const tags = el.tags || {};
    const name = tags.name || tags['name:en'] || tags['name:ar'] || 'Unnamed Mosque';
    const nameAr = tags['name:ar'] || null;

    const distance = haversineDistance(userLat, userLon, lat, lon);
    const bearing = calculateBearing(userLat, userLon, lat, lon);

    mosques.push({
      id: `${el.type}_${el.id}`,
      name,
      nameAr,
      latitude: lat,
      longitude: lon,
      distance, // km
      bearing,
      direction: bearingToDirection(bearing),
      address: buildAddress(tags),
      phone: tags.phone || tags['contact:phone'] || null,
      website: tags.website || tags['contact:website'] || null,
      openingHours: tags.opening_hours || null,
      denomination: tags.denomination || null,
      wheelchair: tags.wheelchair || null,
    });
  }

  // Sort by distance (closest first)
  mosques.sort((a, b) => a.distance - b.distance);
  return mosques;
}

/**
 * Build a human-readable address from OSM tags.
 */
function buildAddress(tags) {
  const parts = [];
  if (tags['addr:housenumber']) parts.push(tags['addr:housenumber']);
  if (tags['addr:street']) parts.push(tags['addr:street']);
  if (tags['addr:suburb'] || tags['addr:neighbourhood']) {
    parts.push(tags['addr:suburb'] || tags['addr:neighbourhood']);
  }
  if (tags['addr:city']) parts.push(tags['addr:city']);
  if (tags['addr:postcode']) parts.push(tags['addr:postcode']);
  return parts.length > 0 ? parts.join(', ') : null;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Fetch nearby mosques from OpenStreetMap Overpass API.
 *
 * @param {number} latitude   - User's latitude
 * @param {number} longitude  - User's longitude
 * @param {number} radiusKm   - Search radius in kilometers (default 5)
 * @returns {Promise<Array>}  - Sorted array of mosque objects
 */
export async function getNearbyMosques(latitude, longitude, radiusKm = 5) {
  const radiusMeters = radiusKm * 1000;
  const query = buildOverpassQuery(latitude, longitude, radiusMeters);

  const response = await fetch(OVERPASS_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!response.ok) {
    throw new Error(`Overpass API error: ${response.status} ${response.statusText}`);
  }

  const json = await response.json();
  return parseOverpassResponse(json, latitude, longitude);
}

/**
 * Format a distance value for display.
 * @param {number} km - Distance in kilometres
 * @returns {string}
 */
export function formatDistance(km) {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
}

export default {
  getNearbyMosques,
  formatDistance,
};
