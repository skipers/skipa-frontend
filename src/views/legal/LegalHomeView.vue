<template>
  <div class="legal-home">

    <!-- 인사 헤더 -->
    <div class="greeting">
      <div class="greeting__left">
        <p class="greeting__sub">{{ quarterLabel }} 재평가 현황</p>
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
      <component
        :is="kpi.tab ? 'RouterLink' : 'div'"
        v-for="kpi in kpiCards"
        :key="kpi.label"
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
        <p class="kpi-card__value" :style="{ color: kpi.valueColor }">
          {{ kpi.value ?? '—' }}
        </p>
        <div v-if="kpi.sub" class="kpi-card__sub">
          <span v-if="kpi.alert" class="kpi-card__alert-badge">{{ kpi.alertCount }}건 지연</span>
          <span v-else>{{ kpi.sub }}</span>
        </div>
        <!-- 진행 바 (진행률 카드) -->
        <div v-if="kpi.progress != null" class="kpi-progress">
          <div class="kpi-progress__fill" :style="{ width: kpi.progress + '%', background: kpi.progressColor }" />
        </div>
      </component>
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

    </div>

    <hr class="section-divider" />

    <!-- 하단 행: 기술 분야 분포 + 분기별 만료 현황 -->
    <div class="bottom-row">

      <!-- 기술 분야 분포 (트리맵 스타일) -->
      <div class="card">
        <div class="card__header">
          <h3 class="card__title">기술 분야 분포</h3>
          <RouterLink to="/legal/portfolio" class="card__link">포트폴리오 분석</RouterLink>
        </div>
        <div v-if="loadingDist" class="card__skeleton">
          <div class="skel skel--treemap" />
        </div>
        <div v-else class="tech-dist">
          <div
            v-for="(item, i) in techFieldItems"
            :key="item.name"
            class="tech-dist__item"
          >
            <div class="tech-dist__bar-wrap">
              <div
                class="tech-dist__bar"
                :style="{ width: techPct(item.count) + '%', background: techColors[i % techColors.length] }"
              />
            </div>
            <div class="tech-dist__info">
              <span class="tech-dist__name">{{ item.name }}</span>
              <span class="tech-dist__count">{{ item.count }}건</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 분기별 만료 예정 -->
      <div class="card">
        <div class="card__header">
          <h3 class="card__title">분기별 만료 예정 특허</h3>
          <RouterLink to="/legal/expiring" class="card__link">만료 예정 관리</RouterLink>
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
import { dashboardApi } from '@/api/misc'
import type {
  DashboardSummary,
  DashboardAssignment,
  DashboardDistribution,
  DashboardDepartments,
} from '@/types'

const auth = useAuthStore()
const router = useRouter()
const { readIds, markRead: markReplyRead } = useReadReplies()

// ── 로딩 상태 ────────────────────────────────────────
const loadingSummary = ref(true)
const loadingAssign  = ref(true)
const loadingDist    = ref(true)
const loadingDepts   = ref(true)

// ── API 데이터 ───────────────────────────────────────
const summary    = ref<DashboardSummary | null>(null)
const assignment = ref<DashboardAssignment | null>(null)
const distribution = ref<DashboardDistribution | null>(null)
const departments  = ref<DashboardDepartments | null>(null)

// ── 분기 레이블 ──────────────────────────────────────
const quarterLabel = computed(() => {
  const d = new Date()
  const q = Math.ceil((d.getMonth() + 1) / 3)
  return `${d.getFullYear()}년 ${q}분기`
})

