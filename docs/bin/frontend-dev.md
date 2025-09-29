# 「拍照即听」MVP — 前端开发与设计详细文档（Expo / iOS & Android）

> 单一目标：**打开即相机 → 预识别显示 Top1 → 快门 → 单连接流式（文本+音频）开讲，P95 ≤ 2.5s**。
> 三个界面：**相机**、**讲解**、**历史**。无用户鉴权；匿名 `deviceId`。

---

## 0. 技术栈与项目结构

**技术栈**

* **Expo**（SDK ≥ 51）+ **React Native** + **TypeScript**
* 相机：`react-native-vision-camera`
* 手势 & 底部抽屉：`react-native-gesture-handler` + `react-native-reanimated` + `@gorhom/bottom-sheet`
* 音频：`expo-av`（流式分段播放）
* 全局状态：`zustand`
* 本地存储：`AsyncStorage`（历史、偏好、deviceId）
* 网络：`fetch` / `axios`（REST）+ **WebSocket**
* 端缓存：`expo-file-system`（音频分段）

**目录建议**

```
app/
 ├─ _layout.tsx
 ├─ camera.tsx          # 相机页
 ├─ lecture.tsx         # 讲解页
 └─ (modals)/history.tsx# 历史半屏抽屉
components/
 ├─ camera/             # 取景器、快门、光线/对齐提示、顶部Bar
 ├─ lecture/            # 播放器、置信度徽章、卡片、动作区
 ├─ history/            # 历史列表与卡片
 └─ common/             # BottomSheet、Toast、Icon、Haptic
lib/
 ├─ api.ts              # /v1/identify REST
 ├─ stream.ts           # WS 单流（文本+音频分段）
 ├─ storage.ts          # AsyncStorage 封装
 ├─ device.ts           # deviceId
 └─ tokens.ts           # 设计Tokens（颜色/字号/圆角/间距）
state/
 ├─ guide.store.ts      # 当前讲解、播放器状态、偏好
 └─ history.store.ts    # 历史与收藏
types/
 └─ schema.ts
```

---

## 1. 设计系统（Design System）

**颜色（暗色主题）**

* 背景：`#0E0E0F`
* 文本：`#FAFAF7`
* 强调（历史）：`#B6482B`
* 强调（建筑）：`#3558A0`
* 语义：成功 `#1AA674` / 警告 `#C97A1E` / 失败 `#C4473D`
* 描边（识别框）：`rgba(250,250,247,0.26)` 1.5pt

**排版**

* 中文：Source Han Sans / OPPOSans；英文：Inter
* H1 22/28；H2 18/24；Body 16/22；Meta 13/18；字距 -1%

**尺寸**

* 触控最小 44×44dp；主快门 64dp；
* 取景方框：屏宽-32，圆角 16；
* 历史半屏抽屉：高度≈屏高 56%

**动效**

* 快门回弹 140ms（EaseOutQuad）
* 讲解页入/退场 280ms/220ms（`cubic-bezier(0.2,0.8,0.2,1)`）
* 历史抽屉入场 220ms

**无障碍**

* 对比度 ≥ WCAG AA；动态字体；字幕开关；语音指令（开始/暂停/快一点/下一条/打开历史）

---

## 2. 三界面视觉与交互规范

### 2.1 相机界面（CameraScreen）

**布局**

* 顶部：左 Logo、右「相册导入」；中间留白
* 中部：**方形取景器**；识别到对象时高亮
* 底部：左「偏好/人设」44dp，中间 **快门** 64dp，右「对齐/光线提示」44dp
* **底部历史条**：半透明 72dp，显示最近 3 张缩略图，**上滑**进入历史抽屉

**交互**

* **预识别**：用户持稳 600–900ms 或点取景框 → 取 **低清快照** + 地理位置 → `POST /v1/identify`

  * 置信度 ≥ 0.6：在取景框顶部显示 **Top1 名称**（防后续确认成本）
  * 置信度 < 0.6：不显示，提示“换角度/靠近/避反光”
* 快门：采高清照片（速度优先）；将最近一次 `identifyId` 一并传入流式会话
* 上滑底部历史条：半屏抽屉，不离开相机

**文案**

* 识别失败：

  * “我不够确定。试试**靠近**或**避开反光**，或直接拍我来猜。”

---

### 2.2 讲解界面（LectureScreen）

**上半区**：封面（拍摄图）+ 遮罩高亮识别区域；右上 **置信度徽章**（0.6/0.8 阈值）

**播放器**

* 控件：播放/暂停、10s±、语速 0.9/1.0/1.2/1.5、**“换一种讲法”**
* 波形轻量实时（非必需）

**卡片组（横滑）**

1. **What / Why / So-what**
2. **构件标注**（术语+一行解释）
3. **时间线/人物关系**（微图谱）
4. **延伸阅读**（外链/附近同类）
5. **引用来源**（展开：出处/时间/摘录）

