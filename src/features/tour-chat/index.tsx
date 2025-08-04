import { View, FlatList, SafeAreaView } from 'react-native';
import { usePOIData } from './hooks/usePOIData';
import { useChat } from './hooks/useChat';
import POICard from './components/POICard';
import RecommendedRoutes from './components/RecommendedRoutes';
import ChatBubble from './components/ChatBubble';
import ChatInput from './components/ChatInput';

export default function TourChatScreen() {
  const { poi, loading } = usePOIData('static-or-last-recognised');
  const { messages, sendPhoto } = useChat([]);

  // Prepare data for FlatList
  const data = [
    { key: 'poi', type: 'poi' },
    { key: 'routes', type: 'routes' },
    ...messages.map(m => ({ key: m.id, type: 'msg', msg: m }))
  ];

  const renderItem = ({ item }: any) => {
    if (item.type === 'poi') {
      return <POICard poi={poi} />;
    }
    if (item.type === 'routes') {
      return poi ? <RecommendedRoutes routes={poi.routes} /> : null;
    }
    return <ChatBubble message={item.msg} />;
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => item.key}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
      <ChatInput onSendPhoto={sendPhoto} />
    </SafeAreaView>
  );
}