<template>
  <div class="legal-home">

    <!-- 인사 헤더 -->
    <div class="greeting">
      <div class="greeting__left">

        <h2 class="greeting__title">안녕하세요, <span>{{ auth.user?.name ?? 'Legal AI팀' }}</span> 👋</h2>
      </div>
      <div class="greeting__right">
        <RouterLink to="/legal/reevaluation" class="btn-goto">
          이번 분기 재평가 관리
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </RouterLink>
      </div>
    </div>

    <!-- KPI 카드 행 -->
    <div class="kpi-row">
      <!-- 분기 진행률 (독립 카드) -->
      <div class="kpi-card kpi-card--progress">
        <div class="kpi-card__header">
          <span class="kpi-card__label">{{ progressCard.label }}</span>
          <span class="kpi-card__icon" :style="{ background: progressCard.iconBg, color: progressCard.iconColor }">
            <span v-html="progressCard.icon" />
          </span>
        </div>
        <p class="kpi-card__value">{{ progressCard.value ?? '—' }}</p>
        <div v-if="progressCard.sub" class="kpi-card__sub">{{ progressCard.sub }}</div>
        <div class="kpi-progress">
          <div class="kpi-progress__fill" :style="{ width: progressCard.progress + '%', background: progressCard.progressColor }" />
        </div>
      </div>

      <!-- 세로 구분선 -->
      <div class="kpi-vdivider" />

      <!-- 흐름 카드: 요청 전 > 요청 완료 > 지연 > 결정 완료 -->
      <template v-for="(kpi, i) in kpiCards" :key="kpi.label">
        <component
          :is="kpi.tab ? 'RouterLink' : 'div'"
          :to="kpi.tab ? `/legal/reevaluation?tab=${kpi.tab}` : undefined"
          class="kpi-card"
          :class="{ 'kpi-card--alert': kpi.alert, 'kpi-card--link': !!kpi.tab }"
        >
          <div class="kpi-card__header">
            <span class="kpi-card__label">{{ kpi.label }}</span>
            <span class="kpi-card__icon" :style="{ background: kpi.iconBg, color: kpi.iconColor }">
              <span v-html="kpi.icon" />
            </span>
          </div>
          <p class="kpi-card__value" :style="{ color: kpi.valueColor }">{{ kpi.value ?? '—' }}</p>
          <div v-if="kpi.sub" class="kpi-card__sub">
            <span v-if="kpi.alert" class="kpi-card__alert-badge">{{ kpi.alertCount }}건 지연</span>
            <span v-else>{{ kpi.sub }}</span>
          </div>
        </component>
        <div v-if="i < kpiCards.length - 1" class="kpi-arrow">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </div>
      </template>
    </div>

    <!-- 중간 행: 미확인 회신 + 사업부별 처리 현황 + 배정 현황 -->
    <div class="mid-row">

      <!-- 미확인 회신 -->
      <div class="card">
        <div class="card__header">
          <h3 class="card__title">미확인 회신</h3>
          <RouterLink to="/legal/reevaluation?tab=unread" class="card__link">전체 보기</RouterLink>
        </div>
        <div v-if="loadingSummary" class="card__skeleton">
          <div class="skel skel--row" v-for="n in 4" :key="n" />
        </div>
        <div v-else class="reply-list">
          <TransitionGroup v-if="recentReplies.length" tag="div" name="reply-fade" class="reply-items">
            <div
              v-for="r in recentReplies" :key="r.id"
              class="reply-item"
              @click="openReply(r.id)"
            >
              <div class="reply-item__left">
                <div class="reply-item__avatar">{{ r.dept.charAt(0) }}</div>
                <div>
                  <p class="reply-item__title">{{ r.patent }}</p>
                  <p class="reply-item__dept">{{ r.dept }}</p>
                </div>
              </div>
              <span class="reply-item__badge" :class="`reply-badge--${r.decision.toLowerCase()}`">
                {{ decisionLabel(r.decision) }}
              </span>
            </div>
          </TransitionGroup>
          <div v-else class="card__empty">도착한 회신이 없습니다.</div>
        </div>
      </div>

      <!-- 사업부별 처리 현황 -->
      <div class="card card--wide">
        <div class="card__header">
          <h3 class="card__title">사업부별 처리 현황</h3>
          <RouterLink to="/legal/reevaluation" class="card__link">전체 보기</RouterLink>
        </div>
        <div v-if="loadingDepts" class="card__skeleton">
          <div class="skel skel--row" v-for="n in 4" :key="n" />
        </div>
        <div v-else-if="deptItems.length" class="dept-table">
          <div class="dept-table__head">
            <span>사업부</span>
            <span>배정</span>
            <span>결정 완료</span>
            <span>진행률</span>
          </div>
          <RouterLink
            v-for="d in deptItems"
            :key="d.departmentId"
            :to="`/legal/reevaluation?dept=${d.departmentId}`"
            class="dept-row dept-row--link"
          >
            <span class="dept-row__name">
              <span class="dept-dot" />
              {{ deptName(d.departmentId) }}
            </span>
            <span class="dept-row__num">{{ d.assigned }}</span>
            <span class="dept-row__num dept-row__num--done">{{ d.decided }}</span>
            <div class="dept-progress">
              <div class="dept-progress__bar">
                <div class="dept-progress__fill" :style="{ width: deptPct(d) + '%' }" />
              </div>
              <span class="dept-progress__pct">{{ deptPct(d) }}%</span>
            </div>
          </RouterLink>
        </div>
        <div v-else class="card__empty">데이터가 없습니다.</div>
      </div>

      <!-- 유지·포기 현황 -->
      <div class="card">
        <div class="card__header">
          <h3 class="card__title">유지 · 포기 현황</h3>
          <span class="card__badge">결정 완료 {{ decidedTotal }}건</span>
        </div>
        <div class="decision-donut-wrap">
          <svg class="decision-donut-svg" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="50" fill="none" stroke="#f1f5f9" stroke-width="20" />
            <circle cx="60" cy="60" r="50" fill="none" stroke="#67E2AB" stroke-width="20"
              :stroke-dasharray="`${keepDash} ${314 - keepDash}`"
              :stroke-dashoffset="keepOffset"
              stroke-linecap="butt" />
            <circle cx="60" cy="60" r="50" fill="none" stroke="#E88989" stroke-width="20"
              :stroke-dasharray="`${disposeDash} ${314 - disposeDash}`"
              :stroke-dashoffset="disposeOffset"
              stroke-linecap="butt" />
            <text x="60" y="55" text-anchor="middle" font-size="13" font-weight="800" fill="#0f172a">{{ decidedTotal }}</text>
            <text x="60" y="70" text-anchor="middle" font-size="9" font-weight="600" fill="#475569">건</text>
          </svg>
          <div class="decision-legend">
            <div class="decision-legend__item">
              <span class="legend-dot" style="background:#67E2AB" />
              <span class="decision-legend__label">유지</span>
              <span class="decision-legend__count">{{ decisionResult.keep }}건</span>
              <span class="decision-legend__pct">{{ keepPct }}%</span>
            </div>
            <div class="decision-legend__item">
              <span class="legend-dot" style="background:#E88989" />
              <span class="decision-legend__label">포기</span>
              <span class="decision-legend__count">{{ decisionResult.dispose }}건</span>
              <span class="decision-legend__pct">{{ disposePct }}%</span>
            </div>
          </div>
        </div>
      </div>

    </div>

    <hr class="section-divider" />

    <!-- 하단 행: 신규 신청 내역 + 기술 분야 분포 + 분기별 소멸 현황 -->
    <div class="bottom-row">

      <!-- 신규 특허 등록 신청 내역 -->
      <div class="card">
        <div class="card__header">
          <h3 class="card__title">신규 특허 등록 신청 내역</h3>
          <RouterLink to="/legal/patent-manage" class="card__link">전체 보기</RouterLink>
        </div>
        <div v-if="applications.length" class="app-list">
          <div v-for="a in applications" :key="a.id" class="app-item" @click="router.push({ name: 'LegalReviewDetail', params: { appId: a.id } })">
            <div class="app-item__top">
              <span class="app-status-badge" :class="a.appStatus === 'pending' && a.isResubmit ? 'app-status--resubmit' : `app-status--${a.appStatus}`">
                {{ a.appStatus === 'pending' && a.isResubmit ? '재신청' : appStatusLabel(a.appStatus) }}
              </span>
              <span class="app-item__dept">{{ a.submittedBy }}</span>
            </div>
            <p class="app-item__title">{{ a.title }}</p>
            <p class="app-item__date">{{ a.submittedAt }}</p>
          </div>
        </div>
        <div v-else class="card__empty">신청 내역이 없습니다.</div>
      </div>

      <!-- 기술 분야 분포 (도넛 차트) -->
      <div class="card">
        <div class="card__header">
          <h3 class="card__title">기술 분야 분포</h3>
          <RouterLink to="/legal/portfolio" class="card__link">포트폴리오 분석</RouterLink>
        </div>
        <div v-if="loadingDist" class="card__skeleton">
          <div class="skel skel--donut" />
        </div>
        <div v-else class="donut-wrap">
          <svg class="donut-svg" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="50" fill="none" stroke="#f1f5f9" stroke-width="20" />
            <circle
              v-for="(seg, i) in donutSegments"
              :key="i"
              cx="60" cy="60" r="50"
              fill="none"
              :stroke="techColors[i % techColors.length]"
              stroke-width="20"
              :stroke-dasharray="`${seg.dash} ${314 - seg.dash}`"
              :stroke-dashoffset="seg.offset"
              stroke-linecap="butt"
            />
            <text x="60" y="55" text-anchor="middle" font-size="13" font-weight="800" fill="#0f172a">{{ donutTotal }}</text>
            <text x="60" y="70" text-anchor="middle" font-size="9" font-weight="600" fill="#475569">총 특허</text>
          </svg>
          <div class="donut-legend">
            <div v-for="(seg, i) in donutSegments" :key="seg.name" class="donut-legend-item">
              <span class="legend-dot" :style="{ background: techColors[i % techColors.length] }" />
              <span class="donut-legend-item__name">{{ seg.name }}</span>
              <span class="donut-legend-item__count">{{ seg.count }}건</span>
              <span class="donut-legend-item__pct">{{ seg.pct }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 분기별 소멸 예정 -->
      <div class="card">
        <div class="card__header">
          <h3 class="card__title">분기별 소멸 예정 특허</h3>
          <RouterLink to="/legal/expiring" class="card__link">소멸 예정 관리</RouterLink>
        </div>
        <div v-if="loadingDist" class="card__skeleton">
          <div class="skel skel--chart" />
        </div>
        <div v-else class="expiry-chart">
          <div
            v-for="item in expiryItems"
            :key="item.quarter"
            class="expiry-bar-group"
          >
            <div class="expiry-bar-wrap">
              <div
                class="expiry-bar"
                :style="{ height: expiryBarH(item.count) + 'px', background: expiryColor(item.quarter) }"
                :title="`${item.count}건`"
              />
            </div>
            <p class="expiry-bar-label">{{ item.quarter.replace('Q', ' Q') }}</p>
            <p class="expiry-bar-count" :style="{ color: expiryColor(item.quarter) }">{{ item.count }}</p>
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
import { useReadReplies } from '@/composables/useReadReplies'
import { dashboardApi, type LegalDashboardResponse } from '@/api/dashboard'
import { usePatentApplications } from '@/composables/usePatentApplications'

const auth = useAuthStore()
const router = useRouter()
const { readIds, markRead: markReplyRead } = useReadReplies()
const { applications } = usePatentApplications()

function appStatusLabel(s: string) {
  return { pending: '심사중', approved: '승인', rejected: '거절', withdrawn: '철회' }[s] ?? s
}

// ── 로딩 상태 ────────────────────────────────────────
const loadingSummary = ref(true)
const loadingAssign  = ref(true)
const loadingDist    = ref(true)
const loadingDepts   = ref(true)

// ── API 데이터 ───────────────────────────────────────
const dashboardData = ref<LegalDashboardResponse | null>(null)
const error = ref<string | null>(null)

// ── 분기 레이블 ──────────────────────────────────────
const quarterLabel = computed(() => {
  const cycle = dashboardData.value?.reviewCycle
  if (cycle) return `${cycle.year}년 ${cycle.quarter}분기`
  const d = new Date()
  const q = Math.ceil((d.getMonth() + 1) / 3)
  return `${d.getFullYear()}년 ${q}분기`
})

// ── KPI 카드 데이터 ──────────────────────────────────
const progressCard = computed(() => {
  const kpi = dashboardData.value?.kpi
  const requested = kpi?.requested ?? 0
  const decided = kpi?.decided ?? 0
  const unrequested = kpi?.unrequested ?? 0
  const total = requested + unrequested
  const progressRate = total ? Math.round((requested / total) * 100) : 0
  return {
    label: '분기 진행률',
    value: dashboardData.value ? `${progressRate}%` : null,
    progress: progressRate,
    progressColor: '#6366f1',
    sub: `요청 ${requested}건 중 ${decided}건 회신`,
    icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
    iconBg: '#eef2ff', iconColor: '#6366f1',
    alert: false, alertCount: 0, valueColor: '#0f172a',
  }
})

const kpiCards = computed(() => {
  const kpi = dashboardData.value?.kpi
  const overdue = kpi?.overdue ?? 0

  return [
    {
      label: '요청 전',
      value: kpi?.unrequested ?? null,
      sub: '부서 배정 필요',
      icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="23" y1="11" x2="17" y2="11"/></svg>`,
      iconBg: '#f8fafc', iconColor: '#64748b',
      alert: false, alertCount: 0, valueColor: '#0f172a', progress: null, progressColor: '',
      tab: 'unassigned',
    },
    {
      label: '요청 완료',
      value: kpi?.requested ?? null,
      sub: '사업부 전달 완료',
      icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13"/><path d="M22 2L15 22 11 13 2 9l20-7z"/></svg>`,
      iconBg: '#f0fdf4', iconColor: '#22c55e',
      alert: false, alertCount: 0, valueColor: '#0f172a', progress: null, progressColor: '',
      tab: 'requested',
    },
    {
      label: '지연',
      value: overdue,
      sub: '미회신 기한 초과',
      alertCount: overdue,
      icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
      iconBg: '#fef2f2', iconColor: '#dc2626',
      alert: true, valueColor: '#dc2626', progress: null, progressColor: '',
      tab: 'overdue',
    },
    {
      label: '결정 완료',
      value: kpi?.decided ?? null,
      sub: '회신 완료',
      icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
      iconBg: '#f0fdf4', iconColor: '#22c55e',
      alert: false, alertCount: 0, valueColor: '#0f172a', progress: null, progressColor: '',
      tab: 'done',
    },
  ]
})

// ── 퍼널 ─────────────────────────────────────────────
const funnelSteps = computed(() => {
  const kpi = dashboardData.value?.kpi
  if (!kpi) return []
  return [
    { label: '미배정',      value: kpi.unrequested, color: '#94a3b8' },
    { label: '배정 완료',   value: kpi.requested,   color: '#6366f1' },
    { label: '결정 완료',   value: kpi.decided,     color: '#22c55e' },
  ]
})

function funnelPct(v: number) {
  const max = Math.max(...(funnelSteps.value.map(s => s.value)), 1)
  return Math.round((v / max) * 100)
}

// ── 사업부 ────────────────────────────────────────────
const deptItems = computed(() => dashboardData.value?.departments ?? [])

// 부서 이름 매핑 (실제로는 /departments API로 조회)
const deptNameMap: Record<number, string> = {
  1: 'Legal AI팀', 2: '반도체 사업부', 3: '배터리 사업부',
  4: 'AI 사업부', 5: '소재 사업부',
}
function deptName(id: number) {
  const found = dashboardData.value?.departments.find(d => d.departmentId === id)
  return found?.departmentName ?? deptNameMap[id] ?? `사업부 #${id}`
}
function deptPct(d: { assigned: number; decided: number }) {
  return d.assigned ? Math.round((d.decided / d.assigned) * 100) : 0
}

// ── 기술 분야 ─────────────────────────────────────────
const techColors = ['#ABACED', '#67E2AB', '#FFBC5E', '#84DBED', '#E88989', '#ABACED']
const techFieldItems = computed(() => dashboardData.value?.byTechField ?? [])

const DONUT_C = 314  // 2π × r=50

const donutTotal = computed(() => techFieldItems.value.reduce((s, i) => s + i.count, 0))

const donutSegments = computed(() => {
  const total = donutTotal.value
  if (!total) return []
  let offset = -DONUT_C / 4
  return techFieldItems.value.map((item, i) => {
    const dash = Math.round((item.count / total) * DONUT_C)
    const seg = { dash, offset, name: item.name, count: item.count, pct: Math.round((item.count / total) * 100) }
    offset -= dash
    return seg
  })
})

// ── 소멸 차트 ─────────────────────────────────────────
const expiryItems = computed(() => dashboardData.value?.byExpiryQuarter ?? [])
function expiryBarH(count: number) {
  const max = Math.max(...expiryItems.value.map(i => i.count), 1)
  return Math.round((count / max) * 36) + 4  // max 40px
}
function expiryColor(quarter: string) {
  // 현재 분기 이후 가까울수록 주황
  const now = new Date()
  const q = Math.ceil((now.getMonth() + 1) / 3)
  const label = `${now.getFullYear()}Q${q}`
  if (quarter === label) return '#f59e0b'
  if (quarter < label)  return '#94a3b8'
  return '#6366f1'
}

// ── 최근 회신 ────────────────────────────────────────
const allReplies = computed(() =>
  (dashboardData.value?.recentReplies ?? []).map(r => ({
    id: r.reviewId,
    patent: r.title,
    dept: r.departmentName,
    decision: r.opinion === 'MAINTAIN' ? 'KEEP' : 'DISPOSE',
  }))
)

const recentReplies = computed(() =>
  allReplies.value.filter(r => !readIds.value.has(r.id))
)

function decisionLabel(d: string) {
  return { KEEP: '유지', DISPOSE: '포기' }[d] ?? d
}
function openReply(id: number) {
  router.push(`/legal/reevaluation?tab=unread&open=${id}`)
}

// ── 유지·포기 현황 ────────────────────────────────────
const decisionResult = computed(() => {
  const deps = dashboardData.value?.departments ?? []
  const decided = deps.reduce((s, d) => s + d.decided, 0)
  // API doesn't provide keep/dispose breakdown per department;
  // fall back to a 75/25 split until the backend exposes it
  const keep = Math.round(decided * 0.75)
  const dispose = decided - keep
  return { keep, dispose }
})

const decidedTotal  = computed(() => decisionResult.value.keep + decisionResult.value.dispose)
const keepPct       = computed(() => decidedTotal.value ? Math.round(decisionResult.value.keep    / decidedTotal.value * 100) : 0)
const disposePct    = computed(() => decidedTotal.value ? Math.round(decisionResult.value.dispose / decidedTotal.value * 100) : 0)
const keepDash      = computed(() => decidedTotal.value ? Math.round(decisionResult.value.keep    / decidedTotal.value * 314) : 0)
const disposeDash   = computed(() => decidedTotal.value ? Math.round(decisionResult.value.dispose / decidedTotal.value * 314) : 0)
const keepOffset    = computed(() => -314 / 4)
const disposeOffset = computed(() => -314 / 4 - keepDash.value)

// ── 데이터 로드 ──────────────────────────────────────
async function loadAll() {
  try {
    dashboardData.value = await dashboardApi.getLegalDashboard()
  } catch (e) {
    error.value = '대시보드 데이터를 불러오지 못했습니다.'
    console.error(e)
  } finally {
    loadingSummary.value = false
    loadingAssign.value  = false
    loadingDist.value    = false
    loadingDepts.value   = false
  }
}

onMounted(loadAll)
</script>

<style scoped>
.legal-home {
  display: flex;
  flex-direction: column;
  gap: 24px;
  font-family: 'Pretendard', sans-serif;
}

/* ── 인사 헤더 ───────────────────────────────────── */
.greeting {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}


.greeting__title {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
  letter-spacing: -0.02em;
}
.greeting__title span { color: var(--color-primary-dark); font-weight: 700; }

.btn-goto {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: var(--color-text);
  color: var(--color-surface);
  border-radius: 10px;
  text-decoration: none;
  font-size: 13.5px;
  font-weight: 600;
  transition: background 0.15s, transform 0.12s;
  white-space: nowrap;
}
.btn-goto:hover { background: var(--color-navy-hover); transform: translateY(-1px); }

/* ── KPI 카드 ────────────────────────────────────── */
.kpi-row {
  display: flex;
  align-items: stretch;
  gap: 0;
}

.kpi-vdivider {
  width: 1px;
  background: var(--color-border);
  margin: 0 16px;
  flex-shrink: 0;
  align-self: stretch;
}

.kpi-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 28px;
  color: #cbd5e1;
}

