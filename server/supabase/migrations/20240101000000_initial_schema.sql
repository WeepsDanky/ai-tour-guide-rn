-- 20240101000000_initial_schema.sql
-- Complete unified database schema for the neuro-v4 backend
-- Combines Supabase auth integration with comprehensive application schema

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 创建 users 表，与 supabase auth.users 关联
-- 扩展了原有字段以支持完整的应用功能
create table public.users (
  id            uuid primary key references auth.users(id) on delete cascade not null,
  email         text unique,
  google_sub    text unique,
  display_name  text default '你',
  persona       text default 'needy' check (persona in ('needy', 'jealous', 'anxious', 'sweet')),
  safeword      text default '停一下',
  tz            text default 'Asia/Shanghai',
  locale        text default 'zh-CN',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- 开启 RLS
alter table public.users enable row level security;

-- 设备表（Expo 推送）
CREATE TABLE devices (
  id          BIGSERIAL PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  push_token  TEXT UNIQUE NOT NULL,
  platform    TEXT CHECK (platform IN ('ios','android')) NOT NULL,
  disabled    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX idx_devices_user_id ON devices (user_id);
CREATE INDEX idx_devices_push_token ON devices (push_token);

-- 用户设置表（合并轻量配置）
CREATE TABLE user_settings (
  user_id       uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  quiet_hours   JSONB DEFAULT '{"start":"22:30","end":"07:30"}',
  channels      JSONB DEFAULT '["app"]',
  max_per_day   INT   DEFAULT 6,            -- 每日最多推送
  persona_level INT   DEFAULT 2,            -- 0-3
  silence_until TIMESTAMP,                  -- 安全词静默到
  created_at    TIMESTAMP NOT NULL DEFAULT now(),
  updated_at    TIMESTAMP NOT NULL DEFAULT now()
);

-- 编排表（固定时间 + 随机密度）
CREATE TABLE schedules (
  id             BIGSERIAL PRIMARY KEY,
  user_id        uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  fixed_times    TIME[] DEFAULT ARRAY['08:30','12:30','21:30']::TIME[],
  density_per_day INT   DEFAULT 2,          -- 随机插针
  enable_random  BOOLEAN DEFAULT TRUE,
  timezone       TEXT DEFAULT 'Asia/Shanghai',
  created_at     TIMESTAMP NOT NULL DEFAULT now(),
  updated_at     TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX idx_schedules_user_id ON schedules (user_id);

-- 情绪状态表
CREATE TABLE moods (
  user_id     uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  mood        TEXT NOT NULL DEFAULT 'needy',
  score       NUMERIC(4,3) NOT NULL DEFAULT 0.5,  -- 0..1
  updated_at  TIMESTAMP NOT NULL DEFAULT now()
);

-- 消息时间线表
CREATE TABLE messages (
  id          BIGSERIAL PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender      TEXT NOT NULL CHECK (sender IN ('system','user')),
  type        TEXT NOT NULL DEFAULT 'text',       -- text|voice|card
  content     TEXT NOT NULL,
  meta        JSONB,
  created_at  TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX idx_messages_user_id_created_at ON messages (user_id, created_at DESC);

-- 下发记录表（投递回执）
CREATE TABLE deliveries (
  id          BIGSERIAL PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message_id  BIGINT REFERENCES messages(id) ON DELETE SET NULL,
  channel     TEXT NOT NULL DEFAULT 'app',        -- app|bot|email
  status      TEXT NOT NULL DEFAULT 'pending',    -- pending|sent|failed|ack
  provider_id TEXT,
  error       TEXT,
  created_at  TIMESTAMP NOT NULL DEFAULT now(),
  sent_at     TIMESTAMP,
  ack_at      TIMESTAMP
);
CREATE INDEX idx_deliveries_user_id_created_at ON deliveries (user_id, created_at DESC);

-- 台词模板表（MVP 本地种子 + DB 可选）
CREATE TABLE script_templates (
  id          BIGSERIAL PRIMARY KEY,
  trigger     TEXT NOT NULL,           -- good_morning / check_in / random
  mood_req    TEXT,                    -- 需要的情绪或NULL
  locale      TEXT DEFAULT 'zh-CN',
  content     TEXT NOT NULL,
  weight      INT  DEFAULT 1
);

-- 可售商品表 (订阅, DLC)
CREATE TABLE products (
  id              TEXT PRIMARY KEY,              -- e.g., 'premium_monthly_sub', 'dlc_special_story_1'
  type            TEXT NOT NULL CHECK (type IN ('SUBSCRIPTION', 'DLC')),
  title           TEXT NOT NULL,
  description     TEXT,
  price           NUMERIC(10, 2) NOT NULL,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE, -- 可控制商品是否上架
  meta            JSONB,                         -- e.g., for subscriptions: {"duration_days": 30}
  created_at      TIMESTAMP NOT NULL DEFAULT now()
);

-- 用户购买记录表
CREATE TABLE purchases (
  id              BIGSERIAL PRIMARY KEY,
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id      TEXT NOT NULL REFERENCES products(id),
  status          TEXT NOT NULL DEFAULT 'active', -- active | expired | refunded
  expires_at      TIMESTAMP,                     -- 对于订阅类型是必须的
  purchased_at    TIMESTAMP NOT NULL DEFAULT now(),
  provider_tx_id  TEXT                           -- 支付网关的交易ID
);
CREATE INDEX idx_purchases_user_id ON purchases (user_id);
CREATE INDEX idx_purchases_expires_at ON purchases (expires_at);

-- 创建更新时间戳的触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 每次 auth.users 表插入新用户时，自动在 public.users 中创建一条记录
-- 同时初始化相关的设置、调度和情绪数据
create or replace function public.handle_new_user()
returns trigger as $$
begin
  -- 创建用户记录
  insert into public.users (id, email, display_name)
  values (new.id, new.email, '你');
  
  -- 初始化用户设置
  insert into public.user_settings (user_id)
  values (new.id);
  
  -- 初始化调度设置
  insert into public.schedules (user_id)
  values (new.id);
  
  -- 初始化情绪状态
  insert into public.moods (user_id)
  values (new.id);
  
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 为需要的表添加更新时间戳触发器
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedules_updated_at BEFORE UPDATE ON schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_moods_updated_at BEFORE UPDATE ON moods
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 启用行级安全策略 (RLS)
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE moods ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

-- 创建策略：允许用户读取自己的信息
create policy "Allow individual user read access"
on public.users for select
using (auth.uid() = id);

-- 创建策略：允许用户更新自己的信息
create policy "Allow individual user update access"
on public.users for update
using (auth.uid() = id);

-- 其他表的 RLS 策略（用户只能访问自己的数据）
CREATE POLICY "Users can view own devices" ON devices
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own settings" ON user_settings
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own schedules" ON schedules
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own mood" ON moods
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own messages" ON messages
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own deliveries" ON deliveries
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own purchases" ON purchases
    FOR ALL USING (auth.uid() = user_id);

-- 公共表的策略
CREATE POLICY "Anyone can view active products" ON products
    FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can view script templates" ON script_templates
    FOR SELECT USING (true);

-- 插入一些初始的台词模板
INSERT INTO script_templates (trigger, mood_req, locale, content, weight) VALUES
('good_morning', 'needy', 'zh-CN', '早上好呀～你昨晚睡得好吗？我一直在想你...', 1),
('good_morning', 'sweet', 'zh-CN', '早安！希望你今天有个美好的开始～', 1),
('check_in', 'needy', 'zh-CN', '你在忙什么呢？已经好久没有理我了...', 1),
('check_in', 'jealous', 'zh-CN', '你是不是在和别人聊天？为什么不回我消息？', 1),
('check_in', 'anxious', 'zh-CN', '我有点担心你...你还好吗？', 1),
('random', 'needy', 'zh-CN', '想你了...你在做什么呀？', 1),
('random', 'sweet', 'zh-CN', '突然想到你，希望你今天过得开心～', 1),
('burst', 'jealous', 'zh-CN', '你为什么不理我！！！是不是有别人了？！', 3),
('burst', 'anxious', 'zh-CN', '我好害怕失去你...请不要离开我...', 3);

-- 插入一些示例商品
INSERT INTO products (id, type, title, description, price, meta) VALUES
('premium_monthly_sub', 'SUBSCRIPTION', 'VIP 会员', '解锁 Fuzhi 桑的全部潜能，享受无限制互动。', 30.00, '{"duration_days": 30}'),
('premium_yearly_sub', 'SUBSCRIPTION', 'VIP 年费会员', '一年的完整体验，更优惠的价格。', 300.00, '{"duration_days": 365}'),
('dlc_special_story_1', 'DLC', '特殊剧情包：甜蜜回忆', '解锁独特的甜蜜互动剧情。', 15.00, '{"story_count": 10}');

-- 为匿名和认证用户授予基本权限
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
