<template>
  <div class="expiring-page">

    <!-- 페이지 헤더 -->
    <div class="page-header">
      <div>
        <h2 class="page-header__title">소멸 예정 특허</h2>
        <p class="page-header__desc">기간별 소멸 예정 특허를 확인하고 유지/포기를 결정하세요</p>
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

    <!-- ── 타임라인 뷰 ── -->
    <template v-if="view === 'timeline'">

      <!-- 기간별 막대 시각화 -->
      <div class="chart-card">
        <div class="chart-card__header">
          <h3 class="chart-card__title">소멸 예정 기간별 현황</h3>
          <div class="chart-legend">
            <div class="legend-item" v-for="(c, i) in periodColors" :key="i">
              <span class="legend-dot" :style="{ background: c.color }" />
              {{ c.label }}
            </div>
          </div>
        </div>
        <div class="period-bars">
          <div
            v-for="p in periodBarData" :key="p.label"
            class="period-bar-col"
            :class="{ 'period-bar-col--selected': activeFilter === p.value }"
            @click="activeFilter = p.value as 'all' | '3m' | '6m' | '1y' | '3y' | '5y'"
          >
            <div class="period-bar-wrap">
              <div
                class="period-bar"
                :style="{ height: periodBarH(p.count) + 'px', background: p.color, opacity: activeFilter === p.value ? 1 : 0.55 }"
              />
            </div>
            <p class="period-bar-label">{{ p.label }}</p>
            <p class="period-bar-count" :style="{ color: p.color }">{{ p.count }}건</p>
          </div>
        </div>

        <!-- 기술분야별 비율 스택 바 (Legal만) -->
        <template v-if="!deptId">
          <div class="field-stack-header">
            <span class="field-stack-title">기술분야별 구성 — {{ selectedBarLabel }}</span>
            <div class="field-stack-legend">
              <span v-for="(f, i) in heatmapFields" :key="f" class="field-stack-legend-item">
                <span class="field-legend-dot" :style="{ background: fieldColors[i] }" />{{ f }}
              </span>
            </div>
          </div>
          <div class="field-stack-bar">
            <div
              v-for="(f, i) in heatmapFields"
              :key="f"
              class="field-stack-seg"
              :style="{ width: fieldStackPct(f) + '%', background: fieldColors[i] }"
              :title="`${f}: ${heatmapData[f]?.[heatmapKey] ?? 0}건 (${fieldStackPct(f)}%)`"
            >
              <span v-if="fieldStackPct(f) >= 8" class="field-stack-seg__label">{{ fieldStackPct(f) }}%</span>
            </div>
          </div>
        </template>
      </div>

      <!-- 소멸 예정 특허 목록 -->
      <div class="table-card">
        <div class="table-card__header">
          <h3 class="table-card__title">소멸 예정 목록</h3>
          <p class="table-card__count">{{ filteredItems.length }}건</p>
        </div>
        <div class="expiry-list">
          <div
            v-for="item in filteredItems"
            :key="item.id"
            class="expiry-item"
            @click="goDetail(item.id)"
          >
            <div class="expiry-item__urgency" :class="`urgency--${item.urgency}`">
              <span class="urgency-dot" />
            </div>
            <div class="expiry-item__info">
              <p class="expiry-item__title">{{ item.title }}</p>
              <div class="expiry-item__meta">
                <span class="meta-pill">{{ item.applicationNumber }}</span>
                <span class="meta-pill">{{ item.techField }}</span>
                <span v-if="!deptId" class="meta-pill">{{ item.dept }}</span>
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

    <!-- ── 연도별 캘린더 뷰 ── -->
    <template v-else>
      <div class="ycal-card">
        <!-- 연도 네비게이션 -->
        <div class="ycal-header">
          <button class="cal-nav" @click="calYear--">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <h3 class="ycal-title">{{ calYear }}년 소멸 예정</h3>
          <button class="cal-nav" @click="calYear++">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>

        <!-- 12달 그리드 -->
        <div class="ycal-grid">
          <div
            v-for="m in yearMonths"
            :key="m.month"
            class="ycal-month"
            :class="{
              'ycal-month--active': selectedMonth === m.month,
              'ycal-month--today': m.isCurrentMonth,
              'ycal-month--empty': m.items.length === 0,
            }"
            @click="selectedMonth = selectedMonth === m.month ? null : m.month"
          >
            <div class="ycal-month__top">
              <span class="ycal-month__name">{{ m.monthLabel }}</span>
              <span v-if="m.items.length" class="ycal-month__badge" :class="`ycal-badge--${m.topUrgency}`">
                {{ m.items.length }}건
              </span>
            </div>
            <div v-if="m.items.length" class="ycal-month__dots">
              <span
                v-for="(item, i) in m.items.slice(0, 5)"
                :key="i"
                class="ycal-dot"
                :class="`ycal-dot--${item.urgency}`"
              />
              <span v-if="m.items.length > 5" class="ycal-dot-more">+{{ m.items.length - 5 }}</span>
            </div>
            <p v-else class="ycal-month__empty-text">없음</p>
          </div>
        </div>

        <!-- 선택한 달 상세 목록 -->
        <Transition name="slide-down">
          <div v-if="selectedMonth !== null && selectedMonthItems.length" class="ycal-detail">
            <h4 class="ycal-detail__title">{{ calYear }}년 {{ selectedMonth + 1 }}월 소멸 예정 특허</h4>
            <div
              v-for="item in selectedMonthItems"
              :key="item.id"
              class="ycal-detail-item"
              @click="goDetail(item.id)"
            >
              <span class="urgency-dot" :class="`urgency--${item.urgency}`" />
              <div class="ycal-detail-item__info">
                <p class="ycal-detail-item__title">{{ item.title }}</p>
                <span class="ycal-detail-item__meta">{{ item.applicationNumber }} · {{ item.techField }}<template v-if="!deptId"> · {{ item.dept }}</template></span>
              </div>
              <span class="ycal-detail-item__dday" :class="`dday--${item.urgency}`">{{ formatDate(item.expiryDate) }}</span>
            </div>
          </div>
        </Transition>
      </div>
    </template>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { expiringApi } from '@/api/expiring'

