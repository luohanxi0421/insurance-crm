import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { signUp } from '../lib/api';
import { useAuth } from '../store/authStore';

export default function RegisterScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuth();

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) { Alert.alert('提示', '请填写所有字段'); return; }
    if (password !== confirmPassword) { Alert.alert('提示', '两次密码不一致'); return; }
    if (password.length < 6) { Alert.alert('提示', '密码至少 6 位'); return; }
    setLoading(true);
    try {
      const { data, error } = await signUp(email, password);
      if (error) throw error;
      if (data.user) setUser(data.user);
    } catch (err: any) {
      Alert.alert('注册失败', err.message || '请稍后重试');
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.content}>
        <Text style={styles.title}>创建账户</Text>
        <Text style={styles.subtitle}>注册开始使用</Text>
        <TextInput style={styles.input} placeholder="邮箱" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <TextInput style={styles.input} placeholder="密码（至少 6 位）" value={password} onChangeText={setPassword} secureTextEntry />
        <TextInput style={styles.input} placeholder="确认密码" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
        <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleRegister} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? '注册中...' : '注册'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.linkText}>已有账户？去登录</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 32 },
  title: { fontSize: 28, fontWeight: '700', color: '#333', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#888', marginBottom: 40 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 14, fontSize: 16, marginBottom: 16 },
  button: { backgroundColor: '#007AFF', borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  linkText: { color: '#007AFF', fontSize: 14, textAlign: 'center', marginTop: 20 },
});