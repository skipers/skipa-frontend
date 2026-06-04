<template>
  <div class="expiring-page">

    <!-- 페이지 헤더 -->
    <div class="page-header">
      <div>
        <p class="page-header__eyebrow">만료 예정 관리</p>
        <h2 class="page-header__title">만료 예정 특허</h2>
        <p class="page-header__desc">기간별 만료 예정 특허를 확인하고 유지/포기를 결정하세요</p>
      </div>
      <div class="view-toggle">
        <button :class="{ active: view === 'timeline' }" @click="view = 'timeline'">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
          타임라인
        </button>
        <button :class="{ active: view === 'calendar' }" @click="view = 'calendar'">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          캘린더
        </button>
      </div>
    </div>

    <!-- 기간 필터 -->
    <div class="period-filter">
      <button
        v-for="p in periods"
        :key="p.value"
        class="period-btn"
        :class="{ 'period-btn--active': activePeriod === p.value }"
        @click="activePeriod = p.value"
      >
        {{ p.label }}
        <span class="period-btn__count">{{ expiringByPeriod[p.value] ?? 0 }}</span>
      </button>
    </div>

    <!-- ── 타임라인 뷰 ── -->
    <template v-if="view === 'timeline'">

      <!-- 기간별 막대 시각화 -->
      <div class="chart-card">
        <div class="chart-card__header">
          <h3 class="chart-card__title">만료 예정 기간별 현황</h3>
          <div class="chart-legend">
            <div class="legend-item" v-for="(c, i) in periodColors" :key="i">
              <span class="legend-dot" :style="{ background: c.color }" />
              {{ c.label }}
            </div>
          </div>
        </div>
        <div class="period-bars">
          <div v-for="p in periodBarData" :key="p.label" class="period-bar-col">
            <div class="period-bar-wrap">
              <div
                class="period-bar"
                :style="{ height: periodBarH(p.count) + 'px', background: p.color }"
              />
            </div>
            <p class="period-bar-label">{{ p.label }}</p>
            <p class="period-bar-count" :style="{ color: p.color }">{{ p.count }}건</p>
          </div>
        </div>
      </div>

      <!-- 분야별 만료 분포 (Legal만) -->
      <div class="chart-card">
        <div class="chart-card__header">
          <h3 class="chart-card__title">분야별 만료 예정 분포</h3>
          <p class="chart-card__sub">{{ activePeriodLabel }} 기준</p>
        </div>
        <div class="field-dist">
          <div v-for="(f, i) in fieldDistItems" :key="f.name" class="field-dist-item">
            <div class="field-dist-item__info">
              <span class="field-dist-item__name">{{ f.name }}</span>
              <span class="field-dist-item__count">{{ f.count }}건</span>
            </div>
            <div class="field-dist-bar-wrap">
              <div
                class="field-dist-bar"
                :style="{ width: Math.round(f.count / maxField * 100) + '%', background: techColors[i % techColors.length] }"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 만료 예정 특허 목록 -->
      <div class="table-card">
        <div class="table-card__header">
          <h3 class="table-card__title">{{ activePeriodLabel }} 만료 예정 목록</h3>
          <p class="table-card__count">{{ filteredItems.length }}건</p>
        </div>
        <div class="expiry-list">
          <div
            v-for="item in filteredItems"
            :key="item.id"
            class="expiry-item"
            @click="router.push(`/legal/patent-search/${item.id}?from=expiring`)"
          >
            <div class="expiry-item__urgency" :class="`urgency--${item.urgency}`">
              <span class="urgency-dot" />
            </div>
            <div class="expiry-item__info">
              <p class="expiry-item__title">{{ item.title }}</p>
              <div class="expiry-item__meta">
                <span class="meta-pill">{{ item.applicationNumber }}</span>
                <span class="meta-pill">{{ item.techField }}</span>
                <span v-if="auth.isLegal" class="meta-pill">{{ item.dept }}</span>
              </div>
            </div>
            <div class="expiry-item__date">
              <p class="expiry-item__dday" :class="`dday--${item.urgency}`">
                D-{{ item.dday }}
              </p>
              <p class="expiry-item__expiry-date">{{ formatDate(item.expiryDate) }}</p>
            </div>
            <svg class="expiry-item__arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </div>
        </div>
      </div>

    </template>

    <!-- ── 캘린더 뷰 ── -->
    <template v-else>
      <div class="calendar-card">
        <div class="calendar-header">
          <button class="cal-nav" @click="prevMonth">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <h3 class="calendar-title">{{ calendarTitle }}</h3>
          <button class="cal-nav" @click="nextMonth">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>

        <!-- 요일 헤더 -->
        <div class="cal-weekdays">
          <span v-for="d in weekdays" :key="d">{{ d }}</span>
        </div>

        <!-- 날짜 그리드 -->
        <div class="cal-grid">
          <div
            v-for="cell in calendarCells"
            :key="cell.key"
            class="cal-cell"
            :class="{
              'cal-cell--other-month': !cell.isCurrentMonth,
              'cal-cell--today': cell.isToday,
              'cal-cell--has-events': cell.events.length > 0,
            }"
          >
            <span class="cal-cell__day">{{ cell.day }}</span>
            <div v-if="cell.events.length" class="cal-cell__events">
              <div
                v-for="(ev, ei) in cell.events.slice(0, 2)"
                :key="ei"
                class="cal-event"
                :class="`cal-event--${ev.urgency}`"
                :title="ev.title"
                @click="router.push(`/legal/patent-search/${ev.id}?from=expiring`)"
              >
                {{ ev.title.slice(0, 10) }}{{ ev.title.length > 10 ? '…' : '' }}
              </div>
              <p v-if="cell.events.length > 2" class="cal-cell__more">+{{ cell.events.length - 2 }}건</p>
            </div>
          </div>
        </div>

        <!-- 선택한 날 이벤트 -->
        <div v-if="selectedDayEvents.length" class="cal-detail">
          <h4 class="cal-detail__title">{{ selectedDateStr }} 만료 특허</h4>
          <div v-for="ev in selectedDayEvents" :key="ev.id" class="cal-detail-item" @click="router.push(`/legal/patent-search/${ev.id}?from=expiring`)">
            <div class="urgency-dot" :class="`urgency-dot--${ev.urgency}`" />
            <span>{{ ev.title }}</span>
          </div>
        </div>
      </div>
    </template>

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { EXPIRING_ITEMS } from '@/mocks/data'

