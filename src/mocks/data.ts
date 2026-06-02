// 전체 페이지 공유 더미 데이터 (2026-06-02 기준)

export type PatentStatus = 'REGISTERED' | 'EXPIRING_SOON' | 'EXPIRED'
export type Grade = 'S' | 'A' | 'B' | 'C'
export type ReevalStatus = 'unassigned' | 'requested' | 'overdue' | 'done'
export type Decision = 'KEEP' | 'DISPOSE'

export interface MockPatent {
  id: number
  title: string
  applicationNumber: string
  applicationDate: string
  expiryDate: string
  techField: string
  dept: string
  status: PatentStatus
  grade: Grade | null
  aiOpinion: '유지 권고' | '재검토 필요' | '포기 권고' | null
  tags: string[]
}

export interface MockReeval {
  patentId: number
  deptId: number
  reviewStatus: ReevalStatus
  decision: Decision | null
  decidedAt: string | null
  dueDate: string
  isOverdue: boolean
}

// ── 부서 매핑 ────────────────────────────────────────
export const DEPT_MAP: Record<number, string> = {
  2: '반도체사업부',
  3: '통신사업부',
  4: '에너지사업부',
  5: '제조사업부',
}

export const DEPT_ID_MAP: Record<string, number> = {
  '반도체사업부': 2,
  '통신사업부':   3,
  '에너지사업부': 4,
  '제조사업부':   5,
}

