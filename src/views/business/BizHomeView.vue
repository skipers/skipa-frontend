<template>
  <div class="biz-home">

    <!-- 인사 헤더 -->
    <div class="greeting">
      <div>
        <p class="greeting__eyebrow">{{ quarterLabel }} 검토 현황</p>
        <h2 class="greeting__title">안녕하세요, <span>{{ auth.user?.name ?? '사업부' }}</span> 👋</h2>
        <p class="greeting__desc">담당 특허의 유지/포기 의견을 제출해주세요</p>
      </div>
      <RouterLink to="/biz/review" class="btn-goto">
        검토 현황 바로가기
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </RouterLink>
    </div>

    <!-- D-Day + 제출 현황 상단 행 -->
    <div class="top-row">

      <!-- D-Day 카드 -->
      <div class="dday-card" :class="{ 'dday-card--urgent': ddayValue <= 7 }">
        <div class="dday-card__label">제출 마감까지</div>
        <div class="dday-card__main">
          <span class="dday-card__prefix">D</span>
          <span class="dday-card__num">{{ ddayValue <= 0 ? 'DAY' : `-${ddayValue}` }}</span>
        </div>
        <p class="dday-card__date">{{ deadlineStr }}</p>
        <div v-if="ddayValue <= 7 && ddayValue > 0" class="dday-card__warn">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          마감이 {{ ddayValue }}일 남았습니다
        </div>
      </div>

      <!-- 제출 현황 카드들 -->
      <div class="status-cards">
        <div class="status-card" v-for="s in statusCards" :key="s.label">
          <div class="status-card__icon" :style="{ background: s.iconBg, color: s.iconColor }">
            <span v-html="s.icon" />
          </div>
          <p class="status-card__value" :style="{ color: s.valueColor }">{{ s.value }}</p>
          <p class="status-card__label">{{ s.label }}</p>
        </div>
      </div>

      <!-- 제출 진행률 -->
      <div class="submit-progress-card">
        <div class="submit-progress-card__header">
          <p class="submit-progress-card__title">이번 분기 제출 현황</p>
          <span class="submit-progress-card__pct">{{ submitPct }}%</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" :style="{ width: submitPct + '%' }" />
        </div>
        <div class="submit-progress-card__detail">
          <span>미제출 <strong>{{ pendingCount }}건</strong></span>
          <span>제출 완료 <strong>{{ submittedCount }}건</strong></span>
        </div>

        <!-- 미제출 특허 미리보기 -->
        <div v-if="pendingItems.length" class="pending-preview">
          <p class="pending-preview__title">미제출 특허</p>
          <div
            v-for="item in pendingItems.slice(0, 3)"
            :key="item.id"
            class="pending-item"
            @click="router.push(`/patents/${item.id}`)"
          >
            <div class="pending-item__dot" />
            <span class="pending-item__title">{{ item.title }}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </div>
          <RouterLink v-if="pendingItems.length > 3" to="/biz/review" class="pending-more">
            +{{ pendingItems.length - 3 }}건 더 보기
          </RouterLink>
        </div>
      </div>

    </div>

    <!-- 최근 제출 이력 + 담당 특허 현황 -->
    <div class="bottom-row">

      <!-- 최근 제출 이력 -->
      <div class="card">
        <div class="card__header">
          <h3 class="card__title">최근 제출 이력</h3>
          <RouterLink to="/biz/patents" class="card__link">전체 이력</RouterLink>
        </div>
        <div v-if="loading" class="card__skel">
          <div class="skel-row" v-for="n in 4" :key="n" />
        </div>
        <div v-else-if="recentSubmissions.length" class="submission-list">
          <div v-for="s in recentSubmissions" :key="s.id" class="submission-item">
            <div class="submission-item__left">
              <div class="submission-item__icon" :class="`sub-icon--${s.decision.toLowerCase()}`">
                {{ decisionIcon(s.decision) }}
              </div>
              <div>
                <p class="submission-item__title">{{ s.patentTitle }}</p>
                <p class="submission-item__date">{{ formatDate(s.decidedAt) }} 제출</p>
              </div>
            </div>
            <span class="decision-badge" :class="`decision-badge--${s.decision.toLowerCase()}`">
              {{ decisionLabel(s.decision) }}
            </span>
          </div>
        </div>
        <div v-else class="card__empty">제출 이력이 없습니다.</div>
      </div>

      <!-- 담당 특허 현황 -->
      <div class="card">
        <div class="card__header">
          <h3 class="card__title">담당 특허 현황</h3>
          <RouterLink to="/biz/patents" class="card__link">특허 관리</RouterLink>
        </div>
        <div class="patent-stats">
          <div class="patent-stat" v-for="s in patentStatItems" :key="s.label">
            <div class="patent-stat__bar-wrap">
              <div class="patent-stat__bar" :style="{ width: s.pct + '%', background: s.color }" />
            </div>
            <div class="patent-stat__info">
              <span class="patent-stat__label">{{ s.label }}</span>
              <span class="patent-stat__count" :style="{ color: s.color }">{{ s.count }}건</span>
            </div>
          </div>
        </div>
        <RouterLink to="/biz/pre-eval-lab" class="lab-promo">
          <div class="lab-promo__icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v11m0 0H5a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2h-4m-6 0h6"/>
            </svg>
          </div>
          <div>
            <p class="lab-promo__title">사전 평가 Lab</p>
            <p class="lab-promo__desc">특허 가치를 미리 AI로 평가해보세요</p>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="flex-shrink:0; color:#6366f1">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </RouterLink>
      </div>

    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { inboxApi } from '@/api/misc'
