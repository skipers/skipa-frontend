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

  createReport: async (patentId: number): Promise<ReportDetailResponse> => {
    return apiClient.post(`/patents/${patentId}/reports`)
  },
}
