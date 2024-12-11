import React, { useState, useEffect } from 'react';
import { View, TextInput, Alert, FlatList, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import api from '../../api/api';

const SubjectPage = ({ navigation }) => {
    const [subjects, setSubjects] = useState([]);
    const [subjectName, setSubjectName] = useState('');
    const [selectedSubject, setSelectedSubject] = useState(null);  // 클릭한 과목을 저장

    const fetchSubjects = async () => {
        try {
            const token = await SecureStore.getItemAsync('userToken');
            if (token) {
                const response = await api.get('/api/subjects', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setSubjects(response.data.subjects);
            }
        } catch (error) {
            console.error('과목 조회 오류:', error);
            Alert.alert('오류', '과목을 가져오는 데 문제가 발생했습니다.');
        }
    };

    useEffect(() => {
        fetchSubjects();
    }, []);

    const addSubject = async () => {
        if (!subjectName) {
            return Alert.alert('오류', '과목 이름을 입력해주세요.');
        }

        try {
            const token = await SecureStore.getItemAsync('userToken');
            if (token) {
                await api.post(
                    '/api/subjects/add',
                    { subject_name: subjectName },
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );
                fetchSubjects();  // 과목 목록 다시 불러오기
                setSubjectName('');  // 입력값 초기화
            }
        } catch (error) {
            console.error('과목 추가 오류:', error);
            Alert.alert('오류', '과목을 추가하는 데 문제가 발생했습니다.');
        }
    };

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
                            navigation.navigate('TimerPage', { subjectId: item.id });
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
                onPress={() => navigation.navigate('WeeklyGoalsPage')} // 주간 목표 페이지로 이동
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
        backgroundColor: '#f8f8f8', // 부드러운 파스텔 배경색
        justifyContent: 'flex-start',  // 콘텐츠를 상단으로 배치
    },
    input: {
        height: 50,
        borderColor: '#ff66b2', // 부드러운 핑크색
        borderWidth: 1,
        borderRadius: 25, // 둥근 모서리
        paddingLeft: 20,
        marginTop: 50, // 인풋 필드 위쪽에 여백 추가
        marginBottom: 20,
        fontSize: 18,
        backgroundColor: '#ffffff', // 깨끗한 흰색
    },
    addButton: {
        backgroundColor: '#ff66b2', // 핑크색
        paddingVertical: 15,
        borderRadius: 25, // 둥근 버튼
        alignItems: 'center',
        marginBottom: 20,
    },
    addButtonText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
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
    subjectName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#ff66b2', // 핑크색 텍스트
    },
    weeklyGoalsButton: {
        backgroundColor: '#ff66b2', // 핑크색
        paddingVertical: 15,
        borderRadius: 25, // 둥근 버튼
        alignItems: 'center',
        marginBottom: 20,
    },
    weeklyGoalsButtonText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default SubjectPage;
