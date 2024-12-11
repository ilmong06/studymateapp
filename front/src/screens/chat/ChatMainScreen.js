import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    StyleSheet,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import api from '../../api/api';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { io } from 'socket.io-client';
import refreshToken from "../../tokenRefresh/refreshToken";

const ChatMainScreen = () => {
    const [chatRooms, setChatRooms] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigation = useNavigation();
    const [socket, setSocket] = useState(null);

    // 채팅방 목록을 가져오는 함수
    const fetchChatRooms = async () => {
        setLoading(true);
        try {
            let accessToken = JSON.parse(await SecureStore.getItemAsync('userToken'));
            if (!accessToken) {
                accessToken = await refreshToken(); // 갱신 함수 호출
                if (!accessToken) return; // 갱신 실패 시 중단
            }

            const response = await api.get('/api/chat/chat-rooms', {
                headers: { Authorization: `Bearer ${accessToken}` },
            });

            if (response.data.success) {
                setChatRooms(response.data.chatRooms);
            } else {
                Alert.alert('알림', '채팅방을 가져오지 못했습니다.');
            }
        } catch (error) {
            console.error('채팅방 가져오기 오류:', error);
            Alert.alert('알림', '채팅방을 가져오는 중 문제가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    // 새로운 채팅방이 생성되었을 때 목록 업데이트
    const handleNewChatRoom = (newChatRoom) => {
        setChatRooms((prevChatRooms) => [newChatRoom, ...prevChatRooms]);
    };

    useEffect(() => {
        const setupSocket = async () => {
            let token = await SecureStore.getItemAsync('userToken');
            if (!token) {
                token = await refreshToken(); // 토큰 갱신 시도
            }
            const socketInstance = io('http://121.127.165.43:3000', {
                auth: { token },
            });
            setSocket(socketInstance);

            socketInstance.on('newChatRoom', handleNewChatRoom);

            return () => {
                socketInstance.disconnect();
            };
        };

        setupSocket();
    }, []);

    // 화면에 포커스될 때마다 채팅방 목록 갱신
    useFocusEffect(
        React.useCallback(() => {
            fetchChatRooms();
        }, [])
    );

    // 채팅방을 선택했을 때
    const handleChatRoomPress = (chatRoomId) => {
        navigation.navigate('ChatRoom', { chatRoomId });
    };

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
                <ActivityIndicator size="large" color="#0066FF" />
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
                            <Text style={styles.createdAt}>
                                {new Date(item.created_at).toLocaleString('ko-KR')}
                            </Text>
                        </TouchableOpacity>
                    )}
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
