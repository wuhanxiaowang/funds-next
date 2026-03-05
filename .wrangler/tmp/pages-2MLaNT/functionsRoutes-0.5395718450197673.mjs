import { onRequestOptions as __api_news_schedule_start_js_onRequestOptions } from "D:\\投资模型\\frontend-next\\functions\\api\\news\\schedule\\start.js"
import { onRequestPost as __api_news_schedule_start_js_onRequestPost } from "D:\\投资模型\\frontend-next\\functions\\api\\news\\schedule\\start.js"
import { onRequestGet as __api_news_schedule_status_js_onRequestGet } from "D:\\投资模型\\frontend-next\\functions\\api\\news\\schedule\\status.js"
import { onRequestOptions as __api_news_schedule_status_js_onRequestOptions } from "D:\\投资模型\\frontend-next\\functions\\api\\news\\schedule\\status.js"
import { onRequestOptions as __api_news_schedule_stop_js_onRequestOptions } from "D:\\投资模型\\frontend-next\\functions\\api\\news\\schedule\\stop.js"
import { onRequestPost as __api_news_schedule_stop_js_onRequestPost } from "D:\\投资模型\\frontend-next\\functions\\api\\news\\schedule\\stop.js"
import { onRequestGet as __api_analyze_schedule__path__js_onRequestGet } from "D:\\投资模型\\frontend-next\\functions\\api\\analyze\\schedule\\[path].js"
import { onRequestOptions as __api_analyze_schedule__path__js_onRequestOptions } from "D:\\投资模型\\frontend-next\\functions\\api\\analyze\\schedule\\[path].js"
import { onRequestPost as __api_analyze_schedule__path__js_onRequestPost } from "D:\\投资模型\\frontend-next\\functions\\api\\analyze\\schedule\\[path].js"
import { onRequestOptions as __api_analyze_run_js_onRequestOptions } from "D:\\投资模型\\frontend-next\\functions\\api\\analyze\\run.js"
import { onRequestPost as __api_analyze_run_js_onRequestPost } from "D:\\投资模型\\frontend-next\\functions\\api\\analyze\\run.js"
import { onRequestGet as __api_analyze_stats_js_onRequestGet } from "D:\\投资模型\\frontend-next\\functions\\api\\analyze\\stats.js"
import { onRequestOptions as __api_analyze_stats_js_onRequestOptions } from "D:\\投资模型\\frontend-next\\functions\\api\\analyze\\stats.js"
import { onRequestDelete as __api_analyze_status_js_onRequestDelete } from "D:\\投资模型\\frontend-next\\functions\\api\\analyze\\status.js"
import { onRequestGet as __api_analyze_status_js_onRequestGet } from "D:\\投资模型\\frontend-next\\functions\\api\\analyze\\status.js"
import { onRequestOptions as __api_analyze_status_js_onRequestOptions } from "D:\\投资模型\\frontend-next\\functions\\api\\analyze\\status.js"
import { onRequestPost as __api_analyze_status_js_onRequestPost } from "D:\\投资模型\\frontend-next\\functions\\api\\analyze\\status.js"
import { onRequestGet as __api_alerts_js_onRequestGet } from "D:\\投资模型\\frontend-next\\functions\\api\\alerts.js"
import { onRequestOptions as __api_alerts_js_onRequestOptions } from "D:\\投资模型\\frontend-next\\functions\\api\\alerts.js"
import { onRequestDelete as __api_asset_classes_js_onRequestDelete } from "D:\\投资模型\\frontend-next\\functions\\api\\asset-classes.js"
import { onRequestGet as __api_asset_classes_js_onRequestGet } from "D:\\投资模型\\frontend-next\\functions\\api\\asset-classes.js"
import { onRequestOptions as __api_asset_classes_js_onRequestOptions } from "D:\\投资模型\\frontend-next\\functions\\api\\asset-classes.js"
import { onRequestPost as __api_asset_classes_js_onRequestPost } from "D:\\投资模型\\frontend-next\\functions\\api\\asset-classes.js"
import { onRequestPut as __api_asset_classes_js_onRequestPut } from "D:\\投资模型\\frontend-next\\functions\\api\\asset-classes.js"
import { onRequestGet as __api_news_js_onRequestGet } from "D:\\投资模型\\frontend-next\\functions\\api\\news.js"
import { onRequestOptions as __api_news_js_onRequestOptions } from "D:\\投资模型\\frontend-next\\functions\\api\\news.js"
import { onRequestDelete as __api_rules_js_onRequestDelete } from "D:\\投资模型\\frontend-next\\functions\\api\\rules.js"
import { onRequestGet as __api_rules_js_onRequestGet } from "D:\\投资模型\\frontend-next\\functions\\api\\rules.js"
import { onRequestOptions as __api_rules_js_onRequestOptions } from "D:\\投资模型\\frontend-next\\functions\\api\\rules.js"
import { onRequestPost as __api_rules_js_onRequestPost } from "D:\\投资模型\\frontend-next\\functions\\api\\rules.js"
import { onRequestPut as __api_rules_js_onRequestPut } from "D:\\投资模型\\frontend-next\\functions\\api\\rules.js"
import { onRequestGet as __api_signals_js_onRequestGet } from "D:\\投资模型\\frontend-next\\functions\\api\\signals.js"
import { onRequestOptions as __api_signals_js_onRequestOptions } from "D:\\投资模型\\frontend-next\\functions\\api\\signals.js"

