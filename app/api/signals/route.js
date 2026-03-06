import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export const runtime = 'edge'

export async function GET(req) {
  if (!supabase) return NextResponse.json([], { status: 200 })
  const { searchParams } = new URL(req.url)
  const skip = parseInt(searchParams.get('skip') || '0', 10)
  const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 500)
  const includeNews = searchParams.get('include_news') === 'true'
  
  let query = supabase.from('signals').select('*').order('created_at', { ascending: false }).range(skip, skip + limit - 1)
  
  const { data: signals, error } = await query
  if (error) return NextResponse.json({ detail: error.message }, { status: 500 })
  
  // 如果需要包含新闻信息
  if (includeNews && signals && signals.length > 0) {
    const newsIds = [...new Set(signals.map(s => s.news_id).filter(id => id != null))]
    
    if (newsIds.length > 0) {
      const { data: newsData } = await supabase
        .from('news')
        .select('id, title, content, source, published_at, created_at')
        .in('id', newsIds)
      
      const newsMap = new Map((newsData || []).map(n => [n.id, n]))
      
      // 将新闻信息附加到信号上
      const signalsWithNews = signals.map(signal => ({
        ...signal,
        news: signal.news_id ? newsMap.get(signal.news_id) : null
      }))
      
      return NextResponse.json(signalsWithNews)
    }
  }
  
  return NextResponse.json(signals || [])
}
