/**
 * DuaService.js
 * Clean Architecture data provider for the Dua & Adhkar module.
 * 
 * Responsibilities:
 *  - Lazy-load dua data from local JSON (not all 72+ in memory at once)
 *  - Provide category/subcategory/dua retrieval
 *  - Full-text search across titles, tags, translations
 *  - Favorites persistence via AsyncStorage
 *  - Counter state persistence per dua
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Storage Keys ──────────────────────────────────────────
const FAVORITES_KEY = '@dua_favorites';
const COUNTERS_KEY = '@dua_counters';

// ─── Lazy Data Loader ──────────────────────────────────────
// We keep a reference but only load once on first access
let _dataCache = null;

async function loadData() {
  if (_dataCache) return _dataCache;
  // Dynamic import keeps the 72+ duas out of the initial bundle
  const raw = require('../data/duas.json');
  _dataCache = raw;
  return _dataCache;
}

// ─── Category Methods ──────────────────────────────────────

/**
 * Get all categories (lightweight — no dua bodies loaded)
 */
async function getCategories() {
  const data = await loadData();
  return data.categories.map(cat => ({
    id: cat.id,
    name: cat.name,
    nameAr: cat.nameAr,
    icon: cat.icon,
    color: cat.color,
    description: cat.description,
    subcategoryCount: cat.subcategories.length,
    totalDuas: cat.subcategories.reduce((sum, sub) => sum + sub.duas.length, 0),
  }));
}

/**
 * Get subcategories for a given category ID
 */
async function getSubcategories(categoryId) {
  const data = await loadData();
  const cat = data.categories.find(c => c.id === categoryId);
  if (!cat) return [];
  return cat.subcategories.map(sub => ({
    id: sub.id,
    name: sub.name,
    nameAr: sub.nameAr,
    description: sub.description,
    icon: sub.icon,
    duaCount: sub.duas.length,
    categoryId: cat.id,
    categoryName: cat.name,
    categoryColor: cat.color,
  }));
}

/**
 * Get duas for a specific subcategory — this is where lazy loading happens.
 * Only the selected subcategory's duas are returned.
 * @param {string} categoryId
 * @param {string} subcategoryId
 * @param {number} page  - 0-indexed page
 * @param {number} pageSize - items per page (default 10)
 */
async function getDuas(categoryId, subcategoryId, page = 0, pageSize = 10) {
  const data = await loadData();
  const cat = data.categories.find(c => c.id === categoryId);
  if (!cat) return { duas: [], total: 0, hasMore: false };
  const sub = cat.subcategories.find(s => s.id === subcategoryId);
  if (!sub) return { duas: [], total: 0, hasMore: false };

  const start = page * pageSize;
  const end = start + pageSize;
  const paged = sub.duas.slice(start, end);

  return {
    duas: paged,
    total: sub.duas.length,
    hasMore: end < sub.duas.length,
    page,
    pageSize,
  };
}

/**
 * Get ALL duas for a subcategory (for small lists — used when count < 20)
 */
async function getAllDuasForSubcategory(categoryId, subcategoryId) {
  const data = await loadData();
  const cat = data.categories.find(c => c.id === categoryId);
  if (!cat) return [];
  const sub = cat.subcategories.find(s => s.id === subcategoryId);
  if (!sub) return [];
  return sub.duas;
}

/**
 * Get a single dua by its ID (searches all categories)
 */
async function getDuaById(duaId) {
  const data = await loadData();
  for (const cat of data.categories) {
    for (const sub of cat.subcategories) {
      const dua = sub.duas.find(d => d.id === duaId);
      if (dua) {
        return {
          ...dua,
          categoryId: cat.id,
          categoryName: cat.name,
          subcategoryId: sub.id,
          subcategoryName: sub.name,
        };
      }
    }
  }
  return null;
}

// ─── Search ────────────────────────────────────────────────

/**
 * Search across all duas by title, tags, translation, reference
 * @param {string} query – search text
 * @returns {Array} matching duas with category context
 */
async function searchDuas(query) {
  if (!query || query.trim().length < 2) return [];
  const data = await loadData();
  const q = query.toLowerCase().trim();
  const results = [];

  for (const cat of data.categories) {
    for (const sub of cat.subcategories) {
      for (const dua of sub.duas) {
        const searchable = [
          dua.title,
          dua.translation,
          dua.reference,
          dua.transliteration,
          ...(dua.tags || []),
          dua.virtue || '',
        ].join(' ').toLowerCase();

        if (searchable.includes(q)) {
          results.push({
            ...dua,
            categoryId: cat.id,
            categoryName: cat.name,
            categoryIcon: cat.icon,
            categoryColor: cat.color,
            subcategoryId: sub.id,
            subcategoryName: sub.name,
          });
        }
      }
    }
  }

  return results;
}

// ─── Favorites ─────────────────────────────────────────────

async function getFavorites() {
  try {
    const stored = await AsyncStorage.getItem(FAVORITES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

async function toggleFavorite(duaId) {
  const favorites = await getFavorites();
  const index = favorites.indexOf(duaId);
  if (index >= 0) {
    favorites.splice(index, 1);
  } else {
    favorites.push(duaId);
  }
  await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  return favorites;
}

async function isFavorite(duaId) {
  const favorites = await getFavorites();
  return favorites.includes(duaId);
}

/**
 * Get all favorited duas with full data
 */
async function getFavoriteDuas() {
  const favoriteIds = await getFavorites();
  if (favoriteIds.length === 0) return [];
  const data = await loadData();
  const results = [];

  for (const cat of data.categories) {
    for (const sub of cat.subcategories) {
      for (const dua of sub.duas) {
        if (favoriteIds.includes(dua.id)) {
          results.push({
            ...dua,
            categoryId: cat.id,
            categoryName: cat.name,
            subcategoryId: sub.id,
            subcategoryName: sub.name,
          });
        }
      }
    }
  }

  return results;
}

// ─── Counters ──────────────────────────────────────────────

async function getCounter(duaId) {
  try {
    const stored = await AsyncStorage.getItem(COUNTERS_KEY);
    const counters = stored ? JSON.parse(stored) : {};
    return counters[duaId] || 0;
  } catch {
    return 0;
  }
}

async function setCounter(duaId, count) {
  try {
    const stored = await AsyncStorage.getItem(COUNTERS_KEY);
    const counters = stored ? JSON.parse(stored) : {};
    counters[duaId] = count;
    await AsyncStorage.setItem(COUNTERS_KEY, JSON.stringify(counters));
    return count;
  } catch {
    return count;
  }
}

async function resetCounter(duaId) {
  return setCounter(duaId, 0);
}

async function resetAllCounters() {
  try {
    await AsyncStorage.removeItem(COUNTERS_KEY);
  } catch {
    // silent
  }
}

// ─── Metadata ──────────────────────────────────────────────

async function getMetadata() {
  const data = await loadData();
  return data.metadata;
}

async function getTotalDuaCount() {
  const data = await loadData();
  let total = 0;
  for (const cat of data.categories) {
    for (const sub of cat.subcategories) {
      total += sub.duas.length;
    }
  }
  return total;
}

// ─── Export ────────────────────────────────────────────────
const DuaService = {
  getCategories,
  getSubcategories,
  getDuas,
  getAllDuasForSubcategory,
  getDuaById,
  searchDuas,
  getFavorites,
  toggleFavorite,
  isFavorite,
  getFavoriteDuas,
  getCounter,
  setCounter,
  resetCounter,
  resetAllCounters,
  getMetadata,
  getTotalDuaCount,
};

export default DuaService;
