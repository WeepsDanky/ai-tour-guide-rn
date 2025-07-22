import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';

export default function CreateScreen() {
  const router = useRouter();

  useEffect(() => {
    // Navigate to the home screen ('index' of the tabs) with a parameter
    // to signal that the create journey modal should be opened.
    router.replace({ pathname: '/', params: { showCreateModal: 'true' } });
  }, [router]);

  // Return null or a loading indicator as this screen is transient
  return <View style={{ flex: 1, backgroundColor: 'transparent' }} />;
}