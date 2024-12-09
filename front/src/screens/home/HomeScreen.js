import React, { useState, useCallback, memo, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    RefreshControl,
    ScrollView,
    ActivityIndicator,
    Platform,
    Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { CircularProgress } from 'react-native-circular-progress';
import { LineChart } from 'react-native-chart-kit';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { theme } from '../../styles/theme';

const BASE_URL = 'http://000.000.000.000:3009'; // Express 서버 주소

// Axios 인스턴스 생성
const api = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

const { width } = Dimensions.get('window');

// Grid Button Component
const GridButton = memo(({ title, icon, onPress }) => (
    <TouchableOpacity
        style={styles.gridButton}
        onPress={onPress}
        activeOpacity={0.7}
    >
        <Icon name={icon} size={24} color={theme.colors.text} />
        <Text style={styles.gridButtonText}>{title}</Text>
    </TouchableOpacity>
));
// Tech Icon Component
const TechIcon = memo(({ item, onPress }) => (
    <TouchableOpacity
        style={styles.techItem}
        onPress={onPress}
    >
        <View style={styles.techIconBox}>
            <Icon name={item.icon} size={30} color={theme.colors.text} />
        </View>
        <Text style={styles.techText}>{item.title}</Text>
        <Text style={styles.techDescription}>{item.description}</Text>
    </TouchableOpacity>
));

const HomeScreen = ({ navigation }) => {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [chartLoading, setChartLoading] = useState(true);
    const [userData, setUserData] = useState({
        name: '',
        todayStudyTime: 0,
        streak: 0,
        progress: 0,
        weeklyData: [],
        recommendations: [],
    });
    const [chartData, setChartData] = useState(null);

    // 사용자 정보 가져오기
    const fetchUserData = useCallback(async () => {
        try {
            setLoading(true);

            // JWT 토큰 가져오기
            const token = await AsyncStorage.getItem('userToken');
            if (!token) {
                Alert.alert('오류', '토큰이 없습니다. 다시 로그인 해주세요.');
                navigation.navigate('Login');
                return;
            }

            // JWT 토큰 디코딩 (사용자 ID 추출)
            const userId = JSON.parse(atob(token.split('.')[1])).id;
            console.log('현재 로그인한 사용자 ID:', userId);

            // 사용자 정보 API 호출
            const response = await api.get(`/api/user/${userId}`);
            if (response.data.success) {
                const user = response.data.user;
                setUserData({
                    ...user,
                    weeklyData: user.weeklyData || [],
                    recommendations: user.recommendations || [],
                });

                if (user.weeklyData?.length > 0) {
                    setChartData({
                        labels: user.weeklyData.map((d) => d.date || ''),
                        datasets: [
                            {
                                data: user.weeklyData.map((d) => Math.min(d.studyTime || 0, 1440)),
                            },
                        ],
                    });
                }
            } else {
                throw new Error(response.data.message || '사용자 정보를 가져올 수 없습니다.');
            }
        } catch (error) {
            console.error('사용자 정보 로드 오류:', error);
            Alert.alert(
                '오류',
                error.response?.data?.message || '사용자 정보를 가져오는 데 실패했습니다.'
            );
        } finally {
            setLoading(false);
        }
    }, [navigation]);

    // 새로고침 핸들러
    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchUserData();
        setRefreshing(false);
    }, [fetchUserData]);

    // 데이터 초기 로드
    useFocusEffect(
        useCallback(() => {
            fetchUserData();
            return () => {
                setUserData({
                    name: '',
                    todayStudyTime: 0,
                    streak: 0,
                    progress: response.data.progress ?? 0,
                    weeklyData: [],
                    recommendations: [],
                });
                setChartData(null);
            };
        }, [fetchUserData])
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    colors={[theme.colors.primary]}
                    tintColor={theme.colors.primary}
                />
            }
            showsVerticalScrollIndicator={false}
        >
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.profileIcon}
                    onPress={() => navigation.navigate('Profile')}
                >
                    <Icon name="user" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Studymate</Text>
                <View style={styles.headerIcons}>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('Notifications')}
                        style={styles.iconButton}
                    >
                        <Icon name="bell" size={24} color={theme.colors.text} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('Settings')}
                        style={styles.iconButton}
                    >
                        <Icon name="settings" size={24} color={theme.colors.text} />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.progressSection}>
                <Text style={styles.welcomeText}>{userData.name}님, 환영합니다!</Text>
                <Text style={styles.studyTimeText}>
                    오늘 {Math.floor(userData.todayStudyTime / 60)}시간{' '}
                    {userData.todayStudyTime % 60}분 학습했어요
                </Text>
                <View style={styles.circularProgressContainer}>
                    <CircularProgress
                        size={200}
                        width={15}
                        fill={userData.progress}
                        tintColor={theme.colors.primary}
                        backgroundColor={theme.colors.surface}
                    >
                        {() => (
                            <Text style={styles.progressText}>
                                {userData.progress}%
                            </Text>
                        )}
                    </CircularProgress>
                </View>
                <TouchableOpacity style={styles.streakButton}>
                    <Text style={styles.streakButtonText}>
                        {userData.streak}일째 연속 공부중!
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={styles.buttonGrid}>
                <GridButton
                    title="개인 학습 시작"
                    icon="play"
                    // onPress={handleStartStudy}
                />
                <GridButton
                    title="그룹 학습 참여"
                    icon="users"
                    onPress={() => navigation.navigate('GroupList')}
                />
                <GridButton
                    title="학습 통계"
                    icon="bar-chart-2"
                    onPress={() => navigation.navigate('Statistics')}
                />
            </View>

            <View style={styles.techStack}>
                <Text style={styles.techTitle}>추천드리는 콘텐츠</Text>
                <View style={styles.techContainer}>
                    {userData.recommendations.map((item, index) => (
                        <TechIcon
                            key={index}
                            item={item}
                            onPress={() => navigation.navigate('ContentDetail', {
                                contentId: item.id
                            })}
                        />
                    ))}
                </View>
            </View>

            <View style={styles.graphContainer}>
                <Text style={styles.graphTitle}>최근 7일 공부량</Text>
                {!chartLoading && (
                    <LineChart
                        data={chartData}
                        width={width - 32}
                        height={220}
                        chartConfig={{
                            backgroundColor: '#ffffff',
                            backgroundGradientFrom: '#ffffff',
                            backgroundGradientTo: '#ffffff',
                            decimalPlaces: 0,
                            color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
                            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                        }}
                        bezier
                        withInnerLines={false}
                        style={{
                            marginVertical: 8,
                            borderRadius: 16
                        }}
                    />
                )}
            </View>

            <Text style={styles.bottomMessage}>
                큰 목표를 이루고 싶으면 하려할 것이지 마라. - 미상
            </Text>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.md,
        backgroundColor: theme.colors.surface,
        ...Platform.select({
            ios: theme.shadows.small,
            android: { elevation: 2 }
        }),
    },
    profileIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        ...Platform.select({
            ios: theme.shadows.small,
            android: { elevation: 1 }
        }),
    },
    headerTitle: {
        ...theme.typography.headlineSmall,
        color: theme.colors.text,
    },
    headerIcons: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
    },
    iconButton: {
        padding: theme.spacing.sm,
    },
    progressSection: {
        alignItems: 'center',
        padding: theme.spacing.xl,
    },
    welcomeText: {
        ...theme.typography.bodyLarge,
        color: theme.colors.text,
        marginBottom: theme.spacing.xs,
    },
    studyTimeText: {
        ...theme.typography.bodyMedium,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.lg,
    },
    circularProgressContainer: {
        marginBottom: theme.spacing.lg,
    },
    progressText: {
        ...theme.typography.headlineMedium,
        color: theme.colors.text,
        fontWeight: '600',
    },
    streakButton: {
        backgroundColor: theme.colors.primary,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.roundness.large,
        ...Platform.select({
            ios: theme.shadows.small,
            android: { elevation: 2 }
        }),
    },
    streakButtonText: {
        ...theme.typography.bodyLarge,
        color: theme.colors.white,
        fontWeight: '600',
    },
    buttonGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: theme.spacing.md,
    },
    gridButton: {
        width: '30%',
        aspectRatio: 1,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.roundness.medium,
        justifyContent: 'center',
        alignItems: 'center',
        ...Platform.select({
            ios: theme.shadows.small,
            android: { elevation: 2 }
        }),
    },
    gridButtonText: {
        ...theme.typography.bodyMedium,
        color: theme.colors.text,
        marginTop: theme.spacing.sm,
        textAlign: 'center',
    },
    techStack: {
        padding: theme.spacing.md,
    },
    techTitle: {
        ...theme.typography.headlineSmall,
        color: theme.colors.text,
        marginBottom: theme.spacing.md,
    },
    techContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.sm,
    },
    techItem: {
        flex: 1,
        minWidth: '48%',
        backgroundColor: theme.colors.surface,
        borderRadius: theme.roundness.medium,
        padding: theme.spacing.md,
        ...Platform.select({
            ios: theme.shadows.small,
            android: { elevation: 1 }
        }),
    },
    techIconBox: {
        width: 50,
        height: 50,
        backgroundColor: theme.colors.background,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
    },
    techText: {
        ...theme.typography.bodyMedium,
        color: theme.colors.text,
        marginBottom: theme.spacing.xs,
    },
    techDescription: {
        ...theme.typography.bodySmall,
        color: theme.colors.textSecondary,
    },
    graphContainer: {
        padding: theme.spacing.md,
    },
    graphTitle: {
        ...theme.typography.headlineSmall,
        color: theme.colors.text,
        marginBottom: theme.spacing.md,
    },
    graph: {
        borderRadius: theme.roundness.medium,
        ...Platform.select({
            ios: theme.shadows.small,
            android: { elevation: 2 }
        }),
    },
    bottomMessage: {
        ...theme.typography.bodyMedium,
        color: theme.colors.textTertiary,
        textAlign: 'center',
        fontStyle: 'italic',
        padding: theme.spacing.xl,
    }
});

HomeScreen.displayName = 'HomeScreen';

export default memo(HomeScreen);