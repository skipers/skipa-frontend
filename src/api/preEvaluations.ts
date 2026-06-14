import apiClient from './axios'
import type { PageResponse } from './patents'
import type { ChatSourceCard } from './reports'

export interface PreEvaluationCreateRequest {
  title: string
  technicalDescription: string
  claims: string[]
  relatedBusiness?: string
  targetCountries?: string
}

export interface PreEvaluationCreateResponse {
  id: number
  userId: number
  status: string
  createdAt: string
  updatedAt: string
}

export interface PreEvaluationListItem {
  id: number
  title: string
  status: string
  reportUrl?: string
  completedAt?: string
  createdAt: string
  updatedAt: string
}

export interface PreEvaluationDetailResponse {
  id: number
  userId: number
  title: string
  technicalDescription: string
  claims: string[]
  relatedBusiness?: string
  targetCountries?: string
  status: string
  reportUrl?: string
  completedAt?: string
  createdAt: string
  updatedAt: string
}

export interface PreEvaluationStatusResponse {
  id: number
  status: string
  completedAt?: string
  updatedAt: string
}

export interface PreEvaluationChatMessageResponse {
  id: number
  preEvaluationId: number
  role: string
  content: string
  sourceCards?: ChatSourceCard[]
  createdAt: string
}

export interface PreEvaluationChatSendResponse {
  userMessage: PreEvaluationChatMessageResponse
  assistantMessage: PreEvaluationChatMessageResponse
}

export const preEvaluationsApi = {
  create: async (body: PreEvaluationCreateRequest): Promise<PreEvaluationCreateResponse> => {
    return apiClient.post('/pre-evaluations', body)
  },

  getList: async (params?: { page?: number; size?: number }): Promise<PageResponse<PreEvaluationListItem>> => {
    const p = params ? { ...params, page: params.page != null ? params.page - 1 : 0 } : { page: 0 }
    return apiClient.get('/pre-evaluations', { params: p })
  },

  getDetail: async (id: number): Promise<PreEvaluationDetailResponse> => {
    return apiClient.get(`/pre-evaluations/${id}`)
  },

  getStatus: async (id: number): Promise<PreEvaluationStatusResponse> => {
    return apiClient.get(`/pre-evaluations/${id}/status`)
  },

  delete: async (id: number): Promise<void> => {
    return apiClient.delete(`/pre-evaluations/${id}`)
  },

  getChatHistory: async (id: number): Promise<PreEvaluationChatMessageResponse[]> => {
    return apiClient.get(`/pre-evaluations/${id}/chat/messages`)
  },

  sendChatMessage: async (id: number, message: string): Promise<PreEvaluationChatSendResponse> => {
    return apiClient.post(`/pre-evaluations/${id}/chat/messages`, { message }, { timeout: 120_000 })
  },

  clearChat: async (id: number): Promise<void> => {
    return apiClient.delete(`/pre-evaluations/${id}/chat/messages`)
  },
}
