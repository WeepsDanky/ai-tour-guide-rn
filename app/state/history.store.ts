import { create } from 'zustand';
import { HistoryItem } from '../types/schema';

interface HistoryState {
  // 历史记录列表
  items: HistoryItem[];
  
  // 当前选中的标签
  activeTab: 'all' | 'favorites';
  
  // 加载状态
  isLoading: boolean;
  
  // Actions
  addItem: (item: HistoryItem) => void;
  removeItem: (id: string) => void;
  toggleFavorite: (id: string) => void;
  setActiveTab: (tab: 'all' | 'favorites') => void;
  setItems: (items: HistoryItem[]) => void;
  setLoading: (loading: boolean) => void;
  getFilteredItems: () => HistoryItem[];
  getRecentItems: (count?: number) => HistoryItem[];
  clearHistory: () => void;
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  // Initial state
  items: [],
  activeTab: 'all',
  isLoading: false,
  
  // Actions
  addItem: (item) => set((state) => {
    // 检查是否已存在相同的项目
    const existingIndex = state.items.findIndex(existing => existing.guideId === item.guideId);
    
    if (existingIndex >= 0) {
      // 更新现有项目
      const updatedItems = [...state.items];
      updatedItems[existingIndex] = { ...updatedItems[existingIndex], ...item };
      return { items: updatedItems };
    } else {
      // 添加新项目到开头
      return { items: [item, ...state.items] };
    }
  }),
  
  removeItem: (id) => set((state) => ({
    items: state.items.filter(item => item.id !== id)
  })),
  
  toggleFavorite: (id) => set((state) => ({
    items: state.items.map(item => 
      item.id === id 
        ? { ...item, isFavorite: !item.isFavorite }
        : item
    )
  })),
  
  setActiveTab: (tab) => set({ activeTab: tab }),
  
  setItems: (items) => set({ items }),
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  getFilteredItems: () => {
    const { items, activeTab } = get();
    
    if (activeTab === 'favorites') {
      return items.filter(item => item.isFavorite);
    }
    
    return items;
  },
  
  getRecentItems: (count = 3) => {
    const { items } = get();
    return items
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, count);
  },
  
  clearHistory: () => set({ items: [] }),
}));

// 选择器函数
export const selectHistoryItems = (state: HistoryState) => state.items;
export const selectActiveTab = (state: HistoryState) => state.activeTab;
export const selectIsLoading = (state: HistoryState) => state.isLoading;
export const selectFilteredItems = (state: HistoryState) => {
  if (state.activeTab === 'favorites') {
    return state.items.filter(item => item.isFavorite);
  }
  return state.items;
};
export const selectRecentItems = (count = 3) => (state: HistoryState) => {
  return state.items
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, count);
};
export const selectFavoriteItems = (state: HistoryState) => {
  return state.items.filter(item => item.isFavorite);
};