const router = useRouter()
const auth   = useAuthStore()

// ── 뷰 모드 ─────────────────────────────────────────
const view         = ref<'timeline' | 'calendar'>('timeline')
const activePeriod = ref('1y')

// ── 색상 ────────────────────────────────────────────
const techColors = ['#6366f1','#0ea5e9','#10b981','#f59e0b','#ec4899','#8b5cf6']

const periodColors = [
  { label: '3개월 이내', color: '#ef4444' },
  { label: '6개월 이내', color: '#f59e0b' },
  { label: '1년 이내',   color: '#6366f1' },
  { label: '3년 이내',   color: '#0ea5e9' },
  { label: '5년 이내',   color: '#10b981' },
]

// ── 기간 필터 ────────────────────────────────────────
const periods = [
  { value: '3m', label: '3개월' },
  { value: '6m', label: '6개월' },
  { value: '1y', label: '1년' },
  { value: '3y', label: '3년' },
  { value: '5y', label: '5년' },
]

const expiringByPeriod: Record<string, number> = { '3m': 1, '6m': 2, '1y': 5, '3y': 12, '5y': 18 }

const activePeriodLabel = computed(() => {
  const found = periods.find(p => p.value === activePeriod.value)
  return found ? found.label + ' 이내' : ''
})

// ── 기간별 막대 차트 ─────────────────────────────────
const periodBarData = [
  { label: '3개월', count: 1,  color: '#ef4444' },
  { label: '6개월', count: 2,  color: '#f59e0b' },
  { label: '1년',   count: 5,  color: '#6366f1' },
  { label: '3년',   count: 12, color: '#0ea5e9' },
  { label: '5년',   count: 18, color: '#10b981' },
]
const maxPeriod = Math.max(...periodBarData.map(p => p.count))
function periodBarH(count: number) {
  return Math.round((count / maxPeriod) * 100) + 20
}

