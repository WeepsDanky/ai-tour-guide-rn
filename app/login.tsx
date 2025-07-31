import React, { useState } from 'react';
import { View, Text, TextInput, Alert, Image, TouchableOpacity } from 'react-native';
import { useAuth } from '~/src/context/AuthContext';
import { Button } from '@/ui/atoms/Button';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getCaptcha, sendCode, register, login } from '@/services/auth.service';
import { CaptchaResponse } from '@/types/auth';
import { APIResponse } from '@/types';

type AuthStep = 'login' | 'captcha' | 'emailCode' | 'register';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [captchaCode, setCaptchaCode] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<AuthStep>('login');
  const [captcha, setCaptcha] = useState<CaptchaResponse | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();

  // 获取图形验证码
  const handleGetCaptcha = async () => {
    try {
      const response = await getCaptcha();
      if (response.success && response.data) {
        setCaptcha(response.data);
        setStep('captcha');
      } else {
        Alert.alert('错误', '获取验证码失败');
      }
    } catch (error) {
      Alert.alert('错误', '获取验证码失败');
      console.error(error);
    }
  };

  // 发送邮箱验证码
  const handleSendEmailCode = async () => {
    if (!captcha || !captchaCode) {
      Alert.alert('错误', '请输入图形验证码');
      return;
    }

    setLoading(true);
    try {
      const response = await sendCode({
        email,
        purpose: '01', // 注册
        captchaId: captcha.id,
        captchaCode
      });
      
      if (response.success) {
        Alert.alert('成功', '验证码已发送到您的邮箱');
        setStep('emailCode');
      } else {
        Alert.alert('错误', response.message || '发送验证码失败');
      }
    } catch (error) {
      Alert.alert('错误', '发送验证码失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 注册
  const handleRegister = async () => {
    if (!emailCode) {
      Alert.alert('错误', '请输入邮箱验证码');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('错误', '两次输入的密码不一致');
      return;
    }

    setLoading(true);
    try {
      const response = await register({
        email,
        password,
        password2: confirmPassword,
        code: emailCode
      });
      
      if (response.success) {
        Alert.alert('成功', '注册成功，请登录', [
          { text: '确定', onPress: () => handleBackToLogin() }
        ]);
      } else {
        Alert.alert('错误', response.message || '注册失败');
      }
    } catch (error) {
      Alert.alert('错误', '注册失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 登录
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('错误', '请输入邮箱和密码');
      return;
    }

    setLoading(true);
    try {
      // 先尝试登录
      const response = await login(email, password);
      console.log('Login response:', response);
      
      // 检查响应是否成功 - 服务器返回success=true且code不是错误码
      if (response.success === true && response.code !== '1020' && response.data) {
        await signIn(email, password);
      } else {
        // 登录失败，根据错误码提示相应信息
        if (response.code === '1020') {
          Alert.alert('提示', '登录失败，该邮箱可能未注册，是否进行注册？', [
            { text: '取消', style: 'cancel' },
            { text: '注册', onPress: () => {
              setIsRegistering(true);
              handleGetCaptcha();
            }}
          ]);
        } else {
          Alert.alert('错误', response.message || '登录失败，请重试');
        }
      }
    } catch (error) {
      // 网络错误或其他异常
      Alert.alert('提示', '网络错误或该邮箱未注册，是否进行注册？', [
        { text: '取消', style: 'cancel' },
        { text: '注册', onPress: () => {
          setIsRegistering(true);
          handleGetCaptcha();
        }}
      ]);
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  // 返回登录界面
  const handleBackToLogin = () => {
    setStep('login');
    setIsRegistering(false);
    setCaptcha(null);
    setCaptchaCode('');
    setEmailCode('');
    setConfirmPassword('');
  };

  // 刷新验证码
  const handleRefreshCaptcha = () => {
    setCaptchaCode('');
    handleGetCaptcha();
  };

  const renderLoginStep = () => (
    <>
      <View className="items-center mt-20 mb-10">
        <FontAwesome name="user-circle" size={80} color="#3B82F6" />
        <Text className="text-3xl font-bold text-gray-900 mt-4">欢迎回来</Text>
        <Text className="text-gray-600 mt-1">输入邮箱和密码登录或注册</Text>
      </View>
      
      <View className="space-y-4">
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="邮箱"
          autoCapitalize="none"
          keyboardType="email-address"
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
          title="登录/注册" 
          onPress={handleLogin} 
          loading={loading}
          size="large"
          disabled={loading}
        />
      </View>
    </>
  );

  const renderCaptchaStep = () => (
    <>
      <View className="items-center mt-20 mb-10">
        <FontAwesome name="shield" size={80} color="#3B82F6" />
        <Text className="text-3xl font-bold text-gray-900 mt-4">验证码验证</Text>
        <Text className="text-gray-600 mt-1">请输入图形验证码</Text>
      </View>
      
      <View className="space-y-4">
        {captcha && (
          <View className="items-center mb-4">
            <TouchableOpacity onPress={handleRefreshCaptcha}>
              <Image 
                source={{ uri: `data:image/png;base64,${captcha.image}` }} 
                style={{ width: 400, height: 110 }}
                className="border border-gray-300 rounded"
                resizeMode="contain"
              />
            </TouchableOpacity>
            <Text className="text-sm text-gray-500 mt-2">点击图片刷新验证码</Text>
          </View>
        )}
        
        <TextInput
          value={captchaCode}
          onChangeText={setCaptchaCode}
          placeholder="请输入图形验证码"
          autoCapitalize="none"
          className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full my-2 p-4"
        />
      </View>
      
      <View className="mt-8 space-y-4">
        <Button 
          title="发送邮箱验证码" 
          onPress={handleSendEmailCode} 
          loading={loading}
          size="large"
          disabled={loading}
        />
        <Button 
          title="返回" 
          onPress={handleBackToLogin} 
          variant="outline"
          size="large"
        />
      </View>
    </>
  );

  const renderEmailCodeStep = () => (
    <>
      <View className="items-center mt-20 mb-10">
        <FontAwesome name="envelope" size={80} color="#3B82F6" />
        <Text className="text-3xl font-bold text-gray-900 mt-4">邮箱验证</Text>
        <Text className="text-gray-600 mt-1">验证码已发送到 {email}</Text>
      </View>
      
      <View className="space-y-4">
        <TextInput
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="确认密码"
          secureTextEntry
          className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full my-2 p-4"
        />
        <TextInput
          value={emailCode}
          onChangeText={setEmailCode}
          placeholder="请输入邮箱验证码"
          keyboardType="numeric"
          className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-4"
        />
      </View>
      
      <View className="mt-8 space-y-4">
        <Button 
          title="完成注册" 
          onPress={handleRegister} 
          loading={loading}
          size="large"
          disabled={loading}
        />
        <Button 
          title="返回" 
          onPress={handleBackToLogin} 
          variant="outline"
          size="large"
        />
      </View>
    </>
  );

  return (
    <View className="flex-1 bg-gray-50 p-6">
      {step === 'login' && renderLoginStep()}
      {step === 'captcha' && renderCaptchaStep()}
      {step === 'emailCode' && renderEmailCodeStep()}
    </View>
  );
}