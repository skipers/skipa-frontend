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

    <!-- 보고서 생성 현황 카드 -->
    <div class="kpi-card rgc-card" :class="`rgc-card--${reportGenStatus.state}`">

      <!-- 비활성 / 로딩 -->
      <template v-if="reportGenStatus.state === 'inactive' || reportGenStatus.state === 'loading'">
        <div class="rgc-inactive">
          <span class="rgc-inactive__icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="3"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
              <line x1="9" y1="15" x2="15" y2="15"/>
            </svg>
          </span>
          <div class="rgc-inactive__body">
            <span class="rgc-info__label">보고서 생성 현황</span>
            <span class="rgc-inactive__title">지금은 재평가 기간이 아닙니다</span>
            <span class="rgc-inactive__sub">{{ quarterLabel }} 재평가 기간이 시작되면 AI 보고서가 자동으로 생성됩니다.</span>
          </div>
        </div>
      </template>

      <!-- 진행 중 / 완료 -->
      <template v-else>
        <!-- 우측 상단 아이콘 -->
        <div class="rgc-icon-wrap">
          <svg v-if="reportGenStatus.state === 'done'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><polyline points="9 12 11 14 15 10"/>
          </svg>
          <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
        </div>

        <!-- 메인: 큰 숫자 + 설명 -->
        <div class="rgc-main">
          <span class="rgc-pct-hero">{{ reportGenStatus.state === 'done' ? '100%' : reportGenStatus.pct + '%' }}</span>
          <div class="rgc-info">
            <span class="rgc-info__label">보고서 생성 현황</span>
            <span class="rgc-info__title">{{ reportGenStatus.state === 'done' ? 'AI 보고서 생성 완료' : 'AI 보고서 생성 중' }}</span>
            <span class="rgc-info__sub">
              <template v-if="reportGenStatus.state === 'done'">{{ quarterLabel }} · 전체 {{ reportGenStatus.total }}건</template>
              <template v-else>{{ quarterLabel }} · {{ reportGenStatus.completed }}건 완료 / {{ reportGenStatus.total }}건</template>
            </span>
          </div>
        </div>

        <!-- 막대 -->
        <div class="rgc-bar-track">
          <div
            class="rgc-bar-fill"
            :class="reportGenStatus.state === 'done' ? 'rgc-bar-fill--done' : 'rgc-bar-fill--progress'"
            :style="{ width: reportGenStatus.state === 'done' ? '100%' : reportGenStatus.pct + '%' }"
          >
            <span class="rgc-bar-label">{{ reportGenStatus.state === 'done' ? '100%' : reportGenStatus.pct + '%' }}</span>
          </div>
        </div>
      </template>

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
      <div class="card card--reply">
        <div class="card__header">
          <div class="card__header-left">
            <h3 class="card__title">미확인 회신</h3>
            <span class="card__badge">전체 {{ recentReplies.length }}건</span>
          </div>
          <RouterLink to="/legal/reevaluation?tab=unread" class="card__link">전체 보기</RouterLink>
        </div>
        <div v-if="loadingSummary" class="card__skeleton">
          <div class="skel skel--row" v-for="n in 4" :key="n" />
        </div>
        <div v-else class="reply-list">
          <TransitionGroup v-if="recentReplies.length" tag="div" name="reply-fade" class="reply-items">
            <div
              v-for="r in recentReplies.slice(0, 5)" :key="r.id"
              class="reply-item"
              @click="openReply(r.id)"
            >
              <div class="reply-item__left">
                <div class="reply-item__avatar">{{ r.dept.charAt(0) }}</div>
                <div class="reply-item__info">
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
          <div class="card__header-left">
            <h3 class="card__title">사업부별 처리 현황</h3>
            <span class="card__badge">전체 {{ deptItems.length }}건</span>
          </div>
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
            v-for="d in deptItems.slice(0, 5)"
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
        <div v-if="decidedTotal === 0" class="card__empty">결정된 데이터가 없습니다.</div>
        <div v-else class="decision-donut-wrap">
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
          <div class="card__header-left">
            <h3 class="card__title">신규 특허 등록 신청 내역</h3>
            <span class="card__badge">전체 {{ applications.length }}건</span>
          </div>
          <RouterLink to="/legal/patent-manage" class="card__link">전체 보기</RouterLink>
        </div>
        <div v-if="applications.length" class="app-list">
          <div v-for="a in applications.slice(0, 5)" :key="a.id" class="app-item" @click="router.push({ name: 'LegalReviewDetail', params: { appId: a.id } })">
            <div class="app-item__top">
              <span class="app-status-badge" :class="a.appStatus === 'pending' && a.isResubmit ? 'app-status--resubmit' : `app-status--${a.appStatus}`">
                {{ a.appStatus === 'pending' && a.isResubmit ? '재신청' : appStatusLabel(a.appStatus) }}
              </span>
              <span class="app-item__dept">{{ a.submittedBy }}</span>
            </div>
            <p class="app-item__title">{{ a.title }}</p>
            <p class="app-item__date">{{ a.submittedAt ? a.submittedAt.slice(0, 10) : '' }}</p>
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
        <div v-else-if="donutTotal === 0" class="card__empty">분야별 데이터가 없습니다.</div>
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
        <div v-else-if="expiryItems.length === 0" class="card__empty">소멸 예정 데이터가 없습니다.</div>
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
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
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

