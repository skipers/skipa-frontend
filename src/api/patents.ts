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
  // ── 특허 CRUD ─────────────────────────────────────────

  list: async (query?: PatentListQuery): Promise<PaginatedData<PatentListItem>> => {
    const { data } = await client.get('/patents', { params: query })
    return data.data
  },

  get: async (patentId: number): Promise<{ patent: Patent }> => {
    const { data } = await client.get(`/patents/${patentId}`)
    return data.data
  },

  create: async (body: PatentCreateRequest): Promise<{ patentId: number }> => {
    const { data } = await client.post('/patents', body)
    return data.data
  },

  update: async (patentId: number, body: Partial<PatentCreateRequest>): Promise<{ patentId: number }> => {
    const { data } = await client.patch(`/patents/${patentId}`, body)
    return data.data
  },

  remove: async (patentId: number): Promise<void> => {
    await client.delete(`/patents/${patentId}`)
  },

  // ── Legal Status ───────────────────────────────────────

  getLegalStatus: async (patentId: number): Promise<{ items: PatentLegalStatus[] }> => {
    const { data } = await client.get(`/patents/${patentId}/legal-status`)
    return data.data
  },

  addLegalStatus: async (
    patentId: number,
    body: { status: string; changedAt: string },
  ): Promise<{ id: number }> => {
    const { data } = await client.post(`/patents/${patentId}/legal-status`, body)
    return data.data
  },

  // ── 연차료 이력 ────────────────────────────────────────

  getAnnuities: async (patentId: number): Promise<{ items: Annuity[] }> => {
    const { data } = await client.get(`/patents/${patentId}/annuities`)
    return data.data
  },

  addAnnuity: async (patentId: number, body: Omit<Annuity, 'id' | 'patentId'>): Promise<{ id: number }> => {
    const { data } = await client.post(`/patents/${patentId}/annuities`, body)
    return data.data
  },

  updateAnnuity: async (
    patentId: number,
    annuityId: number,
    body: Partial<Annuity>,
  ): Promise<{ id: number }> => {
    const { data } = await client.patch(`/patents/${patentId}/annuities/${annuityId}`, body)
    return data.data
  },

  // ── Evaluation Reports ─────────────────────────────────

  getReports: async (patentId: number): Promise<{ items: Report[] }> => {
    const { data } = await client.get(`/patents/${patentId}/reports`)
    return data.data
  },

  generateReport: async (patentId: number): Promise<{ id: number; patentId: number; status: string; createdAt: string; updatedAt: string }> => {
    return apiClient.post(`/patents/${patentId}/reports`)
  },

  getReport: async (patentId: number, reportId: number): Promise<ReportWithUrl> => {
    const { data } = await client.get(`/patents/${patentId}/reports/${reportId}`)
    return data.data
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

  sendDecisionRequest: async (
    patentId: number,
    departmentId: number,
  ): Promise<{ decisionId: number; patentId: number; departmentId: number }> => {
    const { data } = await client.post(`/patents/${patentId}/decisions`, { departmentId })
    return data.data
  },
}
