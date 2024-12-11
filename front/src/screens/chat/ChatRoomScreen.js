import React, { useState, useEffect, useRef } from 'react';
import { View, FlatList, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import api from '../../api/api';
import { useRoute } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import { io } from 'socket.io-client';
import refreshToken from '../../tokenRefresh/refreshToken';

const ChatRoomScreen = () => {
    const route = useRoute();
    const { chatRoomId } = route.params;
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [socket, setSocket] = useState(null);
    const [userId, setUserId] = useState(null);
    const flatListRef = useRef(null);

    useEffect(() => {
        const initializeSocket = async () => {
            const token = JSON.parse(await SecureStore.getItemAsync('userToken'));
            const storedUserId = await SecureStore.getItemAsync('userId');
            setUserId(storedUserId);

            const socketInstance = io('http://121.127.165.43:3000', {
                auth: { token: `Bearer ${token}` },
            });

            socketInstance.on('connect', () => {
                console.log('Socket connected');
                socketInstance.emit('joinRoom', { chatRoomId });
            });

            socketInstance.on('newMessage', (message) => {
                console.log('New message received:', message);
                setMessages((prevMessages) => [...prevMessages, message]);
                scrollToBottom();
            });

            socketInstance.on('disconnect', () => {
                console.log('Socket disconnected');
            });

            setSocket(socketInstance);
        };

        initializeSocket();

        return () => {
            if (socket) {
                socket.disconnect();
            }
        };
    }, [chatRoomId]);

    useEffect(() => {
        fetchMessages();
    }, []);

    const fetchMessages = async () => {
        try {
            let token = JSON.parse(await SecureStore.getItemAsync('userToken'));
            if (!token) {
                console.log('Access Token이 없습니다. 갱신 시도 중...');
                token = await refreshToken();
            }
            const response = await api.get(`/api/chat/chat-rooms/${chatRoomId}/messages`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            console.log('Fetched Messages from API:', response.data.messages);

            if (response.data.success) {
                setMessages(response.data.messages);
                scrollToBottom();
            } else {
                Alert.alert('알림', response.data.message || '메시지를 가져오는 데 실패했습니다.');
            }
        } catch (error) {
            console.error('메시지 가져오기 오류:', error);
            Alert.alert('알림', '메시지를 가져오는 중 문제가 발생했습니다.');
        }
    };

    const sendMessage = () => {
        if (!newMessage.trim()) return;

        const messagePayload = {
            chatRoomId,
            content: newMessage,
        };

        socket.emit('sendMessage', messagePayload, (response) => {
            if (response.success) {
                setMessages((prevMessages) => [...prevMessages, response.data]);
                scrollToBottom();
            } else {
                Alert.alert('알림', '메시지 전송에 실패했습니다.');
            }
        });

        setNewMessage('');
    };

    const scrollToBottom = () => {
        flatListRef.current?.scrollToEnd({ animated: true });
    };

    const renderMessage = ({ item }) => {
        const isOwnMessage = item.sender_id.toString() === userId;

        return (
            <View
                style={{
                    flexDirection: isOwnMessage ? 'row-reverse' : 'row',
                    alignItems: 'center',
                    marginVertical: 5,
                }}
            >
                <View
                    style={[
                        styles.messageContainer,
                        isOwnMessage ? styles.ownMessage : styles.otherMessage,
                    ]}
                >
                    <Text style={styles.messageContent}>{item.content}</Text>
                </View>
                <Text style={styles.messageTime}>
                    {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.container}
        >
            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderMessage}
                contentContainerStyle={styles.messageList}
                onContentSizeChange={scrollToBottom}
                onLayout={scrollToBottom}
            />
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    value={newMessage}
                    onChangeText={setNewMessage}
                    placeholder="메시지를 입력하세요"
                    placeholderTextColor="#999"
                />
                <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
                    <Text style={styles.sendButtonText}>전송</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9f9f9',
    },
    messageList: {
        paddingHorizontal: 10,
        paddingVertical: 5,
    },
    messageContainer: {
        maxWidth: '70%',
        padding: 10,
        borderRadius: 10,
    },
    ownMessage: {
        backgroundColor: '#DCF8C6',
        borderTopRightRadius: 0,
    },
    otherMessage: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ccc',
        borderTopLeftRadius: 0,
    },
    messageContent: {
        fontSize: 16,
    },
    messageTime: {
        fontSize: 10,
        color: '#888',
        marginHorizontal: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 10,
        borderTopWidth: 1,
        borderColor: '#ddd',
        backgroundColor: '#fff',
    },
    input: {
        flex: 1,
        height: 40,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 20,
        paddingHorizontal: 10,
        marginRight: 10,
        backgroundColor: '#f9f9f9',
    },
    sendButton: {
        height: 40,
        backgroundColor: '#0066FF',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    sendButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default ChatRoomScreen;
