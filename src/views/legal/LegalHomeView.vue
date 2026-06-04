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
      <div
        v-for="kpi in kpiCards"
        :key="kpi.label"
        class="kpi-card"
        :class="{ 'kpi-card--alert': kpi.alert }"
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
      </div>
    </div>

    <!-- 중간 행: 배정 현황 + 사업부별 처리 현황 -->
    <div class="mid-row">

      <!-- 배정 현황 퍼널 -->
      <div class="card">
        <div class="card__header">
          <h3 class="card__title">배정 현황</h3>
          <RouterLink to="/legal/reevaluation" class="card__link">전체 보기</RouterLink>
        </div>
        <div v-if="loadingAssign" class="card__skeleton">
          <div class="skel skel--bar" v-for="n in 3" :key="n" />
        </div>
        <div v-else class="funnel">
          <div v-for="step in funnelSteps" :key="step.label" class="funnel-step">
            <div class="funnel-step__bar-wrap">
              <div
                class="funnel-step__bar"
                :style="{ width: funnelPct(step.value) + '%', background: step.color }"
              />
            </div>
            <div class="funnel-step__info">
              <span class="funnel-step__label">{{ step.label }}</span>
              <span class="funnel-step__value" :style="{ color: step.color }">{{ step.value }}건</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 사업부별 처리 현황 -->
      <div class="card card--wide">
        <div class="card__header">
          <h3 class="card__title">사업부별 처리 현황</h3>
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
          <div v-for="d in deptItems" :key="d.departmentId" class="dept-row">
            <span class="dept-row__name">
              <span class="dept-dot" />
              {{ deptName(d.departmentId) }}
            </span>
            <span class="dept-row__num">{{ d.assigned }}</span>
            <span class="dept-row__num dept-row__num--done">{{ d.decided }}</span>
            <div class="dept-mini-bar">
              <div
                class="dept-mini-bar__fill"
                :style="{ width: deptPct(d) + '%' }"
              />
              <span>{{ deptPct(d) }}%</span>
            </div>
          </div>
        </div>
        <div v-else class="card__empty">데이터가 없습니다.</div>
      </div>

    </div>

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
          <h3 class="card__title">분기별 만료 예정</h3>
          <RouterLink to="/legal/expiring" class="card__link">만료 관리</RouterLink>
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

      <!-- 최근 사업부 회신 -->
      <div class="card">
        <div class="card__header">
          <h3 class="card__title">최근 회신</h3>
          <RouterLink to="/legal/reevaluation" class="card__link">전체 보기</RouterLink>
        </div>
        <div v-if="loadingSummary" class="card__skeleton">
          <div class="skel skel--row" v-for="n in 4" :key="n" />
        </div>
        <div v-else class="reply-list">
          <div v-if="recentReplies.length" class="reply-items">
            <div v-for="r in recentReplies" :key="r.id" class="reply-item">
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
          </div>
          <div v-else class="card__empty">최근 회신이 없습니다.</div>
        </div>
      </div>

    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { dashboardApi } from '@/api/misc'
import { RECENT_REPLIES } from '@/mocks/data'
import type {
  DashboardSummary,
  DashboardAssignment,
  DashboardDistribution,
  DashboardDepartments,
} from '@/types'

const auth = useAuthStore()

// ── 로딩 상태 (초기 false = 목업으로 즉시 렌더) ─────
const loadingSummary = ref(false)
const loadingAssign  = ref(false)
const loadingDist    = ref(false)
const loadingDepts   = ref(false)

// ── API 데이터 (목업 기본값) ─────────────────────────
const summary = ref<DashboardSummary>({
  progressRate: 33,
  kpi: { requested: 15, decided: 6 },
} as DashboardSummary)

const assignment = ref<DashboardAssignment>({
  unassigned: 3, assigned: 15, completed: 6,
} as DashboardAssignment)

const distribution = ref<DashboardDistribution>({
  byTechField: [
    { name: 'AI/ML',  count: 7 },
    { name: '에너지', count: 5 },
    { name: '반도체', count: 4 },
    { name: '통신',   count: 3 },
    { name: '제조',   count: 3 },
  ],
  byExpiryQuarter: [
    { quarter: '2026Q3', count: 2 },
    { quarter: '2026Q4', count: 1 },
    { quarter: '2027Q1', count: 3 },
    { quarter: '2027Q2', count: 2 },
  ],
} as DashboardDistribution)

