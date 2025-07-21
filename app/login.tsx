import React, { useState } from 'react';
import { View, Text, TextInput, Alert } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/ui/atoms/Button';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('错误', '请输入用户名和密码。');
      return;
    }
    setLoading(true);
    try {
      await signIn(username, password);
      // Alert.alert('登录成功', '欢迎回来！');
    } catch (error) {
      Alert.alert('登录失败', '用户名或密码错误，请重试。');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-50 p-6">
      <View className="items-center mt-20 mb-10">
        <FontAwesome name="user-circle" size={80} color="#3B82F6" />
        <Text className="text-3xl font-bold text-gray-900 mt-4">欢迎回来</Text>
        <Text className="text-gray-600 mt-1">注册或登录以继续您的旅程</Text>
      </View>
      
      <View className="space-y-4">
        <TextInput
          value={username}
          onChangeText={setUsername}
          placeholder="用户名或邮箱"
          autoCapitalize="none"
          className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full my-2 p-4"
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="密码"
          secureTextEntry
          className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-4"
        />
      </View>
      
      <View className="mt-8">
        <Button 
          title="注册/登录" 
          onPress={handleLogin} 
          loading={loading}
          size="large"
          disabled={loading}
        />
      </View>
    </View>
  );
} 