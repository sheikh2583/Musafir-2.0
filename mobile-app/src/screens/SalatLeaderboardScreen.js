import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';

export default function SalatLeaderboardScreen({ navigation }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [myRank, setMyRank] = useState(null);
  const [myScore, setMyScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [leaderboardType, setLeaderboardType] = useState('weekly'); // 'weekly' or 'alltime'
  const [totalParticipants, setTotalParticipants] = useState(0);
  
  // Animation for "Masha Allah" header
  const [headerAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // Animate the header
    Animated.loop(
      Animated.sequence([
        Animated.timing(headerAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(headerAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadLeaderboard();
      loadMyScore();
    }, [leaderboardType])
  );

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      setLeaderboard([]); // Clear stale data before fetch
      const response = await api.get(`/salat/leaderboard?type=${leaderboardType}&limit=100`);
      if (response.data?.success) {
        setLeaderboard(response.data.data.leaderboard);
        setMyRank(response.data.data.myRank);
        setTotalParticipants(response.data.data.totalParticipants);
      }
    } catch (error) {
      console.log('Error loading leaderboard:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadMyScore = async () => {
    try {
      const response = await api.get('/salat/score');
      if (response.data?.success) {
        setMyScore(response.data.data);
      }
    } catch (error) {
      console.log('Error loading my score:', error.message);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadLeaderboard(), loadMyScore()]);
    setRefreshing(false);
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return { icon: 'trophy', color: '#FFD700' };
    if (rank === 2) return { icon: 'medal', color: '#C0C0C0' };
    if (rank === 3) return { icon: 'medal', color: '#CD7F32' };
    return null;
  };

  const getRankStyle = (rank) => {
    if (rank === 1) return styles.rank1;
    if (rank === 2) return styles.rank2;
    if (rank === 3) return styles.rank3;
    return {};
  };

  const renderLeaderboardItem = ({ item, index }) => {
    const rankIcon = getRankIcon(item.rank);
    const isCurrentUser = item.isCurrentUser;

    return (
      <View style={[
        styles.leaderboardItem,
        getRankStyle(item.rank),
        isCurrentUser && styles.currentUserItem
      ]}>
        <View style={styles.rankContainer}>
          {rankIcon ? (
            <Ionicons name={rankIcon.icon} size={24} color={rankIcon.color} />
          ) : (
            <Text style={styles.rankText}>{item.rank}</Text>
          )}
        </View>
        
        <View style={styles.userInfo}>
          <View style={[styles.avatar, isCurrentUser && styles.currentUserAvatar]}>
            <Text style={styles.avatarText}>
              {item.name?.[0]?.toUpperCase() || 'U'}
            </Text>
          </View>
          <View style={styles.nameContainer}>
            <Text style={[styles.userName, isCurrentUser && styles.currentUserName]}>
              {item.name} {isCurrentUser && '(You)'}
            </Text>
            <Text style={styles.prayerCount}>
              {item.totalPrayers} prayers • {item.currentMultiplier}x streak
            </Text>
          </View>
        </View>
        
        <View style={styles.scoreContainer}>
          <Text style={[styles.score, isCurrentUser && styles.currentUserScore]}>
            {item.score.toLocaleString()}
          </Text>
          <Text style={styles.scoreLabel}>points</Text>
        </View>
      </View>
    );
  };

  const headerScale = headerAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.05, 1],
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D4A84B" />
        <Text style={styles.loadingText}>Loading leaderboard...</Text>
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
        
        <Animated.View style={[styles.titleContainer, { transform: [{ scale: headerScale }] }]}>
          <Text style={styles.mashaAllah}>ما شاء الله</Text>
          <Text style={styles.title}>Community Leaderboard</Text>
        </Animated.View>
        
        <View style={styles.placeholder} />
      </View>

      {/* My Stats Card */}
      {myScore && (
        <View style={styles.myStatsCard}>
          <View style={styles.myStatsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{myRank || '-'}</Text>
              <Text style={styles.statLabel}>Your Rank</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{myScore.weeklyScore?.toLocaleString() || 0}</Text>
              <Text style={styles.statLabel}>Weekly Score</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{myScore.currentMultiplier || 1}x</Text>
              <Text style={styles.statLabel}>Streak</Text>
            </View>
          </View>
          <View style={styles.progressInfo}>
            <Ionicons name="time-outline" size={14} color="#666" />
            <Text style={styles.progressText}>
              {myScore.prayersUntilReset} prayers until weekly reset
            </Text>
          </View>
        </View>
      )}

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, leaderboardType === 'weekly' && styles.activeTab]}
          onPress={() => setLeaderboardType('weekly')}
        >
          <Ionicons 
            name="calendar" 
            size={18} 
            color={leaderboardType === 'weekly' ? '#fff' : '#666'} 
          />
          <Text style={[styles.tabText, leaderboardType === 'weekly' && styles.activeTabText]}>
            This Week
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, leaderboardType === 'alltime' && styles.activeTab]}
          onPress={() => setLeaderboardType('alltime')}
        >
          <Ionicons 
            name="trophy" 
            size={18} 
            color={leaderboardType === 'alltime' ? '#fff' : '#666'} 
          />
          <Text style={[styles.tabText, leaderboardType === 'alltime' && styles.activeTabText]}>
            All Time Best
          </Text>
        </TouchableOpacity>
      </View>

      {/* Participants count */}
      <Text style={styles.participantsText}>
        {totalParticipants} friends competing this week
      </Text>

      {/* Leaderboard List */}
      <FlatList
        data={leaderboard}
        keyExtractor={(item, index) => `${item.userId}-${index}`}
        renderItem={renderLeaderboardItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#D4A84B']} />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>No friends on the board yet</Text>
            <Text style={styles.emptySubtext}>Befriend users to see their salat streaks!</Text>
          </View>
        }
      />

      {/* Scoring Info */}
      <TouchableOpacity 
        style={styles.infoButton}
        onPress={() => {
          navigation.navigate('ScoringInfo');
        }}
      >
        <Ionicons name="information-circle-outline" size={20} color="#666" />
        <Text style={styles.infoText}>How scoring works</Text>
      </TouchableOpacity>
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
    backgroundColor: '#1E1E1E',
    paddingTop: 50,
    paddingBottom: 25,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#D4A84B',
  },
  backButton: {
    padding: 5,
  },
  titleContainer: {
    alignItems: 'center',
  },
  mashaAllah: {
    fontSize: 28,
    color: '#D4A84B',
    fontWeight: 'bold',
    textShadowColor: 'rgba(212,168,75,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  title: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
    marginTop: 5,
  },
  placeholder: {
    width: 34,
  },
  myStatsCard: {
    backgroundColor: '#1E1E1E',
    marginHorizontal: 15,
    marginTop: -15,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  myStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#D4A84B',
  },
  statLabel: {
    fontSize: 12,
    color: '#808080',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#333333',
  },
  progressInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  progressText: {
    fontSize: 13,
    color: '#808080',
    marginLeft: 6,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 15,
    marginTop: 20,
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: '#D4A84B',
  },
  tabText: {
    fontSize: 14,
    color: '#808080',
    fontWeight: '600',
    marginLeft: 6,
  },
  activeTabText: {
    color: '#121212',
  },
  participantsText: {
    textAlign: 'center',
    fontSize: 13,
    color: '#808080',
    marginTop: 15,
    marginBottom: 10,
  },
  listContent: {
    paddingHorizontal: 15,
    paddingBottom: 100,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  rank1: {
    backgroundColor: '#2A2A1A',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  rank2: {
    backgroundColor: '#252525',
    borderWidth: 2,
    borderColor: '#C0C0C0',
  },
  rank3: {
    backgroundColor: '#2A2520',
    borderWidth: 2,
    borderColor: '#CD7F32',
  },
  currentUserItem: {
    backgroundColor: '#1E2E1E',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#808080',
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#D4A84B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentUserAvatar: {
    backgroundColor: '#4CAF50',
  },
  avatarText: {
    color: '#121212',
    fontSize: 18,
    fontWeight: 'bold',
  },
  nameContainer: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  currentUserName: {
    color: '#4CAF50',
  },
  prayerCount: {
    fontSize: 12,
    color: '#808080',
    marginTop: 2,
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  score: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#D4A84B',
  },
  currentUserScore: {
    color: '#4CAF50',
  },
  scoreLabel: {
    fontSize: 11,
    color: '#808080',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#B3B3B3',
    marginTop: 15,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#808080',
    marginTop: 5,
  },
  infoButton: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#333333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  infoText: {
    fontSize: 14,
    color: '#B3B3B3',
    marginLeft: 6,
  },
});
