/**
 * Islamic Calendar Service
 * Fetches real Hijri date and calendar events from Aladhan API
 */

import { Share, Platform } from 'react-native';

const ALADHAN_API = 'https://api.aladhan.com/v1';

// Islamic events with their significance and related content
const ISLAMIC_EVENTS = {
  '1-1': {
    name: 'Islamic New Year',
    nameAr: 'رأس السنة الهجرية',
    emoji: '🌙',
    type: 'holiday',
    importance: 'Marks the beginning of the Islamic lunar calendar and commemorates the Hijra (migration) of Prophet Muhammad ﷺ from Makkah to Madinah.',
    quranRef: { surah: 9, ayah: 40, text: 'If you do not aid him, Allah has already aided him...' },
  },
  '1-10': {
    name: 'Day of Ashura',
    nameAr: 'يوم عاشوراء',
    emoji: '📿',
    type: 'fasting',
    importance: 'A day of fasting. Prophet Musa (Moses) and his people were saved from Pharaoh on this day. Fasting expiates sins of the previous year.',
    quranRef: { surah: 26, ayah: 65, text: 'And We saved Moses and those with him, all together.' },
  },
  '3-12': {
    name: 'Mawlid an-Nabi',
    nameAr: 'المولد النبوي',
    emoji: '🕌',
    type: 'holiday',
    importance: 'Commemorates the birth of Prophet Muhammad ﷺ. A time to reflect on his life, teachings, and character.',
    quranRef: { surah: 21, ayah: 107, text: 'And We have not sent you except as a mercy to the worlds.' },
  },
  '7-27': {
    name: "Isra' and Mi'raj",
    nameAr: 'الإسراء والمعراج',
    emoji: '✨',
    type: 'holiday',
    importance: "The miraculous night journey of Prophet Muhammad ﷺ from Makkah to Jerusalem and ascension to the heavens. The five daily prayers were prescribed.",
    quranRef: { surah: 17, ayah: 1, text: 'Glory to Him who took His servant by night from al-Masjid al-Haram to al-Masjid al-Aqsa...' },
  },
  '8-15': {
    name: "Laylat al-Bara'ah",
    nameAr: 'ليلة البراءة',
    emoji: '🌟',
    type: 'special',
    importance: "The Night of Forgiveness. Allah descends to the lowest heaven and forgives those who seek forgiveness. A night of prayer and reflection.",
    quranRef: { surah: 44, ayah: 3, text: 'Indeed, We sent it down during a blessed night.' },
  },
  '9-1': {
    name: 'Ramadan Begins',
    nameAr: 'بداية رمضان',
    emoji: '🌙',
    type: 'ramadan',
    importance: 'The blessed month of fasting begins. The Quran was revealed in this month. Fasting is obligatory for all able Muslims.',
    quranRef: { surah: 2, ayah: 185, text: 'The month of Ramadan in which the Quran was revealed, a guidance for mankind...' },
  },
  '9-27': {
    name: 'Laylat al-Qadr',
    nameAr: 'ليلة القدر',
    emoji: '⭐',
    type: 'special',
    importance: 'The Night of Power - better than a thousand months. The night the Quran was first revealed. Worship on this night brings immense reward.',
    quranRef: { surah: 97, ayah: 3, text: 'The Night of Power is better than a thousand months.' },
  },
  '10-1': {
    name: 'Eid al-Fitr',
    nameAr: 'عيد الفطر',
    emoji: '🎉',
    type: 'eid',
    importance: 'The Festival of Breaking Fast. Celebrates the completion of Ramadan. A day of gratitude, prayer, charity (Zakat al-Fitr), and joy.',
    quranRef: { surah: 2, ayah: 185, text: '...and to glorify Allah for that to which He has guided you; perhaps you will be grateful.' },
  },
  '12-8': {
    name: 'Day of Tarwiyah',
    nameAr: 'يوم التروية',
    emoji: '🕋',
    type: 'hajj',
    importance: 'The first day of Hajj rituals. Pilgrims travel to Mina. A day of spiritual preparation.',
    quranRef: { surah: 22, ayah: 27, text: 'And proclaim to the people the Hajj; they will come to you on foot...' },
  },
  '12-9': {
    name: 'Day of Arafah',
    nameAr: 'يوم عرفة',
    emoji: '⛰️',
    type: 'fasting',
    importance: 'The best day of the year. Fasting expiates sins of the past and coming year. Pilgrims gather at Mount Arafat - the pinnacle of Hajj.',
    quranRef: { surah: 5, ayah: 3, text: 'This day I have perfected for you your religion and completed My favor upon you...' },
  },
  '12-10': {
    name: 'Eid al-Adha',
    nameAr: 'عيد الأضحى',
    emoji: '🐑',
    type: 'eid',
    importance: "The Festival of Sacrifice. Commemorates Prophet Ibrahim's willingness to sacrifice his son. A day of prayer, sacrifice, and sharing with others.",
    quranRef: { surah: 37, ayah: 107, text: 'And We ransomed him with a great sacrifice.' },
  },
};

