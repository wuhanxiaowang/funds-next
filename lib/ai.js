import OpenAI from 'openai'

// 优先级：火山引擎豆包 > DeepSeek > OpenAI（均兼容 OpenAI SDK）
const useVolcengine = !!(process.env.VOLCENGINE_API_KEY || process.env.ARK_API_KEY)
const useDeepSeek = !useVolcengine && !!process.env.DEEPSEEK_API_KEY
const apiKey = process.env.VOLCENGINE_API_KEY || process.env.ARK_API_KEY || process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY || process.env.AI_API_KEY
const baseURL = process.env.VOLCENGINE_API_BASE || process.env.ARK_BASE_URL || (useVolcengine ? 'https://ark.cn-beijing.volces.com/api/v3' : undefined) || process.env.OPENAI_API_BASE || process.env.OPENAI_BASE_URL || (useDeepSeek ? 'https://api.deepseek.com' : undefined)
const defaultModel = useVolcengine ? (process.env.VOLCENGINE_ENDPOINT_ID || process.env.ARK_ENDPOINT_ID || '') : useDeepSeek ? (process.env.DEEPSEEK_MODEL || 'deepseek-chat') : (process.env.OPENAI_MODEL || process.env.AI_MODEL || 'gpt-4o-mini')
const client = apiKey && (!useVolcengine || defaultModel) ? new OpenAI({ apiKey, ...(baseURL && { baseURL }) }) : null

const PROMPT = `你是一个专业的投资分析师，擅长从新闻中提取投资信号。
请分析以下新闻，严格按格式输出（每行一条）：
1. 核心事件：（一句话总结）
2. 影响的投资品类：（如原油/黄金/股票/创新药/沪深300/AI或大模型等，尽量具体）
3. 影响方向：（涨/跌/无影响）
4. 影响概率：（0-100的数字，不要带%）
5. 影响周期：（短期1-3天/中期1-2周/长期1个月+）
6. 核心逻辑：（为什么涨/跌）

新闻内容：`

function parseEventResponse(text) {
  const result = {
    event: '未知事件',
    asset_class: '未知资产',
    direction: '无影响',
    probability: 0,
    period: '短期',
    logic: '无法分析',
  }
  const lines = (text || '').split('\n')
  for (const line of lines) {
    if (line.includes('核心事件：')) result.event = line.split('核心事件：')[1].trim().slice(0, 500)
    else if (line.includes('影响的投资品类：')) result.asset_class = line.split('影响的投资品类：')[1].trim().slice(0, 200)
    else if (line.includes('影响方向：')) result.direction = line.split('影响方向：')[1].trim().slice(0, 50)
    else if (line.includes('影响概率：')) {
      const s = line.split('影响概率：')[1].trim().replace('%', '').trim()
      result.probability = parseFloat(s) || 0
    } else if (line.includes('影响周期：')) result.period = line.split('影响周期：')[1].trim().slice(0, 100)
    else if (line.includes('核心逻辑：')) result.logic = line.split('核心逻辑：')[1].trim().slice(0, 2000)
  }
  return result
}

function calcStrength(eventInfo) {
  const dirWeight = eventInfo.direction === '涨' ? 1 : eventInfo.direction === '跌' ? -1 : 0
  let strength = eventInfo.probability * Math.abs(dirWeight)
  const periodFactor = { '短期1-3天': 0.8, '中期1-2周': 1, '长期1个月+': 1.2 }[eventInfo.period] || 1
  strength = Math.round(strength * periodFactor)
  return Math.min(100, Math.max(0, strength))
}

export async function extractEvent(newsContent) {
  const emptyResult = () => ({
    event: '未知事件',
    asset_class: '未知资产',
    direction: '无影响',
    probability: 0,
    period: '短期',
    logic: '无法分析',
    strength: 0,
    is_valid: false,
    _llm: null,
  })
  if (!client || !newsContent?.trim()) {
    return emptyResult()
  }
  const model = defaultModel
  const userContent = PROMPT + newsContent.slice(0, 6000)
  const startMs = Date.now()
  try {
    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: '你是一个专业的投资分析师，擅长从新闻中提取投资信号。只输出指定格式，不要多余解释。' },
        { role: 'user', content: userContent },
      ],
      temperature: 0.3,
    })
    const durationMs = Date.now() - startMs
    const text = completion.choices?.[0]?.message?.content || ''
    const parsed = parseEventResponse(text)
    const strength = calcStrength(parsed)
    const is_valid = parsed.probability >= 50 && parsed.direction !== '无影响'
    const usedModel = completion.model || model
    return {
      ...parsed,
      strength,
      is_valid,
      _llm: {
        model: usedModel,
        durationMs,
        inputChars: userContent.length,
        outputSnippet: text.slice(0, 300).replace(/\n/g, ' '),
      },
    }
  } catch (e) {
    console.warn('AI extract failed:', e.message)
    const durationMs = Date.now() - startMs
    return {
      ...emptyResult(),
      _llm: { model, durationMs, inputChars: userContent.length, outputSnippet: '(调用失败: ' + (e.message || '') + ')' },
    }
  }
}