.kpi-card--progress {
  flex: 0 0 180px;
}

@media (max-width: 900px) {
  .kpi-row { flex-wrap: wrap; }
  .kpi-card { flex: 1 1 calc(50% - 40px); min-width: 140px; }
  .kpi-arrow { display: none; }
}
@media (max-width: 500px) {
  .kpi-card { flex: 1 1 100%; }
}

.kpi-card {
  flex: 1;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  padding: 18px 16px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: box-shadow 0.15s;
}
.kpi-card:hover { box-shadow: 0 4px 16px rgba(15,23,42,0.06); }
.kpi-card--alert { border-color: var(--color-danger-border); background: var(--c-red-50); }
.kpi-card--link { cursor: pointer; text-decoration: none; color: inherit; }
.kpi-card--link:hover { box-shadow: 0 4px 16px rgba(99,102,241,0.12); border-color: var(--color-primary-border); }

.kpi-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.kpi-card__label {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: -0.01em;
}

.kpi-card__icon {
  width: 28px; height: 28px;
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.kpi-card__value {
  font-size: 26px;
  font-weight: 800;
  color: var(--color-text);
  margin: 2px 0 0;
  letter-spacing: -0.03em;
  line-height: 1;
}

.kpi-card__sub {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
  margin: 0;
}

.kpi-card__alert-badge {
  display: inline-block;
  padding: 2px 7px;
  background: var(--color-danger-bg);
  color: var(--color-danger);
  border-radius: 5px;
  font-size: 11.5px;
  font-weight: 700;
}

.kpi-progress {
  height: 4px;
  background: var(--color-surface-muted);
  border-radius: 2px;
  overflow: hidden;
  margin-top: 4px;
}
.kpi-progress__fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.6s cubic-bezier(0.4,0,0.2,1);
}

