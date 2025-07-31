import { Tabs } from 'expo-router';
import { CustomTabBar } from '@/navigation/CustomTabBar';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: '发现',
          tabBarLabel: '发现',
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: '创建',
          tabBarLabel: '创建',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '我的',
          tabBarLabel: '我的',
        }}
      />
    </Tabs>
  );
} 