// ── 특허 22건 ────────────────────────────────────────
export const MOCK_PATENTS: MockPatent[] = [
  // 반도체사업부 (8건)
  { id: 1,  title: 'NLP 기반 특허 분류·태깅 자동화 시스템',      applicationNumber: 'KR-2021-0087234', applicationDate: '2021-03-15', expiryDate: '2041-03-15', techField: 'AI/ML', dept: '반도체사업부', status: 'REGISTERED',    grade: 'A', aiOpinion: '유지 권고',    tags: ['NLP', '텍스트분류', '자동화'] },
  { id: 2,  title: '반도체 웨이퍼 결함 검출 AI 알고리즘',         applicationNumber: 'KR-2022-0031789', applicationDate: '2022-06-20', expiryDate: '2042-06-20', techField: 'AI/ML', dept: '반도체사업부', status: 'REGISTERED',    grade: 'S', aiOpinion: '유지 권고',    tags: ['딥러닝', '결함감지', '웨이퍼'] },
  { id: 3,  title: '플라즈마 식각 공정 딥러닝 제어 시스템',        applicationNumber: 'US-2021-0189456', applicationDate: '2021-09-10', expiryDate: '2041-09-10', techField: '반도체', dept: '반도체사업부', status: 'REGISTERED',    grade: 'A', aiOpinion: '유지 권고',    tags: ['플라즈마', '반도체공정', '식각'] },
  { id: 4,  title: '반도체 패키징 열관리 구조체',                  applicationNumber: 'CN-2023-0078901', applicationDate: '2023-08-18', expiryDate: '2043-08-18', techField: '반도체', dept: '반도체사업부', status: 'REGISTERED',    grade: 'B', aiOpinion: '재검토 필요', tags: ['열관리', '패키징', '반도체'] },
  { id: 5,  title: '첨단 OLED 디스플레이 픽셀 제어 기술',          applicationNumber: 'JP-2023-0034567', applicationDate: '2023-12-01', expiryDate: '2043-12-01', techField: '반도체', dept: '반도체사업부', status: 'REGISTERED',    grade: 'A', aiOpinion: '유지 권고',    tags: ['OLED', '디스플레이', '픽셀제어'] },
  { id: 6,  title: '반도체 식각 공정 플라즈마 제어 장치',           applicationNumber: 'CN-2022-0045678', applicationDate: '2022-03-25', expiryDate: '2027-03-25', techField: '반도체', dept: '반도체사업부', status: 'EXPIRING_SOON', grade: 'B', aiOpinion: '재검토 필요', tags: ['플라즈마제어', '반도체', '공정최적화'] },
  { id: 7,  title: '자율주행 객체 인식 딥러닝 경량화 모델',         applicationNumber: 'KR-2021-0189023', applicationDate: '2021-11-08', expiryDate: '2041-11-08', techField: 'AI/ML', dept: '반도체사업부', status: 'REGISTERED',    grade: 'B', aiOpinion: '재검토 필요', tags: ['자율주행', '딥러닝', '경량화'] },
  { id: 8,  title: '반도체 CMP 공정 균일도 향상 방법',             applicationNumber: 'KR-2021-0056789', applicationDate: '2021-04-25', expiryDate: '2024-10-15', techField: '반도체', dept: '반도체사업부', status: 'EXPIRED',       grade: 'C', aiOpinion: '포기 권고',    tags: ['CMP', '균일도', '반도체공정'] },

  // 통신사업부 (5건)
  { id: 9,  title: '5G 통신 빔포밍 최적화 알고리즘',               applicationNumber: 'KR-2023-0045612', applicationDate: '2023-02-28', expiryDate: '2043-02-28', techField: '통신',  dept: '통신사업부',   status: 'REGISTERED',    grade: 'A', aiOpinion: '유지 권고',    tags: ['5G', '빔포밍', '통신'] },
  { id: 10, title: '통신 네트워크 이상 감지 ML 시스템',              applicationNumber: 'KR-2022-0154320', applicationDate: '2022-04-05', expiryDate: '2042-04-05', techField: 'AI/ML', dept: '통신사업부',   status: 'REGISTERED',    grade: 'S', aiOpinion: '유지 권고',    tags: ['머신러닝', '네트워크', '이상감지'] },
  { id: 11, title: '6G 통신 밀리미터파 빔포밍 안테나 설계',          applicationNumber: 'US-2023-0078123', applicationDate: '2023-05-15', expiryDate: '2043-05-15', techField: '통신',  dept: '통신사업부',   status: 'REGISTERED',    grade: 'A', aiOpinion: '유지 권고',    tags: ['6G', '밀리미터파', '안테나'] },
  { id: 12, title: '초고속 데이터 전송 프로토콜 최적화',             applicationNumber: 'KR-2019-0087654', applicationDate: '2019-11-15', expiryDate: '2026-11-15', techField: '통신',  dept: '통신사업부',   status: 'EXPIRING_SOON', grade: 'C', aiOpinion: '포기 권고',    tags: ['데이터전송', '프로토콜', '최적화'] },
  { id: 13, title: '무선 충전 효율 향상 코일 구조 설계',             applicationNumber: 'KR-2019-0034521', applicationDate: '2019-06-30', expiryDate: '2025-06-30', techField: '통신',  dept: '통신사업부',   status: 'EXPIRED',       grade: null, aiOpinion: null,         tags: ['무선충전', '코일', '에너지전달'] },

  // 에너지사업부 (5건)
  { id: 14, title: '수소연료전지 효율 향상 촉매 구조',               applicationNumber: 'KR-2020-0067890', applicationDate: '2020-07-15', expiryDate: '2040-07-15', techField: '에너지', dept: '에너지사업부', status: 'REGISTERED',    grade: 'B', aiOpinion: '재검토 필요', tags: ['수소연료전지', '촉매', '효율'] },
  { id: 15, title: '고체전지 전극 계면 최적화 기술',                  applicationNumber: 'EP-2022-0123456', applicationDate: '2022-11-30', expiryDate: '2042-11-30', techField: '에너지', dept: '에너지사업부', status: 'REGISTERED',    grade: 'A', aiOpinion: '유지 권고',    tags: ['고체전지', '전극', '계면최적화'] },
  { id: 16, title: '수소연료전지 촉매 내구성 향상 기술',              applicationNumber: 'EP-2021-0098765', applicationDate: '2021-07-20', expiryDate: '2041-07-20', techField: '에너지', dept: '에너지사업부', status: 'REGISTERED',    grade: 'A', aiOpinion: '유지 권고',    tags: ['수소', '촉매', '내구성'] },
  { id: 17, title: '태양광 패널 에너지 변환 효율 향상',               applicationNumber: 'KR-2020-0112233', applicationDate: '2020-09-30', expiryDate: '2026-09-30', techField: '에너지', dept: '에너지사업부', status: 'EXPIRING_SOON', grade: 'B', aiOpinion: '재검토 필요', tags: ['태양광', '에너지변환', '효율'] },
  { id: 18, title: '배전망 스마트 그리드 부하 분산 알고리즘',          applicationNumber: 'KR-2020-0023456', applicationDate: '2020-08-20', expiryDate: '2026-08-20', techField: '에너지', dept: '에너지사업부', status: 'EXPIRING_SOON', grade: 'C', aiOpinion: '포기 권고',    tags: ['스마트그리드', '부하분산', '배전'] },

  // 제조사업부 (4건)
  { id: 19, title: '스마트 제조 공정 자동화 시스템',                  applicationNumber: 'KR-2021-0098123', applicationDate: '2021-05-22', expiryDate: '2041-05-22', techField: '제조',  dept: '제조사업부',   status: 'REGISTERED',    grade: 'B', aiOpinion: '재검토 필요', tags: ['스마트제조', '자동화', '공정'] },
  { id: 20, title: 'AI 기반 예측 유지보수 플랫폼',                    applicationNumber: 'US-2021-0234890', applicationDate: '2021-08-14', expiryDate: '2041-08-14', techField: 'AI/ML', dept: '제조사업부',   status: 'REGISTERED',    grade: 'A', aiOpinion: '유지 권고',    tags: ['예측유지보수', 'AI', '플랫폼'] },
  { id: 21, title: '머신러닝 기반 제조 품질 예측 시스템',              applicationNumber: 'KR-2022-0067450', applicationDate: '2022-01-10', expiryDate: '2042-01-10', techField: 'AI/ML', dept: '제조사업부',   status: 'REGISTERED',    grade: 'S', aiOpinion: '유지 권고',    tags: ['머신러닝', '품질예측', '제조'] },
  { id: 22, title: '산업용 로봇 공정 최적화 알고리즘',                 applicationNumber: 'EP-2020-0067890', applicationDate: '2020-12-31', expiryDate: '2024-12-31', techField: '제조',  dept: '제조사업부',   status: 'EXPIRED',       grade: null, aiOpinion: null,         tags: ['산업로봇', '공정최적화', '자동화'] },
]

