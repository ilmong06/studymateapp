import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import api from '../../api/api';

const HomeScreen = () => {
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                // SecureStore에서 저장된 토큰 가져오기
                const token = await SecureStore.getItemAsync('userToken');

                const response = await api.get('/api/auth/user-info', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!token) {
                    Alert.alert('오류', '로그인 토큰을 찾을 수 없습니다.');
                    setLoading(false);
                    return;
                }

                if (response.data && response.data.success) {
                    setUsername(response.data.username);
                } else {
                    Alert.alert('오류', '사용자 정보를 가져오지 못했습니다.');
                }
            } catch (error) {
                console.error('사용자 정보 가져오기 오류:', error);
                Alert.alert('오류', '사용자 정보를 가져오는 중 문제가 발생했습니다.');
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, []);

    if (loading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#0066FF" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.usernameText}>안녕하세요, {username}님!</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    usernameText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
});

export default HomeScreen;
