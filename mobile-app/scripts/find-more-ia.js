/**
 * find-more-ia.js — Use IA's advanced search to find more Islamic lecture items.
 */
const axios = require('axios');
const cheerio = require('cheerio');
const http = axios.create({ timeout: 20000, headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } });
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function tryDownloadPage(id) {
  try {
    const { data } = await http.get(`https://archive.org/download/${id}/`);
    const doc = cheerio.load(data);
    let mp3Count = 0;
    doc('a[href$=".mp3"]').each(() => { mp3Count++; });
    return mp3Count;
  } catch (e) { return -1; }
}

async function searchAdvanced(query) {
  // Use IA advanced search scraping
  const url = `https://archive.org/search?query=${encodeURIComponent(query)}&and[]=mediatype%3Aaudio&sort=-downloads`;
  try {
    const { data } = await http.get(url);
    const doc = cheerio.load(data);
    const ids = [];
    doc('.item-ia').each((i, elem) => {
      const dataId = doc(elem).attr('data-id');
      if (dataId) ids.push(dataId);
    });
    // Fallback: parse links
    if (ids.length === 0) {
      doc('a').each((i, elem) => {
        const href = doc(elem).attr('href');
        if (href && /^\/details\/([\w._-]+)$/.test(href)) {
          const id = href.replace('/details/', '');
          if (!ids.includes(id) && id.length > 2 && !/^(about|donate|search|create|terms)/.test(id)) {
            ids.push(id);
          }
        }
      });
    }
    return ids;
  } catch (e) {
    console.log(`  Search failed: ${e.message}`);
    return [];
  }
}

async function main() {
  const known = new Set(['MuftiMenk','assim-al-hakeem','lives-of-the-prophets','DrBilalPhilips','YasirQadhi','TariqJamil','FridayKhutbah']);

  const queries = [
    'islamic lectures english mp3',
    'quran tafsir english audio',
    'nouman ali khan',
    'omar suleiman',
    'hamza yusuf',
    'zakir naik debate',
    'ahmed deedat mp3',
    'khalid yasin purpose life',
    'islamic khutbah english',
    'muslim lecture audio',
    'mufti menk',
    'suhaib webb',
    'abdal hakim murad',
    'yusuf estes islam',
    'siraj wahhaj',
    'muhammad al shareef discover u',
  ];

  const allIds = new Set();
  for (const q of queries) {
    console.log(`\n🔍 "${q}"`);
    const ids = await searchAdvanced(q);
    console.log(`   Found ${ids.length} items: ${ids.slice(0, 5).join(', ')}${ids.length > 5 ? '...' : ''}`);
    ids.forEach(id => allIds.add(id));
    await sleep(1000);
  }

  // Filter out already known, then check each for MP3 count
  const toCheck = [...allIds].filter(id => !known.has(id));
  console.log(`\n\nChecking ${toCheck.length} new identifiers...\n`);

  const valid = [];
  for (const id of toCheck) {
    const count = await tryDownloadPage(id);
    if (count > 0) {
      console.log(`✅ ${id} → ${count} MP3s`);
      valid.push({ id, mp3Count: count });
    }
    await sleep(400);
  }

  console.log('\n=== NEW VALID COLLECTIONS ===');
  valid.sort((a, b) => b.mp3Count - a.mp3Count);
  valid.forEach(v => console.log(`  { id: '${v.id}', mp3s: ${v.mp3Count} }`));
  console.log(`\nTotal new: ${valid.length} collections, ${valid.reduce((s, v) => s + v.mp3Count, 0)} MP3s`);
}

main().catch(console.error);
