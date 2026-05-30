import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Sentry from '@sentry/react-native';
import { useAuth } from './src/store/authStore';
import { supabase } from './src/lib/supabase';
import AppNavigator from './src/navigation/AppNavigator';

const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn: sentryDsn,
  enabled: !__DEV__ && Boolean(sentryDsn),
});

function App() {
  const { loading, initialize, setUser } = useAuth();

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Listen for auth state changes (session expiry, token refresh, etc.).
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );
    return () => subscription.unsubscribe();
  }, [setUser]);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <AppNavigator />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});

export default Sentry.wrap(App);