/* ── 공통 카드 ───────────────────────────────────── */
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}


.card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card__title {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
  letter-spacing: -0.01em;
}

.card__link {
  font-size: 12.5px;
  font-weight: 500;
  color: var(--color-primary);
  text-decoration: none;
  transition: color 0.13s;
}
.card__link:hover { color: var(--color-primary-darker); }

.card__empty {
  padding: 32px;
  text-align: center;
  font-size: 13px;
  color: var(--color-text-subtle);
}

.card__badge {
  font-size: 11.5px;
  font-weight: 600;
  color: var(--color-text-secondary);
  background: var(--color-surface-muted);
  padding: 2px 8px;
  border-radius: 20px;
}

/* ── 유지·포기 도넛 ──────────────────────────────── */
.decision-donut-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  flex: 1;
}

.decision-donut-svg {
  width: 130px;
  height: 130px;
  flex-shrink: 0;
  transform: rotate(-90deg);
}
.decision-donut-svg text {
  transform: rotate(90deg);
  transform-origin: 60px 60px;
}

.decision-legend {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.decision-legend__item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}
.decision-legend__label { flex: 1; color: var(--color-text-secondary); font-weight: 500; }
.decision-legend__count { font-weight: 700; color: var(--color-text); }
.decision-legend__pct   { font-weight: 600; color: var(--color-text-secondary); min-width: 34px; text-align: right; }