const props = defineProps<{ deptId?: number }>()
const { deptId } = props

const router = useRouter()
const route  = useRoute()
const base   = computed(() => route.path.startsWith('/biz') ? '/biz' : '/legal')
function goDetail(id: number) { router.push(`${base.value}/patents/${id}`) }

// ── 뷰 모드 ─────────────────────────────────────────
const view         = ref<'timeline' | 'calendar'>('timeline')
const activeFilter = ref<'all' | '3m' | '6m' | '1y' | '3y' | '5y'>('5y')

// ── 색상 ────────────────────────────────────────────
const periodColors = [
  { label: '3개월 이내', color: '#E88989' },
  { label: '6개월 이내', color: '#FFBC5E' },
  { label: '1년 이내',   color: '#ABACED' },
  { label: '3년 이내',   color: '#84DBED' },
  { label: '5년 이내',   color: '#67E2AB' },
]

const periodDays: Record<string, number> = { '3m': 90, '6m': 180, '1y': 365, '3y': 1095, '5y': 1825 }

// ── 소멸 목록 ─────────────────────────────────────────
interface ExpiryItem {
  id: number; title: string; applicationNumber: string
  techField: string; dept: string; deptId?: number; expiryDate: string
  dday: number; urgency: 'critical' | 'warn' | 'normal'
}

function computeDday(expiryDate: string): number {
  return Math.ceil((new Date(expiryDate).getTime() - Date.now()) / 86400000)
}
function computeUrgency(dday: number): 'critical' | 'warn' | 'normal' {
  if (dday <= 90) return 'critical'
  if (dday <= 180) return 'warn'
  return 'normal'
}

