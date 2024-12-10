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

    // JWT 토큰 유효성 검사
    const checkToken = async () => {
        try {
            const token = await SecureStore.getItemAsync('userToken');
            if (token) {
                const response = await api.get('/api/auth/check-token'); // 토큰 유효성 검증 API 호출
                if (response.data.success) {
                    // 유효하면 홈 화면으로 이동
                    navigation.reset({
                        index: 0,
                        routes: [{ name: 'Home' }],
                    });
                    return;
                }
            }
        } catch (error) {
            console.log('자동 로그인 실패:', error.message);
        }
        setLoading(false); // 유효하지 않으면 로딩 종료
    };

    useEffect(() => {
        checkToken();
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