// ── 재평가 18건 (2026Q2) ─────────────────────────────
// patentId: 1~7(반도체6) + 9~12(통신4) + 14~18(에너지5) + 19~21(제조3) = 18건
export const MOCK_REEVAL: MockReeval[] = [
  // 회신 완료 6건
  { patentId: 1,  deptId: 2, reviewStatus: 'done',       decision: 'KEEP',    decidedAt: '2026-05-28', dueDate: '2026-05-31', isOverdue: false },
  { patentId: 3,  deptId: 2, reviewStatus: 'done',       decision: 'KEEP',    decidedAt: '2026-05-24', dueDate: '2026-05-31', isOverdue: false },
  { patentId: 6,  deptId: 2, reviewStatus: 'done',       decision: 'KEEP',    decidedAt: '2026-05-22', dueDate: '2026-05-31', isOverdue: false },
  { patentId: 14, deptId: 4, reviewStatus: 'done',       decision: 'KEEP',    decidedAt: '2026-05-22', dueDate: '2026-05-31', isOverdue: false },
  { patentId: 15, deptId: 4, reviewStatus: 'done',       decision: 'KEEP',    decidedAt: '2026-05-19', dueDate: '2026-05-31', isOverdue: false },
  { patentId: 19, deptId: 5, reviewStatus: 'done',       decision: 'KEEP',    decidedAt: '2026-05-25', dueDate: '2026-05-31', isOverdue: false },
  // 요청 완료 5건
  { patentId: 2,  deptId: 2, reviewStatus: 'requested',  decision: null,      decidedAt: null,          dueDate: '2026-06-15', isOverdue: false },
  { patentId: 10, deptId: 3, reviewStatus: 'requested',  decision: null,      decidedAt: null,          dueDate: '2026-06-15', isOverdue: false },
  { patentId: 11, deptId: 3, reviewStatus: 'requested',  decision: null,      decidedAt: null,          dueDate: '2026-06-15', isOverdue: false },
  { patentId: 16, deptId: 4, reviewStatus: 'requested',  decision: null,      decidedAt: null,          dueDate: '2026-06-15', isOverdue: false },
  { patentId: 20, deptId: 5, reviewStatus: 'requested',  decision: null,      decidedAt: null,          dueDate: '2026-06-15', isOverdue: false },
  // 지연 4건 (기한 2026-05-31 초과)
  { patentId: 4,  deptId: 2, reviewStatus: 'overdue',    decision: null,      decidedAt: null,          dueDate: '2026-05-31', isOverdue: true },
  { patentId: 9,  deptId: 3, reviewStatus: 'overdue',    decision: null,      decidedAt: null,          dueDate: '2026-05-31', isOverdue: true },
  { patentId: 12, deptId: 3, reviewStatus: 'overdue',    decision: null,      decidedAt: null,          dueDate: '2026-05-31', isOverdue: true },
  { patentId: 17, deptId: 4, reviewStatus: 'overdue',    decision: null,      decidedAt: null,          dueDate: '2026-05-31', isOverdue: true },
  // 요청 전 3건
  { patentId: 7,  deptId: 2, reviewStatus: 'unassigned', decision: null,      decidedAt: null,          dueDate: '',           isOverdue: false },
  { patentId: 18, deptId: 4, reviewStatus: 'unassigned', decision: null,      decidedAt: null,          dueDate: '',           isOverdue: false },
  { patentId: 21, deptId: 5, reviewStatus: 'unassigned', decision: null,      decidedAt: null,          dueDate: '',           isOverdue: false },
]

