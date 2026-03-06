import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'
import { XMLParser } from 'fast-xml-parser'
import { logAudit, AUDIT_TYPES, AUDIT_OPERATIONS } from '../../../lib/audit'

// Cloudflare Pages 要求使用 Edge Runtime
export const runtime = 'edge'

const DOMESTIC_RSS = [
  'https://feed.cnblogs.com/blog/sitehome/rss'
]

// 用 fast-xml-parser 解析 RSS（Edge 兼容）
function parseRssXml(text) {
  const parser = new XMLParser({ ignoreAttributes: false })
  const doc = parser.parse(text)
  const channel = doc?.rss?.channel || doc?.feed
  if (!channel) return { title: 'RSS', items: [] }
  // 处理 title 可能是对象的情况
  let title = 'RSS'
  if (channel.title) {
    if (typeof channel.title === 'string') {
      title = channel.title.slice(0, 200)
    } else if (typeof channel.title === 'object' && channel.title['#text']) {
      title = channel.title['#text'].slice(0, 200)
    }
  }
  let items = channel.item || channel['atom:entry']
  if (!items) return { title, items: [] }
  if (!Array.isArray(items)) items = [items]
  return { title, items }
}

// 抓取 RSS 新闻
async function fetchRssNews(pageSize = 10) {
  const all = []
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000)

  try {
    await Promise.all(DOMESTIC_RSS.map(async (url) => {
      try {
        const response = await fetch(url, {
          signal: controller.signal,
        })
        if (!response.ok) {
          console.warn('RSS fetch failed:', url, `Status code ${response.status}`)
          return
        }
        const text = await response.text()
        const { title: source, items } = parseRssXml(text)
        const slice = (items || []).slice(0, pageSize)
        for (const entry of slice) {
          const title = (entry.title || entry['dc:title'] || '').slice(0, 500)
          const rawContent = entry.description || entry['content:encoded'] || entry.content?.['#text'] || entry.summary?.['#text'] || entry.title || ''
          const content = (typeof rawContent === 'string' ? rawContent : '').slice(0, 10000)
          const pubDate = entry.pubDate || entry.published || entry.updated
          let publishedAt = new Date().toISOString()
          if (pubDate) publishedAt = new Date(pubDate).toISOString()
          all.push({ title, content, source, published_at: publishedAt })
        }
      } catch (e) {
        console.warn('RSS fetch failed:', url, e.message)
      }
    }))
  } catch (e) {
    console.warn('RSS fetch overall error:', e.message)
  } finally {
    clearTimeout(timeoutId)
  }

  all.sort((a, b) => new Date(b.published_at) - new Date(a.published_at))
  return all.slice(0, pageSize * 4)
}

async function saveNewsToDatabase(newsList) {
  if (!supabase || newsList.length === 0) return 0

  const { data: existingNews } = await supabase
    .from('news')
    .select('title')

  const existingTitles = new Set((existingNews || []).map((n) => n.title))
  const newNewsList = newsList.filter((item) => !existingTitles.has(item.title))

  console.log(`过滤前: ${newsList.length} 条, 过滤后: ${newNewsList.length} 条`)

  for (const item of newNewsList) {
    try {
      await supabase
        .from('news')
        .insert({
          title: item.title,
          content: item.content,
          source: item.source,
          published_at: item.published_at,
        })
    } catch (e) {
      console.warn('Insert news error:', e.message)
    }
  }
  return newNewsList.length
}

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 500)
  const fetch = searchParams.get('fetch') === 'true'

  let addedCount = 0
  if (fetch) {
    // 记录系统操作审计日志 - 抓取新闻
    await logAudit(AUDIT_TYPES.SYSTEM_ACTION, AUDIT_OPERATIONS.FETCH_NEWS, {
      source: 'RSS',
      count: 10
    })
    
    const rssNews = await fetchRssNews(10)
    addedCount = await saveNewsToDatabase(rssNews) || 0
    
    // 记录新闻抓取结果
    await logAudit(AUDIT_TYPES.SYSTEM_ACTION, AUDIT_OPERATIONS.FETCH_NEWS, {
      source: 'RSS',
      count: 10,
      added_count: addedCount,
      status: 'completed'
    })
  }

  if (!supabase) return NextResponse.json({ news: [], totalCount: 0 }, { status: 200 })

  const { data: allNews, error } = await supabase.from('news').select('*')
  if (error) return NextResponse.json({ detail: error.message }, { status: 500 })

  const uniqueNews = []
  const seenTitles = new Set()
  for (const news of allNews || []) {
    if (news.title && !seenTitles.has(news.title)) {
      seenTitles.add(news.title)
      uniqueNews.push(news)
    }
  }

  const { data: analyzedNews } = await supabase.from('signals').select('news_id')
  const analyzedIds = new Set((analyzedNews || []).map((s) => s.news_id))
  const newsWithAnalysisStatus = uniqueNews.map((news) => ({
    ...news,
    analyzed: analyzedIds.has(news.id),
  }))

  const sortedNews = newsWithAnalysisStatus.sort(
    (a, b) => new Date(b.created_at || b.published_at) - new Date(a.created_at || a.published_at)
  )
  const returnLimit = Math.min(limit, 50)
  const latestNews = sortedNews.slice(0, returnLimit)

  if (fetch) {
    return NextResponse.json({
      news: latestNews || [],
      addedCount,
      totalCount: uniqueNews.length,
    })
  }
  return NextResponse.json({
    news: latestNews || [],
    totalCount: uniqueNews.length,
  })
}
