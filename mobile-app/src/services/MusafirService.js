/**
 * MusafirService — Hanafi Travel (Qasr) Prayer System + Ramadan Sehri/Iftar
 *
 * Hanafi Madhab rules:
 *  • A traveller (musafir) is one who intends to travel ≥ 48 miles (~77.25 km)
 *    from their home/city boundary.
 *  • If they intend to stay at the destination < 15 days → musafir status.
 *  • Qasr: Zuhr, Asr, Isha are shortened from 4 → 2 fard rakats.
 *    Fajr (2) and Maghrib (3) remain unchanged.
 *
 * Prayer time calculation uses standard solar-position algorithm
 * (no external API). Angles follow Hanafi / MWL convention.
 *
 * Sehri = Fajr athan time (end of suhoor)
 * Iftar  = Maghrib athan time (sunset)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

// ─── Storage Keys ────────────────────────────────────────────
const HOME_LOCATION_KEY = '@musafir_home_location';
const TRAVEL_STATUS_KEY = '@musafir_travel_status';

// ─── Hanafi Constants ────────────────────────────────────────
const HANAFI_TRAVEL_DISTANCE_KM = 77.25; // ~48 miles
const MUSAFIR_MAX_STAY_DAYS = 15;

// ─── Calculation Angles ──────────────────────────────────────
const FAJR_ANGLE = 18; // degrees below horizon (MWL / commonly used for Hanafi)
const ISHA_ANGLE = 17; // degrees below horizon
const ASR_SHADOW_RATIO = 2; // Hanafi: shadow = object + 2× object length

// ─── Math Helpers ────────────────────────────────────────────
const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

const sin = (d) => Math.sin(d * DEG);
const cos = (d) => Math.cos(d * DEG);
const tan = (d) => Math.tan(d * DEG);
const arcsin = (x) => Math.asin(x) * RAD;
const arccos = (x) => Math.acos(x) * RAD;
const arctan = (x) => Math.atan(x) * RAD;
const arctan2 = (y, x) => Math.atan2(y, x) * RAD;

function fixAngle(a) {
  return a - 360 * Math.floor(a / 360);
}
function fixHour(h) {
  return h - 24 * Math.floor(h / 24);
}

// ─── Solar Position ──────────────────────────────────────────
function julianDate(year, month, day) {
  if (month <= 2) {
    year -= 1;
    month += 12;
  }
  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4);
  return (
    Math.floor(365.25 * (year + 4716)) +
    Math.floor(30.6001 * (month + 1)) +
    day +
    B -
    1524.5
  );
}

function sunPosition(jd) {
  const D = jd - 2451545.0;
  const g = fixAngle(357.529 + 0.98560028 * D);
  const q = fixAngle(280.459 + 0.98564736 * D);
  const L = fixAngle(q + 1.915 * sin(g) + 0.02 * sin(2 * g));
  const e = 23.439 - 0.00000036 * D;
  const RA = arctan2(cos(e) * sin(L), cos(L)) / 15;
  const declination = arcsin(sin(e) * sin(L));
  const eqTime = q / 15 - fixHour(RA);
  return { declination, eqTime };
}

/** Mid-day (solar noon) in hours, adjusted for longitude & timezone */
function midDay(jd, longitude, timezone) {
  const { eqTime } = sunPosition(jd);
  return fixHour(12 - eqTime - longitude / 15 + timezone);
}

/** Hour-angle for a given sun altitude below horizon */
function sunAngleTime(jd, angle, latitude, direction, longitude, timezone) {
  const { declination } = sunPosition(jd);
  const noon = midDay(jd, longitude, timezone);
  const cosHA =
    (-sin(angle) - sin(declination) * sin(latitude)) /
    (cos(declination) * cos(latitude));

  // Handle extreme latitudes where sun never reaches the required angle
  if (cosHA < -1 || cosHA > 1) return null;

  const t = arccos(cosHA) / 15;
  return noon + (direction === 'ccw' ? -t : t);
}

