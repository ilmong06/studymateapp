import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Alert } from 'react-native';
import api from '../../api/api';
import { useNavigation } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';

const CreateChatRoomScreen = () => {
    const [chatRoomName, setChatRoomName] = useState('');
    const navigation = useNavigation();

    // 채팅방 생성 핸들러
    const handleCreateChatRoom = async () => {
        if (!chatRoomName) {
            Alert.alert('알림', '채팅방 이름을 입력해주세요.');
            return;
        }

        try {
            // SecureStore에서 accessToken 가져오기
            let refresh_token = await SecureStore.getItemAsync('refresh_token');
            if (!refreshToken) {
                Alert.alert('알림', '로그인 세션이 만료되었습니다. 다시 로그인해주세요.');
                return;
            }

            try {
                // JSON.parse 시도 전에 값이 올바른지 체크
                refresh_token = JSON.parse(refresh_token); // 역직렬화하여 사용
            } catch (parseError) {
                console.error("Invalid access token:", parseError);
                Alert.alert('알림', '토큰 정보가 올바르지 않습니다.');
                return;
            }

            // 채팅방 생성 API 호출
            const response = await api.post('/api/chat/chat-rooms',
                { name: chatRoomName },
                { headers: { Authorization: `Bearer ${refresh_token}` } } // Authorization 헤더에 토큰 포함
            );

            if (response.data.success) {
                Alert.alert('성공', '채팅방이 생성되었습니다.', [
                    {
                        text: '확인',
                        onPress: () => navigation.goBack(),
                    },
                ]);
            } else {
                Alert.alert('알림', '채팅방 생성에 실패했습니다.');
            }
        } catch (error) {
            console.error('채팅방 생성 오류:', error);
            Alert.alert('알림', '채팅방 생성에 실패했습니다.');
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
