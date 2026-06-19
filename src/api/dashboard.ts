import apiClient from './axios'

// ── Types ────────────────────────────────────────────────────

export interface ReviewCycle {
  id: number
  year: number
  quarter: number
  startDate: string
  endDate: string
  deadline: string
}

export type CycleStatusLabel =
  | 'NO_TARGETS'
  | 'REPORT_NOT_STARTED'
  | 'REPORT_GENERATING'
  | 'REPORT_FAILED'
  | 'REVIEW_NOT_REQUESTED'
  | 'REVIEW_IN_PROGRESS'
  | 'REVIEW_COMPLETED'

export interface LegalDashboardResponse {
  reviewCycle: ReviewCycle
  kpi: {
    requested: number
    reviewing: number
    decided: number
    overdue: number
    unread: number
    unrequested: number
  }
  cycleProgress: {
    targetPatentCount: number
    reports: {
      notStarted: number
      generating: number
      completed: number
      failed: number
    }
    reviews: {
      scheduled: number
      inReview: number
      submitted: number
    }
    statusLabel: CycleStatusLabel
  }
  departments: {
    departmentId: number
    departmentName: string
    assigned: number
    decided: number
  }[]
  byTechField: { name: string; count: number }[]
  byExpiryQuarter: { quarter: string; count: number }[]
  recentReplies: {
    reviewId: number
    patentId: number
    title: string
    applicationNumber: string
    departmentId: number
    departmentName: string
    opinion: string
    submittedAt: string
    checked: boolean
    dueDate: string
  }[]
}

export interface BusinessDashboardResponse {
  reviewCycle: ReviewCycle
  kpi: {
    total: number
    submitted: number
    notSubmitted: number
  }
  pendingPatents: {
    reviewId: number
    patentId: number
    title: string
    applicationNumber: string
    status: string
  }[]
  recentSubmissions: {
    reviewId: number
    patentId: number
    title: string
    applicationNumber: string
    opinion: string
    submittedAt: string
  }[]
  patentStatus: {
    active: number
    inactive: number
  }
  yearlyTrends: {
    year: number
    applications: number
    expiredOrAbandoned: number
  }[]
}

// ── API ──────────────────────────────────────────────────────

export const dashboardApi = {
  getLegalDashboard: async (reviewCycleId?: number): Promise<LegalDashboardResponse> => {
    return apiClient.get('/dashboard/legal', { params: reviewCycleId ? { reviewCycleId } : undefined })
  },

  getBusinessDashboard: async (reviewCycleId?: number): Promise<BusinessDashboardResponse> => {
    return apiClient.get('/dashboard/business', { params: reviewCycleId ? { reviewCycleId } : undefined })
  },
}
