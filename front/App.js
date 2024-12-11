import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Screens
import ChatMainScreen from "./src/screens/chat/ChatMainScreen";
import ChatRoomScreen from "./src/screens/chat/ChatRoomScreen";
import CreateChatRoomScreen from "./src/screens/chat/CreateChatRoomScreen";

import PostMainScreen from "./src/screens/board/PostMainScreen";
import PostDetailScreen from "./src/screens/board/PostDetailScreen";
import WritePostScreen from "./src/screens/board/WritePostScreen";

import MyPageScreen from './src/screens/mypage/MyPageScreen';
import ChangeUserInfoScreen from './src/screens/mypage/ChangeUserInfoScreen';
import CheckUserInfoScreen from './src/screens/mypage/CheckUserInfoScreen';
import DeleteAccountScreen from './src/screens/mypage/DeleteAccountScreen';

import FriendManagementScreen from './src/screens/friend/FriendManagementScreen';

import StudyMainScreen from './src/screens/study/LearningDashboardScreen';
import SubjectScreen from './src/screens/study/SubjectScreen';
import TimerScreen from './src/screens/study/TimerScreen';
import WeeklyGoalsScreen from './src/screens/study/WeeklyGoalsScreen';

import IntroScreen from "./src/screens/auth/IntroScreen";
import LoginScreen from "./src/screens/auth/LoginScreen";
import SignUpScreen from "./src/screens/auth/SignUpScreen";
import KakaoLoginScreen from "./src/screens/auth/KakaoLoginScreen";
import NaverLoginScreen from "./src/screens/auth/NaverLoginScreen";
import ResetPasswordScreen from "./src/screens/auth/ResetPasswordScreen";
import FindAccountScreen from "./src/screens/auth/FindAccountScreen";


// Navigation Stacks
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Auth Stack
const AuthStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Intro" component={IntroScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="KakaoLogin" component={KakaoLoginScreen} />
        <Stack.Screen name="NaverLogin" component={NaverLoginScreen} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        <Stack.Screen name="FindAccount" component={FindAccountScreen} />
    </Stack.Navigator>
)

// Study Stack
const StudyStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="LearningDashboard" component={StudyMainScreen} />
        <Stack.Screen name="Subject" component={SubjectScreen} />
        <Stack.Screen name="Timer" component={TimerScreen} />
        <Stack.Screen name="WeeklyGoals" component={WeeklyGoalsScreen} />
    </Stack.Navigator>
);

// Chat Stack
const ChatStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="ChatMain" component={ChatMainScreen} />
        <Stack.Screen name="ChatRoom" component={ChatRoomScreen} />
        <Stack.Screen name="CreateChatRoom" component={CreateChatRoomScreen} />
    </Stack.Navigator>
);

// Post Stack
const PostStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="PostMain" component={PostMainScreen} />
        <Stack.Screen name="PostDetail" component={PostDetailScreen} />
        <Stack.Screen name="WritePost" component={WritePostScreen} />
    </Stack.Navigator>
);

// MyPage Stack
const MyPageStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MyPage" component={MyPageScreen} />
        <Stack.Screen name="ChangeUserInfo" component={ChangeUserInfoScreen} />
        <Stack.Screen name="CheckUserInfo" component={CheckUserInfoScreen} />
        <Stack.Screen name="DeleteAccount" component={DeleteAccountScreen} />
    </Stack.Navigator>
);

// Friend Stack
const FriendStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="FriendManagement" component={FriendManagementScreen} />
    </Stack.Navigator>
);

// Tab Navigator (Home Tabs)
const HomeTabs = () => {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ color, size }) => {
                    let iconName;

                    switch (route.name) {
                        case 'Study':
                            iconName = 'book-outline';
                            break;
                        case 'Chat':
                            iconName = 'chatbubble-outline';
                            break;
                        case 'Post':
                            iconName = 'document-text-outline';
                            break;
                        case 'MyPage':
                            iconName = 'person-outline';
                            break;
                        case 'Friend':
                            iconName = 'people-outline';
                            break;
                        default:
                            iconName = 'ellipse-outline';
                            break;
                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#0066FF',
                tabBarInactiveTintColor: '#999',
            })}
        >
            <Tab.Screen name="Study" component={StudyStack} options={{ title: '학습' }} />
            <Tab.Screen name="Chat" component={ChatStack} options={{ title: '채팅' }} />
            <Tab.Screen name="Post" component={PostStack} options={{ title: '게시판' }} />
            <Tab.Screen name="Friend" component={FriendStack} options={{ title: '친구' }} />
            <Tab.Screen name="MyPage" component={MyPageStack} options={{ title: '마이페이지' }} />
        </Tab.Navigator>
    );
};

// Main Stack Navigator
const AppNavigator = () => {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                gestureEnabled: true,
            }}
        >
            {/* Authentication Flow */}
            <Stack.Screen name="Intro" component={IntroScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
            <Stack.Screen name="FindAccount" component={FindAccountScreen} />
            <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
            <Stack.Screen name="NaverLogin" component={NaverLoginScreen} />
            <Stack.Screen name="KakaoLogin" component={KakaoLoginScreen} />


            <Stack.Screen name="HomeTabs" component={HomeTabs} />
        </Stack.Navigator>
    );
};

// App Component
const App = () => {
    return (
        <NavigationContainer>
            <AppNavigator />
        </NavigationContainer>
    );
};

export default App;