// Hijri month names
const HIJRI_MONTHS = [
  'Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani',
  'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', "Sha'ban",
  'Ramadan', 'Shawwal', "Dhul Qi'dah", 'Dhul Hijjah'
];

const HIJRI_MONTHS_AR = [
  'محرم', 'صفر', 'ربيع الأول', 'ربيع الثاني',
  'جمادى الأولى', 'جمادى الآخرة', 'رجب', 'شعبان',
  'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'
];

class IslamicCalendarService {
  
  /**
   * Fetch current Hijri date from Aladhan API
   */
  async getHijriDateOnline() {
    try {
      const response = await fetch(`${ALADHAN_API}/gpiToH`);
      const data = await response.json();
      
      if (data.code === 200 && data.data) {
        const hijri = data.data.hijri;
        return {
          day: parseInt(hijri.day),
          month: parseInt(hijri.month.number),
          year: parseInt(hijri.year),
          monthName: hijri.month.en,
          monthNameAr: hijri.month.ar,
          dayName: hijri.weekday.en,
          dayNameAr: hijri.weekday.ar,
          formatted: `${hijri.day} ${hijri.month.en} ${hijri.year} AH`,
          formattedAr: `${hijri.day} ${hijri.month.ar} ${hijri.year}`,
        };
      }
    } catch (error) {
      console.log('Error fetching Hijri date online:', error.message);
    }
    
    // Fallback to local calculation
    return this.getHijriDateLocal();
  }

  /**
   * Local Hijri date calculation (fallback)
   */
  getHijriDateLocal() {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const day = today.getDate();
    
    // Julian Day calculation
    const a = Math.floor((14 - month) / 12);
    const y = year + 4800 - a;
    const m = month + 12 * a - 3;
    const jd = day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
    
    // Convert to Hijri
    const l = jd - 1948440 + 10632;
    const n = Math.floor((l - 1) / 10631);
    const remainder = l - 10631 * n + 354;
    const j = Math.floor((10985 - remainder) / 5316) * Math.floor((50 * remainder) / 17719) + Math.floor(remainder / 5670) * Math.floor((43 * remainder) / 15238);
    const adjustedRemainder = remainder - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) - Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
    const hijriMonth = Math.floor((24 * adjustedRemainder) / 709);
    const hijriDay = adjustedRemainder - Math.floor((709 * hijriMonth) / 24);
    const hijriYear = 30 * n + j - 30;