/** Asr time (Hanafi: shadow ratio = 2) */
function asrTime(jd, latitude, longitude, timezone) {
  const { declination } = sunPosition(jd);
  const noon = midDay(jd, longitude, timezone);
  const angle = -arctan(
    1 / (ASR_SHADOW_RATIO + tan(Math.abs(latitude - declination)))
  );
  // Asr is after noon, so direction is 'cw'
  const cosHA =
    (sin(angle) - sin(declination) * sin(latitude)) /
    (cos(declination) * cos(latitude));
  if (cosHA < -1 || cosHA > 1) return null;
  const t = arccos(cosHA) / 15;
  return noon + t;
}

// ─── Main Prayer Time Calculator ─────────────────────────────
/**
 * Calculate all five prayer times + sunrise/sunset for a given date & location.
 * Returns object with times as { hours, minutes, formatted } objects.
 */
function calculatePrayerTimes(date, latitude, longitude, timezone) {
  const jd = julianDate(date.getFullYear(), date.getMonth() + 1, date.getDate());

  const noon = midDay(jd, longitude, timezone);
  const fajr = sunAngleTime(jd, FAJR_ANGLE, latitude, 'ccw', longitude, timezone);
  const sunrise = sunAngleTime(jd, 0.833, latitude, 'ccw', longitude, timezone); // 0.833° = apparent sunrise
  const dhuhr = noon + 1 / 60; // 1 minute after noon for safety
  const asr = asrTime(jd, latitude, longitude, timezone);
  const sunset = sunAngleTime(jd, 0.833, latitude, 'cw', longitude, timezone);
  const maghrib = sunset; // Maghrib = sunset
  const isha = sunAngleTime(jd, ISHA_ANGLE, latitude, 'cw', longitude, timezone);

  const format = (h) => {
    if (h === null || h === undefined) return { hours: 0, minutes: 0, formatted: '--:--' };
    const hrs = Math.floor(h);
    const mins = Math.round((h - hrs) * 60);
    const adjustedHrs = ((hrs % 24) + 24) % 24;
    const adjustedMins = Math.min(59, Math.max(0, mins));
    const period = adjustedHrs >= 12 ? 'PM' : 'AM';
    const h12 = adjustedHrs === 0 ? 12 : adjustedHrs > 12 ? adjustedHrs - 12 : adjustedHrs;
    return {
      hours: adjustedHrs,
      minutes: adjustedMins,
      formatted: `${h12}:${String(adjustedMins).padStart(2, '0')} ${period}`,
      totalMinutes: adjustedHrs * 60 + adjustedMins,
    };
  };

  return {
    fajr: format(fajr),
    sunrise: format(sunrise),
    dhuhr: format(dhuhr),
    asr: format(asr),
    maghrib: format(maghrib),
    isha: format(isha),
    sunset: format(sunset),
  };
}

// ─── Haversine Distance ──────────────────────────────────────
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * DEG;
  const dLon = (lon2 - lon1) * DEG;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * DEG) * Math.cos(lat2 * DEG) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Hijri Date (Improved) ───────────────────────────────────
function getHijriMonth(date = new Date()) {
  // Use the Umm al-Qura approximation
  const hijriEpoch = new Date(622, 6, 19);
  const daysSinceEpoch = Math.floor((date - hijriEpoch) / 86400000);
  const lunarYear = 354.36667;
  const lunarMonth = 29.530588853;
  const remainingDays = daysSinceEpoch % lunarYear;
  const hijriMonth = Math.floor(remainingDays / lunarMonth) + 1;
  return Math.min(hijriMonth, 12);
}

function isRamadan(date = new Date()) {
  return getHijriMonth(date) === 9; // Ramadan is month 9
}

// ─── Timezone Offset (hours) ─────────────────────────────────
function getTimezoneOffset() {
  return -(new Date().getTimezoneOffset() / 60); // JS gives negative for east
}

