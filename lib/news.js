import Parser from 'rss-parser'

const parser = new Parser()

const DOMESTIC_RSS = [
  'https://feed.cnblogs.com/blog/sitehome/rss'         // 和讯财经
]

export async function fetchRssNews(pageSize = 10) {
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
  
  // 移除模拟数据，仅返回实际获取的新闻
  
  all.sort((a, b) => new Date(b.published_at) - new Date(a.published_at))
  return all.slice(0, pageSize * 4)
}
