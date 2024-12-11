import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Alert,
    TouchableOpacity,
    TextInput,
    SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import api from "../../api/api";
import refreshToken from "../../tokenRefresh/refreshToken";

const PostDetailScreen = ({ route, navigation }) => {
    const { postNum } = route.params; // postNum 구조 수정
    const [post, setPost] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [loading, setLoading] = useState(true);

    const fetchPostDetails = async () => {
        try {
            let token = JSON.parse(await SecureStore.getItemAsync("userToken"));
            if (!token) {
                token = await refreshToken();
                if (!token) {
                    Alert.alert("오류", "로그인이 필요합니다.", [
                        { text: "확인", onPress: () => navigation.navigate("Intro") },
                    ]);
                    return;
                }
            }

            const [postResponse, commentsResponse] = await Promise.all([
                api.get(`/api/post/getPostDetails/${postNum}`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                api.get(`/api/post/${postNum}/comments`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
            ]);

            if (postResponse.data.success) {
                setPost(postResponse.data.post); // 서버에서 객체로 반환됨
            } else {
                Alert.alert("오류", "게시글 정보를 가져오는 데 실패했습니다.", [
                    { text: "확인", onPress: () => navigation.goBack() },
                ]);
            }

            if (commentsResponse.data.success) {
                setComments(commentsResponse.data.comments);
            } else {
                Alert.alert("오류", "댓글 정보를 가져오는 데 실패했습니다.");
            }
        } catch (error) {
            console.error("게시글 상세 조회 오류:", error);
            Alert.alert("오류", "게시글 정보를 가져오는 중 문제가 발생했습니다.", [
                { text: "확인", onPress: () => navigation.goBack() },
            ]);
        } finally {
            setLoading(false);
        }
    };


    const addComment = async () => {
        if (!newComment.trim()) {
            Alert.alert("오류", "댓글 내용을 입력해주세요.");
            return;
        }

        try {
            let token = JSON.parse(await SecureStore.getItemAsync("userToken"));
            if (!token) {
                token = await refreshToken();
                if (!token) {
                    Alert.alert("오류", "로그인이 필요합니다.");
                    return;
                }
            }

            const response = await api.post(
                `/api/post/${postNum}/comments`,
                { content: newComment },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                const newCommentData = response.data.comment;
                setComments([...comments, newCommentData]); // 서버에서 반환된 댓글 정보 추가
                setNewComment("");
            } else {
                Alert.alert("오류", "댓글 작성에 실패했습니다.");
            }
        } catch (error) {
            console.error("댓글 추가 오류:", error);
            Alert.alert("오류", "댓글 추가 중 문제가 발생했습니다.");
        }
    };

    useEffect(() => {
        fetchPostDetails();
    }, [postNum]);

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <ActivityIndicator size="large" color="#1A73E8" />
            </SafeAreaView>
        );
    }

    if (!post) {
        return (
            <SafeAreaView style={styles.container}>
                <Text style={styles.errorText}>게시글을 찾을 수 없습니다.</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>게시글 상세</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.contentContainer}>
                <View style={styles.postContainer}>
                    <View style={styles.postHeader}>
                        <Text style={styles.title}>{post.title}</Text>
                        <Text style={styles.meta}>{new Date(post.created_at).toLocaleString()}</Text>
                    </View>
                    <Text style={styles.author}>{post.username}</Text>
                    <View style={styles.separator} />
                    <Text style={styles.content}>{post.content}</Text>
                </View>

                <View style={styles.commentsSection}>
                    <Text style={styles.commentsTitle}>댓글</Text>
                    {comments.map((comment) => (
                        <View key={comment.id} style={styles.commentCard}>
                            <View style={styles.commentHeader}>
                                <Text style={styles.commentAuthor}>{comment.username}</Text>
                                <Text style={styles.commentDate}>
                                    {new Date(comment.created_at).toLocaleString()}
                                </Text>
                            </View>
                            <Text style={styles.commentContent}>{comment.content}</Text>
                        </View>
                    ))}
                </View>
            </ScrollView>

            <View style={styles.commentInputContainer}>
                <TextInput
                    style={styles.commentInput}
                    placeholder="댓글을 입력하세요"
                    value={newComment}
                    onChangeText={setNewComment}
                />
                <TouchableOpacity onPress={addComment} style={styles.commentButton}>
                    <Ionicons name="send" size={20} color="#fff" />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#ddd",
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "bold",
    },
    contentContainer: {
        padding: 16,
    },
    postContainer: {
        backgroundColor: "#f9f9f9",
        padding: 16,
        borderRadius: 8,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    postHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
    },
    meta: {
        fontSize: 14,
        color: "#666",
    },
    author: {
        fontSize: 14,
        color: "#1A73E8",
        marginBottom: 8,
    },
    separator: {
        height: 1,
        backgroundColor: "#ddd",
        marginVertical: 16,
    },
    content: {
        fontSize: 16,
        lineHeight: 24,
    },
    commentsSection: {
        marginTop: 16,
    },
    commentsTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 8,
    },
    commentCard: {
        backgroundColor: "#fff",
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    commentHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 4,
    },
    commentAuthor: {
        fontWeight: "bold",
        fontSize: 14,
    },
    commentDate: {
        fontSize: 12,
        color: "#999",
    },
    commentContent: {
        fontSize: 14,
    },
    commentInputContainer: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: "#ddd",
    },
    commentInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 20,
        padding: 10,
        marginRight: 8,
    },
    commentButton: {
        backgroundColor: "#007bff",
        borderRadius: 20,
        padding: 10,
    },
    errorText: {
        fontSize: 18,
        color: "red",
        textAlign: "center",
        marginTop: 20,
    },
});

export default PostDetailScreen;
