-- 在 Supabase Dashboard → SQL Editor 中执行此脚本，创建投资产品表

CREATE TABLE IF NOT EXISTS asset_classes (
  id BIGSERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 允许匿名/已认证用户访问
ALTER TABLE asset_classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for service" ON asset_classes FOR ALL USING (true) WITH CHECK (true);

-- 插入默认投资产品
INSERT INTO asset_classes (name, description) VALUES
('股票', '股票市场投资'),
('黄金', '黄金及贵金属投资'),
('原油', '原油及能源相关投资'),
('数字货币', '比特币、以太坊等数字货币投资')
ON CONFLICT (name) DO NOTHING;