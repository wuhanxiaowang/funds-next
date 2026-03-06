import { supabase } from './supabase'
import { extractEvent } from './ai'
import { sendAlertEmail } from './email'

// 更新分析状态（服务端调用同源 API，需使用当前应用地址）
function getStatusBaseUrl() {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, '')
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'http://localhost:3000'
}

async function updateAnalysisStatus(status) {
  try {
    const baseUrl = getStatusBaseUrl()
    await fetch(`${baseUrl}/api/analyze/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(status)
    })
  } catch (e) {
    console.warn('Update analysis status failed:', e.message)
  }
}

const ALERT_THRESHOLD = parseInt(process.env.ALERT_STRENGTH_THRESHOLD || '70', 10)

// 根据规则表匹配：新闻/事件文本中是否命中某条规则的触发关键词，返回命中的规则（含 operation、threshold）
function matchRule(text, eventInfo, rules) {
  if (!rules?.length || !text) return null
  const searchText = `${(text || '').trim()} ${(eventInfo?.event || '').trim()} ${(eventInfo?.asset_class || '').trim()}`
  for (const rule of rules) {
    const keywords = (rule.keywords || '')
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean)
    const hit = keywords.some((kw) => searchText.includes(kw))
    if (!hit) continue
    // 仅当 AI 返回了具体品类时才校验规则品类，否则只按关键词命中即可
    const ac = eventInfo?.asset_class?.trim()
    if (rule.asset_class && ac && ac !== '未知资产') {
      if (!ac.includes(rule.asset_class) && !rule.asset_class.includes(ac)) continue
    }
    return rule
  }
  return null
}

export async function runAnalysis(pageSize = 10) {
  // 开始分析，初始化状态（含大模型调用记录，用于前端展示）
  await updateAnalysisStatus({
    isRunning: true,
    currentStep: '初始化分析',
    progress: 0,
    message: '开始分析...',
    startTime: new Date().toISOString(),
    llmCalls: []
  })

  if (!supabase) {
    await updateAnalysisStatus({
      isRunning: false,
      currentStep: '分析失败',
      progress: 100,
      message: '未配置 Supabase，请设置 NEXT_PUBLIC_SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY',
      endTime: new Date().toISOString()
    })
    return { news_count: 0, signal_count: 0, alert_count: 0, message: '未配置 Supabase，请设置 NEXT_PUBLIC_SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY' }
  }

  // 更新状态：从数据库获取新闻
  await updateAnalysisStatus({
    currentStep: '获取新闻',
    progress: 20,
    message: '正在从数据库获取新闻...'
  })

  // 先获取已分析过的新闻ID
  const { data: signaledRows } = await supabase.from('signals').select('news_id')
  const signaledIds = [...new Set((signaledRows || []).map((r) => r.news_id).filter(Boolean))]

  // 获取未分析的新闻（排除已分析的），只取一条
  let newsQuery = supabase
    .from('news')
    .select('id, title, content')
    .order('created_at', { ascending: false })
    .limit(1)
  
  // 如果有已分析的新闻，排除它们
  if (signaledIds.length > 0) {
    newsQuery = newsQuery.not('id', 'in', `(${signaledIds.join(',')})`)
  }
  
  const { data: newsList, error: newsError } = await newsQuery

  if (newsError || !newsList || newsList.length === 0) {
    await updateAnalysisStatus({
      isRunning: false,
      currentStep: '分析完成',
      progress: 100,
      message: '所有新闻都已分析过，请拉取新新闻后再分析',
      endTime: new Date().toISOString()
    })
    return { news_count: 0, signal_count: 0, alert_count: 0, message: '所有新闻都已分析过，请拉取新新闻后再分析' }
  }

  console.log(`获取到 1 条未分析的新闻进行单条分析`)

  // 拉取规则：用于按关键词匹配并设置操作建议
  const { data: rulesList } = await supabase.from('rules').select('id, keywords, asset_class, operation, threshold').order('created_at', { ascending: false })
  const rules = rulesList || []

  const newsListWithId = newsList

  // 更新状态：分析新闻（单条模式）
  await updateAnalysisStatus({
    currentStep: '分析新闻',
    progress: 40,
    message: '正在分析 1 条新闻...'
  })

  let signalCount = 0
  let alertCount = 0
  const llmCalls = []
  for (let i = 0; i < newsListWithId.length; i++) {
    const news = newsListWithId[i]
    // 同时用标题和正文（含摘要），便于规则关键词命中且 AI 分析更准
    const content = [news.title, news.content].filter(Boolean).join('\n').trim() || ''
    if (!content) continue
    
    // 更新状态：分析单条新闻
    await updateAnalysisStatus({
      currentStep: '分析新闻',
      progress: 60 + Math.round((i / newsListWithId.length) * 20),
      message: `正在分析第 ${i + 1} 条新闻...`,
      currentNews: {
        title: news.title,
        content: content.substring(0, 200) + (content.length > 200 ? '...' : '')
      }
    })

    // 检查该新闻是否已经被分析过
    const { data: existingSignals, error: signalError } = await supabase
      .from('signals')
      .select('id, strength, operation, event, asset_class, direction')
      .eq('news_id', news.id)

    if (existingSignals && existingSignals.length > 0) {
      // 已分析过，直接使用上次的结果
      const existingSignal = existingSignals[0]
      console.log(`新闻 ${news.id} 已分析过，使用上次的分析结果`)
      signalCount++
      
      // 重新匹配规则，获取对应的阈值
      const matchedRule = matchRule(content, {
        event: existingSignal.event,
        asset_class: existingSignal.asset_class
      }, rules)
      const alertThreshold = matchedRule?.threshold != null ? Number(matchedRule.threshold) : ALERT_THRESHOLD
      
      if (existingSignal.strength >= alertThreshold) {
        // 检查是否已经创建过提醒
        const { data: existingAlerts } = await supabase
          .from('alerts')
          .select('id')
          .eq('signal_id', existingSignal.id)
        
        if (!existingAlerts || existingAlerts.length === 0) {
          const msg = `【投资信号】${existingSignal.event || '未知事件'} | ${existingSignal.asset_class || '未知资产'} ${existingSignal.direction || '无影响'} | 强度${existingSignal.strength}${existingSignal.operation !== '无操作' ? ` | 建议${existingSignal.operation}` : ''}`
          // 发送QQ邮箱提醒
          const emailResult = await sendAlertEmail('投资信号提醒', msg)
          await supabase.from('alerts').insert({
            signal_id: existingSignal.id,
            alert_type: '系统',
            status: '已记录',
            message: msg,
            email: emailResult.email,
            email_status: emailResult.success ? '成功' : `失败: ${emailResult.error}`
          })
          alertCount++
        }
      }
      // 更新状态，显示已分析过的信息
      await updateAnalysisStatus({
        currentStep: '分析新闻',
        progress: 60 + Math.round((i / newsListWithId.length) * 20),
        message: `新闻 ${news.id} 已分析过，使用上次的分析结果`,
        currentNews: {
          title: news.title,
          content: content.substring(0, 200) + (content.length > 200 ? '...' : '')
        }
      })
      continue
    }

    // 未分析过，进行AI分析（大模型调用）
    const rawEvent = await extractEvent(content)
    const { _llm, ...eventInfo } = rawEvent
    if (_llm) {
      llmCalls.push({
        title: (news.title || '').slice(0, 100),
        model: _llm.model,
        durationMs: _llm.durationMs,
        inputChars: _llm.inputChars,
        outputSnippet: (_llm.outputSnippet || '').slice(0, 280),
        event: eventInfo.event,
        asset_class: eventInfo.asset_class,
        direction: eventInfo.direction,
        strength: eventInfo.strength,
      })
      await updateAnalysisStatus({ llmCalls: [...llmCalls] })
    }
    const matchedRule = matchRule(content, eventInfo, rules)
    const operation = matchedRule?.operation || '无操作'
    const alertThreshold = matchedRule?.threshold != null ? Number(matchedRule.threshold) : ALERT_THRESHOLD

    const { data: sigRow, error: sigErr } = await supabase
      .from('signals')
      .insert({
        news_id: news.id,
        event: eventInfo.event,
        asset_class: eventInfo.asset_class,
        direction: eventInfo.direction,
        probability: eventInfo.probability,
        period: eventInfo.period,
        logic: eventInfo.logic,
        strength: eventInfo.strength,
        operation,
        is_valid: eventInfo.is_valid,
      })
      .select('id, strength')
      .single()
    if (sigErr) {
      console.warn('Insert signal error:', sigErr.message)
      continue
    }
    signalCount++
    if (sigRow.strength >= alertThreshold) {
      const msg = `【投资信号】${eventInfo.event} | ${eventInfo.asset_class} ${eventInfo.direction} | 强度${sigRow.strength}${operation !== '无操作' ? ` | 建议${operation}` : ''}`
      // 发送QQ邮箱提醒
      const emailResult = await sendAlertEmail('投资信号提醒', msg)
      await supabase.from('alerts').insert({
        signal_id: sigRow.id,
        alert_type: '系统',
        status: '已记录',
        message: msg,
        email: emailResult.email,
        email_status: emailResult.success ? '成功' : `失败: ${emailResult.error}`
      })
      alertCount++
    }
  }

  // 更新状态：分析完成（保留大模型调用记录供前端展示）
  const message = `完成：新闻 ${newsListWithId.length} 条，信号 ${signalCount} 条，提醒 ${alertCount} 次`
  await updateAnalysisStatus({
    isRunning: false,
    currentStep: '分析完成',
    progress: 100,
    message: message,
    endTime: new Date().toISOString(),
    result: {
      news_count: newsListWithId.length,
      signal_count: signalCount,
      alert_count: alertCount,
      message: message
    },
    llmCalls
  })

  return { news_count: newsListWithId.length, signal_count: signalCount, alert_count: alertCount, message }
}
