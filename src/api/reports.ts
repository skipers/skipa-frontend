import apiClient from './axios'
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
  progress?: number
  message?: string
}

export interface ReportListParams {
  patentId?: number
  status?: string
  sort?: string
  page?: number
  size?: number
}

// ── API ──────────────────────────────────────────────────────

export const reportsApi = {
  getReports: async (params?: ReportListParams): Promise<PageResponse<ReportDetailResponse>> => {
    const p = params
      ? { ...params, page: params.page != null ? params.page - 1 : undefined }
      : {}
    return apiClient.get('/reports', { params: p })
  },

  getLatestReport: async (patentId: number): Promise<ReportDetailResponse> => {
    return apiClient.get(`/patents/${patentId}/reports/latest`)
  },

  getReportHistory: async (patentId: number): Promise<ReportHistoryItem[]> => {
    return apiClient.get(`/patents/${patentId}/reports/history`)
  },

  getReport: async (reportId: number): Promise<ReportDetailResponse> => {
    return apiClient.get(`/reports/${reportId}`)
  },

  getReportStatus: async (reportId: number): Promise<ReportStatusResponse> => {
    return apiClient.get(`/reports/${reportId}/status`)
  },

  createReport: async (patentId: number): Promise<ReportDetailResponse> => {
    return apiClient.post(`/patents/${patentId}/reports`)
  },
}
