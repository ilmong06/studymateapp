import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import api from '../../api/api';

// 소셜 로그인 이미지 import
import NaverLogo from '../../../assets/naver.jpg';
import KakaoLogo from '../../../assets/kakao.png';


const LoginScreen = ({ navigation }) => {
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    // 폼 유효성 검사
    const validateForm = () => {
        if (!formData.username.trim() || !formData.password.trim()) {
            Alert.alert('오류', '아이디와 비밀번호를 입력해주세요.');
            return false;
        }
        return true;
    };

    // 로그인 처리
    const handleLogin = async () => {
        if (!validateForm()) return;

        try {
            setLoading(true);
            const response = await api.post('/api/auth/login', {
                username: formData.username.trim(),
                password: formData.password.trim(),
            });

            if (response.data.success) {
                const { accessToken, refreshToken } = response.data;

                // 토큰 저장
                await SecureStore.setItemAsync('userToken', accessToken);
                await SecureStore.setItemAsync('refreshToken', refreshToken);

                navigation.reset({
                    index: 0,
                    routes: [{ name: 'HomeTabs' }], // Stack.Navigator에 등록된 이름과 일치시킵니다.
                });
            } else {
                Alert.alert('로그인 실패', response.data.message);
            }
        } catch (error) {
            console.log('로그인 오류:', error);
            Alert.alert('로그인 실패', '아이디 또는 비밀번호가 일치하지 않습니다.');
        } finally {
            setLoading(false);
        }
    };


    // useEffect(() => {
    //     const checkAutoLogin = async () => {
    //         try {
    //             // SecureStore에서 토큰 가져오기
    //             const accessToken = await SecureStore.getItemAsync('userToken');
    //             const refreshToken = await SecureStore.getItemAsync('refreshToken');
    //
    //             if (!accessToken) {
    //                 console.log('Access Token이 없습니다. Refresh Token 확인 중...');
    //                 if (!refreshToken) {
    //                     console.log('Refresh Token도 없습니다. 자동 로그인 중단.');
    //                     return; // 토큰이 없으면 자동 로그인을 수행하지 않음
    //                 }
    //
    //                 // Access Token 갱신 시도
    //                 const response = await api.post('/auth/refresh', { refreshToken });
    //
    //                 if (response.data && response.data.success) {
    //                     const newAccessToken = response.data.accessToken;
    //                     await SecureStore.setItemAsync('userToken', newAccessToken);
    //                     console.log('Access Token 갱신 성공.');
    //                 } else {
    //                     console.log('Refresh Token 갱신 실패:', response.data.message);
    //                     return;
    //                 }
    //             }
    //
    //             // Access Token이 존재하거나 갱신되었다면 홈 화면으로 이동
    //             navigation.reset({
    //                 index: 0,
    //                 routes: [{ name: 'HomeTabs' }], // Stack.Navigator에 등록된 이름과 일치시킵니다.
    //             });
    //         } catch (error) {
    //             console.error('자동 로그인 체크 실패:', error);
    //         }
    //     };
    //
    //     checkAutoLogin();
    // }, []);



    // 소셜 로그인
    const handleNaverLogin = () => {
        navigation.navigate('NaverLogin');
    };

    const handleKakaoLogin = () => {
        navigation.navigate('KakaoLogin');
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.formContainer}
            >
                <View style={styles.contentContainer}>
                    <Text style={styles.title}>로그인</Text>

                    {/* 아이디 입력 */}
                    <View style={styles.inputContainer}>
                        <Ionicons name="person-outline" size={20} color="#666" />
                        <TextInput
                            style={styles.input}
                            placeholder="아이디를 입력하세요"
                            value={formData.username}
                            onChangeText={(text) =>
                                setFormData((prev) => ({ ...prev, username: text }))
                            }
                            autoCapitalize="none"
                        />
                    </View>

                    {/* 비밀번호 입력 */}
                    <View style={styles.inputContainer}>
                        <Ionicons name="lock-closed-outline" size={20} color="#666" />
                        <TextInput
                            style={styles.input}
                            placeholder="비밀번호를 입력하세요"
                            value={formData.password}
                            onChangeText={(text) =>
                                setFormData((prev) => ({ ...prev, password: text }))
                            }
                            secureTextEntry={!showPassword}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                            <Ionicons
                                name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                                size={20}
                                color="#666"
                            />
                        </TouchableOpacity>
                    </View>

                    {/* 로그인 버튼 */}
                    <TouchableOpacity
                        style={[styles.loginButton, loading && styles.buttonDisabled]}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.loginButtonText}>로그인</Text>
                        )}
                    </TouchableOpacity>

                    {/* 소셜 로그인 */}
                    <View style={styles.socialContainer}>
                        <TouchableOpacity style={styles.socialButton} onPress={handleNaverLogin}>
                            <Image source={NaverLogo} style={styles.socialLogo} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.socialButton} onPress={handleKakaoLogin}>
                            <Image source={KakaoLogo} style={styles.socialLogo} />
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    formContainer: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
    },
    contentContainer: {
        width: '100%',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 30,
        color: '#1A1A1A',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 10,
        marginBottom: 15,
        height: 50,
    },
    input: {
        flex: 1,
        marginLeft: 10,
        fontSize: 16,
    },
    loginButton: {
        backgroundColor: '#1A73E8',
        borderRadius: 8,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    loginButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    socialContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
        gap: 20,
    },
    socialButton: {
        width: 40,
        height: 40,
    },
    socialLogo: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain',
    },
});

export default LoginScreen;
