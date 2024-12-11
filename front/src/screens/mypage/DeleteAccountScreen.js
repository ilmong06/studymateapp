import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import api from '../../api/api';
import refreshToken from '../../tokenRefresh/refreshToken';

const DeleteAccountScreen = ({ navigation }) => {
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleDeleteAccount = async () => {
        if (!password.trim()) {
            Alert.alert('오류', '비밀번호를 입력하세요.');
            return;
        }

        setLoading(true);

        try {
            let token = await SecureStore.getItemAsync('userToken');
            if (!token) {
                token = await refreshToken(); // 토큰 갱신 시도
                if (!token) {
                    Alert.alert('오류', '로그인이 필요합니다.');
                    navigation.navigate('Intro');
                    return;
                }
            }

            const response = await api.delete('/api/user/delete-user', {
                headers: { Authorization: `Bearer ${token}` },
                data: { password },
            });

            if (response?.data?.success) {
                Alert.alert('성공', '회원 탈퇴가 성공적으로 처리되었습니다.', [
                    {
                        text: '확인',
                        onPress: async () => {
                            await SecureStore.deleteItemAsync('userToken'); // 토큰 삭제
                            navigation.reset({
                                index: 0,
                                routes: [{ name: 'Intro' }],
                            });
                        },
                    },
                ]);
            } else {
                Alert.alert('실패', response.data.message || '회원 탈퇴에 실패했습니다.');
            }
        } catch (error) {
            console.error('회원 탈퇴 오류:', error);
            Alert.alert('오류', '회원 탈퇴 중 문제가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>회원탈퇴</Text>
            <TextInput
                style={styles.input}
                placeholder="비밀번호를 입력하세요."
                secureTextEntry
                value={password}
                onChangeText={setPassword}
            />
            <TouchableOpacity
                style={[styles.deleteButton, loading && styles.buttonDisabled]}
                onPress={handleDeleteAccount}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                ) : (
                    <Text style={styles.deleteButtonText}>회원탈퇴</Text>
                )}
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        padding: 16,
        justifyContent: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
        color: '#dc3545',
    },
    input: {
        height: 50,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 10,
        marginBottom: 15,
        paddingHorizontal: 15,
        backgroundColor: '#fff',
    },
    deleteButton: {
        backgroundColor: '#dc3545',
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    deleteButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default DeleteAccountScreen;
