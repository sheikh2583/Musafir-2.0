import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

const SALAT_STORAGE_KEY = '@salat_tracking';
const STREAK_STORAGE_KEY = '@salat_streak';

// Prayer times (approximate - in real app, would use location-based calculation)
const PRAYER_TIMES = {
  fajr: { name: 'Fajr', nameAr: 'الفجر', startHour: 5, endHour: 6 },
  dhuhr: { name: 'Dhuhr', nameAr: 'الظهر', startHour: 12, endHour: 15 },
  asr: { name: 'Asr', nameAr: 'العصر', startHour: 15, endHour: 18 },
  maghrib: { name: 'Maghrib', nameAr: 'المغرب', startHour: 18, endHour: 19 },
  isha: { name: 'Isha', nameAr: 'العشاء', startHour: 19, endHour: 23 },
};

const PRAYER_ORDER = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

class SalatService {
  // Get today's date key
  getTodayKey() {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  }

  // Get yesterday's date key
  getYesterdayKey() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
  }


  // Get current prayer based on time
  getCurrentPrayer() {
    const now = new Date();
    const currentHour = now.getHours();

    for (const key of PRAYER_ORDER) {
      const prayer = PRAYER_TIMES[key];
      if (currentHour >= prayer.startHour && currentHour < prayer.endHour) {
        return { key, ...prayer };
      }
    }

    // If after isha or before fajr, return null (no current prayer window)
    return null;
  }

  // Get next prayer
  getNextPrayer() {
    const now = new Date();
    const currentHour = now.getHours();

    for (const key of PRAYER_ORDER) {
      const prayer = PRAYER_TIMES[key];
      if (currentHour < prayer.startHour) {
        return { key, ...prayer };
      }
    }

    // After isha, next is fajr tomorrow
    return { key: 'fajr', ...PRAYER_TIMES.fajr, tomorrow: true };
  }

  // Get all prayers with their status for today
  async getTodayPrayers() {
    const todayKey = this.getTodayKey();
    const data = await this.loadData();
    const todayData = data[todayKey] || {};
    const now = new Date();
    const currentHour = now.getHours();

    return PRAYER_ORDER.map(key => {
      const prayer = PRAYER_TIMES[key];
      const completed = todayData[key] || false;
      
      let status = 'upcoming';
      if (currentHour >= prayer.endHour) {
        status = completed ? 'completed' : 'missed';
      } else if (currentHour >= prayer.startHour) {
        status = completed ? 'completed' : 'pending';
      }

      return {
        key,
        ...prayer,
        completed,
        status,
      };
    });
  }

  // Mark a prayer as completed
  async markPrayerComplete(prayerKey) {
    const todayKey = this.getTodayKey();
    const data = await this.loadData();

    if (!data[todayKey]) {
      data[todayKey] = {};
    }

    data[todayKey][prayerKey] = true;
    await this.saveData(data);
    await this.updateStreak();

    // Sync with backend for global leaderboard
    try {
      await api.post('/salat/pray', { prayerKey, date: todayKey });
    } catch (error) {
      console.log('Backend sync failed (offline mode):', error.message);
    }

    return true;
  }

  // Unmark a prayer (skip)
  async unmarkPrayer(prayerKey) {
    const todayKey = this.getTodayKey();
    const data = await this.loadData();

    if (data[todayKey]) {
      data[todayKey][prayerKey] = false;
      await this.saveData(data);
      await this.updateStreak();
    }

    // Sync with backend - mark as skip
    try {
      await api.post('/salat/skip', { prayerKey, date: todayKey });
    } catch (error) {
      console.log('Backend sync failed (offline mode):', error.message);
    }

    return true;
  }

  // Calculate streak
  async updateStreak() {
    const data = await this.loadData();
    const todayKey = this.getTodayKey();
    
    let streak = 0;
    let checkDate = new Date();

    // Check if today is complete (all 5 prayers)
    const todayData = data[todayKey] || {};
    const todayComplete = PRAYER_ORDER.every(key => todayData[key]);

    if (!todayComplete) {
      // Check if all available prayers today are done
      const now = new Date();
      const currentHour = now.getHours();
      const availablePrayers = PRAYER_ORDER.filter(key => currentHour >= PRAYER_TIMES[key].endHour);
      const allAvailableDone = availablePrayers.every(key => todayData[key]);
      
      if (!allAvailableDone && availablePrayers.length > 0) {
        // Streak broken - missed a prayer today
        await this.saveStreak(0);
        return 0;
      }
    }

    // Count backwards from yesterday
    checkDate.setDate(checkDate.getDate() - 1);
    
    while (true) {
      const dateKey = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
      const dayData = data[dateKey];

      if (!dayData || !PRAYER_ORDER.every(key => dayData[key])) {
        break;
      }

      streak++;
      checkDate.setDate(checkDate.getDate() - 1);

      // Limit check to 365 days
      if (streak >= 365) break;
    }

    // Add today if all prayers done
    if (todayComplete) {
      streak++;
    }

    await this.saveStreak(streak);
    return streak;
  }

  // Get current streak
  async getStreak() {
    try {
      const streak = await AsyncStorage.getItem(STREAK_STORAGE_KEY);
      return streak ? parseInt(streak) : 0;
    } catch {
      return 0;
    }
  }

  // Save streak
  async saveStreak(streak) {
    try {
      await AsyncStorage.setItem(STREAK_STORAGE_KEY, String(streak));
    } catch (error) {
      console.error('Error saving streak:', error);
    }
  }

  // Get today's completion count
  async getTodayStats() {
    const todayKey = this.getTodayKey();
    const data = await this.loadData();
    const todayData = data[todayKey] || {};

    const completed = PRAYER_ORDER.filter(key => todayData[key]).length;
    return {
      completed,
      total: 5,
      percentage: Math.round((completed / 5) * 100),
    };
  }

  // Load all data
  async loadData() {
    try {
      const data = await AsyncStorage.getItem(SALAT_STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  // Save all data
  async saveData(data) {
    try {
      await AsyncStorage.setItem(SALAT_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving salat data:', error);
    }
  }

  // Get Hijri date (approximate calculation)
  getHijriDate() {
    const today = new Date();
    
    // Islamic calendar epoch (July 16, 622 CE Julian / July 19, 622 CE Gregorian)
    const hijriEpoch = new Date(622, 6, 19);
    
    // Days since Hijri epoch
    const daysSinceEpoch = Math.floor((today - hijriEpoch) / (1000 * 60 * 60 * 24));
    
    // Average days in Islamic lunar month: 29.530588853
    // Average days in Islamic year: 354.36667
    const lunarYear = 354.36667;
    const lunarMonth = 29.530588853;
    
    let hijriYear = Math.floor(daysSinceEpoch / lunarYear) + 1;
    let remainingDays = daysSinceEpoch % lunarYear;
    let hijriMonth = Math.floor(remainingDays / lunarMonth) + 1;
    let hijriDay = Math.floor(remainingDays % lunarMonth) + 1;

    // Adjust for accuracy (this is approximate)
    if (hijriMonth > 12) {
      hijriMonth = 12;
    }
    if (hijriDay > 30) {
      hijriDay = 30;
    }

    const hijriMonths = [
      'Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani',
      'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', 'Sha\'ban',
      'Ramadan', 'Shawwal', 'Dhu al-Qi\'dah', 'Dhu al-Hijjah'
    ];

    const hijriMonthsAr = [
      'محرم', 'صفر', 'ربيع الأول', 'ربيع الثاني',
      'جمادى الأولى', 'جمادى الثانية', 'رجب', 'شعبان',
      'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'
    ];

    return {
      day: hijriDay,
      month: hijriMonth,
      year: hijriYear,
      monthName: hijriMonths[hijriMonth - 1],
      monthNameAr: hijriMonthsAr[hijriMonth - 1],
      formatted: `${hijriDay} ${hijriMonths[hijriMonth - 1]} ${hijriYear} AH`,
      formattedAr: `${hijriDay} ${hijriMonthsAr[hijriMonth - 1]} ${hijriYear} هـ`,
    };
  }

  // Get global leaderboard
  async getLeaderboard(type = 'weekly') {
    try {
      const response = await api.get(`/salat/leaderboard?type=${type}`);
      return response.data.leaderboard || [];
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      return [];
    }
  }

  // Get user's score and rank
  async getMyScore() {
    try {
      const response = await api.get('/salat/score');
      return response.data;
    } catch (error) {
      console.error('Error fetching score:', error);
      return {
        weeklyScore: 0,
        bestWeeklyScore: 0,
        currentMultiplier: 1,
        weeklyPrayerCount: 0,
        totalPrayers: 0,
        rank: null
      };
    }
  }
}

export default new SalatService();
