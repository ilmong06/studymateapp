import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import api from '../../api/api';
import refreshToken from '../../tokenRefresh/refreshToken';

const CheckUserInfoScreen = ({ route, navigation }) => {
    const { userId } = route.params;
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchUserInfo = async () => {
        setLoading(true);
        try {
            let token = JSON.parse(await SecureStore.getItemAsync('userToken'));
            if (!token) {
                token = await refreshToken(); // 토큰 갱신 시도
                if (!token) {
                    Alert.alert('오류', '로그인이 필요합니다.', [
                        { text: '확인', onPress: () => navigation.navigate('IntroScreen') },
                    ]);
                    return;
                }
            }

            const response = await api.get(`/api/user/${userId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response?.data?.success) {
                setUser(response.data.user); // API에서 반환된 사용자 정보 저장
            } else {
                Alert.alert('오류', '사용자 정보를 가져오는 데 실패했습니다.');
            }
        } catch (error) {
            console.error('사용자 정보 조회 오류:', error);
            Alert.alert('오류', '사용자 정보를 가져오는 중 문제가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUserInfo();
    }, [userId]);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007bff" />
                <Text style={styles.loadingText}>로딩 중...</Text>
            </View>
        );
    }

    if (!user) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>사용자 정보를 불러올 수 없습니다.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>개인정보 확인</Text>
            <View style={styles.infoCard}>
                <View style={styles.infoContainer}>
                    <Text style={styles.label}>아이디:</Text>
                    <Text style={styles.info}>{user.id}</Text>
                </View>
                <View style={styles.infoContainer}>
                    <Text style={styles.label}>이름:</Text>
                    <Text style={styles.info}>{user.name}</Text>
                </View>
                <View style={styles.infoContainer}>
                    <Text style={styles.label}>생년월일:</Text>
                    <Text style={styles.info}>{user.birthdate || '정보 없음'}</Text>
                </View>
                <View style={styles.infoContainer}>
                    <Text style={styles.label}>휴대전화번호:</Text>
                    <Text style={styles.info}>{user.phone || '정보 없음'}</Text>
                </View>
                <View style={styles.infoContainer}>
                    <Text style={styles.label}>이메일:</Text>
                    <Text style={styles.info}>{user.email || '정보 없음'}</Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        padding: 16,
        alignItems: 'center',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#6c757d',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#007bff',
    },
    infoCard: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    infoContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    label: {
        fontWeight: 'bold',
        fontSize: 16,
        color: '#495057',
    },
    info: {
        fontSize: 16,
        color: '#212529',
    },
    errorText: {
        fontSize: 18,
        color: '#dc3545',
        textAlign: 'center',
    },
});

export default CheckUserInfoScreen;
