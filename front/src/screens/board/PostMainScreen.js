import React, { useEffect, useState, useCallback } from "react";
import {
    View,
    ScrollView,
    Text,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    StyleSheet,
} from "react-native";
import api from "../../api/api"; // API 모듈 경로 확인
import * as SecureStore from "expo-secure-store";
import { Ionicons } from "@expo/vector-icons"; // 아이콘 라이브러리 추가
import { useFocusEffect } from "@react-navigation/native"; // useFocusEffect 추가
import refreshToken from "../../tokenRefresh/refreshToken";

const PostMainScreen = ({ navigation }) => {
    const [posts, setPosts] = useState([]); // 모든 게시글 상태
    const [loading, setLoading] = useState(true);

    const fetchPosts = async () => {
        setLoading(true);
        try {
            let accessToken = JSON.parse(await SecureStore.getItemAsync("userToken"));
            if (!accessToken) {
                accessToken = await refreshToken(); // 토큰 갱신
                if (!accessToken) {
                    Alert.alert("오류", "로그인이 필요합니다.");
                    return;
                }
            }

            const response = await api.get("/api/post/getPosts", {
                headers: { Authorization: `Bearer ${accessToken}` },
            });

            if (response?.data?.success && Array.isArray(response.data.posts)) {
                setPosts(response.data.posts);
            } else {
                setPosts([]);
                Alert.alert("오류", response?.data?.message || "게시글을 가져오는 데 실패했습니다.");
            }
        } catch (error) {
            console.error("게시글 조회 오류:", error);
            Alert.alert("오류", "게시글을 가져오는 중 문제가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchPosts(); // 화면에 포커스가 맞춰질 때 실행
        }, [])
    );

    const navigateToPostDetail = (postNum) => {
        navigation.navigate("PostDetail", { postNum });
    };

    const navigateToPostCreation = () => {
        navigation.navigate("WritePost"); // 게시글 작성 화면으로 이동
    };

    return (
        <View style={styles.container}>
            {loading ? (
                <ActivityIndicator size="large" color="#007bff" />
            ) : (
                <ScrollView style={styles.scrollContainer}>
                    {posts.map((post) => (
                        <TouchableOpacity
                            key={post.postNum}
                            style={styles.postContainer}
                            onPress={() => navigateToPostDetail(post.postNum)}
                        >
                            <View style={styles.postContent}>
                                <Text style={styles.postTitle}>{post.title}</Text>
                                <Text style={styles.postText} numberOfLines={2}>
                                    {post.content}
                                </Text>
                                <Text style={styles.postAuthor}>{post.username}</Text>
                                <Text style={styles.postDate}>
                                    {new Date(post.created_at).toLocaleString()}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            )}
            {/* + 버튼 추가 */}
            <TouchableOpacity
                style={styles.addButton}
                onPress={navigateToPostCreation}
            >
                <Ionicons name="add" size={32} color="#fff" />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f9f9f9",
    },
    scrollContainer: {
        padding: 16,
    },
    postContainer: {
        backgroundColor: "#fff",
        borderRadius: 8,
        marginBottom: 16,
        padding: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    postContent: {
        flexDirection: "column",
    },
    postTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 8,
    },
    postText: {
        fontSize: 14,
        color: "#333",
        marginBottom: 8,
    },
    postAuthor: {
        fontSize: 12,
        color: "#666",
        marginBottom: 4,
    },
    postDate: {
        fontSize: 12,
        color: "#999",
    },
    addButton: {
        position: "absolute",
        bottom: 20,
        right: 20,
        backgroundColor: "#007bff",
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
});

export default PostMainScreen;
