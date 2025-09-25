import React from 'react';
import { SafeAreaView, StatusBar, View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '../lib/tokens';

export default function ProfileScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.colors.background }}>
      <StatusBar barStyle="light-content" backgroundColor={tokens.colors.background} />

      {/* 顶部返回与标题 */}
      <View style={{
        paddingTop: tokens.spacing.md,
        paddingHorizontal: tokens.spacing.lg,
        paddingBottom: tokens.spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: tokens.sizing.touchTarget.min,
            height: tokens.sizing.touchTarget.min,
            borderRadius: tokens.borderRadius.md,
            backgroundColor: tokens.colors.overlay.medium,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color={tokens.colors.text} />
        </TouchableOpacity>

        <Text style={{
          color: tokens.colors.text,
          fontSize: tokens.typography.fontSize.h2,
          fontFamily: tokens.typography.fontFamily.chinese,
          fontWeight: '600',
        }}>
          个人设置
        </Text>

        {/* 占位保持居中标题 */}
        <View style={{ width: tokens.sizing.touchTarget.min }} />
      </View>

      {/* 内容占位 */}
      <View style={{ flex: 1, paddingHorizontal: tokens.spacing.lg }}>
        <View style={{
          padding: tokens.spacing.lg,
          borderRadius: tokens.borderRadius.lg,
          backgroundColor: tokens.colors.overlay.medium,
        }}>
          <Text style={{ color: tokens.colors.text }}>
            这里将展示账户与偏好设置（开发中）。
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}


