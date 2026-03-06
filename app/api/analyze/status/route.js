import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export const runtime = 'nodejs'

const DEFAULT_STATUS = {
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

async function getStoredStatus() {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('analysis_status')
    .select('data')
    .eq('id', 1)
    .single()
  if (error || !data?.data) return null
  return { ...DEFAULT_STATUS, ...data.data }
}

async function setStoredStatus(status) {
  if (!supabase) return
  await supabase
    .from('analysis_status')
    .upsert({ id: 1, data: status, updated_at: new Date().toISOString() }, { onConflict: 'id' })
}

// 无 Supabase 时内存兜底（单实例有效）
let memoryStatus = { ...DEFAULT_STATUS }

export async function GET() {
  const stored = await getStoredStatus()
  const status = stored ?? memoryStatus
  return NextResponse.json(status)
}

export async function POST(req) {
  try {
    const body = await req.json()
    const nextStatus = { ...DEFAULT_STATUS, ...(await getStoredStatus()) ?? memoryStatus, ...body }
    memoryStatus = nextStatus
    await setStoredStatus(nextStatus)
    return NextResponse.json(nextStatus)
  } catch (e) {
    return NextResponse.json({ detail: e.message || 'Bad request' }, { status: 400 })
  }
}

export async function DELETE() {
  const reset = { ...DEFAULT_STATUS }
  memoryStatus = reset
  if (supabase) {
    await supabase.from('analysis_status').upsert({ id: 1, data: reset, updated_at: new Date().toISOString() }, { onConflict: 'id' })
  }
  return NextResponse.json(reset)
}
