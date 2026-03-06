import { supabase } from './supabase'

// 审计日志类型
export const AUDIT_TYPES = {
  USER_ACTION: 'user_action',
  SYSTEM_ACTION: 'system_action'
}

// 审计操作类型
export const AUDIT_OPERATIONS = {
  // 用户操作
  TRIGGER_ANALYSIS: 'trigger_analysis',
  MODIFY_RULE: 'modify_rule',
  VIEW_DATA: 'view_data',

  // 系统操作
  FETCH_NEWS: 'fetch_news',
  GENERATE_SIGNAL: 'generate_signal',
  SCHEDULE_RUN: 'schedule_run'
}

// 记录审计日志
export async function logAudit(type, operation, details = {}) {
  if (!supabase) {
    console.warn('Supabase not initialized, audit log not saved')
    return false
  }

  try {
    const { error } = await supabase
      .from('audit_logs')
      .insert({
        type,
        operation,
        details: typeof details === 'object' ? details : { message: details },
        timestamp: new Date().toISOString(),
        ip_address: details.ip || 'unknown',
        user_agent: details.user_agent || 'unknown'
      })

    if (error) {
      console.error('Failed to log audit:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error logging audit:', error)
    return false
  }
}

// 获取审计日志
export async function getAuditLogs(options = {}) {
  if (!supabase) {
    return { logs: [], error: 'Supabase not initialized', total: 0 }
  }

  try {
    let query = supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .order('timestamp', { ascending: false })

    if (options.limit) {
      query = query.limit(options.limit)
    }

    if (options.type) {
      query = query.eq('type', options.type)
    }

    if (options.operation) {
      query = query.eq('operation', options.operation)
    }

    if (options.startDate) {
      query = query.gte('timestamp', options.startDate)
    }

    if (options.endDate) {
      query = query.lte('timestamp', options.endDate)
    }

    const { data, error, count } = await query

    if (error) {
      return { logs: [], error: error.message, total: 0 }
    }

    return { logs: data || [], error: null, total: count || 0 }
  } catch (error) {
    return { logs: [], error: error.message, total: 0 }
  }
}

// 审计中间件 - 用于API路由
export function auditMiddleware(operation) {
  return async (req, next) => {
    const ip = req.headers.get('x-forwarded-for') || req.ip || 'unknown'
    const userAgent = req.headers.get('user-agent') || 'unknown'

    await logAudit(AUDIT_TYPES.USER_ACTION, operation, {
      ip,
      user_agent: userAgent,
      path: req.url
    })

    return next()
  }
}
