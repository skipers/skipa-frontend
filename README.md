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
6. [비즈니스 규칙](#비즈니스-규칙)
7. [디자인 시스템](#디자인-시스템)

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

### 목업 계정 (백엔드 미연결 시)

현재 모든 페이지는 백엔드 없이 mock 데이터로 동작합니다.

| ID | 비밀번호 | 역할 | 부서 |
|----|----------|------|------|
| `legal` | 임의 값 | Legal AI팀 (LEGAL) | — |
| 그 외 | 임의 값 | 사업부 (BUSINESS) | 반도체사업부 |

> `src/stores/auth.ts`의 mock 로그인 로직은 백엔드 연동 시 실제 API 호출로 교체합니다.

---

## 사용자 역할 & 접근 제어

| 역할 | 설명 | 접근 경로 |
|------|------|-----------|
| `LEGAL` | Legal AI팀 — 전체 특허 관리 및 재평가 총괄 | `/legal/*` |
| `BUSINESS` | 사업부 — 담당 특허 검토 및 유지/포기 결정 제출 | `/biz/*` |
| `ADMIN` | 시스템 관리자 — LEGAL과 동일 권한 | `/legal/*` |

- **라우터 가드**: 토큰 유무 → 역할 → 경로 접근 권한 순서로 검증
- **인증 없음**: `/login`으로 리다이렉트 (원래 경로는 `?redirect=` 쿼리로 보존)
- **권한 없음**: `/403`으로 이동
- **로그인 성공**: 역할별 자동 홈 이동 (`LEGAL/ADMIN` → `/legal/home`, `BUSINESS` → `/biz/home`)

---

## 전체 라우트 구조

```
/login                                         LoginView
/403                                           ForbiddenView
/404                                           NotFoundView

# Legal AI팀 (LEGAL / ADMIN)
/legal/home                                    LegalHomeView              대시보드
/legal/reevaluation                            ReevaluationView           재평가 관리
/legal/portfolio                               PortfolioView              포트폴리오 분석
/legal/expiring                                ExpiringView               소멸 예정 관리
/legal/expiring/:patentId                      PatentDetailView           특허 상세
/legal/patent-search                           PatentSearchView           특허 검색
/legal/patent-search/:patentId                 PatentDetailView           특허 상세
/legal/patents/:patentId                       PatentDetailView           특허 상세
/legal/patent-manage                           LegalPatentRegisterView    특허 관리 (신청 검토 + 특허 목록)
/legal/patent-manage/review/:appId             LegalReviewDetailView      신청 검토 상세

# 사업부 (BUSINESS)
/biz/home                                      BizHomeView                홈 대시보드
/biz/review                                    ReviewStatusView           검토 현황
/biz/review/:patentId                          PatentDetailView           특허 상세
/biz/patents                                   MyPatentsView              담당 특허 관리
/biz/history                                   SubmissionHistoryView      제출 이력
/biz/pre-eval-lab                              PreEvalLabView             사전 평가 Lab
/biz/expiring                                  BizExpiringView            소멸 예정 관리
/biz/expiring/:patentId                        PatentDetailView           특허 상세
/biz/patent-search                             PatentSearchView           특허 검색
/biz/patent-search/:patentId                   PatentDetailView           특허 상세
/biz/register                                  BizPatentRegisterView      신규 특허 등록 신청
/biz/register/history/:appId                   BizApplicationDetailView   신청 상세
```

---

## 페이지별 기능 상세

### 공통

---

#### 로그인 `/login`

- 아이디 / 비밀번호 입력 + 유효성 검사
- 비밀번호 표시/숨김 토글
- 로그인 성공 → 역할별 홈 자동 이동

---

#### 특허 상세 `PatentDetailView`

Legal/Biz 공용 뷰. 접근 경로 prefix에 따라 "목록으로 돌아가기" 링크가 결정됩니다.

**상단 헤더**
- 특허명, AI 종합 등급 배지, 특허 상태 (등록/소멸/포기)
- Legal 전용: 수정·삭제 버튼

**탭 네비게이션** (스크롤 위치에 따라 자동 활성화)

| 탭 | 내용 |
|----|------|
| 기본 정보 | 서지정보 테이블 (IPC/CPC, 출원번호·일자, 출원인, 발명자, 등록번호·일자, 공개/공고번호, 심사청구항수, 만료일), 키워드 태그 |
| AI 평가 보고서 | 평가 요약 / 평가 기준별 상세 / 사내 프로젝트 활용 현황 / 유사 특허 분석 / 추가 확인 사항 / 참고문헌 |
| 등록료 납부 내역 | 납부 이력 테이블 (분기/금액/납부일/상태), 3년 단위 묶음 |
| 등록 이력 | 생애주기 타임라인 (출원 → 공개 → 등록 → 유지×N → 소멸/포기) |

---

#### 특허 검색 `/legal/patent-search`, `/biz/patent-search`

- 텍스트 통합 검색 (특허명 / 출원번호 / 발명자 / 키워드)
- 필터: 상태 / 국가 / 기술분야 / 사업부 (Legal/Admin만) / 정렬
- 결과 목록 페이지네이션, 행 클릭 → 상세 페이지

---

### Legal AI팀

---

#### 홈 `/legal/home`

**KPI 카드 5종**
- 분기 진행률 (회신 완료율 진행 바)
- 요청 완료 / 지연 / 결정 완료 / 요청 전 건수 (클릭 시 재평가 관리로 이동)

**미확인 회신 카드**
- 사업부 제출 후 Legal 미확인 회신 목록
- 특허명 / 사업부명 / 결정(유지/포기) 표시
- 클릭 → 해당 특허 상세, 확인 후 목록에서 자동 제거

**사업부별 처리 현황 테이블**
- 사업부명 / 배정 건수 / 결정 완료 / 진행률 바
- 행 클릭 → 재평가 관리 (해당 사업부 필터 적용)

**하단 차트**
- 기술 분야 분포 (가로 바)
- 분기별 소멸 예정 건수 (막대 차트, 현재 분기 강조)

---

#### 재평가 관리 `/legal/reevaluation`

**진행 현황 바**: 전체 대비 회신 완료율 + 상태별 구간 시각화

**필터** (URL 쿼리 파라미터 동기화)

| 필터 | 값 |
|------|----|
| 상태 탭 | `all` / `unread` / `unassigned` / `requested` / `overdue` / `done` |
| 사업부 | 전체 / 미배정 / 각 부서 |
| 결정 | 전체 / 유지 / 포기 |

**특허 목록 테이블**
- 체크박스 (전체/개별 선택)
- 상태 배지: 미배정(회색) / 요청완료(파랑) / 지연(빨강) / 회신완료(초록)
- 담당 사업부 칩 — 클릭하여 인라인 변경
- 결정 배지 또는 "미회신"

**선택 항목 액션 바**
- 사업부 일괄 배정: 부서 검색 + 라디오 선택 → 배정
- 검토 요청 전송 (2단계): 전송 가능 건수 요약 → 완료 화면

---

#### 특허 관리 `/legal/patent-manage`

**탭 2종**

| 탭 | 내용 |
|----|------|
| 신청 검토 | 사업부가 제출한 신규 특허 등록 신청 목록. 신청 상태 배지(심사중/승인/거절/재신청), 클릭 → 신청 검토 상세 |
| 특허 목록 | 전체 특허 목록, 검색·상태·기술분야 필터, 행 클릭 → 특허 상세 |

**신규 등록 버튼**: 직접 특허 정보를 입력하여 등록하는 모달 오픈

---

#### 신청 검토 상세 `/legal/patent-manage/review/:appId`

- 신청 특허 정보 (제목, 신청자, 신청일) 및 상태 배지 표시
- 거절 사유 인라인 입력 후 **거절 확정** or **승인** 처리
- 이미 처리된 건은 거절 사유 표시 (읽기 전용)

---

#### 포트폴리오 분석 `/legal/portfolio`

- 가치 평가 등급 분포 (기술분야 탭 필터, S~D 등급 가로 바)
- AI 포트폴리오 인사이트 카드 (경고 항목, 권장 액션)
- 도넛 차트 3종: 기술분야별 / 국가별 / 사업부별 분포
- 유지·포기 비율 분석 (사업부별·기술분야별 100% 스택 바)
- 연도별 출원·등록·소멸 꺾은선 추이
- 분기별 재평가 결정 비율 (수직 100% 스택 바, 진행 중 분기 점선)

---

#### 소멸 예정 관리 `/legal/expiring`

**타임라인 뷰** (기본)
- 기간별 소멸 건수 막대 차트 (3개월 / 6개월 / 1년 / 3년 / 5년 이내)
- 막대 클릭 → 기술분야별 구성 100% 스택 바 갱신
- 소멸 예정 목록: 긴급도 점(critical/warn/normal) + 특허명·D-day

**캘린더 뷰**
- 12달 그리드, 월별 소멸 건수·긴급도 배지, 현재 달 강조
- 월 클릭 → 해당 월 소멸 특허 목록 슬라이드 오픈
- 연도 이동 버튼

---

### 사업부

---

#### 홈 `/biz/home`

**제출 마감 요약 카드**
- 분기 레이블 (상단 강조)
- D-day (7일 이하 빨강 강조), 제출 마감일
- 전체 담당 / 제출 완료 / 미제출 건수
- 이번 분기 제출률 진행 바

**미제출 특허 카드**: 미제출 특허 목록, 클릭 → 특허 상세

**최근 제출 이력 카드**: 최근 제출 건 (특허명 / 결정 / 제출일)

**신규 특허 신청 현황 카드**: 내가 신청한 특허 등록 신청 목록 (상태 배지 + 특허명 + 신청일), "전체 보기" → `/biz/register?tab=history`

**담당 특허 현황 도넛 차트**: 등록중 / 소멸 / 포기 건수 + 범례

**연도별 출원·소멸/포기 추이 꺾은선 차트**

---

#### 검토 현황 `/biz/review`

- 분기 레이블 (상단 강조)
- D-day 배지 + 제출 진행률 바 + 완료/미제출 건수
- 상태 탭: 전체 / 제출완료 / 미제출
- 특허 테이블: 출원번호 / 특허명 / AI 종합 점수 / 상태 / 제출일, 행 클릭 → 특허 상세
- 재평가 안내 모달 (프로세스 설명)

---

#### 담당 특허 관리 `/biz/patents`

- 보유 특허 현황 바 (전체 건수, 유지중/소멸·포기 비율)
- 탭 3종: 유지중인 특허 / 소멸·포기 특허 / 검토 제출 이력
- 기술분야·상태 필터, 특허명·출원번호 검색
- 컬럼 클릭 정렬 (출원번호 / 특허명 / 출원일 / 만료일)

---

#### 신규 특허 등록 신청 `/biz/register`

**탭 2종**

| 탭 | 내용 |
|----|------|
| 신청서 작성 | PDF 업로드 → 항목 자동 추출 후 내용 확인 및 제출. 거절된 신청의 재신청 배너 표시 |
| 신청 현황 | 내가 제출한 신청 목록 (상태 배지, 클릭 → 신청 상세) |

---

#### 신청 상세 `/biz/register/history/:appId`

- 신청 특허 정보 및 현재 상태 표시
- **심사중·거절 상태**: "수정 후 재신청" 버튼 (신청서 작성 탭으로 이동, 기존 내용 채워짐) / "철회" 버튼
- **거절 사유**: Legal이 입력한 사유 표시
- **재신청 시**: 내용 수정 후 재제출

---

#### 제출 이력 `/biz/history`

- 연도·분기·결정(유지/포기) 필터
- 분기별 그룹화 목록 (그룹 헤더: 분기 레이블 + 건수)
- 항목 클릭 → 특허 상세

---

#### 사전 평가 Lab `/biz/pre-eval-lab`

- 특허명, 기술 설명, 청구항, 관련 사업, 대상 국가 입력
- 채팅형 인터페이스 (사용자 입력 → AI 답변 타이핑 애니메이션)
- 평가 결과: 기술성 / 권리성 / 사업성 점수 + 상세 코멘트
- 과거 평가 이력 목록

---

#### 소멸 예정 관리 `/biz/expiring`

Legal의 `/legal/expiring`과 동일한 UI이되 로그인 사용자의 부서로 자동 필터링됩니다.

---

## 데이터 모델

### 핵심 열거형

```typescript
type UserRole      = 'LEGAL' | 'BUSINESS' | 'ADMIN'
type PatentStatus  = 'REGISTERED' | 'EXPIRED' | 'ABANDONED'
type Grade         = 'S' | 'A' | 'B' | 'C' | 'D'
type ReevalStatus  = 'unassigned' | 'requested' | 'overdue' | 'done'
type Decision      = 'KEEP' | 'DISPOSE'
type Urgency       = 'critical' | 'warn' | 'normal'
type AppStatus     = 'pending' | 'approved' | 'rejected'
```

### User

```typescript
interface User {
  id: string
  name: string
  email: string
  role: UserRole
  departmentId?: number   // BUSINESS 역할만
}
```

### Patent

```typescript
interface Patent {
  id: number
  title: string
  applicationNumber: string
  applicationDate: string       // YYYY-MM-DD
  expiryDate: string
  techField: string             // 'AI/ML' | '반도체' | '통신' | '에너지' | '제조'
  status: PatentStatus
  grade: Grade | null
  tags: string[]
  departments: { departmentId: number; departmentName: string }[]
}
```

### PatentApplication (신규 특허 등록 신청)

```typescript
interface PatentApplication {
  id: number
  title: string
  techField: string
  applicationNumber: string
  submittedAt: string           // YYYY-MM-DD
  submittedBy: string           // 사업부명
  appStatus: AppStatus
  isResubmit: boolean
  rejectionReason?: string
  reviewedAt?: string
}
```

### ReevalItem

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
```

### AiReport

```typescript
interface AiReport {
  patentId: number
  status: 'NONE' | 'GENERATING' | 'COMPLETED' | 'FAILED'
  totalScore: number
  techScore: number
  rightsScore: number
  bizScore: number
  evalBlocks: EvalBlock[]
  similarPatents: SimilarPatent[]
  relatedProjects: RelatedProject[]
  confirmItems: ConfirmItem[]
  refs: string[]
}
```

---

## 비즈니스 규칙

### 재평가 사이클

- **주기**: 3년에 1회
- **상태 전이**:
  ```
  unassigned ──검토요청전송──→ requested
  requested  ──기한초과──────→ overdue
  requested/overdue ──사업부제출──→ done (unread)
  done ──Legal확인──→ done (read)
  ```

### 신규 특허 등록 신청 플로우

```
사업부 신청 (pending)
  └─ Legal 승인 → approved
  └─ Legal 거절 → rejected
       └─ 사업부 수정 후 재신청 → pending (isResubmit: true)
       └─ 사업부 철회 → 목록에서 제거
```

### 긴급도 (소멸 예정)

| urgency | 조건 |
|---------|------|
| `critical` | D-90 이내 |
| `warn` | D-180 이내 |
| `normal` | D-180 초과 |

### 등록료 납부

- 3년 단위 묶음 (제 1-3년분, 제 4-6년분, …)
- 다음 주기 미납 시 권리 소멸 → `EXPIRED`

---

## 디자인 시스템

색상은 `src/assets/base.css` CSS 변수로 관리합니다.

| 토큰 | 값 | 용도 |
|------|----|------|
| `--color-primary` | `#6366f1` | 브랜드 인디고 |
| `--color-keep` | `#16a34a` | 유지 결정 |
| `--color-dispose` | `#dc2626` | 포기 결정 |
| `--color-danger` | `#ef4444` | 위험/긴급 |
| `--color-warn` | `#f59e0b` | 경고 |
| `--color-success` | `#22c55e` | 성공 |

### 사업부 ID 매핑

| deptId | 사업부명 |
|--------|---------|
| 2 | 반도체사업부 |
| 3 | 통신사업부 |
| 4 | 에너지사업부 |
| 5 | 제조사업부 |
