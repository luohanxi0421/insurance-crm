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
} from 'react-native';
import { sendRegisterEmailCode, verifyRegisterEmailCode } from '../lib/api';
import { useAuth } from '../store/authStore';

export default function RegisterScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const { setUser } = useAuth();

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleSendCode = async () => {
    if (!email.trim()) {
      Alert.alert('校验失败', '请先输入邮箱。');
      return;
    }
    if (countdown > 0 || sendingCode) {
      return;
    }

    setSendingCode(true);
    try {
      const { error } = await sendRegisterEmailCode(email.trim());
      if (error) {
        throw error;
      }
      setCountdown(60);
      Alert.alert('发送成功', '请查看邮箱验证码。');
    } catch (err: any) {
      Alert.alert('发送失败', err?.message || '未知错误');
    } finally {
      setSendingCode(false);
    }
  };

  const handleRegister = async () => {
    if (!email.trim() || !verificationCode.trim() || !password.trim() || !confirmPassword.trim()) {
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

    setLoading(true);
    try {
      const { data, error } = await verifyRegisterEmailCode(
        email.trim(),
        verificationCode.trim(),
        password
      );
      if (error) {
        throw error;
      }
      if (!data.user) {
        throw new Error('注册失败，请重新获取验证码后再试。');
      }
      setUser(data.user);
      Alert.alert('成功', '注册完成，已自动登录。');
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('注册失败', err?.message || '未知错误');
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
        <Text style={styles.title}>创建账号</Text>
        <Text style={styles.subtitle}>开始管理你的客户</Text>

        <TextInput
          style={styles.input}
          placeholder="邮箱"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <View style={styles.codeRow}>
          <TextInput
            style={[styles.input, styles.codeInput]}
            placeholder="验证码"
            value={verificationCode}
            onChangeText={setVerificationCode}
            keyboardType="number-pad"
          />
          <TouchableOpacity
            style={[
              styles.codeButton,
              (sendingCode || countdown > 0) && styles.buttonDisabled,
            ]}
            onPress={handleSendCode}
            disabled={sendingCode || countdown > 0}
          >
            <Text style={styles.codeButtonText}>
              {sendingCode ? '发送中...' : countdown > 0 ? `${countdown}s` : '发送'}
            </Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.input}
          placeholder="密码"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TextInput
          style={styles.input}
          placeholder="确认密码"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? '注册中...' : '注册'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.linkText}>已有账号？去登录</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 28 },
  title: { fontSize: 30, fontWeight: '700', color: '#222', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#777', marginBottom: 32 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    marginBottom: 12,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 8,
    marginBottom: 12,
  },
  codeInput: {
    flex: 1,
    marginBottom: 0,
  },
  codeButton: {
    minWidth: 96,
    height: 50,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  codeButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 6,
  },
  buttonDisabled: { opacity: 0.65 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  linkText: { marginTop: 18, textAlign: 'center', color: '#007AFF', fontSize: 14 },
});
