import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { Calendar } from "react-native-calendars";
import { Checkbox } from "react-native-paper";
import * as SecureStore from "expo-secure-store";
import api from "../../api/api"; // api로 변경

const WeeklyGoalsPage = () => {
  const [goals, setGoals] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [newGoal, setNewGoal] = useState('');
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');

  // 데이터 로드 및 사용자 인증
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = await SecureStore.getItemAsync('userToken');
        if (!token) {
          Alert.alert('오류', '로그인 토큰을 찾을 수 없습니다.');
          return;
        }

        // 사용자 정보 가져오기
        const userInfoResponse = await api.get('/api/auth/user-info', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (userInfoResponse?.data?.success) {
          setUsername(userInfoResponse.data.username);
        }

        // 목표 가져오기
        const goalsResponse = await api.get('/api/study2/goals', {
          headers: { Authorization: `Bearer ${token}` },
        });

        setGoals(goalsResponse.data);
      } catch (error) {
        console.error('데이터 가져오기 오류:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 날짜 선택 처리
  const handleDateSelect = (date) => {
    if (startDate === date.dateString) {
      setStartDate('');
    } else if (endDate === date.dateString) {
      setEndDate('');
    } else if (!startDate) {
      setStartDate(date.dateString);
    } else if (!endDate) {
      if (new Date(date.dateString) >= new Date(startDate)) {
        setEndDate(date.dateString);
      } else {
        Alert.alert('오류', '끝 날짜는 시작 날짜 이후로 선택해야 합니다.');
      }
    }
  };

  // 목표 추가
  const addGoal = async () => {
    if (!newGoal.trim()) {
      return Alert.alert('유효성 검사 오류', '목표를 입력해주세요.');
    }

    if (!startDate || !endDate) {
      return Alert.alert('날짜 오류', '시작 날짜와 끝 날짜를 모두 선택해주세요.');
    }

    try {
      const token = await SecureStore.getItemAsync('userToken');
      const response = await api.post(
        '/api/study2/goals',
        {
          goal_name: newGoal,
          start_date: startDate,
          end_date: endDate,
          is_completed: 0, // 기본적으로 미완료 상태로 설정
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setGoals([...goals, response.data]); // 서버에서 반환된 목표를 상태에 추가
      setNewGoal('');
      setStartDate('');
      setEndDate('');
      Alert.alert('성공', '목표를 추가했습니다.');
    } catch (error) {
      Alert.alert('오류', '새 목표를 추가하는데 실패했습니다.');
    }
  };

  // 목표 완료 상태 토글
  const handleGoalCompletionToggle = async (goalId, currentStatus) => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const updatedStatus = currentStatus === 1 ? 0 : 1; // 상태 반전 (완료 -> 미완료 또는 그 반대)
      const response = await api.put(
        `/api/study2/goals/${goalId}`,
        { is_completed: updatedStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setGoals(goals.map((goal) => (goal.id === goalId ? { ...goal, is_completed: updatedStatus } : goal)));
    } catch (error) {
      Alert.alert('오류', '목표 완료 상태를 변경하는데 실패했습니다.');
    }
  };

  // 로딩 상태
  if (loading) {
    return (
      <View>
        <ActivityIndicator size="large" color="#0066FF" />
      </View>
    );
  }

  return (
    <View>
      <Text>안녕하세요, {username}님!</Text>

      <Calendar
        onDayPress={handleDateSelect}
        markedDates={{
          [startDate]: { selected: true, selectedColor: 'green' },
          [endDate]: { selected: true, selectedColor: 'red' },
        }}
      />

      <Text>선택한 날짜: {startDate} ~ {endDate}</Text>

      <TextInput
        style={{ borderWidth: 1, borderColor: '#007BFF', padding: 10, marginBottom: 10 }}
        placeholder="새 목표 입력"
        value={newGoal}
        onChangeText={(text) => setNewGoal(text)}
      />

      <TouchableOpacity onPress={addGoal} style={{ backgroundColor: '#0066FF', padding: 10, borderRadius: 5 }}>
        <Text style={{ color: '#fff' }}>목표 추가</Text>
      </TouchableOpacity>

      <Text>목표 목록:</Text>
      {goals.map((goal, index) => (
        <View key={index} style={{ flexDirection: 'row', alignItems: 'center', padding: 10, borderBottomWidth: 1 }}>
          <Text style={{ flex: 1 }}>{goal.goal_name}</Text>
          <Text style={{ flex: 1 }}>{`기간: ${goal.start_date} ~ ${goal.end_date}`}</Text>
          <Checkbox
            status={goal.is_completed ? 'checked' : 'unchecked'}
            onPress={() => handleGoalCompletionToggle(goal.id, goal.is_completed)}
          />
        </View>
      ))}
    </View>
  );
};

export default WeeklyGoalsPage;
