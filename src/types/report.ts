// ============================================================
// Report Types
// ============================================================

export type ReportStatus = 'GENERATING' | 'COMPLETED' | 'FAILED'
export type JobStatus = 'queued' | 'processing' | 'retrying' | 'completed' | 'failed'

export interface Report {
  id: number
  patentId: number
  reportKey: string
  status: ReportStatus
  evaluatedAt?: string
}

export interface ReportWithUrl extends Report {
  url: string
}

export interface AiReportSection {
  title: string
  content: string
  [key: string]: unknown
}

export interface AiReport {
  patentId: number
  status: string
  generatedAt: string
  report: {
    summary: string
    sections: AiReportSection[]
  }
}

export interface Job {
  jobId: string
  type: string
  status: JobStatus
  startedAt: string
  endedAt: string | null
  resultRef: string | null
}

// ============================================================
// Decision Types
// ============================================================

export type DecisionValue = 'KEEP' | 'DISPOSE'

export interface Decision {
  id: number
  patentId: number
  departmentId: number
  reportId?: number
  decision: DecisionValue | null
  comment?: string | null
  decidedAt?: string | null
}

export interface DecisionSubmitRequest {
  decision: DecisionValue
  comment?: string
}

// Inbox (사업부용)
export interface InboxItem {
  decisionId: number
  patentId: number
  title: string
  decision: DecisionValue | null
  decidedAt: string | null
}

// ============================================================
// Review Request Types
// ============================================================

export type ReviewRequestStatus = 'delivered' | 'reviewing' | 'completed'

export interface ReviewRequestItem {
  patentId: number
  departmentId: number
  status: ReviewRequestStatus
}

export interface ReviewRequest {
  reviewRequestId: string
  status: ReviewRequestStatus
  items: ReviewRequestItem[]
}

// ============================================================
// Dashboard Types (Legal)
// ============================================================

export interface DashboardSummary {
  progressRate: number
  kpi: {
    requested: number
    reviewing: number
    decided: number
  }
}

export interface DashboardAssignment {
  unassigned: number
  assigned: number
  completed: number
}

export interface DashboardDistribution {
  byTechField: Array<{ name: string; count: number }>
  byExpiryQuarter: Array<{ quarter: string; count: number }>
}

export interface DashboardDepartmentItem {
  departmentId: number
  assigned: number
  reviewing: number
  decided: number
}

export interface DashboardDepartments {
  items: DashboardDepartmentItem[]
}
