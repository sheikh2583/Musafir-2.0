import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

// ─── Animated AI Orb Component ───────────────────────────────
function AIOrb({ size = 34, isThinking = false }) {
  const pulse = useRef(new Animated.Value(1)).current;
  const glow = useRef(new Animated.Value(0.4)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Continuous slow rotation
    Animated.loop(
      Animated.timing(rotate, {
        toValue: 1,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  useEffect(() => {
    if (isThinking) {
      // Fast pulse when thinking
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.18, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 0.92, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(glow, { toValue: 0.9, duration: 500, useNativeDriver: true }),
          Animated.timing(glow, { toValue: 0.3, duration: 500, useNativeDriver: true }),
        ])
      ).start();
    } else {
      // Calm idle breathing
      pulse.stopAnimation();
      glow.stopAnimation();
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.06, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start();
      Animated.timing(glow, { toValue: 0.5, duration: 400, useNativeDriver: true }).start();
    }
  }, [isThinking]);

  const spin = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={[orbStyles.container, { width: size, height: size }]}>
      {/* Outer glow ring */}
      <Animated.View
        style={[
          orbStyles.glowRing,
          {
            width: size + 8,
            height: size + 8,
            borderRadius: (size + 8) / 2,
            opacity: glow,
            transform: [{ scale: pulse }],
          },
        ]}
      />
      {/* Rotating ring */}
      <Animated.View
        style={[
          orbStyles.rotateRing,
          {
            width: size + 2,
            height: size + 2,
            borderRadius: (size + 2) / 2,
            transform: [{ rotate: spin }],
          },
        ]}
      />
      {/* Core orb */}
      <Animated.View
        style={[
          orbStyles.core,
          {
            width: size - 4,
            height: size - 4,
            borderRadius: (size - 4) / 2,
            transform: [{ scale: pulse }],
          },
        ]}
      >
        <Text style={[orbStyles.ilmText, { fontSize: size * 0.38 }]}>عِلْم</Text>
      </Animated.View>
    </View>
  );
}

const orbStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowRing: {
    position: 'absolute',
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#D4A84B',
    shadowColor: '#D4A84B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  rotateRing: {
    position: 'absolute',
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: 'transparent',
    borderTopColor: '#D4A84B',
    borderRightColor: 'rgba(212,168,75,0.3)',
  },
  core: {
    backgroundColor: '#D4A84B',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D4A84B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 16,
    elevation: 10,
  },
  ilmText: {
    fontWeight: '700',
    color: '#121212',
    textAlign: 'center',
  },
});

