import { IdentifyResp, GeoLocation, GuideMeta, HistoryItem, WSResponse, WSMetaResponse, WSTextResponse, WSAudioResponse, WSEosResponse } from '../types/schema';

/**
 * 模拟数据 - 用于替代真实API调用
 */

// 模拟识别结果
export const mockIdentifyResponse: IdentifyResp = {
  success: true,
  result: {
    id: 'mock-identify-001',
    name: '故宫太和殿',
    confidence: 0.92,
    bbox: {
      x: 120,
      y: 80,
      width: 240,
      height: 180
    }
  }
};

// 模拟识别失败响应
export const mockIdentifyFailResponse: IdentifyResp = {
  success: false,
  message: '无法识别此图像，请尝试更清晰的照片'
};

// 模拟讲解元数据
export const mockGuideMeta: GuideMeta = {
  guideId: 'guide-001',
  title: '故宫太和殿 - 明清皇权的象征',
  confidence: 0.92,
  bbox: {
    x: 120,
    y: 80,
    width: 240,
    height: 180
  },
  coverImage: 'example-base64-image'
};

// 模拟讲解文本内容
export const mockTranscriptText = `太和殿，俗称金銮殿，是紫禁城内体量最大、等级最高的建筑物，为明清两朝皇帝举行大典的地方。

太和殿始建于明永乐四年（1406年），初名奉天殿。明嘉靖四十一年（1562年）改称皇极殿，清顺治二年（1645年）改今名。

建筑特色：
• 面阔十一间，进深五间，建筑面积2377平方米
• 高35.05米，是紫禁城内现存最高的古建筑
• 屋顶为重檐庑殿顶，是中国古代建筑的最高等级
• 装饰华丽，彩画、雕刻工艺精湛

历史意义：
太和殿是明清两朝皇帝登基、大婚、册立皇后、命将出征等重大典礼的举办地，象征着至高无上的皇权。`;

// 模拟卡片数据
export const mockCards = {
  whatWhySowhat: {
    title: 'What/Why/So-what',
    points: [
      '太和殿是紫禁城内最重要的宫殿建筑',
      '体现了明清皇权的至高无上地位',
      '代表了中国古代建筑艺术的最高成就'
    ]
  },
  components: {
    title: '构件标注',
    items: [
      { term: '重檐庑殿顶', description: '中国古代建筑最高等级的屋顶形式' },
      { term: '斗拱', description: '中国古代建筑特有的结构构件' },
      { term: '汉白玉台基', description: '三层汉白玉石台基，象征皇权威严' },
      { term: '金龙和玺彩画', description: '最高等级的宫殿彩画装饰' }
    ]
  },
  timeline: {
    title: '时间线',
    events: [
      { year: '1406年', event: '明永乐四年始建，初名奉天殿' },
      { year: '1562年', event: '明嘉靖四十一年改称皇极殿' },
      { year: '1645年', event: '清顺治二年改名太和殿' },
      { year: '1695年', event: '康熙三十四年重建，形成现在规模' }
    ]
  },
  reading: {
    title: '延伸阅读',
    items: [
      { title: '《紫禁城建筑》', author: '王其亨', description: '详细介绍紫禁城建筑艺术' },
      { title: '《故宫营造》', author: '单士元', description: '故宫建筑营造技艺研究' },
      { title: '《明清宫廷建筑》', author: '傅熹年', description: '明清宫廷建筑制度与艺术' }
    ]
  },
  sources: {
    title: '引用来源',
    items: [
      '《故宫博物院官方资料》',
      '《中国古代建筑史》- 梁思成',
      '《紫禁城》杂志 2023年第3期',
      '故宫博物院数字文物库'
    ]
  }
};

// 模拟历史记录数据
export const mockHistoryItems: HistoryItem[] = [
  {
    id: 'history-001',
    guideId: 'guide-001',
    title: '故宫太和殿 - 明清皇权的象征',
    summary: '太和殿是紫禁城内体量最大、等级最高的建筑物，为明清两朝皇帝举行大典的地方。',
    coverImage: 'example-base64-image',
    timestamp: Date.now() - 86400000, // 1天前
    isFavorite: true,
    confidence: 0.92,
    location: { lat: 39.9163, lng: 116.3972 }
  },
  {
    id: 'history-002',
    guideId: 'guide-002',
    title: '天坛祈年殿 - 明清皇帝祭天之所',
    summary: '祈年殿是天坛的主体建筑，明清皇帝每年春季在此祈求五谷丰登。',
    coverImage: 'example-base64-image',
    timestamp: Date.now() - 172800000, // 2天前
    isFavorite: false,
    confidence: 0.88,
    location: { lat: 39.8832, lng: 116.4074 }
  },
  {
    id: 'history-003',
    guideId: 'guide-003',
    title: '颐和园长廊 - 世界最长的画廊',
    summary: '颐和园长廊全长728米，共273间，是世界上最长的画廊。',
    coverImage: 'example-base64-image',
    timestamp: Date.now() - 259200000, // 3天前
    isFavorite: true,
    confidence: 0.85,
    location: { lat: 39.9999, lng: 116.2755 }
  }
];

