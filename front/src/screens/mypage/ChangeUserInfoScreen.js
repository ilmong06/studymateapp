import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import api from '../../api/api';
import refreshToken from '../../tokenRefresh/refreshToken';

const ChangeUserInfoScreen = ({ navigation }) => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (newPassword !== confirmNewPassword) {
            Alert.alert('오류', '변경할 비밀번호가 일치하지 않습니다.');
            return;
        }

        setLoading(true);
        try {
            let token = await SecureStore.getItemAsync('userToken');
            if (!token) {
                token = await refreshToken(); // 토큰 갱신 시도
                if (!token) {
                    Alert.alert('오류', '로그인이 필요합니다.');
                    return;
                }
            }

            const response = await api.post(
                '/api/user/update-user',
                {
                    username: username.trim() || undefined,
                    email: email.trim() || undefined,
                    currentPassword,
                    newPassword,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response?.data?.success) {
                Alert.alert('성공', '정보가 성공적으로 업데이트되었습니다.');
                navigation.goBack();
            } else {
                Alert.alert('실패', response?.data?.message || '정보 업데이트에 실패했습니다.');
            }
        } catch (error) {
            console.error('정보 업데이트 오류:', error);
            Alert.alert('오류', '정보 업데이트 중 문제가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.header}>정보 수정</Text>
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="아이디"
                    value={username}
                    onChangeText={setUsername}
                />
                <TextInput
                    style={styles.input}
                    placeholder="이메일"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                />
                <TextInput
                    style={styles.input}
                    placeholder="현재 비밀번호 입력"
                    secureTextEntry
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                />
                <TextInput
                    style={styles.input}
                    placeholder="변경할 비밀번호 입력"
                    secureTextEntry
                    value={newPassword}
                    onChangeText={setNewPassword}
                />
                <TextInput
                    style={styles.input}
                    placeholder="변경할 비밀번호 재입력"
                    secureTextEntry
                    value={confirmNewPassword}
                    onChangeText={setConfirmNewPassword}
                />
            </View>
            <TouchableOpacity
                style={[styles.saveButton, loading && styles.buttonDisabled]}
                onPress={handleSave}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                ) : (
                    <Text style={styles.saveButtonText}>수정완료</Text>
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
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
        color: '#007bff',
    },
    inputContainer: {
        marginBottom: 20,
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
    saveButton: {
        backgroundColor: '#007bff',
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default ChangeUserInfoScreen;
