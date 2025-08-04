import { POI } from '../types';

// Mock POI data for development
const mockPOI: POI = {
  id: '1',
  name: '外滩',
  description: '上海外滩是位于上海市黄浦区的黄浦江西岸，南起延安东路，北至苏州河上的外白渡桥，长约1.5公里，是上海十里洋场的风景线。',
  coverImage: 'https://images.unsplash.com/photo-1548919973-5cef591cdbc9?w=400&h=400&fit=crop',
  audioUrl: 'https://example.com/audio/bund-intro.mp3',
  routes: [
    {
      id: 'route1',
      title: '经典外滩游览路线',
      duration: '2小时',
      distance: '1.5公里',
      highlights: ['外白渡桥', '和平饭店', '海关大楼', '陈毅广场']
    },
    {
      id: 'route2',
      title: '外滩夜景摄影路线',
      duration: '3小时',
      distance: '2公里',
      highlights: ['最佳拍摄点', '灯光秀时间', '浦东天际线']
    }
  ]
};

export const fetchPOIData = async (poiId: string): Promise<POI> => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  return mockPOI;
};

export const recogniseAndDescribe = async (imageUri: string): Promise<string> => {
  // Simulate vision API call
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const responses = [
    '这是外滩的经典景观！我看到了黄浦江和对岸的陆家嘴金融区。建议您沿着外滩滨江步道漫步，欣赏这里的万国建筑博览群。',
    '这张照片展现了上海的现代化天际线。您可以在这里感受到东西方文化的交融，建议傍晚时分来此观赏日落和夜景。',
    '我识别出这是外滩的标志性建筑群。这里有着丰富的历史文化，每栋建筑都有其独特的故事，建议您参加导览了解更多历史背景。'
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
};