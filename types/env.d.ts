// types/env.d.ts
declare namespace NodeJS {
  interface ProcessEnv {
    EXPO_PUBLIC_AMAP_JS_KEY: string;
    EXPO_PUBLIC_AMAP_SECURITY_CODE: string;
    EXPO_PUBLIC_AMAP_WEB_SERVICE_KEY?: string;
    EXPO_PUBLIC_BACKEND_URL: string;
  }
} 