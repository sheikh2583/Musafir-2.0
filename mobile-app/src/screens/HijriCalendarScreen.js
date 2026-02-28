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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import IslamicCalendarService from '../services/IslamicCalendarService';

const NOTES_STORAGE_KEY = '@hijri_calendar_notes';

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

// Islamic events
const ISLAMIC_EVENTS = {
  '1-1': { name: 'Islamic New Year', emoji: '🌙', type: 'holiday' },
  '1-10': { name: 'Day of Ashura', emoji: '📿', type: 'fasting' },
  '3-12': { name: 'Mawlid an-Nabi', emoji: '🕌', type: 'holiday' },
  '7-27': { name: "Isra' and Mi'raj", emoji: '✨', type: 'holiday' },
  '8-15': { name: "Laylat al-Bara'ah", emoji: '🌟', type: 'special' },
  '9-1': { name: 'Ramadan Begins', emoji: '🌙', type: 'ramadan' },
  '9-27': { name: 'Laylat al-Qadr', emoji: '⭐', type: 'special' },
  '10-1': { name: 'Eid al-Fitr', emoji: '🎉', type: 'eid' },
  '12-8': { name: 'Day of Tarwiyah', emoji: '🕋', type: 'hajj' },
  '12-9': { name: 'Day of Arafah', emoji: '⛰️', type: 'fasting' },
  '12-10': { name: 'Eid al-Adha', emoji: '🐑', type: 'eid' },
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

    return (
      <View style={styles.notesSection}>
        {event && (
          <View style={[styles.eventBanner, { backgroundColor: getEventColor(event.type) }]}>
            <Text style={styles.eventBannerEmoji}>{event.emoji}</Text>
            <Text style={styles.eventBannerText}>{event.name}</Text>
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
    <View style={styles.container}>
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

      <ScrollView style={styles.content}>
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
          {upcomingEvents.map((event, index) => (
            <View key={index} style={styles.upcomingEventCard}>
              <View style={[styles.eventDot, { backgroundColor: getEventColor(event.type) }]} />
              <View style={styles.upcomingEventInfo}>
                <Text style={styles.upcomingEventName}>{event.emoji} {event.name}</Text>
                <Text style={styles.upcomingEventDate}>{event.hijriDate}</Text>
              </View>
              <View style={styles.daysUntilBadge}>
                <Text style={styles.daysUntilText}>
                  {event.daysUntil === 0 ? 'Today' : `${event.daysUntil}d`}
                </Text>
              </View>
            </View>
          ))}
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
    </View>
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
    color: '#FFFFFF',
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
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
  },
  eventBannerEmoji: {
    fontSize: 24,
    marginRight: 10,
  },
  eventBannerText: {
    color: '#121212',
    fontSize: 16,
    fontWeight: '600',
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
