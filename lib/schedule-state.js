/**
 * 定时分析开关状态，与 analysis-schedule-config 同步
 */
import * as config from './analysis-schedule-config'

export function getScheduleEnabled() {
  return config.getEnabled()
}

export function setScheduleEnabled(v) {
  config.setEnabled(v)
}
