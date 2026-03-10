import { getNewsScheduleEnabled } from './news-schedule-state'
import { getScheduleEnabled } from './schedule-state'
import * as newsConfig from './news-schedule-config'
import * as analysisConfig from './analysis-schedule-config'

const BASE_URL = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')

// 定时任务服务
class CronService {
  constructor() {
    this.newsTimeout = null
    this.analysisTimeout = null
    this.nextNewsTime = null
    this.nextAnalysisTime = null
  }

  // 新闻定时：按配置间隔用 setTimeout 链
  scheduleNextNews() {
    if (this.newsTimeout) {
      clearTimeout(this.newsTimeout)
      this.newsTimeout = null
    }
    const minutes = newsConfig.getIntervalMinutes()
    const ms = Math.max(5 * 60 * 1000, minutes * 60 * 1000)
    this.nextNewsTime = new Date(Date.now() + ms)
    this.newsTimeout = setTimeout(async () => {
      if (getNewsScheduleEnabled()) {
        console.log('执行定时拉取新闻')
        try {
          await fetch(`${BASE_URL}/api/news?fetch=true`)
          console.log('定时拉取新闻完成')
        } catch (e) {
          console.error('定时拉取新闻失败:', e.message)
        }
      }
      this.scheduleNextNews()
    }, ms)
  }

  // 分析定时：按配置间隔用 setTimeout 链
  scheduleNextAnalysis() {
    if (this.analysisTimeout) {
      clearTimeout(this.analysisTimeout)
      this.analysisTimeout = null
    }
    const minutes = analysisConfig.getIntervalMinutes()
    const ms = Math.max(5 * 60 * 1000, minutes * 60 * 1000)
    this.nextAnalysisTime = new Date(Date.now() + ms)
    this.analysisTimeout = setTimeout(async () => {
      if (getScheduleEnabled()) {
        console.log('执行定时分析新闻')
        try {
          await fetch(`${BASE_URL}/api/analyze/run`, { method: 'POST' })
          console.log('定时分析新闻完成')
        } catch (e) {
          console.error('定时分析新闻失败:', e.message)
        }
      }
      this.scheduleNextAnalysis()
    }, ms)
  }

  async start() {
    console.log('启动定时任务服务')
    await newsConfig.loadFromDb()
    await analysisConfig.loadFromDb()
    if (getNewsScheduleEnabled()) {
      this.scheduleNextNews()
      console.log('定时拉取新闻已恢复，间隔(分钟):', newsConfig.getIntervalMinutes())
    }
    if (getScheduleEnabled()) {
      this.scheduleNextAnalysis()
      console.log('定时分析已恢复，间隔(分钟):', analysisConfig.getIntervalMinutes())
    }
  }

  stop() {
    console.log('停止定时任务服务')
    if (this.newsTimeout) {
      clearTimeout(this.newsTimeout)
      this.newsTimeout = null
    }
    if (this.analysisTimeout) {
      clearTimeout(this.analysisTimeout)
      this.analysisTimeout = null
    }
    this.nextNewsTime = null
    this.nextAnalysisTime = null
  }

  restartNewsTimer() {
    if (getNewsScheduleEnabled()) {
      this.scheduleNextNews()
    } else {
      if (this.newsTimeout) {
        clearTimeout(this.newsTimeout)
        this.newsTimeout = null
      }
      this.nextNewsTime = null
    }
  }

  restartAnalysisTimer() {
    if (getScheduleEnabled()) {
      this.scheduleNextAnalysis()
    } else {
      if (this.analysisTimeout) {
        clearTimeout(this.analysisTimeout)
        this.analysisTimeout = null
      }
      this.nextAnalysisTime = null
    }
  }

  getNextTimes() {
    return {
      nextNewsTime: this.nextNewsTime,
      nextAnalysisTime: this.nextAnalysisTime
    }
  }
}

export const cronService = new CronService()