// ── KPI 카드 데이터 ──────────────────────────────────
const kpiCards = computed(() => {
  const s = summary.value
  const a = assignment.value
  const delayed = 7 // TODO: API에서 지연 건수 받으면 교체

  return [
    {
      label: '분기 진행률',
      value: s ? `${s.progressRate}%` : null,
      progress: s?.progressRate ?? 0,
      progressColor: '#6366f1',
      sub: `요청 ${s?.kpi.requested ?? 0}건 중 ${s?.kpi.decided ?? 0}건 회신`,
      icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
      iconBg: '#eef2ff', iconColor: '#6366f1',
      alert: false, alertCount: 0, valueColor: '#0f172a',
    },
    {
      label: '요청 완료',
      value: s?.kpi.requested ?? null,
      sub: '사업부 전달 완료',
      icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13"/><path d="M22 2L15 22 11 13 2 9l20-7z"/></svg>`,
      iconBg: '#f0fdf4', iconColor: '#22c55e',
      alert: false, alertCount: 0, valueColor: '#0f172a', progress: null, progressColor: '',
      tab: 'requested',
    },
    {
      label: '지연',
      value: delayed,
      sub: `미회신 기한 초과`,
      alertCount: delayed,
      icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
      iconBg: '#fef2f2', iconColor: '#dc2626',
      alert: true, valueColor: '#dc2626', progress: null, progressColor: '',
      tab: 'overdue',
    },
    {
      label: '결정 완료',
      value: s?.kpi.decided ?? null,
      sub: '회신 완료',
      icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
      iconBg: '#f0fdf4', iconColor: '#22c55e',
      alert: false, alertCount: 0, valueColor: '#0f172a', progress: null, progressColor: '',
      tab: 'done',
    },
    {
      label: '요청 전',
      value: a?.unassigned ?? null,
      sub: '부서 배정 필요',
      icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="23" y1="11" x2="17" y2="11"/></svg>`,
      iconBg: '#f8fafc', iconColor: '#64748b',
      alert: false, alertCount: 0, valueColor: '#0f172a', progress: null, progressColor: '',
      tab: 'unassigned',
    },
  ]
})

// ── 퍼널 ─────────────────────────────────────────────
const funnelSteps = computed(() => {
  const a = assignment.value
  if (!a) return []
  return [
    { label: '미배정',      value: a.unassigned, color: '#94a3b8' },
    { label: '배정 완료',   value: a.assigned,   color: '#6366f1' },
    { label: '결정 완료',   value: a.completed,  color: '#22c55e' },
  ]
})

function funnelPct(v: number) {
  const max = Math.max(...(funnelSteps.value.map(s => s.value)), 1)
  return Math.round((v / max) * 100)
}

// ── 사업부 ────────────────────────────────────────────
const deptItems = computed(() => departments.value?.items ?? [])

// 부서 이름 매핑 (실제로는 /departments API로 조회)
const deptNameMap: Record<number, string> = {
  1: 'Legal AI팀', 2: '반도체 사업부', 3: '배터리 사업부',
  4: 'AI 사업부', 5: '소재 사업부',
}
function deptName(id: number) { return deptNameMap[id] ?? `사업부 #${id}` }
function deptPct(d: { assigned: number; decided: number }) {
  return d.assigned ? Math.round((d.decided / d.assigned) * 100) : 0
}

// ── 기술 분야 ─────────────────────────────────────────
const techColors = ['#ABACED', '#67E2AB', '#FFBC5E', '#84DBED', '#E88989', '#ABACED']
const techFieldItems = computed(() => distribution.value?.byTechField ?? [])
function techPct(count: number) {
  const max = Math.max(...techFieldItems.value.map(i => i.count), 1)
  return Math.round((count / max) * 100)
}

// ── 만료 차트 ─────────────────────────────────────────
const expiryItems = computed(() => distribution.value?.byExpiryQuarter ?? [])
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

// ── 최근 회신 (mock — 실제로는 /decisions?page=1&size=5) ──
const allReplies = [
  { id: 1, patent: 'NF3 가스 이물질 제거 시스템', dept: '반도체 사업부', decision: 'KEEP' },
  { id: 2, patent: '플라즈마 식각 장치 및 제어 방법', dept: '반도체 사업부', decision: 'DISPOSE' },
  { id: 3, patent: '배터리 전극 코팅 균일도 향상', dept: '배터리 사업부', decision: 'KEEP' },
  { id: 4, patent: 'AI 기반 품질 검사 자동화', dept: 'AI 사업부', decision: 'DISPOSE' },
]

const recentReplies = computed(() =>
  allReplies.filter(r => !readIds.value.has(r.id))
)

function decisionLabel(d: string) {
  return { KEEP: '유지', DISPOSE: '포기' }[d] ?? d
}
function openReply(id: number) {
  router.push(`/legal/reevaluation?tab=unread&open=${id}`)
}

// ── Mock fallback 데이터 ──────────────────────────────
const mockSummary: DashboardSummary = {
  progressRate: 62,
  kpi: { requested: 124, reviewing: 18, decided: 77 },
}

const mockAssignment: DashboardAssignment = {
  unassigned: 23,
  assigned:   78,
  completed:  48,
}

const mockDistribution: DashboardDistribution = {
  byTechField: [
    { name: '반도체', count: 82 },
    { name: '배터리', count: 58 },
    { name: '소재',   count: 42 },
    { name: 'AI/SW',  count: 35 },
    { name: '바이오', count: 18 },
  ],
  byExpiryQuarter: [
    { quarter: '2026Q2', count: 12 },
    { quarter: '2026Q3', count: 28 },
    { quarter: '2026Q4', count: 38 },
    { quarter: '2027Q1', count: 22 },
    { quarter: '2027Q2', count: 15 },
  ],
}

const mockDepartments: DashboardDepartments = {
  items: [
    { departmentId: 2, assigned: 42, reviewing: 8,  decided: 31 },
    { departmentId: 3, assigned: 35, reviewing: 5,  decided: 24 },
    { departmentId: 4, assigned: 28, reviewing: 4,  decided: 16 },
    { departmentId: 5, assigned: 19, reviewing: 1,  decided: 6  },
  ],
}

// ── 데이터 로드 ──────────────────────────────────────
async function loadAll() {
  await Promise.allSettled([
    dashboardApi.getSummary()
      .then(d => { summary.value = d })
      .catch(() => { summary.value = mockSummary })
      .finally(() => { loadingSummary.value = false }),
    dashboardApi.getAssignment()
      .then(d => { assignment.value = d })
      .catch(() => { assignment.value = mockAssignment })
      .finally(() => { loadingAssign.value = false }),
    dashboardApi.getDistribution()
      .then(d => { distribution.value = d })
      .catch(() => { distribution.value = mockDistribution })
      .finally(() => { loadingDist.value = false }),
    dashboardApi.getDepartments()
      .then(d => { departments.value = d })
      .catch(() => { departments.value = mockDepartments })
      .finally(() => { loadingDepts.value = false }),
  ])
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

.greeting__sub {
  font-size: 12.5px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-primary);
  margin: 0 0 5px;
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
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
}

@media (max-width: 1200px) { .kpi-row { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 720px)  { .kpi-row { grid-template-columns: repeat(2, 1fr); } }

.kpi-card {
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
.mid-row > .card { flex: 1; }
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
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

@media (max-width: 720px)  { .bottom-row { grid-template-columns: 1fr; } }

/* ── 기술 분야 분포 ───────────────────────────────── */
.tech-dist { display: flex; flex-direction: column; gap: 10px; }

.tech-dist__item { display: flex; flex-direction: column; gap: 5px; }

.tech-dist__bar-wrap {
  height: 7px;
  background: var(--color-surface-muted);
  border-radius: 4px;
  overflow: hidden;
}

.tech-dist__bar {
  height: 100%;
  border-radius: 4px;
  transition: width 0.7s cubic-bezier(0.4,0,0.2,1);
}

.tech-dist__info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.tech-dist__name  { font-size: 12.5px; font-weight: 500; color: var(--color-text-secondary); }
.tech-dist__count { font-size: 12.5px; font-weight: 700; color: var(--color-text); }

/* ── 만료 차트 ───────────────────────────────────── */
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
