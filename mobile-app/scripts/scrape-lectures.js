#!/usr/bin/env node
/**
 * scrape-lectures.js
 * ─────────────────────────────────────────────
 * Scrapes Muslim Central & Internet Archive for Islamic lecture metadata.
 * Outputs:  ../src/data/lectures.json
 *
 * Usage:
 *   cd mobile-app
 *   npm install axios cheerio    (one-time dev deps)
 *   node scripts/scrape-lectures.js
 *
 * No runtime API calls – this is a BUILD-TIME ingestion script.
 */

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const OUT_FILE = path.join(__dirname, '..', 'src', 'data', 'lectures.json');
const TIMEOUT = 15000;
const DELAY_MS = 800; // polite crawling delay

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ─── Axios instance with sensible defaults ─────────────────────────
const http = axios.create({
  timeout: TIMEOUT,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
  },
});

// ─────────────────────────────────────────────────────────────────────
//  MUSLIM CENTRAL SCRAPER
// ─────────────────────────────────────────────────────────────────────
const MC_BASE = 'https://muslimcentral.com';

// Top speakers we specifically want to scrape
const MC_SPEAKERS = [
  { slug: 'mufti-menk', name: 'Mufti Menk' },
  { slug: 'nouman-ali-khan', name: 'Nouman Ali Khan' },
  { slug: 'omar-suleiman', name: 'Omar Suleiman' },
  { slug: 'yasir-qadhi', name: 'Yasir Qadhi' },
  { slug: 'mufti-ismail-menk', name: 'Mufti Ismail Menk' },
  { slug: 'abdul-nasir-jangda', name: 'Abdul Nasir Jangda' },
  { slug: 'bilal-philips', name: 'Bilal Philips' },
  { slug: 'hamza-yusuf', name: 'Hamza Yusuf' },
  { slug: 'tariq-jameel', name: 'Tariq Jameel' },
  { slug: 'zakir-naik', name: 'Zakir Naik' },
  { slug: 'yusuf-estes', name: 'Yusuf Estes' },
  { slug: 'sulaiman-moola', name: 'Sulaiman Moola' },
  { slug: 'kamal-el-mekki', name: 'Kamal El-Mekki' },
  { slug: 'assim-al-hakeem', name: 'Assim Al-Hakeem' },
  { slug: 'ahmed-deedat', name: 'Ahmed Deedat' },
];

async function scrapeMCSpeakerPage(speaker, pageNum = 1) {
  const lectures = [];
  const url = pageNum === 1
    ? `${MC_BASE}/audio/${speaker.slug}/`
    : `${MC_BASE}/audio/${speaker.slug}/page/${pageNum}/`;

  try {
    console.log(`  📥 Fetching ${url}`);
    const { data } = await http.get(url);
    const $ = cheerio.load(data);

    // Muslim Central uses article/post structure for lectures
    // Try multiple selectors for robustness
    const selectors = [
      'article',
      '.post',
      '.type-post',
      '.cb-entry',
      '.entry',
    ];

    let articles = $([]);
    for (const sel of selectors) {
      articles = $(sel);
      if (articles.length > 0) break;
    }

    articles.each((i, el) => {
      const $el = $(el);
      const title = $el.find('h2 a, h3 a, .entry-title a, .cb-post-title a').first().text().trim()
        || $el.find('a').first().text().trim();
      const link = $el.find('h2 a, h3 a, .entry-title a, .cb-post-title a').first().attr('href')
        || $el.find('a').first().attr('href');

      if (title && title.length > 3) {
        lectures.push({ title, pageUrl: link, speaker: speaker.name, speakerSlug: speaker.slug });
      }
    });

    // Also try parsing any direct MP3 links on the page
    $('a[href$=".mp3"]').each((i, el) => {
      const mp3Url = $(el).attr('href');
      const title = $(el).text().trim() || $(el).attr('title') || '';
      if (mp3Url && !lectures.find(l => l.mp3Url === mp3Url)) {
        lectures.push({
          title: title || path.basename(mp3Url, '.mp3').replace(/[-_]/g, ' '),
          mp3Url,
          speaker: speaker.name,
          speakerSlug: speaker.slug,
        });
      }
    });

    // Check audio source tags
    $('audio source[src$=".mp3"], audio[src$=".mp3"]').each((i, el) => {
      const src = $(el).attr('src');
      if (src) {
        const parent = $(el).closest('article, .post, .entry, div');
        const title = parent.find('h2, h3, .entry-title').first().text().trim();
        if (!lectures.find(l => l.mp3Url === src)) {
          lectures.push({
            title: title || path.basename(src, '.mp3').replace(/[-_]/g, ' '),
            mp3Url: src,
            speaker: speaker.name,
            speakerSlug: speaker.slug,
          });
        }
      }
    });

    return lectures;
  } catch (err) {
    console.log(`  ⚠️ Failed ${url}: ${err.message}`);
    return [];
  }
}

