import React, { useState, useEffect } from 'react';
import { View, Text, Button, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import api from '../../api/api'; // API 경로에 맞게 수정하세요.

const TimerPage = ({ route, navigation }) => {
    const { subjectId } = route.params;  // 네비게이션을 통해 전달된 subjectId
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [timerId, setTimerId] = useState(null);
    const [startTime, setStartTime] = useState(null);  // 타이머 시작 시간
    const [elapsedTime, setElapsedTime] = useState(0);  // 경과 시간 (초)
    const [pausedTime, setPausedTime] = useState(0);  // 타이머가 멈춘 시간 (초)

    useEffect(() => {
        // 타이머 상태 확인
        const checkTimerStatus = async () => {
            try {
                const token = await SecureStore.getItemAsync('userToken');
                if (token) {
                    const response = await api.get('/api/timers', {
                        headers: { Authorization: `Bearer ${token}` },
                    });

                    // 현재 활성화된 타이머 확인
                    const activeTimer = response.data.timers.find(timer => timer.subject_id === subjectId && timer.is_running);
                    if (activeTimer) {
                        setIsTimerRunning(true);
                        setTimerId(activeTimer.id);  // 활성화된 타이머 ID 저장
                        setStartTime(new Date(activeTimer.start_time));  // 타이머 시작 시간 설정
                    }
                }
            } catch (error) {
                console.error('타이머 상태 조회 오류:', error);
                Alert.alert('오류', '타이머 상태를 가져오는 데 문제가 발생했습니다.');
            }
        };

        checkTimerStatus();
    }, [subjectId]);

    useEffect(() => {
        // 타이머가 실행 중이라면, 경과 시간 업데이트
        let interval;
        if (isTimerRunning && startTime) {
            interval = setInterval(() => {
                const currentTime = new Date();
                const elapsedSeconds = Math.floor((currentTime - startTime) / 1000) + pausedTime;  // 경과 시간 계산
                setElapsedTime(elapsedSeconds);
            }, 1000);
        }

        return () => {
            clearInterval(interval);  // 타이머 종료 시 interval 클리어
        };
    }, [isTimerRunning, startTime, pausedTime]);

    const startTimer = async () => {
        try {
            const token = await SecureStore.getItemAsync('userToken');
            if (token) {
                const response = await api.post('/api/timers/start', { subject_id: subjectId }, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (response.data.success) {
                    setIsTimerRunning(true);
                    setTimerId(response.data.timerId);  // 서버에서 반환된 타이머 ID 저장
                    setStartTime(new Date());  // 타이머 시작 시간을 현재 시간으로 설정
                    setPausedTime(elapsedTime);  // 이전 경과 시간을 기록
                } else {
                    Alert.alert('오류', response.data.message);
                }
            }
        } catch (error) {
            console.error('타이머 시작 오류:', error);
            Alert.alert('오류', '타이머를 시작하는 데 문제가 발생했습니다.');
        }
    };

    const stopTimer = async () => {
        try {
            const token = await SecureStore.getItemAsync('userToken');
            if (token && timerId) {
                const response = await api.post('/api/timers/stop', { id: timerId }, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (response.data.success) {
                    setIsTimerRunning(false);
                    setTimerId(null);  // 타이머 ID 초기화
                    setPausedTime(elapsedTime);  // 타이머 정지 시 경과 시간 저장
                } else {
                    Alert.alert('오류', response.data.message);
                }
            }
        } catch (error) {
            console.error('타이머 정지 오류:', error);
            Alert.alert('오류', '타이머를 정지하는 데 문제가 발생했습니다.');
        }
    };

    return (
        <View>
            <Text>과목 ID: {subjectId}</Text>
            <Text>{isTimerRunning ? '타이머가 실행 중입니다.' : '타이머가 정지되었습니다.'}</Text>
            <Text>경과 시간: {elapsedTime}초</Text> {/* 경과 시간 표시 */}
            <Button
                title={isTimerRunning ? '타이머 정지' : '타이머 시작'}
                onPress={isTimerRunning ? stopTimer : startTimer}
            />
            <Button title="뒤로 가기" onPress={() => navigation.goBack()} />
        </View>
    );
};

export default TimerPage;
