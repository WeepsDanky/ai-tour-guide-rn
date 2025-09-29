# 「拍照即听」— 后端开发详细文档（MVP｜Supabase + Render）

> 目标：**单连接流式返回“文本增量 + 语音音频段”**，端到端 **快门→首句可听 P95 ≤ 2.5s**。
> 不做用户鉴权；以 `deviceId` 做轻量关联。
> **部署**：Render 常开实例承载 API/WS/TTS 编排；数据库与对象存储使用 Supabase（Postgres + Storage）。

---

## 0. 架构总览（按部署调整）

### 组件与职责

* **API Gateway（FastAPI on Render 常开实例）**

  * REST：`POST /v1/identify`（相机页预识别）
  * WebSocket：`/ws/v1/guide/stream`（单连接流式文本+音频）
  * 速率限制（内存滑窗 + Postgres 回落）、输入校验、心跳/断线、重放 offset 解析
* **Vision + Geo 识别服务（进程内/同容器）**

  * 输入：低清快照 + `geo`
  * 模型：小型快速 LLM
  * 输出：最有可能的地点名称列表
* **Narrative Orchestrator（叙事编排｜同容器）**

  * 召回：基于关键词 + 经纬度的 RAG 检索
  * 生成：LLM 约束模板，**句/子句流式产出**（供字幕/要点）
  * 切片：对流式 token **对齐到句边界**，将文本分块送 TTS
* **TTS 代理（同容器）**

  * 调用第三方 TTS API（按量计费），将每句合成为 **0.8–1.2s** 段
* **媒体缓冲与存储（Supabase Storage + 内存 LRU）**

  * 段文件：`audio/seg/{guideId}/{seq}.mp3`（**Storage**，TTL 72h 的清理任务）
  * 在线播放优先走 **WebSocket 二进制帧**直送；重播/补发从 Storage 拉取并复用
* **数据库（Supabase Postgres）**

  * 表结构见 §3，**RLS 由后端服务角色密钥绕过**（仅服务端访问）
* **监控与日志**

  * Render 日志 + OpenTelemetry（可选）+ 结构化 JSON 日志

### 技术栈

* **Python 3.11+**：FastAPI + Uvicorn（WS 原生良好）
* 模型推理：API 调用
* SDK：`supabase-py`（服务端用 Service Role Key 直连 PostgREST/Storage）

---

## 1. 接口规范

### 1.1 相机页预识别（REST）

**POST** `/v1/identify`

**Headers**

* `Content-Type: application/json`
* `X-Device-Id: <uuid>`（与 body 重复任一即可）

**请求体**

```json
{
  "imageBase64": "data:image/jpeg;base64,...",   // 320px 宽，JPEG q≈0.6，建议 <300KB
  "geo": { "lat": 35.66, "lng": 139.73, "accuracyM": 30 },
  "deviceId": "uuid"
}
```

**响应体**

```json
{
  "identifyId": "id_9d12",
  "candidates": [
    {
      "spot": "咸安坊牌匾",
      "confidence": 0.83,
      "bbox": { "x": 0.21, "y": 0.18, "w": 0.58, "h": 0.42 }
    },
    {
      "spot": "咸安坊石雕",
      "confidence": 0.71,
    },
    {
      "spot": "咸安坊入口",
      "confidence": 0.65
    }
  ]
}

```

**状态码**

* 200 正常；400 请求格式错误；413 图片过大；422 识别失败（低置信度/无法解析）；429 速率限制；500 内部错误

**说明**

* identifyId：本次识别会话 ID，用于后续 init 请求
* candidates：按 confidence 排序，长度 3–5
* bbox：仅在检测到明确区域时返回

---

### 1.2 单连接流式讲解（WebSocket）

**URL**：`wss://<render-service-domain>/ws/v1/guide/stream`

**消息协议（文本帧 JSON；音频二进制/或 JSON+base64，见 1.3）**

客户端 → 服务端

* `init`（首次播放）

```json
{
  "type": "init",
  "deviceId": "uuid",
  "imageBase64": "data:image/jpeg;base64,...",     // 高清，速度优先
  "identifyId": "id_9d12",                         // 可选，提升检索精度
  "geo": { "lat": 35.66, "lng": 139.73, "accuracyM": 30 },
  "prefs": { "persona": "local", "duration": 60, "speechRate": 1.0 }
}
```

* `replay`（重播/从偏移继续）

```json
{ "type": "replay", "guideId": "g_20250901_7f2a", "fromMs": 0, "deviceId": "uuid" }
```

* `nack`（丢段重传）

```json
{ "type": "nack", "missingSeq": [7,8] }
```

* `close`

```json
{ "type": "close" }
```

服务端 → 客户端

* `meta`（一次性，早发）

```json
{ "type": "meta", "guideId": "g_20250901_7f2a", "title": "咸安坊牌匾", "confidence": 0.86, "bbox": { } }
```

* `text`（增量文本）

```json
{ "type": "text", "delta": "开场抓手句..." }
```

* `audio`（分段音频；二选一封装）

```json
{ "type": "audio", "format": "mp3", "seq": 3, "bytes": "<base64>" }  // 若走 JSON+base64
```

* `eos`

```json
{ "type": "eos", "guideId": "g_20250901_7f2a" }
```

* `err`

```json
{ "type": "err", "code": "TTS_FAIL", "msg": "..." }
```

**时序 SLA**

* 收到 `init` 后 **≤ 1200ms**：首个 `text` 与首个 `audio` 必须同时或近似到达
* `replay` 后 **≤ 800ms**：开始推 `audio`

