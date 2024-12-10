import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import { Calendar } from "react-native-calendars";
import { Checkbox } from "react-native-paper";
import api from "../../api/api";

const LearningDashboard = () => {
  const [goals, setGoals] = useState([]);
  const [newGoal, setNewGoal] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [checkedGoals, setCheckedGoals] = useState({}); // 체크 상태를 저장

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

        const goalsResponse = await api.get("/api/study/goals", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setGoals(goalsResponse.data);
      } catch (error) {
        console.error("데이터 가져오기 오류:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleDayPress = async (day) => {
    setSelectedDate(day.dateString);
  };

  const addGoal = async () => {
    if (!newGoal.trim()) {
      return Alert.alert("유효성 검사 오류", "목표를 입력해주세요.");
    }

    if (!selectedDate) {
      return Alert.alert("날짜 선택 오류", "목표를 입력할 날짜를 선택해주세요.");
    }

    try {
      const token = await SecureStore.getItemAsync("userToken");
      const response = await api.post(
        "/api/study/goals",
        {
          goal_name: newGoal,
          goal_type: "daily",
          study_date: selectedDate,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setGoals([...goals, response.data]);
      setNewGoal("");
      Alert.alert("성공", "목표를 추가했습니다.");
    } catch (error) {
      Alert.alert("오류", "새 목표를 추가하는데 실패했습니다.");
    }
  };

  const toggleCheckbox = (id) => {
    setCheckedGoals((prevState) => ({
      ...prevState,
      [id]: !prevState[id],
    }));
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0066FF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>안녕하세요, {username}님!</Text>
      <Calendar
        onDayPress={handleDayPress}
        markedDates={{
          [selectedDate]: { selected: true, selectedColor: "#007BFF" },
        }}
        style={styles.calendar}
      />
      <TextInput
        style={styles.input}
        placeholder="새 목표 입력"
        value={newGoal}
        onChangeText={(text) => setNewGoal(text)}
      />
      <TouchableOpacity onPress={addGoal} style={styles.button}>
        <Text style={styles.buttonText}>추가</Text>
      </TouchableOpacity>

      <Text style={styles.subHeader}>목표 목록</Text>
      {goals.length === 0 ? (
        <Text style={styles.noGoals}>목표가 없습니다.</Text>
      ) : (
        goals.map((goal) => (
          <View key={goal.id} style={styles.goalItem}>
            <Checkbox
              status={checkedGoals[goal.id] ? "checked" : "unchecked"}
              onPress={() => toggleCheckbox(goal.id)}
            />
            <Text
              style={[
                styles.goalText,
                checkedGoals[goal.id] && styles.strikethrough, // 체크 상태에서 적용
              ]}
            >
              {goal.goal_name}
            </Text>
          </View>
        ))
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f9f9f9",
  },
  header: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  calendar: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#007BFF",
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  button: {
    backgroundColor: "#007BFF",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  subHeader: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#333",
  },
  noGoals: {
    fontSize: 14,
    color: "#555",
  },
  goalItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  goalText: {
    fontSize: 14,
    marginLeft: 10,
  },
  strikethrough: {
    textDecorationLine: "line-through", // 취소선 스타일
    color: "#555",
  },
});

export default LearningDashboard;
