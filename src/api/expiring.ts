import apiClient from './axios'
import type { PageResponse } from './patents'

// ── Types ────────────────────────────────────────────

export interface ExpiringPatentItem {
  id: number
  title: string
  applicationNumber: string
  techField: string
  departmentName: string
  departmentId?: number
  expiryDate: string   // YYYY-MM-DD
}

export interface ExpiringPeriodSummary {
  period: string       // '3m' | '6m' | '1y' | '3y' | '5y'
  count: number
  byTechField: Record<string, number>
}

export interface ExpiringPatentSummaryResponse {
  totalCount: number
  periods: ExpiringPeriodSummary[]
}

export type ExpiringPatentCalendarResponse = ExpiringPatentItem[]

export interface ExpiringPatentParams {
  departmentId?: number
  period?: string
  sort?: string
  page?: number
  size?: number
}

// ── API ──────────────────────────────────────────────

export const expiringApi = {
  getExpiringPatents: async (params?: ExpiringPatentParams): Promise<PageResponse<ExpiringPatentItem>> => {
    const p = params
      ? { ...params, page: params.page != null ? params.page - 1 : undefined }
      : {}
    return apiClient.get('/patents/expiring', { params: p })
  },

  getExpiringPatentsSummary: async (params?: { departmentId?: number }): Promise<ExpiringPatentSummaryResponse> => {
    return apiClient.get('/patents/expiring/summary', { params })
  },

  getExpiringPatentsCalendar: async (
    year: number,
    params?: { departmentId?: number },
  ): Promise<ExpiringPatentCalendarResponse> => {
    return apiClient.get('/patents/expiring/calendar', { params: { year, ...params } })
  },
}
