import apiClient from './axios'
import type { Report, ReportWithUrl, PatentLegalStatus, Annuity } from '@/types'

// ── List / Detail Types ─────────────────────────────────────

export interface PatentListItem {
  id: number
  title: string
  applicationNumber: string
  registrationNumber?: string
  applicationDate?: string
  expiryDate?: string
  ipcCodes?: string[]
  cpcCodes?: string[]
  applicant?: string
  inventor?: string
  latestLegalStatus?: string
  techField?: string
  businessField?: string
  keywords?: string[]
  summary?: string
  citationCount?: number
  examinationClaimCount?: number
  filingCountry?: string
  currentDepartmentId?: number
  currentDepartmentName?: string
  reviewStatus?: string
  opinion?: string
  checked?: boolean
  latestReportScore?: number
  isOverdue?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface PatentDetail {
  id: number
  title: string
  applicationNumber: string
  registrationNumber?: string
  publicationNumber?: string
  announcementNumber?: string
  applicationDate?: string
  registrationDate?: string
  publicationDate?: string
  announcementDate?: string
  ipcCodes?: string[]
  cpcCodes?: string[]
  applicant?: string
  inventor?: string
  expiryDate?: string
  citationCount?: number
  examinationClaimCount?: number
  originalPdfKey?: string
  managementNumber?: string
  businessField?: string
  techField?: string
  relatedProducts?: string[]
  filingCountry?: string
  isJointApplication?: boolean
  jointApplicant?: string
  initialDepartment?: string
  currentDepartmentId?: number
  currentDepartmentName?: string
  latestLegalStatus?: string
  latestReportScore?: number
  keywords?: string[]
  summary?: string
  createdAt?: string
  updatedAt?: string
}

export interface PageResponse<T> {
  items: T[]
  page: number
  size: number
  totalItems: number
  totalPages: number
  hasNext: boolean
  hasPrevious: boolean
}

export interface PatentListParams {
  keyword?: string
  departmentId?: number
  reviewStatus?: string
  opinion?: string
  checked?: boolean
  status?: string | string[]
  filingCountry?: string
  techField?: string
  sort?: string
  page?: number
  size?: number
}

export interface PatentCreateRequest {
  title: string
  applicationNumber: string
  registrationNumber?: string
  managementNumber?: string
  applicant?: string
  inventor?: string
  applicationDate?: string
  registrationDate?: string
  ipcCodes?: string[]
  cpcCodes?: string[]
  expiryDate?: string
  businessField?: string
  techField?: string
  keywords?: string[]
  relatedProducts?: string[]
  summary?: string
  filingCountry?: string
}

export type PatentUpdateRequest = Partial<PatentCreateRequest>

export interface PatentExtractResultResponse {
  extractJobId: number
  objectKey: string
  status: string
  result?: Partial<PatentCreateRequest>
}

// ── API ─────────────────────────────────────────────────────

export const patentsApi = {
  // ── Main CRUD ──────────────────────────────────────────

  getPatents: async (params?: PatentListParams): Promise<PageResponse<PatentListItem>> => {
    const p = params ? { ...params, page: params.page != null ? params.page - 1 : 0 } : {}
    return apiClient.get('/patents', { params: p })
  },

  getPatent: async (patentId: number): Promise<PatentDetail> => {
    return apiClient.get(`/patents/${patentId}`)
  },

  getPatentSummary: async (): Promise<{ active: number; inactive: number }> => {
    return apiClient.get('/patents/summary')
  },

  createPatent: async (body: PatentCreateRequest): Promise<PatentDetail> => {
    return apiClient.post('/patents', body)
  },

  updatePatent: async (patentId: number, body: PatentUpdateRequest): Promise<PatentDetail> => {
    return apiClient.put(`/patents/${patentId}`, body)
  },

  deletePatent: async (patentId: number): Promise<void> => {
    return apiClient.delete(`/patents/${patentId}`)
  },

  changePatentDepartment: async (patentId: number, departmentId: number): Promise<PatentDetail> => {
    return apiClient.patch(`/patents/${patentId}/department`, { departmentId })
  },

  // ── Legal Status ───────────────────────────────────────

  getLegalStatus: async (patentId: number): Promise<{ items: PatentLegalStatus[] }> => {
    return apiClient.get(`/patents/${patentId}/legal-status`)
  },

  addLegalStatus: async (patentId: number, body: { status: string; changedAt: string }): Promise<{ id: number }> => {
    return apiClient.post(`/patents/${patentId}/legal-status`, body)
  },

  // ── Annuities ──────────────────────────────────────────

  getAnnuities: async (patentId: number): Promise<{ items: Annuity[] }> => {
    return apiClient.get(`/patents/${patentId}/annuities`)
  },

  addAnnuity: async (patentId: number, body: Omit<Annuity, 'id' | 'patentId'>): Promise<{ id: number }> => {
    return apiClient.post(`/patents/${patentId}/annuities`, body)
  },

  updateAnnuity: async (patentId: number, annuityId: number, body: Partial<Annuity>): Promise<{ id: number }> => {
    return apiClient.patch(`/patents/${patentId}/annuities/${annuityId}`, body)
  },

  // ── Evaluation Reports ─────────────────────────────────

  getReports: async (patentId: number): Promise<{ items: Report[] }> => {
    return apiClient.get(`/patents/${patentId}/reports`)
  },

  generateReport: async (patentId: number): Promise<{ id: number; patentId: number; status: string; createdAt: string; updatedAt: string }> => {
    return apiClient.post(`/patents/${patentId}/reports`)
  },

  getReport: async (patentId: number, reportId: number): Promise<ReportWithUrl> => {
    return apiClient.get(`/patents/${patentId}/reports/${reportId}`)
  },

  getReportStatus: async (patentId: number, reportId: number): Promise<{ id: number; status: string }> => {
    return apiClient.get(`/patents/${patentId}/reports/${reportId}/status`)
  },

  // ── Extract Jobs ───────────────────────────────────────

  createExtractUploadUrl: async (): Promise<{ extractJobId: number; uploadUrl: string; objectKey: string }> => {
    return apiClient.post('/patent-extract-jobs/upload-url')
  },

  completeExtractUpload: async (extractJobId: number): Promise<{ extractJobId: number; status: string }> => {
    return apiClient.post(`/patent-extract-jobs/${extractJobId}/upload-complete`)
  },

  getExtractJobStatus: async (extractJobId: number): Promise<{ extractJobId: number; status: string }> => {
    return apiClient.get(`/patent-extract-jobs/${extractJobId}/status`)
  },

  getExtractJobResult: async (extractJobId: number): Promise<PatentExtractResultResponse> => {
    return apiClient.get(`/patent-extract-jobs/${extractJobId}/result`)
  },

  // ── Backward-compat aliases ────────────────────────────

  /** @deprecated use getPatents */
  list: async (params?: PatentListParams): Promise<PageResponse<PatentListItem>> => {
    const p = params ? { ...params, page: params.page != null ? params.page - 1 : 0 } : {}
    return apiClient.get('/patents', { params: p })
  },

  /** @deprecated use getPatent */
  get: async (patentId: number): Promise<PatentDetail> => {
    return apiClient.get(`/patents/${patentId}`)
  },

  /** @deprecated use createPatent */
  create: async (body: any): Promise<PatentDetail> => {
    return apiClient.post('/patents', body)
  },
}