// ── 재평가 현황 counts ───────────────────────────────
export const REEVAL_STATUS_COUNTS = { all: 18, unassigned: 3, requested: 5, overdue: 4, done: 6 }

// ── 반도체사업부 (이담당) 제출 이력 ──────────────────
export const RECENT_SUBMISSIONS = [
  { id: 1, patentTitle: 'NLP 기반 특허 분류·태깅 자동화 시스템', decision: 'KEEP',    decidedAt: '2026-05-28' },
  { id: 2, patentTitle: '플라즈마 식각 공정 딥러닝 제어 시스템',  decision: 'KEEP',    decidedAt: '2026-05-24' },
  { id: 3, patentTitle: '반도체 식각 공정 플라즈마 제어 장치',    decision: 'KEEP',    decidedAt: '2026-05-22' },
]

// ── 최근 사업부 회신 (Legal 홈) ──────────────────────
export const RECENT_REPLIES = [
  { id: 1,  patent: 'NLP 기반 특허 분류·태깅 자동화 시스템', dept: '반도체사업부', decision: 'KEEP',    date: '2026-05-28' },
  { id: 19, patent: '스마트 제조 공정 자동화 시스템',          dept: '제조사업부',   decision: 'KEEP',    date: '2026-05-25' },
  { id: 14, patent: '수소연료전지 효율 향상 촉매 구조',         dept: '에너지사업부', decision: 'KEEP',    date: '2026-05-22' },
]

// ── 만료 예정 특허 목록 (ExpiringView) ───────────────
export const EXPIRING_ITEMS = [
  { id: 12, title: '초고속 데이터 전송 프로토콜 최적화',   applicationNumber: 'KR-2019-0087654', techField: '통신',  dept: '통신사업부',   expiryDate: '2026-11-15', dday: 166, urgency: 'warn'     as const },
  { id: 17, title: '태양광 패널 에너지 변환 효율 향상',    applicationNumber: 'KR-2020-0112233', techField: '에너지', dept: '에너지사업부', expiryDate: '2026-09-30', dday: 120, urgency: 'warn'     as const },
  { id: 18, title: '배전망 스마트 그리드 부하 분산 알고리즘', applicationNumber: 'KR-2020-0023456', techField: '에너지', dept: '에너지사업부', expiryDate: '2026-08-20', dday: 79,  urgency: 'critical' as const },
  { id: 6,  title: '반도체 식각 공정 플라즈마 제어 장치',  applicationNumber: 'CN-2022-0045678', techField: '반도체', dept: '반도체사업부', expiryDate: '2027-03-25', dday: 296, urgency: 'normal'   as const },
  { id: 1,  title: 'NLP 기반 특허 분류·태깅 자동화 시스템', applicationNumber: 'KR-2021-0087234', techField: 'AI/ML', dept: '반도체사업부', expiryDate: '2041-03-15', dday: 5400, urgency: 'normal'  as const },
]

// ── 연도별 출원·등록·만료 추이 ────────────────────────
export const TREND_DATA = [
  { year: '2021', filed: 11, registered: 8,  expired: 3 },
  { year: '2022', filed: 13, registered: 10, expired: 3 },
  { year: '2023', filed: 15, registered: 12, expired: 4 },
  { year: '2024', filed: 18, registered: 15, expired: 4 },
  { year: '2025', filed: 20, registered: 17, expired: 5 },
  { year: '2026', filed: 16, registered: 14, expired: 6 },
]

// ── 연차료 추이 ──────────────────────────────────────
export const ANNUITY_DATA = [
  { year: 2021, amount: 38000000 },
  { year: 2022, amount: 42000000 },
  { year: 2023, amount: 47000000 },
  { year: 2024, amount: 52000000 },
  { year: 2025, amount: 48000000 },
  { year: 2026, amount: 45000000 },
]