// ─── Qasr Prayer Info ────────────────────────────────────────
const QASR_INFO = [
  {
    key: 'fajr',
    name: 'Fajr',
    nameAr: 'الفجر',
    normalRakats: 2,
    qasrRakats: 2,
    shortened: false,
    note: 'Fajr remains 2 Fard rakats — no change.',
  },
  {
    key: 'dhuhr',
    name: 'Dhuhr',
    nameAr: 'الظهر',
    normalRakats: 4,
    qasrRakats: 2,
    shortened: true,
    note: 'Shortened from 4 to 2 Fard rakats.',
  },
  {
    key: 'asr',
    name: 'Asr',
    nameAr: 'العصر',
    normalRakats: 4,
    qasrRakats: 2,
    shortened: true,
    note: 'Shortened from 4 to 2 Fard rakats.',
  },
  {
    key: 'maghrib',
    name: 'Maghrib',
    nameAr: 'المغرب',
    normalRakats: 3,
    qasrRakats: 3,
    shortened: false,
    note: 'Maghrib remains 3 Fard rakats — no change.',
  },
  {
    key: 'isha',
    name: 'Isha',
    nameAr: 'العشاء',
    normalRakats: 4,
    qasrRakats: 2,
    shortened: true,
    note: 'Shortened from 4 to 2 Fard rakats.',
  },
];

const SUNNAH_RULING = {
  title: 'Sunnah Prayers While Travelling',
  ruling:
    'According to the Hanafi madhab, it is permissible to omit Sunnah Muakkadah prayers while travelling, except the 2 Sunnah of Fajr and Witr, which should still be prayed if possible.',
  reference: 'Al-Hidayah, Kitab al-Salat — Chapter on Qasr',
};