// ── 보고서 생성 현황 ─────────────────────────────────
const reportGenStatus = computed(() => {
  const cp = dashboardData.value?.cycleProgress
  if (!cp) return { state: 'loading' as const }

  const { statusLabel, targetPatentCount: total, reports } = cp

  if (statusLabel === 'NO_TARGETS') return { state: 'inactive' as const }

  if (statusLabel === 'REPORT_GENERATING' || statusLabel === 'REPORT_NOT_STARTED') {
    const completed = reports.completed
    const pct = total ? Math.round((completed / total) * 100) : 0
    return { state: 'progress' as const, total, completed, pct }
  }

  if (statusLabel === 'REPORT_FAILED') {
    const completed = reports.completed
    const pct = total ? Math.round((completed / total) * 100) : 0
    return { state: 'progress' as const, total, completed, pct }
  }

  // REVIEW_NOT_REQUESTED | REVIEW_IN_PROGRESS | REVIEW_COMPLETED
  return { state: 'done' as const, total, completed: total, pct: 100 }
})

// REPORT_GENERATING 일 때만 1분 폴링
let pollTimer: ReturnType<typeof setInterval> | null = null

watch(dashboardData, (data) => {
  const label = data?.cycleProgress?.statusLabel
  if (label === 'REPORT_GENERATING') {
    if (!pollTimer) pollTimer = setInterval(loadAll, 60_000)
  } else {
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null }
  }
})