.card__skeleton { display: flex; flex-direction: column; gap: 10px; }

.skel {
  background: linear-gradient(90deg, var(--color-surface-muted) 25%, var(--c-slate-150) 50%, var(--color-surface-muted) 75%);
  background-size: 200% 100%;
  border-radius: 6px;
  animation: shimmer 1.5s infinite;
}
.skel--bar    { height: 14px; }
.skel--row    { height: 36px; }
.skel--treemap { height: 120px; }
.skel--chart   { height: 100px; }
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

/* ── 중간 행 ─────────────────────────────────────── */
.mid-row {
  display: flex;
  gap: 16px;
}
.mid-row > .card { flex: 1; min-width: 0; }
.mid-row > .card--wide { flex: 2; }

/* ── 퍼널 ────────────────────────────────────────── */
.funnel { display: flex; flex-direction: column; gap: 10px; }

.funnel-step { display: flex; flex-direction: column; gap: 6px; }

.funnel-step__bar-wrap {
  height: 8px;
  background: var(--color-surface-muted);
  border-radius: 4px;
  overflow: hidden;
}

.funnel-step__bar {
  height: 100%;
  border-radius: 4px;
  transition: width 0.7s cubic-bezier(0.4,0,0.2,1);
}

.funnel-step__info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.funnel-step__label { font-size: 12.5px; color: var(--color-text-muted); font-weight: 500; }
.funnel-step__value { font-size: 13.5px; font-weight: 700; }

