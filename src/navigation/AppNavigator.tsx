import React, { useMemo } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import ClientListScreen from '../screens/ClientListScreen';
import ClientDetailScreen from '../screens/ClientDetailScreen';
import ClientFormScreen from '../screens/ClientFormScreen';
import VisitListScreen from '../screens/VisitListScreen';
import VisitFormScreen from '../screens/VisitFormScreen';
import BirthdayScreen from '../screens/BirthdayScreen';
import BloodRelationFormScreen from '../screens/BloodRelationFormScreen';
import SpouseRelationFormScreen from '../screens/SpouseRelationFormScreen';
import { useAuth } from '../store/authStore';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: undefined;
  ClientList: undefined;
  BirthdayList: undefined;
  ClientDetail: { clientId: string };
  ClientForm: { clientId?: string } | undefined;
  VisitList: { clientId: string };
  VisitForm: { clientId: string; visitId?: string };
  BloodRelationForm: { clientId: string };
  SpouseRelationForm: { clientId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { user, isPasswordResetMode } = useAuth();

  const linking = useMemo(() => ({
    prefixes: ['insurancecrm://'],
    config: {
      screens: {
        ResetPassword: 'reset-password',
      },
    },
  }), []);

  // During password-reset flow, keep the auth stack visible so
  // ResetPasswordScreen can complete before switching to the main app.
  const showAuthStack = !user || isPasswordResetMode;

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator>
        {showAuthStack ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ title: '登录' }} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ title: '注册' }} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ title: '找回密码' }} />
            <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} options={{ title: '重置密码', headerShown: false }} />
          </>
        ) : (
          <>
            <Stack.Screen
              name="ClientList"
              component={ClientListScreen}
              options={({ navigation }) => ({
                title: '客户列表',
                headerRight: () => null,
              })}
            />
            <Stack.Screen
              name="BirthdayList"
              component={BirthdayScreen}
              options={{ title: '生日提醒' }}
            />
            <Stack.Screen
              name="ClientDetail"
              component={ClientDetailScreen}
              options={{ title: '客户详情' }}
            />
            <Stack.Screen
              name="ClientForm"
              component={ClientFormScreen}
              options={({ route }) => ({
                title: route.params?.clientId ? '编辑客户' : '新增客户',
              })}
            />
            <Stack.Screen
              name="VisitList"
              component={VisitListScreen}
              options={{ title: '拜访记录' }}
            />
            <Stack.Screen
              name="VisitForm"
              component={VisitFormScreen}
              options={({ route }) => ({
                title: route.params?.visitId ? '编辑拜访' : '新增拜访',
              })}
            />
            <Stack.Screen
              name="BloodRelationForm"
              component={BloodRelationFormScreen}
              options={{ title: '添加血缘关系' }}
            />
            <Stack.Screen
              name="SpouseRelationForm"
              component={SpouseRelationFormScreen}
              options={{ title: '添加伴侣关系' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
