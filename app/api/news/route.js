import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'
import Parser from 'rss-parser'

// 使用 Node.js 运行时，因为 rss-parser 依赖 xml2js，需要 stream 模块
export const runtime = 'nodejs'

const parser = new Parser()
const DOMESTIC_RSS = [
  'https://feed.cnblogs.com/blog/sitehome/rss'         // 和讯财经
]

// 抓取RSS新闻
async function fetchRssNews(pageSize = 10) {
  const all = []
  
  // 为每个请求设置超时
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000) // 10秒超时
  
  try {
    await Promise.all(DOMESTIC_RSS.map(async (url) => {
      try {
        // 使用带有超时的fetch
        const response = await fetch(url, {
          signal: controller.signal,
          timeout: 8000 // 8秒超时
        })
        
        if (!response.ok) {
          console.warn('RSS fetch failed:', url, `Status code ${response.status}`)
          return
        }
        
        const text = await response.text()
        const feed = await parser.parseString(text)
        const items = (feed.items || []).slice(0, pageSize)
        
        for (const entry of items) {
          const title = (entry.title || '').slice(0, 500)
          const content = (entry.contentSnippet || entry.content || entry.title || '').slice(0, 10000)
          const source = (feed.title || 'RSS').slice(0, 200)
          let publishedAt = new Date().toISOString()
          if (entry.pubDate) publishedAt = new Date(entry.pubDate).toISOString()
          else if (entry.isoDate) publishedAt = entry.isoDate
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

// 存储新闻到数据库（过滤已存在的新闻）
async function saveNewsToDatabase(newsList) {
  if (!supabase || newsList.length === 0) return
  
  // 获取数据库中已有的新闻标题
  const { data: existingNews } = await supabase
    .from('news')
    .select('title')
  
  const existingTitles = new Set((existingNews || []).map(n => n.title))
  
  // 过滤掉已存在的新闻
  const newNewsList = newsList.filter(item => !existingTitles.has(item.title))
  
  console.log(`过滤前: ${newsList.length} 条, 过滤后: ${newNewsList.length} 条, 已存在: ${newsList.length - newNewsList.length} 条`)
  
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
  const skip = parseInt(searchParams.get('skip') || '0', 10)
  const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 500)
  const fetch = searchParams.get('fetch') === 'true' // 是否触发抓取
  
  let addedCount = 0
  
  // 如果需要抓取新闻
  if (fetch) {
    const rssNews = await fetchRssNews(10)
    addedCount = await saveNewsToDatabase(rssNews) || 0
  }
  
  // 从数据库读取新闻
  if (!supabase) return NextResponse.json([], { status: 200 })
  
  // 先获取所有新闻
  const { data: allNews, error } = await supabase
    .from('news')
    .select('*')
  
  if (error) return NextResponse.json({ detail: error.message }, { status: 500 })
  
  // 去重处理，基于标题
  const uniqueNews = []
  const seenTitles = new Set()
  
  for (const news of allNews || []) {
    if (news.title && !seenTitles.has(news.title)) {
      seenTitles.add(news.title)
      uniqueNews.push(news)
    }
  }
  
  // 获取已分析的新闻ID
  const { data: analyzedNews } = await supabase
    .from('signals')
    .select('news_id')
  
  const analyzedIds = new Set((analyzedNews || []).map(s => s.news_id))
  
  // 为每条新闻添加分析状态
  const newsWithAnalysisStatus = uniqueNews.map(news => ({
    ...news,
    analyzed: analyzedIds.has(news.id)
  }))
  
  // 按创建时间倒序排序并根据limit参数返回
  const sortedNews = newsWithAnalysisStatus.sort((a, b) => new Date(b.created_at || b.published_at) - new Date(a.created_at || a.published_at))
  const returnLimit = Math.min(limit, 50) // 最多返回50条
  const latestNews = sortedNews.slice(0, returnLimit)
  
  // 如果触发了抓取，返回新增数量信息
  if (fetch) {
    return NextResponse.json({
      news: latestNews || [],
      addedCount: addedCount,
      totalCount: uniqueNews.length
    })
  }
  
  // 非抓取模式也返回总数
  return NextResponse.json({
    news: latestNews || [],
    totalCount: uniqueNews.length
  })
}
