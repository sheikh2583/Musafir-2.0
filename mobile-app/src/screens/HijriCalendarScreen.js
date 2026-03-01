import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import IslamicCalendarService from '../services/IslamicCalendarService';
import NotificationService from '../services/NotificationService';

const NOTES_STORAGE_KEY = '@hijri_calendar_notes';
const REMINDERS_STORAGE_KEY = '@hijri_calendar_reminders';

// Hijri month data
const HIJRI_MONTHS = [
  { name: 'Muharram', nameAr: 'محرم', days: 30 },
  { name: 'Safar', nameAr: 'صفر', days: 29 },
  { name: 'Rabi al-Awwal', nameAr: 'ربيع الأول', days: 30 },
  { name: 'Rabi al-Thani', nameAr: 'ربيع الثاني', days: 29 },
  { name: 'Jumada al-Awwal', nameAr: 'جمادى الأولى', days: 30 },
  { name: 'Jumada al-Thani', nameAr: 'جمادى الآخرة', days: 29 },
  { name: 'Rajab', nameAr: 'رجب', days: 30 },
  { name: "Sha'ban", nameAr: 'شعبان', days: 29 },
  { name: 'Ramadan', nameAr: 'رمضان', days: 30 },
  { name: 'Shawwal', nameAr: 'شوال', days: 29 },
  { name: "Dhul Qi'dah", nameAr: 'ذو القعدة', days: 30 },
  { name: 'Dhul Hijjah', nameAr: 'ذو الحجة', days: 29 },
];