**动作区**

* 主 CTA：**继续讲这个点**（按偏好分支）
* 次要：收藏 / 分享 / **不是它** / 我来补充

**自动返回**

* 播放结束 **+1.2s** → 讲解页缩回 → 回相机；任一交互中断该行为

---

### 2.3 历史界面（HistorySheet）

**形式**：**半屏抽屉**（不离开相机）
**结构**：标签「全部｜收藏」；瀑布流卡片（封面、标题、三要点、时间）
**操作**：轻点进入讲解页（以 `replay` 流式重播）；长按弹出删除/收藏切换

---

## 4. 流式协议（前端视角）

**相机页 REST：预识别**

* `POST /v1/identify`
* 入参：`imageBase64 (低清)`, `geo`, `deviceId`
* 出参：`IdentifyResp`

**讲解页 WS：单连接混流**

* `wss://…/ws/v1/guide/stream`

**客户端 → 服务端**

```json
{ "type":"init", "deviceId":"uuid", "imageBase64":"...高清...", "identifyId":"id_9d12", "geo":{"lat":..,"lng":..}, "prefs":{...} }
```

或

```json
{ "type":"replay", "guideId":"g_xxx", "fromMs": 0, "deviceId":"uuid" }
```

或

```json
{ "type":"nack", "missingSeq": [7,8] }
```

**服务端 → 客户端**

```json
{ "type":"meta", "guideId":"g_xxx", "title":"...", "confidence":0.86, "bbox":{...} }
{ "type":"text", "delta":"..." }
{ "type":"audio", "format":"mp3", "seq":3, "bytes":"<base64>" }   // 0.8–1.2s 一段
{ "type":"eos", "guideId":"g_xxx" }
{ "type":"err", "code":"TTS_FAIL", "msg":"..." }
```

**延迟硬指标**

* `init` → **首个 `audio`** 与首个 `text` ≤ **1200ms**
* 快门 → 首句可听（端到端）P95 ≤ **2.5s**

---

## 5. 流式播放实现（Expo）

**队列播放器**

1. WebSocket 收到 `audio(seq, bytes)`：写入 `FileSystem.cacheDirectory/seg_<seq>.mp3`
2. 维护队列 `queue: string[]`（文件路径），若空闲则立刻 `loadAsync` + `playAsync`
3. 使用 `setOnPlaybackStatusUpdate` 在**剩余 <200ms** 时预加载下一段，实现近似无缝
4. 断段：若发现 `seq` 间隔，发送 `nack` 请求重传；若重传失败，容忍**极短静音**而不停播

**代码骨架（简化）**

```ts
// lib/stream.ts
export function openGuideStream(initPayload: Init | Replay, onText: (d:string)=>void) {
  const ws = new WebSocket(WS_URL);
  const q:string[] = []; let playing = false; let sound: Audio.Sound | null = null;
  let expect = 1;

  ws.onopen = () => ws.send(JSON.stringify(initPayload));
  ws.onmessage = async (e) => {
    const msg = JSON.parse(e.data);
    if (msg.type === 'text') onText(msg.delta);
    if (msg.type === 'audio') {
      const path = FileSystem.cacheDirectory + `seg_${msg.seq}.mp3`;
      await FileSystem.writeAsStringAsync(path, msg.bytes, { encoding:'base64' });
      q.push(path);
      while (expect < msg.seq) { ws.send(JSON.stringify({ type:'nack', missingSeq:[expect] })); expect++; }
      expect = msg.seq + 1;
      if (!playing) { playing = true; playNext(); }
    }
  };

  async function playNext() {
    const next = q.shift(); if (!next) { playing = false; return; }
    sound?.unloadAsync();
    const { sound: s } = await Audio.Sound.createAsync({ uri: next }, { shouldPlay:true });
    sound = s;
    s.setOnPlaybackStatusUpdate((st) => {
      if (st.isLoaded && st.durationMillis && st.positionMillis &&
          st.durationMillis - st.positionMillis < 200 && q.length) {
        playNext();
      }
    });
  }

  return () => { ws.close(); sound?.unloadAsync(); };
}
```

---

## 6. 状态管理（Zustand）

```ts
type GuideState = {
  currentMeta?: GuideMeta;
  transcript: string;
  playing: boolean;
  prefs: CapturePrefs;
  setMeta: (m?:GuideMeta) => void;
  appendText: (d:string) => void;
  setPlaying: (b:boolean) => void;
  setPrefs: (p:Partial<CapturePrefs>) => void;
};
```

**历史存储**

* Key：`history/v1` → `HistoryItem[]`（本地）
* 产生时机：收到 `meta` 或 `eos` 后写入；封面路径存本地（首次展示时保存一张缩略图）
