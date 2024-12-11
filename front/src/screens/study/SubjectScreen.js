import React, { useState, useEffect } from 'react';
import {
    View,
    TextInput,
    TouchableOpacity,
    FlatList,
    Text,
    StyleSheet,
    Alert,
    ActivityIndicator,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import api from '../../api/api';
import refreshToken from '../../tokenRefresh/refreshToken'; // JWT 토큰 갱신 함수

const SubjectScreen = ({ navigation }) => {
    const [subjects, setSubjects] = useState([]);
    const [subjectName, setSubjectName] = useState('');
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [loading, setLoading] = useState(false);

    // 과목 목록 불러오기
    const fetchSubjects = async () => {
        setLoading(true);
        try {
            let token = await SecureStore.getItemAsync('userToken');
            if (!token) {
                token = await refreshToken(); // 토큰 갱신 시도
                if (!token) {
                    Alert.alert('오류', '로그인 정보가 필요합니다.');
                    navigation.navigate('Login'); // 로그인 화면으로 이동
                    return;
                }
            }

            const response = await api.get('/api/subjects', {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response?.data?.success) {
                setSubjects(response.data.subjects);
            } else {
                Alert.alert('오류', response.data.message || '과목 목록을 불러오는 데 실패했습니다.');
            }
        } catch (error) {
            console.error('과목 조회 오류:', error);
            Alert.alert('오류', '과목을 불러오는 중 문제가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubjects();
    }, []);

    // 과목 추가
    const addSubject = async () => {
        if (!subjectName) {
            return Alert.alert('유효성 검사 오류', '과목 이름을 입력해주세요.');
        }

        try {
            let token = JSON.parse(await SecureStore.getItemAsync('userToken'));
            if (!token) {
                token = await refreshToken(); // 토큰 갱신 시도
                if (!token) {
                    Alert.alert('오류', '로그인 정보가 필요합니다.');
                    navigation.navigate('Login'); // 로그인 화면으로 이동
                    return;
                }
            }

            const response = await api.post(
                '/api/subjects/add',
                { subject_name: subjectName },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response?.data?.success) {
                Alert.alert('성공', '과목이 추가되었습니다.');
                setSubjectName('');
                fetchSubjects(); // 목록 다시 불러오기
            } else {
                Alert.alert('오류', response.data.message || '과목 추가에 실패했습니다.');
            }
        } catch (error) {
            console.error('과목 추가 오류:', error);
            Alert.alert('오류', '과목 추가 중 문제가 발생했습니다.');
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0066FF" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <TextInput
                placeholder="과목 이름"
                value={subjectName}
                onChangeText={setSubjectName}
                style={styles.input}
            />
            <TouchableOpacity style={styles.addButton} onPress={addSubject}>
                <Text style={styles.addButtonText}>과목 추가</Text>
            </TouchableOpacity>

            <FlatList
                data={subjects}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={[
                            styles.subjectCard,
                            selectedSubject === item.id && styles.selectedSubjectCard, // 선택된 과목에 스타일 추가
                        ]}
                        onPress={() => {
                            setSelectedSubject(item.id); // 선택된 과목 상태 업데이트
                            navigation.navigate('Timer', { subjectId: item.id });
                        }}
                    >
                        <Text style={styles.subjectName}>
                            📚 {item.subject_name} {/* 아이콘 추가 */}
                        </Text>
                    </TouchableOpacity>
                )}
                keyExtractor={(item, index) => `${item.subject_name}-${index}`} // subject_name과 index를 결합하여 고유하게 생성
            />

            {/* 주간 목표로 이동하는 버튼 */}
            <TouchableOpacity
                style={styles.weeklyGoalsButton}
                onPress={() => navigation.navigate('WeeklyGoals')} // 주간 목표 페이지로 이동
            >
                <Text style={styles.weeklyGoalsButtonText}>📅 주간 목표</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    header: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 10,
        marginBottom: 10,
    },
    button: {
        backgroundColor: '#0066FF',
        borderRadius: 8,
        padding: 10,
        alignItems: 'center',
        marginBottom: 20,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    subjectItem: {
        padding: 15,
        backgroundColor: '#f9f9f9',
        marginBottom: 10,
        borderRadius: 8,
    },
    subjectName: {
        fontSize: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    subjectCard: {
        backgroundColor: '#ffffff',
        borderRadius: 20, // 카드 둥근 모서리
        padding: 15,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 5,  // 안드로이드에서 그림자 효과 적용
        marginVertical: 5, // 과목 카드 간 간격 추가
    },
    selectedSubjectCard: {
        backgroundColor: '#ffe6f1', // 선택된 과목의 배경색
    },
});

export default SubjectScreen;
