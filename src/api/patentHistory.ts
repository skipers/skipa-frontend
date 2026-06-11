import apiClient from './axios'
import type { PageResponse } from './patents'

// ── Types ────────────────────────────────────────────

export interface PatentLegalStatusResponse {
  id: number
  patentId: number
  status: string    // e.g. '출원' | '공개' | '등록' | '소멸' | '취하' | '거절' | '무효'
  changedAt: string
  updatedAt: string
  createdAt: string
}

export interface CreateLegalStatusRequest {
  status: string
  changedAt: string
}

export interface PatentAnnuityResponse {
  id: number
  patentId: number
  startYear: number
  endYear: number
  amount: number
  dueDate: string
  paidDate: string
  status?: string
}

export interface PayAnnuityRequest {
  paymentYears: number
  amount: number
}

// ── API ──────────────────────────────────────────────

export const patentHistoryApi = {
  getLegalStatusHistory: async (patentId: number): Promise<PatentLegalStatusResponse[]> => {
    return apiClient.get(`/patents/${patentId}/legal-status`)
  },

  createLegalStatus: async (
    patentId: number,
    data: CreateLegalStatusRequest,
  ): Promise<PatentLegalStatusResponse> => {
    return apiClient.post(`/patents/${patentId}/legal-status`, data)
  },

  getAnnuityHistory: async (patentId: number): Promise<PageResponse<PatentAnnuityResponse>> => {
    return apiClient.get(`/patents/${patentId}/annuities`)
  },

  payAnnuity: async (
    patentId: number,
    data: PayAnnuityRequest,
  ): Promise<PatentAnnuityResponse> => {
    return apiClient.post(`/patents/${patentId}/annuities`, data)
  },
}
