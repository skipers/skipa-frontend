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

let nextId = 10

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

  async function submit(
    form: Omit<PatentApplication, 'id' | 'appStatus' | 'submittedAt' | 'submittedBy' | 'reviewedAt' | 'rejectionReason'>,
    deptName: string,
  ): Promise<PatentApplication> {
    const created = await patentsApi.createPatent({
      title: form.finalTitle || form.title,
      applicationNumber: form.applicationNumber,
      registrationNumber: form.registrationNumber || undefined,
      publicationNumber: form.publicationNumber || undefined,
      announcementNumber: form.announcementNumber || undefined,
      managementNumber: form.managementNumber || undefined,
      applicant: form.applicant || undefined,
      inventor: form.inventors || undefined,
      applicationDate: form.applicationDate || undefined,
      registrationDate: form.registrationDate || undefined,
      publicationDate: form.publicationDate || undefined,
      announcementDate: form.announcementDate || undefined,
      ipcCodes: form.ipc?.length ? form.ipc : undefined,
      cpcCodes: form.cpc?.length ? form.cpc : undefined,
      expiryDate: form.expiryDate || undefined,
      examinationClaimCount: form.examinationClaimCount ? Number(form.examinationClaimCount) : undefined,
      citationCount: form.citationCount ? Number(form.citationCount) : undefined,
      businessField: form.bizField || undefined,
      techField: form.techField || undefined,
      relatedProducts: Array.isArray(form.relatedProducts) && form.relatedProducts.length ? form.relatedProducts : undefined,
      keywords: form.keywords?.length ? form.keywords : undefined,
      summary: form.summary || undefined,
      filingCountry: form.country || undefined,
      isJointApplication: form.coApplicant === '예',
      jointApplicant: form.coApplicant === '예' ? form.coApplicantName || undefined : undefined,
    })
    const app: PatentApplication = {
      ...form,
      id: created.id,
      appStatus: 'pending',
      submittedAt: new Date().toISOString().slice(0, 10),
      submittedBy: deptName,
    }
    applications.value.push(app)
    return app
  }

  async function resubmit(id: number, form: Partial<PatentApplication>) {
    await patentsApi.updatePatent(id, {
      title: form.finalTitle || form.title || undefined,
      applicationNumber: form.applicationNumber || undefined,
      registrationNumber: form.registrationNumber || undefined,
      publicationNumber: form.publicationNumber || undefined,
      announcementNumber: form.announcementNumber || undefined,
      managementNumber: form.managementNumber || undefined,
      applicant: form.applicant || undefined,
      inventor: form.inventors || undefined,
      applicationDate: form.applicationDate || undefined,
      registrationDate: form.registrationDate || undefined,
      publicationDate: form.publicationDate || undefined,
      announcementDate: form.announcementDate || undefined,
      ipcCodes: form.ipc?.length ? form.ipc : undefined,
      cpcCodes: form.cpc?.length ? form.cpc : undefined,
      expiryDate: form.expiryDate || undefined,
      businessField: form.bizField || undefined,
      techField: form.techField || undefined,
      relatedProducts: Array.isArray(form.relatedProducts) && form.relatedProducts.length ? form.relatedProducts : undefined,
      keywords: form.keywords?.length ? form.keywords : undefined,
      summary: form.summary || undefined,
      filingCountry: form.country || undefined,
      isJointApplication: form.coApplicant === '예',
      jointApplicant: form.coApplicant === '예' ? form.coApplicantName || undefined : undefined,
    })
    const app = applications.value.find(a => a.id === id)
    if (!app) return
    Object.assign(app, form, {
      appStatus: 'pending',
      isResubmit: true,
      rejectionReason: undefined,
      reviewedAt: undefined,
      submittedAt: new Date().toISOString().slice(0, 10),
    })
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

  async function withdraw(id: number) {
    await patentsApi.withdrawApplication(id)
    const app = applications.value.find(a => a.id === id)
    if (app) {
      app.appStatus = 'withdrawn'
    }
  }

  function remove(id: number) {
    const idx = applications.value.findIndex(a => a.id === id)
    if (idx !== -1) applications.value.splice(idx, 1)
  }

  return { applications, submit, resubmit, approve, reject, withdraw, remove, fetchApplications }
}
