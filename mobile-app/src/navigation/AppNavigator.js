import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import UserProfileScreen from '../screens/UserProfileScreen';
import QuranScreen from '../screens/QuranScreen';
import SurahScreen from '../screens/SurahScreen';
import SurahQuizScreen from '../screens/SurahQuizScreen';
import VerseSearchScreen from '../screens/VerseSearchScreen';
import HadithScreen from '../screens/HadithScreen';
import HadithCollectionScreen from '../screens/HadithCollectionScreen';
import HadithSearchResultsScreen from '../screens/HadithSearchResultsScreen';
import ArabicWritingScreen from '../screens/ArabicWritingScreen';
import QuranQuizScreen from '../screens/QuranQuizScreen';
import SalatLeaderboardScreen from '../screens/SalatLeaderboardScreen';
import HijriCalendarScreen from '../screens/HijriCalendarScreen';
import AIChatScreen from '../screens/AIChatScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="HomeFeed"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="UserProfile"
        component={UserProfileScreen}
        options={{ title: 'User Profile' }}
      />
      <Stack.Screen
        name="SalatLeaderboard"
        component={SalatLeaderboardScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="HijriCalendar"
        component={HijriCalendarScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AIChat"
        component={AIChatScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

function QuranStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="QuranList"
        component={QuranScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Surah"
        component={SurahScreen}
        options={{
          headerStyle: { backgroundColor: '#2E7D32' },
          headerTintColor: '#FFF',
          headerTitleStyle: { fontWeight: 'bold' }
        }}
      />
      <Stack.Screen
        name="SurahQuiz"
        component={SurahQuizScreen}
        options={({ route }) => ({
          title: `${route.params.surahName} Quiz`,
          headerStyle: { backgroundColor: '#2E7D32' },
          headerTintColor: '#FFF',
          headerTitleStyle: { fontWeight: 'bold' }
        })}
      />
      <Stack.Screen
        name="VerseSearch"
        component={VerseSearchScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ArabicWriting"
        component={ArabicWritingScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="QuranQuiz"
        component={QuranQuizScreen}
        options={{
          title: 'Quran Vocabulary Quiz',
          headerStyle: { backgroundColor: '#2E7D32' },
          headerTintColor: '#FFF',
        }}
      />
    </Stack.Navigator>
  );
}

function HadithStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="HadithList"
        component={HadithScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="HadithCollection"
        component={HadithCollectionScreen}
        options={{
          headerStyle: { backgroundColor: '#1565C0' },
          headerTintColor: '#FFF',
          headerTitleStyle: { fontWeight: 'bold' }
        }}
      />
      <Stack.Screen
        name="HadithSearchResults"
        component={HadithSearchResultsScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Quran') {
            iconName = focused ? 'book' : 'book-outline';
          } else if (route.name === 'Hadith') {
            iconName = focused ? 'library' : 'library-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#D4A84B',
        tabBarInactiveTintColor: '#808080',
        tabBarStyle: {
          backgroundColor: '#1E1E1E',
          borderTopColor: '#333333',
          borderTopWidth: 1,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Quran" component={QuranStack} />
      <Tab.Screen name="Hadith" component={HadithStack} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return null;
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}
