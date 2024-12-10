import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/api'; // API 설정 파일
import { useNavigation } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';

const ChatMainScreen = () => {
    const [chatRooms, setChatRooms] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigation = useNavigation();

    // 토큰 갱신 함수
    const refreshToken = async () => {
        try {
            const refreshToken = await SecureStore.getItemAsync('refreshToken');
            const response = await api.post('/api/auth/refresh', { refreshToken: refreshToken });

            // 새로 받은 access_token을 저장
            await SecureStore.setItemAsync('accessToken', response.data.accessToken); // 직렬화하여 저장
            await SecureStore.setItemAsync('refreshToken', response.data.refreshToken); // 직렬화하여 저장
            return response.data.accessToken; // 갱신된 access_token 반환
        } catch (error) {
            console.error("토큰 갱신 실패:", error);
            throw new Error("토큰 갱신에 실패했습니다.");
        }
    };

    // 채팅방 목록을 가져오는 함수
    const fetchChatRooms = async () => {
        setLoading(true);
        try {
            let refresh_token = await SecureStore.getItemAsync('refresh_token');
            refresh_token = JSON.parse(refresh_token); // 역직렬화하여 사용

            if (!refresh_token) {
                // 만약 accessToken이 없다면 갱신 시도
                refresh_token = await refreshToken();
            }

            const response = await api.get('/api/chat/chat-rooms', {
                headers: {
                    Authorization: `Bearer ${refresh_token}`,
                },
            });

            if (response.data.success) {
                setChatRooms(response.data.chatRooms);
            } else {
                Alert.alert('알림', '채팅방을 가져오는 데 실패했습니다.');
            }
        } catch (error) {
            console.error('채팅방 가져오기 오류:', error);
            Alert.alert('알림', '채팅방을 가져오는 데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    // 채팅방을 선택했을 때
    const handleChatRoomPress = (chatRoomId) => {
        navigation.navigate('ChatRoom', { chatRoomId });
    };

    useEffect(() => {
        fetchChatRooms();
    }, []);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>채팅</Text>
                <TouchableOpacity
                    style={styles.createButton}
                    onPress={() => navigation.navigate('CreateChatRoom')}
                >
                    <Ionicons name="add" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#0000ff" />
            ) : (
                <FlatList
                    data={chatRooms}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.chatRoom}
                            onPress={() => handleChatRoomPress(item.id)}
                        >
                            <Text style={styles.chatRoomName}>{item.name || '1:1 채팅'}</Text>
                            <Text style={styles.createdAt}>{new Date(item.created_at).toLocaleDateString()}</Text>
                        </TouchableOpacity>
                    )}
                    contentContainerStyle={styles.chatRoomList}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    createButton: {
        backgroundColor: '#0066FF',
        padding: 10,
        borderRadius: 50,
    },
    chatRoomList: {
        flexGrow: 1,
    },
    chatRoom: {
        backgroundColor: '#f5f5f5',
        marginBottom: 10,
        padding: 15,
        borderRadius: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    chatRoomName: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    createdAt: {
        fontSize: 12,
        color: '#888',
    },
});

export default ChatMainScreen;
