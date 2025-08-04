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
          title: '社区',
          tabBarLabel: '社区',
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: '游览',
          tabBarLabel: '游览',
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