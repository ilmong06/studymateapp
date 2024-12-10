import React, { useState, useEffect } from 'react';
import { View, FlatList, Text, TextInput, Button, StyleSheet } from 'react-native';
import api from '../../api/api';
import { useRoute } from '@react-navigation/native';

const ChatRoomScreen = () => {
    const route = useRoute();
    const { chatRoomId } = route.params;
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');

    useEffect(() => {
        fetchMessages();
    }, []);

    const fetchMessages = async () => {
        try {
            const response = await api.get(`/api/messages/${chatRoomId}`);
            if (response.data.success) {
                setMessages(response.data.messages);
            }
        } catch (error) {
            console.error('메시지 가져오기 오류:', error);
        }
    };

    const sendMessage = async () => {
        if (!newMessage) return;

        try {
            await api.post('/api/messages', { chatRoomId, content: newMessage });
            setNewMessage('');
            fetchMessages();
        } catch (error) {
            console.error('메시지 전송 오류:', error);
        }
    };

    return (
        <View style={styles.container}>
            <FlatList
                data={messages}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <View style={styles.messageContainer}>
                        <Text>{item.username}: {item.content}</Text>
                    </View>
                )}
            />
            <TextInput
                style={styles.input}
                value={newMessage}
                onChangeText={setNewMessage}
                placeholder="메시지를 입력하세요"
            />
            <Button title="전송" onPress={sendMessage} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    messageContainer: {
        padding: 10,
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
    },
    input: {
        height: 40,
        borderColor: '#ccc',
        borderWidth: 1,
        marginBottom: 20,
        paddingHorizontal: 10,
    },
});

export default ChatRoomScreen;