const allItems = ref<ExpiryItem[]>([])
const loading  = ref(false)

async function fetchItems() {
  loading.value = true
  try {
    // TODO: 확인 필요 - departmentId 파라미터 Swagger 명세에서 제거됨
    const res = await expiringApi.getExpiringPatents({ size: 500 })
    allItems.value = res.items.map(item => {
      const dday = computeDday(item.expiryDate)
      return {
        id: item.id,
        title: item.title,
        applicationNumber: item.applicationNumber,
        techField: item.techField,
        dept: item.departmentName,
        deptId: item.departmentId,
        expiryDate: item.expiryDate,
        dday,
        urgency: computeUrgency(dday),
      }
    })
  } catch (err) {
    console.error('소멸 예정 특허 조회 실패:', err)
    allItems.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => fetchItems())

// ── 기간별 막대 차트 (allItems로부터 계산) ─────────────
const periodBarData = computed(() => [
  { value: '3m', label: '3개월', count: allItems.value.filter(i => i.dday <= 90).length,   color: '#E88989' },
  { value: '6m', label: '6개월', count: allItems.value.filter(i => i.dday <= 180).length,  color: '#FFBC5E' },
  { value: '1y', label: '1년',   count: allItems.value.filter(i => i.dday <= 365).length,  color: '#ABACED' },
  { value: '3y', label: '3년',   count: allItems.value.filter(i => i.dday <= 1095).length, color: '#84DBED' },
  { value: '5y', label: '5년',   count: allItems.value.filter(i => i.dday <= 1825).length, color: '#67E2AB' },
])
const maxPeriod = computed(() => Math.max(...periodBarData.value.map(p => p.count), 1))

function periodBarH(count: number) {
  return Math.round((count / maxPeriod.value) * 120) + 16
}

const selectedBarLabel = computed(() => {
  if (activeFilter.value === 'all') return '전체'
  return (periodBarData.value.find(p => p.value === activeFilter.value)?.label ?? '') + ' 이내'
})

const scopedItems = computed(() =>
  props.deptId ? allItems.value.filter(i => i.deptId === props.deptId) : allItems.value
)

const filteredItems = computed(() => {
  if (activeFilter.value === 'all') return [...scopedItems.value].sort((a, b) => a.dday - b.dday)
  return scopedItems.value
    .filter(i => i.dday <= (periodDays[activeFilter.value] ?? 365))
    .sort((a, b) => a.dday - b.dday)
})

// ── 기술분야별 스택 바 (allItems로부터 계산) ─────────────
const heatmapFields = ['반도체', '배터리', 'AI/SW', '소재']
const fieldColors   = ['#ABACED', '#67E2AB', '#FFBC5E', '#84DBED']

const heatmapData = computed(() => {
  const result: Record<string, Record<string, number>> = {}
  for (const field of heatmapFields) {
    result[field] = {
      '3m': allItems.value.filter(i => i.techField === field && i.dday <= 90).length,
      '6m': allItems.value.filter(i => i.techField === field && i.dday <= 180).length,
      '1y': allItems.value.filter(i => i.techField === field && i.dday <= 365).length,
      '3y': allItems.value.filter(i => i.techField === field && i.dday <= 1095).length,
      '5y': allItems.value.filter(i => i.techField === field && i.dday <= 1825).length,
    }
  }
  return result
})

const heatmapKey = computed(() => activeFilter.value === 'all' ? '5y' : activeFilter.value)
const fieldStackTotal = computed(() =>
  heatmapFields.reduce((sum, f) => sum + (heatmapData.value[f]?.[heatmapKey.value] ?? 0), 0)
)
function fieldStackPct(field: string) {
  const total = fieldStackTotal.value
  if (!total) return 0
  return Math.round((heatmapData.value[field]?.[heatmapKey.value] ?? 0) / total * 100)
}

function formatDate(d: string) { return d.replace(/-/g, '.') }

// ── 연도별 캘린더 ────────────────────────────────────
const today       = new Date()
const calYear     = ref(today.getFullYear())
const selectedMonth = ref<number | null>(null)

const monthNames = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']

const yearMonths = computed(() =>
  monthNames.map((monthLabel, month) => {
    const items = scopedItems.value.filter(i => {
      const d = new Date(i.expiryDate)
      return d.getFullYear() === calYear.value && d.getMonth() === month
    })
    const urgencyOrder = { critical: 0, warn: 1, normal: 2 }
    const topUrgency = items.length
      ? items.reduce((a, b) => urgencyOrder[a.urgency] <= urgencyOrder[b.urgency] ? a : b).urgency
      : 'normal'
    return {
      month,
      monthLabel,
      items,
      topUrgency,
      isCurrentMonth: today.getFullYear() === calYear.value && today.getMonth() === month,
    }
  })
)

const selectedMonthItems = computed(() =>
  selectedMonth.value !== null
    ? scopedItems.value
        .filter(i => {
          const d = new Date(i.expiryDate)
          return d.getFullYear() === calYear.value && d.getMonth() === selectedMonth.value
        })
        .sort((a, b) => a.dday - b.dday)
    : []
)
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
.page-header__title {
  font-size: 22px; font-weight: 700; color: var(--color-text);
  margin: 0 0 4px; letter-spacing: -0.02em;
}
.page-header__desc { font-size: 13.5px; color: var(--color-text-muted); margin: 0; }

/* 뷰 토글 */
.view-toggle {
  display: flex;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  overflow: hidden;
}
.view-toggle button {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 16px;
  background: none; border: none; cursor: pointer;
  font-size: 13px; font-weight: 500; font-family: inherit; color: var(--color-text-muted);
  transition: background .13s, color .13s;
}
.view-toggle button.active { background: var(--color-text); color: var(--color-surface); }


/* ── 차트 카드 ────────────────────────────────────── */
.chart-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.chart-card__header {
  display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;
}
.chart-card__title { font-size: 14px; font-weight: 700; color: var(--color-text); margin: 0; }
.chart-card__sub   { font-size: 12.5px; color: var(--color-text-subtle); }

/* 기간별 바 차트 */
.period-bars {
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  height: 220px;
  gap: 12px;
  padding-top: 28px;
}

.period-bar-col { display: flex; flex-direction: column; align-items: center; gap: 5px; flex: 1; cursor: pointer; transition: transform 0.1s; }
.period-bar-col:hover { transform: translateY(-2px); }
.period-bar-col--selected .period-bar-label { color: var(--color-text); font-weight: 700; }

.period-bar-wrap { display: flex; align-items: flex-end; height: 150px; }
.period-bar {
  width: 48px; border-radius: 6px 6px 0 0; min-height: 6px;
  transition: height .7s cubic-bezier(.4,0,.2,1);
  cursor: pointer;
}
.period-bar:hover { filter: brightness(1.08); }

.period-bar-label { font-size: 12px; color: var(--color-text-muted); font-weight: 500; }
.period-bar-count { font-size: 14px; font-weight: 800; }

/* 분야별 분포 */
/* ── 기술분야별 스택 바 ──────────────────────────── */
.field-stack-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid var(--color-border-light);
}
.field-stack-title { font-size: 12.5px; font-weight: 600; color: var(--color-text-secondary); }
.field-stack-legend { display: flex; gap: 10px; flex-wrap: wrap; }
.field-stack-legend-item { display: flex; align-items: center; gap: 4px; font-size: 12px; color: var(--color-text-secondary); }
.field-legend-dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }

