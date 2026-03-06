/**
 * 阿里云函数计算 FC 自定义运行时入口
 * FC Web 函数要求 HTTP 服务监听 0.0.0.0:9000
 */
process.env.PORT = '9000'
require('next/dist/bin/next').main()
