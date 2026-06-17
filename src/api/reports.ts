import apiClient from './axios'
import { streamChatMessage, type ChatStreamHandlers } from './chatStream'
import type { PageResponse } from './patents'

// ── Types ────────────────────────────────────────────────────

export interface ReportDetailResponse {
  id: number
  patentId: number
  status: string  // PENDING | PROCESSING | COMPLETED | FAILED
  url?: string
  totalScore?: number
  valueGrade?: string
  evaluatedAt?: string
  opinion?: string
  comment?: string
  submittedAt?: string
  createdAt: string
  updatedAt: string
}

export interface ReportHistoryItem {
  id: number
  patentId: number
  totalScore?: number
  valueGrade?: string
  evaluatedAt?: string
  opinion?: string  // KEEP | DISPOSE
  comment?: string
}

export interface ReportStatusResponse {
  id: number
  status: string
  patentId: number
  totalScore?: number
  valueGrade?: string
  evaluatedAt?: string
  updatedAt: string
}

export interface ReportListParams {
  status?: string
  sort?: string
  page?: number
  size?: number
}

export interface ChatSourceCard {
  label?: string
  title?: string
  display_title?: string
  source_type?: string
  page_no?: number
  url?: string
  location_label?: string
  source_path?: string
  match_terms?: string[]
  snippet?: string
}

export interface ReportChatMessageResponse {
  id: number
  patentId: number
  role: string
  content: string
  source_cards?: ChatSourceCard[]
  sourceCards?: ChatSourceCard[]
  createdAt: string
}

export interface ReportChatSendResponse {
  userMessage: ReportChatMessageResponse
  assistantMessage: ReportChatMessageResponse
}

// ── API ──────────────────────────────────────────────────────

export const reportsApi = {
  getReports: async (patentId: number, params?: ReportListParams): Promise<PageResponse<ReportDetailResponse>> => {
    const p = params
      ? { ...params, page: params.page != null ? params.page - 1 : undefined }
      : {}
    return apiClient.get(`/patents/${patentId}/reports`, { params: p })
  },

  getLatestReport: async (patentId: number): Promise<ReportDetailResponse> => {
    return apiClient.get(`/patents/${patentId}/reports/latest`)
  },

  getReportHistory: async (patentId: number): Promise<{ items: ReportHistoryItem[] }> => {
    return apiClient.get(`/patents/${patentId}/reports/history`)
  },

  getReport: async (patentId: number, reportId: number): Promise<ReportDetailResponse> => {
    return apiClient.get(`/patents/${patentId}/reports/${reportId}`)
  },

  getReportStatus: async (patentId: number, reportId: number): Promise<ReportStatusResponse> => {
    return apiClient.get(`/patents/${patentId}/reports/${reportId}/status`)
  },

  createReport: async (patentId: number): Promise<{ id: number; patentId: number; status: string; createdAt: string; updatedAt: string }> => {
    return apiClient.post(`/patents/${patentId}/reports`)
  },

  getChatHistory: async (patentId: number, reportId: number): Promise<ReportChatMessageResponse[]> => {
    return apiClient.get(`/patents/${patentId}/reports/${reportId}/chat/messages`)
  },

  sendChatMessage: async (patentId: number, reportId: number, message: string): Promise<ReportChatSendResponse> => {
    return apiClient.post(`/patents/${patentId}/reports/${reportId}/chat/messages`, { message }, { timeout: 120_000 })
  },

  sendChatMessageStream: async (
    patentId: number,
    reportId: number,
    message: string,
    handlers: ChatStreamHandlers,
  ): Promise<void> => {
    return streamChatMessage(`/patents/${patentId}/reports/${reportId}/chat/messages/stream`, message, handlers)
  },

  clearChatHistory: async (patentId: number, reportId: number): Promise<void> => {
    return apiClient.delete(`/patents/${patentId}/reports/${reportId}/chat/messages`)
  },
}
