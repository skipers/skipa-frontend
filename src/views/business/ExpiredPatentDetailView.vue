<template>
  <div class="expired-detail">

    <!-- 로딩 -->
    <div v-if="isLoading" class="not-found">
      <p style="color:#64748b">불러오는 중...</p>
    </div>

    <!-- 특허 없음 / 접근 불가 -->
    <div v-else-if="!patent || isActivePatent" class="not-found">
      <div class="not-found__icon">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
      </div>
      <h2 class="not-found__title">특허를 찾을 수 없습니다</h2>
      <p class="not-found__desc">요청한 특허가 존재하지 않습니다.</p>
      <button class="back-btn back-btn--center" @click="$router.back()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 18l-6-6 6-6"/></svg>
        목록으로 돌아가기
      </button>
    </div>

    <template v-else-if="!isActivePatent">

      <!-- ── 헤더 (스크롤과 함께 사라짐) ── -->
      <div class="detail-header-wrap">
        <div class="detail-header">
          <button class="back-btn" @click="$router.back()">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
            담당 특허 관리
          </button>

          <div class="detail-header__main">
            <!-- 상태 스트립 -->
            <div class="status-strip" :class="statusStripClass">
              <div class="status-strip__icon">
                <svg v-if="patent.status === 'EXPIRED'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/>
                </svg>
              </div>
              <span class="status-strip__text">{{ statusSub }}</span>
              <PatentStatusBadge :status="patent.status" />
            </div>

            <div class="detail-header__title-row">
              <div class="detail-header__title-area">
                <h1 class="detail-title">{{ patent.title }}</h1>
                <div class="detail-header__meta">
                  <span class="mono meta-app-num">{{ patent.applicationNumber }}</span>
                  <span class="meta-chip">{{ patentCountry }}</span>
                  <span class="meta-chip meta-chip--dept">{{ patent.dept }}</span>
                </div>
              </div>
              <div v-if="reportGrade" class="grade-badge" :class="`grade-badge--${reportGrade.toLowerCase()}`">
                <span class="grade-badge__label">AI 종합 등급</span>
                <span class="grade-badge__value">{{ reportGrade }}</span>
              </div>
              <div v-else class="grade-badge grade-badge--none">
                <span class="grade-badge__label">AI 종합 등급</span>
                <span class="grade-badge__value" style="font-size:18px;color:#94a3b8">—</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ── 탭바 (sticky: 앱바 바로 아래 고정) ── -->
      <div class="tabs" ref="tabsEl">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="tab"
          :class="{ 'tab--active': activeTab === tab.key }"
          @click="scrollToSection(tab.key)"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- ── 섹션 본문 ── -->
      <div class="sections-body">

        <!-- ── 섹션 1: 특허 원문 ── -->
        <section id="section-info" data-section="info" class="content-section">
          <div class="section-header">
            <h2 class="section-heading">특허 원문</h2>
          </div>

          <div class="info-section">
            <h3 class="info-section__title">기본 정보</h3>
            <div class="info-grid-2col">
              <div class="info-item">
                <p class="info-item__label">특허번호 (출원번호)</p>
                <p class="info-item__value mono">{{ patent.applicationNumber }}</p>
              </div>
              <div class="info-item">
                <p class="info-item__label">출원인</p>
                <p class="info-item__value">SKIPA 주식회사</p>
              </div>
              <div class="info-item">
                <p class="info-item__label">발명자</p>
                <p class="info-item__value">{{ inventor }}</p>
              </div>
              <div class="info-item">
                <p class="info-item__label">IPC 분류</p>
                <p class="info-item__value mono">{{ ipcCode }}</p>
              </div>
              <div class="info-item">
                <p class="info-item__label">출원일</p>
                <p class="info-item__value">{{ formatDate(patent.applicationDate) }}</p>
              </div>
              <div class="info-item">
                <p class="info-item__label">등록일</p>
                <p class="info-item__value">{{ registrationDate }}</p>
              </div>
              <div class="info-item">
                <p class="info-item__label">{{ patent.status === 'ABANDONED' ? '포기일' : '소멸일' }}</p>
                <p class="info-item__value" :class="patent.status === 'ABANDONED' ? 'text-abandoned' : 'text-expired'">
                  {{ formatDate(patent.expiryDate) }}
                </p>
              </div>
              <div class="info-item">
                <p class="info-item__label">키워드 (AI 추출)</p>
                <div class="kw-chip-row">
                  <span v-for="kw in patent.tags" :key="kw" class="kw-chip"># {{ kw }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="info-section">
            <h3 class="info-section__title">발명의 요약</h3>
            <p class="info-text">{{ summary }}</p>
          </div>

          <div class="info-section" style="margin-bottom:0">
            <h3 class="info-section__title">청구항</h3>
            <ol class="claims-list">
              <li v-for="(claim, i) in claims" :key="i" class="claims-list__item">
                <span class="claim-num">{{ i + 1 }}.</span>
                <span>{{ claim }}</span>
              </li>
            </ol>
          </div>
        </section>

        <div class="section-divider"></div>

        <!-- ── 섹션 2: AI 평가 보고서 ── -->
        <section id="section-report" data-section="report" class="content-section">
          <div class="section-header">
            <h2 class="section-heading">AI 평가 보고서</h2>
          </div>

          <template v-if="reportJson">
            <div class="grade-card" :class="reportGrade ? `grade-card--${reportGrade.toLowerCase()}` : ''">
              <div class="grade-card__left">
                <p class="grade-card__label">AI 종합 평가 등급</p>
                <div class="grade-card__grade">{{ reportGrade ?? '—' }}</div>
                <p class="grade-card__opinion">{{ patent.aiOpinion ?? '—' }}</p>
              </div>
              <div class="grade-card__scores">
                <div class="grade-mini-score" v-for="s in miniScores" :key="s.label">
                  <span class="grade-mini-score__label">{{ s.label }}</span>
                  <span class="grade-mini-score__value">{{ s.value }}</span>
                </div>
              </div>
            </div>

            <div class="report-section">
              <div class="report-section__header">
                <div class="report-section__title-row">
                  <span class="report-section__icon report-section__icon--tech">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
                  </span>
                  <span class="report-section__name">기술성</span>
                  <span class="report-section__score">{{ aiScores.tech }}<span class="report-section__score-max">/100</span></span>
                </div>
                <div class="gauge-bar">
                  <div class="gauge-bar__fill gauge-bar__fill--tech" :style="{ width: aiScores.tech + '%' }" />
                </div>
              </div>
              <p class="report-section__comment">{{ aiComments.tech }}</p>
            </div>

            <div class="report-section">
              <div class="report-section__header">
                <div class="report-section__title-row">
                  <span class="report-section__icon report-section__icon--rights">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  </span>
                  <span class="report-section__name">권리성</span>
                  <span class="report-section__score">{{ aiScores.rights }}<span class="report-section__score-max">/100</span></span>
                </div>
                <div class="gauge-bar">
                  <div class="gauge-bar__fill gauge-bar__fill--rights" :style="{ width: aiScores.rights + '%' }" />
                </div>
              </div>
              <p class="report-section__comment">{{ aiComments.rights }}</p>
            </div>

            <div class="report-section">
              <div class="report-section__header">
                <div class="report-section__title-row">
                  <span class="report-section__icon report-section__icon--biz">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
                  </span>
                  <span class="report-section__name">사업성</span>
                  <span class="report-section__score">{{ aiScores.biz }}<span class="report-section__score-max">/100</span></span>
                </div>
                <div class="gauge-bar">
                  <div class="gauge-bar__fill gauge-bar__fill--biz" :style="{ width: aiScores.biz + '%' }" />
                </div>
              </div>
              <p class="report-section__comment">{{ aiComments.biz }}</p>
            </div>
          </template>

          <div v-else class="empty-section">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
            <p>AI 평가 보고서가 생성되지 않았습니다.</p>
          </div>
        </section>

        <div class="section-divider"></div>

        <!-- ── 섹션 3: 유사 특허 분석 ── -->
        <section id="section-similar" data-section="similar" class="content-section">
          <div class="section-header">
            <h2 class="section-heading">유사 특허 분석</h2>
            <span class="badge-count">{{ computedSimilarPatents.length }}건 검색됨</span>
          </div>
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th style="width:140px">유사도 점수</th>
                  <th style="width:180px">출원번호</th>
                  <th>특허명</th>
                  <th>출원인</th>
                  <th style="width:100px">출원일</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="s in computedSimilarPatents" :key="s.id">
                  <td>
                    <div class="similarity-cell">
                      <span class="similarity-score" :class="similarityClass(s.similarityScore)">{{ s.similarityScore }}%</span>
                      <div class="mini-gauge">
                        <div class="mini-gauge__fill" :class="similarityClass(s.similarityScore)" :style="{ width: s.similarityScore + '%' }" />
                      </div>
                    </div>
                  </td>
                  <td><span class="mono text-muted-sm">{{ s.applicationNumber }}</span></td>
                  <td><span class="similar-title">{{ s.title }}</span></td>
                  <td><span class="similar-applicant">{{ s.applicant }}</span></td>
                  <td><span class="text-muted-sm">{{ formatDate(s.applicationDate) }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <div class="section-divider"></div>

        <!-- ── 섹션 4: 연차납부이력 ── -->
        <section id="section-fee" data-section="fee" class="content-section">
          <div class="section-header">
            <h2 class="section-heading">등록료 납부 내역</h2>
          </div>
          <div v-if="!feeRecords.length" class="empty-section">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>
            <p>등록된 연차료 납부 내역이 없습니다.</p>
          </div>
          <table v-else class="fee-table">
            <thead>
              <tr>
                <th>분기</th>
                <th>금액</th>
                <th>납부일</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in feeRecords" :key="row.quarter">
                <td>{{ row.quarter }}</td>
                <td>{{ row.amount.toLocaleString() }} 원</td>
                <td>{{ formatDate(row.paid) }}</td>
                <td>납입</td>
              </tr>
            </tbody>
          </table>
        </section>

        <div class="section-divider"></div>

        <!-- ── 섹션 6: 사내 프로젝트 연관 정보 ── -->
        <section id="section-projects" data-section="projects" class="content-section">
          <div class="section-header">
            <h2 class="section-heading">사내 프로젝트 연관 정보</h2>
            <span class="badge-count">{{ computedRelatedProjects.length }}건</span>
          </div>
          <div class="project-cards">
            <div v-for="proj in computedRelatedProjects" :key="proj.id" class="project-card">
              <div class="project-card__header">
                <div class="project-card__title-row">
                  <span class="project-card__icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
                  </span>
                  <h4 class="project-card__name">{{ proj.projectName }}</h4>
                </div>
                <div class="project-card__meta">
                  <span class="project-dept">{{ proj.department }}</span>
                  <span class="relevance-badge" :class="`relevance-badge--${relevanceClass(proj.relevance)}`">
                    연관도 {{ proj.relevance }}
                  </span>
                </div>
              </div>
              <p class="project-card__desc">{{ proj.description }}</p>
            </div>
          </div>
        </section>

        <div class="section-divider"></div>

        <!-- ── 섹션 7: 제출 의견 ── -->
        <section id="section-opinion" data-section="opinion" class="content-section">
          <div class="section-header">
            <h2 class="section-heading">제출 의견</h2>
          </div>

          <div v-if="!opinionHistories.length" class="empty-section">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
            <p>제출된 의견이 없습니다.</p>
          </div>

          <div v-else class="opinion-history">
            <div
              v-for="(op, idx) in opinionHistories"
              :key="idx"
              class="opinion-item"
              :class="{ 'opinion-item--last': idx === opinionHistories.length - 1 }"
            >
              <div class="opinion-item__header">
                <div class="opinion-item__badge" :class="`opinion-item__badge--${op.decision.toLowerCase()}`">
                  {{ ['KEEP','MAINTAIN'].includes(op.decision) ? '유지' : '포기' }}
                </div>
                <div class="opinion-item__info">
                  <p class="opinion-item__submitter">{{ op.submitter }}</p>
                  <p class="opinion-item__date">{{ formatDate(op.submittedAt) }} 제출</p>
                </div>
              </div>
              <div v-if="op.comment" class="opinion-item__comment">
                <p class="opinion-item__comment-label">제출 의견</p>
                <p class="opinion-item__comment-text">{{ op.comment }}</p>
              </div>
            </div>
          </div>
        </section>

      </div><!-- /sections-body -->

    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import PatentStatusBadge from '@/components/patent/PatentStatusBadge.vue'
import { patentsApi, type PatentDetail } from '@/api/patents'
import { reportsApi } from '@/api/reports'
import { patentHistoryApi, type PatentAnnuityResponse } from '@/api/patentHistory'
import {
  COUNTRY_LABEL,
  MOCK_OPINION_HISTORIES,
} from '@/mocks/data'

const props = defineProps<{ patentId: number }>()

const isLoading = ref(false)
const loadError = ref<string | null>(null)
const patentData = ref<PatentDetail | null>(null)
const reportJson = ref<any>(null)
const reportGrade = computed<string | null>(() => reportJson.value?.valuation?.grade ?? null)
const annuityData = ref<PatentAnnuityResponse[]>([])

function scoreToGrade(score?: number): string | null {
  if (score == null) return null
  if (score >= 90) return 'S'
  if (score >= 75) return 'A'
  if (score >= 60) return 'B'
  return 'C'
}

const patent = computed(() => {
  const d = patentData.value
  if (!d) return null
  return {
    id: d.id,
    title: d.title,
    applicationNumber: d.applicationNumber,
    applicationDate: d.applicationDate,
    registrationDate: d.registrationDate,
    expiryDate: d.expiryDate,
    techField: d.techField ?? '',
    status: d.latestLegalStatus === 'LAPSED' ? 'EXPIRED' : (d.latestLegalStatus ?? 'EXPIRED'),
    dept: d.currentDepartmentName ?? '',
    grade: scoreToGrade(d.latestReportScore),
    aiOpinion: null as string | null,
    tags: d.keywords ?? [],
    inventor: d.inventor ?? '—',
    ipcCodes: d.ipcCodes ?? [],
    summary: d.summary ?? '',
    filingCountry: d.filingCountry,
  }
})

const isActivePatent = computed(() =>
  !!patent.value && patent.value.status !== 'EXPIRED' && patent.value.status !== 'ABANDONED'
)

const patentCountry = computed(() => {
  if (!patent.value) return ''
  const code = patent.value.filingCountry ?? patent.value.applicationNumber.split('-')[0]
  return COUNTRY_LABEL[code] ?? code
})

const inventor  = computed(() => patent.value?.inventor ? patent.value.inventor.replace(/\s*;\s*/g, ', ') : '—')
const ipcCode   = computed(() => patent.value?.ipcCodes[0] ?? '—')
const summary   = computed(() => patent.value?.summary ?? '')

const feeRecords = computed(() =>
  annuityData.value.map(a => ({
    quarter: `제 ${a.startYear} - ${a.endYear} 년분`,
    amount: a.amount,
    paid: a.paidDate ?? a.dueDate,
  }))
)
// TODO: AI 서버 연동 후 교체 필요 — 청구항 데이터는 AI 서버에서 제공
const claims    = computed<string[]>(() => [])

const registrationDate = computed(() => {
  const d = patent.value?.registrationDate
  if (d) return d.slice(0, 10).replace(/-/g, '.')
  if (!patent.value?.applicationDate) return '—'
  const dt = new Date(patent.value.applicationDate)
  dt.setMonth(dt.getMonth() + 18)
  return dt.toISOString().slice(0, 10).replace(/-/g, '.')
})

const statusStripClass = computed(() =>
  patent.value?.status === 'ABANDONED' ? 'status-strip--abandoned' : 'status-strip--expired'
)

const statusSub = computed(() => {
  const d = formatDate(patent.value?.expiryDate)
  return patent.value?.status === 'ABANDONED'
    ? `${d}에 권리가 포기되었습니다`
    : `${d}에 권리가 소멸되었습니다`
})

const aiScores = computed(() => {
  const scores = reportJson.value?.valuation?.scores
  if (!scores) return { tech: 0, rights: 0, biz: 0 }
  const avgScore = (dims: string[]) => {
    const filtered = scores.filter((s: any) => dims.includes(s.dim))
    if (!filtered.length) return 0
    return Math.round(filtered.reduce((acc: number, s: any) => acc + s.score, 0) / filtered.length / 5 * 100)
  }
  return {
    tech:   avgScore(['기술성']),
    rights: avgScore(['권리성']),
    biz:    avgScore(['시장성', '사업성']),
  }
})

const aiComments = computed(() => {
  const scores = reportJson.value?.valuation?.scores
  if (!scores) return { tech: '', rights: '', biz: '', bizSubmit: '' }
  const joinReasons = (dims: string[]) =>
    scores
      .filter((s: any) => dims.includes(s.dim))
      .map((s: any) => s.reason || s.basis || '')
      .filter(Boolean)
      .join(' ')
  return {
    tech:      joinReasons(['기술성']),
    rights:    joinReasons(['권리성']),
    biz:       joinReasons(['시장성', '사업성']),
    bizSubmit: joinReasons(['시장성', '사업성']),
  }
})

const miniScores = computed(() => [
  { label: '기술성', value: aiScores.value.tech },
  { label: '권리성', value: aiScores.value.rights },
  { label: '사업성', value: aiScores.value.biz },
])

// TODO: AI 서버 연동 후 교체 필요 — businessReviewsApi.getBusinessReviewHistory() 연결 필요
const opinionHistories = computed(() => MOCK_OPINION_HISTORIES[props.patentId] ?? [])

// ── 탭 & 스크롤 스파이 ───────────────────────────────
const activeTab = ref('info')
const tabsEl   = ref<HTMLElement | null>(null)

const TOPBAR_H = 60

const tabs = [
  { key: 'info',     label: '특허 원문' },
  { key: 'report',   label: 'AI 평가 보고서' },
  { key: 'similar',  label: '유사 특허 분석' },
  { key: 'fee',      label: '등록료 납부 내역' },
  { key: 'projects', label: '사내 프로젝트 연관 정보' },
  { key: 'opinion',  label: '제출 의견' },
]

function scrollToSection(key: string) {
  const el = document.getElementById(`section-${key}`)
  if (!el) return
  const offset = TOPBAR_H + (tabsEl.value?.offsetHeight ?? 0)
  const top = el.getBoundingClientRect().top + window.scrollY - offset
  window.scrollTo({ top, behavior: 'smooth' })
}

let observer: IntersectionObserver | null = null

function setupObserver() {
  const offset = TOPBAR_H + (tabsEl.value?.offsetHeight ?? 0)
  const intersecting = new Set<string>()

  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const key = (entry.target as HTMLElement).dataset.section
        if (!key) continue
        if (entry.isIntersecting) intersecting.add(key)
        else intersecting.delete(key)
      }
      for (const tab of tabs) {
        if (intersecting.has(tab.key)) {
          activeTab.value = tab.key
          break
        }
      }
    },
    {
      rootMargin: `-${offset + 2}px 0px -55% 0px`,
      threshold: 0,
    }
  )

  for (const tab of tabs) {
    const el = document.getElementById(`section-${tab.key}`)
    if (el) observer.observe(el)
  }
}