// ── 분야별 분포 ──────────────────────────────────────
const fieldDistAll: Record<string, { name: string; count: number }[]> = {
  '3m': [{ name: '에너지', count: 1 }],
  '6m': [{ name: '에너지', count: 2 }],
  '1y': [{ name: '에너지', count: 2 }, { name: '반도체', count: 1 }, { name: '통신', count: 1 }, { name: 'AI/ML', count: 1 }],
  '3y': [{ name: '에너지', count: 4 }, { name: '반도체', count: 4 }, { name: '통신', count: 2 }, { name: 'AI/ML', count: 2 }],
  '5y': [{ name: '에너지', count: 6 }, { name: '반도체', count: 6 }, { name: '통신', count: 3 }, { name: 'AI/ML', count: 3 }],
}

const fieldDistItems = computed(() => fieldDistAll[activePeriod.value] ?? [])
const maxField       = computed(() => Math.max(...fieldDistItems.value.map(f => f.count), 1))

// ── 만료 목록 ────────────────────────────────────────
const allItems = EXPIRING_ITEMS

const periodDays: Record<string, number> = { '3m': 90, '6m': 180, '1y': 365, '3y': 1095, '5y': 1825 }

const filteredItems = computed(() =>
  allItems.filter(i => i.dday <= (periodDays[activePeriod.value] ?? 365))
    .sort((a, b) => a.dday - b.dday)
)

function formatDate(d: string) { return d.replace(/-/g, '.') }

// ── 캘린더 ───────────────────────────────────────────
const today       = new Date()
const calYear     = ref(today.getFullYear())
const calMonth    = ref(today.getMonth()) // 0-indexed

const calendarTitle = computed(() => {
  return new Date(calYear.value, calMonth.value).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })
})

function prevMonth() { if (calMonth.value === 0) { calYear.value--; calMonth.value = 11 } else calMonth.value-- }
function nextMonth() { if (calMonth.value === 11) { calYear.value++; calMonth.value = 0  } else calMonth.value++ }

const weekdays = ['일', '월', '화', '수', '목', '금', '토']

interface CalEvent { id: number; title: string; urgency: string }

interface CalCell {
  key: string; day: number; date: Date
  isCurrentMonth: boolean; isToday: boolean
  events: CalEvent[]
}

const calendarCells = computed<CalCell[]>(() => {
  const firstDay = new Date(calYear.value, calMonth.value, 1)
  const lastDay  = new Date(calYear.value, calMonth.value + 1, 0)
  const cells: CalCell[] = []

  // 앞 패딩
  for (let i = firstDay.getDay(); i > 0; i--) {
    const d = new Date(firstDay)
    d.setDate(d.getDate() - i)
    cells.push({ key: d.toISOString(), day: d.getDate(), date: d, isCurrentMonth: false, isToday: false, events: [] })
  }

  // 현재 달
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const date = new Date(calYear.value, calMonth.value, d)
    const dateStr = date.toISOString().slice(0, 10)
    const events: CalEvent[] = allItems
      .filter(i => i.expiryDate === dateStr)
      .map(i => ({ id: i.id, title: i.title, urgency: i.urgency }))

    cells.push({
      key: dateStr, day: d, date,
      isCurrentMonth: true,
      isToday: dateStr === today.toISOString().slice(0, 10),
      events,
    })
  }

  // 뒤 패딩
  const remain = 42 - cells.length
  for (let i = 1; i <= remain; i++) {
    const d = new Date(lastDay)
    d.setDate(d.getDate() + i)
    cells.push({ key: d.toISOString() + i, day: d.getDate(), date: d, isCurrentMonth: false, isToday: false, events: [] })
  }

  return cells
})

const selectedDayEvents = ref<CalEvent[]>([])
const selectedDateStr   = ref('')
</script>

<style scoped>
.expiring-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  font-family: 'Pretendard', sans-serif;
}