.field-stack-bar {
  display: flex;
  height: 32px;
  border-radius: 8px;
  overflow: hidden;
  margin-top: 8px;
}
.field-stack-seg {
  display: flex;
  align-items: center;
  justify-content: center;
  transition: width 0.4s cubic-bezier(.4,0,.2,1);
  min-width: 0;
}
.field-stack-seg__label {
  font-size: 11.5px;
  font-weight: 700;
  color: #fff;
  white-space: nowrap;
}

/* 소멸 목록 */
.table-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  overflow: hidden;
}
.table-card__header {
  display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
  padding: 14px 20px; border-bottom: 1px solid var(--color-surface-muted);
}
.table-card__title { font-size: 14px; font-weight: 700; color: var(--color-text); margin: 0; }
.table-card__count { font-size: 13px; color: var(--color-text-muted); }

.expiry-list { display: flex; flex-direction: column; }
.expiry-item {
  display: grid;
  grid-template-columns: 16px 1fr auto 24px;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  border-bottom: 1px solid var(--color-surface-hover);
  cursor: pointer;
  transition: background .12s;
}
.expiry-item:last-child { border-bottom: none; }
.expiry-item:hover { background: var(--color-surface-hover); }

.expiry-item__urgency { display: flex; align-items: center; justify-content: center; }
.urgency-dot {
  width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
}
.urgency--critical .urgency-dot,
.urgency-dot--critical { background: #E88989; box-shadow: 0 0 5px rgba(232,137,137,.6); }
.urgency--warn    .urgency-dot,
.urgency-dot--warn    { background: #FFBC5E; }
.urgency--normal  .urgency-dot,
.urgency-dot--normal  { background: #ABACED; }

.expiry-item__info { display: flex; flex-direction: column; gap: 5px; min-width: 0; }
.expiry-item__title {
  font-size: 13.5px; font-weight: 600; color: var(--color-text);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin: 0;
}
.expiry-item__meta { display: flex; gap: 6px; flex-wrap: wrap; }
.meta-pill {
  display: inline-block; padding: 2px 7px;
  background: var(--color-surface-hover); border: 1px solid var(--color-border); border-radius: 5px;
  font-size: 11.5px; color: var(--color-text-muted);
}

.expiry-item__date { display: flex; flex-direction: column; align-items: flex-end; gap: 3px; }
.expiry-item__dday { font-size: 14px; font-weight: 800; margin: 0; }
.dday--critical { color: #E88989; }
.dday--warn     { color: #FFBC5E; }
.dday--normal   { color: #ABACED; }
.expiry-item__expiry-date { font-size: 11.5px; color: var(--color-text-subtle); margin: 0; }

.expiry-item__arrow { color: var(--c-slate-300); transition: color .12s; }
.expiry-item:hover .expiry-item__arrow { color: var(--color-primary); }

/* ── 범례 ────────────────────────────────────────── */
.chart-legend { display: flex; gap: 12px; flex-wrap: wrap; }
.legend-item  { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--color-text-muted); }
.legend-dot   { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

/* ── 캘린더 ──────────────────────────────────────── */
.calendar-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.calendar-header {
  display: flex; align-items: center; justify-content: space-between;
}
.calendar-title { font-size: 17px; font-weight: 700; color: var(--color-text); margin: 0; }
.cal-nav {
  width: 34px; height: 34px;
  background: var(--color-surface-hover); border: 1px solid var(--color-border); border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: var(--color-text-secondary); transition: background .13s;
}
.cal-nav:hover { background: var(--color-surface-muted); }

.cal-weekdays {
  display: grid; grid-template-columns: repeat(7, 1fr);
  text-align: center;
}
.cal-weekdays span {
  padding: 8px 4px;
  font-size: 12px; font-weight: 700; color: var(--color-text-subtle);
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
.cal-cell--today { background: var(--color-primary-bg); border-color: var(--c-primary-200); }
.cal-cell--has-events { cursor: pointer; }
.cal-cell--has-events:hover { border-color: var(--color-border); background: var(--color-surface-hover); }

.cal-cell__day {
  display: flex; align-items: center; justify-content: center;
  width: 24px; height: 24px;
  font-size: 12.5px; font-weight: 600; color: var(--color-text-secondary);
  margin-bottom: 4px;
}
.cal-cell--today .cal-cell__day {
  background: var(--color-primary); color: var(--color-surface); border-radius: 50%;
}

.cal-cell__events { display: flex; flex-direction: column; gap: 2px; }

.cal-event {
  padding: 2px 5px;
  border-radius: 4px;
  font-size: 10.5px; font-weight: 500;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  cursor: pointer;
}
.cal-event--critical { background: var(--color-danger-bg); color: var(--color-danger); }
.cal-event--warn     { background: var(--color-warn-bg); color: var(--color-warn-dark); }
.cal-event--normal   { background: var(--color-primary-bg); color: var(--color-primary-darker); }

.cal-cell__more { font-size: 10px; color: var(--color-text-subtle); margin: 0; padding: 0 5px; }

/* 선택된 날 상세 */
.cal-detail {
  border-top: 1px solid var(--color-surface-muted);
  padding-top: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.cal-detail__title { font-size: 13.5px; font-weight: 700; color: var(--color-text); margin: 0; }
.cal-detail-item {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 12px; background: var(--color-surface-hover); border-radius: 8px;
  font-size: 13px; cursor: pointer; transition: background .12s;
}
.cal-detail-item:hover { background: var(--color-surface-muted); }

/* ── 연도별 캘린더 ─────────────────────────────────── */
.ycal-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.ycal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.ycal-title { font-size: 15px; font-weight: 700; color: var(--color-text); }

.ycal-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}
@media (max-width: 700px) { .ycal-grid { grid-template-columns: repeat(3, 1fr); } }

.ycal-month {
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.12s;
  min-height: 72px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.ycal-month:hover { background: var(--color-surface-hover); border-color: var(--color-primary-border); }
.ycal-month--today { border-color: var(--color-primary); background: var(--color-primary-bg); }
.ycal-month--active { border-color: var(--color-primary-dark); background: var(--color-primary-bg); box-shadow: 0 0 0 2px var(--color-primary-ring); }
.ycal-month--empty { opacity: 0.5; cursor: default; }
.ycal-month--empty:hover { background: none; border-color: var(--color-border); }

.ycal-month__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.ycal-month__name { font-size: 13px; font-weight: 700; color: var(--color-text); }
.ycal-month__badge {
  font-size: 11px;
  font-weight: 700;
  border-radius: 10px;
  padding: 1px 7px;
}
.ycal-badge--critical { background: var(--color-danger-bg); color: var(--color-danger); }
.ycal-badge--warn     { background: var(--color-warn-bg); color: var(--color-warn-dark); }
.ycal-badge--normal   { background: var(--color-primary-bg); color: var(--color-primary-dark); }

.ycal-month__dots { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
.ycal-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.ycal-dot--critical { background: var(--color-danger); }
.ycal-dot--warn     { background: var(--color-warn); }
.ycal-dot--normal   { background: var(--color-primary); }
.ycal-dot-more { font-size: 10px; color: var(--color-text-muted); }
.ycal-month__empty-text { font-size: 11px; color: var(--color-text-subtle); }

.ycal-detail {
  border-top: 1px solid var(--color-border);
  padding-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.ycal-detail__title { font-size: 13.5px; font-weight: 700; color: var(--color-text); }
.ycal-detail-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.1s;
}
.ycal-detail-item:hover { background: var(--color-surface-muted); }
.ycal-detail-item__info { flex: 1; min-width: 0; }
.ycal-detail-item__title { font-size: 13px; font-weight: 600; color: var(--color-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ycal-detail-item__meta { font-size: 12px; color: var(--color-text-muted); }
.ycal-detail-item__dday { font-size: 12.5px; font-weight: 700; flex-shrink: 0; }
</style>
