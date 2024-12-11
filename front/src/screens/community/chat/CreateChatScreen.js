import React, { useState, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    FlatList,
    Pressable,
    ActivityIndicator,
    Alert,
    Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { theme } from '../../../styles/theme';
import api from '../../../api/api';

const FriendItem = ({ friend, selected, onSelect, isOnline }) => (
    <Pressable
        style={[
            styles.friendItem,
            selected && styles.selectedItem,
            !isOnline && styles.itemDisabled
        ]}
        onPress={() => onSelect(friend)}
        disabled={!isOnline}
    >
        <View style={styles.friendInfo}>
            <View style={styles.profileImage}>
                {friend.profileImage ? (
                    <Image
                        source={{ uri: friend.profileImage }}
                        style={styles.avatar}
                    />
                ) : (
                    <Icon
                        name="user"
                        size={24}
                        color={isOnline ? theme.colors.textSecondary : theme.colors.textDisabled}
                    />
                )}
            </View>
            <Text style={[
                styles.friendName,
                !isOnline && styles.textDisabled
            ]}>
                {friend.name}
            </Text>
        </View>
        {selected && (
            <Icon
                name="check"
                size={20}
                color={theme.colors.primary}
            />
        )}
    </Pressable>
);

const CreateChatScreen = ({ navigation }) => {
    const [friends, setFriends] = useState([]);
    const [selectedFriends, setSelectedFriends] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [isOnline, setIsOnline] = useState(true);

    const checkNetwork = async () => {
        const state = await NetInfo.fetch();
        if (!state.isConnected) {
            setIsOnline(false);
            Alert.alert('네트워크 오류', '인터넷 연결을 확인해주세요.');
            return false;
        }
        setIsOnline(true);
        return true;
    };

    const fetchFriends = useCallback(async () => {
        if (!(await checkNetwork())) {
            const cachedFriends = await AsyncStorage.getItem('friends');
            if (cachedFriends) {
                setFriends(JSON.parse(cachedFriends));
            }
            return;
        }

        try {
            setLoading(true);
            const response = await api.get('/api/friends');
            if (response.data.success) {
                setFriends(response.data.friends);
                await AsyncStorage.setItem('friends',
                    JSON.stringify(response.data.friends));
            }
        } catch (error) {
            Alert.alert('오류',
                error.response?.data?.message || '친구 목록을 불러오는데 실패했습니다');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFriends();
        const unsubscribe = NetInfo.addEventListener(state => {
            setIsOnline(state.isConnected);
        });
        return () => unsubscribe();
    }, [fetchFriends]);

    const handleFriendSelect = (friend) => {
        setSelectedFriends(prev => {
            const isSelected = prev.some(f => f.id === friend.id);
            if (isSelected) {
                return prev.filter(f => f.id !== friend.id);
            }
            return [...prev, friend];
        });
    };

    const handleCreateChat = async () => {
        if (selectedFriends.length === 0) {
            Alert.alert('알림', '채팅할 친구를 선택해주세요.');
            return;
        }

        if (!(await checkNetwork())) return;

        try {
            setLoading(true);
            const response = await api.post('/api/chat/rooms', {
                type: 'individual',
                participants: selectedFriends.map(f => f.id)
            });

            if (response.data.success) {
                navigation.replace('ChatRoom', {
                    roomId: response.data.roomId,
                    isNewChat: true
                });
            }
        } catch (error) {
            Alert.alert('오류',
                error.response?.data?.message || '채팅방 생성에 실패했습니다');
        } finally {
            setLoading(false);
        }
    };

    const filteredFriends = friends.filter(friend =>
        friend.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Pressable
                    onPress={() => navigation.goBack()}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Icon name="x" size={24} color={theme.colors.text} />
                </Pressable>
                <Text style={styles.headerTitle}>새 채팅</Text>
                <Pressable
                    onPress={handleCreateChat}
                    disabled={selectedFriends.length === 0 || loading || !isOnline}
                >
                    <Text style={[
                        styles.createButton,
                        (selectedFriends.length === 0 || !isOnline) && styles.createButtonDisabled
                    ]}>
                        시작
                    </Text>
                </Pressable>
            </View>

            <View style={styles.searchSection}>
                <View style={styles.searchBar}>
                    <Icon name="search" size={20} color={theme.colors.textSecondary} />
                    <TextInput
                        style={[
                            styles.searchInput,
                            !isOnline && styles.inputDisabled
                        ]}
                        placeholder="친구 검색..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor={theme.colors.textTertiary}
                        editable={isOnline}
                    />
                </View>
            </View>

            {selectedFriends.length > 0 && (
                <View style={styles.selectedCount}>
                    <Text style={styles.selectedText}>
                        선택된 친구 {selectedFriends.length}명
                    </Text>
                </View>
            )}

            {loading ? (
                <ActivityIndicator
                    style={styles.loader}
                    size="large"
                    color={theme.colors.primary}
                />
            ) : (
                <FlatList
                    data={filteredFriends}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => (
                        <FriendItem
                            friend={item}
                            selected={selectedFriends.some(f => f.id === item.id)}
                            onSelect={handleFriendSelect}
                            isOnline={isOnline}
                        />
                    )}
                    contentContainerStyle={styles.listContent}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.md,
        backgroundColor: theme.colors.surface,
        ...Platform.select({
            ios: theme.shadows.small,
            android: { elevation: 2 }
        }),
    },
    headerTitle: {
        ...theme.typography.headlineMedium,
        color: theme.colors.text,
    },
    createButton: {
        color: theme.colors.primary,
        fontSize: 16,
        fontWeight: '600',
    },
    createButtonDisabled: {
        color: theme.colors.textDisabled,
    },
    searchSection: {
        padding: theme.spacing.sm,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderRadius: theme.roundness.medium,
        paddingHorizontal: theme.spacing.sm,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    searchInput: {
        flex: 1,
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.xs,
        color: theme.colors.text,
    },
    inputDisabled: {
        color: theme.colors.textDisabled,
    },
    selectedCount: {
        padding: theme.spacing.sm,
        backgroundColor: theme.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    selectedText: {
        color: theme.colors.primary,
        fontWeight: '600',
    },
    friendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: theme.spacing.md,
        backgroundColor: theme.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    selectedItem: {
        backgroundColor: theme.colors.surfaceVariant,
    },
    itemDisabled: {
        opacity: 0.5,
    },
    friendInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    profileImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.surfaceVariant,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: theme.spacing.sm,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    friendName: {
        ...theme.typography.bodyLarge,
        color: theme.colors.text,
    },
    textDisabled: {
        color: theme.colors.textDisabled,
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        flexGrow: 1,
    },
});

export default CreateChatScreen; 