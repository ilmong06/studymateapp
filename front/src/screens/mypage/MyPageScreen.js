import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image, ActivityIndicator } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import api from '../../api/api';
import refreshToken from '../../tokenRefresh/refreshToken';

const MyPageScreen = ({ navigation }) => {
    const [userName, setUserName] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [loading, setLoading] = useState(true);

    // 사용자 정보 가져오기
    const fetchUserInfo = async () => {
        setLoading(true);
        try {
            let token = await SecureStore.getItemAsync('userToken');
            if (!token) {
                token = await refreshToken(); // 토큰 갱신 시도
                if (!token) {
                    Alert.alert('오류', '로그인이 필요합니다.');
                    navigation.navigate('Intro');
                    return;
                }
            }

            const response = await api.get('/api/user/getUserInfo', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response?.data?.success) {
                setUserName(response.data.name || '사용자 이름');
                setUserEmail(response.data.email || 'user@example.com');
            } else {
                Alert.alert('오류', response.data.message || '사용자 정보를 불러오지 못했습니다.');
            }
        } catch (error) {
            console.error('사용자 정보 조회 오류:', error);
            Alert.alert('오류', '사용자 정보를 가져오는 중 문제가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    // 로그아웃
    const handleLogout = async () => {
        setLoading(true);
        try {
            let token = await SecureStore.getItemAsync('userToken');
            if (!token) {
                token = await refreshToken(); // 토큰 갱신 시도
                if (!token) {
                    Alert.alert('오류', '로그인이 필요합니다.');
                    navigation.navigate('Intro');
                    return;
                }
            }

            const response = await api.post('/api/auth/logout', {}, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.data.message === 'Logout successful') {
                await SecureStore.deleteItemAsync('userToken'); // 토큰 제거
                navigation.navigate('Intro');
            } else {
                Alert.alert('로그아웃 실패', response.data.message || '로그아웃에 실패했습니다.');
            }
        } catch (error) {
            console.error('로그아웃 오류:', error);
            Alert.alert('로그아웃 실패', '서버와 통신 중 문제가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUserInfo();
    }, []);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0066FF" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.profileContainer}>
                <Image
                    source={require('../../../assets/default-profile.png')}
                    style={styles.profileImage}
                />
                <Text style={styles.profileName}>{userName}</Text>
                <Text style={styles.profileEmail}>{userEmail}</Text>
            </View>

            <View style={styles.menuContainer}>
                <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('CheckUserInfo')}>
                    <Text style={styles.menuText}>개인정보 확인</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('ChangeUserInfo')}>
                    <Text style={styles.menuText}>개인정보 수정</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
                    <Text style={styles.menuText}>로그아웃</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('DeleteAccount')}>
                    <Text style={styles.menuText}>회원탈퇴</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        padding: 16,
        paddingTop: 50,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    profileImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 10,
    },
    profileName: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    profileEmail: {
        fontSize: 14,
        color: '#6c757d',
    },
    menuContainer: {
        backgroundColor: '#fff',
        borderRadius: 10,
        paddingVertical: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    menuItem: {
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
    },
    menuText: {
        fontSize: 16,
        color: '#495057',
    },
});

export default MyPageScreen;
