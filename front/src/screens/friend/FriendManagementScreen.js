import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    Alert,
    ActivityIndicator,
} from 'react-native';
import api from '../../api/api';
import * as SecureStore from 'expo-secure-store';
import refreshToken from '../../tokenRefresh/refreshToken'; // JWT 갱신 함수

const FriendManagementScreen = () => {
    const [friends, setFriends] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]); // 친구 요청 리스트
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [searchResult, setSearchResult] = useState(null); // 검색 결과 상태

    useEffect(() => {
        fetchFriends();
        fetchPendingRequests();
    }, []);

    // 친구 목록 가져오기
    const fetchFriends = async () => {
        setLoading(true);
        try {
            let accessToken = JSON.parse(await SecureStore.getItemAsync('userToken'));
            if (!accessToken) {
                accessToken = await refreshToken(); // 토큰 갱신 시도
                if (!accessToken) {
                    Alert.alert('오류', '로그인이 필요합니다.');
                    return;
                }
            }
            const response = await api.get('/api/friends', {
                headers: { Authorization: `Bearer ${accessToken}` },
            });

            if (response?.data?.success) {
                setFriends(response.data.friends);
            } else {
                Alert.alert('오류', '친구 목록을 가져오는 데 실패했습니다.');
            }
        } catch (error) {
            console.error('친구 목록 가져오기 오류:', error);
            Alert.alert('오류', '친구 목록을 불러오는 중 문제가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    // 친구 요청 목록 가져오기
    const fetchPendingRequests = async () => {
        setLoading(true);
        try {
            let accessToken = JSON.parse(await SecureStore.getItemAsync('userToken'));
            if (!accessToken) {
                accessToken = await refreshToken();
                if (!accessToken) return;
            }

            const response = await api.get('/api/friends/pending', {
                headers: { Authorization: `Bearer ${accessToken}` },
            });

            if (response?.data?.success) {
                setPendingRequests(response.data.requests);
            } else {
                Alert.alert('오류', '친구 요청 목록을 가져오는 데 실패했습니다.');
            }
        } catch (error) {
            console.error('친구 요청 목록 가져오기 오류:', error);
            Alert.alert('오류', '친구 요청 목록을 가져오는 중 문제가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    // 친구 검색
    const searchFriend = async () => {
        if (!searchQuery.trim()) {
            Alert.alert('오류', '검색어를 입력해주세요.');
            return;
        }

        try {
            let accessToken = JSON.parse(await SecureStore.getItemAsync('userToken'));
            if (!accessToken) {
                accessToken = await refreshToken();
                if (!accessToken) return;
            }

            const response = await api.get(`/api/friends/search?query=${encodeURIComponent(searchQuery)}`, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });

            if (response?.data?.success) {
                setSearchResult(response.data.user);
            } else {
                setSearchResult(null);
                Alert.alert('알림', '사용자를 찾을 수 없습니다.');
            }
        } catch (error) {
            console.error('친구 검색 오류:', error);
            Alert.alert('오류', '친구 검색 중 문제가 발생했습니다.');
        }
    };

    // 친구 요청 전송
    const sendFriendRequest = async (friendId) => {
        try {
            let accessToken = JSON.parse(await SecureStore.getItemAsync('userToken'));
            if (!accessToken) {
                accessToken = await refreshToken();
                if (!accessToken) return;
            }

            const response = await api.post(
                '/api/friends/request',
                { friendId },
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );

            if (response?.data?.success) {
                Alert.alert('알림', '친구 요청을 보냈습니다.');
                setSearchResult(null); // 검색 결과 초기화
            } else {
                Alert.alert('오류', response.data.message || '친구 요청에 실패했습니다.');
            }
        } catch (error) {
            console.error('친구 요청 오류:', error);
            Alert.alert('오류', '친구 요청 중 문제가 발생했습니다.');
        }
    };

    // 친구 요청 수락
    const acceptRequest = async (requestId) => {
        try {
            let accessToken = JSON.parse(await SecureStore.getItemAsync('userToken'));
            if (!accessToken) {
                accessToken = await refreshToken();
                if (!accessToken) return;
            }

            const response = await api.post(
                `/api/friends/accept/${requestId}`,
                {},
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );

            if (response?.data?.success) {
                Alert.alert('알림', '친구 요청을 수락했습니다.');
                fetchFriends(); // 친구 목록 갱신
                fetchPendingRequests(); // 요청 목록 갱신
            } else {
                Alert.alert('오류', response.data.message || '친구 요청 수락에 실패했습니다.');
            }
        } catch (error) {
            console.error('친구 요청 수락 오류:', error);
            Alert.alert('오류', '친구 요청 수락 중 문제가 발생했습니다.');
        }
    };

    // 친구 요청 거절
    const rejectRequest = async (requestId) => {
        try {
            let accessToken = await SecureStore.getItemAsync('userToken');
            if (!accessToken) {
                accessToken = await refreshToken();
                if (!accessToken) return;
            }

            const response = await api.post(
                `/api/friends/reject/${requestId}`,
                {},
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );

            if (response?.data?.success) {
                Alert.alert('알림', '친구 요청을 거절했습니다.');
                fetchPendingRequests(); // 요청 목록 갱신
            } else {
                Alert.alert('오류', response.data.message || '친구 요청 거절에 실패했습니다.');
            }
        } catch (error) {
            console.error('친구 요청 거절 오류:', error);
            Alert.alert('오류', '친구 요청 거절 중 문제가 발생했습니다.');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>친구 관리</Text>

            {/* 친구 검색 */}
            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="친구 검색 (아이디)"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                <TouchableOpacity style={styles.searchButton} onPress={searchFriend}>
                    <Text style={styles.searchButtonText}>검색</Text>
                </TouchableOpacity>
            </View>

            {searchResult && (
                <View style={styles.searchResultCard}>
                    <Text style={styles.friendName}>{searchResult.username}</Text>
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => sendFriendRequest(searchResult.id)}
                    >
                        <Text style={styles.addButtonText}>친구 추가</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* 친구 요청 리스트 */}
            <FlatList
                data={pendingRequests}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <View style={styles.requestCard}>
                        <Text style={styles.friendName}>{item.username}</Text>
                        <View style={styles.requestActions}>
                            <TouchableOpacity
                                style={styles.acceptButton}
                                onPress={() => acceptRequest(item.id)}
                            >
                                <Text style={styles.acceptButtonText}>수락</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.rejectButton}
                                onPress={() => rejectRequest(item.id)}
                            >
                                <Text style={styles.rejectButtonText}>거절</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
                ListEmptyComponent={() => <Text style={styles.emptyText}>받은 친구 요청이 없습니다.</Text>}
            />

            {/* 친구 목록 */}
            {loading ? (
                <ActivityIndicator size="large" color="#0066FF" />
            ) : (
                <FlatList
                    data={friends}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                        <View style={styles.friendItem}>
                            <Text style={styles.friendName}>{item.username}</Text>
                            <TouchableOpacity
                                style={styles.deleteButton}
                                onPress={() => deleteFriend(item.id)}
                            >
                                <Text style={styles.deleteButtonText}>삭제</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                    ListEmptyComponent={() => <Text style={styles.emptyText}>등록된 친구가 없습니다.</Text>}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    // Same styles as in the original code with additional styles for requests
    requestCard: {
        padding: 15,
        backgroundColor: '#f0f4f7',
        borderRadius: 10,
        marginVertical: 10,
    },
    requestActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    acceptButton: {
        backgroundColor: '#4CAF50',
        padding: 10,
        borderRadius: 5,
    },
    acceptButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    rejectButton: {
        backgroundColor: '#FF6B6B',
        padding: 10,
        borderRadius: 5,
    },
    rejectButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    searchContainer: {
        flexDirection: 'row',
        marginBottom: 20,
        alignItems: 'center',
    },
    searchInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        paddingHorizontal: 10,
        marginRight: 10,
    },
    searchButton: {
        backgroundColor: '#0066FF',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 5,
    },
    searchButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    friendItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderColor: '#eee',
        backgroundColor: '#f9f9f9',
        borderRadius: 5,
        marginBottom: 10,
    },
    friendName: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    deleteButton: {
        backgroundColor: '#FF6B6B',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 5,
    },
    deleteButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    emptyText: {
        textAlign: 'center',
        color: '#888',
        marginTop: 20,
    },
    searchResultCard: {
        padding: 15,
        marginVertical: 10,
        backgroundColor: '#f0f4f7',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    addButton: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 5,
    },
    addButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});

export default FriendManagementScreen;