async function fetchLatestReport() {
  try {
    const report = await reportsApi.getLatestReport(props.patentId)
    if (report.url) {
      const res = await fetch(report.url)
      reportJson.value = await res.json()
    }
  } catch (e) {
    console.error('AI 보고서 조회 실패:', e)
  }
}

async function fetchAnnuityHistory() {
  try {
    const res = await patentHistoryApi.getAnnuityHistory(props.patentId)
    annuityData.value = res.items
  } catch (e) {
    console.error('연차료 이력 조회 실패:', e)
  }
}

const computedSimilarPatents = computed<any[]>(() => {
  return reportJson.value?.valuation?.similar_patents ?? []
})

const computedRelatedProjects = computed<any[]>(() => {
  const proj = reportJson.value?.valuation?.report?.section_3_project_utilization
  if (!proj) return []
  // TODO: 확인 필요 — section_3_project_utilization이 배열인지 단일 객체인지 서버 응답 확인 필요
  const items = Array.isArray(proj) ? proj : [proj]
  return items.map((p: any, i: number) => ({
    id: i,
    projectName: p.projectName ?? p.service ?? '—',
    department:  p.department ?? '—',
    relevance:   (p.relevance ?? '상') as '상' | '중' | '하',
    description: p.description ?? p.summary ?? '—',
  }))
})

