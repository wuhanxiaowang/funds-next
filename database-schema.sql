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

-- 8. 用户表
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- 角色说明：role 决定用户可见菜单与功能。admin=超管(全部权限)，其余角色见 lib/permissions.js 中的 PERMISSIONS。
-- 设置其他用户菜单：1) 修改 lib/permissions.js 中各权限对应的角色列表；2) 在 users 表将该用户的 role 设为对应值，如 UPDATE users SET role = 'viewer' WHERE email = 'xxx';

-- 添加默认管理员账号（密码见项目说明或自行重置）
INSERT INTO users (email, username, password_hash, role)
VALUES ('admin@qq.com', 'admin', '0000000056760663', 'admin')
ON CONFLICT (email) DO UPDATE SET
  username = EXCLUDED.username,
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role;

-- 默认普通用户账号，供访客/体验使用（邮箱 user@example.com 密码 123456）
INSERT INTO users (email, username, password_hash, role)
VALUES ('user@example.com', '普通用户', '0000000056760663', 'user')
ON CONFLICT (email) DO UPDATE SET
  username = EXCLUDED.username,
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role;

-- 9. 邮箱验证码表
CREATE TABLE IF NOT EXISTS email_verification_codes (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  code VARCHAR(10) NOT NULL,
  purpose VARCHAR(20) NOT NULL DEFAULT 'register',
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_verification_email ON email_verification_codes(email);
CREATE INDEX IF NOT EXISTS idx_verification_code ON email_verification_codes(code);

-- 10. 系统配置表（存菜单权限等）
CREATE TABLE IF NOT EXISTS system_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO system_config (key, value)
VALUES ('menu_permissions', '{
  "monitor:view": ["user", "vip", "viewer"],
  "analyze:run": ["user", "vip"],
  "signals:view": ["user", "vip", "viewer"],
  "signals:mark": ["user", "vip"],
  "rules:manage": [],
  "asset-classes:manage": [],
  "alerts:view": ["user", "vip", "viewer"],
  "audit:view": [],
  "settings:manage": []
}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- RLS 与策略
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_verification_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for service" ON system_config FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service" ON news FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service" ON signals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service" ON alerts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service" ON rules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service" ON asset_classes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service" ON analysis_status FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service" ON email_verification_codes FOR ALL USING (true) WITH CHECK (true);
