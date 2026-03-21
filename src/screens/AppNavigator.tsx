import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ClientListScreen from '../screens/ClientListScreen';
import ClientDetailScreen from '../screens/ClientDetailScreen';
import ClientFormScreen from '../screens/ClientFormScreen';
import VisitListScreen from '../screens/VisitListScreen';
import VisitFormScreen from '../screens/VisitFormScreen';
import BirthdayScreen from '../screens/BirthdayScreen';
import { useAuth } from '../store/authStore';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Main: undefined;
  ClientDetail: { clientId: string };
  ClientForm: { clientId?: string };
  VisitList: { clientId: string };
  VisitForm: { clientId: string };
  BloodRelationForm: { clientId: string };
  SpouseRelationForm: { clientId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

function MainTab() {
  return (
    <Tab.Navigator screenOptions={{ tabBarActiveTintColor: '#007AFF' }}>
      <Tab.Screen name="Clients" component={ClientListScreen} options={{ title: '客户管理' }} />
      <Tab.Screen name="Birthdays" component={BirthdayScreen} options={{ title: '生日提醒' }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user } = useAuth();
  return (
    <NavigationContainer>
      <Stack.Navigator>
        {user ? (
          <>
            <Stack.Screen name="Main" component={MainTab} options={{ headerShown: false }} />
            <Stack.Screen name="ClientDetail" component={ClientDetailScreen} options={{ title: '客户详情' }} />
            <Stack.Screen name="ClientForm" component={ClientFormScreen} options={({ route }) => ({ title: route.params?.clientId ? '编辑客户' : '新增客户' })} />
            <Stack.Screen name="VisitList" component={VisitListScreen} options={{ title: '拜访记录' }} />
            <Stack.Screen name="VisitForm" component={VisitFormScreen} options={{ title: '添加记录' }} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ title: '注册账户' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}