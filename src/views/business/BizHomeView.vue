<template>
  <div class="biz-home">

    <!-- 인사 헤더 -->
    <div class="greeting">
      <h2 class="greeting__title">안녕하세요, <span>{{ auth.user?.name ?? '사업부' }}</span> 👋</h2>
      <p class="greeting__desc">담당 특허의 유지/포기 의견을 제출해주세요</p>
    </div>

    <!-- 제출 현황 요약 -->
    <div class="summary-card">
      <div class="summary-dday" :class="{ 'summary-dday--urgent': ddayValue <= 7 }">
        <p class="summary-dday__label">제출 마감까지</p>
        <p class="summary-dday__val">{{ ddayValue <= 0 ? 'D-DAY' : `D-${ddayValue}` }}</p>
        <p class="summary-dday__date">{{ deadlineStr }}</p>
      </div>
      <div class="summary-stats">
        <div class="summary-stat">
          <p class="summary-stat__num">{{ totalCount }}</p>
          <p class="summary-stat__label">전체 담당</p>
        </div>
        <div class="summary-divider" />
        <div class="summary-stat summary-stat--done">
          <p class="summary-stat__num">{{ submittedCount }}</p>
          <p class="summary-stat__label">제출 완료</p>
        </div>
        <div class="summary-divider" />
        <div class="summary-stat summary-stat--pending">
          <p class="summary-stat__num">{{ pendingCount }}</p>
          <p class="summary-stat__label">미제출</p>
        </div>
      </div>
      <div class="summary-progress">
        <div class="summary-progress__header">
          <span class="summary-progress__label">이번 분기 제출률</span>
          <span class="summary-progress__pct">{{ submitPct }}%</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" :style="{ width: submitPct + '%' }" />
        </div>
      </div>
    </div>

    <!-- 메인 2열 -->
    <div class="main-row">

      <!-- 미제출 특허 -->
      <div class="card">
        <div class="card__header">
          <div class="card__header-left">
            <h3 class="card__title">미제출 특허</h3>
            <span class="card__badge">전체 {{ pendingItems.length }}건</span>
          </div>
          <RouterLink to="/biz/review?filter=pending" class="card__link">전체 보기</RouterLink>
        </div>
        <div v-if="pendingItems.length" class="pending-list">
          <div
            v-for="item in pendingItems.slice(0, 5)"
            :key="item.id"
            class="pending-item"
            @click="router.push(`/biz/review/${item.id}`)"
          >
            <div class="pending-item__dot" />
            <span class="pending-item__title">{{ item.title }}</span>
            <svg class="pending-item__arrow" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </div>
        </div>
        <div v-else class="card__empty card__empty--success">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          <p>모든 특허 의견을 제출했습니다</p>
        </div>
      </div>

      <!-- 최근 제출 이력 -->
      <div class="card">
        <div class="card__header">
          <div class="card__header-left">
            <h3 class="card__title">최근 제출 이력</h3>
            <span class="card__badge">전체 {{ recentSubmissions.length }}건</span>
          </div>
          <RouterLink to="/biz/history" class="card__link">전체 보기</RouterLink>
        </div>
        <div v-if="loading" class="card__skel">
          <div class="skel-row" v-for="n in 4" :key="n" />
        </div>
        <div v-else-if="recentSubmissions.length" class="submission-list">
          <div v-for="s in recentSubmissions.slice(0, 5)" :key="s.id" class="submission-item">
            <div class="submission-item__left">
              <div class="submission-item__icon" :class="`sub-icon--${s.decision.toLowerCase()}`">
                <!-- 유지 -->
                <svg v-if="s.decision === 'MAINTAIN'" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <!-- 포기/소멸 -->
                <svg v-else width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14H6L5 6"/>
                  <path d="M10 11v6M14 11v6"/>
                  <path d="M9 6V4h6v2"/>
                </svg>
              </div>
              <div>
                <p class="submission-item__title">{{ s.patentTitle }}</p>
                <p class="submission-item__date">{{ formatDate(s.decidedAt) }}</p>
              </div>
            </div>
            <span class="decision-badge" :class="`decision-badge--${s.decision.toLowerCase()}`">
              {{ decisionLabel(s.decision) }}
            </span>
          </div>
        </div>
        <div v-else class="card__empty">제출 이력이 없습니다.</div>
      </div>

    </div>

    <hr class="section-divider"/>

    <!-- 신규 신청 현황 + 담당 특허 현황 + 연도별 추이 -->
    <div class="charts-row">

      <!-- 신규 특허 신청 현황 -->
      <div class="card">
        <div class="card__header">
          <div class="card__header-left">
            <h3 class="card__title">신규 특허 신청 현황</h3>
            <span class="card__badge">전체 {{ applications.length }}건</span>
          </div>
          <RouterLink to="/biz/register?tab=history" class="card__link">전체 보기</RouterLink>
        </div>
        <div v-if="recentApplications.length" class="app-list">
          <div v-for="a in recentApplications" :key="a.id" class="app-item">
            <div class="app-item__left">
              <span class="app-status-badge" :class="`app-status--${a.appStatus}`">
                {{ appStatusLabel(a.appStatus) }}
              </span>
              <p class="app-item__title">{{ a.title }}</p>
            </div>
            <p class="app-item__date">{{ formatDate(a.submittedAt) }}</p>
          </div>
        </div>
        <div v-else class="card__empty">신청 이력이 없습니다.</div>
      </div>

      <!-- 담당 특허 현황 (도넛) -->
      <div class="card">
        <div class="card__header">
          <h3 class="card__title">담당 특허 현황</h3>
          <RouterLink to="/biz/patents" class="card__link">특허 관리</RouterLink>
        </div>
        <div v-if="patentTotal === 0" class="card__empty">담당 특허가 없습니다.</div>
        <div v-else class="donut-wrap">
          <svg class="patent-donut" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="50" fill="none" stroke="#f1f5f9" stroke-width="20"/>
            <circle
              v-for="(seg, i) in patentDonutSegs" :key="i"
              cx="60" cy="60" r="50"
              fill="none"
              :stroke="patentStatItems[i].color"
              stroke-width="20"
              :stroke-dasharray="`${seg.dash} ${314 - seg.dash}`"
              :stroke-dashoffset="seg.offset"
              stroke-linecap="butt"
            />
            <text x="60" y="54" text-anchor="middle" font-size="16" font-weight="800" fill="#0f172a">{{ patentTotal }}</text>
            <text x="60" y="70" text-anchor="middle" font-size="9" font-weight="600" fill="#475569">총 특허</text>
          </svg>
          <div class="patent-legend">
            <div v-for="s in patentStatItems" :key="s.label" class="patent-legend-item">
              <span class="patent-legend-dot" :style="{ background: s.color }"/>
              <span class="patent-legend-label">{{ s.label }}</span>
              <span class="patent-legend-count" :style="{ color: s.color }">{{ s.count }}건</span>
              <span class="patent-legend-pct">{{ s.pct }}%</span>
            </div>
          </div>
        </div>

      </div>

      <!-- 연도별 출원·소멸/포기 추이 -->
      <div class="card">
        <div class="card__header">
          <h3 class="card__title">연도별 출원 · 소멸/포기 추이</h3>
          <div class="trend-legend">
            <span class="trend-legend-item">
              <span class="trend-dot" style="background:#ABACED"/>출원
            </span>
            <span class="trend-legend-item">
              <span class="trend-dot" style="background:#E88989"/>소멸/포기
            </span>
          </div>
        </div>
        <div class="trend-body" ref="trendBodyRef">
          <svg class="biz-trend-svg" :viewBox="`0 0 ${tW} ${tH}`">
            <!-- 배경 격자 -->
            <line v-for="n in 4" :key="n"
              :x1="tPad.l" :y1="tPad.t + ((n - 1) / 3) * tPlotH"
              :x2="tW - tPad.r" :y2="tPad.t + ((n - 1) / 3) * tPlotH"
              stroke="#f1f5f9" stroke-width="1"/>
            <!-- 출원 선 -->
            <polyline :points="filedPoints" fill="none" stroke="#ABACED" stroke-width="1.5"
              stroke-linejoin="round" stroke-linecap="round"/>
            <!-- 소멸/포기 선 -->
            <polyline :points="expiredPoints" fill="none" stroke="#E88989" stroke-width="1.5"
              stroke-linejoin="round" stroke-linecap="round"/>
            <!-- 출원 점 -->
            <circle v-for="(d, i) in bizTrendData" :key="`f${i}`"
              :cx="tX(i)" :cy="tY(d.filed)" r="3" fill="#fff" stroke="#ABACED" stroke-width="1.5"/>
            <!-- 소멸/포기 점 -->
            <circle v-for="(d, i) in bizTrendData" :key="`e${i}`"
              :cx="tX(i)" :cy="tY(d.expired)" r="3" fill="#fff" stroke="#E88989" stroke-width="1.5"/>
            <!-- X축 연도 라벨 -->
            <text v-for="(d, i) in bizTrendData" :key="`lbl${i}`"
              :x="tX(i)" :y="tH - 3"
              text-anchor="middle" font-size="9" fill="#94a3b8" font-weight="500">{{ d.year }}</text>
            <!-- 호버 히트 영역 (연도별 세로 띠) -->
            <rect
              v-for="(d, i) in bizTrendData" :key="`hit${i}`"
              :x="tX(i) - tHitHalfW(i)"
              :y="tPad.t"
              :width="tHitHalfW(i) * 2"
              :height="tPlotH"
              fill="transparent"
              style="cursor: default"
              @mouseenter="(e) => showTrendTooltip(e, d)"
              @mouseleave="hideTrendTooltip"
            />
          </svg>
          <!-- 툴팁 -->
          <div
            v-if="trendTooltip.visible"
            class="trend-tooltip"
            :style="{ left: trendTooltip.x + 'px', top: trendTooltip.y + 'px' }"
          >
            <p class="trend-tooltip__year">{{ trendTooltip.year }}년</p>
            <div class="trend-tooltip__row">
              <span class="trend-tooltip__dot" style="background:#ABACED"/>
              <span class="trend-tooltip__label">출원</span>
              <span class="trend-tooltip__val">{{ trendTooltip.filed }}건</span>
            </div>
            <div class="trend-tooltip__row">
              <span class="trend-tooltip__dot" style="background:#E88989"/>
              <span class="trend-tooltip__label">소멸/포기</span>
              <span class="trend-tooltip__val">{{ trendTooltip.expired }}건</span>
            </div>
          </div>
        </div>
      </div>

    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { dashboardApi, type BusinessDashboardResponse } from '@/api/dashboard'