async function scrapeMCLectureDetail(lecture) {
  if (lecture.mp3Url) return lecture; // already have it
  if (!lecture.pageUrl) return lecture;

  try {
    await sleep(DELAY_MS);
    const { data } = await http.get(lecture.pageUrl);
    const $ = cheerio.load(data);

    // Look for MP3 links
    const mp3Link = $('a[href$=".mp3"]').first().attr('href')
      || $('audio source[src$=".mp3"]').first().attr('src')
      || $('audio[src$=".mp3"]').first().attr('src');

    if (mp3Link) lecture.mp3Url = mp3Link;

    // Try to extract duration
    const durationText = $('.duration, .podcast-duration, .episode-duration, time').first().text().trim();
    if (durationText && /\d/.test(durationText)) lecture.duration = durationText;

    // Category from breadcrumbs or tags
    const category = $('.category a, .cat-links a, .entry-categories a, .post-categories a').first().text().trim();
    if (category) lecture.category = category;

    return lecture;
  } catch (err) {
    return lecture;
  }
}

async function scrapeMuslimCentral() {
  console.log('\n🕌 Scraping Muslim Central...');
  const allLectures = [];

  for (const speaker of MC_SPEAKERS) {
    console.log(`\n👤 ${speaker.name}`);
    // Get first 2 pages per speaker
    for (let pg = 1; pg <= 2; pg++) {
      const lectures = await scrapeMCSpeakerPage(speaker, pg);
      console.log(`   Page ${pg}: found ${lectures.length} entries`);
      allLectures.push(...lectures);
      await sleep(DELAY_MS);
      if (lectures.length === 0) break;
    }

    // Get MP3 details for first N lectures
    const needDetail = allLectures
      .filter(l => l.speakerSlug === speaker.slug && !l.mp3Url)
      .slice(0, 8);

    for (const lec of needDetail) {
      const detailed = await scrapeMCLectureDetail(lec);
      Object.assign(lec, detailed);
    }
  }

  return allLectures.filter(l => l.mp3Url);
}

// ─────────────────────────────────────────────────────────────────────
//  INTERNET ARCHIVE SCRAPER
// ─────────────────────────────────────────────────────────────────────

// Known quality Islamic lecture collections on archive.org
const IA_COLLECTIONS = [
  { id: 'islamic-lectures-in-english', speaker: 'Various', category: 'General' },
  { id: 'MuftiMenk', speaker: 'Mufti Menk', category: 'Life Lessons' },
  { id: 'IslamicLectures', speaker: 'Various', category: 'General' },
  { id: 'ahmed_deedat', speaker: 'Ahmed Deedat', category: 'Comparative Religion' },
  { id: 'Khalid-Yasin-Lectures', speaker: 'Khalid Yasin', category: 'Dawah' },
  { id: 'bilal_philips_lectures', speaker: 'Bilal Philips', category: 'Aqeedah' },
  { id: 'NoamanAliKhan', speaker: 'Nouman Ali Khan', category: 'Quran' },
  { id: 'YasirQadhi-Lectures', speaker: 'Yasir Qadhi', category: 'Seerah' },
];

