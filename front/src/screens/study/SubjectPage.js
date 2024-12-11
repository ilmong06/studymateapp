import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, Alert, FlatList, Text } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import api from '../../api/api';

const SubjectPage = ({ navigation }) => {
    const [subjects, setSubjects] = useState([]);
    const [subjectName, setSubjectName] = useState('');

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
        <View>
            <TextInput
                placeholder="과목 이름"
                value={subjectName}
                onChangeText={setSubjectName}
            />
            <Button title="과목 추가" onPress={addSubject} />
         <FlatList
           data={subjects}
           renderItem={({ item }) => (
             <Text onPress={() => navigation.navigate('TimerPage', { subjectId: item.id })}>
               {item.subject_name}
             </Text>
           )}
           keyExtractor={(item) => item.id ? item.id.toString() : `${item.subject_name}-${item.created_at || Date.now()}`}  // id가 없을 경우 subject_name과 created_at을 결합, 없으면 현재 시간 사용
         />


        </View>
    );
};

export default SubjectPage;
