import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from "react-native";
import { Calendar } from "react-native-calendars";
import { Checkbox } from "react-native-paper";
import * as SecureStore from "expo-secure-store";
import api from "../../api/api";

const WeeklyGoalsPage = () => {
  const [goals, setGoals] = useState([]);
  const [groupedGoals, setGroupedGoals] = useState({});
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [newGoal, setNewGoal] = useState("");
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");

  const formatDate = (date) => {
    if (!date) return "";
    const [year, month, day] = date.split("-");
    return `${month}월 ${day}일 ${year}년`;
  };

  const groupGoalsByPeriod = (goals) => {
    const grouped = goals.reduce((acc, goal) => {
      const periodKey = `${goal.start_date} ~ ${goal.end_date}`;
      if (!acc[periodKey]) acc[periodKey] = { goals: [], progress: 0 };

      acc[periodKey].goals.push(goal);

      // 진도율 계산
      const totalItems = acc[periodKey].goals.length;
      const completedItems = acc[periodKey].goals.filter((g) => g.is_completed).length;
      acc[periodKey].progress = totalItems > 0 ? ((completedItems / totalItems) * 100).toFixed(2) : 0;

      return acc;
    }, {});
    setGroupedGoals(grouped);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = await SecureStore.getItemAsync("userToken");
        if (!token) {
          Alert.alert("오류", "로그인 토큰을 찾을 수 없습니다.");
          return;
        }

        const userInfoResponse = await api.get("/api/auth/user-info", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (userInfoResponse?.data?.success) {
          setUsername(userInfoResponse.data.username);
        }

        const goalsResponse = await api.get("/api/study2/goals", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setGoals(goalsResponse.data);
        groupGoalsByPeriod(goalsResponse.data);
      } catch (error) {
        console.error("데이터 가져오기 오류:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleDateSelect = (date) => {
    if (startDate === date.dateString) {
      setStartDate("");
    } else if (endDate === date.dateString) {
      setEndDate("");
    } else if (!startDate) {
      setStartDate(date.dateString);
    } else if (!endDate) {
      if (new Date(date.dateString) >= new Date(startDate)) {
        setEndDate(date.dateString);
      } else {
        Alert.alert("오류", "끝 날짜는 시작 날짜 이후로 선택해야 합니다.");
      }
    }
  };

  const addGoal = async () => {
    if (!newGoal.trim()) {
      return Alert.alert("유효성 검사 오류", "목표를 입력해주세요.");
    }

    if (!startDate || !endDate) {
      Alert.alert("날짜 오류", "시작 날짜와 끝 날짜를 선택해주세요.");
      return;
    }

    try {
      const token = await SecureStore.getItemAsync("userToken");

      const existingGoalGroup = goals.find(
        (goal) => goal.start_date === startDate && goal.end_date === endDate
      );

      const goalId = existingGoalGroup ? existingGoalGroup.goal_id : Date.now();

      const response = await api.post(
        "/api/study2/goals",
        {
          goal_name: newGoal,
          goal_id: goalId,
          start_date: startDate,
          end_date: endDate,
          is_completed: 0,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const newGoals = [...goals, response.data];
      setGoals(newGoals);
      groupGoalsByPeriod(newGoals);
      setNewGoal("");
      Alert.alert("성공", "목표를 추가했습니다.");
    } catch (error) {
      Alert.alert("오류", "새 목표를 추가하는데 실패했습니다.");
    }
  };

  const handleGoalCompletionToggle = async (goalId, currentStatus) => {
    try {
      const token = await SecureStore.getItemAsync("userToken");
      const updatedStatus = currentStatus === 1 ? 0 : 1;
      await api.put(
        `/api/study2/goals/${goalId}`,
        { is_completed: updatedStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedGoals = goals.map((goal) =>
        goal.id === goalId ? { ...goal, is_completed: updatedStatus } : goal
      );
      setGoals(updatedGoals);
      groupGoalsByPeriod(updatedGoals);
    } catch (error) {
      Alert.alert("오류", "목표 완료 상태를 변경하는데 실패했습니다.");
    }
  };

  if (loading) {
    return (
      <View>
        <ActivityIndicator size="large" color="#0066FF" />
      </View>
    );
  }

  return (
    <ScrollView style={{ padding: 10 }}>
      <Text>안녕하세요, {username}님!</Text>

      <Calendar
        onDayPress={handleDateSelect}
        markedDates={{
          [startDate]: { selected: true, selectedColor: "green" },
          [endDate]: { selected: true, selectedColor: "red" },
        }}
      />

      <Text>선택한 날짜: {formatDate(startDate)} ~ {formatDate(endDate)}</Text>

      <TextInput
        style={{ borderWidth: 1, borderColor: "#007BFF", padding: 10, marginBottom: 10 }}
        placeholder="새 목표 입력"
        value={newGoal}
        onChangeText={(text) => setNewGoal(text)}
      />

      <TouchableOpacity onPress={addGoal} style={{ backgroundColor: "#0066FF", padding: 10, borderRadius: 5 }}>
        <Text style={{ color: "#fff" }}>목표 추가</Text>
      </TouchableOpacity>

      <Text>목표 목록:</Text>
      {groupedGoals && Object.keys(groupedGoals).length > 0 ? (
        Object.entries(groupedGoals).map(([period, { goals, progress }]) => (
          <View key={period} style={{ marginVertical: 10 }}>
            <Text style={{ fontWeight: "bold", marginBottom: 5 }}>{`기간: ${period} (진도율: ${progress}%)`}</Text>
            {goals.map((goal) => (
              <View
                key={goal.id}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 10,
                  borderBottomWidth: 1,
                  borderColor: "#ccc",
                }}
              >
                <Text style={{ flex: 1 }}>{goal.goal_name}</Text>
                <Checkbox
                  status={goal.is_completed ? "checked" : "unchecked"}
                  onPress={() => handleGoalCompletionToggle(goal.id, goal.is_completed)}
                />
              </View>
            ))}
          </View>
        ))
      ) : (
        <Text>목표가 없습니다.</Text>
      )}
    </ScrollView>
  );
};

export default WeeklyGoalsPage;
