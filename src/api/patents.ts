import client from '@/http/client'
import type {
  Patent,
  PatentListItem,
  PatentCreateRequest,
  PatentDepartment,
  PatentLegalStatus,
  Annuity,
  PatentListQuery,
  AiReport,
  Report,
  ReportWithUrl,
  Job,
  PaginatedData,
} from '@/types'

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

  // ── PDF 문서 ──────────────────────────────────────────

  uploadPdf: async (patentId: number, file: File): Promise<{ patentId: number; originalPdfKey: string }> => {
    const form = new FormData()
    form.append('file', file)
    const { data } = await client.post(`/patents/${patentId}/documents`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data.data
  },

  extractMetadata: async (patentId: number): Promise<{ jobId: string; status: string }> => {
    const { data } = await client.post(`/patents/${patentId}/documents/extract`)
    return data.data
  },

  extractFromPdf: async (file: File): Promise<Partial<Patent>> => {
    const form = new FormData()
    form.append('file', file)
    const { data } = await client.post('/patents/extract', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data.data
  },

  deletePdf: async (patentId: number): Promise<void> => {
    await client.delete(`/patents/${patentId}/documents`)
  },

  // ── 담당 부서 배정 ─────────────────────────────────────

  getDepartments: async (patentId: number): Promise<{ items: PatentDepartment[] }> => {
    const { data } = await client.get(`/patents/${patentId}/departments`)
    return data.data
  },

  assignDepartment: async (patentId: number, departmentId: number): Promise<PatentDepartment> => {
    const { data } = await client.post(`/patents/${patentId}/departments`, { departmentId })
    return data.data
  },

  changeDepartment: async (
    patentId: number,
    deptId: number,
    newDepartmentId: number,
  ): Promise<{ patentId: number; fromDepartmentId: number; toDepartmentId: number }> => {
    const { data } = await client.patch(`/patents/${patentId}/departments/${deptId}`, {
      departmentId: newDepartmentId,
    })
    return data.data
  },

  removeDepartment: async (patentId: number, deptId: number): Promise<void> => {
    await client.delete(`/patents/${patentId}/departments/${deptId}`)
  },

  // ── 권리 상태 이력 ─────────────────────────────────────

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

  // ── AI 보고서 ─────────────────────────────────────────

  getAiReport: async (patentId: number): Promise<AiReport> => {
    const { data } = await client.get(`/patents/${patentId}/ai-report`)
    return data.data
  },

  retryAiReport: async (patentId: number): Promise<{ patentId: number; status: string }> => {
    const { data } = await client.post(`/patents/${patentId}/ai-report/retry`)
    return data.data
  },

  // ── 평가 보고서 (PDF) ──────────────────────────────────

  getReports: async (patentId: number): Promise<{ items: Report[] }> => {
    const { data } = await client.get(`/patents/${patentId}/reports`)
    return data.data
  },

  generateReport: async (patentId: number): Promise<{ reportId: number; status: string }> => {
    const { data } = await client.post(`/patents/${patentId}/reports`)
    return data.data
  },

  getReport: async (patentId: number, reportId: number): Promise<ReportWithUrl> => {
    const { data } = await client.get(`/patents/${patentId}/reports/${reportId}`)
    return data.data
  },

  getReportStatus: async (patentId: number, reportId: number): Promise<{ reportId: number; status: string }> => {
    const { data } = await client.get(`/patents/${patentId}/reports/${reportId}/status`)
    return data.data
  },

  // ── 결정 요청 전송 (Legal → 사업부) ───────────────────

  sendDecisionRequest: async (
    patentId: number,
    departmentId: number,
  ): Promise<{ decisionId: number; patentId: number; departmentId: number }> => {
    const { data } = await client.post(`/patents/${patentId}/decisions`, { departmentId })
    return data.data
  },
}
