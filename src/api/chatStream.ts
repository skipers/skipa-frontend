import { tokenStorage } from './axios'
import type { ChatSourceCard } from './reports'

export interface ChatStreamDoneEvent {
  query?: string
  patent_id?: string
  case_id?: string
  answer?: string
  source_cards?: ChatSourceCard[]
  metrics?: Record<string, unknown>
  stream?: boolean
}

export interface ChatStreamErrorEvent {
  code?: string
  message?: string
  partial_answer?: string
}

export interface ChatStreamHandlers {
  onMetadata?: (data: Record<string, unknown>) => void
  onSourceCards?: (sourceCards: ChatSourceCard[]) => void
  onDelta?: (text: string) => void
  onDone?: (data: ChatStreamDoneEvent) => void
  onError?: (data: ChatStreamErrorEvent) => void
}

interface SseEvent {
  event: string
  data: string
}

export async function streamChatMessage(
  path: string,
  message: string,
  handlers: ChatStreamHandlers,
): Promise<void> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'text/event-stream',
  }
  const token = tokenStorage.getAccess()
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ message }),
  })

  if (!response.ok) {
    throw new Error(`스트리밍 요청에 실패했습니다. (${response.status})`)
  }
  if (!response.body) {
    throw new Error('스트리밍 응답을 읽을 수 없습니다.')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    buffer = consumeEventBuffer(buffer, handlers)
  }

  buffer += decoder.decode()
  consumeEventBuffer(`${buffer}\n\n`, handlers)
}

function consumeEventBuffer(buffer: string, handlers: ChatStreamHandlers): string {
  let normalized = buffer.replace(/\r\n/g, '\n')
  let boundary = normalized.indexOf('\n\n')

  while (boundary !== -1) {
    const rawEvent = normalized.slice(0, boundary)
    normalized = normalized.slice(boundary + 2)
    dispatchEvent(parseEvent(rawEvent), handlers)
    boundary = normalized.indexOf('\n\n')
  }

  return normalized
}

function parseEvent(rawEvent: string): SseEvent {
  let event = 'message'
  const dataLines: string[] = []

  for (const line of rawEvent.split('\n')) {
    if (!line || line.startsWith(':')) continue
    if (line.startsWith('event:')) {
      event = line.slice('event:'.length).trim()
      continue
    }
    if (line.startsWith('data:')) {
      dataLines.push(line.slice('data:'.length).trimStart())
    }
  }

  return { event, data: dataLines.join('\n') }
}

function dispatchEvent(sseEvent: SseEvent, handlers: ChatStreamHandlers) {
  if (!sseEvent.data) return

  const data = JSON.parse(sseEvent.data)
  switch (sseEvent.event) {
    case 'metadata':
      handlers.onMetadata?.(data)
      break
    case 'source_cards':
      handlers.onSourceCards?.(Array.isArray(data.source_cards) ? data.source_cards : [])
      break
    case 'delta':
      handlers.onDelta?.(typeof data.text === 'string' ? data.text : '')
      break
    case 'done':
      handlers.onDone?.(data)
      break
    case 'error':
      handlers.onError?.(data)
      break
    default:
      break
  }
}
