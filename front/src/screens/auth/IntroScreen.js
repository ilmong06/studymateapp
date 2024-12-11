import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    Image,
    ActivityIndicator,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import api from '../../api/api';

const IntroScreen = ({ navigation }) => {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAutoLogin = async () => {
            try {
                // SecureStore에서 토큰 가져오기
                const accessToken = await SecureStore.getItemAsync('userToken');
                const refreshToken = await SecureStore.getItemAsync('refreshToken');

                if (!accessToken) {
                    console.log('Access Token이 없습니다. Refresh Token 확인 중...');
                    if (!refreshToken) {
                        console.log('Refresh Token도 없습니다. 자동 로그인 중단.');
                        return; // 토큰이 없으면 자동 로그인을 수행하지 않음
                    }

                    // Access Token 갱신 시도
                    const response = await api.post('/auth/refresh', { refreshToken });

                    if (response.data && response.data.success) {
                        const newAccessToken = response.data.accessToken;
                        await SecureStore.setItemAsync('userToken', newAccessToken);
                        console.log('Access Token 갱신 성공.');
                    } else {
                        console.log('Refresh Token 갱신 실패:', response.data.message);
                        return;
                    }
                }

                // Access Token이 존재하거나 갱신되었다면 홈 화면으로 이동
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'HomeTabs' }], // Stack.Navigator에 등록된 이름과 일치시킵니다.
                });
            } catch (error) {
                console.error('자동 로그인 체크 실패:', error);
            }
        };

        checkAutoLogin();
    }, []);

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <ActivityIndicator size="large" color="#0066FF" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>StudyMate</Text>

                <View style={styles.imageContainer}>
                    <Image
                        source={require('../../../assets/intro.png')}
                        style={styles.image}
                    />
                </View>

                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={[styles.button, styles.loginButton]}
                        onPress={() => navigation.navigate('Login')}
                    >
                        <Text style={[styles.buttonText, styles.loginText]}>로그인</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, styles.signupButton]}
                        onPress={() => navigation.navigate('SignUp')}
                    >
                        <Text style={[styles.buttonText, styles.signupText]}>회원가입</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#0066FF',
        marginBottom: 40,
    },
    imageContainer: {
        marginBottom: 60,
    },
    image: {
        width: 120,
        height: 120,
        resizeMode: 'contain',
    },
    buttonContainer: {
        width: '100%',
        gap: 10,
    },
    button: {
        width: '100%',
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loginButton: {
        backgroundColor: '#0066FF',
    },
    signupButton: {
        backgroundColor: '#4CAF50',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    loginText: {
        color: '#FFFFFF',
    },
    signupText: {
        color: '#FFFFFF',
    },
});

export default IntroScreen;