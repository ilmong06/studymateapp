import React, { useState, useEffect } from 'react';
import { View, Text, Alert, StyleSheet, TouchableOpacity } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import api from '../../api/api';
import { CircularProgress } from 'react-native-circular-progress';

const TimerScreen = ({ route, navigation }) => {
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
                const token = JSON.parse(await SecureStore.getItemAsync('userToken'));
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
            const token = JSON.parse(await SecureStore.getItemAsync('userToken'));
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
            const token = JSON.parse(await SecureStore.getItemAsync('userToken'));
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
            const token = JSON.parse(await SecureStore.getItemAsync('userToken'));
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
                    tintColor="#ff69b4" // 부드럽고 사랑스러운 핑크색
                    backgroundColor="#ffe0f0" // 밝은 배경색
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
                    <Text style={styles.buttonText}>{isTimerRunning ? '정지' : '시작'}</Text>
                </TouchableOpacity>
                {isTimerRunning && (
                    <TouchableOpacity
                        style={[styles.button, styles.terminateButton]}
                        onPress={terminateTimer}
                    >
                        <Text style={styles.buttonText}>종료</Text>
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
        backgroundColor: '#f0f8ff', // 부드러운 하늘색 배경
    },
    subjectName: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#ff1493', // 사랑스러운 핑크색
        marginBottom: 20,
        textTransform: 'capitalize',
    },
    timerContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    elapsedTime: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#ff69b4', // 사랑스러운 핑크색
    },
    buttonContainer: {
        width: '100%',
        paddingHorizontal: 20,
        marginTop: 20,
    },
    button: {
        paddingVertical: 18,
        borderRadius: 25, // 버튼을 더 동글동글하게
        marginBottom: 15,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent', // 배경을 투명하게 설정
        borderWidth: 2, // 테두리 두께 설정
    },
    buttonText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#ff69b4', //
    },
    startStopButton: {
        borderColor: '#ff1493', // 사랑스러운 핑크색 테두리
    },
    terminateButton: {
        borderColor: '#ff6347', // 빨간색 종료 버튼 테두리
    },
    backButton: {
        borderColor: '#98fb98', // 연한 초록색 테두리
    },
});


export default TimerScreen;
