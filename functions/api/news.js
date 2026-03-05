import { createSupabase, jsonResponse, errorResponse, corsPreflight } from '../_shared/supabase.js'

const DOMESTIC_RSS = ['https://feed.cnblogs.com/blog/sitehome/rss']

async function fetchRssNews(pageSize = 10) {
  const all = []
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000)
  try {
    await Promise.all(
      DOMESTIC_RSS.map(async (url) => {
        try {
          const response = await fetch(url, { signal: controller.signal })
          if (!response.ok) return
          const text = await response.text()
          const items = parseRssItems(text, pageSize)
          const feedTitle = extractFeedTitle(text) || 'RSS'
          for (const entry of items) {
            const title = (entry.title || '').slice(0, 500)
            const content = (entry.content || entry.title || '').slice(0, 10000)
            const publishedAt = entry.pubDate ? new Date(entry.pubDate).toISOString() : new Date().toISOString()
            all.push({ title, content, source: feedTitle, published_at: publishedAt })
          }
        } catch (_) {}
      })
    )
  } finally {
    clearTimeout(timeoutId)
  }
  all.sort((a, b) => new Date(b.published_at) - new Date(a.published_at))
  return all.slice(0, pageSize * 4)
}

function extractFeedTitle(xml) {
  const m = xml.match(/<title[^>]*>([^<]+)<\/title>/i)
  return m ? m[1].trim().slice(0, 200) : ''
}

function parseRssItems(xml, limit) {
  const items = []
  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi
  let match
  while ((match = itemRegex.exec(xml)) !== null && items.length < limit) {
    const block = match[1]
    const title = block.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/<[^>]+>/g, '').trim() || ''
    const desc = block.match(/<description[^>]*>([\s\S]*?)<\/description>/i)?.[1]?.replace(/<[^>]+>/g, '').trim()
      || block.match(/<content:encoded[^>]*>([\s\S]*?)<\/content:encoded>/i)?.[1]?.replace(/<[^>]+>/g, '').trim() || ''
    const pubDate = block.match(/<pubDate[^>]*>([^<]+)<\/pubDate>/i)?.[1]
      || block.match(/<dc:date[^>]*>([^<]+)<\/dc:date>/i)?.[1]
    items.push({ title, content: desc || title, pubDate })
  }
  return items
}

export function onRequestOptions() {
  return corsPreflight()
}

export async function onRequestGet(context) {
  const supabase = createSupabase(context.env)
  const url = new URL(context.request.url)
  const skip = parseInt(url.searchParams.get('skip') || '0', 10)
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '100', 10), 500)
  const doFetch = url.searchParams.get('fetch') === 'true'
  let addedCount = 0

  if (doFetch) {
    const rssNews = await fetchRssNews(10)
    if (supabase && rssNews.length > 0) {
      const { data: existingNews } = await supabase.from('news').select('title')
      const existingTitles = new Set((existingNews || []).map((n) => n.title))
      const newNewsList = rssNews.filter((item) => !existingTitles.has(item.title))
      for (const item of newNewsList) {
        await supabase.from('news').insert({
          title: item.title,
          content: item.content,
          source: item.source,
          published_at: item.published_at,
        })
      }
      addedCount = newNewsList.length
    }
  }

  if (!supabase) return jsonResponse({ news: [], totalCount: 0, ...(doFetch && { addedCount }) })

  const { data: allNews, error } = await supabase.from('news').select('*')
  if (error) return errorResponse(error.message, 500)

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
  const newsWithStatus = uniqueNews.map((news) => ({ ...news, analyzed: analyzedIds.has(news.id) }))
  const shuffled = newsWithStatus.sort(() => Math.random() - 0.5)
  const returnLimit = Math.min(limit, 50)
  const list = shuffled.slice(0, returnLimit)

  if (doFetch) return jsonResponse({ news: list, addedCount, totalCount: uniqueNews.length })
  return jsonResponse({ news: list, totalCount: uniqueNews.length })
}
