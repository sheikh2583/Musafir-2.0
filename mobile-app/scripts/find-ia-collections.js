/**
 * find-ia-collections.js
 * Discover valid Internet Archive collection IDs for Islamic lectures.
 */
const axios = require('axios');
const cheerio = require('cheerio');
const http = axios.create({ timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } });

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function tryDownloadPage(id) {
  try {
    const { data } = await http.get(`https://archive.org/download/${id}/`);
    const doc = cheerio.load(data);
    let mp3Count = 0;
    doc('a[href$=".mp3"]').each(() => { mp3Count++; });
    return mp3Count;
  } catch (e) {
    return -1;
  }
}

async function main() {
  // Known and guessed identifiers to check
  const candidates = [
    'MuftiMenk',
    'mufti-menk-lectures',
    'muftimenk-reminders',
    'NoomanAliKhan',
    'NoumanAliKhan',
    'nouman-ali-khan',
    'noumanali',
    'OmarSuleiman',
    'omar-suleiman-lectures',
    'omarsuleiman',
    'YasirQadhi',
    'yasir-qadhi-lectures',
    'yasirqadhi',
    'yasir-qadhi-seerah',
    'AhmedDeedat',
    'ahmed-deedat-lectures',
    'ahmeddeedat',
    'Sheikh_Ahmed_Deedat',
    'deedat',
    'ZakirNaik',
    'zakir-naik-lectures',
    'DrZakirNaik',
    'BilalPhilips',
    'bilal-philips',
    'DrBilalPhilips',
    'HamzaYusuf',
    'hamza-yusuf-lectures',
    'hamzayusuf',
    'KhalidYasin',
    'khalid-yasin',
    'YusufEstes',
    'yusuf-estes',
    'TariqJamil',
    'tariq-jameel',
    'maulana-tariq-jameel',
    'assimalhakeem',
    'assim-al-hakeem',
    'AbdulNasirJangda',
    'SulaimanMoola',
    'KamalElMekki',
    'TimimDarimi',
    'FridayKhutbah',
    'islamic_lectures_english',
    'islamiclectures_eng',
    'islamic-lectures-mp3',
    'islamlectures',
    'quran_tafsir_english',
    'seerah-of-prophet',
    'lives-of-the-prophets',
    'stories-of-the-prophets',
    'Muhammad_Al-Shareef',
    'AbdulRahmanGreen',
    'TariqJameel_Bayans',
    'MuftiMenk2',
    'muftimenk_lectures',
    'MuftiMenk_Reminders',
    'NoumanAliKhan_Quran',
    'NoumanAliKhan_Khutbah',
    'navaid-aziz',
    'islamicwaves.com',
    'perfect-muslim-husband',
    'stories-of-the-sahaba',
    'the-sealed-nectar',
    'riyad-us-saliheen-audio',
    'When_The_Moon_Split',
    'fortress-of-the-muslim-audio',
    'Bilal-Assad-Lectures',
    'Abu-Bakr-Zoud',
    'WissamSharief',
    'AbdulBary-Yahya',
    'SaidRageah',
    'PurposeOfLife_KhalidYasin',
    'ahmed_deedat_debates',
    'ZakirNaikDebates',
    'MuftiMenk_Boost',
  ];

  console.log('Checking', candidates.length, 'potential IA identifiers...\n');
  const valid = [];
  for (const id of candidates) {
    const count = await tryDownloadPage(id);
    if (count > 0) {
      console.log(`✅ ${id} → ${count} MP3s`);
      valid.push({ id, mp3Count: count });
    } else if (count === 0) {
      console.log(`⚠️  ${id} → page OK but 0 MP3s`);
    } else {
      console.log(`❌ ${id} → 404`);
    }
    await sleep(600);
  }

  console.log('\n\n=== VALID COLLECTIONS ===');
  valid.sort((a, b) => b.mp3Count - a.mp3Count);
  valid.forEach(v => console.log(`  { id: '${v.id}', mp3s: ${v.mp3Count} }`));
}

main().catch(console.error);
