export interface POI {
  id: string;
  name: string;
  description: string;
  coverImage: string;
  audioUrl?: string;
  routes: RouteSuggestion[];
}

export interface RouteSuggestion {
  id: string;
  title: string;
  duration: string;
  distance: string;
  highlights: string[];
}

export interface ChatMessage {
  id: string;
  type: 'ai' | 'user';
  text?: string;
  image?: string;
  status?: 'done' | 'loading' | 'progress';
  progress?: number;
  progressText?: string;
  timestamp: Date;
}

export interface ChatInputProps {
  onSendPhoto: (uri: string) => void;
}

export interface POICardProps {
  poi: POI;
}

export interface RecommendedRoutesProps {
  routes: RouteSuggestion[];
}

export interface ChatBubbleProps {
  message: ChatMessage;
}