import { usePatentApplications } from '@/composables/usePatentApplications'

const auth   = useAuthStore()
const router = useRouter()
const loading = ref(false)
const error = ref<string | null>(null)
const dashboardData = ref<BusinessDashboardResponse | null>(null)

// ── 마감일 (reviewCycle.endDate 우선, 없으면 현재 분기 말일) ──
const deadline = computed(() => {
  const endDate = dashboardData.value?.reviewCycle?.endDate
  if (endDate) return new Date(endDate)
  const d = new Date()
  const q = Math.ceil((d.getMonth() + 1) / 3)
  return new Date(d.getFullYear(), q * 3, 0)
})

const ddayValue = computed(() =>
  Math.max(0, Math.ceil((deadline.value.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
)

const deadlineStr = computed(() =>
  deadline.value.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
)

const quarterLabel = computed(() => {
  const rc = dashboardData.value?.reviewCycle
  if (rc) return `${rc.year}년 ${rc.quarter}분기`
  const d = new Date()
  return `${d.getFullYear()}년 ${Math.ceil((d.getMonth() + 1) / 3)}분기`
})

// ── KPI ──────────────────────────────────────────────
const totalCount     = computed(() => dashboardData.value?.kpi.total     ?? 0)
const submittedCount = computed(() => dashboardData.value?.kpi.submitted ?? 0)
const pendingCount   = computed(() => totalCount.value - submittedCount.value)
const submitPct      = computed(() =>
  totalCount.value ? Math.round((submittedCount.value / totalCount.value) * 100) : 0
)

// ── 미제출 특허 ──────────────────────────────────────
const pendingItems = computed(() =>
  (dashboardData.value?.pendingPatents ?? []).map(p => ({ id: p.patentId, title: p.title }))
)

// ── 최근 제출 이력 ────────────────────────────────────
const recentSubmissions = computed(() =>
  (dashboardData.value?.recentSubmissions ?? []).map(s => ({
    id: s.reviewId,
    decision: s.opinion,
    patentTitle: s.title,
    decidedAt: s.submittedAt,
  }))
)

// ── 신규 특허 신청 (usePatentApplications composable) ─
const { applications } = usePatentApplications()
const recentApplications = computed(() =>
  [...applications.value]
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
    .slice(0, 5)
)

function appStatusLabel(s: string) {
  return { pending: '검토중', approved: '승인', rejected: '거절', withdrawn: '철회' }[s] ?? s
}

// ── 담당 특허 현황 도넛 ──────────────────────────────
const patentStatItems = computed(() => {
  const active   = dashboardData.value?.patentStatus.active   ?? 0
  const inactive = dashboardData.value?.patentStatus.inactive ?? 0
  const total    = active + inactive
  return [
    { label: '등록',      count: active,   color: '#67E2AB', pct: total ? Math.round((active   / total) * 100) : 0 },
    { label: '소멸/포기', count: inactive, color: '#E88989', pct: total ? Math.round((inactive / total) * 100) : 0 },
  ]
})

const patentTotal = computed(() => patentStatItems.value.reduce((s, i) => s + i.count, 0))

const patentDonutSegs = computed(() => {
  const circ  = 314
  const total = patentTotal.value || 1
  let offset  = -circ / 4
  return patentStatItems.value.map(item => {
    const dash = Math.round((item.count / total) * circ)
    const seg  = { dash, offset }
    offset -= dash
    return seg
  })
})

// ── 연도별 추이 ──────────────────────────────────────
const bizTrendData = computed(() =>
  (dashboardData.value?.yearlyTrends ?? []).map(t => ({
    year:    String(t.year),
    filed:   t.applications,
    expired: t.expiredOrAbandoned,
  }))
)

const tW = 540, tH = 130
const tPad   = { t: 28, b: 22, l: 18, r: 12 }
const tPlotH = tH - tPad.t - tPad.b
const tPlotW = tW - tPad.l - tPad.r

const tMaxVal = computed(() =>
  Math.max(...bizTrendData.value.flatMap(d => [d.filed, d.expired]), 1)
)

function tX(i: number) {
  const len = bizTrendData.value.length
  return tPad.l + (len > 1 ? i / (len - 1) : 0) * tPlotW
}
function tY(v: number) { return tPad.t + (1 - v / tMaxVal.value) * tPlotH }

const filedPoints   = computed(() => bizTrendData.value.map((d, i) => `${tX(i)},${tY(d.filed)}`).join(' '))
const expiredPoints = computed(() => bizTrendData.value.map((d, i) => `${tX(i)},${tY(d.expired)}`).join(' '))

function tHitHalfW(i: number) {
  const len = bizTrendData.value.length
  if (len <= 1) return tPlotW / 2
  const step = tPlotW / (len - 1)
  return step / 2
}

const trendBodyRef = ref<HTMLElement | null>(null)
const trendTooltip = ref({ visible: false, x: 0, y: 0, year: '', filed: 0, expired: 0 })

function showTrendTooltip(event: MouseEvent, d: { year: string; filed: number; expired: number }) {
  const container = trendBodyRef.value
  if (!container) return
  const rect = container.getBoundingClientRect()
  let x = event.clientX - rect.left + 12
  let y = event.clientY - rect.top - 72
  if (x + 130 > rect.width) x = event.clientX - rect.left - 140
  if (y < 0) y = event.clientY - rect.top + 12
  trendTooltip.value = { visible: true, x, y, year: d.year, filed: d.filed, expired: d.expired }
}

function hideTrendTooltip() {
  trendTooltip.value.visible = false
}

function decisionLabel(d: string) {
  return ({ MAINTAIN: '등록', DISPOSE: '포기', ABANDON: '포기'} as Record<string, string>)[d] ?? d
}
function formatDate(d?: string) {
  if (!d) return '—'
  return d.replace(/-/g, '.').slice(0, 10)
}

async function fetchDashboard() {
  loading.value = true
  error.value = null
  try {
    dashboardData.value = await dashboardApi.getBusinessDashboard()
  } catch (e) {
    console.error('비즈니스 대시보드 조회 실패:', e)
    error.value = '데이터를 불러오지 못했습니다.'
  } finally {
    loading.value = false
  }
}

onMounted(fetchDashboard)
</script>

<style scoped>
.biz-home {
  display: flex;
  flex-direction: column;
  gap: 16px;
  font-family: 'Pretendard', sans-serif;
}

/* ── 인사 헤더 ───────────────────────────────────────── */
.greeting { margin-bottom: 4px; }


.greeting__title {
  font-size: 24px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 4px;
  letter-spacing: -0.02em;
}
.greeting__title span { color: #4f46e5; }

.greeting__desc { font-size: 13.5px; color: #64748b; margin: 0; }

/* ── 요약 카드 ────────────────────────────────────────── */
.summary-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 22px 28px;
  display: flex;
  align-items: center;
  gap: 28px;
}

.summary-dday {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #eef2ff;
  border-radius: 14px;
  padding: 14px 36px;
  text-align: center;
  gap: 2px;
}
.summary-dday--urgent { background: #fef2f2; }

.summary-dday__label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: .07em;
  text-transform: uppercase;
  color: #818cf8;
  margin: 0;
}
.summary-dday--urgent .summary-dday__label { color: #f87171; }

.summary-dday__val {
  font-size: 30px;
  font-weight: 900;
  color: #4338ca;
  letter-spacing: -0.04em;
  line-height: 1.1;
  margin: 2px 0;
}
.summary-dday--urgent .summary-dday__val { color: #dc2626; }

.summary-dday__date {
  font-size: 10.5px;
  color: #a5b4fc;
  margin: 0;
}
.summary-dday--urgent .summary-dday__date { color: #fca5a5; }

.summary-stats {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.summary-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 28px;
}
.summary-stat:first-child { padding-left: 0; }

.summary-stat__num {
  font-size: 34px;
  font-weight: 900;
  color: #0f172a;
  letter-spacing: -0.04em;
  line-height: 1;
  margin: 0 0 4px;
}
.summary-stat--done .summary-stat__num    { color: #16a34a; }
.summary-stat--pending .summary-stat__num { color: #d97706; }

.summary-stat__label {
  font-size: 11.5px;
  font-weight: 500;
  color: #94a3b8;
  margin: 0;
  white-space: nowrap;
}

.summary-divider {
  width: 1px;
  height: 40px;
  background: #e2e8f0;
  flex-shrink: 0;
}

.summary-progress {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.summary-progress__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.summary-progress__label { font-size: 12.5px; font-weight: 600; color: #475569; }
.summary-progress__pct   { font-size: 15px; font-weight: 800; color: #4f46e5; }

.progress-track {
  height: 10px;
  background: #f1f5f9;
  border-radius: 5px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4f46e5, #818cf8);
  border-radius: 5px;
  transition: width .6s cubic-bezier(.4,0,.2,1);
}

/* ── 메인 2열 ─────────────────────────────────────────── */
.main-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
@media (max-width: 640px) { .main-row { grid-template-columns: 1fr; } }

/* ── 공통 카드 ────────────────────────────────────────── */
.card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 20px 22px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.card__header-left { display: flex; align-items: center; gap: 8px; }
.card__title { font-size: 14px; font-weight: 700; color: #0f172a; margin: 0; }
.card__link  { font-size: 12.5px; font-weight: 500; color: #6366f1; text-decoration: none; }
.card__link:hover { color: #4338ca; }

.card__badge {
  font-size: 11.5px;
  font-weight: 600;
  color: #64748b;
  background: #f1f5f9;
  padding: 2px 8px;
  border-radius: 20px;
}

.card__count-badge {
  font-size: 11.5px;
  font-weight: 700;
  padding: 2px 9px;
  background: #fef9c3;
  color: #854d0e;
  border-radius: 20px;
}

.card__empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: #94a3b8;
  text-align: center;
}
.card__empty--success {
  color: #22c55e;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.card__empty--success p { margin: 0; color: #15803d; font-weight: 500; }

.card__skel { display: flex; flex-direction: column; gap: 8px; }
.skel-row {
  height: 40px; border-radius: 8px;
  background: linear-gradient(90deg, #f1f5f9 25%, #e8edf5 50%, #f1f5f9 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

/* ── 미제출 특허 ─────────────────────────────────────── */
.pending-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.pending-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 10px;
  cursor: pointer;
  transition: background .12s, border-color .12s;
}
.pending-item:hover { background: #fef3c7; border-color: #fcd34d; }

.pending-item__dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  background: #f59e0b;
  flex-shrink: 0;
}

.pending-item__title {
  flex: 1;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pending-item__arrow { color: #d97706; flex-shrink: 0; }

/* ── 최근 제출 이력 ──────────────────────────────────── */
.submission-list { display: flex; flex-direction: column; gap: 0; }

.submission-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #f8fafc;
}
.submission-item:last-child { border-bottom: none; }

.submission-item__left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.submission-item__icon {
  width: 32px; height: 32px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
}
.sub-icon--keep     { background: #f0fdf4; color: #16a34a; }
.sub-icon--maintain { background: #f0fdf4; color: #16a34a; }
.sub-icon--sell     { background: #eef2ff; color: #4338ca; }
.sub-icon--dispose  { background: #fef2f2; color: #dc2626; }
.sub-icon--abandon  { background: #fef2f2; color: #dc2626; }

.submission-item__title {
  font-size: 13px; font-weight: 600; color: #0f172a;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  margin: 0 0 2px;
}
.submission-item__date { font-size: 11.5px; color: #94a3b8; margin: 0; }

.decision-badge {
  padding: 3px 9px; border-radius: 6px;
  font-size: 12px; font-weight: 700; flex-shrink: 0;
}
.decision-badge--keep     { background: #f0fdf4; color: #15803d; }
.decision-badge--maintain { background: #f0fdf4; color: #15803d; }
.decision-badge--sell     { background: #eef2ff; color: #4338ca; }
.decision-badge--dispose  { background: #fef2f2; color: #dc2626; }
.decision-badge--abandon  { background: #fef2f2; color: #dc2626; }

/* ── 신규 특허 신청 현황 ──────────────────────────────── */
.app-list { display: flex; flex-direction: column; gap: 0; }

.app-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid #f8fafc;
}
.app-item:last-child { border-bottom: none; }

.app-item__left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.app-item__title {
  font-size: 13px;
  font-weight: 600;
  color: #0f172a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin: 0;
}

.app-item__date { font-size: 11.5px; color: #94a3b8; margin: 0; white-space: nowrap; flex-shrink: 0; }

.app-status-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 11.5px;
  font-weight: 700;
  white-space: nowrap;
  flex-shrink: 0;
}
.app-status--pending   { background: #fef9c3; color: #854d0e; }
.app-status--approved  { background: #f0fdf4; color: #15803d; }
.app-status--rejected  { background: #fef2f2; color: #dc2626; }
.app-status--withdrawn { background: #f1f5f9; color: #64748b; }

/* ── 구분선 ──────────────────────────────────────────── */
.section-divider {
  border: none;
  border-top: 1px solid #e2e8f0;
  margin: 0;
}

/* ── 하단 차트 2열 ───────────────────────────────────── */
.charts-row {
  display: grid;
  grid-template-columns: 1fr 1fr 2fr;
  gap: 16px;
}
@media (max-width: 960px) { .charts-row { grid-template-columns: 1fr 1fr; } }
@media (max-width: 640px) { .charts-row { grid-template-columns: 1fr; } }

/* ── 담당 특허 도넛 ──────────────────────────────────── */
.donut-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  flex: 1;
}

.patent-donut {
  width: 130px; height: 130px;
  flex-shrink: 0;
  transform: rotate(-90deg);
}
.patent-donut text {
  transform: rotate(90deg);
  transform-origin: 60px 60px;
}

.patent-legend {
  display: flex;
  flex-direction: row;
  gap: 20px;
  justify-content: center;
  width: 100%;
}
.patent-legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
}
.patent-legend-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.patent-legend-label { color: #374151; font-weight: 500; }
.patent-legend-count { font-weight: 700; }
.patent-legend-pct { color: #94a3b8; }

/* ── 연도별 추이 꺾은선 ──────────────────────────────── */
.trend-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.biz-trend-svg {
  width: 100%;
  height: auto;
  display: block;
  overflow: visible;
}

.trend-legend {
  display: flex;
  gap: 12px;
}
.trend-legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11.5px;
  color: #64748b;
}
.trend-dot {
  display: inline-block;
  width: 7px; height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* ── 연도별 추이 툴팁 ─────────────────────────────────── */
.trend-body { position: relative; }

.trend-tooltip {
  position: absolute;
  pointer-events: none;
  background: #1e293b;
  border-radius: 8px;
  padding: 8px 11px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  white-space: nowrap;
  z-index: 10;
  box-shadow: 0 4px 12px rgba(0,0,0,.18);
}

.trend-tooltip__year {
  font-size: 11px;
  font-weight: 700;
  color: #94a3b8;
  margin: 0 0 2px;
}

.trend-tooltip__row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.trend-tooltip__dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.trend-tooltip__label {
  font-size: 12px;
  color: #cbd5e1;
  flex: 1;
}

.trend-tooltip__val {
  font-size: 12px;
  font-weight: 700;
  color: #f1f5f9;
}
</style>
