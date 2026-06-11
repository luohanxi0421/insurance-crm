import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { supabase } from '../lib/supabase';

export default function ForgotPasswordScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async () => {
    if (!email.trim()) {
      Alert.alert('校验失败', '请输入注册时使用的邮箱。');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: 'insurancecrm://reset-password',
        }
      );
      if (error) throw error;

      setSent(true);
      Alert.alert(
        '发送成功',
        '密码重置链接已发送到您的邮箱，请查收并点击链接重置密码。'
      );
    } catch (err: any) {
      Alert.alert('发送失败', err?.message || '未知错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>找回密码</Text>
        <Text style={styles.subtitle}>
          {sent
            ? '重置链接已发送，请前往邮箱查看。'
            : '输入注册邮箱，我们将发送密码重置链接。'}
        </Text>

        <TextInput
          style={styles.input}
          placeholder="邮箱"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!sent}
        />

        {!sent ? (
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleReset}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? '发送中...' : '发送重置链接'}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.buttonText}>返回登录</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.linkText}>返回登录</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
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
  linkText: {
    marginTop: 18,
    textAlign: 'center',
    color: '#007AFF',
    fontSize: 14,
  },
});
