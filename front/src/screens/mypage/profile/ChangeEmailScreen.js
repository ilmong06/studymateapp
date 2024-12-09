import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import axios from "axios";

const BASE_URL = 'http://121.127.165.43:3000';


// axios 인스턴스 생성
const api = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
});

const ChangeEmailScreen = ({ route, navigation }) => {
    const { userId, sessionId } = route.params;
    const [formData, setFormData] = useState({
        email: '',
        verificationCode: ''
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [receivedCode, setReceivedCode] = useState('');
    const [isEmailVerified, setIsEmailVerified] = useState(false);
    const [timer, setTimer] = useState(0);

    useEffect(() => {
        let interval;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer(prev => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleSendAuthCode = async () => {
        if (!formData.email) {
            setErrors(prev => ({ ...prev, email: '이메일을 입력해주세요' }));
            return;
        }

        if (!validateEmail(formData.email)) {
            setErrors(prev => ({ ...prev, email: '올바른 이메일 형식이 아닙니다' }));
            return;
        }

        try {
            setLoading(true);
            const response = await api.post('/api/auth/send-code', {
                email: formData.email.trim(),
                userId,
                sessionId
            });

            if (response.data.success) {
                setReceivedCode(response.data.code);
                setTimer(180);
                Alert.alert('알림', '인증코드가 발송되었습니다.');
            }
        } catch (error) {
            Alert.alert('오류', error.response?.data?.message || '인증코드 발송에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyCode = async () => {
        if (!formData.verificationCode) {
            setErrors(prev => ({ ...prev, verificationCode: '인증코드를 입력해주세요' }));
            return;
        }

        try {
            setLoading(true);
            if (formData.verificationCode === receivedCode) {
                setIsEmailVerified(true);
                Alert.alert('성공', '이메일이 인증되었습니다.');
                setErrors(prev => ({ ...prev, verificationCode: '' }));
            } else {
                setErrors(prev => ({ ...prev, verificationCode: '인증코드가 일치하지 않습니다' }));
            }
        } catch (error) {
            Alert.alert('오류', '인증 처리 중 문제가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleChangeEmail = async () => {
        if (!isEmailVerified) {
            Alert.alert('알림', '이메일 인증을 완료해주세요.');
            return;
        }

        try {
            setLoading(true);
            const response = await api.put('/api/user/change-email', {
                email: formData.email.trim(),
                userId,
            });

            if (response.data.success) {
                Alert.alert('성공', '이메일이 변경되었습니다.', [
                    {
                        text: '확인',
                        onPress: () => navigation.navigate('MainTab')
                    }
                ]);
            }
        } catch (error) {
            Alert.alert('오류', error.response?.data?.message || '이메일 변경에 실패했습니다.');
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
                <Text style={styles.headerTitle}>이메일 변경</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.content}>
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>이메일</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.email}
                        onChangeText={(text) => {
                            setFormData(prev => ({ ...prev, email: text }));
                            setErrors(prev => ({ ...prev, email: '' }));
                        }}
                        placeholder="새로운 이메일을 입력하세요"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        editable={!loading}
                    />
                    {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
                </View>

                <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleSendAuthCode}
                    disabled={loading || isEmailVerified}
                >
                    <Text style={styles.buttonText}>
                        {receivedCode ? '인증코드 재발송' : '인증코드 발송'}
                    </Text>
                </TouchableOpacity>

                {receivedCode && (
                    <View style={styles.inputContainer}>
                        <View style={styles.labelContainer}>
                            <Text style={styles.label}>인증코드</Text>
                            {timer > 0 && (
                                <Text style={styles.timer}>
                                    {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}
                                </Text>
                            )}
                        </View>
                        <TextInput
                            style={styles.input}
                            value={formData.verificationCode}
                            onChangeText={(text) => {
                                setFormData(prev => ({ ...prev, verificationCode: text }));
                                setErrors(prev => ({ ...prev, verificationCode: '' }));
                            }}
                            placeholder="인증코드를 입력하세요"
                            keyboardType="number-pad"
                            editable={!loading && !isEmailVerified}
                        />
                        {errors.verificationCode && (
                            <Text style={styles.errorText}>{errors.verificationCode}</Text>
                        )}
                    </View>
                )}

                {receivedCode && !isEmailVerified && (
                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleVerifyCode}
                        disabled={loading}
                    >
                        <Text style={styles.buttonText}>인증코드 확인</Text>
                    </TouchableOpacity>
                )}

                {isEmailVerified && (
                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleChangeEmail}
                        disabled={loading}
                    >
                        <Text style={styles.buttonText}>이메일 변경하기</Text>
                    </TouchableOpacity>
                )}
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
    labelContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 8,
    },
    timer: {
        fontSize: 14,
        color: '#FF3B30',
        fontWeight: '600',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
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
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 12,
    }
});

export default ChangeEmailScreen;