// 模拟WebSocket响应消息
export const mockWSResponses = {
  meta: {
    type: 'meta' as const,
    guideId: 'guide-001',
    title: '故宫太和殿 - 明清皇权的象征',
    confidence: 0.92,
    bbox: {
      x: 120,
      y: 80,
      width: 240,
      height: 180
    }
  } as WSMetaResponse,
  
  textChunks: [
    { type: 'text' as const, delta: '太和殿，俗称金銮殿，' },
    { type: 'text' as const, delta: '是紫禁城内体量最大、' },
    { type: 'text' as const, delta: '等级最高的建筑物，' },
    { type: 'text' as const, delta: '为明清两朝皇帝举行大典的地方。' }
  ] as WSTextResponse[],
  
  audioChunks: [
    {
      type: 'audio' as const,
      format: 'mp3' as const,
      seq: 1,
      bytes: 'example-base64-audio-chunk-1'
    },
    {
      type: 'audio' as const,
      format: 'mp3' as const,
      seq: 2,
      bytes: 'example-base64-audio-chunk-2'
    },
    {
      type: 'audio' as const,
      format: 'mp3' as const,
      seq: 3,
      bytes: 'example-base64-audio-chunk-3'
    }
  ] as WSAudioResponse[],
  
  eos: {
    type: 'eos' as const,
    guideId: 'guide-001'
  } as WSEosResponse,
  
  cards: [
    {
      type: 'what' as const,
      title: 'What/Why/So-what',
      content: {
        what: '太和殿是紫禁城内最重要的宫殿建筑',
        why: '体现了明清皇权的至高无上地位',
        soWhat: '代表了中国古代建筑艺术的最高成就'
      }
    },
    {
      type: 'components' as const,
      title: '构件标注',
      content: {
        items: [
          { term: '重檐庑殿顶', description: '中国古代建筑最高等级的屋顶形式' },
          { term: '斗拱', description: '中国古代建筑特有的结构构件' },
          { term: '汉白玉台基', description: '三层汉白玉石台基，象征皇权威严' },
          { term: '金龙和玺彩画', description: '最高等级的宫殿彩画装饰' }
        ]
      }
    },
    {
      type: 'timeline' as const,
      title: '时间线',
      content: {
        events: [
          { year: '1406年', event: '明永乐四年始建，初名奉天殿' },
          { year: '1562年', event: '明嘉靖四十一年改称皇极殿' },
          { year: '1645年', event: '清顺治二年改名太和殿' },
          { year: '1695年', event: '康熙三十四年重建，形成现在规模' }
        ]
      }
    },
    {
      type: 'reading' as const,
      title: '延伸阅读',
      content: {
        items: [
          { title: '《紫禁城建筑》', author: '王其亨', description: '详细介绍紫禁城建筑艺术' },
          { title: '《故宫营造》', author: '单士元', description: '故宫建筑营造技艺研究' },
          { title: '《明清宫廷建筑》', author: '傅熹年', description: '明清宫廷建筑制度与艺术' }
        ]
      }
    },
    {
      type: 'sources' as const,
      title: '引用来源',
      content: {
        sources: [
          { title: '故宫博物院官方资料', author: '故宫博物院', date: '2023' },
          { title: '中国古代建筑史', author: '梁思成', date: '1984' },
          { title: '紫禁城杂志', author: '故宫博物院', date: '2023年第3期' }
        ]
      }
    }
  ]
};

// 模拟健康检查响应
export const mockHealthResponse = {
  status: 'ok',
  timestamp: Date.now()
};

// 模拟配置响应
export const mockConfigResponse = {
  version: '1.0.0',
  features: {
    voiceSpeed: [0.9, 1.0, 1.2, 1.5],
    languages: ['zh', 'en'],
    maxHistoryItems: 100
  },
  limits: {
    maxImageSize: 10485760, // 10MB
    maxAudioDuration: 300000 // 5分钟
  }
};

// 模拟延迟函数
export const mockDelay = (ms: number = 1000): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// 模拟随机失败（用于测试错误处理）
export const mockRandomFailure = (successRate: number = 0.9): boolean => {
  return Math.random() < successRate;
};