// ─── Service ─────────────────────────────────────────────────
const MusafirService = {
  /**
   * Get current GPS coordinates.
   * Returns { latitude, longitude, city, country } or null.
   */
  async getCurrentLocation() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return { error: 'Location permission denied. Please enable GPS.' };
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = position.coords;

      // Reverse geocode for city name
      let city = '';
      let country = '';
      try {
        const [geo] = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (geo) {
          city = geo.city || geo.subregion || geo.region || '';
          country = geo.country || '';
        }
      } catch (e) {
        // Geocoding may fail offline — non-critical
      }

      return { latitude, longitude, city, country };
    } catch (error) {
      return { error: 'Unable to get location. Please check GPS settings.' };
    }
  },

  /**
   * Save home location.
   */
  async setHomeLocation(location) {
    const data = {
      latitude: location.latitude,
      longitude: location.longitude,
      city: location.city || '',
      country: location.country || '',
      setAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(HOME_LOCATION_KEY, JSON.stringify(data));
    return data;
  },

  /**
   * Get saved home location.
   */
  async getHomeLocation() {
    const raw = await AsyncStorage.getItem(HOME_LOCATION_KEY);
    return raw ? JSON.parse(raw) : null;
  },

  /**
   * Clear home location.
   */
  async clearHomeLocation() {
    await AsyncStorage.removeItem(HOME_LOCATION_KEY);
  },

  /**
   * Calculate distance between two points in km.
   */
  getDistance(lat1, lon1, lat2, lon2) {
    return haversineDistance(lat1, lon1, lat2, lon2);
  },

  /**
   * Save travel info (intended stay duration).
   */
  async setTravelInfo({ stayDays, departureDate }) {
    const data = {
      stayDays,
      departureDate: departureDate || new Date().toISOString(),
      setAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(TRAVEL_STATUS_KEY, JSON.stringify(data));
    return data;
  },

  /**
   * Get saved travel info.
   */
  async getTravelInfo() {
    const raw = await AsyncStorage.getItem(TRAVEL_STATUS_KEY);
    return raw ? JSON.parse(raw) : null;
  },

  /**
   * Clear travel info (user returned home).
   */
  async clearTravelInfo() {
    await AsyncStorage.removeItem(TRAVEL_STATUS_KEY);
  },

  /**
   * Determine full Musafir status:
   *  - distance from home
   *  - whether eligible for Qasr
   *  - Qasr prayer details
   *  - Ramadan sehri/iftar if applicable
   */
  async getMusafirStatus() {
    const home = await this.getHomeLocation();
    const travel = await this.getTravelInfo();
    const current = await this.getCurrentLocation();

    if (current.error) {
      return { error: current.error };
    }

    const timezone = getTimezoneOffset();
    const today = new Date();

    // Prayer times for current location
    const prayerTimes = calculatePrayerTimes(
      today,
      current.latitude,
      current.longitude,
      timezone
    );

    // Ramadan check
    const ramadan = isRamadan(today);
    let ramadanTimes = null;
    if (ramadan) {
      ramadanTimes = {
        sehriEnd: prayerTimes.fajr,
        iftarTime: prayerTimes.maghrib,
        isRamadan: true,
        note: 'Sehri (Suhoor) ends at Fajr athan. Iftar is at Maghrib (sunset).',
      };
    }

    // If no home set, return prayer times + Ramadan only
    if (!home) {
      return {
        hasHome: false,
        currentLocation: current,
        prayerTimes,
        ramadan: ramadanTimes,
        isRamadan: ramadan,
        qasr: null,
        distance: null,
        isMusafir: false,
      };
    }

    // Calculate distance
    const distanceKm = haversineDistance(
      home.latitude,
      home.longitude,
      current.latitude,
      current.longitude
    );
    const distanceMiles = distanceKm * 0.621371;
    const isFarEnough = distanceKm >= HANAFI_TRAVEL_DISTANCE_KM;

    // Check stay duration
    const stayDays = travel ? travel.stayDays : 0;
    const isShortStay = stayDays > 0 && stayDays < MUSAFIR_MAX_STAY_DAYS;
    const isMusafir = isFarEnough && (stayDays === 0 || isShortStay);

    return {
      hasHome: true,
      homeLocation: home,
      currentLocation: current,
      distance: {
        km: Math.round(distanceKm * 10) / 10,
        miles: Math.round(distanceMiles * 10) / 10,
        isFarEnough,
        requiredKm: HANAFI_TRAVEL_DISTANCE_KM,
        requiredMiles: 48,
      },
      stayDays,
      isShortStay,
      isMusafir,
      qasr: isMusafir ? QASR_INFO : null,
      sunnahRuling: isMusafir ? SUNNAH_RULING : null,
      prayerTimes,
      ramadan: ramadanTimes,
      isRamadan: ramadan,
    };
  },

  /**
   * Get GPS-based prayer times for the current location.
   * Standalone — does not require home to be set.
   */
  async getPrayerTimesForCurrentLocation() {
    const current = await this.getCurrentLocation();
    if (current.error) return { error: current.error };

    const timezone = getTimezoneOffset();
    const today = new Date();

    return {
      location: current,
      times: calculatePrayerTimes(today, current.latitude, current.longitude, timezone),
      isRamadan: isRamadan(today),
    };
  },

  /**
   * Get prayer times for specific coordinates (no GPS needed).
   */
  getPrayerTimesForCoords(latitude, longitude, date = new Date()) {
    const timezone = getTimezoneOffset();
    return calculatePrayerTimes(date, latitude, longitude, timezone);
  },

  /**
   * Get Qasr prayer info (static reference).
   */
  getQasrInfo() {
    return QASR_INFO;
  },

  /**
   * Get Sunnah ruling for travellers.
   */
  getSunnahRuling() {
    return SUNNAH_RULING;
  },

  /**
   * Check if currently Ramadan.
   */
  isRamadan() {
    return isRamadan(new Date());
  },

  /**
   * Get Ramadan sehri/iftar times for given coordinates.
   */
  getRamadanTimes(latitude, longitude, date = new Date()) {
    const timezone = getTimezoneOffset();
    const times = calculatePrayerTimes(date, latitude, longitude, timezone);
    return {
      sehriEnd: times.fajr,
      iftarTime: times.maghrib,
      isRamadan: isRamadan(date),
    };
  },

  /** Hanafi constants exposed for UI */
  HANAFI_TRAVEL_DISTANCE_KM,
  MUSAFIR_MAX_STAY_DAYS,
};

export default MusafirService;
