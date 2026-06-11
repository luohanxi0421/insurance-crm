import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../store/authStore';
import { getInitialUrl } from '../lib/deepLinkStore';

export default function ResetPasswordScreen() {
  const { isPasswordResetMode, setPasswordResetMode } = useAuth();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // If App.tsx already handled the deep link and set the recovery session,
    // show the password form directly.
    console.log('🔍 [Reset] isPasswordResetMode:', isPasswordResetMode);
    if (isPasswordResetMode) {
      setReady(true);
      setError(null);
      return;
    }

    // Otherwise, try reading the URL from our early cache.
    try {
      const initialUrl = getInitialUrl();
      console.log('🔍 [Reset] 获取到的URL:', initialUrl);
      if (!initialUrl || !initialUrl.includes('reset-password')) {
        console.log('❌ [Reset] URL不包含reset-password');
        setError('未检测到重置链接，请通过邮箱中的链接打开此页面。');
        return;
      }

      const fragment = initialUrl.split('#')[1];
      console.log('🔍 [Reset] Fragment(#后面部分):', fragment);
      if (!fragment) {
        setError('重置链接格式无效，请重新获取重置链接。');
        return;
      }

      const params = new URLSearchParams(fragment);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      console.log('🔍 [Reset] 解析出的Token:', {
        accessToken: !!accessToken,
        refreshToken: !!refreshToken,
      });
      if (!accessToken || !refreshToken) {
        setError('重置链接格式无效，请重新获取重置链接。');
        return;
      }

      setPasswordResetMode(true);

      supabase.auth
        .setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })
        .then(() => {
          setReady(true);
        })
        .catch((err: any) => {
          setPasswordResetMode(false);
          setError(err?.message || '链接验证失败，请重新获取重置链接。');
        });
    } catch {
      setError('链接验证失败，请重新获取重置链接。');
    }
  }, [isPasswordResetMode, setPasswordResetMode]);

  const handleReset = async () => {
    if (!password.trim() || !confirmPassword.trim()) {
      Alert.alert('校验失败', '请完整填写所有字段。');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('校验失败', '两次输入的密码不一致。');
      return;
    }

    if (password.length < 6) {
      Alert.alert('校验失败', '密码长度至少 6 位。');
      return;
    }

    setSaving(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password.trim(),
      });
      if (updateError) throw updateError;

      // Reset complete – switch back to normal authenticated mode.
      setPasswordResetMode(false);

      Alert.alert('密码已重置', '请使用新密码登录。');
    } catch (err: any) {
      Alert.alert('重置失败', err?.message || '未知错误');
    } finally {
      setSaving(false);
    }
  };

  // ---- Loading ----
  if (!ready && !error) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>验证重置链接中...</Text>
      </View>
    );
  }

  // ---- Error ----
  if (error) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  // ---- Password form ----
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>设置新密码</Text>
        <Text style={styles.subtitle}>请为您的账号设置一个新的登录密码。</Text>

        <TextInput
          style={styles.input}
          placeholder="新密码"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TextInput
          style={styles.input}
          placeholder="确认新密码"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.button, saving && styles.buttonDisabled]}
          onPress={handleReset}
          disabled={saving}
        >
          <Text style={styles.buttonText}>
            {saving ? '重置中...' : '重置密码'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 28 },
  title: { fontSize: 30, fontWeight: '700', color: '#222', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#777', marginBottom: 32, lineHeight: 22 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 6,
  },
  buttonDisabled: { opacity: 0.65 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  loadingText: { marginTop: 16, fontSize: 14, color: '#888' },
  errorText: {
    fontSize: 15,
    color: '#d32f2f',
    textAlign: 'center',
    lineHeight: 22,
  },
});
