// 전체 페이지 공유 더미 데이터 (2026-06-02 기준)

export type PatentStatus = 'REGISTERED' | 'EXPIRED' | 'ABANDONED'
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
  isCurrent?: boolean  // false면 과거 이력 전용 (검토 현황에 노출 안 됨)
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
  { id: 6,  title: '반도체 식각 공정 플라즈마 제어 장치',           applicationNumber: 'CN-2022-0045678', applicationDate: '2022-03-25', expiryDate: '2027-03-25', techField: '반도체', dept: '반도체사업부', status: 'REGISTERED', grade: 'B', aiOpinion: '재검토 필요', tags: ['플라즈마제어', '반도체', '공정최적화'] },
  { id: 7,  title: '자율주행 객체 인식 딥러닝 경량화 모델',         applicationNumber: 'KR-2021-0189023', applicationDate: '2021-11-08', expiryDate: '2041-11-08', techField: 'AI/ML', dept: '반도체사업부', status: 'REGISTERED',    grade: 'B', aiOpinion: '재검토 필요', tags: ['자율주행', '딥러닝', '경량화'] },
  { id: 8,  title: '반도체 CMP 공정 균일도 향상 방법',             applicationNumber: 'KR-2021-0056789', applicationDate: '2021-04-25', expiryDate: '2024-10-15', techField: '반도체', dept: '반도체사업부', status: 'EXPIRED',       grade: 'C', aiOpinion: '포기 권고',    tags: ['CMP', '균일도', '반도체공정'] },
  { id: 23, title: '반도체 웨이퍼 결함 검출 AI 알고리즘',         applicationNumber: 'KR-2022-0031789', applicationDate: '2022-06-20', expiryDate: '2026-03-15', techField: 'AI/ML', dept: '반도체사업부', status: 'ABANDONED',     grade: 'B', aiOpinion: '포기 권고',    tags: ['딥러닝', '결함감지', '웨이퍼'] },

  // 통신사업부 (5건)
  { id: 9,  title: '5G 통신 빔포밍 최적화 알고리즘',               applicationNumber: 'KR-2023-0045612', applicationDate: '2023-02-28', expiryDate: '2043-02-28', techField: '통신',  dept: '통신사업부',   status: 'REGISTERED',    grade: 'A', aiOpinion: '유지 권고',    tags: ['5G', '빔포밍', '통신'] },
  { id: 10, title: '통신 네트워크 이상 감지 ML 시스템',              applicationNumber: 'KR-2022-0154320', applicationDate: '2022-04-05', expiryDate: '2042-04-05', techField: 'AI/ML', dept: '통신사업부',   status: 'REGISTERED',    grade: 'S', aiOpinion: '유지 권고',    tags: ['머신러닝', '네트워크', '이상감지'] },
  { id: 11, title: '6G 통신 밀리미터파 빔포밍 안테나 설계',          applicationNumber: 'US-2023-0078123', applicationDate: '2023-05-15', expiryDate: '2043-05-15', techField: '통신',  dept: '통신사업부',   status: 'REGISTERED',    grade: 'A', aiOpinion: '유지 권고',    tags: ['6G', '밀리미터파', '안테나'] },
  { id: 12, title: '초고속 데이터 전송 프로토콜 최적화',             applicationNumber: 'KR-2019-0087654', applicationDate: '2019-11-15', expiryDate: '2026-11-15', techField: '통신',  dept: '통신사업부',   status: 'REGISTERED', grade: 'C', aiOpinion: '포기 권고',    tags: ['데이터전송', '프로토콜', '최적화'] },
  { id: 13, title: '무선 충전 효율 향상 코일 구조 설계',             applicationNumber: 'KR-2019-0034521', applicationDate: '2019-06-30', expiryDate: '2025-06-30', techField: '통신',  dept: '통신사업부',   status: 'EXPIRED',       grade: null, aiOpinion: null,         tags: ['무선충전', '코일', '에너지전달'] },

  // 에너지사업부 (5건)
  { id: 14, title: '수소연료전지 효율 향상 촉매 구조',               applicationNumber: 'KR-2020-0067890', applicationDate: '2020-07-15', expiryDate: '2040-07-15', techField: '에너지', dept: '에너지사업부', status: 'REGISTERED',    grade: 'B', aiOpinion: '재검토 필요', tags: ['수소연료전지', '촉매', '효율'] },
  { id: 15, title: '고체전지 전극 계면 최적화 기술',                  applicationNumber: 'EP-2022-0123456', applicationDate: '2022-11-30', expiryDate: '2042-11-30', techField: '에너지', dept: '에너지사업부', status: 'REGISTERED',    grade: 'A', aiOpinion: '유지 권고',    tags: ['고체전지', '전극', '계면최적화'] },
  { id: 16, title: '수소연료전지 촉매 내구성 향상 기술',              applicationNumber: 'EP-2021-0098765', applicationDate: '2021-07-20', expiryDate: '2041-07-20', techField: '에너지', dept: '에너지사업부', status: 'REGISTERED',    grade: 'A', aiOpinion: '유지 권고',    tags: ['수소', '촉매', '내구성'] },
  { id: 17, title: '태양광 패널 에너지 변환 효율 향상',               applicationNumber: 'KR-2020-0112233', applicationDate: '2020-09-30', expiryDate: '2026-09-30', techField: '에너지', dept: '에너지사업부', status: 'REGISTERED', grade: 'B', aiOpinion: '재검토 필요', tags: ['태양광', '에너지변환', '효율'] },
  { id: 18, title: '배전망 스마트 그리드 부하 분산 알고리즘',          applicationNumber: 'KR-2020-0023456', applicationDate: '2020-08-20', expiryDate: '2026-08-20', techField: '에너지', dept: '에너지사업부', status: 'REGISTERED', grade: 'C', aiOpinion: '포기 권고',    tags: ['스마트그리드', '부하분산', '배전'] },

  // 제조사업부 (4건)
  { id: 19, title: '스마트 제조 공정 자동화 시스템',                  applicationNumber: 'KR-2021-0098123', applicationDate: '2021-05-22', expiryDate: '2041-05-22', techField: '제조',  dept: '제조사업부',   status: 'REGISTERED',    grade: 'B', aiOpinion: '재검토 필요', tags: ['스마트제조', '자동화', '공정'] },
  { id: 20, title: 'AI 기반 예측 유지보수 플랫폼',                    applicationNumber: 'US-2021-0234890', applicationDate: '2021-08-14', expiryDate: '2041-08-14', techField: 'AI/ML', dept: '제조사업부',   status: 'REGISTERED',    grade: 'A', aiOpinion: '유지 권고',    tags: ['예측유지보수', 'AI', '플랫폼'] },
  { id: 21, title: '머신러닝 기반 제조 품질 예측 시스템',              applicationNumber: 'KR-2022-0067450', applicationDate: '2022-01-10', expiryDate: '2042-01-10', techField: 'AI/ML', dept: '제조사업부',   status: 'REGISTERED',    grade: 'S', aiOpinion: '유지 권고',    tags: ['머신러닝', '품질예측', '제조'] },
  { id: 22, title: '산업용 로봇 공정 최적화 알고리즘',                 applicationNumber: 'EP-2020-0067890', applicationDate: '2020-12-31', expiryDate: '2024-12-31', techField: '제조',  dept: '제조사업부',   status: 'EXPIRED',       grade: null, aiOpinion: null,         tags: ['산업로봇', '공정최적화', '자동화'] },
]

