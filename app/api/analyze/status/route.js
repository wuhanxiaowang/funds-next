import { NextResponse } from 'next/server'

// 全局变量存储分析状态
let analysisStatus = {
  isRunning: false,
  currentStep: '',
  progress: 0,
  totalSteps: 5,
  message: '',
  startTime: null,
  endTime: null,
  result: null,
  llmCalls: []
}

export async function GET() {
  return NextResponse.json(analysisStatus)
}

export async function POST(req) {
  try {
    const body = await req.json()
    analysisStatus = { ...analysisStatus, ...body }
    return NextResponse.json(analysisStatus)
  } catch (e) {
    return NextResponse.json({ detail: e.message || 'Bad request' }, { status: 400 })
  }
}

export async function DELETE() {
  analysisStatus = {
    isRunning: false,
    currentStep: '',
    progress: 0,
    totalSteps: 5,
    message: '',
    startTime: null,
    endTime: null,
    result: null,
    llmCalls: []
  }
  return NextResponse.json(analysisStatus)
}