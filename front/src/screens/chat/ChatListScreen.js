import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Alert } from 'react-native';
import api from '../../api/api';

const ChatListScreen = () => {
    const [chatRooms, setChatRooms] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchChatRooms = async () => {
        try {
            const response = await api.get('/api/chat/rooms'); // 서버의 엔드포인트 호출
            setChatRooms(response.data.chatRooms);
        } catch (error) {
            console.error('채팅방 데이터 불러오기 오류:', error.response?.data || error.message);
            Alert.alert('오류', '채팅방 데이터를 가져오는 중 문제가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchChatRooms();
    }, []);

    const renderItem = ({ item }) => (
        <View style={styles.chatRoom}>
            <Text style={styles.chatRoomName}>{item.name}</Text>
            <Text style={styles.lastMessage}>{item.lastMessage}</Text>
            <Text style={styles.unreadCount}>읽지 않은 메시지: {item.unreadCount}</Text>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <Text>Loading...</Text>
            </View>
        );
    }

    return (
        <FlatList
            data={chatRooms}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.container}
        />
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
    },
    chatRoom: {
        marginBottom: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
    },
    chatRoomName: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    lastMessage: {
        marginTop: 8,
        color: '#666',
    },
    unreadCount: {
        marginTop: 8,
        fontWeight: 'bold',
        color: '#0066FF',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default ChatListScreen;
