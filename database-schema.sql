-- 在 Supabase Dashboard → SQL Editor 中执行此脚本，创建完整表结构
-- 投资信号系统 - 统一建表脚本

-- 1. 新闻表
CREATE TABLE IF NOT EXISTS news (
  id BIGSERIAL PRIMARY KEY,
  title TEXT,
  content TEXT,
  source TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 信号表
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

-- 3. 提醒表
CREATE TABLE IF NOT EXISTS alerts (
  id BIGSERIAL PRIMARY KEY,
  signal_id BIGINT REFERENCES signals(id),
  alert_type TEXT NOT NULL DEFAULT '系统',
  status TEXT NOT NULL DEFAULT '已记录',
  message TEXT NOT NULL,
  email TEXT,
  email_status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_alerts_signal_id ON alerts(signal_id);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at);

-- 4. 规则表
CREATE TABLE IF NOT EXISTS rules (
  id BIGSERIAL PRIMARY KEY,
  rule_name TEXT UNIQUE NOT NULL,
  keywords TEXT,
  asset_class TEXT,
  operation TEXT,
  threshold INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 投资产品/资产类型表
CREATE TABLE IF NOT EXISTS asset_classes (
  id BIGSERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO asset_classes (name, description) VALUES
('股票', '股票市场投资'),
('黄金', '黄金及贵金属投资'),
('原油', '原油及能源相关投资'),
('数字货币', '比特币、以太坊等数字货币投资')
ON CONFLICT (name) DO NOTHING;

-- 6. 审计日志表
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  operation VARCHAR(100) NOT NULL,
  details JSONB DEFAULT '{}',
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address VARCHAR(100) DEFAULT 'unknown',
  user_agent TEXT DEFAULT 'unknown'
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_type ON audit_logs(type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_operation ON audit_logs(operation);
COMMENT ON TABLE audit_logs IS '审计日志表，记录用户操作和系统行为';

-- 7. 分析状态（多实例共享，解决「开始分析」后页面不刷新的问题）
CREATE TABLE IF NOT EXISTS analysis_status (
  id INT PRIMARY KEY DEFAULT 1,
  data JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- RLS 与策略
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for service" ON news FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service" ON signals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service" ON alerts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service" ON rules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service" ON asset_classes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service" ON analysis_status FOR ALL USING (true) WITH CHECK (true);
