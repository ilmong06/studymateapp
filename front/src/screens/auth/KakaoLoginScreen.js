import React from 'react';
import { View, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import api from '../../api/api';
import * as SecureStore from "expo-secure-store";

const KakaoLoginScreen = ({ navigation }) => {
    // 웹뷰에서 전달받은 URL에서 인증 코드 추출
    const handleLoginProgress = async (data) => {
        const codeParam = "code=";
        const startIndex = data.indexOf(codeParam);
        if (startIndex !== -1) {
            const authCode = data.substring(startIndex + codeParam.length);
            console.log('Extracted Authorization Code:', authCode);
            await sendCodeToBackend(authCode); // 인증 코드를 백엔드로 전송
        }
    };

    // 백엔드로 인증 코드 전송
    const sendCodeToBackend = async (code) => {
        try {
            console.log('Authorization code being sent to backend:', code);

            // API 요청
            const response = await api.get(`/api/auth/kakao-login`, {
                params: { code },
            });

            console.log('Response from backend:', response.data);

            // 로그인 성공 시 토큰 저장
            const { token } = response.data;

            await SecureStore.setItemAsync('userToken', JSON.stringify(token));

            // 홈 화면으로 이동
            navigation.reset({
                index: 0,
                routes: [{ name: 'HomeTabs' }],
            });
        } catch (error) {
            console.error('Error connecting to backend:', error.response?.data || error.message);
            Alert.alert('로그인 실패', '백엔드와 연결하는 중 오류가 발생했습니다.');
        }
    };

    return (
        <View style={{ flex: 1 }}>
            <WebView
                originWhitelist={['*']}
                scalesPageToFit={false}
                style={{ marginTop: 30 }}
                source={{
                    uri: 'https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=dec0fe3fa7148e069e0f372f0ce6f847&redirect_uri=https://auth.expo.io/@wovlf02/frontend',
                }}
                injectedJavaScript={`window.ReactNativeWebView.postMessage("this is message from web");`}
                javaScriptEnabled={true}
                onMessage={(event) => {
                    handleLoginProgress(event.nativeEvent.url); // 인증 코드 처리
                }}
            />
        </View>
    );
};

export default KakaoLoginScreen;