// Islamic events with rich local content (no API calls needed)
const ISLAMIC_EVENTS = {
  '1-1': {
    name: 'Islamic New Year',
    nameAr: 'رأس السنة الهجرية',
    emoji: '🌙',
    type: 'holiday',
    importance: 'Marks the beginning of the Islamic lunar calendar and commemorates the Hijra (migration) of Prophet Muhammad ﷺ from Makkah to Madinah.',
    quranRef: { surah: 9, ayah: 40, text: 'If you do not aid him, Allah has already aided him when those who disbelieved had driven him out...' },
    dua: 'اللَّهُمَّ أَدْخِلْهُ عَلَيْنَا بِالأَمْنِ وَالإِيمَانِ وَالسَّلَامَةِ وَالإِسْلَامِ\nO Allah, bring this (new year) upon us with security, faith, safety, and Islam.',
  },
  '1-10': {
    name: 'Day of Ashura',
    nameAr: 'يوم عاشوراء',
    emoji: '📿',
    type: 'fasting',
    importance: 'A day of fasting. Prophet Musa (Moses) and his people were saved from Pharaoh on this day. Fasting expiates sins of the previous year.',
    quranRef: { surah: 26, ayah: 65, text: 'And We saved Moses and those with him, all together.' },
    dua: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ\nO Allah, I ask You for forgiveness and well-being.',
    practices: ['Fast on the 9th and 10th of Muharram', 'Remember the sacrifices of the prophets', 'Give charity and feed the poor'],
  },
  '3-12': {
    name: 'Mawlid an-Nabi ﷺ',
    nameAr: 'المولد النبوي',
    emoji: '🕌',
    type: 'holiday',
    importance: 'Commemorates the birth of Prophet Muhammad ﷺ. A time to reflect on his life, teachings, and character.',
    quranRef: { surah: 21, ayah: 107, text: 'And We have not sent you except as a mercy to the worlds.' },
    dua: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ\nO Allah, send blessings upon Muhammad and the family of Muhammad.',
    practices: ['Send abundant salawat upon the Prophet ﷺ', 'Study the Seerah (biography)', 'Practice his Sunnah'],
  },
  '7-27': {
    name: "Isra' and Mi'raj",
    nameAr: 'الإسراء والمعراج',
    emoji: '✨',
    type: 'holiday',
    importance: "The miraculous night journey of Prophet Muhammad ﷺ from Makkah to Jerusalem and ascension to the heavens. The five daily prayers were prescribed.",
    quranRef: { surah: 17, ayah: 1, text: 'Glory to Him who took His servant by night from al-Masjid al-Haram to al-Masjid al-Aqsa, whose surroundings We have blessed...' },
    dua: 'سُبْحَانَ الَّذِي أَسْرَى بِعَبْدِهِ لَيْلًا مِنَ الْمَسْجِدِ الْحَرَامِ إِلَى الْمَسْجِدِ الْأَقْصَى\nGlory be to Him who took His servant on a journey by night.',
  },
  '8-15': {
    name: "Laylat al-Bara'ah",
    nameAr: 'ليلة البراءة',
    emoji: '🌟',
    type: 'special',
    importance: "The Night of Forgiveness. Allah descends to the lowest heaven and forgives those who seek forgiveness. A night of prayer and reflection.",
    quranRef: { surah: 44, ayah: 3, text: 'Indeed, We sent it down during a blessed night. Indeed, We were to warn mankind.' },
    dua: 'اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي\nO Allah, You are Pardoning and You love to pardon, so pardon me.',
    practices: ['Pray and make dua during the night', 'Fast the next day (15th Shaban)', 'Seek forgiveness from Allah'],
  },
  '9-1': {
    name: 'Ramadan Begins',
    nameAr: 'بداية رمضان',
    emoji: '🌙',
    type: 'ramadan',
    importance: 'The blessed month of fasting begins. The Quran was revealed in this month. Fasting is obligatory for all able Muslims.',
    quranRef: { surah: 2, ayah: 185, text: 'The month of Ramadan in which the Quran was revealed, a guidance for mankind and clear proofs of guidance and criterion.' },
    dua: 'اللَّهُمَّ أَهِلَّهُ عَلَيْنَا بِالْأَمْنِ وَالْإِيمَانِ وَالسَّلَامَةِ وَالْإِسْلَامِ\nO Allah, let this moon appear on us with security and faith, with peace and Islam.',
    practices: ['Begin fasting from Fajr to Maghrib', 'Increase Quran recitation', 'Pray Tarawih at night', 'Give generously in charity'],
  },
  '9-27': {
    name: 'Laylat al-Qadr',
    nameAr: 'ليلة القدر',
    emoji: '⭐',
    type: 'special',
    importance: 'The Night of Power — better than a thousand months. The night the Quran was first revealed. Worship on this night brings immense reward.',
    quranRef: { surah: 97, ayah: 3, text: 'The Night of Power is better than a thousand months.' },
    dua: 'اللَّهُمَّ إِنَّكَ عَفُوٌّ كَرِيمٌ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي\nO Allah, You are the Most Forgiving, Most Generous, You love to forgive, so forgive me.',
    practices: ['Spend the entire night in worship', 'Recite and reflect on the Quran', 'Make abundant dua', 'Give charity (Sadaqa al-Fitr)'],
  },
  '10-1': {
    name: 'Eid al-Fitr',
    nameAr: 'عيد الفطر',
    emoji: '🎉',
    type: 'eid',
    importance: 'The Festival of Breaking Fast. Celebrates the completion of Ramadan. A day of gratitude, prayer, charity (Zakat al-Fitr), and joy.',
    quranRef: { surah: 2, ayah: 185, text: '...and to glorify Allah for that to which He has guided you; perhaps you will be grateful.' },
    dua: 'تَقَبَّلَ اللَّهُ مِنَّا وَمِنْكُمْ\nMay Allah accept from us and from you.',
    practices: ['Pay Zakat al-Fitr before the prayer', 'Perform Eid prayer', 'Wear your best clothes', 'Visit family and friends', 'Do NOT fast on this day'],
  },
  '12-8': {
    name: 'Day of Tarwiyah',
    nameAr: 'يوم التروية',
    emoji: '🕋',
    type: 'hajj',
    importance: 'The first day of Hajj rituals. Pilgrims travel to Mina. A day of spiritual preparation.',
    quranRef: { surah: 22, ayah: 27, text: 'And proclaim to the people the Hajj; they will come to you on foot and on every lean camel, from every distant pass.' },
    dua: 'لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ\nHere I am, O Allah, here I am.',
  },
  '12-9': {
    name: 'Day of Arafah',
    nameAr: 'يوم عرفة',
    emoji: '⛰️',
    type: 'fasting',
    importance: 'The best day of the year. Fasting expiates sins of the past and coming year. Pilgrims gather at Mount Arafat — the pinnacle of Hajj.',
    quranRef: { surah: 5, ayah: 3, text: 'This day I have perfected for you your religion and completed My favor upon you and have approved for you Islam as religion.' },
    dua: 'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ\nThere is no god but Allah alone with no partner, His is the dominion, His is the praise, and He is capable of all things.',
    practices: ['Fast the Day of Arafah (non-pilgrims)', 'Make abundant dua and dhikr', 'Seek forgiveness'],
  },
  '12-10': {
    name: 'Eid al-Adha',
    nameAr: 'عيد الأضحى',
    emoji: '🐑',
    type: 'eid',
    importance: "The Festival of Sacrifice. Commemorates Prophet Ibrahim's willingness to sacrifice his son. A day of prayer, sacrifice, and sharing with others.",
    quranRef: { surah: 37, ayah: 107, text: 'And We ransomed him with a great sacrifice.' },
    dua: 'تَقَبَّلَ اللَّهُ مِنَّا وَمِنْكُمْ\nMay Allah accept from us and from you.',
    practices: ['Perform Eid prayer', 'Sacrifice an animal (Qurbani)', 'Share meat with family, friends, and the poor', 'Do NOT fast on Eid days (10-13 Dhul Hijjah)'],
  },
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAYS_AR = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

export default function HijriCalendarScreen({ navigation }) {
  const [currentHijriDate, setCurrentHijriDate] = useState(null);
  const [displayMonth, setDisplayMonth] = useState(null);
  const [displayYear, setDisplayYear] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [reminders, setReminders] = useState({});

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      // Get current Hijri date
      const hijri = await IslamicCalendarService.getHijriDateOnline();
      setCurrentHijriDate(hijri);
      setDisplayMonth(hijri.month);
      setDisplayYear(hijri.year);

      // Load saved notes
      await loadNotes();

      // Load saved reminders
      await loadReminders();

      // Get upcoming events
      const events = await IslamicCalendarService.getUpcomingEvents(5);
      setUpcomingEvents(events);
    } catch (error) {
      console.log('Error loading calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNotes = async () => {
    try {
      const storedNotes = await AsyncStorage.getItem(NOTES_STORAGE_KEY);
      if (storedNotes) {
        setNotes(JSON.parse(storedNotes));
      }
    } catch (error) {
      console.log('Error loading notes:', error);
    }
  };

  const loadReminders = async () => {
    try {
      const storedReminders = await AsyncStorage.getItem(REMINDERS_STORAGE_KEY);
      if (storedReminders) {
        setReminders(JSON.parse(storedReminders));
      }
    } catch (error) {
      console.log('Error loading reminders:', error);
    }
  };

  const toggleReminder = async (dateKey, eventName) => {
    const newReminders = { ...reminders };
    if (newReminders[dateKey]) {
      // Remove reminder
      delete newReminders[dateKey];
      Alert.alert('Reminder Removed', `Reminder for ${eventName} has been removed.`);
    } else {
      // Add reminder
      newReminders[dateKey] = {
        eventName,
        createdAt: new Date().toISOString(),
        enabled: true,
      };

      // Try to schedule an actual notification
      if (NotificationService.isAvailable) {
        try {
          await NotificationService.requestPermission();
          // The event notifications are already handled by NotificationService
          // This stores the user preference for this specific event
          Alert.alert(
            '🔔 Reminder Set',
            `You will be reminded about ${eventName}.\n\nA notification will be sent when the time approaches.`,
            [{ text: 'OK' }]
          );
        } catch (e) {
          Alert.alert(
            '🔔 Reminder Saved',
            `Reminder for ${eventName} has been saved.\n\nEnable notifications in Settings for push reminders.`,
            [{ text: 'OK' }]
          );
        }
      } else {
        Alert.alert(
          '🔔 Reminder Saved',
          `Reminder for ${eventName} has been saved locally.\n\n⚠️ For push notifications, build the app (not available in Expo Go).`,
          [{ text: 'OK' }]
        );
      }
    }
    try {
      await AsyncStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(newReminders));
      setReminders(newReminders);
    } catch (error) {
      Alert.alert('Error', 'Failed to save reminder');
    }
  };

  const shareEventContent = async (event) => {
    let message = `${event.emoji} ${event.name}\n`;
    if (event.nameAr) message += `${event.nameAr}\n`;
    message += `\n${event.importance || ''}\n`;
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
      console.log('Error sharing:', error);
    }
  };

  const saveNote = async () => {
    if (!noteTitle.trim() && !noteText.trim()) {
      Alert.alert('Error', 'Please enter a title or note');
      return;
    }

    const dateKey = `${displayYear}-${displayMonth}-${selectedDate}`;
    const newNotes = { ...notes };
    
    if (!newNotes[dateKey]) {
      newNotes[dateKey] = [];
    }
    
    newNotes[dateKey].push({
      id: Date.now().toString(),
      title: noteTitle.trim(),
      text: noteText.trim(),
      createdAt: new Date().toISOString(),
    });

    try {
      await AsyncStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(newNotes));
      setNotes(newNotes);
      setNoteTitle('');
      setNoteText('');
      setModalVisible(false);
      Alert.alert('Success', 'Note saved successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to save note');
    }
  };

  const deleteNote = async (dateKey, noteId) => {
    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this note?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const newNotes = { ...notes };
            newNotes[dateKey] = newNotes[dateKey].filter(n => n.id !== noteId);
            if (newNotes[dateKey].length === 0) {
              delete newNotes[dateKey];
            }
            try {
              await AsyncStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(newNotes));
              setNotes(newNotes);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete note');
            }
          },
        },
      ]
    );
  };

  const goToPrevMonth = () => {
    if (displayMonth === 1) {
      setDisplayMonth(12);
      setDisplayYear(displayYear - 1);
    } else {
      setDisplayMonth(displayMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (displayMonth === 12) {
      setDisplayMonth(1);
      setDisplayYear(displayYear + 1);
    } else {
      setDisplayMonth(displayMonth + 1);
    }
  };

  const goToToday = () => {
    if (currentHijriDate) {
      setDisplayMonth(currentHijriDate.month);
      setDisplayYear(currentHijriDate.year);
    }
  };

  const handleDatePress = (day) => {
    setSelectedDate(day);
    setModalVisible(true);
  };

  const getEventColor = (type) => {
    const colors = {
      'eid': '#4CAF50',
      'fasting': '#FF9800',
      'ramadan': '#9C27B0',
      'hajj': '#795548',
      'holiday': '#2196F3',
      'special': '#E91E63',
    };
    return colors[type] || '#666';
  };

  const renderCalendarDays = () => {
    if (!displayMonth || !displayYear) return null;

    const monthData = HIJRI_MONTHS[displayMonth - 1];
    const days = [];
    
    // Calculate starting day of week (simplified - actual calculation would need lunar calendar conversion)
    // For now, we'll use a basic offset based on month and year
    const startDayOfWeek = ((displayYear * 12 + displayMonth) * 3) % 7;

    // Add empty cells for days before the 1st
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(
        <View key={`empty-${i}`} style={styles.dayCell}>
          <Text style={styles.dayTextEmpty}></Text>
        </View>
      );
    }

    // Add day cells
    for (let day = 1; day <= monthData.days; day++) {
      const eventKey = `${displayMonth}-${day}`;
      const event = ISLAMIC_EVENTS[eventKey];
      const dateKey = `${displayYear}-${displayMonth}-${day}`;
      const hasNotes = notes[dateKey] && notes[dateKey].length > 0;
      const isToday = currentHijriDate && 
        day === currentHijriDate.day && 
        displayMonth === currentHijriDate.month && 
        displayYear === currentHijriDate.year;

      days.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.dayCell,
            isToday && styles.todayCell,
            event && { borderColor: getEventColor(event.type), borderWidth: 2 },
          ]}
          onPress={() => handleDatePress(day)}
        >
          <Text style={[styles.dayText, isToday && styles.todayText]}>
            {day}
          </Text>
          {event && <Text style={styles.eventEmoji}>{event.emoji}</Text>}
          {hasNotes && (
            <View style={styles.noteIndicator}>
              <Ionicons name="document-text" size={10} color="#D4A84B" />
            </View>
          )}
        </TouchableOpacity>
      );
    }

    return days;
  };

  const renderSelectedDateNotes = () => {
    if (!selectedDate) return null;

    const dateKey = `${displayYear}-${displayMonth}-${selectedDate}`;
    const dateNotes = notes[dateKey] || [];
    const eventKey = `${displayMonth}-${selectedDate}`;
    const event = ISLAMIC_EVENTS[eventKey];
    const reminderKey = `${displayYear}-${eventKey}`;
    const hasReminder = reminders[reminderKey];

    return (
      <View style={styles.notesSection}>
        {/* Pretty Event Details */}
        {event && (
          <View style={styles.eventDetailContainer}>
            {/* Event Banner */}
            <View style={[styles.eventBanner, { backgroundColor: getEventColor(event.type) }]}>
              <Text style={styles.eventBannerEmoji}>{event.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.eventBannerText}>{event.name}</Text>
                {event.nameAr && <Text style={styles.eventBannerTextAr}>{event.nameAr}</Text>}
              </View>
            </View>

            {/* Action Buttons: Share + Reminder */}
            <View style={styles.eventActionsRow}>
              <TouchableOpacity
                style={styles.eventActionBtn}
                onPress={() => shareEventContent(event)}
              >
                <Ionicons name="share-social-outline" size={18} color="#D4A84B" />
                <Text style={styles.eventActionText}>Share</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.eventActionBtn, hasReminder && styles.eventActionBtnActive]}
                onPress={() => toggleReminder(reminderKey, event.name)}
              >
                <Ionicons
                  name={hasReminder ? 'notifications' : 'notifications-outline'}
                  size={18}
                  color={hasReminder ? '#FFD700' : '#D4A84B'}
                />
                <Text style={[styles.eventActionText, hasReminder && { color: '#FFD700' }]}>
                  {hasReminder ? 'Reminder On' : 'Set Reminder'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Importance / Description */}
            {event.importance && (
              <View style={styles.eventSection}>
                <View style={styles.eventSectionHeader}>
                  <Ionicons name="information-circle-outline" size={18} color="#D4A84B" />
                  <Text style={styles.eventSectionTitle}>About this Day</Text>
                </View>
                <Text style={styles.eventSectionBody}>{event.importance}</Text>
              </View>
            )}

            {/* Quran Reference */}
            {event.quranRef && (
              <View style={styles.eventQuranCard}>
                <View style={styles.eventSectionHeader}>
                  <Ionicons name="book-outline" size={18} color="#D4A84B" />
                  <Text style={styles.eventSectionTitle}>Quran Reference</Text>
                </View>
                <Text style={styles.eventQuranText}>"{event.quranRef.text}"</Text>
                <Text style={styles.eventQuranRef}>— Surah {event.quranRef.surah}, Ayah {event.quranRef.ayah}</Text>
              </View>
            )}

            {/* Dua */}
            {event.dua && (
              <View style={styles.eventDuaCard}>
                <View style={styles.eventSectionHeader}>
                  <Ionicons name="hand-left-outline" size={18} color="#81C784" />
                  <Text style={[styles.eventSectionTitle, { color: '#81C784' }]}>Dua / Supplication</Text>
                </View>
                <Text style={styles.eventDuaText}>{event.dua}</Text>
              </View>
            )}

            {/* Practices */}
            {event.practices && event.practices.length > 0 && (
              <View style={styles.eventSection}>
                <View style={styles.eventSectionHeader}>
                  <Ionicons name="checkmark-done-outline" size={18} color="#64B5F6" />
                  <Text style={[styles.eventSectionTitle, { color: '#64B5F6' }]}>Recommended Practices</Text>
                </View>
                {event.practices.map((practice, idx) => (
                  <View key={idx} style={styles.practiceRow}>
                    <Text style={styles.practiceBullet}>•</Text>
                    <Text style={styles.practiceText}>{practice}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        <Text style={styles.notesSectionTitle}>
          Notes for {selectedDate} {HIJRI_MONTHS[displayMonth - 1].name} {displayYear}
        </Text>

        {dateNotes.length === 0 ? (
          <Text style={styles.noNotesText}>No notes for this date</Text>
        ) : (
          dateNotes.map((note) => (
            <View key={note.id} style={styles.noteCard}>
              <View style={styles.noteHeader}>
                <Text style={styles.noteTitle}>{note.title || 'Note'}</Text>
                <TouchableOpacity onPress={() => deleteNote(dateKey, note.id)}>
                  <Ionicons name="trash-outline" size={18} color="#F44336" />
                </TouchableOpacity>
              </View>
              {note.text ? <Text style={styles.noteText}>{note.text}</Text> : null}
              <Text style={styles.noteDate}>
                {new Date(note.createdAt).toLocaleDateString()}
              </Text>
            </View>
          ))
        )}

        {/* Add Note Form */}
        <View style={styles.addNoteForm}>
          <TextInput
            style={styles.noteTitleInput}
            placeholder="Note title (optional)"
            value={noteTitle}
            onChangeText={setNoteTitle}
            placeholderTextColor="#999"
          />
          <TextInput
            style={styles.noteTextInput}
            placeholder="Write your note here..."
            value={noteText}
            onChangeText={setNoteText}
            multiline
            numberOfLines={3}
            placeholderTextColor="#999"
          />
          <TouchableOpacity style={styles.saveNoteButton} onPress={saveNote}>
            <Ionicons name="add-circle" size={20} color="#fff" />
            <Text style={styles.saveNoteButtonText}>Add Note</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D4A84B" />
        <Text style={styles.loadingText}>Loading Calendar...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Hijri Calendar</Text>
          <Text style={styles.headerTitleAr}>التقويم الهجري</Text>
        </View>
        <TouchableOpacity onPress={goToToday} style={styles.todayButton}>
          <Ionicons name="today" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        {/* Month Navigation */}
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={goToPrevMonth} style={styles.navButton}>
            <Ionicons name="chevron-back" size={28} color="#D4A84B" />
          </TouchableOpacity>
          
          <View style={styles.monthDisplay}>
            <Text style={styles.monthNameAr}>
              {HIJRI_MONTHS[displayMonth - 1]?.nameAr}
            </Text>
            <Text style={styles.monthName}>
              {HIJRI_MONTHS[displayMonth - 1]?.name} {displayYear} AH
            </Text>
          </View>
          
          <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
            <Ionicons name="chevron-forward" size={28} color="#D4A84B" />
          </TouchableOpacity>
        </View>

        {/* Current Date Display */}
        {currentHijriDate && (
          <View style={styles.currentDateCard}>
            <Text style={styles.currentDateLabel}>Today</Text>
            <Text style={styles.currentDateAr}>{currentHijriDate.formattedAr}</Text>
            <Text style={styles.currentDate}>{currentHijriDate.formatted}</Text>
          </View>
        )}

        {/* Weekday Headers */}
        <View style={styles.weekdayRow}>
          {WEEKDAYS.map((day, index) => (
            <View key={day} style={styles.weekdayCell}>
              <Text style={[styles.weekdayText, index === 5 && styles.fridayText]}>
                {day}
              </Text>
            </View>
          ))}
        </View>

        {/* Calendar Grid */}
        <View style={styles.calendarGrid}>
          {renderCalendarDays()}
        </View>

        {/* Upcoming Events */}
        <View style={styles.eventsSection}>
          <Text style={styles.eventsSectionTitle}>📅 Upcoming Events</Text>
          {upcomingEvents.map((event, index) => {
            const reminderKey = `${displayYear}-${event.month}-${event.day}`;
            const hasReminder = reminders[reminderKey];
            return (
              <View key={index} style={styles.upcomingEventCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <View style={[styles.eventDot, { backgroundColor: getEventColor(event.type) }]} />
                  <View style={styles.upcomingEventInfo}>
                    <Text style={styles.upcomingEventName}>{event.emoji} {event.name}</Text>
                    <Text style={styles.upcomingEventDate}>{event.hijriDate}</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TouchableOpacity
                    style={styles.miniActionBtn}
                    onPress={() => toggleReminder(reminderKey, event.name)}
                  >
                    <Ionicons
                      name={hasReminder ? 'notifications' : 'notifications-outline'}
                      size={16}
                      color={hasReminder ? '#FFD700' : '#808080'}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.miniActionBtn}
                    onPress={() => shareEventContent(event)}
                  >
                    <Ionicons name="share-social-outline" size={16} color="#808080" />
                  </TouchableOpacity>
                  <View style={styles.daysUntilBadge}>
                    <Text style={styles.daysUntilText}>
                      {event.daysUntil === 0 ? 'Today' : `${event.daysUntil}d`}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Date Details Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedDate} {HIJRI_MONTHS[displayMonth - 1]?.name}
              </Text>
              <TouchableOpacity onPress={() => {
                setModalVisible(false);
                setNoteTitle('');
                setNoteText('');
              }}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              {renderSelectedDateNotes()}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  loadingText: {
    marginTop: 10,
    color: '#B3B3B3',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E1E1E',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#D4A84B',
  },
  backButton: {
    padding: 5,
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerTitleAr: {
    color: '#D4A84B',
    fontSize: 14,
  },
  todayButton: {
    padding: 5,
  },
  content: {
    flex: 1,
    padding: 15,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  navButton: {
    padding: 10,
  },
  monthDisplay: {
    alignItems: 'center',
  },
  monthNameAr: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#D4A84B',
  },
  monthName: {
    fontSize: 16,
    color: '#B3B3B3',
    marginTop: 2,
  },
  currentDateCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#D4A84B',
  },
  currentDateLabel: {
    color: '#E8C87A',
    fontSize: 12,
    marginBottom: 5,
  },
  currentDateAr: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  currentDate: {
    color: '#B3B3B3',
    fontSize: 14,
    marginTop: 3,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#808080',
  },
  fridayText: {
    color: '#D4A84B',
    fontWeight: 'bold',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
    borderRadius: 8,
  },
  todayCell: {
    backgroundColor: '#2A2A1A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D4A84B',
  },
  dayText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  dayTextEmpty: {
    fontSize: 14,
    color: 'transparent',
  },
  todayText: {
    fontWeight: 'bold',
    color: '#D4A84B',
  },
  eventEmoji: {
    fontSize: 10,
    marginTop: -2,
  },
  noteIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
  },
  eventsSection: {
    marginTop: 20,
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  eventsSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  upcomingEventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  eventDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  upcomingEventInfo: {
    flex: 1,
  },
  upcomingEventName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  upcomingEventDate: {
    fontSize: 12,
    color: '#808080',
    marginTop: 2,
  },
  daysUntilBadge: {
    backgroundColor: '#2A2A1A',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D4A84B',
  },
  daysUntilText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D4A84B',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1E1E1E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#D4A84B',
  },
  modalBody: {
    padding: 20,
  },
  notesSection: {
    flex: 1,
  },
  eventBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  eventBannerEmoji: {
    fontSize: 28,
    marginRight: 12,
  },
  eventBannerText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  eventBannerTextAr: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 15,
    marginTop: 2,
  },
  // Event detail container
  eventDetailContainer: {
    marginBottom: 20,
  },
  // Action row (Share + Reminder)
  eventActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  eventActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#252525',
    borderWidth: 1,
    borderColor: '#333',
    gap: 6,
  },
  eventActionBtnActive: {
    borderColor: '#FFD700',
    backgroundColor: '#2A2A1A',
  },
  eventActionText: {
    color: '#D4A84B',
    fontSize: 13,
    fontWeight: '600',
  },
  // Event sections
  eventSection: {
    backgroundColor: '#252525',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  eventSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  eventSectionTitle: {
    color: '#D4A84B',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  eventSectionBody: {
    color: '#E0E0E0',
    fontSize: 14,
    lineHeight: 22,
  },
  // Quran card in event
  eventQuranCard: {
    backgroundColor: '#1A2A1A',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#D4A84B',
  },
  eventQuranText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontStyle: 'italic',
    lineHeight: 24,
  },
  eventQuranRef: {
    color: '#808080',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'right',
  },
  // Dua card in event
  eventDuaCard: {
    backgroundColor: '#1A2A2A',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#81C784',
  },
  eventDuaText: {
    color: '#E0E0E0',
    fontSize: 15,
    lineHeight: 26,
    textAlign: 'center',
  },
  // Practices list
  practiceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
    paddingLeft: 4,
  },
  practiceBullet: {
    color: '#64B5F6',
    fontSize: 16,
    marginRight: 8,
    lineHeight: 22,
  },
  practiceText: {
    color: '#E0E0E0',
    fontSize: 14,
    lineHeight: 22,
    flex: 1,
  },
  // Mini action buttons in upcoming events
  miniActionBtn: {
    padding: 8,
    borderRadius: 16,
    marginRight: 4,
  },
  notesSectionTitle: {
    fontSize: 14,
    color: '#808080',
    marginBottom: 15,
  },
  noNotesText: {
    color: '#808080',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 20,
  },
  noteCard: {
    backgroundColor: '#252525',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#D4A84B',
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  noteTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  noteText: {
    fontSize: 14,
    color: '#B3B3B3',
    marginTop: 5,
  },
  noteDate: {
    fontSize: 11,
    color: '#808080',
    marginTop: 8,
  },
  addNoteForm: {
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  noteTitleInput: {
    backgroundColor: '#252525',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    marginBottom: 10,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#333333',
  },
  noteTextInput: {
    backgroundColor: '#252525',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 10,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#333333',
  },
  saveNoteButton: {
    backgroundColor: '#D4A84B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 10,
  },
  saveNoteButtonText: {
    color: '#121212',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