export const routes = [
    {
      routePath: "/api/news/schedule/start",
      mountPath: "/api/news/schedule",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_news_schedule_start_js_onRequestOptions],
    },
  {
      routePath: "/api/news/schedule/start",
      mountPath: "/api/news/schedule",
      method: "POST",
      middlewares: [],
      modules: [__api_news_schedule_start_js_onRequestPost],
    },
  {
      routePath: "/api/news/schedule/status",
      mountPath: "/api/news/schedule",
      method: "GET",
      middlewares: [],
      modules: [__api_news_schedule_status_js_onRequestGet],
    },
  {
      routePath: "/api/news/schedule/status",
      mountPath: "/api/news/schedule",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_news_schedule_status_js_onRequestOptions],
    },
  {
      routePath: "/api/news/schedule/stop",
      mountPath: "/api/news/schedule",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_news_schedule_stop_js_onRequestOptions],
    },
  {
      routePath: "/api/news/schedule/stop",
      mountPath: "/api/news/schedule",
      method: "POST",
      middlewares: [],
      modules: [__api_news_schedule_stop_js_onRequestPost],
    },
  {
      routePath: "/api/analyze/schedule/:path",
      mountPath: "/api/analyze/schedule",
      method: "GET",
      middlewares: [],
      modules: [__api_analyze_schedule__path__js_onRequestGet],
    },
  {
      routePath: "/api/analyze/schedule/:path",
      mountPath: "/api/analyze/schedule",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_analyze_schedule__path__js_onRequestOptions],
    },
  {
      routePath: "/api/analyze/schedule/:path",
      mountPath: "/api/analyze/schedule",
      method: "POST",
      middlewares: [],
      modules: [__api_analyze_schedule__path__js_onRequestPost],
    },
  {
      routePath: "/api/analyze/run",
      mountPath: "/api/analyze",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_analyze_run_js_onRequestOptions],
    },
  {
      routePath: "/api/analyze/run",
      mountPath: "/api/analyze",
      method: "POST",
      middlewares: [],
      modules: [__api_analyze_run_js_onRequestPost],
    },
  {
      routePath: "/api/analyze/stats",
      mountPath: "/api/analyze",
      method: "GET",
      middlewares: [],
      modules: [__api_analyze_stats_js_onRequestGet],
    },
  {
      routePath: "/api/analyze/stats",
      mountPath: "/api/analyze",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_analyze_stats_js_onRequestOptions],
    },
  {
      routePath: "/api/analyze/status",
      mountPath: "/api/analyze",
      method: "DELETE",
      middlewares: [],
      modules: [__api_analyze_status_js_onRequestDelete],
    },
  {
      routePath: "/api/analyze/status",
      mountPath: "/api/analyze",
      method: "GET",
      middlewares: [],
      modules: [__api_analyze_status_js_onRequestGet],
    },
  {
      routePath: "/api/analyze/status",
      mountPath: "/api/analyze",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_analyze_status_js_onRequestOptions],
    },
  {
      routePath: "/api/analyze/status",
      mountPath: "/api/analyze",
      method: "POST",
      middlewares: [],
      modules: [__api_analyze_status_js_onRequestPost],
    },
  {
      routePath: "/api/alerts",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_alerts_js_onRequestGet],
    },
  {
      routePath: "/api/alerts",
      mountPath: "/api",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_alerts_js_onRequestOptions],
    },
  {
      routePath: "/api/asset-classes",
      mountPath: "/api",
      method: "DELETE",
      middlewares: [],
      modules: [__api_asset_classes_js_onRequestDelete],
    },
  {
      routePath: "/api/asset-classes",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_asset_classes_js_onRequestGet],
    },
  {
      routePath: "/api/asset-classes",
      mountPath: "/api",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_asset_classes_js_onRequestOptions],
    },
  {
      routePath: "/api/asset-classes",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_asset_classes_js_onRequestPost],
    },
  {
      routePath: "/api/asset-classes",
      mountPath: "/api",
      method: "PUT",
      middlewares: [],
      modules: [__api_asset_classes_js_onRequestPut],
    },
  {
      routePath: "/api/news",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_news_js_onRequestGet],
    },
  {
      routePath: "/api/news",
      mountPath: "/api",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_news_js_onRequestOptions],
    },
  {
      routePath: "/api/rules",
      mountPath: "/api",
      method: "DELETE",
      middlewares: [],
      modules: [__api_rules_js_onRequestDelete],
    },
  {
      routePath: "/api/rules",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_rules_js_onRequestGet],
    },
  {
      routePath: "/api/rules",
      mountPath: "/api",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_rules_js_onRequestOptions],
    },
  {
      routePath: "/api/rules",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_rules_js_onRequestPost],
    },
  {
      routePath: "/api/rules",
      mountPath: "/api",
      method: "PUT",
      middlewares: [],
      modules: [__api_rules_js_onRequestPut],
    },
  {
      routePath: "/api/signals",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_signals_js_onRequestGet],
    },
  {
      routePath: "/api/signals",
      mountPath: "/api",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_signals_js_onRequestOptions],
    },
  ]