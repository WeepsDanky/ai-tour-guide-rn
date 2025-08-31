// 设计系统 Tokens

// 颜色系统（暗色主题）
export const colors = {
  // 基础颜色
  background: '#0E0E0F',
  text: '#FAFAF7',
  
  // 强调色
  accent: {
    history: '#B6482B',
    architecture: '#3558A0',
  },
  
  // 语义颜色
  semantic: {
    success: '#1AA674',
    warning: '#C97A1E',
    error: '#C4473D',
  },
  
  // 边框和描边
  border: {
    recognition: 'rgba(250,250,247,0.26)',
    default: 'rgba(250,250,247,0.1)',
  },
  
  // 半透明背景
  overlay: {
    light: 'rgba(14,14,15,0.8)',
    medium: 'rgba(14,14,15,0.9)',
    heavy: 'rgba(14,14,15,0.95)',
  },
} as const;

// 字体系统
export const typography = {
  fontFamily: {
    chinese: 'SourceHanSans',
    english: 'Inter',
    default: 'Inter',
  },
  
  fontSize: {
    h1: 22,
    h2: 18,
    body: 16,
    meta: 13,
  },
  
  lineHeight: {
    h1: 28,
    h2: 24,
    body: 22,
    meta: 18,
  },
  
  letterSpacing: -0.4, // FIX: Changed from a nested object to a direct number. This is the root cause.
} as const;

// 尺寸系统
export const sizing = {
  // 触控最小尺寸
  touchTarget: {
    min: 44,
  },
  
  // 按钮尺寸
  button: {
    shutter: 64,
    secondary: 44,
  },

  recognition: { // FIX: Added missing token
    borderWidth: 2,
  },
  
  // 取景器
  viewfinder: {
    margin: 16, // 屏宽-32的一半
    borderRadius: 16,
  },
  
  // 历史抽屉
  historySheet: {
    heightRatio: 0.56, // 屏高的56%
  },
  
  // 底部历史条
  historyBar: {
    height: 72,
  },
} as const;

// 间距系统
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

// 圆角系统
export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,
} as const;

// 动效系统
export const animation = {
  duration: {
    fast: 140,
    normal: 220,
    slow: 280,
    shutter: 140,
    lectureEnter: 280,
    lectureExit: 220,
    historyEnter: 220,
  },
  
  easing: {
    easeOutQuad: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    easeInOutCubic: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
    default: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
  },
} as const;

// 阴影系统
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
} as const;

// Z-index 层级
export const zIndex = {
  base: 0,
  overlay: 10,
  modal: 20,
  toast: 30,
  tooltip: 40,
} as const;

// 导出所有 tokens
export const tokens = {
  colors,
  typography,
  sizing,
  spacing,
  borderRadius,
  animation,
  shadows,
  zIndex,
} as const;

export default tokens;