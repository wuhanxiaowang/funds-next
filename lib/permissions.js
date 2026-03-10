/**
 * 菜单/功能权限配置
 * - admin 为超管，拥有全部权限，无需在此配置
 * - 其他角色（如 user、viewer）只能拥有下面列出的权限
 *
 * 设置方式：
 * 1. 在 PERMISSIONS 里为每个权限填写可用的角色列表（如 'user'、'viewer'）
 * 2. 在数据库 users 表中把对应用户的 role 改为相应角色（如 UPDATE users SET role = 'viewer' WHERE email = 'xxx'）
 */

/** 权限标识 -> 可访问的角色列表（不包含 admin，admin 自动拥有全部） */
export const PERMISSIONS = {
  'monitor:view': ['user', 'vip', 'viewer'],    // 监控
  'analyze:run': ['user', 'vip'],               // 分析
  'signals:view': ['user', 'vip', 'viewer'],    // 信号
  'signals:mark': ['user', 'vip'],              // 信号标记
  'rules:manage': [],                           // 规则（仅 admin）
  'asset-classes:manage': [],                   // 投资产品（仅 admin）
  'alerts:view': ['user', 'vip', 'viewer'],     // 提醒
  'audit:view': [],                             // 审计（仅 admin）
  'settings:manage': [],                        // 系统设置（仅 admin）
}

/** 权限对应的菜单/功能名称（用于系统设置页展示） */
export const PERMISSION_LABELS = {
  'monitor:view': '监控',
  'analyze:run': '分析',
  'signals:view': '信号',
  'signals:mark': '信号标记',
  'rules:manage': '规则',
  'asset-classes:manage': '投资产品',
  'alerts:view': '提醒',
  'audit:view': '审计',
  'settings:manage': '系统设置',
}

/** 角色说明（便于维护，可选） */
export const ROLE_LABELS = {
  admin: '超管',
  vip: 'VIP',
  user: '普通用户',
  viewer: '只读用户',
}

/**
 * 判断某角色是否拥有某权限
 * @param {string} role - 用户角色（如 'admin','user','viewer'）
 * @param {string} permission - 权限标识（如 'monitor:view'）
 */
export function hasPermission(role, permission) {
  if (!role) return false
  if (role === 'admin') return true
  return PERMISSIONS[permission]?.includes(role) ?? false
}
