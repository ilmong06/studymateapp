import React, { useState, useEffect } from 'react';
import { View, Text, Button, Alert, StyleSheet, TouchableOpacity } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import api from '../../api/api';
import { CircularProgress } from 'react-native-circular-progress';

const TimerPage = ({ route, navigation }) => {
    const { subjectId } = route.params;
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [timerId, setTimerId] = useState(null);
    const [startTime, setStartTime] = useState(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [pausedTime, setPausedTime] = useState(0);
    const [subjectName, setSubjectName] = useState('');

    useEffect(() => {
        const fetchTimerAndSubject = async () => {
            try {
                const token = await SecureStore.getItemAsync('userToken');
                if (token) {
                    const response = await api.get('/api/subjects', {
                        headers: { Authorization: `Bearer ${token}` },
                    });

                    const subject = response.data.subjects.find(item => item.id === subjectId);
                    if (subject) {
                        setSubjectName(subject.subject_name);
                    }

                    const activeTimer = response.data.subjects.find(
                        timer => timer.subject_id === subjectId && timer.is_running
                    );
                    if (activeTimer) {
                        setIsTimerRunning(true);
                        setTimerId(activeTimer.timer_id);
                        setStartTime(new Date(activeTimer.start_time));
                    }
                }
            } catch (error) {
                console.error('타이머 상태 조회 오류:', error);
                Alert.alert('오류', '타이머 상태를 가져오는 데 문제가 발생했습니다.');
            }
        };

        fetchTimerAndSubject();
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
            const token = await SecureStore.getItemAsync('userToken');
            if (token) {
                const response = await api.post('/api/timers/start', { subject_id: subjectId }, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (response.data.success) {
                    setIsTimerRunning(true);
                    setTimerId(response.data.timerId);
                    setStartTime(new Date());
                    setPausedTime(elapsedTime);
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
                    setTimerId(null);
                    setPausedTime(elapsedTime);
                } else {
                    Alert.alert('오류', response.data.message);
                }
            }
        } catch (error) {
            console.error('타이머 정지 오류:', error);
            Alert.alert('오류', '타이머를 정지하는 데 문제가 발생했습니다.');
        }
    };

    const terminateTimer = async () => {
        try {
            const token = await SecureStore.getItemAsync('userToken');
            if (token && timerId) {
                const response = await api.post('/api/timers/stop', { id: timerId }, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (response.data.success) {
                    setIsTimerRunning(false);
                    setTimerId(null);
                    setPausedTime(0);
                    setElapsedTime(0);
                } else {
                    Alert.alert('오류', response.data.message);
                }
            }
        } catch (error) {
            console.error('타이머 종료 오류:', error);
            Alert.alert('오류', '타이머를 종료하는 데 문제가 발생했습니다.');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.subjectName}> {subjectName}</Text>
            <View style={styles.timerContainer}>
                <CircularProgress
                    size={200}
                    width={15}
                    fill={(elapsedTime / 3600) * 100} // 경과 시간 비율로 계산
                    rotation={0}
                    tintColor="#00bfff"
                    backgroundColor="#e0e0e0"
                    lineCap="round"
                >
                    {() => <Text style={styles.elapsedTime}>{elapsedTime}초</Text>}
                </CircularProgress>
            </View>
            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={[styles.button, styles.startStopButton]}
                    onPress={isTimerRunning ? stopTimer : startTimer}
                >
                    <Text style={styles.buttonText}>{isTimerRunning ? '타이머 정지' : '타이머 시작'}</Text>
                </TouchableOpacity>
                {isTimerRunning && (
                    <TouchableOpacity
                        style={[styles.button, styles.terminateButton]}
                        onPress={terminateTimer}
                    >
                        <Text style={styles.buttonText}>타이머 종료</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity
                    style={[styles.button, styles.backButton]}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.buttonText}>뒤로 가기</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    subjectName: {
        fontSize: 30,  // 글씨 크기를 더 크게 설정
        fontWeight: 'bold',  // 굵은 글씨로 강조
        color: '#0077b6',  // 강조할 색상 (파란색)
        marginBottom: 20,
        textTransform: 'uppercase',  // 모든 글씨를 대문자로 변환
    },
    timerContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    elapsedTime: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#00bfff',
    },
    buttonContainer: {
        width: '100%',
        paddingHorizontal: 20,
        marginTop: 20,
    },
    button: {
        paddingVertical: 15,
        borderRadius: 10,
        marginBottom: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        fontSize: 18,
        color: 'white',
    },
    startStopButton: {
        backgroundColor: '#00bfff',
    },
    terminateButton: {
        backgroundColor: '#ff6347',
    },
    backButton: {
        backgroundColor: '#4caf50',
    },
});

export default TimerPage;
