import apiClient from './axios'
import type { PatentDetail } from './patents'
import type { PageResponse } from './patents'

// ── Types ────────────────────────────────────────────

export interface BusinessReviewResponse {
  id: number
  patentId: number
  title: string
  applicationNumber: string
  keywords?: string[]
  summary?: string
  opinion?: string        // MAINTAIN | ABANDON
  comment?: string
  status: string          // PENDING | OVERDUE | SUBMITTED
  submittedAt?: string
  createdAt: string
  updatedAt: string
  reviewRequestedAt?: string
  dueDate?: string
  totalScore?: number
  valueGrade?: string     // S | A | B | C | D
}

export interface BusinessReviewDetailResponse {
  patent: PatentDetail
  opinion?: string
  comment?: string
  status: string
  submittedAt?: string
  reviewRequestedAt?: string
  dueDate?: string
}

export interface BusinessReviewSummaryResponse {
  reviewCycle: {
    id: number
    year: number
    quarter: number
    startDate: string
    endDate: string
    deadline: string
  }
  kpi: {
    submitted: number
    notSubmitted: number
  }
}

export interface BusinessReviewHistoryResponse {
  id: number
  patentId: number
  reviewCycle: { id: number; year: number; quarter: number; startDate: string; endDate: string; deadline: string }
  title: string
  applicationNumber: string
  opinion?: string
  comment?: string
  status: string
  submittedAt?: string
  reviewRequestedAt?: string
  dueDate?: string
  totalScore?: number
  valueGrade?: string
}

export interface BusinessReviewListParams {
  status?: string        // PENDING | OVERDUE | SUBMITTED
  opinion?: string       // MAINTAIN | ABANDON
  submittedFrom?: string // YYYY-MM-DD
  submittedTo?: string   // YYYY-MM-DD
  sort?: string
  page?: number
  size?: number
}

export interface BusinessReviewHistoryParams {
  year?: number
  quarter?: number
  opinion?: string       // MAINTAIN | ABANDON
  page?: number
  size?: number
}

// ── API ──────────────────────────────────────────────

export const businessReviewsApi = {
  getBusinessReviews: async (params?: BusinessReviewListParams): Promise<PageResponse<BusinessReviewResponse>> => {
    const p = params
      ? { ...params, page: params.page != null ? params.page - 1 : undefined }
      : {}
    return apiClient.get('/business-reviews', { params: p })
  },

  getBusinessReview: async (patentId: number): Promise<BusinessReviewDetailResponse> => {
    return apiClient.get(`/business-reviews/${patentId}`)
  },

  getBusinessReviewSummary: async (): Promise<BusinessReviewSummaryResponse> => {
    return apiClient.get('/business-reviews/summary')
  },

  getBusinessReviewHistory: async (params?: BusinessReviewHistoryParams): Promise<PageResponse<BusinessReviewHistoryResponse>> => {
    const p = params
      ? { ...params, page: params.page != null ? params.page - 1 : undefined }
      : {}
    return apiClient.get('/business-reviews/history', { params: p })
  },

  submitOpinion: async (
    patentId: number,
    opinion: 'MAINTAIN' | 'ABANDON',
    comment?: string,
  ): Promise<BusinessReviewResponse> => {
    return apiClient.post(`/business-reviews/${patentId}/opinions`, { opinion, comment })
  },
}
