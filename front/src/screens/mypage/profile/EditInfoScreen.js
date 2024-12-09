import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    Alert, ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const BASE_URL = 'http://121.127.165.43:3000';

// axios 인스턴스 생성
const api = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
});

const EditInfoScreen = ({ navigation }) => {
    const [activeTab, setActiveTab] = useState('email');
    const [formData, setFormData] = useState({
        userId: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);

    const validateForm = () => {
        const newErrors = {};
        if (!formData.userId.trim()) {
            newErrors.userId = '아이디를 입력해주세요';
        }
        if (!formData.password) {
            newErrors.password = '비밀번호를 입력해주세요';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        try {
            setLoading(true);
            const response = await api.post('/api/auth/login', {
                userId: formData.userId.trim(),
                password: formData.password
            });

            if (response.data.success) {
                if (activeTab === 'email') {
                    navigation.navigate('ChangeEmail', {
                        userId: formData.userId,
                        sessionId: response.data.sessionId
                    });
                } else {
                    navigation.navigate('ResetPassword', {
                        userId: formData.userId,
                        sessionId: response.data.sessionId
                    });
                }
            }
        } catch (error) {
            Alert.alert('오류', error.response?.data?.message || '인증에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-left" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>정보 수정</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'email' && styles.activeTab]}
                    onPress={() => setActiveTab('email')}
                >
                    <Text style={[styles.tabText, activeTab === 'email' && styles.activeTabText]}>
                        이메일 변경
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'password' && styles.activeTab]}
                    onPress={() => setActiveTab('password')}
                >
                    <Text style={[styles.tabText, activeTab === 'password' && styles.activeTabText]}>
                        비밀번호 변경
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>아이디</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.userId}
                        onChangeText={(text) => {
                            setFormData(prev => ({ ...prev, userId: text }));
                            setErrors(prev => ({ ...prev, userId: '' }));
                        }}
                        placeholder="아이디를 입력하세요"
                        autoCapitalize="none"
                        editable={!loading}
                    />
                    {errors.userId && <Text style={styles.errorText}>{errors.userId}</Text>}
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>비밀번호</Text>
                    <View style={styles.passwordContainer}>
                        <TextInput
                            style={[styles.input, { flex: 1 }]}
                            value={formData.password}
                            onChangeText={(text) => {
                                setFormData(prev => ({ ...prev, password: text }));
                                setErrors(prev => ({ ...prev, password: '' }));
                            }}
                            placeholder="비밀번호를 입력하세요"
                            secureTextEntry={!showPassword}
                            editable={!loading}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                            <Icon name={showPassword ? "eye" : "eye-off"} size={20} color="#666" />
                        </TouchableOpacity>
                    </View>
                    {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
                </View>

                <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>
                            {activeTab === 'email' ? '이메일 변경하기' : '비밀번호 변경하기'}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    tabContainer: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    tab: {
        flex: 1,
        paddingVertical: 16,
        alignItems: 'center',
    },
    activeTab: {
        borderBottomWidth: 2,
        borderBottomColor: '#0066FF',
    },
    tabText: {
        fontSize: 16,
        color: '#666',
    },
    activeTabText: {
        color: '#0066FF',
        fontWeight: '600',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    inputContainer: {
        marginBottom: 16,
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 12,
    },
    errorText: {
        color: '#FF3B30',
        fontSize: 12,
        marginTop: 4,
    },
    button: {
        backgroundColor: '#0066FF',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 24,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default EditInfoScreen;