import { patentsApi } from '@/api/patents'

const auth   = useAuthStore()
const router = useRouter()
const loading = ref(false)

// ── 마감일 (mock: 분기 말 기준) ──────────────────────
const deadline = computed(() => {
  const d = new Date()
  const q = Math.ceil((d.getMonth() + 1) / 3)
  const month = q * 3
  return new Date(d.getFullYear(), month, 0) // 분기 마지막 날
})

const ddayValue = computed(() => {
  const diff = Math.ceil((deadline.value.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  return Math.max(0, diff)
})

const deadlineStr = computed(() =>
  deadline.value.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
)

const quarterLabel = computed(() => {
  const d = new Date()
  return `${d.getFullYear()}년 ${Math.ceil((d.getMonth() + 1) / 3)}분기`
})

// ── 제출 현황 ────────────────────────────────────────
const totalCount     = ref(0)
const submittedCount = ref(0)
const pendingCount   = computed(() => totalCount.value - submittedCount.value)
const submitPct      = computed(() =>
  totalCount.value ? Math.round((submittedCount.value / totalCount.value) * 100) : 0
)

const statusCards = computed(() => [
  {
    label: '전체 담당', value: totalCount.value,
    icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
    iconBg: '#f1f5f9', iconColor: '#64748b', valueColor: '#0f172a',
  },
  {
    label: '미제출', value: pendingCount.value,
    icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
    iconBg: '#fffbeb', iconColor: '#f59e0b', valueColor: '#b45309',
  },
  {
    label: '제출 완료', value: submittedCount.value,
    icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
    iconBg: '#f0fdf4', iconColor: '#22c55e', valueColor: '#15803d',
  },
])

// ── 미제출 특허 목록 ──────────────────────────────────
const pendingItems = ref<{ id: number; title: string }[]>([])

// ── 최근 제출 이력 (mock) ────────────────────────────
const recentSubmissions = ref([
  { id: 1, patentTitle: 'NF3 가스 이물질 제거 시스템', decision: 'KEEP',    decidedAt: '2026-05-20' },
  { id: 2, patentTitle: '플라즈마 식각 장치 및 제어',   decision: 'DISPOSE', decidedAt: '2026-05-19' },
  { id: 3, patentTitle: '배터리 전극 코팅 균일도',       decision: 'KEEP',    decidedAt: '2026-05-17' },
  { id: 4, patentTitle: 'AI 기반 품질 검사 자동화',      decision: 'DISPOSE', decidedAt: '2026-05-15' },
])

// ── 담당 특허 현황 (mock) ────────────────────────────
const patentStatItems = computed(() => [
  { label: '유지 중',   count: submittedCount.value - 3, color: '#22c55e', pct: 70 },
  { label: '만료 예정', count: 5, color: '#f59e0b', pct: 22 },
  { label: '포기/만료', count: 3, color: '#ef4444', pct: 12 },
])

function decisionLabel(d: string) {
  return { KEEP: '유지', DISPOSE: '포기' }[d] ?? d
}
function decisionIcon(d: string) {
  return { KEEP: '✅', DISPOSE: '🗑' }[d] ?? '—'
}
function formatDate(d?: string) {
  if (!d) return '—'
  return d.replace(/-/g, '.')
}

// ── 데이터 로드 ──────────────────────────────────────
async function load() {
  loading.value = true
  try {
    const res = await inboxApi.list({ status: 'all', size: 100 })
    totalCount.value     = res.totalItems
    submittedCount.value = res.items.filter(i => i.decision !== null).length
    pendingItems.value   = res.items
      .filter(i => i.decision === null)
      .slice(0, 5)
      .map(i => ({ id: i.patentId, title: i.title }))
  } catch { /* API 미연결 시 mock 유지 */ }
  finally { loading.value = false }
}

onMounted(load)
</script>

<style scoped>
.biz-home {
  display: flex;
  flex-direction: column;
  gap: 24px;
  font-family: 'Pretendard', sans-serif;
}

/* ── 인사 헤더 ─────────────────────────────────── */
.greeting {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.greeting__eyebrow {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: .06em;
  text-transform: uppercase;
  color: var(--c-green-400);
  margin: 0 0 5px;
}

.greeting__title {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 4px;
  letter-spacing: -0.02em;
}
.greeting__title span { color: var(--c-green-500); }

.greeting__desc { font-size: 13.5px; color: var(--color-text-muted); margin: 0; }

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
  transition: background .15s, transform .12s;
  white-space: nowrap;
}
.btn-goto:hover { background: var(--color-navy-hover); transform: translateY(-1px); }

/* ── 상단 행 ─────────────────────────────────────── */
.top-row {
  display: grid;
  grid-template-columns: 200px 1fr 280px;
  gap: 16px;
  align-items: stretch;
}

@media (max-width: 1000px) {
  .top-row { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 680px) {
  .top-row { grid-template-columns: 1fr; }
}

/* ── D-Day 카드 ──────────────────────────────────── */
.dday-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 18px;
  padding: 24px 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.dday-card--urgent {
  background: linear-gradient(145deg, var(--c-red-50), var(--color-surface));
  border-color: var(--color-danger-border);
}

.dday-card__label {
  font-size: 11.5px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .06em;
  color: var(--color-text-subtle);
}

.dday-card__main {
  display: flex;
  align-items: baseline;
  gap: 2px;
}

.dday-card__prefix {
  font-size: 42px;
  font-weight: 900;
  color: var(--color-text);
  letter-spacing: -0.04em;
  line-height: 1;
}

.dday-card__num {
  font-size: 42px;
  font-weight: 900;
  color: var(--color-text);
  letter-spacing: -0.04em;
  line-height: 1;
}

.dday-card--urgent .dday-card__num,
.dday-card--urgent .dday-card__prefix { color: var(--color-danger); }

.dday-card__date {
  font-size: 12px;
  color: var(--color-text-subtle);
  margin: 0;
}

.dday-card__warn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  background: var(--color-danger-bg);
  color: var(--color-danger);
  border-radius: 7px;
  font-size: 11.5px;
  font-weight: 600;
  margin-top: 4px;
}

/* ── 상태 카드들 ─────────────────────────────────── */
.status-cards {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.status-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 14px 18px;
  display: flex;
  align-items: center;
  gap: 14px;
}

.status-card__icon {
  width: 36px; height: 36px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.status-card__value {
  font-size: 22px;
  font-weight: 800;
  margin: 0;
  letter-spacing: -0.03em;
  line-height: 1;
}

.status-card__label {
  font-size: 12px;
  color: var(--color-text-muted);
  font-weight: 500;
  margin: 0;
  margin-left: auto;
}

/* ── 제출 진행률 카드 ────────────────────────────── */
.submit-progress-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  justify-content: center;
}

.submit-progress-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.submit-progress-card__title { font-size: 14px; font-weight: 700; color: var(--color-text); margin: 0; }
.submit-progress-card__pct   { font-size: 15px; font-weight: 800; color: var(--c-green-400); }

.progress-track {
  height: 8px;
  background: var(--color-surface-muted);
  border-radius: 4px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--c-green-500), var(--c-green-300));
  border-radius: 4px;
  transition: width .6s cubic-bezier(.4,0,.2,1);
}

