import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Alert } from 'react-native';
import api from '../../api/api';
import { useNavigation } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import refreshToken from "../../tokenRefresh/refreshToken";


const CreateChatRoomScreen = () => {
    const [chatRoomName, setChatRoomName] = useState('');
    const navigation = useNavigation();

    const handleCreateChatRoom = async () => {
        if (!chatRoomName.trim()) {
            Alert.alert('알림', '채팅방 이름을 입력해주세요.');
            return;
        }

        try {
            // Access Token 가져오기
            let accessToken = JSON.parse(await SecureStore.getItemAsync('userToken'));

            if (!accessToken) {
                // Access Token 갱신 시도
                accessToken = await refreshToken();
                if (!accessToken) {
                    Alert.alert('알림', '로그인이 필요합니다.');
                    navigation.navigate('Login');
                    return;
                }
            }

            // 채팅방 생성 API 호출
            const response = await api.post(
                '/api/chat/chat-rooms',
                { name: chatRoomName },
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );

            // 서버 응답 확인
            if (response.data.success) {
                Alert.alert('성공', '채팅방이 생성되었습니다.', [
                    {
                        text: '확인',
                        onPress: () => navigation.goBack(),
                    },
                ]);
            } else {
                Alert.alert('알림', response.data.message || '채팅방 생성에 실패했습니다.');
            }
        } catch (error) {
            console.error('채팅방 생성 오류:', error);

            if (error.response?.status === 401) {
                Alert.alert('알림', '로그인 세션이 만료되었습니다. 다시 로그인해주세요.');
                navigation.navigate('Login');
            } else {
                Alert.alert('알림', error.response?.data?.message || '채팅방 생성에 실패했습니다.');
            }
        }
    };



    return (
        <View style={styles.container}>
            <TextInput
                style={styles.input}
                placeholder="채팅방 이름"
                value={chatRoomName}
                onChangeText={setChatRoomName}
            />
            <Button title="채팅방 생성" onPress={handleCreateChatRoom} />
        </View>
    );
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    input: {
        height: 40,
        borderColor: '#ccc',
        borderWidth: 1,
        marginBottom: 20,
        paddingHorizontal: 10,
    },
});


export default CreateChatRoomScreen;