import React, { useEffect, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet, Linking } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Sentry from '@sentry/react-native';
import { useAuth } from './src/store/authStore';
import { supabase } from './src/lib/supabase';
import { setInitialUrl } from './src/lib/deepLinkStore';
import AppNavigator from './src/navigation/AppNavigator';

const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn: sentryDsn,
  enabled: !__DEV__ && Boolean(sentryDsn),
});

function App() {
  const { loading, initialize, setUser, setPasswordResetMode } = useAuth();
  const initialized = useRef(false);

  const handlePasswordResetUrl = (url: string | null) => {
    if (!url) return;
    console.log('🚨 2. 进入处理函数的URL:', url); // 👈 加这一行

    // Supabase sends reset-password deep links as insurancecrm://#access_token=xxx&type=recovery&...
    // The fragment contains type=recovery, not the path 'reset-password'.
    const fragment = url.split('#')[1];
    console.log('🚨 3. 截取到的fragment:', fragment); // 👈 加这一行
    if (!fragment || !fragment.includes('type=recovery')) return;

    try {
      const params = new URLSearchParams(fragment);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      if (!accessToken || !refreshToken) return;

      setPasswordResetMode(true);
      supabase.auth
        .setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })
        .catch(() => {
          setPasswordResetMode(false);
        });
    } catch {
      // Invalid URL – ignore, user can request a new reset link.
    }
  };

  // Capture the initial deep-link URL and process it BEFORE initialize()
  // to avoid a race: initialize() sets loading=false → AppNavigator renders Login,
  // but by the time setPasswordResetMode(true) fires, it's too late.
  useEffect(() => {
    Linking.getInitialURL().then((url) => {
      console.log('🚨 1. 收到的原始URL:', url); // 👈 加这一行
      setInitialUrl(url);
      handlePasswordResetUrl(url);

      // Now that we've processed the deep link, initialize auth.
      if (!initialized.current) {
        initialized.current = true;
        initialize();
      }
    });

    // ② 热启动：App 在后台时点击链接（你现在缺少这段！）
    const subscription = Linking.addEventListener('url', ({ url }) => {
      console.log('🚨 1b. 后台唤醒收到的URL:', url);
      setInitialUrl(url);
      handlePasswordResetUrl(url);
    });
    return () => subscription.remove();
  }, []);

  // Listen for auth state changes (session expiry, token refresh, etc.).
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setPasswordResetMode(true);
      }
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, [setUser, setPasswordResetMode]);

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
