import { reactive } from 'vue'

export interface ChatMessage {
  id: number
  role: 'assistant' | 'user'
  text: string
  typing?: boolean
}

// 모듈 레벨 — 컴포넌트 언마운트 후에도 특허별 대화 내역 유지
export const patentChatHistories = reactive<Record<number, ChatMessage[]>>({})
let _msgId = 100
export function nextChatId() { return _msgId++ }
