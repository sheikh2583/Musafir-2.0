/**
 * Islamic Calendar Service
 * Fetches real Hijri date and calendar events from Aladhan API
 */

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
      { text: 'Verily, with hardship comes ease.', ref: 'Quran 94:6' },
      { text: 'And He found you lost and guided [you].', ref: 'Quran 93:7' },
      { text: 'So remember Me; I will remember you.', ref: 'Quran 2:152' },
      { text: 'Allah does not burden a soul beyond that it can bear.', ref: 'Quran 2:286' },
      { text: 'And whoever puts their trust in Allah, He will be enough for them.', ref: 'Quran 65:3' },
      { text: 'Be patient. Indeed, Allah is with the patient.', ref: 'Quran 8:46' },
      { text: 'And speak to people good words.', ref: 'Quran 2:83' },
      { text: 'Indeed, prayer prohibits immorality and wrongdoing.', ref: 'Quran 29:45' },
    ];
    
    // Use day of year to get consistent daily quote
    const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
    return quotes[dayOfYear % quotes.length];
  }
}

export default new IslamicCalendarService();
