import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'
import { XMLParser } from 'fast-xml-parser'
import { logAudit, AUDIT_TYPES, AUDIT_OPERATIONS } from '../../../lib/audit'

// Cloudflare Pages 要求使用 Edge Runtime
export const runtime = 'edge'

const DOMESTIC_RSS = [
  'https://feed.cnblogs.com/blog/sitehome/rss',
  'https://www.36kr.com/feed',
  'https://www.zhihu.com/rss'
]

// 去除HTML标签
function stripHtml(html) {
  if (!html || typeof html !== 'string') return ''
  // 先替换常见的HTML实体
  let text = html
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
  
  // 去除HTML标签
  text = text.replace(/<[^>]*>/g, ' ')
  
  // 去除多余空格
  text = text.replace(/\s+/g, ' ').trim()
  
  return text
}

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

  console.log('开始抓取RSS新闻，URL列表:', DOMESTIC_RSS)

  try {
    await Promise.all(DOMESTIC_RSS.map(async (url) => {
      try {
        console.log('正在抓取:', url)
        const response = await fetch(url, {
          signal: controller.signal,
        })
        console.log('RSS响应状态:', url, response.status)
        if (!response.ok) {
          console.warn('RSS fetch failed:', url, `Status code ${response.status}`)
          return
        }
        const text = await response.text()
        console.log('RSS响应内容长度:', text.length)
        const { title: source, items } = parseRssXml(text)
        console.log('解析结果:', { source, itemCount: items?.length || 0 })
        const slice = (items || []).slice(0, pageSize)
        for (const entry of slice) {
          const title = stripHtml((entry.title || entry['dc:title'] || '')).slice(0, 500)
          const rawContent = entry.description || entry['content:encoded'] || entry.content?.['#text'] || entry.summary?.['#text'] || entry.title || ''
          const content = stripHtml(typeof rawContent === 'string' ? rawContent : '').slice(0, 10000)
          const pubDate = entry.pubDate || entry.published || entry.updated
          let publishedAt = new Date().toISOString()
          if (pubDate) publishedAt = new Date(pubDate).toISOString()
          all.push({ title, content, source, published_at: publishedAt })
        }
      } catch (e) {
        console.warn('RSS fetch failed:', url, e.message, e.stack)
      }
    }))
  } catch (e) {
    console.warn('RSS fetch overall error:', e.message)
  } finally {
    clearTimeout(timeoutId)
  }

  // 如果没有抓到任何新闻，使用模拟数据
  if (all.length === 0) {
    console.log('RSS抓取为空，使用模拟数据')
    const mockNews = [
      {
        title: stripHtml('美联储宣布维持利率不变，市场反应积极'),
        content: stripHtml('美联储在最新会议上决定维持基准利率不变，符合市场预期。分析师认为这一决定将对全球金融市场产生积极影响，特别是新兴市场。'),
        source: '模拟数据源',
        published_at: new Date().toISOString()
      },
      {
        title: stripHtml('科技股大涨，纳斯达克指数创新高'),
        content: stripHtml('受人工智能热潮推动，科技股今日大涨。纳斯达克指数创下历史新高，苹果、微软、谷歌等科技巨头股价均有显著上涨。'),
        source: '模拟数据源',
        published_at: new Date(Date.now() - 3600000).toISOString()
      },
      {
        title: stripHtml('原油价格突破80美元，能源股走强'),
        content: stripHtml('国际原油价格突破每桶80美元大关，带动能源板块股票全面上涨。分析师预计短期内油价将维持在高位运行。'),
        source: '模拟数据源',
        published_at: new Date(Date.now() - 7200000).toISOString()
      },
      {
        title: stripHtml('央行降准释放流动性，银行股受益'),
        content: stripHtml('中国人民银行宣布降准0.5个百分点，释放长期资金约1万亿元。银行股应声上涨，市场预期流动性改善将提振经济。'),
        source: '模拟数据源',
        published_at: new Date(Date.now() - 10800000).toISOString()
      },
      {
        title: stripHtml('新能源汽车销量创新高，产业链景气度提升'),
        content: stripHtml('最新数据显示，新能源汽车销量持续攀升，创历史新高。电池、充电桩等产业链上下游企业订单饱满，行业景气度显著提升。'),
        source: '模拟数据源',
        published_at: new Date(Date.now() - 14400000).toISOString()
      }
    ]
    all.push(...mockNews)
  }

  console.log('RSS抓取完成，共获取:', all.length, '条新闻')
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

  // 获取用户IP地址
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1'
  const userAgent = req.headers.get('user-agent') || 'unknown'

  let addedCount = 0
  if (fetch) {
    // 记录系统操作审计日志 - 抓取新闻
    await logAudit(AUDIT_TYPES.SYSTEM_ACTION, AUDIT_OPERATIONS.FETCH_NEWS, {
      source: 'RSS',
      count: 10,
      ip,
      user_agent: userAgent
    })
    
    const rssNews = await fetchRssNews(10)
    addedCount = await saveNewsToDatabase(rssNews) || 0
    
    // 记录新闻抓取结果
    await logAudit(AUDIT_TYPES.SYSTEM_ACTION, AUDIT_OPERATIONS.FETCH_NEWS, {
      source: 'RSS',
      count: 10,
      added_count: addedCount,
      status: 'completed',
      ip,
      user_agent: userAgent
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
