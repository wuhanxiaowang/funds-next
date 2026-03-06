-- 在 Supabase Dashboard → SQL Editor 中执行此脚本，创建表结构

CREATE TABLE IF NOT EXISTS news (
  id BIGSERIAL PRIMARY KEY,
  title TEXT,
  content TEXT,
  source TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS signals (
  id BIGSERIAL PRIMARY KEY,
  news_id BIGINT REFERENCES news(id),
  event TEXT,
  asset_class TEXT,
  direction TEXT,
  probability FLOAT,
  period TEXT,
  logic TEXT,
  strength INT,
  operation TEXT,
  is_valid BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alerts (
  id BIGSERIAL PRIMARY KEY,
  signal_id BIGINT REFERENCES signals(id),
  alert_type TEXT,
  status TEXT,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rules (
  id BIGSERIAL PRIMARY KEY,
  rule_name TEXT UNIQUE NOT NULL,
  keywords TEXT,
  asset_class TEXT,
  operation TEXT,
  threshold INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 允许匿名/已认证用户访问（若用 service_role 服务端直连可不开 RLS）
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for service" ON news FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service" ON signals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service" ON alerts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service" ON rules FOR ALL USING (true) WITH CHECK (true);

-- 分析状态（多实例共享，解决「开始分析」后页面不刷新的问题）
CREATE TABLE IF NOT EXISTS analysis_status (
  id INT PRIMARY KEY DEFAULT 1,
  data JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);
ALTER TABLE analysis_status ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for service" ON analysis_status FOR ALL USING (true) WITH CHECK (true);