/* ── 사업부 테이블 ────────────────────────────────── */
.dept-table { display: flex; flex-direction: column; gap: 0; }

.dept-table__head {
  display: grid;
  grid-template-columns: 1.1fr 0.5fr 0.6fr 1.8fr;
  padding: 10px 12px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
  border-bottom: 1px solid var(--color-border);
  gap: 8px;
}
.dept-table__head span:nth-child(2),
.dept-table__head span:nth-child(3) {
  text-align: center;
}
.dept-table__head span:nth-child(4) {
  padding-left: 2px;
}

.dept-row {
  display: grid;
  grid-template-columns: 1.1fr 0.5fr 0.6fr 1.8fr;
  padding: 11px 12px;
  border-bottom: 1px solid var(--color-surface-hover);
  align-items: center;
  gap: 8px;
  transition: background 0.12s;
}
.dept-row:last-child { border-bottom: none; }
.dept-row:hover { background: var(--color-surface-hover); }
.dept-row--link { text-decoration: none; color: inherit; cursor: pointer; }
.dept-row--link:hover { background: var(--color-primary-bg); }

.dept-row__name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
}

.dept-dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  background: var(--color-primary);
  flex-shrink: 0;
}

.dept-row__num {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
  text-align: center;
}
.dept-row__num--done { color: var(--color-success); font-weight: 700; }

