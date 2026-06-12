import { ref } from 'vue'

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

const applications = ref<PatentApplication[]>([
  {
    id: 1,
    title: '머신러닝 기반 공정 이상 감지 시스템',
    managementNumber: 'MG-2026-001',
    inventors: '김민준, 이서연',
    finalTitle: '머신러닝 기반 반도체 공정 이상 감지 및 알림 시스템',
    bizField: '반도체',
    techField: 'AI/ML',
    relatedProducts: ['공정 모니터링 장비'],
    country: 'KR',
    patentStatus: '출원',
    coApplicant: '아니오',
    coApplicantName: '',
    applicationDate: '2026-05-20',
    registrationDate: '',
    applicationNumber: '10-2026-0051234',
    registrationNumber: '',
    ipc: ['G06N 3/08'],
    expiryDate: '2046-05-20',
    summary: '반도체 제조 공정에서 발생하는 이상 패턴을 머신러닝 모델로 실시간 감지하고 담당자에게 즉시 알림을 전송하는 시스템입니다.',
    coreContent: 'LSTM 기반 시계열 이상 감지 모델, 엣지 디바이스 경량화 추론 엔진 포함',
    appStatus: 'pending',
    submittedAt: '2026-06-05',
    submittedBy: '반도체사업부',
  },
  {
    id: 2,
    title: '배터리 열 폭주 예측 알고리즘',
    managementNumber: 'MG-2026-002',
    inventors: '박지훈',
    finalTitle: '배터리 셀 열 폭주 조기 예측 및 차단 알고리즘',
    bizField: '에너지',
    techField: '배터리/AI',
    relatedProducts: ['EV 배터리 모듈'],
    country: 'KR',
    patentStatus: '등록',
    coApplicant: '아니오',
    coApplicantName: '',
    applicationDate: '2026-04-10',
    registrationDate: '2026-06-01',
    applicationNumber: '10-2026-0041100',
    registrationNumber: '10-2893110',
    ipc: ['H01M 10/48'],
    expiryDate: '2046-04-10',
    summary: '배터리 셀의 온도·전압·전류 데이터를 실시간 분석하여 열 폭주 발생 10분 전에 예측하고 자동 차단하는 알고리즘입니다.',
    coreContent: '다변량 시계열 예측 모델, CAN 버스 인터페이스 통합',
    appStatus: 'approved',
    submittedAt: '2026-05-15',
    submittedBy: '에너지사업부',
    reviewedAt: '2026-05-22',
  },
  {
    id: 3,
    title: '스마트팩토리 로봇 협업 제어 방법',
    managementNumber: 'MG-2026-003',
    inventors: '최은지, 강동원',
    finalTitle: '스마트팩토리 환경에서 복수 로봇의 충돌 회피 협업 제어 방법',
    bizField: '제조',
    techField: '로보틱스',
    relatedProducts: ['산업용 협동로봇'],
    country: 'KR',
    patentStatus: '출원',
    coApplicant: '아니오',
    coApplicantName: '',
    applicationDate: '2026-03-28',
    registrationDate: '',
    applicationNumber: '10-2026-0031800',
    registrationNumber: '',
    ipc: ['B25J 9/16'],
    expiryDate: '2046-03-28',
    summary: '복수의 산업용 협동로봇이 동일 작업 공간에서 충돌 없이 협업하는 분산 제어 알고리즘입니다.',
    coreContent: 'RRT* 경로 계획 + 실시간 SLAM 기반 충돌 회피',
    appStatus: 'rejected',
    submittedAt: '2026-04-20',
    submittedBy: '제조사업부',
    reviewedAt: '2026-05-03',
    rejectionReason: '청구항 1항의 기술적 특징이 기존 등록 특허(10-2756432)와 실질적으로 동일합니다. 차별화 요소를 명확히 기재하여 재신청해 주세요.',
  },
])

let nextId = 10

export function usePatentApplications() {
  function submit(
    form: Omit<PatentApplication, 'id' | 'appStatus' | 'submittedAt' | 'submittedBy' | 'reviewedAt' | 'rejectionReason'>,
    deptName: string,
  ): PatentApplication {
    const app: PatentApplication = {
      ...form,
      id: nextId++,
      appStatus: 'pending',
      submittedAt: new Date().toISOString().slice(0, 10),
      submittedBy: deptName,
    }
    applications.value.push(app)
    return app
  }

  function resubmit(id: number, form: Partial<PatentApplication>) {
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

  function approve(id: number) {
    const app = applications.value.find(a => a.id === id)
    if (!app) return
    app.appStatus = 'approved'
    app.reviewedAt = new Date().toISOString().slice(0, 10)
  }

  function reject(id: number, reason: string) {
    const app = applications.value.find(a => a.id === id)
    if (!app) return
    app.appStatus = 'rejected'
    app.rejectionReason = reason
    app.reviewedAt = new Date().toISOString().slice(0, 10)
  }

  function withdraw(id: number) {
    const app = applications.value.find(a => a.id === id)
    if (!app) return
    app.appStatus = 'withdrawn'
  }

  function remove(id: number) {
    const idx = applications.value.findIndex(a => a.id === id)
    if (idx !== -1) applications.value.splice(idx, 1)
  }

  return { applications, submit, resubmit, approve, reject, withdraw, remove }
}
