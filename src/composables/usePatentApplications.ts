import { ref } from 'vue'
import { patentsApi, type PatentApplicationItem, type ApplicationListParams } from '@/api/patents'

export type AppStatus = 'pending' | 'approved' | 'rejected' | 'withdrawn'

export interface PatentApplication {
  id: number
  title: string
  managementNumber: string
  inventors: string
  applicant?: string
  finalTitle: string
  bizField: string
  techField: string
  relatedProducts: string[]
  country: string
  patentStatus: string
  coApplicant: string
  coApplicantName: string
  applicationDate: string
  registrationDate: string
  publicationDate?: string
  announcementDate?: string
  applicationNumber: string
  registrationNumber: string
  publicationNumber?: string
  announcementNumber?: string
  ipc: string[]
  cpc?: string[]
  examinationClaimCount?: string
  citationCount?: string
  expiryDate: string
  keywords?: string[]
  summary: string
  coreContent: string
  appStatus: AppStatus
  isResubmit?: boolean
  submittedAt: string
  submittedBy: string
  reviewedAt?: string
  rejectionReason?: string
}

const applications = ref<PatentApplication[]>([])

const STATUS_MAP: Record<string, AppStatus> = {
  PENDING_APPROVAL: 'pending',
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  WITHDRAWN: 'withdrawn',
}

function toPatentApplication(item: PatentApplicationItem): PatentApplication {
  return {
    id: item.id,
    title: item.title,
    managementNumber: '',
    inventors: item.inventor ?? '',
    applicant: item.applicant,
    finalTitle: item.title,
    bizField: item.businessField ?? '',
    techField: item.techField ?? '',
    relatedProducts: item.relatedProducts ?? [],
    country: item.filingCountry ?? 'KR',
    patentStatus: item.latestLegalStatus ?? '',
    coApplicant: '아니오',
    coApplicantName: '',
    applicationDate: item.applicationDate ?? '',
    registrationDate: '',
    publicationDate: undefined,
    announcementDate: undefined,
    applicationNumber: item.applicationNumber,
    registrationNumber: item.registrationNumber ?? '',
    ipc: item.ipcCodes ?? [],
    cpc: item.cpcCodes ?? [],
    examinationClaimCount: item.examinationClaimCount?.toString(),
    citationCount: item.citationCount?.toString(),
    expiryDate: item.expiryDate ?? '',
    keywords: item.keywords ?? [],
    summary: item.summary ?? '',
    coreContent: '',
    appStatus: STATUS_MAP[item.approvalStatus] ?? 'pending',
    submittedAt: item.submittedAt ?? item.createdAt ?? '',
    submittedBy: item.submittedBy ?? item.currentDepartmentName ?? '',
    rejectionReason: item.rejectionReason ?? undefined,
  }
}

export function usePatentApplications() {
  async function fetchApplications(params?: ApplicationListParams) {
    try {
      const res = await patentsApi.getApplications(params)
      applications.value = res.items.map(toPatentApplication)
    } catch (err) {
      console.error('신청 목록 조회 오류:', err)
    }
  }

  async function approve(id: number) {
    await patentsApi.approveApplication(id)
    const app = applications.value.find(a => a.id === id)
    if (app) {
      app.appStatus = 'approved'
      app.reviewedAt = new Date().toISOString().slice(0, 10)
    }
  }

  async function reject(id: number, reason: string) {
    await patentsApi.rejectApplication(id, reason)
    const app = applications.value.find(a => a.id === id)
    if (app) {
      app.appStatus = 'rejected'
      app.rejectionReason = reason
      app.reviewedAt = new Date().toISOString().slice(0, 10)
    }
  }

  return { applications, approve, reject, fetchApplications }
}