// ─── Main Chat Screen ────────────────────────────────────────
export default function AIChatScreen({ navigation }) {
  const [messages, setMessages] = useState([
    {
      id: '1',
      text: "As-salamu alaykum! I'm your Islamic knowledge assistant. Ask me anything about the Quran, Hadith, or Islamic practices.",
      sender: 'ai',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const sendMessage = async () => {
    if (!inputText.trim() || loading) return;

    const userMessage = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    const history = messages
      .filter((m) => m.sender !== 'system')
      .map((m) => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text,
      }));

    try {
      const response = await api.post('/chat', {
        message: userMessage.text,
        history: history,
      }, {
        timeout: 120000,
      });

      if (response.data?.success) {
        const aiMessage = {
          id: (Date.now() + 1).toString(),
          text: response.data.message,
          sender: 'ai',
          timestamp: new Date(),
          sources: response.data.sources,
        };
        setMessages((prev) => [...prev, aiMessage]);
      } else {
        throw new Error(response.data?.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Chat error:', error);
      let errorMessage = 'Sorry, I encountered an error. Please try again.';
      if (error.response?.status === 503) {
        errorMessage = 'The AI service is currently unavailable. Please try again later.';
      } else if (error.message?.includes('Network')) {
        errorMessage = 'Network error. Please check your connection.';
      }
      const errorMsg = {
        id: (Date.now() + 1).toString(),
        text: errorMessage,
        sender: 'ai',
        timestamp: new Date(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = ({ item }) => {
    const isUser = item.sender === 'user';

    return (
      <View
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.aiMessageContainer,
        ]}
      >
        {!isUser && (
          <View style={styles.aiAvatarWrap}>
            <AIOrb size={30} isThinking={false} />
          </View>
        )}
        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userBubble : styles.aiBubble,
            item.isError && styles.errorBubble,
          ]}
        >
          <Text
            style={[styles.messageText, isUser ? styles.userText : styles.aiText]}
          >
            {item.text}
          </Text>

          {item.sources && item.sources.length > 0 && (
            <View style={styles.sourcesContainer}>
              <Text style={styles.sourcesLabel}>📚 Sources:</Text>
              {item.sources.slice(0, 3).map((source, idx) => (
                <Text key={idx} style={styles.sourceText}>
                  • {typeof source === 'string' ? source : source.text || JSON.stringify(source)}
                </Text>
              ))}
            </View>
          )}

          <Text style={styles.timestamp}>
            {new Date(item.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
        {isUser && (
          <View style={styles.userAvatar}>
            <Ionicons name="person" size={16} color="#fff" />
          </View>
        )}
      </View>
    );
  };

  const suggestedQuestions = [
    "What are the five pillars of Islam?",
    "Explain Surah Al-Fatiha",
    "How to perform Wudu?",
    "What is Zakat?",
  ];

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#D4A84B" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <AIOrb size={36} isThinking={loading} />
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerTitle}>Islamic AI</Text>
            <View style={styles.statusContainer}>
              <View style={[styles.statusDot, loading && styles.statusDotActive]} />
              <Text style={styles.statusText}>
                {loading ? 'Thinking...' : 'Online'}
              </Text>
            </View>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => {
            setMessages([{
              id: '1',
              text: "As-salamu alaykum! I'm your Islamic knowledge assistant. Ask me anything about the Quran, Hadith, or Islamic practices.",
              sender: 'ai',
              timestamp: new Date(),
            }]);
          }}
          style={styles.clearBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="refresh-outline" size={22} color="#808080" />
        </TouchableOpacity>
      </View>

      {/* Suggested Questions */}
      {messages.length <= 2 && (
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsTitle}>Suggested Questions</Text>
          <View style={styles.suggestionsGrid}>
            {suggestedQuestions.map((q, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.suggestionChip}
                onPress={() => setInputText(q)}
                activeOpacity={0.7}
              >
                <Text style={styles.suggestionText}>{q}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
          onLayout={() =>
            flatListRef.current?.scrollToEnd({ animated: false })
          }
        />

        {/* Thinking Indicator with Orb */}
        {loading && (
          <View style={styles.typingIndicator}>
            <AIOrb size={22} isThinking={true} />
            <Text style={styles.typingText}>Thinking...</Text>
          </View>
        )}

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask about Islam, Quran, or Hadith..."
            placeholderTextColor="#808080"
            multiline
            maxLength={500}
            editable={!loading}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || loading) && styles.sendButtonDisabled,
            ]}
            onPress={sendMessage}
            disabled={!inputText.trim() || loading}
            activeOpacity={0.7}
          >
            <Ionicons
              name="send"
              size={20}
              color={inputText.trim() && !loading ? '#D4A84B' : '#555'}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 56 : 44,
    paddingBottom: 14,
    paddingHorizontal: 16,
    backgroundColor: '#1E1E1E',
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2C',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  backButton: {
    padding: 6,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTextWrap: {
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#D4A84B',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#4CAF50',
    marginRight: 5,
  },
  statusDotActive: {
    backgroundColor: '#FF9800',
  },
  statusText: {
    fontSize: 11,
    color: '#808080',
  },
  clearBtn: {
    padding: 6,
  },
  // Suggestions
  suggestionsContainer: {
    padding: 16,
    backgroundColor: '#1E1E1E',
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2C',
  },
  suggestionsTitle: {
    fontSize: 12,
    color: '#808080',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionChip: {
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(212,168,75,0.2)',
  },
  suggestionText: {
    fontSize: 13,
    color: '#D4A84B',
  },
  // Messages
  messagesList: {
    padding: 16,
    paddingBottom: 20,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 14,
    alignItems: 'flex-end',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  aiMessageContainer: {
    justifyContent: 'flex-start',
  },
  aiAvatarWrap: {
    marginRight: 8,
    marginBottom: 2,
  },
  userAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#D4A84B',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 14,
    borderRadius: 18,
  },
  userBubble: {
    backgroundColor: '#D4A84B',
    borderBottomRightRadius: 4,
    shadowColor: '#D4A84B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  aiBubble: {
    backgroundColor: '#1E1E1E',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#2C2C2C',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  errorBubble: {
    backgroundColor: '#3D2020',
    borderColor: '#EF5350',
    borderWidth: 1,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: '#000',
  },
  aiText: {
    color: '#FFFFFF',
  },
  sourcesContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#2C2C2C',
  },
  sourcesLabel: {
    fontSize: 11,
    color: '#D4A84B',
    marginBottom: 4,
    fontWeight: '600',
  },
  sourceText: {
    fontSize: 11,
    color: '#808080',
    marginTop: 2,
  },
  timestamp: {
    fontSize: 10,
    color: '#808080',
    marginTop: 6,
    alignSelf: 'flex-end',
  },
  // Typing
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#1E1E1E',
    borderTopWidth: 1,
    borderTopColor: '#2C2C2C',
    gap: 10,
  },
  typingText: {
    color: '#D4A84B',
    fontSize: 13,
    fontWeight: '500',
  },
  // Input
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    backgroundColor: '#1E1E1E',
    borderTopWidth: 1,
    borderTopColor: '#2C2C2C',
  },
  input: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingRight: 16,
    color: '#FFFFFF',
    fontSize: 15,
    maxHeight: 100,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