**连接管理**

* 心跳：服务端每 15s `ping`（WS 原生或 `{type:"ping"}`），客户端回 `pong`
* 空闲超时：60s 无下行自动 `close(1001)`
* 并发限制：每 `deviceId` 同时 ≤ 2 连接（超出新连接拒绝）

---

### 1.3 音频帧封装

**推荐：二进制帧**（省带宽、端上易解）

* 头 12 字节（LE）：`type:uint8(2=audio)` `format:uint8(1=mp3,2=opus)` `seq:uint32` `len:uint32`
* 紧跟 `len` 字节音频数据
* 文本仍走 JSON 帧（区分 `typeof data`）

**备选：JSON + base64**（实现快）

* 帧 ≤ 64KB，避免移动端分片异常

---

## 2. 服务内管线与实现细节（保持原逻辑，替换存储为 Supabase）

### 2.1 `/v1/identify`（预识别）

1. 解码/裁剪：JPEG→RGB，最宽 320 px
2. 图像理解：小型 LLM 
3. Geo 约束：随 `accuracyM` 自适应半径（100–300m）
4. 置信度：<0.6 返回 422 或“不确定”
5. `bbox`：若有检测结果则返回相对坐标

### 2.2 叙事与流式切片（WS 主链）

输入：高清图 + `identifyId` + `geo` + `prefs`
输出：交错 `text` 与 `audio`

* 证据召回（RAG）：向量 + 倒排；来源优先级：地方志/学术 > 官方文博 > 地方媒体 > 旅行博文
* 约束生成（LLM）：模板**抓手句→背景最小集→细节放大→余味→引用**；**流式 token** 对齐到**句/短句**
* TTS：句级入队，合成 **0.8–1.2s** 段，首包用低码率抢时延
* 打包下发：尽早 `meta`，交错 `text`/`audio`
* 收尾：完结发 `eos`

**关键：`init` → 首段 ≤ 1200ms**
实现：预备「开场抓手句」模板 + 48kbps 低码率首段，后续段再提质。

### 2.3 重播与偏移

* `guide_segments` 按 `start_ms` 二分定位
* 重播时段数据优先从**内存 LRU**取，其次 Supabase Storage 拉取（服务端再打包为 WS 帧）
* 文本：重播时可一次性推全量 transcript（供字幕）

---

## 3. 数据与存储（Supabase）

### 3.1 Postgres 表（保持不变）

```sql
create table identify_sessions (
  identify_id  varchar primary key,
  device_id    varchar not null,
  lat          double precision,
  lng          double precision,
  accuracy_m   int,
  spot         text,
  confidence   real,
  bbox         jsonb,
  created_at   timestamptz default now()
);

create table guides (
  guide_id     varchar primary key,
  device_id    varchar,
  spot         text,
  title        text,
  confidence   real,
  transcript   text,
  duration_ms  int,
  created_at   timestamptz default now()
);

create table guide_segments (
  guide_id     varchar,
  seq          int,
  start_ms     int,
  end_ms       int,
  format       varchar(8), -- mp3/opus
  bitrate_kbps int,
  bytes_len    int,
  object_key   text,       -- Supabase Storage 路径
  primary key (guide_id, seq)
);
create index on guide_segments(guide_id);
```

> **RLS**：该三表禁用 RLS 或允许仅服务角色写入；客户端**不直接**访问数据库。

### 3.2 Storage（Supabase）

* **桶**：`audio-seg`（公开=否），`covers`（可公开）
* 路径：

  * `audio-seg/{guideId}/seg_{seq}.mp3`
  * `covers/{guideId}.jpg`
* 清理：后台定时任务（Render cron / 外部 GitHub Actions）按 `created_at` + 72h 清除段文件
* 重播：服务端用 **Service Role Key** 拉取对象（或生成短签名 URL 后自己拉取），再封装为 WS 帧下发

---

## 4. 部署与配置（Supabase + Render）

### 4.1 环境变量（Render 服务）

```
PORT=8080
SUPABASE_URL=<https://<proj>.supabase.co>
SUPABASE_SERVICE_ROLE_KEY=<server role key>
SUPABASE_ANON_KEY=<anon key, 可选>
SUPABASE_STORAGE_BUCKET_AUDIO=audio-seg
SUPABASE_STORAGE_BUCKET_COVERS=covers

LLM_ENDPOINT=<你的 LLM API 端点>
LLM_API_KEY=<...>
TTS_PROVIDER=<e.g., azure|gcp|eleven>
TTS_API_KEY=<...>

AUDIO_BITRATE_DEFAULT=48
WS_IDLE_TIMEOUT=60
WS_PING_INTERVAL=15
```

### 4.2 Render 服务设置

* 类型：**Web Service（常开）**
* 实例：最小 1×（≥ 1 vCPU / 512–1024MB RAM）；健康检查 `/healthz`
* 端口：`$PORT`（Render 会注入）
* 超时时间：支持 WebSocket，务必**禁用**反代对 WS 的空闲过短断开
* 构建：`Dockerfile`（建议）或 `poetry/uv` 构建命令

### 4.3 Supabase

* Postgres：导入 §3 的表结构；**RLS**：三表关闭或仅允许服务角色
* Storage：创建桶 `audio-seg`（私有）、`covers`（可公开）；设定 Cache-Control（如 `public, max-age=3600`）
* 清理任务：

  * Render Cron / GitHub Actions 定时执行（每日 03:00）清除 72h 前的 `audio-seg` 段