onUnmounted(() => { if (pollTimer) clearInterval(pollTimer) })

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
  const progressRate = total ? Math.round((decided / total) * 100) : 0
  return {
    label: '분기 진행률',
    value: dashboardData.value ? `${progressRate}%` : null,
    progress: progressRate,
    progressColor: '#6366f1',
    sub: `전체 ${total}건 중 ${decided}건 결정 완료`,
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
  const items = [...techFieldItems.value].sort((a, b) => b.count - a.count)
  const total = donutTotal.value
  if (!total) return []
  let displayItems: { name: string; count: number }[]
  if (items.length <= 4) {
    displayItems = items
  } else {
    const etcCount = items.slice(4).reduce((s, i) => s + i.count, 0)
    displayItems = [...items.slice(0, 4), { name: '기타', count: etcCount }]
  }
  let offset = -DONUT_C / 4
  return displayItems.map(item => {
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
  return { KEEP: '유지', MAINTAIN: '유지', DISPOSE: '포기', ABANDON: '포기' }[d] ?? d
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

/* ── 보고서 생성 현황 카드 ───────────────────────── */
.rgc-card {
  gap: 14px;
  padding: 20px 22px 18px;
  position: relative;
  overflow: hidden;
  transition: box-shadow 0.2s;
}
.rgc-card--done {
  background: linear-gradient(135deg, rgba(103,226,171,0.1) 0%, var(--color-surface) 55%);
  border-color: rgba(103,226,171,0.35);
}
.rgc-card--progress {
  background: linear-gradient(135deg, rgba(103,226,171,0.1) 0%, var(--color-surface) 55%);
  border-color: rgba(103,226,171,0.35);
}

/* 우측 상단 절대 위치 아이콘 */
.rgc-icon-wrap {
  position: absolute;
  top: 18px; right: 20px;
  width: 40px; height: 40px;
  border-radius: 11px;
  display: flex; align-items: center; justify-content: center;
}
.rgc-card--done     .rgc-icon-wrap { background: rgba(103,226,171,0.18); color: #3ecf8e; }
.rgc-card--progress .rgc-icon-wrap { background: rgba(103,226,171,0.18); color: #3ecf8e; }
.rgc-card--inactive .rgc-icon-wrap,
.rgc-card--loading  .rgc-icon-wrap { background: var(--color-surface-muted, #f1f5f9); color: var(--color-text-secondary); }

/* 비활성 상태 */
.rgc-inactive {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 4px 0;
}
.rgc-inactive__icon {
  flex-shrink: 0;
  width: 52px; height: 52px;
  border-radius: 14px;
  background: var(--color-surface-muted, #f1f5f9);
  border: 1.5px solid var(--color-border);
  display: flex; align-items: center; justify-content: center;
  color: var(--color-text-secondary);
}
.rgc-inactive__body {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.rgc-inactive__title {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text);
}
.rgc-inactive__sub {
  font-size: 12.5px;
  color: var(--color-text-secondary);
  line-height: 1.5;
}

/* 메인 수치 + 설명 */
.rgc-main {
  display: flex;
  align-items: center;
  gap: 18px;
}
.rgc-pct-hero {
  font-size: 48px;
  font-weight: 800;
  letter-spacing: -0.05em;
  line-height: 1;
  flex-shrink: 0;
}
.rgc-card--done     .rgc-pct-hero { color: #2db87a; }
.rgc-card--progress .rgc-pct-hero { color: #2db87a; }
.rgc-card--inactive .rgc-pct-hero,
.rgc-card--loading  .rgc-pct-hero { color: var(--color-border); }

.rgc-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.rgc-info__label {
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-secondary);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.rgc-info__title {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: -0.01em;
}
.rgc-info__sub {
  font-size: 12.5px;
  color: var(--color-text-secondary);
}

/* 막대 */
.rgc-bar-track {
  width: 100%;
  height: 28px;
  background: rgba(0,0,0,0.05);
  border-radius: 8px;
  overflow: hidden;
  box-sizing: border-box;
}
.rgc-card--done     .rgc-bar-track { border: 2px solid rgba(103,226,171,0.45); }
.rgc-card--progress .rgc-bar-track { border: 2px solid rgba(103,226,171,0.45); }
.rgc-card--inactive .rgc-bar-track,
.rgc-card--loading  .rgc-bar-track { border: 2px solid var(--color-border); }
.rgc-bar-fill {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  animation: rgc-bar-reveal 1.2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}
@keyframes rgc-bar-reveal {
  from { clip-path: inset(0 100% 0 0); }
  to   { clip-path: inset(0 0%   0 0); }
}
.rgc-bar-fill--done     { background: linear-gradient(90deg, #86efca, #67E2AB, #3ecf8e); }
.rgc-bar-fill--progress { background: linear-gradient(90deg, #86efca, #67E2AB, #3ecf8e); }
.rgc-bar-label {
  color: #fff;
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 0.03em;
  user-select: none;
  text-shadow: 0 1px 4px rgba(0,0,0,0.2);
  position: relative;
  z-index: 1;
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

.card__header-left  { display: flex; align-items: center; gap: 8px; }
.card__header-right { display: flex; align-items: center; gap: 8px; }

.card__link {
  font-size: 12.5px;
  font-weight: 500;
  color: var(--color-primary);
  text-decoration: none;
  transition: color 0.13s;
}
.card__link:hover { color: var(--color-primary-darker); }

.card__empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
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
.mid-row > .card--reply { flex: 1.5; }
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
.reply-list  { flex: 1; display: flex; flex-direction: column; }
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

.reply-item__info {
  min-width: 0;
  overflow: hidden;
}
.reply-item__title {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 2px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.reply-item__dept {
  font-size: 12.5px;
  font-weight: 500;
  color: var(--color-text-secondary);
  margin: 0;
}

.reply-item__badge {
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
}
.reply-badge--keep     { background: var(--color-success-bg); color: var(--color-success-dark); }
.reply-badge--maintain { background: var(--color-success-bg); color: var(--color-success-dark); }
.reply-badge--sell     { background: var(--color-primary-bg); color: var(--color-primary-darker); }
.reply-badge--dispose  { background: var(--color-danger-bg); color: var(--color-danger); }
.reply-badge--abandon  { background: var(--color-danger-bg); color: var(--color-danger); }
</style>
