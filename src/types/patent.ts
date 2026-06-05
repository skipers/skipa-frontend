// ============================================================
// Patent Types
// ============================================================

export interface Patent {
  id: number
  title: string
  applicationNumber: string
  registrationNumber: string
  publicationNumber?: string
  announcementNumber?: string
  manageNumber?: string
  applicationDate?: string
  registrationDate?: string
  publicationDate?: string
  announcementDate?: string
  expiryDate?: string
  ipcCode?: string
  cpcCode?: string
  applicant?: string
  inventor?: string
  citationCount?: number
  originalPdfKey?: string
  businessField?: string
  techField?: string
  relatedProducts?: string[]
  filingCountry?: string
  isJointApplication?: boolean
  jointApplicant?: string | null
  initialDepartment?: string
  keywords?: string[]
  overview?: string
  coreContent?: string
}

export interface PatentListItem {
  id: number
  title: string
  applicationNumber: string
  registrationNumber: string
  manageNumber?: string
  expiryDate?: string
}

export interface PatentCreateRequest {
  title: string
  applicationNumber: string
  registrationNumber: string
  manageNumber?: string
  applicant?: string
  inventor?: string
  applicationDate?: string
  registrationDate?: string
  ipcCode?: string
  cpcCode?: string
  expiryDate?: string
  businessField?: string
  techField?: string
  keywords?: string[]
  relatedProducts?: string[]
  overview?: string
  coreContent?: string
}

// Patent Department (배정)
export interface PatentDepartment {
  id: number
  patentId: number
  departmentId: number
  assignedAt?: string
}

// Legal Status
export type LegalStatusType = 'REGISTERED' | 'ABANDONED' | 'EXPIRED' | 'PENDING'

export interface PatentLegalStatus {
  id: number
  patentId: number
  status: LegalStatusType
  changedAt: string
}

// Annuity
export type AnnuityStatus = 'PAID' | 'UNPAID'

export interface Annuity {
  id: number
  patentId: number
  annuityYear: number
  dueDate: string
  paidDate: string | null
  status: AnnuityStatus
  amount: number
}

// Query params
export interface PatentListQuery {
  q?: string
  departmentId?: number
  status?: string
  page?: number
  size?: number
}