    return {
      day: hijriDay,
      month: hijriMonth,
      year: hijriYear,
      monthName: HIJRI_MONTHS[hijriMonth - 1] || '',
      monthNameAr: HIJRI_MONTHS_AR[hijriMonth - 1] || '',
      formatted: `${hijriDay} ${HIJRI_MONTHS[hijriMonth - 1] || ''} ${hijriYear} AH`,
      formattedAr: `${hijriDay} ${HIJRI_MONTHS_AR[hijriMonth - 1] || ''} ${hijriYear}`,
    };
  }

  /**
   * Calculate days between two Hijri dates
   */
  daysBetween(fromMonth, fromDay, toMonth, toDay) {
    const fromDayOfYear = (fromMonth - 1) * 30 + fromDay;
    let toDayOfYear = (toMonth - 1) * 30 + toDay;
    
    if (toDayOfYear <= fromDayOfYear) {
      toDayOfYear += 354; // Next year
    }
    
    return toDayOfYear - fromDayOfYear;
  }

  /**
   * Get upcoming Islamic events
   */
  async getUpcomingEvents(count = 3) {
    const hijri = await this.getHijriDateOnline();
    const events = [];

    for (const [key, event] of Object.entries(ISLAMIC_EVENTS)) {
      const [month, day] = key.split('-').map(Number);
      const daysUntil = this.daysBetween(hijri.month, hijri.day, month, day);
      
      events.push({
        ...event,
        month,
        day,
        daysUntil,
        hijriDate: `${day} ${HIJRI_MONTHS[month - 1]}`,
        hijriDateAr: `${day} ${HIJRI_MONTHS_AR[month - 1]}`,
      });
    }

    // Sort by days until and return top N
    return events
      .filter(e => e.daysUntil >= 0)
      .sort((a, b) => a.daysUntil - b.daysUntil)
      .slice(0, count);
  }

  /**
   * Check if today is a special event
   */
  async getTodayEvent() {
    const hijri = await this.getHijriDateOnline();
    const key = `${hijri.month}-${hijri.day}`;
    return ISLAMIC_EVENTS[key] || null;
  }

  /**
   * Get color for event type
   */
  getEventColor(type) {
    const colors = {
      'eid': '#4CAF50',
      'fasting': '#FF9800',
      'ramadan': '#9C27B0',
      'hajj': '#795548',
      'holiday': '#2196F3',
      'special': '#E91E63',
    };
    return colors[type] || '#666';
  }

  /**
   * Get daily inspirational content
   */
  getDailyQuote() {
    const quotes = [
      { text: 'Verily, with hardship comes ease.', ref: 'Quran 94:6', surah: 94, ayah: 6 },
      { text: 'And He found you lost and guided [you].', ref: 'Quran 93:7', surah: 93, ayah: 7 },
      { text: 'So remember Me; I will remember you.', ref: 'Quran 2:152', surah: 2, ayah: 152 },
      { text: 'Allah does not burden a soul beyond that it can bear.', ref: 'Quran 2:286', surah: 2, ayah: 286 },
      { text: 'And whoever puts their trust in Allah, He will be enough for them.', ref: 'Quran 65:3', surah: 65, ayah: 3 },
      { text: 'Be patient. Indeed, Allah is with the patient.', ref: 'Quran 8:46', surah: 8, ayah: 46 },
      { text: 'And speak to people good words.', ref: 'Quran 2:83', surah: 2, ayah: 83 },
      { text: 'Indeed, prayer prohibits immorality and wrongdoing.', ref: 'Quran 29:45', surah: 29, ayah: 45 },
      { text: 'And We have certainly made the Quran easy for remembrance, so is there any who will remember?', ref: 'Quran 54:17', surah: 54, ayah: 17 },
      { text: 'My mercy encompasses all things.', ref: 'Quran 7:156', surah: 7, ayah: 156 },
      { text: 'And whoever fears Allah, He will make for him a way out.', ref: 'Quran 65:2', surah: 65, ayah: 2 },
      { text: 'Indeed, the most noble of you in the sight of Allah is the most righteous of you.', ref: 'Quran 49:13', surah: 49, ayah: 13 },
    ];
    
    // Use day of year to get consistent daily quote
    const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
    return quotes[dayOfYear % quotes.length];
  }

  /**
   * Get daily hadith (local curated collection — no API call needed)
   */
  getDailyHadith() {
    const hadiths = [
      {
        text: 'The best among you are those who have the best manners and character.',
        narrator: 'Narrated by Abdullah ibn Amr',
        collection: 'Sahih al-Bukhari',
        number: 6029,
      },
      {
        text: 'None of you truly believes until he loves for his brother what he loves for himself.',
        narrator: 'Narrated by Anas ibn Malik',
        collection: 'Sahih al-Bukhari',
        number: 13,
      },
      {
        text: 'Actions are judged by intentions, and every person will get the reward according to what he has intended.',
        narrator: 'Narrated by Umar ibn al-Khattab',
        collection: 'Sahih al-Bukhari',
        number: 1,
      },
      {
        text: 'The strong man is not the one who can overpower others. Rather, the strong man is the one who controls himself when he is angry.',
        narrator: 'Narrated by Abu Hurairah',
        collection: 'Sahih al-Bukhari',
        number: 6114,
      },
      {
        text: 'Whoever believes in Allah and the Last Day, let him speak good or remain silent.',
        narrator: 'Narrated by Abu Hurairah',
        collection: 'Sahih al-Bukhari',
        number: 6018,
      },
      {
        text: 'The best of people are those who are most beneficial to people.',
        narrator: 'Narrated by Jabir',
        collection: 'al-Mu\'jam al-Awsat (Tabarani)',
        number: 5787,
      },
      {
        text: 'A Muslim is the one from whose tongue and hands the Muslims are safe.',
        narrator: 'Narrated by Abdullah ibn Amr',
        collection: 'Sahih al-Bukhari',
        number: 10,
      },
      {
        text: 'Do not be people without minds of your own, saying that if others treat you well you will treat them well and if they do wrong you will do wrong. But accustom yourselves to do good if people do good and not to do wrong if they do evil.',
        narrator: 'Narrated by Hudhayfah',
        collection: 'Jami` at-Tirmidhi',
        number: 2007,
      },
      {
        text: 'The best among you is the one who learns the Quran and teaches it.',
        narrator: 'Narrated by Uthman ibn Affan',
        collection: 'Sahih al-Bukhari',
        number: 5027,
      },
      {
        text: 'Make things easy and do not make them difficult, cheer people up and do not drive them away.',
        narrator: 'Narrated by Anas ibn Malik',
        collection: 'Sahih al-Bukhari',
        number: 6125,
      },
      {
        text: 'Whoever is kind, Allah will be kind to him; therefore be kind to man on the earth. He Who is in heaven will show mercy on you.',
        narrator: 'Narrated by Abdullah ibn Amr',
        collection: 'Sunan Abu Dawood',
        number: 4941,
      },
      {
        text: 'When a man dies, his deeds come to an end except for three things: ongoing charity, beneficial knowledge, or a righteous child who prays for him.',
        narrator: 'Narrated by Abu Hurairah',
        collection: 'Sahih Muslim',
        number: 1631,
      },
      {
        text: 'Smiling in the face of your brother is charity.',
        narrator: 'Narrated by Abu Dharr',
        collection: 'Jami` at-Tirmidhi',
        number: 1956,
      },
      {
        text: 'The most beloved deed to Allah is the most regular and constant even if it were little.',
        narrator: 'Narrated by Aisha',
        collection: 'Sahih al-Bukhari',
        number: 6464,
      },
      {
        text: 'Richness is not the abundance of wealth, rather it is self-sufficiency.',
        narrator: 'Narrated by Abu Hurairah',
        collection: 'Sahih al-Bukhari',
        number: 6446,
      },
      {
        text: 'He who eats his fill while his neighbor is hungry is not a believer.',
        narrator: 'Narrated by Ibn Abbas',
        collection: 'al-Sunan al-Kubra (Bayhaqi)',
        number: 19049,
      },
      {
        text: 'The best of charity is that given by one who has little.',
        narrator: 'Narrated by Abu Hurairah',
        collection: 'Sunan Abu Dawood',
        number: 1677,
      },
      {
        text: 'Whoever follows a path in pursuit of knowledge, Allah will make easy for him a path to Paradise.',
        narrator: 'Narrated by Abu Hurairah',
        collection: 'Sahih Muslim',
        number: 2699,
      },
      {
        text: 'Take advantage of five before five: your youth before your old age, your health before your illness, your wealth before your poverty, your free time before your busyness, and your life before your death.',
        narrator: 'Narrated by Ibn Abbas',
        collection: 'Musnad Ahmad',
        number: 681,
      },
      {
        text: 'Supplication (dua) is the essence of worship.',
        narrator: 'Narrated by Anas ibn Malik',
        collection: 'Jami` at-Tirmidhi',
        number: 3371,
      },
      {
        text: 'Verily Allah does not look at your appearance or wealth, but rather He looks at your hearts and actions.',
        narrator: 'Narrated by Abu Hurairah',
        collection: 'Sahih Muslim',
        number: 2564,
      },
      {
        text: 'The world is a prison for the believer and a paradise for the disbeliever.',
        narrator: 'Narrated by Abu Hurairah',
        collection: 'Sahih Muslim',
        number: 2956,
      },
      {
        text: 'Feed the hungry, visit the sick, and set free the captives.',
        narrator: 'Narrated by Abu Musa',
        collection: 'Sahih al-Bukhari',
        number: 5649,
      },
      {
        text: 'The believer is not stung from the same hole twice.',
        narrator: 'Narrated by Abu Hurairah',
        collection: 'Sahih al-Bukhari',
        number: 6133,
      },
      {
        text: 'Every Muslim has to give in charity. If he does not find anything to give, let him work with his hands. He can benefit himself and give in charity.',
        narrator: 'Narrated by Abu Hurairah',
        collection: 'Sahih al-Bukhari',
        number: 1445,
      },
      {
        text: 'Allah is gentle and loves gentleness. He gives for gentleness what He does not give for harshness.',
        narrator: 'Narrated by Aisha',
        collection: 'Sahih Muslim',
        number: 2593,
      },
      {
        text: 'The most perfect believer in faith is the best of them in character.',
        narrator: 'Narrated by Abu Hurairah',
        collection: 'Jami` at-Tirmidhi',
        number: 1162,
      },
      {
        text: 'Part of the perfection of a person\'s Islam is his leaving that which is of no concern to him.',
        narrator: 'Narrated by Abu Hurairah',
        collection: 'Jami` at-Tirmidhi',
        number: 2317,
      },
      {
        text: 'Whoever relieves the hardship of a believer in this world, Allah will relieve his hardship on the Day of Resurrection.',
        narrator: 'Narrated by Abu Hurairah',
        collection: 'Sahih Muslim',
        number: 2699,
      },
      {
        text: 'The best jihad is a word of truth before a tyrannical ruler.',
        narrator: 'Narrated by Abu Said al-Khudri',
        collection: 'Sunan Abu Dawood',
        number: 4344,
      },
    ];

    const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
    return hadiths[dayOfYear % hadiths.length];
  }

  /**
   * Share verse of the day
   */
  async shareQuranVerse(quote) {
    const message = `📖 Verse of the Day\n\n"${quote.text}"\n\n— ${quote.ref}\n\n🌙 Shared via Musafir App`;
    try {
      await Share.share({
        message,
        title: 'Verse of the Day — Musafir',
      });
    } catch (error) {
      console.log('Error sharing verse:', error);
    }
  }

  /**
   * Share hadith of the day
   */
  async shareHadith(hadith) {
    const message = `📿 Hadith of the Day\n\n"${hadith.text}"\n\n— ${hadith.narrator}\n📚 ${hadith.collection}, #${hadith.number}\n\n🌙 Shared via Musafir App`;
    try {
      await Share.share({
        message,
        title: 'Hadith of the Day — Musafir',
      });
    } catch (error) {
      console.log('Error sharing hadith:', error);
    }
  }

  /**
   * Share Islamic event details
   */
  async shareEvent(event) {
    let message = `${event.emoji} ${event.name}\n${event.nameAr || ''}\n\n${event.importance || ''}\n`;
    if (event.quranRef?.text) {
      message += `\n📖 "${event.quranRef.text}"\n— Quran ${event.quranRef.surah}:${event.quranRef.ayah}\n`;
    }
    if (event.dua) {
      message += `\n🤲 Dua:\n${event.dua}\n`;
    }
    message += `\n🌙 Shared via Musafir App`;
    try {
      await Share.share({
        message,
        title: `${event.name} — Musafir`,
      });
    } catch (error) {
      console.log('Error sharing event:', error);
    }
  }

  /**
   * Share the Musafir app
   */
  async shareApp() {
    const message = `🌙 Musafir — Your Complete Islamic Companion\n\n📖 Quran with Translation & Tafseer\n📿 Hadith from Sihah Sittah\n🕌 Prayer Times & Tracking\n🧭 Qibla Compass\n📅 Hijri Calendar\n🤖 AI Islamic Assistant\n\nDownload Musafir and strengthen your connection with the Deen!\n\nhttps://musafir.app`;
    try {
      await Share.share({
        message,
        title: 'Musafir — Islamic App',
      });
    } catch (error) {
      console.log('Error sharing app:', error);
    }
  }
}

export default new IslamicCalendarService();