/* ── 페이지 헤더 ─────────────────────────────────── */
.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}
.page-header__eyebrow {
  font-size: 12px; font-weight: 600; letter-spacing: .06em;
  text-transform: uppercase; color: #6366f1; margin: 0 0 5px;
}
.page-header__title {
  font-size: 22px; font-weight: 700; color: #0f172a;
  margin: 0 0 4px; letter-spacing: -0.02em;
}
.page-header__desc { font-size: 13.5px; color: #64748b; margin: 0; }

/* 뷰 토글 */
.view-toggle {
  display: flex;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
}
.view-toggle button {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 16px;
  background: none; border: none; cursor: pointer;
  font-size: 13px; font-weight: 500; font-family: inherit; color: #64748b;
  transition: background .13s, color .13s;
}
.view-toggle button.active { background: #0f172a; color: #fff; }

/* ── 기간 필터 ───────────────────────────────────── */
.period-filter { display: flex; gap: 8px; flex-wrap: wrap; }

.period-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 16px;
  background: #fff; border: 1px solid #e2e8f0; border-radius: 20px;
  font-size: 13px; font-weight: 500; font-family: inherit; color: #475569;
  cursor: pointer; transition: background .13s, border-color .13s, color .13s;
}
.period-btn:hover { background: #f8fafc; }
.period-btn--active { background: #0f172a; border-color: #0f172a; color: #fff; }

.period-btn__count {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 20px; height: 18px; padding: 0 5px;
  background: rgba(255,255,255,.2);
  border-radius: 9px; font-size: 11px; font-weight: 700;
}
.period-btn:not(.period-btn--active) .period-btn__count {
  background: #f1f5f9; color: #64748b;
}

/* ── 차트 카드 ────────────────────────────────────── */
.chart-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.chart-card__header {
  display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;
}
.chart-card__title { font-size: 14px; font-weight: 700; color: #0f172a; margin: 0; }
.chart-card__sub   { font-size: 12.5px; color: #94a3b8; }

/* 기간별 바 차트 */
.period-bars {
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  height: 160px;
  gap: 12px;
  padding-top: 20px;
}

.period-bar-col { display: flex; flex-direction: column; align-items: center; gap: 5px; flex: 1; }

.period-bar-wrap { display: flex; align-items: flex-end; height: 100px; }
.period-bar {
  width: 48px; border-radius: 6px 6px 0 0; min-height: 6px;
  transition: height .7s cubic-bezier(.4,0,.2,1);
  cursor: pointer;
}
.period-bar:hover { filter: brightness(1.08); }

.period-bar-label { font-size: 12px; color: #64748b; font-weight: 500; }
.period-bar-count { font-size: 14px; font-weight: 800; }

/* 분야별 분포 */
.field-dist { display: flex; flex-direction: column; gap: 12px; }
.field-dist-item { display: flex; flex-direction: column; gap: 5px; }
.field-dist-item__info { display: flex; justify-content: space-between; align-items: center; }
.field-dist-item__name  { font-size: 13px; font-weight: 600; color: #374151; }
.field-dist-item__count { font-size: 13px; font-weight: 700; color: #0f172a; }
.field-dist-bar-wrap { height: 8px; background: #f1f5f9; border-radius: 4px; overflow: hidden; }
.field-dist-bar { height: 100%; border-radius: 4px; transition: width .7s cubic-bezier(.4,0,.2,1); }

/* 만료 목록 */
.table-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  overflow: hidden;
}
.table-card__header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px; border-bottom: 1px solid #f1f5f9;
}
.table-card__title { font-size: 14px; font-weight: 700; color: #0f172a; margin: 0; }
.table-card__count { font-size: 13px; color: #64748b; }

.expiry-list { display: flex; flex-direction: column; }
.expiry-item {
  display: grid;
  grid-template-columns: 16px 1fr auto 24px;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  border-bottom: 1px solid #f8fafc;
  cursor: pointer;
  transition: background .12s;
}
.expiry-item:last-child { border-bottom: none; }
.expiry-item:hover { background: #f8fafc; }

.expiry-item__urgency { display: flex; align-items: center; justify-content: center; }
.urgency-dot {
  width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
}
.urgency--critical .urgency-dot,
.urgency-dot--critical { background: #ef4444; box-shadow: 0 0 5px rgba(239,68,68,.6); }
.urgency--warn    .urgency-dot,
.urgency-dot--warn    { background: #f59e0b; }
.urgency--normal  .urgency-dot,
.urgency-dot--normal  { background: #94a3b8; }

.expiry-item__info { display: flex; flex-direction: column; gap: 5px; min-width: 0; }
.expiry-item__title {
  font-size: 13.5px; font-weight: 600; color: #0f172a;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin: 0;
}
.expiry-item__meta { display: flex; gap: 6px; flex-wrap: wrap; }
.meta-pill {
  display: inline-block; padding: 2px 7px;
  background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 5px;
  font-size: 11.5px; color: #64748b;
}

.expiry-item__date { display: flex; flex-direction: column; align-items: flex-end; gap: 3px; }
.expiry-item__dday { font-size: 14px; font-weight: 800; margin: 0; }
.dday--critical { color: #dc2626; }
.dday--warn     { color: #b45309; }
.dday--normal   { color: #6366f1; }
.expiry-item__expiry-date { font-size: 11.5px; color: #94a3b8; margin: 0; }

.expiry-item__arrow { color: #cbd5e1; transition: color .12s; }
.expiry-item:hover .expiry-item__arrow { color: #6366f1; }

/* ── 범례 ────────────────────────────────────────── */
.chart-legend { display: flex; gap: 12px; flex-wrap: wrap; }
.legend-item  { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #64748b; }
.legend-dot   { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

/* ── 캘린더 ──────────────────────────────────────── */
.calendar-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.calendar-header {
  display: flex; align-items: center; justify-content: space-between;
}
.calendar-title { font-size: 17px; font-weight: 700; color: #0f172a; margin: 0; }
.cal-nav {
  width: 34px; height: 34px;
  background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: #374151; transition: background .13s;
}
.cal-nav:hover { background: #f1f5f9; }

.cal-weekdays {
  display: grid; grid-template-columns: repeat(7, 1fr);
  text-align: center;
}
.cal-weekdays span {
  padding: 8px 4px;
  font-size: 12px; font-weight: 700; color: #94a3b8;
  text-transform: uppercase; letter-spacing: .04em;
}

.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.cal-cell {
  min-height: 80px;
  border-radius: 8px;
  padding: 6px;
  border: 1px solid transparent;
  transition: border-color .12s;
}
.cal-cell--other-month { opacity: 0.35; }
.cal-cell--today { background: #eef2ff; border-color: #c7d2fe; }
.cal-cell--has-events { cursor: pointer; }
.cal-cell--has-events:hover { border-color: #e2e8f0; background: #f8fafc; }

.cal-cell__day {
  display: flex; align-items: center; justify-content: center;
  width: 24px; height: 24px;
  font-size: 12.5px; font-weight: 600; color: #374151;
  margin-bottom: 4px;
}
.cal-cell--today .cal-cell__day {
  background: #6366f1; color: #fff; border-radius: 50%;
}

.cal-cell__events { display: flex; flex-direction: column; gap: 2px; }

.cal-event {
  padding: 2px 5px;
  border-radius: 4px;
  font-size: 10.5px; font-weight: 500;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  cursor: pointer;
}
.cal-event--critical { background: #fef2f2; color: #dc2626; }
.cal-event--warn     { background: #fffbeb; color: #b45309; }
.cal-event--normal   { background: #eef2ff; color: #4338ca; }

.cal-cell__more { font-size: 10px; color: #94a3b8; margin: 0; padding: 0 5px; }

/* 선택된 날 상세 */
.cal-detail {
  border-top: 1px solid #f1f5f9;
  padding-top: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.cal-detail__title { font-size: 13.5px; font-weight: 700; color: #0f172a; margin: 0; }
.cal-detail-item {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 12px; background: #f8fafc; border-radius: 8px;
  font-size: 13px; cursor: pointer; transition: background .12s;
}
.cal-detail-item:hover { background: #f1f5f9; }
</style>