.dept-progress {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dept-progress__bar {
  flex: 1;
  height: 6px;
  background: var(--color-surface-muted);
  border-radius: 3px;
  overflow: hidden;
  min-width: 0;
}

.dept-progress__fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary-dark), var(--c-primary-400));
  border-radius: 3px;
  transition: width 0.6s cubic-bezier(0.4,0,0.2,1);
}

.dept-progress__pct {
  font-size: 12px;
  font-weight: 700;
  color: var(--color-text-muted);
  white-space: nowrap;
  min-width: 36px;
  text-align: right;
}

/* ── 하단 행 ─────────────────────────────────────── */
.section-divider {
  border: none;
  border-top: 1px solid var(--color-border);
  margin: 4px 0;
}

.bottom-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 16px;
}

@media (max-width: 1100px) { .bottom-row { grid-template-columns: 1fr 1fr; } }
@media (max-width: 720px)  { .bottom-row { grid-template-columns: 1fr; } }

/* ── 신규 특허 등록 신청 내역 ──────────────────────── */
.app-list { display: flex; flex-direction: column; gap: 0; }

.app-item {
  padding: 10px 0;
  border-bottom: 1px solid var(--color-surface-hover);
  cursor: pointer;
  transition: background 0.12s;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.app-item:last-child { border-bottom: none; }
.app-item:hover { background: var(--color-surface-hover); }

.app-item__top {
  display: flex;
  align-items: center;
  gap: 7px;
}

.app-item__title {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.app-item__dept {
  font-size: 11.5px;
  color: var(--color-text-secondary);
  font-weight: 500;
}

.app-item__date {
  font-size: 11.5px;
  color: var(--color-text-subtle);
  margin: 0;
}

.app-status-badge {
  display: inline-block;
  padding: 2px 7px;
  border-radius: 5px;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
}
.app-status--pending   { background: #eff6ff; color: #2563eb; }
.app-status--approved  { background: #f0fdf4; color: #16a34a; }
.app-status--rejected  { background: #fef2f2; color: #dc2626; }
.app-status--withdrawn { background: #f8fafc; color: #64748b; }
.app-status--resubmit  { background: #fefce8; color: #ca8a04; }

/* ── 기술 분야 분포 (도넛) ─────────────────────────── */
.skel--donut { height: 140px; border-radius: 8px; }

.donut-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}

.donut-svg {
  width: 140px;
  height: 140px;
  flex-shrink: 0;
  transform: rotate(-90deg);
}
.donut-svg text {
  transform: rotate(90deg);
  transform-origin: 60px 60px;
}

.donut-legend {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.donut-legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12.5px;
}
.donut-legend-item__name  { flex: 1; color: var(--color-text); font-weight: 500; }
.donut-legend-item__count { font-weight: 700; color: var(--color-text); }
.donut-legend-item__pct   { color: var(--color-text-secondary); font-weight: 600; min-width: 32px; text-align: right; }

.legend-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

/* ── 소멸 차트 ───────────────────────────────────── */
.expiry-chart {
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  gap: 6px;
  height: 180px;
}

.expiry-bar-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex: 1;
}

.expiry-bar-wrap {
  display: flex;
  align-items: flex-end;
  height: 48px;
}

.expiry-bar {
  width: 28px;
  border-radius: 5px 5px 0 0;
  transition: height 0.6s cubic-bezier(0.4,0,0.2,1);
  min-height: 6px;
}

.expiry-bar-label {
  font-size: 10.5px;
  color: var(--color-text-secondary);
  font-weight: 600;
  text-align: center;
}
.expiry-bar-count {
  font-size: 12px;
  font-weight: 700;
  text-align: center;
}

/* ── 최근 회신 ───────────────────────────────────── */
.reply-items { display: flex; flex-direction: column; gap: 0; }

.reply-fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease, max-height 0.3s ease;
  overflow: hidden;
  max-height: 60px;
}
.reply-fade-leave-to {
  opacity: 0;
  transform: translateX(12px);
  max-height: 0;
}

.reply-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 0;
  cursor: pointer;
  border-bottom: 1px solid var(--color-surface-hover);
}
.reply-item:last-child { border-bottom: none; }

.reply-item__left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.reply-item__avatar {
  width: 30px; height: 30px;
  background: linear-gradient(135deg, var(--color-primary-dark), var(--c-violet-700));
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  color: var(--color-surface);
  flex-shrink: 0;
}

.reply-item__title {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.reply-item__dept {
  font-size: 12.5px;
  font-weight: 500;
  color: var(--color-text-secondary);
  margin: 0;
}

.reply-item__badge {
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
}
.reply-badge--keep    { background: var(--color-success-bg); color: var(--color-success-dark); }
.reply-badge--sell    { background: var(--color-primary-bg); color: var(--color-primary-darker); }
.reply-badge--dispose { background: var(--color-danger-bg); color: var(--color-danger); }
</style>
