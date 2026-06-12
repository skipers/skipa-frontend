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
  months: number
  byTechField: { name: string; count: number }[]
}

export interface ExpiringPatentSummaryResponse {
  periods: ExpiringPeriodSummary[]
}

export interface MonthBucket {
  month: number
  count: number
  patents: { id: number; title: string; applicationNumber: string; expiryDate: string; techField: string }[]
}

export interface ExpiringPatentCalendarResponse {
  months: MonthBucket[]
}

export interface ExpiringPatentParams {
  months?: number
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

  getExpiringPatentsSummary: async (): Promise<ExpiringPatentSummaryResponse> => {
    return apiClient.get('/patents/expiring/summary')
  },

  getExpiringPatentsCalendar: async (
    year: number,
  ): Promise<ExpiringPatentCalendarResponse> => {
    return apiClient.get('/patents/expiring/calendar', { params: { year } })
  },
}
