import apiClient from './axios'

// ── Types ────────────────────────────────────────────

export interface PatentLegalStatusResponse {
  id: number
  patentId: number
  status: string    // e.g. '출원' | '공개' | '등록' | '소멸' | '취하' | '거절' | '무효'
  variant: string   // 'file' | 'pub' | 'reg' | 'expired' | 'withdraw' | 'rejected' | 'invalid'
  date: string      // YYYY-MM-DD
  description?: string
  createdAt: string
}

export interface CreateLegalStatusRequest {
  status: string
  variant: string
  date: string
  description?: string
}

export interface PatentAnnuityResponse {
  id: number
  patentId: number
  yearRange: string   // e.g. '제  1 -  3 년분'
  amount: number
  paidAt: string      // YYYY-MM-DD
  status?: string
}

export interface PayAnnuityRequest {
  yearRange: string
  amount: number
  paidAt: string
}

// ── API ──────────────────────────────────────────────

export const patentHistoryApi = {
  getLegalStatusHistory: async (patentId: number): Promise<PatentLegalStatusResponse[]> => {
    return apiClient.get(`/patents/${patentId}/legal-statuses`)
  },

  createLegalStatus: async (
    patentId: number,
    data: CreateLegalStatusRequest,
  ): Promise<PatentLegalStatusResponse> => {
    return apiClient.post(`/patents/${patentId}/legal-statuses`, data)
  },

  getAnnuityHistory: async (patentId: number): Promise<PatentAnnuityResponse[]> => {
    return apiClient.get(`/patents/${patentId}/annuities`)
  },

  payAnnuity: async (
    patentId: number,
    data: PayAnnuityRequest,
  ): Promise<PatentAnnuityResponse> => {
    return apiClient.post(`/patents/${patentId}/annuities/pay`, data)
  },
}
