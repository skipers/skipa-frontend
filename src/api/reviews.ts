import apiClient from './axios'
import type { PageResponse } from './patents'

// ── Types ────────────────────────────────────────────────────

export interface ReviewResponse {
  id: number
  patentId: number
  title: string
  applicationNumber: string
  techField?: string
  businessField?: string
  reportId?: number
  departmentId: number
  departmentName: string
  currentDepartmentId?: number | null
  currentDepartmentName?: string | null
  reviewCycleId: number
  reviewCycleYear: number
  reviewCycleQuarter: number
  opinion?: string
  comment?: string
  status: string  // SCHEDULED | PENDING | OVERDUE | SUBMITTED
  checked: boolean
  submittedAt?: string
  dueDate?: string
  createdAt: string
  updatedAt: string
}

export interface BulkReviewCreateResponse {
  reviewCycleId: number
  createdCount: number
  skippedCount: number
  items: { patentId: number; status: string; reason?: string }[]
}

export interface ReviewTargetParams {
  status?: string
  departmentId?: number
  patentId?: number
  checked?: boolean
  opinion?: string
  sort?: string
  page?: number
  size?: number
}

// ── API ──────────────────────────────────────────────────────

export const reviewsApi = {
  requestReview: async (patentId: number): Promise<ReviewResponse> => {
    return apiClient.post(`/patents/${patentId}/reviews`)
  },

  requestBulkReview: async (patentIds: number[]): Promise<BulkReviewCreateResponse> => {
    return apiClient.post('/reviews/bulk', { patentIds })
  },

  getReviewTargets: async (params?: ReviewTargetParams): Promise<PageResponse<ReviewResponse>> => {
    const p = params
      ? { ...params, page: params.page != null ? params.page - 1 : undefined }
      : {}
    return apiClient.get('/review-targets', { params: p })
  },

  getReviewTarget: async (reviewId: number): Promise<ReviewResponse> => {
    return apiClient.get(`/review-targets/${reviewId}`)
  },

  confirmReview: async (reviewId: number): Promise<{ id: number; checked: boolean }> => {
    return apiClient.patch(`/reviews/${reviewId}/confirm`)
  },
}
