/**
 * LectureService.js
 * ─────────────────────────────────────────
 * Clean data provider for Islamic lectures.
 * Lazy-loads from pre-ingested lectures.json.
 * Provides: speakers, lectures, search, favorites, recently played.
 * Zero runtime API calls.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVORITES_KEY = '@lecture_favorites';
const RECENT_KEY = '@lecture_recent';
const MAX_RECENT = 20;

let _cache = null;

function getData() {
  if (!_cache) {
    _cache = require('../data/lectures.json');
  }
  return _cache;
}

// ─── Speakers ──────────────────────────────────

/**
 * Get all speakers sorted by lecture count (descending).
 */
function getSpeakers() {
  const { speakers } = getData();
  return speakers.map(s => ({
    ...s,
    initial: s.name.charAt(0).toUpperCase(),
  }));
}

/**
 * Get a single speaker by ID.
 */
function getSpeaker(speakerId) {
  const { speakers } = getData();
  return speakers.find(s => s.id === speakerId) || null;
}

// ─── Lectures ──────────────────────────────────

/**
 * Get lectures for a speaker, optionally filtered by category.
 * Supports pagination.
 */
function getLectures(speakerId, { category = null, page = 1, pageSize = 20 } = {}) {
  const { lectures } = getData();
  let filtered = lectures.filter(l => l.speakerId === speakerId);
  if (category) {
    filtered = filtered.filter(l => l.category === category);
  }
  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const paged = filtered.slice(start, start + pageSize);
  return {
    lectures: paged,
    total,
    page,
    hasMore: start + pageSize < total,
  };
}

/**
 * Get all lectures for a speaker (no pagination).
 */
function getAllLectures(speakerId) {
  const { lectures } = getData();
  return lectures.filter(l => l.speakerId === speakerId);
}

/**
 * Get a single lecture by ID.
 */
function getLecture(lectureId) {
  const { lectures } = getData();
  return lectures.find(l => l.id === lectureId) || null;
}

/**
 * Get all available categories.
 */
function getCategories() {
  const { categories } = getData();
  return categories || [];
}

/**
 * Get categories available for a specific speaker.
 */
function getSpeakerCategories(speakerId) {
  const { lectures } = getData();
  const cats = new Set();
  lectures.forEach(l => {
    if (l.speakerId === speakerId) cats.add(l.category);
  });
  return [...cats].sort();
}

// ─── Search ────────────────────────────────────

/**
 * Full-text search across titles, speakers, and categories.
 */
function searchLectures(query, limit = 30) {
  if (!query || query.trim().length < 2) return [];
  const { lectures } = getData();
  const q = query.toLowerCase().trim();
  const words = q.split(/\s+/);

  return lectures
    .filter(l => {
      const haystack = `${l.title} ${l.speaker} ${l.category}`.toLowerCase();
      return words.every(w => haystack.includes(w));
    })
    .slice(0, limit);
}

// ─── Favorites ─────────────────────────────────

async function getFavoriteIds() {
  try {
    const raw = await AsyncStorage.getItem(FAVORITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

async function toggleFavorite(lectureId) {
  const ids = await getFavoriteIds();
  const idx = ids.indexOf(lectureId);
  if (idx >= 0) {
    ids.splice(idx, 1);
  } else {
    ids.push(lectureId);
  }
  await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
  return idx < 0; // returns true if now favorited
}

async function isFavorite(lectureId) {
  const ids = await getFavoriteIds();
  return ids.includes(lectureId);
}

async function getFavoriteLectures() {
  const ids = await getFavoriteIds();
  const { lectures } = getData();
  const idSet = new Set(ids);
  return lectures.filter(l => idSet.has(l.id));
}

async function getFavoriteCount() {
  const ids = await getFavoriteIds();
  return ids.length;
}

// ─── Recently Played ──────────────────────────

async function addToRecent(lectureId) {
  try {
    const raw = await AsyncStorage.getItem(RECENT_KEY);
    let recent = raw ? JSON.parse(raw) : [];
    recent = recent.filter(id => id !== lectureId);
    recent.unshift(lectureId);
    recent = recent.slice(0, MAX_RECENT);
    await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(recent));
  } catch {}
}

async function getRecentLectures() {
  try {
    const raw = await AsyncStorage.getItem(RECENT_KEY);
    const ids = raw ? JSON.parse(raw) : [];
    const { lectures } = getData();
    const idMap = {};
    lectures.forEach(l => { idMap[l.id] = l; });
    return ids.map(id => idMap[id]).filter(Boolean);
  } catch { return []; }
}

// ─── Metadata ──────────────────────────────────

function getMetadata() {
  const { metadata } = getData();
  return metadata;
}

export default {
  getSpeakers,
  getSpeaker,
  getLectures,
  getAllLectures,
  getLecture,
  getCategories,
  getSpeakerCategories,
  searchLectures,
  getFavoriteIds,
  toggleFavorite,
  isFavorite,
  getFavoriteLectures,
  getFavoriteCount,
  addToRecent,
  getRecentLectures,
  getMetadata,
};
