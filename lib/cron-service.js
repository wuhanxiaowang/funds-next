import { getNewsScheduleEnabled } from './news-schedule-state'
import { getScheduleEnabled } from './schedule-state'

// 定时任务服务
class CronService {
  constructor() {
    this.newsInterval = null
    this.analysisInterval = null
    this.nextNewsTime = null
    this.nextAnalysisTime = null
    // 构造时就计算下次执行时间
    this.calculateNextTime()
  }

  // 计算下次执行时间
  calculateNextTime() {
    const now = new Date()
    this.nextNewsTime = new Date(now)
    this.nextNewsTime.setHours(this.nextNewsTime.getHours() + 2)
    this.nextAnalysisTime = new Date(now)
    this.nextAnalysisTime.setHours(this.nextAnalysisTime.getHours() + 2)
    console.log('下次拉取时间:', this.nextNewsTime)
    console.log('下次分析时间:', this.nextAnalysisTime)
  }

  // 启动定时任务
  start() {
    console.log('启动定时任务服务')
    
    // 每2小时拉取新闻
    this.newsInterval = setInterval(async () => {
      if (getNewsScheduleEnabled()) {
        console.log('执行定时拉取新闻')
        try {
          await fetch('http://localhost:3000/api/news?fetch=true')
          console.log('定时拉取新闻完成')
          this.calculateNextTime()
        } catch (e) {
          console.error('定时拉取新闻失败:', e.message)
          this.calculateNextTime()
        }
      }
    }, 2 * 60 * 60 * 1000) // 2小时

    // 每2小时分析新闻
    this.analysisInterval = setInterval(async () => {
      if (getScheduleEnabled()) {
        console.log('执行定时分析新闻')
        try {
          await fetch('http://localhost:3000/api/analyze/run', {
            method: 'POST'
          })
          console.log('定时分析新闻完成')
          this.calculateNextTime()
        } catch (e) {
          console.error('定时分析新闻失败:', e.message)
          this.calculateNextTime()
        }
      }
    }, 2 * 60 * 60 * 1000) // 2小时
  }

  // 停止定时任务
  stop() {
    console.log('停止定时任务服务')
    if (this.newsInterval) {
      clearInterval(this.newsInterval)
      this.newsInterval = null
    }
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval)
      this.analysisInterval = null
    }
    this.nextNewsTime = null
    this.nextAnalysisTime = null
  }

  // 获取下次执行时间
  getNextTimes() {
    return {
      nextNewsTime: this.nextNewsTime,
      nextAnalysisTime: this.nextAnalysisTime
    }
  }
}

// 导出单例
export const cronService = new CronService()
