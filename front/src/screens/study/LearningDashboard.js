import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import api from "../../api/api"; // API 모듈 가져오기

const LearningDashboard = () => {
  const [goals, setGoals] = useState([]);
  const [newGoal, setNewGoal] = useState("");
  const [goalType, setGoalType] = useState("daily");
  const [studyTime, setStudyTime] = useState("");
  const [timeLogs, setTimeLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState(""); // 사용자 이름 저장

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // SecureStore에서 토큰 가져오기
        const token = await SecureStore.getItemAsync("userToken");
        if (!token) {
          Alert.alert("오류", "로그인 토큰을 찾을 수 없습니다.");
          return;
        }

        // 사용자 정보 가져오기
        const userInfoResponse = await api.get("/api/auth/user-info", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (userInfoResponse.data && userInfoResponse.data.success) {
          setUsername(userInfoResponse.data.username);
        } else {
          Alert.alert("오류", "사용자 정보를 가져오지 못했습니다.");
        }

        // 학습 목표와 시간 데이터를 가져오기
        const goalsResponse = await api.get("/api/study/goals", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const timeLogsResponse = await api.get("/api/study/time-logs", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setGoals(goalsResponse.data);
        setTimeLogs(timeLogsResponse.data);
      } catch (error) {
        console.error("데이터 가져오기 오류:", error);
        Alert.alert("오류", "데이터를 가져오는 중 문제가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 새로운 목표 추가
  const addGoal = async () => {
    if (!newGoal.trim()) return Alert.alert("유효성 검사 오류", "목표를 입력해주세요.");
    try {
      const token = await SecureStore.getItemAsync("userToken");
      const response = await api.post(
        "/api/study/goals",
        {
          goal_name: newGoal,
          goal_type: goalType,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setGoals([...goals, response.data]);
      setNewGoal("");
    } catch (error) {
      console.error("목표 추가 오류:", error);
      Alert.alert("오류", "새 목표를 추가하는데 실패했습니다.");
    }
  };

  // 목표 완료 상태 변경
  const toggleGoalCompletion = async (goalId, isCompleted) => {
    try {
      const token = await SecureStore.getItemAsync("userToken");
      await api.put(
        `/api/study/goals/${goalId}`,
        { is_completed: !isCompleted },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setGoals(
        goals.map((goal) =>
          goal.id === goalId ? { ...goal, is_completed: !isCompleted } : goal
        )
      );
    } catch (error) {
      console.error("목표 상태 변경 오류:", error);
      Alert.alert("오류", "목표 상태를 업데이트하는데 실패했습니다.");
    }
  };

  // 학습 시간 기록
  const logStudyTime = async () => {
    if (!studyTime) return Alert.alert("유효성 검사 오류", "학습 시간을 입력해주세요.");
    try {
      const token = await SecureStore.getItemAsync("userToken");
      await api.post(
        "/api/study/time-logs",
        {
          study_date: new Date().toISOString().split("T")[0],
          study_time_minutes: parseInt(studyTime, 10),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setStudyTime("");
      fetchData();
    } catch (error) {
      console.error("학습 시간 기록 오류:", error);
      Alert.alert("오류", "학습 시간을 기록하는데 실패했습니다.");
    }
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
      <Text style={styles.subHeader}>학습 대시보드</Text>

      {/* 학습 목표 섹션 */}
      <View style={styles.section}>
        <Text style={styles.subHeader}>학습 목표</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="새 목표 입력"
            value={newGoal}
            onChangeText={(text) => setNewGoal(text)}
          />
          <TouchableOpacity onPress={addGoal} style={styles.button}>
            <Text style={styles.buttonText}>추가</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={goals}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.goalItem}>
              <TouchableOpacity onPress={() => toggleGoalCompletion(item.id, item.is_completed)}>
                <Text style={item.is_completed ? styles.completedGoal : styles.incompleteGoal}>
                  {item.goal_name} ({item.goal_type})
                </Text>
              </TouchableOpacity>
            </View>
          )}
        />
      </View>

      {/* 학습 시간 섹션 */}
      <View style={styles.section}>
        <Text style={styles.subHeader}>학습 시간 기록</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="시간(분) 입력"
            keyboardType="numeric"
            value={studyTime}
            onChangeText={(text) => setStudyTime(text)}
          />
          <TouchableOpacity onPress={logStudyTime} style={styles.button}>
            <Text style={styles.buttonText}>기록</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={timeLogs}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <Text>
              {item.study_date}: {item.study_time_minutes}분
            </Text>
          )}
        />
      </View>
    </View>
  );
};

export default LearningDashboard;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  header: { fontSize: 24, fontWeight: "bold", marginBottom: 10 },
  subHeader: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  section: { marginBottom: 20 },
  inputContainer: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginRight: 10,
  },
  button: { backgroundColor: "#007BFF", padding: 10, borderRadius: 5 },
  buttonText: { color: "#fff", fontWeight: "bold" },
  goalItem: { marginBottom: 10 },
  completedGoal: { textDecorationLine: "line-through", color: "green" },
  incompleteGoal: { color: "black" },
});
