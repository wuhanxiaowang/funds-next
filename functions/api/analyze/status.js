import { jsonResponse, errorResponse, corsPreflight } from '../../_shared/supabase.js'

const defaultStatus = () => ({
  isRunning: false,
  currentStep: '',
  progress: 0,
  totalSteps: 5,
  message: '',
  startTime: null,
  endTime: null,
  result: null,
  llmCalls: [],
})

let analysisStatus = defaultStatus()

export function onRequestOptions() {
  return corsPreflight()
}

export async function onRequestGet() {
  return jsonResponse(analysisStatus)
}

export async function onRequestPost(context) {
  try {
    const body = await context.request.json()
    analysisStatus = { ...analysisStatus, ...body }
    return jsonResponse(analysisStatus)
  } catch (e) {
    return errorResponse(e.message || 'Bad request', 400)
  }
}

export async function onRequestDelete() {
  analysisStatus = defaultStatus()
  return jsonResponse(analysisStatus)
}
