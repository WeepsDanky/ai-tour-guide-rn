import { View, FlatList, SafeAreaView } from 'react-native';
import { useChat } from './hooks/useChat';
import ChatBubble from './components/ChatBubble';
import ChatInput from './components/ChatInput';
import CurrentLocationCard from './components/CurrentLocationCard';

export default function TourChatScreen() {
  const { messages, sendPhoto } = useChat();

  // Debug: Log messages state
  console.log('[TourChatScreen] Messages:', messages);
  console.log('[TourChatScreen] Messages length:', messages.length);

  // Check if there are any chat messages beyond the welcome message
  const hasRealMessages = messages.length > 1 || (messages.length === 1 && messages[0].id !== 'welcome-message');

  // Prepare data for FlatList
  const data = [
    // Show current location when there are no real messages (only welcome message or empty)
    ...(hasRealMessages ? [] : [{ key: 'current-location', type: 'current-location' }]),
    ...messages.map(m => ({ key: m.id, type: 'msg', msg: m }))
  ];

  // Debug: Log FlatList data
  console.log('[TourChatScreen] hasRealMessages:', hasRealMessages);
  console.log('[TourChatScreen] FlatList data:', data);
  console.log('[TourChatScreen] FlatList data length:', data.length);
  console.log('[TourChatScreen] Welcome message object:', {
    key: 'welcome',
    type: 'message',
    data: {
      id: 'welcome',
      type: 'ai',
      text: '欢迎使用AI导游！请拍摄您想要了解的景点或建筑，我将为您提供详细的介绍和游览建议。',
      timestamp: new Date().toISOString(),
    }
  });

  const renderItem = ({ item }: any) => {
    console.log('[TourChatScreen] Rendering item:', item);
    
    if (item.type === 'current-location') {
      console.log('[TourChatScreen] Rendering CurrentLocationCard');
      return <CurrentLocationCard />;
    }
    // Now only render chat messages
    console.log('[TourChatScreen] Rendering ChatBubble with message:', item.msg);
    return <ChatBubble message={item.msg} />;
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" style={{ borderWidth: 2, borderColor: 'purple' }}>
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => item.key}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20, backgroundColor: 'lightblue', minHeight: 200 }}
        style={{ borderWidth: 2, borderColor: 'orange', backgroundColor: 'pink' }}
      />
      <ChatInput onSendPhoto={sendPhoto} />
    </SafeAreaView>
  );
}