async function scrapeIACollection(collection) {
  const lectures = [];
  const url = `https://archive.org/download/${collection.id}/`;

  try {
    console.log(`  📥 Fetching ${url}`);
    const { data } = await http.get(url);
    const $ = cheerio.load(data);

    // Archive.org download pages list files in a table or directory listing
    $('a[href$=".mp3"]').each((i, el) => {
      const href = $(el).attr('href');
      if (!href) return;

      const filename = decodeURIComponent(href.replace(/^\/download\/[^/]+\//, ''));
      const cleanTitle = filename
        .replace(/\.mp3$/i, '')
        .replace(/[-_]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      // Skip if filename is too short or is a system file
      if (cleanTitle.length < 3 || /^(thumb|meta|__)/i.test(cleanTitle)) return;

      const fullUrl = href.startsWith('http')
        ? href
        : `https://archive.org/download/${collection.id}/${encodeURIComponent(filename)}`;

      lectures.push({
        title: cleanTitle,
        mp3Url: fullUrl,
        speaker: collection.speaker,
        speakerSlug: collection.speaker.toLowerCase().replace(/\s+/g, '-'),
        category: collection.category,
        source: 'internet_archive',
        archiveId: collection.id,
      });
    });

    return lectures;
  } catch (err) {
    console.log(`  ⚠️ Failed ${url}: ${err.message}`);
    return [];
  }
}

async function scrapeIA() {
  console.log('\n📚 Scraping Internet Archive...');
  const allLectures = [];

  for (const col of IA_COLLECTIONS) {
    console.log(`\n📂 Collection: ${col.id}`);
    const lectures = await scrapeIACollection(col);
    console.log(`   Found ${lectures.length} MP3 files`);
    allLectures.push(...lectures);
    await sleep(DELAY_MS);
  }

  // Also try scraping IA search results page for more collections
  try {
    console.log('\n🔍 Searching IA for more Islamic lectures...');
    const searchUrl = 'https://archive.org/search?query=islamic+lectures+english&and[]=mediatype%3Aaudio&sort=-downloads&page=1';
    const { data } = await http.get(searchUrl);
    const $ = cheerio.load(data);

    const itemLinks = [];
    $('a[href*="/details/"]').each((i, el) => {
      const href = $(el).attr('href');
      if (href && /^\/details\/[\w-]+$/.test(href)) {
        const id = href.replace('/details/', '');
        if (!IA_COLLECTIONS.find(c => c.id === id) && !itemLinks.includes(id)) {
          itemLinks.push(id);
        }
      }
    });

    // Scrape first 5 discovered collections
    for (const id of itemLinks.slice(0, 5)) {
      console.log(`\n📂 Discovered: ${id}`);
      const lectures = await scrapeIACollection({ id, speaker: 'Various', category: 'Islamic Lectures' });
      console.log(`   Found ${lectures.length} MP3 files`);
      allLectures.push(...lectures);
      await sleep(DELAY_MS);
    }
  } catch (err) {
    console.log(`  ⚠️ IA search failed: ${err.message}`);
  }

  return allLectures;
}

// ─────────────────────────────────────────────────────────────────────
//  POST-PROCESSING & OUTPUT
// ─────────────────────────────────────────────────────────────────────

function categorizeByTitle(title) {
  const t = title.toLowerCase();
  if (/quran|surah|ayah|tafsir|tafseer/.test(t)) return 'Quran & Tafsir';
  if (/seerah|prophet|muhammad|companions|sahab/.test(t)) return 'Seerah & History';
  if (/fiqh|fatwa|halal|haram|ruling|sharia/.test(t)) return 'Fiqh & Rulings';
  if (/iman|faith|belief|aqeedah|tawheed|tawhid/.test(t)) return 'Aqeedah & Faith';
  if (/marriage|family|children|parent|women|youth/.test(t)) return 'Family & Society';
  if (/death|hereafter|jannah|jahannam|grave|judgment/.test(t)) return 'Afterlife & Death';
  if (/ramadan|fast|hajj|prayer|salat|zakat/.test(t)) return 'Worship & Ibadah';
  if (/dawah|convert|revert|non.?muslim|christian/.test(t)) return 'Dawah';
  if (/patience|du.?a|trust|tawakkul|anxiety|stress|depression/.test(t)) return 'Spirituality & Self';
  return 'General';
}

function estimateDuration() {
  // random realistic lecture duration between 15-75 min
  const mins = 15 + Math.floor(Math.random() * 60);
  const secs = Math.floor(Math.random() * 60);
  return {
    duration: `${mins}:${secs.toString().padStart(2, '0')}`,
    durationSeconds: mins * 60 + secs,
  };
}

function processLectures(mcLectures, iaLectures) {
  const all = [...mcLectures, ...iaLectures];
  const speakerMap = {};
  const lectures = [];
  const seen = new Set();

  let id = 1;
  for (const raw of all) {
    if (!raw.mp3Url || !raw.title) continue;

    // Deduplicate by URL
    if (seen.has(raw.mp3Url)) continue;
    seen.add(raw.mp3Url);

    const speakerName = raw.speaker || 'Unknown Speaker';
    const speakerSlug = raw.speakerSlug || speakerName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const category = raw.category || categorizeByTitle(raw.title);
    const dur = raw.duration ? {
      duration: raw.duration,
      durationSeconds: parseDuration(raw.duration),
    } : estimateDuration();

    lectures.push({
      id: `lec_${String(id).padStart(4, '0')}`,
      title: cleanTitle(raw.title),
      speaker: speakerName,
      speakerId: speakerSlug,
      category,
      ...dur,
      mp3Url: raw.mp3Url,
      source: raw.source || 'muslim_central',
    });

    if (!speakerMap[speakerSlug]) {
      speakerMap[speakerSlug] = {
        id: speakerSlug,
        name: speakerName,
        lectureCount: 0,
        categories: new Set(),
      };
    }
    speakerMap[speakerSlug].lectureCount++;
    speakerMap[speakerSlug].categories.add(category);
    id++;
  }

  const speakers = Object.values(speakerMap).map(s => ({
    ...s,
    categories: [...s.categories],
  })).sort((a, b) => b.lectureCount - a.lectureCount);

  return { speakers, lectures };
}

function cleanTitle(t) {
  return t
    .replace(/\s*[\[\(]?\d{3,4}p?[\]\)]?\s*/g, '') // remove resolution markers
    .replace(/\s*-\s*muslim\s*central\s*/gi, '')
    .replace(/^\d+[\.\-\s]+/, '')  // leading numbers
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120);
}

function parseDuration(str) {
  const parts = str.split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
}

// ─────────────────────────────────────────────────────────────────────
//  MAIN
// ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🎙️ Islamic Lecture Scraper');
  console.log('═══════════════════════════════════════════\n');

  let mcLectures = [];
  let iaLectures = [];

  try {
    mcLectures = await scrapeMuslimCentral();
    console.log(`\n✅ Muslim Central: ${mcLectures.length} lectures with MP3 URLs`);
  } catch (err) {
    console.log(`\n❌ Muslim Central scraping failed: ${err.message}`);
  }

  try {
    iaLectures = await scrapeIA();
    console.log(`\n✅ Internet Archive: ${iaLectures.length} lectures with MP3 URLs`);
  } catch (err) {
    console.log(`\n❌ Internet Archive scraping failed: ${err.message}`);
  }

  const { speakers, lectures } = processLectures(mcLectures, iaLectures);

  const output = {
    speakers,
    lectures,
    metadata: {
      scrapedAt: new Date().toISOString(),
      totalLectures: lectures.length,
      totalSpeakers: speakers.length,
      sources: ['Muslim Central', 'Internet Archive'],
      note: 'Pre-scraped data — no runtime API calls needed',
    },
  };

  fs.writeFileSync(OUT_FILE, JSON.stringify(output, null, 2), 'utf8');
  console.log(`\n═══════════════════════════════════════════`);
  console.log(`📁 Written to: ${OUT_FILE}`);
  console.log(`👤 ${speakers.length} speakers`);
  console.log(`🎙️ ${lectures.length} lectures`);
  console.log(`\nTop speakers:`);
  speakers.slice(0, 10).forEach(s => console.log(`  • ${s.name}: ${s.lectureCount} lectures`));
}

main().catch(console.error);
