import { View, FlatList, SafeAreaView } from 'react-native';
import { useChat } from './hooks/useChat';
import ChatBubble from './components/ChatBubble';
import ChatInput from './components/ChatInput';
import CurrentLocationCard from './components/CurrentLocationCard';

export default function TourChatScreen() {
  const { messages, sendPhoto } = useChat();

  // Check if there are any chat messages beyond the welcome message
  const hasRealMessages = messages.length > 1 || (messages.length === 1 && messages[0].id !== 'welcome-message');

  // Prepare data for FlatList
  const data = [
    // Show current location when there are no real messages (only welcome message or empty)
    ...(hasRealMessages ? [] : [{ key: 'current-location', type: 'current-location' }]),
    ...messages.map(m => ({ key: m.id, type: 'msg', msg: m }))
  ];

  const renderItem = ({ item }: any) => {
    if (item.type === 'current-location') {
      return <CurrentLocationCard />;
    }
    // Now only render chat messages
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