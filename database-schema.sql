-- 创建审计日志表
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    operation VARCHAR(100) NOT NULL,
    details JSONB DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address VARCHAR(100) DEFAULT 'unknown',
    user_agent TEXT DEFAULT 'unknown'
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_type ON audit_logs(type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_operation ON audit_logs(operation);

-- 添加注释
COMMENT ON TABLE audit_logs IS '审计日志表，记录用户操作和系统行为';
COMMENT ON COLUMN audit_logs.type IS '日志类型：user_action(用户操作) 或 system_action(系统行为)';
COMMENT ON COLUMN audit_logs.operation IS '具体操作类型';
COMMENT ON COLUMN audit_logs.details IS '操作详情，JSON格式';
COMMENT ON COLUMN audit_logs.timestamp IS '操作时间';
COMMENT ON COLUMN audit_logs.ip_address IS '用户IP地址';
COMMENT ON COLUMN audit_logs.user_agent IS '用户代理信息';