.submit-progress-card__detail {
  display: flex;
  justify-content: space-between;
  font-size: 12.5px;
  color: var(--color-text-muted);
}
.submit-progress-card__detail strong { color: var(--color-text); font-weight: 700; }

/* 미제출 미리보기 */
.pending-preview {
  border-top: 1px solid var(--color-surface-muted);
  padding-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.pending-preview__title {
  font-size: 11.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .04em;
  color: var(--color-text-subtle);
  margin: 0 0 4px;
}

.pending-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  background: var(--color-surface-hover);
  border-radius: 7px;
  cursor: pointer;
  transition: background .12s;
}
.pending-item:hover { background: var(--color-surface-muted); }

.pending-item__dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--color-warn);
  flex-shrink: 0;
}

.pending-item__title {
  flex: 1;
  font-size: 12.5px;
  font-weight: 500;
  color: var(--color-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pending-more {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--color-primary);
  text-decoration: none;
  padding: 4px 10px;
  text-align: center;
}

/* ── 하단 행 ─────────────────────────────────────── */
.bottom-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

@media (max-width: 760px) { .bottom-row { grid-template-columns: 1fr; } }

/* ── 공통 카드 ────────────────────────────────────── */
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.card__header { display: flex; align-items: center; justify-content: space-between; }
.card__title  { font-size: 14px; font-weight: 700; color: var(--color-text); margin: 0; }
.card__link   { font-size: 12.5px; font-weight: 500; color: var(--color-primary); text-decoration: none; }
.card__link:hover { color: var(--color-primary-darker); }
.card__empty  { font-size: 13px; color: var(--color-text-subtle); padding: 24px 0; text-align: center; }
.card__skel   { display: flex; flex-direction: column; gap: 8px; }
.skel-row {
  height: 40px; border-radius: 8px;
  background: linear-gradient(90deg, var(--color-surface-muted) 25%, var(--c-slate-150) 50%, var(--color-surface-muted) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

/* ── 제출 이력 ────────────────────────────────────── */
.submission-list { display: flex; flex-direction: column; gap: 0; }

.submission-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid var(--color-surface-hover);
}
.submission-item:last-child { border-bottom: none; }

.submission-item__left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.submission-item__icon {
  width: 30px; height: 30px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
}
.sub-icon--keep    { background: var(--color-success-bg); }
.sub-icon--sell    { background: var(--color-primary-bg); }
.sub-icon--dispose { background: var(--color-danger-bg); }

.submission-item__title {
  font-size: 13px; font-weight: 600; color: var(--color-text);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  margin: 0 0 2px;
}
.submission-item__date { font-size: 11.5px; color: var(--color-text-subtle); margin: 0; }

.decision-badge {
  padding: 3px 9px; border-radius: 6px;
  font-size: 12px; font-weight: 700; flex-shrink: 0;
}
.decision-badge--keep    { background: var(--color-success-bg); color: var(--color-success-dark); }
.decision-badge--sell    { background: var(--color-primary-bg); color: var(--color-primary-darker); }
.decision-badge--dispose { background: var(--color-danger-bg); color: var(--color-danger); }

/* ── 담당 특허 현황 ───────────────────────────────── */
.patent-stats { display: flex; flex-direction: column; gap: 10px; }

.patent-stat { display: flex; flex-direction: column; gap: 5px; }

.patent-stat__bar-wrap {
  height: 7px; background: var(--color-surface-muted); border-radius: 4px; overflow: hidden;
}
.patent-stat__bar {
  height: 100%; border-radius: 4px;
  transition: width .7s cubic-bezier(.4,0,.2,1);
}
.patent-stat__info { display: flex; justify-content: space-between; align-items: center; }
.patent-stat__label { font-size: 12.5px; color: var(--color-text-secondary); font-weight: 500; }
.patent-stat__count { font-size: 12.5px; font-weight: 700; }

/* ── Lab 프로모 ──────────────────────────────────── */
.lab-promo {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: linear-gradient(135deg, var(--color-surface-soft), var(--c-primary-50));
  border: 1px solid var(--color-primary-border);
  border-radius: 12px;
  text-decoration: none;
  margin-top: 4px;
  transition: border-color .15s, background .15s;
}
.lab-promo:hover { border-color: var(--c-primary-200); background: var(--c-primary-50); }

.lab-promo__icon {
  width: 36px; height: 36px;
  background: var(--color-primary-bg);
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary);
  flex-shrink: 0;
}

.lab-promo__title { font-size: 13.5px; font-weight: 700; color: var(--color-text); margin: 0 0 2px; }
.lab-promo__desc  { font-size: 12px; color: var(--color-text-muted); margin: 0; }
</style>
