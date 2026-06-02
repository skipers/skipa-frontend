import client from '@/http/client'
import type {
  DashboardSummary,
  DashboardAssignment,
  DashboardDistribution,
  DashboardDepartments,
  Decision,
  DecisionSubmitRequest,
  InboxItem,
  ReviewRequest,
  Job,
  PaginatedData,
} from '@/types'

// ============================================================
// Dashboard (Legal)
// ============================================================

export const dashboardApi = {
  getSummary: async (): Promise<DashboardSummary> => {
    const { data } = await client.get('/dashboard/summary')
    return data.data
  },

  getAssignment: async (): Promise<DashboardAssignment> => {
    const { data } = await client.get('/dashboard/assignment')
    return data.data
  },

  getDistribution: async (): Promise<DashboardDistribution> => {
    const { data } = await client.get('/dashboard/distribution')
    return data.data
  },

  getDepartments: async (): Promise<DashboardDepartments> => {
    const { data } = await client.get('/dashboard/departments')
    return data.data
  },
}

// ============================================================
// Decisions (Legal 모니터링)
// ============================================================

export const decisionsApi = {
  list: async (params?: {
    departmentId?: number
    decision?: string
    q?: string
    page?: number
    size?: number
  }): Promise<PaginatedData<Decision>> => {
    const { data } = await client.get('/decisions', { params })
    return data.data
  },

  get: async (decisionId: number): Promise<{ decision: Decision }> => {
    const { data } = await client.get(`/decisions/${decisionId}`)
    return data.data
  },
}

// ============================================================
// Inbox (사업부)
// ============================================================

export const inboxApi = {
  list: async (params?: {
    status?: 'todo' | 'done' | 'all'
    page?: number
    size?: number
  }): Promise<PaginatedData<InboxItem>> => {
    const { data } = await client.get('/inbox', { params })
    return data.data
  },

  get: async (decisionId: number): Promise<{ decision: Decision; patent: { id: number; title: string; applicationNumber: string; registrationNumber: string } }> => {
    const { data } = await client.get(`/inbox/${decisionId}`)
    return data.data
  },

  decide: async (decisionId: number, body: DecisionSubmitRequest): Promise<{ decision: Decision }> => {
    const { data } = await client.post(`/inbox/${decisionId}/decide`, body)
    return data.data
  },
}

// ============================================================
// Review Requests (Legal)
// ============================================================

export const reviewRequestsApi = {
  create: async (body: {
    quarter: string
    items: Array<{ patentId: number; departmentId: number }>
  }): Promise<ReviewRequest> => {
    const { data } = await client.post('/review-requests', body)
    return data.data
  },

  list: async (params?: {
    quarter?: string
    status?: string
    departmentId?: number
    page?: number
    size?: number
  }): Promise<PaginatedData<Pick<ReviewRequest, 'reviewRequestId' | 'status'> & { progress: { total: number; completed: number } }>> => {
    const { data } = await client.get('/review-requests', { params })
    return data.data
  },

  get: async (reviewRequestId: string): Promise<ReviewRequest> => {
    const { data } = await client.get(`/review-requests/${reviewRequestId}`)
    return data.data
  },

  changeDepartment: async (
    reviewRequestId: string,
    patentId: number,
    departmentId: number,
  ): Promise<{ reviewRequestId: string; patentId: number; departmentId: number }> => {
    const { data } = await client.patch(`/review-requests/${reviewRequestId}/items/${patentId}`, {
      departmentId,
    })
    return data.data
  },
}

// ============================================================
// Jobs (비동기 작업 상태)
// ============================================================

export const jobsApi = {
  get: async (jobId: string): Promise<Job> => {
    const { data } = await client.get(`/jobs/${jobId}`)
    return data.data
  },
}
