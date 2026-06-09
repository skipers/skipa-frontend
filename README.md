# SKIPA Frontend

**SK IP Analytics** — 특허 재평가 관리 시스템 프론트엔드.  
Legal AI팀과 사업부가 협력하여 보유 특허의 유지/포기를 결정하는 워크플로우를 지원합니다.

---

## 목차

1. [기술 스택 & 로컬 개발](#기술-스택--로컬-개발)
2. [사용자 역할 & 접근 제어](#사용자-역할--접근-제어)
3. [전체 라우트 구조](#전체-라우트-구조)
4. [페이지별 기능 상세](#페이지별-기능-상세)
5. [데이터 모델](#데이터-모델)
6. [API 엔드포인트 명세](#api-엔드포인트-명세)
7. [비즈니스 규칙](#비즈니스-규칙)
8. [디자인 시스템](#디자인-시스템)

---

## 기술 스택 & 로컬 개발

- **Vue 3** (Composition API, `<script setup>`) + **TypeScript**
- **Vite** / **Pinia** (상태 관리) / **Vue Router 4**
- CSS Custom Properties (Design Tokens — `src/assets/base.css`)

```sh
npm install
npm run dev    # http://localhost:5173
npm run build
```

### 환경변수

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `VITE_API_BASE_URL` | `https://api.skipa.internal/v1` | 백엔드 API 베이스 URL |

### 목업 계정 (백엔드 미연결 시)

| ID | 비밀번호 | 역할 | deptId |
|----|----------|------|--------|
| `legal` | 임의 값 | Legal AI팀 (LEGAL) | — |
| 그 외 | 임의 값 | 사업부 (BUSINESS) | 2 (반도체사업부) |

> `src/stores/auth.ts`의 mock 로그인 로직은 백엔드 연동 시 실제 API 호출로 교체해야 합니다.

---

## 사용자 역할 & 접근 제어

### 역할 정의

| 역할 | 설명 | 접근 경로 |
|------|------|-----------|
| `LEGAL` | Legal AI팀 — 전체 특허 관리 및 재평가 총괄 | `/legal/*` |
| `BUSINESS` | 사업부 — 담당 특허 검토 및 유지/포기 결정 제출 | `/biz/*` |
| `ADMIN` | 시스템 관리자 — LEGAL과 동일 권한 | `/legal/*` |

### 접근 제어 규칙

- **라우터 가드**: `beforeEach`에서 토큰 유무 → 역할 → 경로 접근 권한 순서로 검증
- **인증 없음**: `/login`으로 리다이렉트 (원래 경로는 `?redirect=` 쿼리로 보존)
- **권한 없음**: `/403`으로 이동
- **로그인 성공**: 역할별 자동 홈 이동 (LEGAL/ADMIN → `/legal/home`, BUSINESS → `/biz/home`)
- **특허 상세 열람 제한**: BUSINESS 사용자는 자신의 `departmentId`에 배정된 특허만 전체 열람 가능. 다른 부서 특허는 기본 정보(출원번호·특허명·기술분야·상태)만 노출

### 특허 상세 탭별 접근 권한

| 탭 | LEGAL/ADMIN | BUSINESS (자기 부서) | BUSINESS (타 부서) |
|----|------------|---------------------|-------------------|
| 기본 정보 | ✅ | ✅ | ✅ (제한적) |
| AI 평가 보고서 | ✅ | ✅ | ❌ 숨김 |
| 등록료 납부 내역 | ✅ | ✅ | ❌ 숨김 |
| 등록 이력 | ✅ | ✅ | ❌ 숨김 |

---

## 전체 라우트 구조

```
/login                                  LoginView
/403                                    ForbiddenView
/404                                    NotFoundView

# Legal AI팀 (LEGAL / ADMIN)
/legal/home                             LegalHomeView          대시보드
/legal/reevaluation                     ReevaluationView       재평가 관리
/legal/portfolio                        PortfolioView          포트폴리오 분석
/legal/expiring                         ExpiringView           만료 예정 관리
/legal/expiring/:patentId               PatentDetailView       만료 특허 상세
/legal/patent-search                    PatentSearchView       특허 검색
/legal/patent-search/:patentId          PatentDetailView       검색 특허 상세
/legal/patents/new                      LegalPatentRegisterView 신규 특허 등록
/legal/patents/:patentId                PatentDetailView       특허 상세

# 사업부 (BUSINESS)
/biz/home                               BizHomeView            홈 (미제출 현황)
/biz/review                             ReviewStatusView       검토 현황
/biz/review/:patentId                   PatentDetailView       검토 특허 상세
/biz/patents                            MyPatentsView          담당 특허 관리
/biz/patents/new                        BizPatentRegisterView  신규 특허 등록
/biz/patents/:patentId                  PatentDetailView       특허 상세
/biz/history                            SubmissionHistoryView  제출 이력
/biz/pre-eval-lab                       PreEvalLabView         사전 평가 Lab
/biz/expiring                           BizExpiringView        만료 예정 관리
/biz/expiring/:patentId                 PatentDetailView       만료 특허 상세
```

> `PatentDetailView`는 Legal/Biz 공용이며, 접근 경로 prefix(`/legal` vs `/biz`)에 따라 "목록으로 돌아가기" 링크가 결정됩니다.

---

## 페이지별 기능 상세

### 공통

---

#### 로그인 `/login`

**기능**
- 아이디 / 비밀번호 입력 + 유효성 검사
- 비밀번호 표시/숨김 토글
- 로그인 성공 → 역할별 홈 자동 이동

**API 호출**
- `POST /auth/login`

---

#### 특허 상세 `/legal/patents/:id`, `/biz/patents/:id` 외

**상단 헤더**
- 특허명, AI 종합 등급 배지, 특허 상태(등록/만료/포기)
- Legal 전용: 수정 버튼, 삭제 버튼

**탭 네비게이션** (스크롤 스파이 — 스크롤 위치에 따라 탭 자동 활성화)

| 탭 key | 탭 이름 | 내용 |
|--------|---------|------|
| `info` | 기본 정보 | 서지정보 테이블 (IPC, CPC, 출원번호/일자, 출원인, 발명자, 등록번호/일자, 공개번호/일자, 공고번호/일자, 심사청구항수, 만료일), 키워드 태그 |
| `report` | AI 평가 보고서 | 6개 파트 (하단 상세 참조) — isOwnDept인 경우만 노출 |
| `fee` | 등록료 납부 내역 | 납부 이력 테이블 (분기/금액/납부일/상태) — 3년 단위 묶음 |
| `history` | 등록 이력 | 특허 생애주기 타임라인 (출원 → 공개 → 등록 → 유지×N → 만료/포기) |

**AI 평가 보고서 6개 파트** (report 탭)

| 번호 | 파트 | 내용 |
|------|------|------|
| 01 | 평가 요약 | 종합/기술성/권리성/시장성 점수 카드 4개 + 종합 의견 |
| 02 | 평가 기준별 상세 점수 | 3개 기준 점수 카드 + 기준별 요약(한 행씩) + 평가 항목 세부 내역 (토글 테이블) |
| 03 | 사내 프로젝트 활용 현황 | 활용 현황 테이블 + 요약 설명 카드 + 근거 자료 카드 |
| 04 | 유사 특허 분석 | 통계 카드(분석대상/등록유지/공개/소멸/평균피인용) + 요약 + 상위 3개 상세 카드 + 전체 목록 테이블 (유사도 내림차순) |
| 05 | 추가 확인 필요 사항 | 낮은 점수 항목 자동 추출 목록 |
| 06 | 참고문헌 | 번호 목록 |

**API 호출**
- `GET /patents/:id`
- `GET /patents/:id/ai-report`
- `GET /patents/:id/annuities`
- `GET /patents/:id/legal-status`
- `PATCH /patents/:id` (Legal 전용)
- `DELETE /patents/:id` (Legal 전용)

---

#### 특허 검색 `/legal/patent-search`, `/biz/patent-search`

**검색 조건**
- 텍스트: 특허명 / 출원번호 / 발명자 / 키워드 (통합 검색)
- 상태: `REGISTERED` / `EXPIRED` / `ABANDONED`
- 국가: 한국 / 미국 / 유럽 / 중국 / 일본
- 기술분야: AI/ML, 반도체, 통신, 에너지, 제조
- 사업부 (Legal/Admin만 노출)
- 정렬: 출원일 / 등록일 / 만료일

**결과 목록**
- 출원번호, 특허명, 출원일, 만료일, 상태, AI 등급
- 페이지네이션
- 행 클릭 → 상세 페이지

**Legal 전용**: "신규 특허 등록" 버튼 노출 → `/legal/patents/new`

**API 호출**
- `GET /patents?q=&status=&country=&techField=&deptId=&sort=&page=&size=`

---

### Legal AI팀

---

#### 홈 `/legal/home`

**KPI 카드 행** (5개)

| 카드 | 지표 | 클릭 동작 |
|------|------|-----------|
| 분기 진행률 | 전체 건 대비 회신 완료율, 진행 바 | — |
| 요청 완료 | 요청 전송 완료 건수 | `/legal/reevaluation?tab=requested` |
| 지연 | 기한 초과 미회신 건수 | `/legal/reevaluation?tab=overdue` |
| 결정 완료 | 회신 완료 건수 | `/legal/reevaluation?tab=done` |
| 요청 전 | 아직 배정/요청 전 건수 | `/legal/reevaluation?tab=unassigned` |

**미확인 회신 카드**
- 사업부가 결정을 제출했으나 Legal이 아직 확인하지 않은 회신 목록
- 특허명 / 사업부명 / 결정(유지/포기) 표시
- 클릭 → 재평가 관리 → 해당 특허 상세로 이동 (`?tab=unread&open=:id`)
- 확인 후 목록에서 자동 제거 (module-level reactive state)
- "전체 보기" → `/legal/reevaluation?tab=unread`

**사업부별 처리 현황 테이블**
- 사업부명 / 배정 건수 / 결정 완료 건수 / 진행률 바
- 행 클릭 → `/legal/reevaluation?dept=:deptId`

**하단 차트**
- 기술 분야 분포: 가로 바 (상대값 기준)
- 분기별 만료 예정: 막대 차트 (5개 분기, 현재 분기 주황색)

**API 호출**
- `GET /dashboard/summary`
- `GET /dashboard/assignment`
- `GET /dashboard/distribution`
- `GET /dashboard/departments`

---

#### 재평가 관리 `/legal/reevaluation`

**진행 현황 바**
- 전체 대비 회신 완료율 + 상태별 구간 (요청전 / 요청완료 / 지연 / 회신완료 / 미확인)

**필터** (URL 쿼리 파라미터 동기화)

| 필터 | 값 | 쿼리 파라미터 |
|------|----|---------------|
| 상태 탭 | `all` / `unread` / `unassigned` / `requested` / `overdue` / `done` | `?tab=` |
| 사업부 | 전체 / 미배정 / 각 deptId | `?dept=` |
| 결정 | 전체 / `KEEP` / `DISPOSE` | `?decision=` |

**특허 목록 테이블**
- 체크박스 (전체 선택 / 개별 선택)
- 상태 배지: `unassigned`(회색) / `requested`(파랑) / `overdue`(빨강) / `done`(초록)
- 특허명 + 2줄 요약
- 출원번호 (monospace)
- 기술 분야 태그
- 담당 사업부 칩 — 클릭하여 인라인 변경 가능
- 결정 배지 (`KEEP` / `DISPOSE`) 또는 "미회신"
- 행 클릭 → 특허 상세

**선택 항목 액션 바**
- "사업부 일괄 배정" 모달: 부서 검색 + 라디오 선택 → 배정 확정
- "검토 요청 전송" 모달 (2단계):
  1. 전송 대상 요약: 전송 가능 건수 + 사업부별 분배, 불가 항목(미배정/요청완료/지연/회신완료) 경고
  2. 완료 화면: 성공 아이콘 + 실제 전송 건수

**페이지네이션**: `usePagination()` composable 사용

**API 호출**
- `GET /review-requests?tab=&dept=&decision=&page=&size=`
- `POST /patents/:id/departments` (사업부 배정)
- `PATCH /patents/:id/departments/:deptId` (사업부 변경)
- `POST /review-requests` (검토 요청 전송)

---

#### 포트폴리오 분석 `/legal/portfolio`

**가치 평가 등급 분포**
- 탭: 기술분야별 필터
- S / A / B / C / D 등급별 가로 바 + 건수 + 비율

**AI 포트폴리오 인사이트 카드**
- 경고 항목, 별점(5개), 권장 액션 목록

**도넛 차트 3종** (세그먼트 호버 → 이름·건수·비율 툴팁)
- 기술분야별 분포
- 국가별 분포
- 사업부별 분포

**유지·포기 비율 분석**
- 탭: 사업부별 / 기술분야별
- 가로 100% 스택 바 (KEEP 녹색 / DISPOSE 빨강)

**연도별 추이**
- 출원·등록·만료 꺾은선 차트

**분기별 재평가 결정 비율**
- 수직 100% 스택 바, 진행 중 분기 점선
- 막대 호버 → 유지·포기 건수·비율 툴팁

**API 호출**
- `GET /dashboard/distribution`
- `GET /decisions?groupBy=quarter`

---

#### 만료 예정 관리 `/legal/expiring`

**타임라인 뷰** (기본)
- 기간별 막대 차트: 3개월 / 6개월 / 1년 / 3년 / 5년 이내
- 막대 클릭 → 선택 기간 기준 기술분야별 구성 100% 스택 바 갱신
- 만료 예정 목록: 긴급도 점(critical/warn/normal) + 특허명/출원번호/기술분야/사업부/D-day/만료일

**캘린더 뷰**
- 12달 그리드, 월별 만료 건수·긴급도 배지, 현재 달 강조
- 월 클릭 → 해당 월 만료 특허 목록 슬라이드 오픈
- 연도 이동 버튼 (이전 / 다음)

**API 호출**
- `GET /patents?status=EXPIRING_SOON&sortBy=expiryDate`

---

#### 신규 특허 등록 `/legal/patents/new`

**입력 필드**
- 출원번호, 특허명, 기술분야, 국가, 출원일, 만료일, 출원인, 발명자, 키워드

**API 호출**
- `POST /patents`
- `POST /patents/:id/documents` (PDF 업로드, 선택)

---

### 사업부

---

#### 홈 `/biz/home`

**제출 마감 요약 카드**
- D-day (7일 이하 빨강 강조)
- 전체 담당 / 제출 완료 / 미제출 건수
- 이번 분기 제출률 진행 바

**미제출 특허 목록 카드**
- 특허명, 기술분야, D-day
- 특허 클릭 → 특허 상세 (의견 제출 패널 자동 오픈)
- 전부 제출 완료 시 완료 메시지

**최근 제출 이력 카드**
- 최근 3건 (특허명 / 결정 / 제출일)

**API 호출**
- `GET /inbox?status=pending`
- `GET /inbox?status=submitted&limit=3`

---

#### 검토 현황 `/biz/review`

**D-day 배지 + 제출 진행률 바**

**상태 탭**: 전체 / 제출완료 / 미제출 (건수 표시)

**특허 테이블**
- 출원번호 / 특허명 / AI 종합 점수 / 상태 / 제출일
- 행 클릭 → 특허 상세 (우측 패널에서 의견 제출 가능)

**재평가 안내 모달**: 버튼 클릭 시 평가 프로세스 안내

**API 호출**
- `GET /inbox`

---

#### 담당 특허 관리 `/biz/patents`

**보유 특허 현황 바**
- 전체 건수, 유지중 / 만료·포기 100% 가로 바 + 범례

**탭** (3개)
- 유지중인 특허 (`REGISTERED`)
- 만료·포기 특허 (`EXPIRED` / `ABANDONED`)
- 검토 제출 이력

**필터 바**
- 기술 분야 드롭다운
- 상태 드롭다운

**특허 목록 테이블**
- 검색: 특허명 / 출원번호 / 기술분야 키워드
- 정렬: 출원번호 / 특허명 / 출원일 / 만료일 (컬럼 클릭)
- 컬럼: 출원번호 / 특허명(키워드 태그 포함) / 출원일 / 만료예정일 / 기술분야 / 상태

**API 호출**
- `GET /patents?deptId=:myDeptId&status=REGISTERED`
- `GET /patents?deptId=:myDeptId&status=EXPIRED,ABANDONED`

---

#### 제출 이력 `/biz/history`

**필터**
- 연도 (년 단위)
- 분기 (Q1~Q4)
- 의견 칩: 전체 / 유지(`KEEP`) / 포기(`DISPOSE`)

**분기별 그룹화 목록**
- 그룹 헤더: 분기 레이블 + 건수
- 항목: 결정 아이콘 + 특허명 + 클릭 → 상세 페이지

**API 호출**
- `GET /inbox?status=submitted&year=&quarter=&decision=`

---

#### 사전 평가 Lab `/biz/pre-eval-lab`

**평가 입력 폼**
- 특허명, 기술 설명, 청구항 (멀티라인), 관련 사업, 대상 국가

**채팅형 인터페이스**
- 사용자 입력 → AI 답변 (타이핑 애니메이션)

**평가 결과 (3개 지표)**
- 기술성 / 권리성 / 사업성 (0~100 점수 + 상세 코멘트)

**평가 이력**
- 과거 평가 목록 (특허명 / 평가일자)

**API 호출**
- `POST /pre-eval` (평가 요청)
- `GET /pre-eval` (이력 조회)

---

#### 만료 예정 관리 `/biz/expiring`

Legal의 `/legal/expiring`과 동일한 UI이되:
- 로그인 사용자의 `departmentId`로 자동 필터링
- 기술분야별 분포 차트 미표시

**API 호출**
- `GET /patents?deptId=:myDeptId&status=EXPIRING_SOON&sortBy=expiryDate`

---

## 데이터 모델

### 핵심 열거형

```typescript
type UserRole    = 'LEGAL' | 'BUSINESS' | 'ADMIN'
type PatentStatus = 'REGISTERED' | 'EXPIRED' | 'ABANDONED'
type Grade        = 'S' | 'A' | 'B' | 'C' | 'D'
type ReevalStatus = 'unassigned' | 'requested' | 'overdue' | 'done'
type Decision     = 'KEEP' | 'DISPOSE'
type Urgency      = 'critical' | 'warn' | 'normal'
```

### 주요 인터페이스

#### User
```typescript
interface User {
  id: string
  name: string
  email: string
  role: UserRole
  departmentId?: number   // BUSINESS 역할만 존재
}
```

#### Patent (특허)
```typescript
interface Patent {
  id: number
  title: string
  applicationNumber: string
  applicationDate: string       // YYYY-MM-DD
  expiryDate: string            // YYYY-MM-DD
  techField: string             // 'AI/ML' | '반도체' | '통신' | '에너지' | '제조'
  status: PatentStatus
  grade: Grade | null           // AI 종합 등급 (null = 미평가)
  aiOpinion: '유지 권고' | '재검토 필요' | '포기 권고' | null
  tags: string[]                // AI 추출 키워드
  departments: PatentDepartment[]
}

interface PatentDepartment {
  patentId: number
  departmentId: number
  departmentName: string
}
```

#### Biblio (서지정보)
```typescript
interface PatentBiblio {
  ipcCodes: string[]            // 예: ['H04L 43/10', 'G06F 11/30']
  cpcCodes: string[]
  applicationNum: string
  applicationDate: string
  applicant: string
  registrationNum: string       // 미등록 시 빈 문자열
  registrationDate: string
  pubNum: string
  pubDate: string
  annNum: string
  annDate: string
  inventors: string             // 쉼표 구분 문자열
  examClaims: number            // 심사청구항수
  expiryDate: string
}
```

#### Annuity (등록료 납부)
```typescript
interface Annuity {
  id: number
  patentId: number
  quarter: string               // 예: '제 1 - 3 년분'
  amount: number                // 원 단위
  paidAt: string                // YYYY-MM-DD
  status: 'paid' | 'unpaid'
}
```

#### PatentLegalStatus (등록 이력)
```typescript
interface PatentLegalStatus {
  id: number
  patentId: number
  event: '출원' | '공개' | '등록' | '유지' | '포기' | '만료'
  description: string
  occurredAt: string            // YYYY-MM-DD
}
```

#### AiReport (AI 평가 보고서)
```typescript
interface AiReport {
  patentId: number
  status: 'NONE' | 'GENERATING' | 'COMPLETED' | 'FAILED'
  totalScore: number            // 0–100
  techScore: number             // 기술성
  rightsScore: number           // 권리성
  bizScore: number              // 시장성 및 사업성
  techComment: string
  rightsComment: string
  bizComment: string
  evalBlocks: EvalBlock[]       // 평가 기준별 항목 세부 내역
  similarPatents: SimilarPatent[]
  relatedProjects: RelatedProject[]
  confirmItems: ConfirmItem[]
  refs: string[]
  generatedAt: string | null
}

interface EvalBlock {
  key: 'tech' | 'rights' | 'market'
  title: string
  score: number
  items: EvalItem[]
}

interface EvalItem {
  id: string
  name: string
  score: number                 // 1–5
  method: string
  summary: string
  grounds: string
  sources: string
}

interface SimilarPatent {
  applicationNumber: string
  title: string
  applicant: string
  year: number
  similarityScore: number
  citations: number
  status: '유지' | '소멸' | '공개'
  desc: string
  detail: string
}

interface RelatedProject {
  id: number
  projectName: string
  department: string
  relevance: '상' | '중' | '하'
  description: string
}

interface ConfirmItem {
  title: string
  meta: string                  // 예: '시장성 및 사업성 · 1/5'
  desc: string
}
```

#### Reeval / Decision (재평가)
```typescript
interface ReevalItem {
  id: number
  patentId: number
  title: string
  applicationNumber: string
  techField: string
  summary: string
  departmentId: number | null
  departmentName: string | null
  reviewStatus: ReevalStatus
  decision: Decision | null
  decidedAt: string | null
  dueDate: string
  isOverdue: boolean
}

interface DecisionSubmitRequest {
  decision: Decision            // 'KEEP' | 'DISPOSE'
  comment?: string
}
```

#### Dashboard
```typescript
interface DashboardSummary {
  quarter: string               // 예: '2026 Q2'
  totalCount: number
  requestedCount: number
  overdueCount: number
  doneCount: number
  unassignedCount: number
  progressRate: number          // 0–100
}

interface DashboardDepartment {
  departmentId: number
  departmentName: string
  assignedCount: number
  doneCount: number
  progressRate: number
}

interface DashboardDistribution {
  byTechField: { label: string; count: number }[]
  byQuarterExpiry: { quarter: string; count: number }[]
}
```

#### PreEval (사전 평가)
```typescript
interface PreEvalRequest {
  title: string
  description: string
  claims: string
  relatedBusiness?: string
  targetCountries?: string[]
}

interface PreEvalResult {
  id: number
  title: string
  techScore: number
  rightsScore: number
  bizScore: number
  techComment: string
  rightsComment: string
  bizComment: string
  evaluatedAt: string
}
```

---

## API 엔드포인트 명세

> 모든 요청에 `Authorization: Bearer {access_token}` 헤더 포함.  
> 모든 응답은 `{ success: true, data: ... }` 또는 `{ success: false, error: { code, message } }` 형태.

### 인증

| 메서드 | 경로 | 설명 | 요청 Body | 응답 |
|--------|------|------|-----------|------|
| `POST` | `/auth/login` | 로그인 | `{ id, password }` | `{ accessToken, refreshToken, user: User }` |
| `POST` | `/auth/logout` | 로그아웃 | — | — |
| `GET` | `/auth/me` | 현재 사용자 조회 | — | `{ user: User }` |
| `POST` | `/auth/refresh` | 토큰 갱신 | `{ refreshToken }` | `{ accessToken, refreshToken }` |

### 특허

| 메서드 | 경로 | 설명 | 주요 쿼리/Body |
|--------|------|------|----------------|
| `GET` | `/patents` | 특허 목록 | `q, status, country, techField, deptId, sort, page, size` |
| `GET` | `/patents/:id` | 특허 상세 | — |
| `POST` | `/patents` | 신규 등록 | `Patent` 필드 일체 |
| `PATCH` | `/patents/:id` | 정보 수정 | 수정할 필드만 |
| `DELETE` | `/patents/:id` | 삭제 | — |
| `POST` | `/patents/:id/documents` | PDF 업로드 | `multipart/form-data` |
| `DELETE` | `/patents/:id/documents` | PDF 삭제 | — |
| `POST` | `/patents/:id/departments` | 사업부 배정 | `{ departmentId }` |
| `PATCH` | `/patents/:id/departments/:deptId` | 사업부 변경 | `{ newDepartmentId }` |
| `DELETE` | `/patents/:id/departments/:deptId` | 사업부 제거 | — |
| `GET` | `/patents/:id/legal-status` | 등록 이력 조회 | — |
| `POST` | `/patents/:id/legal-status` | 이력 항목 추가 | `{ event, description, occurredAt }` |
| `GET` | `/patents/:id/annuities` | 등록료 납부 이력 | — |
| `POST` | `/patents/:id/annuities` | 납부 내역 추가 | `{ quarter, amount, paidAt, status }` |
| `PATCH` | `/patents/:id/annuities/:annuityId` | 납부 내역 수정 | 수정할 필드만 |

### AI 보고서

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET` | `/patents/:id/ai-report` | AI 평가 보고서 조회 (`status: NONE`이면 미생성) |
| `POST` | `/patents/:id/ai-report/retry` | 보고서 재생성 요청 |
| `POST` | `/patents/:id/reports` | 평가 보고서 PDF 생성 요청 → `{ reportId, status }` |
| `GET` | `/patents/:id/reports/:reportId` | 보고서 조회 (URL 포함) |
| `GET` | `/patents/:id/reports/:reportId/status` | 생성 상태 폴링 (`GENERATING` / `COMPLETED` / `FAILED`) |

> 프론트엔드는 `usePolling()`으로 3초 간격, 최대 60회 폴링합니다.

### 재평가 관리 (Legal)

| 메서드 | 경로 | 설명 | 주요 쿼리/Body |
|--------|------|------|----------------|
| `GET` | `/review-requests` | 재평가 목록 | `tab, dept, decision, page, size` |
| `POST` | `/review-requests` | 검토 요청 전송 | `{ quarter, items: [{ patentId, departmentId }] }` |
| `GET` | `/review-requests/:id` | 요청 상세 | — |
| `PATCH` | `/review-requests/:id/items/:patentId` | 담당 부서 변경 | `{ departmentId }` |

### 의견 제출 (Business)

| 메서드 | 경로 | 설명 | 주요 쿼리/Body |
|--------|------|------|----------------|
| `GET` | `/inbox` | 의견 요청 목록 | `status(pending/submitted), year, quarter, decision, page, size` |
| `GET` | `/inbox/:decisionId` | 요청 상세 | — |
| `POST` | `/inbox/:decisionId/decide` | 의견 제출 | `{ decision: 'KEEP'|'DISPOSE', comment? }` |

### 대시보드 (Legal)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET` | `/dashboard/summary` | 분기 진행률 및 KPI 카드 수치 |
| `GET` | `/dashboard/assignment` | 배정 현황 (미배정/배정/결정완료) |
| `GET` | `/dashboard/distribution` | 기술분야별·분기별 분포 |
| `GET` | `/dashboard/departments` | 사업부별 처리 현황 |

### 사전 평가 (Business)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `POST` | `/pre-eval` | 사전 AI 평가 요청 |
| `GET` | `/pre-eval` | 평가 이력 조회 |
| `GET` | `/pre-eval/:id` | 평가 결과 상세 |

---

## 비즈니스 규칙

### 재평가 사이클

- **주기**: 3년에 1회 (예: 2020 → 2023 → 2026)
- **프로세스**:
  1. Legal이 특허 목록을 사업부에 배정 (`unassigned` → `requested`)
  2. 사업부가 유지/포기 결정 제출 (`requested` → `done`)
  3. 기한 초과 시 자동으로 `overdue` 상태
  4. Legal이 회신 확인 → 최종 처리

- **상태 전이**:
  ```
  unassigned ──검토요청전송──→ requested
  requested  ──기한초과──────→ overdue
  requested  ──사업부제출────→ done (unread)
  overdue    ──사업부제출────→ done (unread)
  done       ──Legal확인────→ done (read)
  ```

### 등록료 납부

- **주기**: 3년 단위 묶음 (제 1-3년분, 제 4-6년분, 제 7-9년분, ...)
- 마지막 납부 후 다음 주기에 미납 시 권리 소멸 → `EXPIRED` 상태

### AI 등급 및 점수

| 등급 | 기술성 | 권리성 | 시장성 |
|------|--------|--------|--------|
| S | 90+ | 88+ | 85+ |
| A | 78+ | 76+ | 72+ |
| B | 65+ | 63+ | 60+ |
| C | 50+ | 48+ | 45+ |
| D | ~50 | ~48 | ~45 |

### 긴급도 (만료 예정)

| urgency | 조건 |
|---------|------|
| `critical` | D-90 이내 |
| `warn` | D-180 이내 |
| `normal` | D-180 초과 |

---

## 디자인 시스템

모든 색상은 `src/assets/base.css`의 CSS 변수로 관리합니다.

| 토큰 | 값 | 용도 |
|------|----|------|
| `--color-primary` | `#6366f1` | 브랜드 인디고 |
| `--color-keep` | `#16a34a` | 유지 결정 |
| `--color-dispose` | `#dc2626` | 포기 결정 |
| `--color-danger` | `#ef4444` | 위험/긴급 |
| `--color-warn` | `#f59e0b` | 경고 |
| `--color-success` | `#22c55e` | 성공 |
| `--chart-1` ~ `--chart-5` | — | 차트 팔레트 |

### 사업부 ID 매핑

| deptId | 사업부명 |
|--------|---------|
| 2 | 반도체사업부 |
| 3 | 통신사업부 |
| 4 | 에너지사업부 |
| 5 | 제조사업부 |