const departments = ref<DashboardDepartments>({
  items: [
    { departmentId: 2, assigned: 6, decided: 3 },
    { departmentId: 3, assigned: 4, decided: 1 },
    { departmentId: 4, assigned: 5, decided: 2 },
    { departmentId: 5, assigned: 3, decided: 1 },
  ],
} as DashboardDepartments)

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
  const delayed = 4

  return [
    {
      label: '분기 진행률',
      value: s ? `${s.progressRate}%` : null,
      progress: s?.progressRate ?? 0,
      progressColor: '#6366f1',
      sub: `요청 ${s?.kpi.requested ?? 0}건 중 결정 ${s?.kpi.decided ?? 0}건`,
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
    },
    {
      label: '지연',
      value: delayed,
      sub: `미회신 기한 초과`,
      alertCount: delayed,
      icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
      iconBg: '#fef2f2', iconColor: '#dc2626',
      alert: true, valueColor: '#dc2626', progress: null, progressColor: '',
    },
    {
      label: '결정 완료',
      value: s?.kpi.decided ?? null,
      sub: '회신 수신 완료',
      icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
      iconBg: '#f0fdf4', iconColor: '#22c55e',
      alert: false, alertCount: 0, valueColor: '#0f172a', progress: null, progressColor: '',
    },
    {
      label: '미배정',
      value: a?.unassigned ?? null,
      sub: '부서 배정 필요',
      icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="23" y1="11" x2="17" y2="11"/></svg>`,
      iconBg: '#f8fafc', iconColor: '#64748b',
      alert: false, alertCount: 0, valueColor: '#0f172a', progress: null, progressColor: '',
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
  1: 'Legal팀', 2: '반도체사업부', 3: '통신사업부',
  4: '에너지사업부', 5: '제조사업부',
}
function deptName(id: number) { return deptNameMap[id] ?? `사업부 #${id}` }
function deptPct(d: { assigned: number; decided: number }) {
  return d.assigned ? Math.round((d.decided / d.assigned) * 100) : 0
}

// ── 기술 분야 ─────────────────────────────────────────
const techColors = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6']
const techFieldItems = computed(() => distribution.value?.byTechField ?? [])
function techPct(count: number) {
  const max = Math.max(...techFieldItems.value.map(i => i.count), 1)
  return Math.round((count / max) * 100)
}

// ── 만료 차트 ─────────────────────────────────────────
const expiryItems = computed(() => distribution.value?.byExpiryQuarter ?? [])
function expiryBarH(count: number) {
  const max = Math.max(...expiryItems.value.map(i => i.count), 1)
  return Math.round((count / max) * 80) + 20
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
const recentReplies = ref(RECENT_REPLIES)

function decisionLabel(d: string) {
  return { KEEP: '유지', DISPOSE: '포기' }[d] ?? d
}

// ── 데이터 로드 ──────────────────────────────────────
async function loadAll() {
  await Promise.allSettled([
    dashboardApi.getSummary().then(d => { summary.value = d }).finally(() => { loadingSummary.value = false }),
    dashboardApi.getAssignment().then(d => { assignment.value = d }).finally(() => { loadingAssign.value = false }),
    dashboardApi.getDistribution().then(d => { distribution.value = d }).finally(() => { loadingDist.value = false }),
    dashboardApi.getDepartments().then(d => { departments.value = d }).finally(() => { loadingDepts.value = false }),
  ])
}

onMounted(loadAll)
</script>

<style scoped>
.legal-home {
  display: flex;
  flex-direction: column;
  gap: 20px;
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
  color: #6366f1;
  margin: 0 0 5px;
}

.greeting__title {
  font-size: 24px;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
  letter-spacing: -0.02em;
}
.greeting__title span { color: #4f46e5; }

.btn-goto {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: #0f172a;
  color: #fff;
  border-radius: 10px;
  text-decoration: none;
  font-size: 13.5px;
  font-weight: 600;
  transition: background 0.15s, transform 0.12s;
  white-space: nowrap;
}
.btn-goto:hover { background: #1e293b; transform: translateY(-1px); }

/* ── KPI 카드 ────────────────────────────────────── */
.kpi-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
}

@media (max-width: 1200px) { .kpi-row { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 720px)  { .kpi-row { grid-template-columns: repeat(2, 1fr); } }

.kpi-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 18px 16px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: box-shadow 0.15s;
}
.kpi-card:hover { box-shadow: 0 4px 16px rgba(15,23,42,0.06); }
.kpi-card--alert { border-color: #fecaca; background: #fffafa; }

.kpi-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.kpi-card__label {
  font-size: 11.5px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.04em;
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
  color: #0f172a;
  margin: 2px 0 0;
  letter-spacing: -0.03em;
  line-height: 1;
}

.kpi-card__sub {
  font-size: 11.5px;
  color: #94a3b8;
  margin: 0;
}

.kpi-card__alert-badge {
  display: inline-block;
  padding: 2px 7px;
  background: #fef2f2;
  color: #dc2626;
  border-radius: 5px;
  font-size: 11.5px;
  font-weight: 700;
}

.kpi-progress {
  height: 4px;
  background: #f1f5f9;
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
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card--wide { flex: 1.6; }

.card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card__title {
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
  letter-spacing: -0.01em;
}

.card__link {
  font-size: 12.5px;
  font-weight: 500;
  color: #6366f1;
  text-decoration: none;
  transition: color 0.13s;
}
.card__link:hover { color: #4338ca; }

.card__empty {
  padding: 32px;
  text-align: center;
  font-size: 13px;
  color: #94a3b8;
}

.card__skeleton { display: flex; flex-direction: column; gap: 10px; }

.skel {
  background: linear-gradient(90deg, #f1f5f9 25%, #e8edf5 50%, #f1f5f9 75%);
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

/* ── 퍼널 ────────────────────────────────────────── */
.funnel { display: flex; flex-direction: column; gap: 10px; }

.funnel-step { display: flex; flex-direction: column; gap: 6px; }

.funnel-step__bar-wrap {
  height: 8px;
  background: #f1f5f9;
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

.funnel-step__label { font-size: 12.5px; color: #64748b; font-weight: 500; }
.funnel-step__value { font-size: 13.5px; font-weight: 700; }

/* ── 사업부 테이블 ────────────────────────────────── */
.dept-table { display: flex; flex-direction: column; gap: 0; }

.dept-table__head {
  display: grid;
  grid-template-columns: 1.8fr repeat(2, 0.7fr) 1.2fr;
  padding: 8px 10px;
  font-size: 11px;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-bottom: 1px solid #f1f5f9;
  gap: 8px;
}

.dept-row {
  display: grid;
  grid-template-columns: 1.8fr repeat(2, 0.7fr) 1.2fr;
  padding: 11px 10px;
  border-bottom: 1px solid #f8fafc;
  align-items: center;
  gap: 8px;
  transition: background 0.12s;
}
.dept-row:last-child { border-bottom: none; }
.dept-row:hover { background: #f8fafc; }

.dept-row__name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #0f172a;
}

.dept-dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  background: #6366f1;
  flex-shrink: 0;
}

.dept-row__num {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  text-align: center;
}
.dept-row__num--done { color: #22c55e; font-weight: 700; }

.dept-mini-bar {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dept-mini-bar {
  position: relative;
  height: 6px;
  background: #f1f5f9;
  border-radius: 3px;
  flex: 1;
  overflow: hidden;
}

.dept-mini-bar__fill {
  height: 100%;
  background: linear-gradient(90deg, #4f46e5, #818cf8);
  border-radius: 3px;
  transition: width 0.6s cubic-bezier(0.4,0,0.2,1);
}

.dept-mini-bar span {
  position: absolute;
  right: 0; top: -18px;
  font-size: 11px; font-weight: 600; color: #64748b;
  white-space: nowrap;
}

/* ── 하단 행 ─────────────────────────────────────── */
.bottom-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 16px;
}

@media (max-width: 1100px) { .bottom-row { grid-template-columns: 1fr 1fr; } }
@media (max-width: 720px)  { .bottom-row { grid-template-columns: 1fr; } }

/* ── 기술 분야 분포 ───────────────────────────────── */
.tech-dist { display: flex; flex-direction: column; gap: 10px; }

.tech-dist__item { display: flex; flex-direction: column; gap: 5px; }

.tech-dist__bar-wrap {
  height: 7px;
  background: #f1f5f9;
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
.tech-dist__name  { font-size: 12.5px; font-weight: 500; color: #374151; }
.tech-dist__count { font-size: 12.5px; font-weight: 700; color: #0f172a; }

/* ── 만료 차트 ───────────────────────────────────── */
.expiry-chart {
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  gap: 6px;
  height: 130px;
  padding-top: 20px;
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
  height: 80px;
}

.expiry-bar {
  width: 28px;
  border-radius: 5px 5px 0 0;
  transition: height 0.6s cubic-bezier(0.4,0,0.2,1);
  min-height: 6px;
}

.expiry-bar-label {
  font-size: 10.5px;
  color: #94a3b8;
  font-weight: 500;
  text-align: center;
}
.expiry-bar-count {
  font-size: 12px;
  font-weight: 700;
  text-align: center;
}

/* ── 최근 회신 ───────────────────────────────────── */
.reply-items { display: flex; flex-direction: column; gap: 0; }

.reply-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid #f8fafc;
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
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
}

.reply-item__title {
  font-size: 12.5px;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.reply-item__dept {
  font-size: 11.5px;
  color: #94a3b8;
  margin: 0;
}

.reply-item__badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 9px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}
.reply-badge--keep    { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }
.reply-badge--sell    { background: #f8fafc; color: #475569; border: 1px solid #e2e8f0; }
.reply-badge--dispose { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
</style>
