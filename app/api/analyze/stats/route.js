import { NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'

export const runtime = 'edge'

export async function GET() {
  if (!supabase) {
    return NextResponse.json({ newsCount: 0, signalCount: 0, validSignalCount: 0, alertCount: 0 })
  }
  try {
    // 获取今日日期字符串（YYYY-MM-DD）
    const today = new Date().toISOString().slice(0, 10)
    
    // 先获取所有数据，然后在服务端过滤
    const [nRes, sRes, aRes] = await Promise.all([
      supabase.from('news').select('created_at'),
      supabase.from('signals').select('created_at, is_valid'),
      supabase.from('alerts').select('created_at'),
    ])
    
    // 过滤今日数据
    const todayNews = (nRes.data || []).filter(item => item.created_at && item.created_at.startsWith(today))
    const todaySignals = (sRes.data || []).filter(item => item.created_at && item.created_at.startsWith(today))
    const todayValidSignals = todaySignals.filter(item => item.is_valid === true)
    const todayAlerts = (aRes.data || []).filter(item => item.created_at && item.created_at.startsWith(today))
    
    return NextResponse.json({
      newsCount: todayNews.length,
      signalCount: todaySignals.length,
      validSignalCount: todayValidSignals.length,
      alertCount: todayAlerts.length,
    })
  } catch (error) {
    console.error('Error getting stats:', error)
    return NextResponse.json({ newsCount: 0, signalCount: 0, validSignalCount: 0, alertCount: 0 })
  }
}
