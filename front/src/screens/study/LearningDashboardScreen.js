import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    ScrollView,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import { Calendar } from "react-native-calendars";
import { Checkbox } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons"; // 아이콘 추가
import api from "../../api/api";
import refreshToken from "../../tokenRefresh/refreshToken";

const LearningDashboardScreen = ({ navigation }) => {
    const [goals, setGoals] = useState([]);
    const [newGoal, setNewGoal] = useState("");
    const [selectedDate, setSelectedDate] = useState("");
    const [loading, setLoading] = useState(false);
    const [username, setUsername] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const token = JSON.parse(await SecureStore.getItemAsync("userToken"));
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

                const goalsResponse = await api.get("/api/dailyStudy/goals", {
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

    // 날짜 선택
    const handleDayPress = (day) => {
        setSelectedDate(day.dateString);
    };

    const addGoal = async () => {
        if (!newGoal.trim()) {
            Alert.alert("유효성 검사 오류", "목표를 입력해주세요.");
            return;
        }

        if (!selectedDate) {
            Alert.alert("날짜 선택 오류", "목표를 입력할 날짜를 선택해주세요.");
            return;
        }

        setLoading(true);
        try {
            let accessToken = JSON.parse(await SecureStore.getItemAsync('userToken'));
            if (!accessToken) {
                accessToken = await refreshToken(); // 갱신 함수 호출
                if (!accessToken) return; // 갱신 실패 시 중단
            }

            const response = await api.post(
                "/api/dailyStudy/goals",
                {
                    goal_name: newGoal,
                    goal_type: "daily",
                    study_date: selectedDate,
                },
                {
                    headers: { Authorization: `Bearer ${accessToken}` },
                }
            );

            if (response?.data?.success) {
                if (Array.isArray(goals)) {
                    setGoals([...goals, response.data.goal]); // 기존 goals 배열에 추가
                } else {
                    console.error("goals 상태가 배열이 아닙니다:", goals);
                    setGoals([response.data.goal]); // 배열로 초기화
                }
                setNewGoal("");
                Alert.alert("성공", "목표가 추가되었습니다.");
            } else {
                Alert.alert("오류", response?.data?.message || "목표 추가에 실패했습니다.");
            }
        } catch (error) {
            console.error("목표 추가 오류:", error);
            Alert.alert("오류", "새 목표를 추가하는 중 문제가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    // 목표 상태 토글
    const toggleCheckbox = async (goalId, currentStatus) => {
        setLoading(true);
        try {
            let accessToken = JSON.parse(await SecureStore.getItemAsync('userToken'));
            if (!accessToken) {
                accessToken = await refreshToken(); // 갱신 함수 호출
                if (!accessToken) return; // 갱신 실패 시 중단
            }

            const response = await api.put(
                `/api/dailyStudy/goals/${goalId}`,
                { is_completed: !currentStatus },
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );

            if (response?.data?.success) {
                setGoals(
                    goals.map((goal) =>
                        goal.id === goalId ? { ...goal, is_completed: !currentStatus } : goal
                    )
                );
                Alert.alert("변경 완료", "목표 상태가 업데이트되었습니다.");
            } else {
                Alert.alert("오류", response.data.message || "목표 상태 변경에 실패했습니다.");
            }
        } catch (error) {
            console.error("Checkbox toggle error:", error);
            Alert.alert("오류", "목표 상태를 업데이트하는 중 문제가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0066FF" />
            </View>
        );
    }

    return (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.headerContainer}>
                <Text style={styles.header}>안녕하세요, {username}님!</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => navigation.navigate('Subject')}
                >
                    <Ionicons name="add" size={24} color="#fff" />
                </TouchableOpacity>
            </View>
            <Calendar
                onDayPress={handleDayPress}
                markedDates={{
                    [selectedDate]: { selected: true, selectedColor: '#007BFF' },
                }}
                style={{ height: 350, width: '100%' }}
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
            {Array.isArray(goals) && goals.length === 0 ? (
                <Text style={styles.noGoals}>목표가 없습니다.</Text>
            ) : (
                Array.isArray(goals) &&
                goals.map((goal) => (
                    <View key={goal.id} style={styles.goalItem}>
                        <Checkbox
                            status={goal.is_completed ? "checked" : "unchecked"}
                            onPress={() => toggleCheckbox(goal.id, goal.is_completed)}
                        />
                        <Text style={goal.is_completed ? styles.strikethrough : null}>
                            {goal.goal_name}
                        </Text>
                    </View>
                ))
            )}
            {/* 주간 목표로 이동하는 버튼 */}
            <TouchableOpacity
                style={styles.weeklyGoalsButton}
                onPress={() => navigation.navigate("WeeklyGoals")} // 주간 목표 페이지로 이동
            >
                <Text style={styles.weeklyGoalsButtonText}>📅 주간 목표</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    scrollContainer: {
        flexGrow: 1,
        backgroundColor: "#f9f9f9",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    container: {
        padding: 20,
    },
    headerContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
    },
    header: {
        fontSize: 18,
        fontWeight: "bold",
    },
    addButton: {
        backgroundColor: "#007BFF",
        padding: 10,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
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
        marginBottom: 10,
    },
    buttonText: {
        color: "#fff",
        fontWeight: "bold",
    },
    subHeader: {
        fontSize: 16,
        fontWeight: "bold",
        marginBottom: 5,
    },
    goalItem: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 10,
    },
    strikethrough: {
        textDecorationLine: "line-through",
    },
    noGoals: {
        fontStyle: "italic",
        color: "gray",
    },
    weeklyGoalsButton: {
        backgroundColor: "#007BFF", // 핑크색
        paddingVertical: 15,
        borderRadius: 25, // 둥근 버튼
        alignItems: "center",
        marginTop: 20,
    },
    weeklyGoalsButtonText: {
        color: "#ffffff",
        fontSize: 18,
        fontWeight: "bold",
    },
});

export default LearningDashboardScreen;
