import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Text, TouchableOpacity, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import api from '../../api/api';
import refreshToken from '../../tokenRefresh/refreshToken'; // JWT 갱신 함수

const WritePostScreen = ({ navigation }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);

    const handleComplete = async () => {
        if (!title.trim() || !content.trim()) {
            Alert.alert('오류', '제목과 내용을 입력해주세요.');
            return;
        }

        setLoading(true);

        try {
            let token = JSON.parse(await SecureStore.getItemAsync('userToken'));
            if (!token) {
                token = await refreshToken(); // 토큰 갱신 시도
                if (!token) {
                    Alert.alert('오류', '로그인이 필요합니다.');
                    navigation.navigate('Intro');
                    return;
                }
            }

            const response = await api.post(
                '/api/post/createPosts',
                { title, content },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response?.data?.success) {
                Alert.alert('성공', '글이 성공적으로 등록되었습니다.', [
                    { text: '확인', onPress: () => navigation.goBack() },
                ]);
            } else {
                Alert.alert('오류', response.data.message || '글 등록에 실패했습니다.');
            }
        } catch (error) {
            console.error('글 등록 오류:', error);
            Alert.alert('오류', '글 등록 중 문제가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.closeButton}>✕</Text>
                </TouchableOpacity>
                <Text style={styles.title}>글쓰기</Text>
                <TouchableOpacity
                    onPress={handleComplete}
                    disabled={loading}
                    style={[styles.completeButton, loading && styles.disabledButton]}
                >
                    <Text style={styles.completeButtonText}>{loading ? '저장 중...' : '완료'}</Text>
                </TouchableOpacity>
            </View>
            <TextInput
                style={styles.input}
                placeholder="제목"
                value={title}
                onChangeText={setTitle}
                editable={!loading}
            />
            <TextInput
                style={styles.textArea}
                placeholder="내용"
                value={content}
                onChangeText={setContent}
                multiline
                editable={!loading}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    closeButton: {
        fontSize: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    completeButton: {
        backgroundColor: '#007bff',
        paddingVertical: 5,
        paddingHorizontal: 15,
        borderRadius: 5,
    },
    completeButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    disabledButton: {
        backgroundColor: '#ccc',
    },
    input: {
        height: 40,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 5,
        marginBottom: 10,
        paddingLeft: 8,
    },
    textArea: {
        height: 100,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 5,
        marginBottom: 10,
        paddingLeft: 8,
        paddingTop: 8,
    },
});

export default WritePostScreen;
