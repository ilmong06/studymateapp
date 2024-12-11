import React, { useState, useEffect } from 'react';
import { View, Text, Button, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import api from '../../api/api';
import refreshToken from '../../tokenRefresh/refreshToken';

const TimerPage = ({ route, navigation }) => {
    const { subjectId } = route.params;
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [timerId, setTimerId] = useState(null);
    const [startTime, setStartTime] = useState(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [pausedTime, setPausedTime] = useState(0);

    useEffect(() => {
        const checkTimerStatus = async () => {
            try {
                let token = JSON.parse(await SecureStore.getItemAsync('userToken'));
                if (!token) {
                    token = await refreshToken();
                    if (!token) {
                        Alert.alert('오류', '로그인이 필요합니다.');
                        navigation.navigate('Login');
                        return;
                    }
                }

                const response = await api.get('/api/timer', {
                    headers: { Authorization: `Bearer ${token}` },
                });

                const activeTimer = response.data.timers.find(
                    (timer) => timer.subject_id === subjectId && timer.is_running
                );

                if (activeTimer) {
                    setIsTimerRunning(true);
                    setTimerId(activeTimer.id);
                    setStartTime(new Date(activeTimer.start_time));
                }
            } catch (error) {
                console.error('타이머 상태 조회 오류:', error);
                Alert.alert('오류', '타이머 상태를 가져오는 데 문제가 발생했습니다.');
            }
        };

        checkTimerStatus();
    }, [subjectId]);

    useEffect(() => {
        let interval;
        if (isTimerRunning && startTime) {
            interval = setInterval(() => {
                const currentTime = new Date();
                const elapsedSeconds = Math.floor((currentTime - startTime) / 1000) + pausedTime;
                setElapsedTime(elapsedSeconds);
            }, 1000);
        }

        return () => {
            clearInterval(interval);
        };
    }, [isTimerRunning, startTime, pausedTime]);

    const startTimer = async () => {
        try {
            let token = await SecureStore.getItemAsync('userToken');
            if (!token) {
                token = await refreshToken();
                if (!token) {
                    Alert.alert('오류', '로그인이 필요합니다.');
                    navigation.navigate('Login');
                    return;
                }
            }

            const response = await api.post(
                '/api/timer/start',
                { subject_id: subjectId },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (response.data.success) {
                setIsTimerRunning(true);
                setTimerId(response.data.timerId);
                setStartTime(new Date());
                setPausedTime(elapsedTime);
            } else {
                Alert.alert('오류', response.data.message);
            }
        } catch (error) {
            console.error('타이머 시작 오류:', error);
            Alert.alert('오류', '타이머를 시작하는 데 문제가 발생했습니다.');
        }
    };

    const stopTimer = async () => {
        try {
            let token = await SecureStore.getItemAsync('userToken');
            if (!token) {
                token = await refreshToken();
                if (!token) {
                    Alert.alert('오류', '로그인이 필요합니다.');
                    navigation.navigate('Login');
                    return;
                }
            }

            const response = await api.post(
                '/api/timer/stop',
                { id: timerId },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (response.data.success) {
                setIsTimerRunning(false);
                setTimerId(null);
                setPausedTime(elapsedTime);
            } else {
                Alert.alert('오류', response.data.message);
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
            <Text>경과 시간: {elapsedTime}초</Text>
            <Button
                title={isTimerRunning ? '타이머 정지' : '타이머 시작'}
                onPress={isTimerRunning ? stopTimer : startTimer}
            />
            <Button title="뒤로 가기" onPress={() => navigation.goBack()} />
        </View>
    );
};

export default TimerPage;