onMounted(async () => {
  isLoading.value = true
  loadError.value = null
  try {
    await Promise.all([
      patentsApi.getPatent(props.patentId).then(d => { patentData.value = d }),
      fetchLatestReport(),
      fetchAnnuityHistory(),
    ])
  } catch (e) {
    console.error('ExpiredPatentDetailView/onMounted:', e)
    loadError.value = '특허 정보를 불러오는 데 실패했습니다.'
  } finally {
    isLoading.value = false
    await nextTick()
    setupObserver()
  }
})

onUnmounted(() => {
  observer?.disconnect()
})

function formatDate(d?: string | null) {
  if (!d) return '—'
  return d.slice(0, 10).replace(/-/g, '.')
}

function similarityClass(score: number) {
  if (score >= 85) return 'high'
  if (score >= 70) return 'mid'
  return 'low'
}

function relevanceClass(r: '상' | '중' | '하') {
  return r === '상' ? 'high' : r === '중' ? 'mid' : 'low'
}
</script>

<style scoped>
.expired-detail {
  font-family: 'Pretendard', sans-serif;
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* ── 특허 없음 ─────────────────────────────── */
.not-found {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; padding: 80px 24px; gap: 12px; text-align: center;
}
.not-found__icon {
  width: 64px; height: 64px; border-radius: 16px;
  background: #f1f5f9; color: #94a3b8;
  display: flex; align-items: center; justify-content: center; margin-bottom: 8px;
}
.not-found__title { font-size: 20px; font-weight: 700; color: #0f172a; margin: 0; }
.not-found__desc  { font-size: 14px; color: #64748b; margin: 0; }

/* ── 뒤로가기 ─────────────────────────────── */
.back-btn {
  display: inline-flex; align-items: center; gap: 6px;
  background: none; border: none; cursor: pointer;
  font-size: 13px; font-weight: 500; color: #64748b; font-family: inherit;
  padding: 6px 0; transition: color 0.13s; width: fit-content;
}
.back-btn:hover { color: #0f172a; }
.back-btn--center {
  margin-top: 8px; padding: 10px 20px;
  background: #f1f5f9; border-radius: 9px; color: #374151;
}

/* ── 헤더 래퍼 (non-sticky) ─────────────────────────── */
.detail-header-wrap { margin-bottom: 20px; }

/* ── 상단 헤더 ───────────────────────────────── */
.detail-header { display: flex; flex-direction: column; gap: 14px; }

.detail-header__main {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 14px 24px 22px;
}

/* ── 상태 스트립 ─────────────────────────────── */
.status-strip {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 0;
  margin-bottom: 18px;
  border-bottom: 1px solid #f1f5f9;
}
.status-strip--expired  { color: #dc2626; }
.status-strip--abandoned { color: #64748b; }

.status-strip__icon {
  width: 24px; height: 24px; border-radius: 6px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.status-strip--expired  .status-strip__icon { background: #fee2e2; }
.status-strip--abandoned .status-strip__icon { background: #f1f5f9; }

.status-strip__text {
  flex: 1;
  font-size: 12.5px; font-weight: 500;
}

.detail-header__title-row {
  display: flex; align-items: flex-start; gap: 20px;
}
.detail-header__title-area { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 10px; }

.detail-title {
  font-size: 22px; font-weight: 700; color: #0f172a;
  line-height: 1.35; letter-spacing: -0.02em; margin: 0;
}

.detail-header__meta {
  display: flex; flex-wrap: wrap; align-items: center; gap: 8px;
}

.meta-app-num {
  font-family: 'JetBrains Mono', 'Consolas', monospace;
  font-size: 12.5px; color: #475569;
  background: #f1f5f9; padding: 3px 8px; border-radius: 6px;
}

.meta-chip {
  display: inline-flex; align-items: center;
  padding: 3px 9px;
  background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 20px;
  font-size: 12px; font-weight: 500; color: #475569;
}
.meta-chip--dept { background: #eef2ff; border-color: #c7d2fe; color: #4338ca; }

/* ── 등급 배지 ───────────────────────────────── */
.grade-badge {
  flex-shrink: 0;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;
  width: 88px; min-height: 88px;
  border-radius: 14px; padding: 14px 12px;
  border: 2px solid transparent;
}
.grade-badge__label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; opacity: 0.7; }
.grade-badge__value { font-size: 44px; font-weight: 900; line-height: 1; }
.grade-badge--s { background: linear-gradient(135deg, #dcfce7, #bbf7d0); border-color: #86efac; color: #14532d; }
.grade-badge--a { background: linear-gradient(135deg, #dbeafe, #bfdbfe); border-color: #93c5fd; color: #1e3a8a; }
.grade-badge--b { background: linear-gradient(135deg, #fff7ed, #fed7aa); border-color: #fdba74; color: #7c2d12; }
.grade-badge--c { background: linear-gradient(135deg, #f1f5f9, #e2e8f0); border-color: #cbd5e1; color: #475569; }
.grade-badge--none { background: #f8fafc; border-color: #e2e8f0; color: #94a3b8; }

/* ── 탭바 (sticky: 앱바 60px 바로 아래) ─────────────── */
.tabs {
  position: sticky;
  top: 60px;
  z-index: 19;
  display: flex; gap: 0;
  border-bottom: 1.5px solid #e2e8f0;
  overflow-x: auto;
  background: #f8fafc;
}
.tabs::-webkit-scrollbar { display: none; }

.tab {
  flex-shrink: 0;
  padding: 12px 18px;
  background: none; border: none; cursor: pointer;
  font-size: 13.5px; font-weight: 500; font-family: inherit; color: #64748b;
  position: relative; transition: color 0.13s; white-space: nowrap;
}
.tab:hover { color: #0f172a; }
.tab--active { color: #4f46e5; font-weight: 700; }
.tab--active::after {
  content: '';
  position: absolute; bottom: -1.5px; left: 0; right: 0;
  height: 2px; background: #4f46e5; border-radius: 2px 2px 0 0;
}

/* ── 섹션 본문 ───────────────────────────────── */
.sections-body {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  overflow: hidden;
  margin-top: 4px;
  margin-bottom: 20px;
}

.content-section { padding: 32px 28px; }

.section-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 24px;
}
.section-heading {
  font-size: 15px; font-weight: 700; color: #0f172a;
  letter-spacing: -0.01em; margin: 0;
}
.section-divider { height: 1px; background: #e2e8f0; }

/* ── 정보 섹션 ───────────────────────────────── */
.info-section { margin-bottom: 32px; }
.info-section:last-child { margin-bottom: 0; }

.info-section__title {
  font-size: 11.5px; font-weight: 700; color: #94a3b8;
  text-transform: uppercase; letter-spacing: 0.07em;
  margin: 0 0 16px; padding-bottom: 10px; border-bottom: 1px solid #f1f5f9;
}

.info-grid-2col {
  display: grid; grid-template-columns: 1fr 1fr; gap: 20px 32px;
}
@media (max-width: 680px) { .info-grid-2col { grid-template-columns: 1fr; } }

.info-item__label {
  font-size: 11.5px; font-weight: 600; color: #94a3b8;
  margin: 0 0 5px; text-transform: uppercase; letter-spacing: 0.04em;
}
.info-item__value { font-size: 14px; color: #0f172a; margin: 0; font-weight: 500; }

.mono { font-family: 'JetBrains Mono', 'Consolas', monospace; font-size: 12.5px; }
.text-expired  { color: #dc2626; font-weight: 600; }
.text-abandoned { color: #64748b; font-weight: 600; }

.kw-chip-row { display: flex; flex-wrap: wrap; gap: 5px; }
.kw-chip {
  padding: 3px 9px; background: #eef2ff; border-radius: 6px;
  font-size: 12px; font-weight: 500; color: #4338ca;
}

.info-text { font-size: 14px; line-height: 1.85; color: #374151; margin: 0; }

/* ── 청구항 ──────────────────────────────────── */
.claims-list {
  list-style: none; margin: 0; padding: 0;
  display: flex; flex-direction: column; gap: 14px;
}
.claims-list__item {
  display: flex; gap: 10px;
  font-size: 13.5px; line-height: 1.8; color: #374151;
  padding: 14px 16px; background: #f8fafc;
  border-radius: 10px; border: 1px solid #f1f5f9;
}
.claim-num { flex-shrink: 0; font-weight: 700; color: #4f46e5; font-size: 13px; margin-top: 1px; min-width: 20px; }

/* ── AI 평가 등급 카드 ──────────────────────── */
.grade-card {
  display: flex; align-items: stretch;
  border-radius: 14px; overflow: hidden; margin-bottom: 24px;
  border: 1.5px solid #e2e8f0;
}
.grade-card--s { border-color: #86efac; }
.grade-card--a { border-color: #93c5fd; }
.grade-card--b { border-color: #fdba74; }
.grade-card--c { border-color: #cbd5e1; }

.grade-card__left {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 6px; padding: 24px 32px; min-width: 140px;
}
.grade-card--s .grade-card__left { background: linear-gradient(135deg, #f0fdf4, #dcfce7); }
.grade-card--a .grade-card__left { background: linear-gradient(135deg, #eff6ff, #dbeafe); }
.grade-card--b .grade-card__left { background: linear-gradient(135deg, #fff7ed, #ffedd5); }
.grade-card--c .grade-card__left { background: linear-gradient(135deg, #f8fafc, #f1f5f9); }

.grade-card__label  { font-size: 10.5px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.06em; }
.grade-card__grade  { font-size: 52px; font-weight: 900; line-height: 1; }
.grade-card--s .grade-card__grade { color: #14532d; }
.grade-card--a .grade-card__grade { color: #1e3a8a; }
.grade-card--b .grade-card__grade { color: #7c2d12; }
.grade-card--c .grade-card__grade { color: #475569; }
.grade-card__opinion { font-size: 12px; font-weight: 600; color: #64748b; }

.grade-card__scores {
  flex: 1; display: flex; align-items: center; justify-content: center;
  padding: 20px 32px; background: #fff; border-left: 1.5px solid #f1f5f9;
}
.grade-mini-score {
  flex: 1; display: flex; flex-direction: column; align-items: center; gap: 5px;
  padding: 0 16px; border-right: 1px solid #f1f5f9;
}
.grade-mini-score:last-child { border-right: none; }
.grade-mini-score__label { font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.04em; }
.grade-mini-score__value { font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.02em; }

/* ── 보고서 항목 ─────────────────────────────── */
.report-section { padding: 20px 0; border-bottom: 1px solid #f1f5f9; }
.report-section:last-of-type { border-bottom: none; }

.report-section__header { margin-bottom: 10px; }
.report-section__title-row { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }

.report-section__icon {
  width: 28px; height: 28px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.report-section__icon--tech   { background: #eef2ff; color: #4f46e5; }
.report-section__icon--rights { background: #f0fdf4; color: #16a34a; }
.report-section__icon--biz    { background: #fff7ed; color: #ea580c; }

.report-section__name  { font-size: 14px; font-weight: 700; color: #0f172a; flex: 1; }
.report-section__score { font-size: 22px; font-weight: 800; color: #0f172a; letter-spacing: -0.02em; }
.report-section__score-max { font-size: 12px; font-weight: 500; color: #94a3b8; }

.gauge-bar { height: 8px; background: #f1f5f9; border-radius: 99px; overflow: hidden; }
.gauge-bar__fill { height: 100%; border-radius: 99px; transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1); }
.gauge-bar__fill--tech   { background: linear-gradient(90deg, #6366f1, #818cf8); }
.gauge-bar__fill--rights { background: linear-gradient(90deg, #22c55e, #4ade80); }
.gauge-bar__fill--biz    { background: linear-gradient(90deg, #f97316, #fb923c); }

.report-section__comment { font-size: 13.5px; line-height: 1.8; color: #475569; margin: 0; }

/* ── 유사 특허 / 프로젝트 공통 ─────────────── */
.badge-count {
  font-size: 12px; font-weight: 600; color: #64748b;
  background: #f1f5f9; padding: 3px 10px; border-radius: 20px;
}
.table-wrap { overflow-x: auto; }

.data-table {
  width: 100%; border-collapse: collapse; font-size: 13px; min-width: 640px;
}
.data-table thead tr { border-bottom: 1.5px solid #e2e8f0; }
.data-table th {
  padding: 10px 14px; text-align: left;
  font-size: 11.5px; font-weight: 600; color: #64748b;
  text-transform: uppercase; letter-spacing: 0.03em;
}
.data-table td { padding: 14px 14px; border-bottom: 1px solid #f8fafc; vertical-align: middle; }
.data-table tbody tr:last-child td { border-bottom: none; }
.data-table tbody tr:hover { background: #fafafa; }

.similarity-cell { display: flex; flex-direction: column; gap: 5px; }
.similarity-score { font-size: 13px; font-weight: 700; }
.similarity-score.high { color: #dc2626; }
.similarity-score.mid  { color: #d97706; }
.similarity-score.low  { color: #64748b; }

.mini-gauge { height: 4px; background: #f1f5f9; border-radius: 99px; width: 80px; overflow: hidden; }
.mini-gauge__fill { height: 100%; border-radius: 99px; }
.mini-gauge__fill.high { background: #ef4444; }
.mini-gauge__fill.mid  { background: #f59e0b; }
.mini-gauge__fill.low  { background: #94a3b8; }

.similar-title    { font-size: 13px; color: #0f172a; font-weight: 500; }
.similar-applicant { font-size: 12.5px; color: #64748b; }
.text-muted-sm    { font-size: 12px; color: #94a3b8; font-family: 'JetBrains Mono', monospace; }

/* ── 사내 프로젝트 카드 ──────────────────────── */
.project-cards { display: flex; flex-direction: column; gap: 12px; }

.project-card {
  border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px 20px;
  display: flex; flex-direction: column; gap: 10px; transition: box-shadow 0.15s;
}
.project-card:hover { box-shadow: 0 4px 16px rgba(15,23,42,0.06); }

.project-card__header { display: flex; flex-direction: column; gap: 8px; }
.project-card__title-row { display: flex; align-items: center; gap: 10px; }
.project-card__icon {
  width: 28px; height: 28px; background: #eef2ff; color: #4f46e5;
  border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.project-card__name { font-size: 15px; font-weight: 700; color: #0f172a; margin: 0; }
.project-card__meta { display: flex; align-items: center; gap: 8px; }

.project-dept {
  font-size: 12px; font-weight: 500; color: #64748b;
  background: #f1f5f9; padding: 2px 8px; border-radius: 5px;
}
.relevance-badge { font-size: 12px; font-weight: 700; padding: 2px 9px; border-radius: 5px; }
.relevance-badge--high { background: #fef2f2; color: #dc2626; }
.relevance-badge--mid  { background: #fffbeb; color: #b45309; }
.relevance-badge--low  { background: #f8fafc; color: #64748b; }

.project-card__desc { font-size: 13.5px; line-height: 1.75; color: #475569; margin: 0; }

/* ── 제출 의견 이력 ──────────────────────────── */
.opinion-history { display: flex; flex-direction: column; }

.opinion-item {
  display: flex; flex-direction: column; gap: 12px;
  padding: 18px 0; border-bottom: 1px solid #f1f5f9;
}
.opinion-item:first-child { padding-top: 0; }
.opinion-item--last { border-bottom: none; padding-bottom: 0; }

.opinion-item__header { display: flex; align-items: center; gap: 16px; }

.opinion-item__badge {
  display: flex; align-items: center; justify-content: center;
  width: 60px; height: 60px; border-radius: 14px;
  font-size: 18px; font-weight: 800; flex-shrink: 0;
}
.opinion-item__badge--keep     { background: #f0fdf4; color: #15803d; border: 2px solid #86efac; }
.opinion-item__badge--maintain { background: #f0fdf4; color: #15803d; border: 2px solid #86efac; }
.opinion-item__badge--dispose  { background: #fef2f2; color: #dc2626; border: 2px solid #fca5a5; }
.opinion-item__badge--abandon  { background: #fef2f2; color: #dc2626; border: 2px solid #fca5a5; }

.opinion-item__info { display: flex; flex-direction: column; gap: 3px; }
.opinion-item__submitter { font-size: 14px; font-weight: 600; color: #0f172a; margin: 0; }
.opinion-item__date { font-size: 12.5px; color: #94a3b8; margin: 0; }

.opinion-item__comment {
  padding: 16px 18px; background: #f8fafc;
  border: 1px solid #f1f5f9; border-radius: 10px;
}
.opinion-item__comment-label {
  font-size: 11.5px; font-weight: 700; color: #94a3b8;
  text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 6px;
}
.opinion-item__comment-text { font-size: 13.5px; line-height: 1.75; color: #374151; margin: 0; }

/* ── 빈 섹션 ─────────────────────────────────── */
.empty-section {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 10px; padding: 48px 24px; text-align: center; color: #94a3b8;
}
.empty-section p { font-size: 14px; font-weight: 500; margin: 0; }

/* ── 연차납부이력 테이블 ───────────────────────── */
.fee-table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
.fee-table thead th { padding: 10px 14px; text-align: left; font-size: 12px; font-weight: 600; color: #64748b; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
.fee-table tbody td { padding: 12px 14px; border-bottom: 1px solid #f1f5f9; color: #374151; }
.fee-table tbody tr:hover td { background: #f8fafc; }
</style>
