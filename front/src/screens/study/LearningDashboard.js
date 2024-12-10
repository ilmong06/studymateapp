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
import api from "../../api/api";
import { Checkbox } from "react-native-paper";

const LearningDashboard = () => {
  const [goals, setGoals] = useState([]);
  const [newGoal, setNewGoal] = useState("");
  const [goalType, setGoalType] = useState("daily");
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");

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
      Alert.alert("오류", "목표 상태 변경 중 문제가 발생했습니다.");
    }
  };

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
      Alert.alert("오류", "새 목표를 추가하는데 실패했습니다.");
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
      <View style={styles.section}>
        <TextInput
          style={styles.input}
          placeholder="새 목표 입력"
          value={newGoal}
          onChangeText={(text) => setNewGoal(text)}
        />
        <TouchableOpacity onPress={addGoal} style={styles.button}>
          <Text style={styles.buttonText}>추가</Text>
        </TouchableOpacity>
        <FlatList
          data={goals}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.goalItem}>
              <Checkbox
                status={item.is_completed ? "checked" : "unchecked"}
                onPress={() => toggleGoalCompletion(item.id, item.is_completed)}
                color={"#007BFF"}
              />
              <Text
                style={item.is_completed ? styles.completedGoal : styles.incompleteGoal}
              >
                {item.goal_name} ({item.goal_type})
              </Text>
            </View>
          )}
        />
      </View>
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
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  section: {
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#007BFF",
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    fontSize: 16,
    color: "#000",
    backgroundColor: "#fff",
  },
  button: {
    backgroundColor: "#007BFF",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 15,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  goalItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  completedGoal: {
    textDecorationLine: "line-through",
    color: "green",
    fontSize: 16,
    marginLeft: 5,
  },
  incompleteGoal: {
    color: "#333",
    fontSize: 16,
    marginLeft: 5,
  },
});

export default LearningDashboard;
