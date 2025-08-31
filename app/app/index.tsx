import { Redirect } from 'expo-router';

// 重定向到相机页面作为应用首页
export default function Index() {
  return <Redirect href="/camera" />;
}