import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
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
  ClientList: undefined;
  BirthdayList: undefined;
  ClientDetail: { clientId: string };
  ClientForm: { clientId?: string } | undefined;
  VisitList: { clientId: string };
  VisitForm: { clientId: string };
  BloodRelationForm: { clientId: string };
  SpouseRelationForm: { clientId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { user } = useAuth();

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {user ? (
          <>
            <Stack.Screen
              name="ClientList"
              component={ClientListScreen}
              options={({ navigation }) => ({
                title: 'Clients',
                headerRight: () => null,
              })}
            />
            <Stack.Screen
              name="BirthdayList"
              component={BirthdayScreen}
              options={{ title: 'Birthday Reminders' }}
            />
            <Stack.Screen
              name="ClientDetail"
              component={ClientDetailScreen}
              options={{ title: 'Client Detail' }}
            />
            <Stack.Screen
              name="ClientForm"
              component={ClientFormScreen}
              options={({ route }) => ({
                title: route.params?.clientId ? 'Edit Client' : 'New Client',
              })}
            />
            <Stack.Screen
              name="VisitList"
              component={VisitListScreen}
              options={{ title: 'Visit Records' }}
            />
            <Stack.Screen
              name="VisitForm"
              component={VisitFormScreen}
              options={{ title: 'New Visit' }}
            />
            <Stack.Screen
              name="BloodRelationForm"
              component={BloodRelationFormScreen}
              options={{ title: 'Add Blood Relation' }}
            />
            <Stack.Screen
              name="SpouseRelationForm"
              component={SpouseRelationFormScreen}
              options={{ title: 'Add Partner Relation' }}
            />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Login' }} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Register' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