// ── 재평가 18건 (2026Q2) ─────────────────────────────
// patentId: 1~7(반도체6) + 9~12(통신4) + 14~18(에너지5) + 19~21(제조3) = 18건
export const MOCK_REEVAL: MockReeval[] = [
  // 2026 (3차 사이클) 회신 완료 3건
  { patentId: 1,  deptId: 2, reviewStatus: 'done',       decision: 'KEEP',    decidedAt: '2026-05-28', dueDate: '2026-05-31', isOverdue: false },
  { patentId: 3,  deptId: 2, reviewStatus: 'done',       decision: 'KEEP',    decidedAt: '2026-05-24', dueDate: '2026-05-31', isOverdue: false },
  { patentId: 6,  deptId: 2, reviewStatus: 'done',       decision: 'KEEP',    decidedAt: '2026-05-22', dueDate: '2026-05-31', isOverdue: false },
  // 2023 (2차 사이클) 이력 (과거 — 검토 현황 노출 제외)
  { patentId: 5,  deptId: 2, reviewStatus: 'done', decision: 'KEEP',    decidedAt: '2023-05-18', dueDate: '2023-05-31', isOverdue: false, isCurrent: false },
  { patentId: 7,  deptId: 2, reviewStatus: 'done', decision: 'DISPOSE', decidedAt: '2023-05-12', dueDate: '2023-05-31', isOverdue: false, isCurrent: false },
  // 2020 (1차 사이클) 이력 (과거 — 검토 현황 노출 제외)
  { patentId: 4,  deptId: 2, reviewStatus: 'done', decision: 'KEEP',    decidedAt: '2020-05-22', dueDate: '2020-05-31', isOverdue: false, isCurrent: false },
  { patentId: 6,  deptId: 2, reviewStatus: 'done', decision: 'DISPOSE', decidedAt: '2020-05-14', dueDate: '2020-05-31', isOverdue: false, isCurrent: false },
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

// ── 특허 상세 확장 데이터 ────────────────────────────

export const PATENT_INVENTORS: Record<number, string> = {
  1: '김지훈, 박소연', 2: '이민준, 최정호, 한수연', 3: '김철수, 이서연, 박준혁',
  23: '이민준, 최정호, 한수연',
  4: '정수현, 오민지', 5: '한지수, 강민준, 장현우', 6: '이재원, 송은지',
  7: '박성훈, 김나연, 최준서', 8: '윤정민, 이채원', 9: '김도현, 오승환, 박예진',
  10: '이준혁, 강소연, 박민준', 11: '최민석, 박지훈, 이현아', 12: '정예원, 김성민',
  13: '이소라, 박찬호, 강동원', 14: '송지은, 이태양, 박민서', 15: '김예준, 한수정, 이도현',
  16: '조현서, 이민호, 박서연', 17: '최지원, 강태양', 18: '이현준, 박수연, 김민재',
  19: '황정민, 이도현, 최예나', 20: '강지수, 박민준, 이수현', 21: '이서준, 최수연, 김도윤',
  22: '박성현, 이주원',
}

export const TECH_FIELD_IPC: Record<string, string> = {
  'AI/ML': 'G06N 20/00 · G06F 18/214',
  '반도체': 'H01L 21/302 · H01L 21/461',
  '통신': 'H04W 16/28 · H04B 7/04',
  '에너지': 'H01M 10/052 · H02J 7/00',
  '제조': 'B25J 9/16 · G05B 19/418',
}

export const COUNTRY_LABEL: Record<string, string> = {
  KR: '대한민국', US: '미국', EP: '유럽(EU)', CN: '중국', JP: '일본',
}

export const TECH_FIELD_SUMMARY: Record<string, string> = {
  'AI/ML': '본 발명은 인공지능 및 기계학습 알고리즘을 활용한 지능형 자동화 시스템에 관한 것으로, 대규모 데이터를 실시간으로 분석하고 정확한 예측 결과를 도출하는 방법 및 장치를 제공한다. 종래의 규칙 기반 시스템과 달리, 본 발명은 학습 데이터로부터 자동으로 특징을 추출하여 높은 정확도를 달성하며, 다양한 산업 환경에서의 적용 가능성이 검증되었다. 본 발명은 데이터 전처리 모듈, 딥러닝 추론 엔진, 결과 후처리 모듈로 구성되며, 각 모듈은 병렬 처리를 통해 처리 속도를 최적화한다.',
  '반도체': '본 발명은 반도체 소자 제조 공정에서의 핵심 기술에 관한 것으로, 공정 효율성 및 수율을 향상시키는 새로운 방법론을 제시한다. 종래 기술의 한계를 극복하기 위해, 본 발명에서는 혁신적인 공정 제어 알고리즘과 신규 소재의 조합을 활용한다. 본 발명에 의하면, 기존 공정 대비 20% 이상의 수율 향상과 에너지 효율 개선이 기대되며, 나아가 차세대 반도체 소자의 소형화 및 고성능화에 기여할 수 있다.',
  '통신': '본 발명은 차세대 무선 통신 시스템에서의 성능 향상 기술에 관한 것으로, 대역폭 효율성 및 통신 품질을 개선하는 방법 및 시스템을 제공한다. 본 발명은 새로운 신호 처리 알고리즘과 안테나 구조를 결합하여 기존 시스템 대비 현저히 향상된 통신 성능을 제공한다. 특히, 다중 사용자 환경에서의 간섭 제거 및 신호 품질 유지에 탁월한 효과를 나타낸다.',
  '에너지': '본 발명은 에너지 저장 및 변환 시스템의 효율을 향상시키는 기술에 관한 것으로, 차세대 에너지 소자의 성능과 수명을 동시에 개선하는 새로운 접근법을 제공한다. 본 발명에 적용된 신규 소재 및 구조는 기존 기술 대비 에너지 밀도를 30% 이상 향상시키며, 열 안정성과 안전성을 획기적으로 개선하였다.',
  '제조': '본 발명은 스마트 제조 환경에서의 자동화 및 최적화 기술에 관한 것으로, AI 기반의 공정 제어 및 품질 예측 시스템을 제공한다. 기존의 수작업 또는 단순 자동화 시스템의 한계를 극복하여, 실시간 데이터 분석과 예측 알고리즘을 통해 생산성을 극대화한다. 본 발명은 다양한 제조 환경에 유연하게 적용 가능하며, 설치 후 평균 15~25%의 생산성 향상과 불량률 감소를 달성한다.',
}

export const TECH_FIELD_CLAIMS: Record<string, string[]> = {
  'AI/ML': [
    '입력 데이터를 수신하는 단계; 상기 입력 데이터를 전처리하는 단계; 사전 학습된 딥러닝 모델을 이용하여 상기 전처리된 데이터를 분석하고 결과를 출력하는 단계;를 포함하는 인공지능 기반 데이터 분석 방법.',
    '제1항에 있어서, 상기 딥러닝 모델은 트랜스포머(Transformer) 아키텍처를 기반으로 하되, 도메인 특화 파인튜닝을 적용한 것을 특징으로 하는 인공지능 기반 데이터 분석 방법.',
    '제1항에 있어서, 상기 분석 결과를 기반으로 자동 분류 및 태깅을 수행하는 단계를 더 포함하는 것을 특징으로 하는 인공지능 기반 데이터 분석 방법.',
    '제1항의 방법을 실행하기 위한 프로그램이 기록된 컴퓨터 판독 가능한 기록 매체.',
  ],
  '반도체': [
    '기판 상에 제1 절연층을 형성하는 단계; 상기 제1 절연층 상에 활성층을 형성하는 단계; 상기 활성층 상에 패터닝 공정을 수행하는 단계; 상기 패터닝된 활성층에 도펀트를 주입하는 단계;를 포함하는 반도체 소자 제조 방법.',
    '제1항에 있어서, 상기 패터닝 공정은 극자외선(EUV) 리소그래피를 이용하여 수행되는 것을 특징으로 하는 반도체 소자 제조 방법.',
    '제1항에 있어서, 상기 도펀트 주입 후 열처리 공정을 수행하되, 상기 열처리 공정은 급속 열처리(RTP) 방식으로 수행되는 것을 특징으로 하는 반도체 소자 제조 방법.',
    '제1항 내지 제3항 중 어느 한 항의 방법에 의해 제조된 반도체 소자.',
  ],
  '통신': [
    '복수의 안테나 소자를 갖는 배열 안테나에서 빔포밍 신호를 생성하는 방법으로서, 채널 상태 정보(CSI)를 획득하는 단계; 상기 CSI를 기반으로 빔포밍 벡터를 계산하는 단계; 상기 빔포밍 벡터를 각 안테나 소자에 적용하여 빔을 형성하는 단계;를 포함하는 빔포밍 방법.',
    '제1항에 있어서, 상기 빔포밍 벡터 계산은 강화학습(RL) 알고리즘을 이용하여 수행되는 것을 특징으로 하는 빔포밍 방법.',
    '제1항에 있어서, 다중 사용자 간섭을 고려한 빔 협력 전송을 수행하는 단계를 더 포함하는 것을 특징으로 하는 빔포밍 방법.',
    '제1항의 방법을 수행하는 기지국 장치.',
  ],
  '에너지': [
    '전극 소재를 준비하는 단계; 상기 전극 소재에 계면 활성층을 코팅하는 단계; 상기 계면 활성층이 코팅된 전극을 이용하여 에너지 저장 소자를 조립하는 단계;를 포함하는 에너지 저장 소자 제조 방법.',
    '제1항에 있어서, 상기 계면 활성층은 나노미터(nm) 수준의 두께로 형성되며, 산화물 또는 황화물 계열 소재를 포함하는 것을 특징으로 하는 에너지 저장 소자 제조 방법.',
    '제1항에 있어서, 상기 에너지 저장 소자의 사이클 특성을 향상시키기 위한 전해질 첨가제를 더 포함하는 것을 특징으로 하는 에너지 저장 소자 제조 방법.',
    '제1항의 방법으로 제조된 에너지 저장 소자를 포함하는 에너지 저장 시스템.',
  ],
  '제조': [
    '복수의 센서로부터 제조 공정 데이터를 수집하는 단계; 수집된 데이터를 기반으로 공정 이상을 탐지하는 단계; 탐지된 이상에 대응하여 공정 파라미터를 자동으로 조정하는 단계;를 포함하는 스마트 제조 공정 제어 방법.',
    '제1항에 있어서, 상기 이상 탐지는 머신러닝 기반의 이상탐지(Anomaly Detection) 알고리즘을 이용하는 것을 특징으로 하는 스마트 제조 공정 제어 방법.',
    '제1항에 있어서, 상기 공정 파라미터 조정은 실시간 디지털 트윈(Digital Twin) 시뮬레이션 결과를 참조하여 수행되는 것을 특징으로 하는 스마트 제조 공정 제어 방법.',
    '제1항의 방법을 실행하기 위한 스마트 제조 제어 시스템으로서, 데이터 수집 모듈, 이상 탐지 모듈, 공정 제어 모듈을 포함하는 스마트 제조 제어 시스템.',
  ],
}

export interface AiReportComments { tech: string; rights: string; biz: string; bizSubmit: string }

export const AI_REPORT_COMMENTS: Record<string, AiReportComments> = {
  S: {
    tech: '해당 특허는 관련 기술 분야에서 최고 수준의 혁신성을 보유하고 있습니다. 핵심 알고리즘의 독창성이 매우 높으며, 기존 기술 대비 30% 이상의 성능 향상을 실현하였습니다. 학계 및 산업계에서의 인용 가능성이 높아 기술적 파급 효과가 클 것으로 예상됩니다.',
    rights: '독립항의 권리 범위가 광범위하게 설정되어 있으며, 종속항을 통해 다양한 구현 방식을 효과적으로 커버하고 있습니다. 선행 특허 분석 결과 침해 위험이 낮으며, 회피 설계가 용이하지 않아 강력한 배타적 권리를 확보할 수 있습니다.',
    biz: '시장 잠재력이 매우 크며, 핵심 사업 분야와의 연계성이 탁월합니다. 라이선스 수익화 가능성이 높고, 경쟁사 대비 차별화된 기술적 우위를 제공합니다. 향후 5년간 시장 규모 확대에 따른 전략적 가치 상승이 예상됩니다.',
    bizSubmit: '해당 기술은 차세대 제품 개발에 필수 불가결한 핵심 기술로 평가됩니다. 현재 진행 중인 3개의 핵심 프로젝트에 직접 적용 가능하며, 경쟁사와의 기술 격차를 유지하는 데 있어 전략적으로 매우 중요합니다. 유지를 강력히 권고합니다.',
  },
  A: {
    tech: '본 특허는 관련 기술 분야에서 높은 수준의 혁신성과 기술적 완성도를 보유하고 있습니다. 구현된 알고리즘의 효율성이 우수하며, 실용화 가능성이 높습니다. 일부 유사 접근법이 존재하나, 본 특허만의 차별화된 기술적 특징이 명확합니다.',
    rights: '청구항의 권리 범위가 적절하게 설정되어 있으며, 핵심 기술에 대한 보호가 충분합니다. 일부 주변 기술에 대한 보강이 필요할 수 있으나, 전반적으로 양호한 권리 포트폴리오를 구성하고 있습니다.',
    biz: '현재 및 예상 시장에서 중요한 포지션을 차지할 수 있는 특허입니다. 관련 사업 영역에서의 기술적 장벽 형성에 기여하며, 중장기적 관점에서 수익화 기회가 존재합니다.',
    bizSubmit: '현재 사업부 핵심 제품에 활용 중인 기술과의 연계성이 있습니다. 향후 2~3년 내 제품 고도화 과정에서 해당 특허 기술의 활용도가 높아질 것으로 예상됩니다. 연차료 수준을 고려할 때 유지가 적절하다고 판단됩니다.',
  },
  B: {
    tech: '해당 특허는 관련 분야에서 중간 수준의 기술적 혁신성을 보유하고 있습니다. 기본적인 기술적 효과는 달성하고 있으나, 일부 성능 지표에서 최신 기술 대비 개선 여지가 있습니다.',
    rights: '독립항의 권리 범위가 다소 제한적이며, 유사 특허와의 차별성이 명확하지 않은 부분이 있습니다. 향후 분쟁 발생 시 권리 유지에 어려움이 예상되므로, 청구항 보정을 검토해 볼 필요가 있습니다.',
    biz: '현재 사업 영역과의 직접적인 연관성이 낮아 수익화 가능성이 제한적입니다. 시장 트렌드 변화에 따라 활용 가능성이 변동될 수 있으며, 연차료 대비 기대 수익을 면밀히 검토할 필요가 있습니다.',
    bizSubmit: '해당 특허 기술은 현재 사업부의 주력 제품군과의 연관성이 낮습니다. 기술 활용 방안을 검토하였으나, 단기적으로는 직접적인 활용이 어려운 상황입니다. 연차료 부담과 기대 효과를 비교하여 재검토가 필요합니다.',
  },
  C: {
    tech: '해당 특허의 기술적 완성도가 낮으며, 현재 기술 수준에 비해 혁신성이 부족합니다. 유사한 기술이 이미 공개되어 있어 특허의 차별성이 약화되었습니다.',
    rights: '권리 범위가 매우 협소하며, 실질적인 배타적 권리 행사가 어렵습니다. 선행 기술과의 차별성 부재로 인해 권리 유효성에 의문이 있으며, 무효 심판 청구 시 불리한 결과가 예상됩니다.',
    biz: '시장에서의 활용 가능성이 매우 낮으며, 라이선스 수익화도 어려운 상황입니다. 관련 시장 자체가 축소되는 추세이며, 연차료 납부를 지속할 경제적 타당성이 낮습니다.',
    bizSubmit: '해당 기술은 사업부 제품에 활용되지 않고 있으며, 향후 활용 계획도 없습니다. 시장에서의 기술적 유효성이 이미 상실되었다고 판단되며, 연차료 부담을 고려할 때 포기를 권고합니다.',
  },
}

export const AI_GRADE_SCORES: Record<string, { tech: number; rights: number; biz: number }> = {
  S: { tech: 93, rights: 91, biz: 89 },
  A: { tech: 82, rights: 79, biz: 81 },
  B: { tech: 67, rights: 63, biz: 65 },
  C: { tech: 50, rights: 47, biz: 49 },
}

export interface MockSimilarPatent {
  id: number
  similarityScore: number
  applicationNumber: string
  title: string
  applicant: string
  year: number
  applicationDate?: string
  citations: number
  status: '유지' | '소멸' | '공개'
  desc: string
  detail: string
}

export const MOCK_SIMILAR_PATENTS: MockSimilarPatent[] = [
  {
    id: 1, similarityScore: 38.83, applicationNumber: '1020170095218',
    title: '차량 네트워크에서 ASIL에 기초한 통신 방법 및 장치',
    applicant: '기아 주식회사 외 현대자동차주식회사', year: 2017, citations: 7, status: '유지',
    desc: '대상 특허는 메시지 지향 미들웨어에서의 병목 구간 모니터링 방법에 대한 혁신적 요소가 있음에도 불구하고 강력한 경쟁환경에서 기술적 보호의 필요성이 강조됩니다. 비교 특허는 차량 네트워크 내 통신 안정성에 중점을 두고 있으며 실질적인 등록 실적과 인용 횟수에서 경쟁력을 보여줍니다.',
    detail: '기술적으로 겹치는 부분: 두 기술 모두 메시지와 관련된 노드 간 데이터 전송을 여하히 다루는지에 집중합니다.\n기술적 차이: 대상 특허는 메시지 지향 미들웨어에서 병목 구간을 관리하는 데 중점을 두고, 비교 특허는 차량 네트워크의 메시지 무결성 및 안전성을 강조합니다.\n청구범위 관점: 비교 특허는 20개 청구항과 핵심 독립항들로 구성되어 있어 보호 범위가 명확하고 더 광범위합니다.\n유지 판단 시사점: 경쟁기술의 풍부함과 제한된 차별성으로 인해 포트폴리오 전략의 적극적 재검토 여지가 있습니다.',
  },
  {
    id: 2, similarityScore: 38.66, applicationNumber: '1020170069012',
    title: '실시간 병목 자동 분석 방법 및 이러한 방법을 수행하는 장치',
    applicant: '그린아일 주식회사', year: 2017, citations: 2, status: '유지',
    desc: '분석 대상 특허와 상세 비교 특허는 모두 병목 구간 모니터링 및 분석 방법에 대한 기술을 다룹니다. 개선된 모니터링 기능을 제공하기 때문에 유사하나, 기술적 차이점은 유지 가능성을 검토할 때 참고할 수 있는 요소로 보입니다.',
    detail: '기술적으로 겹치는 부분: 두 특허 모두 병목 구간 정보를 수집 및 분석하여 시스템 성능을 모니터링하고 개선하는 기능을 포함합니다.\n기술적 차이: 대상 특허는 미들웨어 레벨 모니터링, 비교 특허는 서버 레벨 성능 분석을 보다 중점적으로 수행합니다.\n청구범위 관점: 비교 특허는 11개 청구항을 보유하여 공식적인 청구 내용이 더 명확합니다.\n유지 판단 시사점: 등록된 비교 특허의 영향을 고려하여 차별화된 기술 요소를 명확히 해 둘 필요가 있습니다.',
  },
  {
    id: 3, similarityScore: 37.17, applicationNumber: '1020220155709',
    title: '프로그래밍 가능한 네트워크 가상화에서의 제어 트래픽 시계열 예측 기반의 제어 채널 고립 방법 및 장치',
    applicant: '고려대학교 산학협력단', year: 2022, citations: 0, status: '유지',
    desc: '두 특허 모두 네트워크 시스템의 성능 개선을 목표로 하고 있어 유의미한 비교대상입니다. 이러한 기술은 네트워크의 효율성과 안정성을 높이는 데 기여할 가능성이 있습니다.',
    detail: '기술적으로 겹치는 부분: 토폴로지 정보를 분석하여 네트워크 성능에 영향을 미치는 요소를 모니터링하는 점에서 기술적 겹침이 나타납니다.\n기술적 차이: 대상 특허는 병목 구간 모니터링, 비교 특허는 SDN에서 제어 트래픽을 예측하여 채널을 고립하는 방법에 초점이 있습니다.\n청구범위 관점: 비교 특허는 청구항 6개로 기술 범위가 상대적으로 넓습니다.\n유지 판단 시사점: 경쟁 심화와 유사 기술 존재로 인해 분석 대상 특허의 유지 처리가 복잡할 수 있으며, 기술적 모방이 어려워 유지 가치가 있을 수 있습니다.',
  },
  {
    id: 4, similarityScore: 38.52, applicationNumber: '1020170063049',
    title: '통신 시스템에서 네트워크 품질 관리를 위한 방법 및 장치',
    applicant: '삼성전자주식회사', year: 2017, citations: 5, status: '소멸',
    desc: '', detail: '',
  },
  {
    id: 5, similarityScore: 38.34, applicationNumber: '1020200173311',
    title: '차세대 배전지능화 시스템 검증장치',
    applicant: '한국전력공사', year: 2020, citations: 1, status: '유지',
    desc: '', detail: '',
  },
  {
    id: 6, similarityScore: 37.92, applicationNumber: '1020160076352',
    title: '분산시스템에서 애플리케이션 호출 로그를 이용한 비즈니스 트랜잭션의 실시간 추적 및 분석 방법, 그리고 그 시스템',
    applicant: '티쓰3큐 주식회사', year: 2016, citations: 3, status: '유지',
    desc: '', detail: '',
  },
  {
    id: 7, similarityScore: 37.15, applicationNumber: '1020180028210',
    title: '네트워크 토폴로지 구조 분석 방법',
    applicant: '국방과학연구소', year: 2018, citations: 0, status: '유지',
    desc: '', detail: '',
  },
  {
    id: 8, similarityScore: 37.04, applicationNumber: '1020150187276',
    title: '송신 장치 및 다종 네트워크 환경에서 동적 경로 상태를 측정하는 방법',
    applicant: '한국전자기술연구원', year: 2015, citations: 2, status: '소멸',
    desc: '', detail: '',
  },
  {
    id: 9, similarityScore: 36.93, applicationNumber: '1020240146212',
    title: '서비스 메시를 활용한 네트워크 트래픽 관리 방법, 장치 및 프로그램',
    applicant: '(주) 케이티클라우드', year: 2024, citations: 0, status: '공개',
    desc: '', detail: '',
  },
  {
    id: 10, similarityScore: 36.83, applicationNumber: '1020170040115',
    title: '네트워크 자원을 고려한 가상 네트워크 관리장치 및 그 방법',
    applicant: '한국전자통신연구원', year: 2017, citations: 2, status: '소멸',
    desc: '', detail: '',
  },
]

export interface MockRelatedProject {
  id: number
  projectName: string
  department: string
  relevance: '상' | '중' | '하'
  description: string
}

export const MOCK_RELATED_PROJECTS: MockRelatedProject[] = [
  {
    id: 1,
    projectName: 'AI 기반 스마트 팩토리 고도화 2단계',
    department: '제조사업부',
    relevance: '상',
    description: '본 특허의 핵심 알고리즘이 스마트 팩토리 자동화 시스템에 직접 적용 가능합니다. 품질 검사 정확도를 20% 이상 향상시킬 것으로 기대되며, 현재 PoC 단계에서 실증 중입니다.',
  },
  {
    id: 2,
    projectName: '차세대 반도체 공정 최적화 프로젝트',
    department: '반도체사업부',
    relevance: '중',
    description: '반도체 공정 자동화와 연계하여 수율 개선에 활용 가능합니다. 특허 기술의 일부를 검사 단계에 적용하는 방안을 검토 중이며, 2027년 양산 라인 적용을 목표로 합니다.',
  },
  {
    id: 3,
    projectName: '에너지 효율 통합 모니터링 플랫폼',
    department: '에너지사업부',
    relevance: '하',
    description: '데이터 처리 및 이상 감지 알고리즘의 간접적 연관성이 있습니다. 에너지 사용 패턴 분석에 본 특허 기술의 변형 적용을 검토 중입니다.',
  },
  {
    id: 4,
    projectName: '통합 IoT 데이터 분석 시스템',
    department: '통신사업부',
    relevance: '중',
    description: 'IoT 센서 데이터의 실시간 분석 및 이상 탐지에 본 특허 기술이 활용될 수 있습니다. 2027년 1분기 출시 예정 플랫폼에 통합을 검토 중입니다.',
  },
]

export const MOCK_PROJECT_EVIDENCE: { title: string; url: string }[] = [
  { title: '스마트 팩토리 구축을 위한 설비제어 데이터 표준화 및 통합 관제 플랫폼', url: '#' },
  { title: '스마트 팩토리 시스템의 통합을 실현하는 미들웨어 솔루션', url: '#' },
  { title: '제조 데이터 분석 기반 스마트 팩토리 구축 및 고도화: 생산성 향상을 리드하는 제조 혁신 방법', url: '#' },
  { title: '제품 탄소 발자국 관리 플랫폼', url: '#' },
]

// ── 특허별 제출 의견 이력 ─────────────────────────────
export interface MockOpinionHistory {
  decision: 'KEEP' | 'DISPOSE'
  submitter: string
  submittedAt: string
  comment: string
}

export const MOCK_OPINION_HISTORIES: Record<number, MockOpinionHistory[]> = {
  // 반도체사업부 - CMP 공정 균일도 향상 방법 (EXPIRED, 2024-10-15)
  8: [
    {
      decision: 'KEEP',
      submitter: '반도체사업부 이담당',
      submittedAt: '2022-09-05',
      comment: '반도체 CMP 공정 핵심 기술로 현재 양산 라인에 직접 적용되고 있어 유지가 필요합니다.',
    },
  ],
  // 통신사업부 - 무선 충전 효율 향상 코일 구조 설계 (EXPIRED, 2025-06-30)
  13: [
    {
      decision: 'KEEP',
      submitter: '통신사업부 이담당',
      submittedAt: '2023-04-15',
      comment: '기존 무선 충전 모듈 제품군에 적용 중인 기술로, 유지 의견을 제출합니다.',
    },
  ],
  // 제조사업부 - 산업용 로봇 공정 최적화 알고리즘 (EXPIRED, 2024-12-31)
  22: [
    {
      decision: 'KEEP',
      submitter: '제조사업부 이담당',
      submittedAt: '2022-11-20',
      comment: '산업용 로봇 자동화 공정에 연계된 핵심 기술입니다. 유지를 권장합니다.',
    },
  ],
  // 반도체사업부 - 반도체 웨이퍼 결함 검출 AI 알고리즘 (ABANDONED, 2026-03-15)
  23: [
    {
      decision: 'DISPOSE',
      submitter: '반도체사업부 이담당',
      submittedAt: '2026-03-10',
      comment: '유사 기술 대체로 활용도가 낮아 포기를 결정합니다.',
    },
    {
      decision: 'KEEP',
      submitter: '반도체사업부 이담당',
      submittedAt: '2023-03-10',
      comment: '현재 사업부 핵심 기술과 직결되어 있어 유지가 필요합니다.',
    },
  ],
}
