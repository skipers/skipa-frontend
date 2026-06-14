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
  createdAt?: string
  updatedAt?: string
}

export interface PayAnnuityRequest {
  paymentYears: number
  amount: number
}

export interface UpdateAnnuityRequest {
  paymentYears: number
  amount: number
  paidDate: string
}

// ── API ──────────────────────────────────────────────

export const patentHistoryApi = {
  getLegalStatusHistory: async (patentId: number, page = 0, size = 50): Promise<PageResponse<PatentLegalStatusResponse>> => {
    return apiClient.get(`/patents/${patentId}/legal-status`, { params: { page, size } })
  },

  createLegalStatus: async (
    patentId: number,
    data: CreateLegalStatusRequest,
  ): Promise<PatentLegalStatusResponse> => {
    return apiClient.post(`/patents/${patentId}/legal-status`, data)
  },

  getAnnuityHistory: async (patentId: number, page = 0, size = 50): Promise<PageResponse<PatentAnnuityResponse>> => {
    return apiClient.get(`/patents/${patentId}/annuities`, { params: { page, size } })
  },

  payAnnuity: async (
    patentId: number,
    data: PayAnnuityRequest,
  ): Promise<PatentAnnuityResponse> => {
    return apiClient.post(`/patents/${patentId}/annuities`, data)
  },

  updateAnnuity: async (
    patentId: number,
    annuityId: number,
    data: UpdateAnnuityRequest,
  ): Promise<PatentAnnuityResponse> => {
    return apiClient.put(`/patents/${patentId}/annuities/${annuityId}`, data)
  },

  deleteAnnuity: async (patentId: number, annuityId: number): Promise<void> => {
    return apiClient.delete(`/patents/${patentId}/annuities/${annuityId}`)
  },
}
