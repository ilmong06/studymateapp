import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Screens
import IntroScreen from './src/screens/auth/IntroScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import SignUpScreen from './src/screens/auth/SignUpScreen';
import FindAccountScreen from './src/screens/auth/FindAccountScreen';
import ResetPasswordScreen from './src/screens/auth/ResetPasswordScreen';
import HomeScreen from './src/screens/home/HomeScreen';
import NaverLoginScreen from "./src/screens/auth/NaverLoginScreen ";
import KakaoLoginScreen from "./src/screens/auth/KakaoLoginScreen";
import ChatListScreen from './src/screens/chat/ChatListScreen';

// Navigation Stacks
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Tab Navigator (Home Tabs)
const HomeTabs = () => {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ color, size }) => {
                    let iconName;

                    switch (route.name) {
                        case 'Home':
                            iconName = 'home-outline';
                            break;
                        case 'Profile':
                            iconName = 'person-outline';
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
            <Tab.Screen name="ChatList" component={ChatListScreen} options={{ headerShown: false }} />
            {/* Profile, Settings or other screens can be added later */}
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

            {/* Main App Flow */}
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
