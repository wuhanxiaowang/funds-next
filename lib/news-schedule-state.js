/**
 * 定时拉取开关状态，与 news-schedule-config 同步（便于 cron-service 等沿用原 API）
 */
import * as config from './news-schedule-config'

export function getNewsScheduleEnabled() {
  return config.getEnabled()
}

export function setNewsScheduleEnabled(v) {
  config.setEnabled(v)
}
