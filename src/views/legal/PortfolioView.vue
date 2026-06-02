<template>
  <div class="portfolio-page" @mousemove="trackMouse">
    <!-- 도넛 호버 툴팁 -->
    <Teleport to="body">
      <div v-if="donutTooltip.visible" class="donut-tooltip" :style="{ left: donutTooltip.x + 'px', top: donutTooltip.y + 'px' }">
        <span class="donut-tooltip__dot" :style="{ background: donutTooltip.color }" />
        <span class="donut-tooltip__name">{{ donutTooltip.name }}</span>
        <span class="donut-tooltip__count">{{ donutTooltip.count }}건</span>
        <span class="donut-tooltip__pct">{{ donutTooltip.pct }}%</span>
      </div>
    </Teleport>

    <!-- 페이지 헤더 -->
    <div class="page-header">
      <div>
        <p class="page-header__eyebrow">Legal AI팀</p>
        <h2 class="page-header__title">포트폴리오 분석</h2>
        <p class="page-header__desc">보유 특허의 기술 분야, 국가, 가치 등급 분포를 분석합니다</p>
      </div>
      <div class="header-summary">
        <div class="summary-chip" v-for="s in summaryCounts" :key="s.label">
          <span class="summary-chip__value">{{ s.value }}</span>
          <span class="summary-chip__label">{{ s.label }}</span>
        </div>
      </div>
    </div>

    <!-- 상단: 가치 등급 분포 + AI 인사이트 -->
    <div class="bottom-row">

      <!-- 가치 평가 등급 분포 -->
      <div class="chart-card">
        <div class="chart-card__header">
          <h3 class="chart-card__title">가치 평가 등급 분포</h3>
          <p class="chart-card__sub">AI 평가 기준</p>
        </div>
        <div class="grade-dist">
          <div v-for="g in gradeItems" :key="g.grade" class="grade-dist-item">
            <div class="grade-dist-item__header">
              <div class="grade-badge" :style="{ background: g.bg, color: g.color }">
                {{ g.grade }}
              </div>
              <span class="grade-dist-item__label">{{ g.label }}</span>
              <span class="grade-dist-item__count" :style="{ color: g.color }">{{ g.count }}건</span>
            </div>
            <div class="grade-bar-wrap">
              <div
                class="grade-bar"
                :style="{ width: Math.round(g.count / totalPatents * 100) + '%', background: g.color }"
              />
            </div>
          </div>
        </div>
        <!-- 등급 설명 -->
        <div class="grade-note">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          등급은 AI가 기술성·권리성·사업성을 종합하여 산출한 점수 기준입니다
        </div>
      </div>

      <!-- 요약 인사이트 카드 -->
      <div class="chart-card chart-card--insight">
        <div class="chart-card__header">
          <h3 class="chart-card__title">
            <span class="ai-dot" />
            AI 포트폴리오 인사이트
          </h3>
        </div>
        <div class="insight-list">
          <div v-for="ins in insights" :key="ins.text" class="insight-item" :class="`insight-item--${ins.type}`">
            <div class="insight-item__icon">
              <span v-html="ins.icon" />
            </div>
            <p class="insight-item__text">{{ ins.text }}</p>
          </div>
        </div>
      </div>

    </div>

    <!-- 도넛 차트 3개 -->
    <div class="donut-row">

      <!-- 기술 분야별 분포 -->
      <div class="chart-card">
        <div class="chart-card__header">
          <h3 class="chart-card__title">기술 분야별 분포</h3>
          <p class="chart-card__sub">전체 {{ totalPatents }}건</p>
        </div>
        <div class="donut-wrap">
          <svg class="donut-svg" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="50" fill="none" stroke="#f1f5f9" stroke-width="20" />
            <circle
              v-for="(seg, i) in techDonutSegments"
              :key="i"
              cx="60" cy="60" r="50"
              fill="none"
              :stroke="techColors[i % techColors.length]"
              stroke-width="20"
              :stroke-dasharray="`${seg.dash} ${314 - seg.dash}`"
              :stroke-dashoffset="seg.offset"
              stroke-linecap="butt"
              style="cursor:pointer"
              @mouseenter="showDonutTooltip(treemapItems[i].name, treemapItems[i].count, totalPatents, techColors[i % techColors.length])"
              @mouseleave="hideDonutTooltip"
            />
            <text x="60" y="55" text-anchor="middle" font-size="13" font-weight="800" fill="#0f172a">{{ totalPatents }}</text>
            <text x="60" y="70" text-anchor="middle" font-size="9" font-weight="600" fill="#475569">총 특허</text>
          </svg>
          <div class="donut-legend">
            <div v-for="(item, i) in treemapItems" :key="item.name" class="donut-legend-item">
              <span class="legend-dot" :style="{ background: techColors[i % techColors.length] }" />
              <span class="donut-legend-item__name">{{ item.name }}</span>
              <span class="donut-legend-item__count">{{ item.count }}건</span>
              <span class="donut-legend-item__pct">{{ Math.round(item.count / totalPatents * 100) }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 국가별 보유 현황 -->
      <div class="chart-card">
        <div class="chart-card__header">
          <h3 class="chart-card__title">국가별 분포</h3>
          <p class="chart-card__sub">전체 {{ totalCountry }}건</p>
        </div>
        <div class="donut-wrap">
          <svg class="donut-svg" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="50" fill="none" stroke="#f1f5f9" stroke-width="20" />
            <circle
              v-for="(seg, i) in countryDonutSegments"
              :key="i"
              cx="60" cy="60" r="50"
              fill="none"
              :stroke="techColors[i % techColors.length]"
              stroke-width="20"
              :stroke-dasharray="`${seg.dash} ${314 - seg.dash}`"
              :stroke-dashoffset="seg.offset"
              stroke-linecap="butt"
              style="cursor:pointer"
              @mouseenter="showDonutTooltip(`${countryItems[i].flag} ${countryItems[i].country}`, countryItems[i].count, totalCountry, techColors[i % techColors.length])"
              @mouseleave="hideDonutTooltip"
            />
            <text x="60" y="55" text-anchor="middle" font-size="13" font-weight="800" fill="#0f172a">{{ totalCountry }}</text>
            <text x="60" y="70" text-anchor="middle" font-size="9" font-weight="600" fill="#475569">총 특허</text>
          </svg>
          <div class="donut-legend">
            <div v-for="(item, i) in countryItems" :key="item.country" class="donut-legend-item">
              <span class="legend-dot" :style="{ background: techColors[i % techColors.length] }" />
              <span class="donut-legend-item__name">{{ item.flag }} {{ item.country }}</span>
              <span class="donut-legend-item__count">{{ item.count }}건</span>
              <span class="donut-legend-item__pct">{{ Math.round(item.count / totalCountry * 100) }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 사업부별 보유 현황 -->
      <div class="chart-card">
        <div class="chart-card__header">
          <h3 class="chart-card__title">사업부별 분포</h3>
          <p class="chart-card__sub">전체 {{ totalPatents }}건</p>
        </div>
        <div class="donut-wrap">
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
              style="cursor:pointer"
              @mouseenter="showDonutTooltip(deptItems[i].name, deptItems[i].count, totalPatents, techColors[i % techColors.length])"
              @mouseleave="hideDonutTooltip"
            />
            <text x="60" y="55" text-anchor="middle" font-size="13" font-weight="800" fill="#0f172a">{{ totalPatents }}</text>
            <text x="60" y="70" text-anchor="middle" font-size="9" font-weight="600" fill="#475569">총 특허</text>
          </svg>
          <div class="donut-legend">
            <div v-for="(d, i) in deptItems" :key="d.name" class="donut-legend-item">
              <span class="legend-dot" :style="{ background: techColors[i % techColors.length] }" />
              <span class="donut-legend-item__name">{{ d.name }}</span>
              <span class="donut-legend-item__count">{{ d.count }}건</span>
              <span class="donut-legend-item__pct">{{ Math.round(d.count / totalPatents * 100) }}%</span>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- 연도별 출원·등록·만료 추이 (풀 width) -->
    <div class="chart-card">
      <div class="chart-card__header">
        <h3 class="chart-card__title">연도별 출원 · 등록 · 만료 추이</h3>
        <div class="chart-legend chart-legend--inline">
          <div v-for="(s, i) in trendSeries" :key="s.key" class="legend-item">
            <span class="legend-dot" :style="{ background: trendColors[i] }" />{{ s.label }}
          </div>
        </div>
      </div>
      <svg class="trend-svg" :viewBox="`0 0 ${svgW} ${svgH}`">
        <line
          v-for="n in 4" :key="n"
          :x1="pad.l" :y1="pad.t + ((n - 1) / 3) * plotH"
          :x2="svgW - pad.r" :y2="pad.t + ((n - 1) / 3) * plotH"
          stroke="#f1f5f9" stroke-width="1"
        />
        <polyline
          v-for="(line, i) in trendLines"
          :key="i"
          :points="line.points"
          fill="none"
          :stroke="line.color"
          stroke-width="1.8"
          stroke-linejoin="round"
          stroke-linecap="round"
        />
        <circle
          v-for="dot in trendDots"
          :key="dot.id"
          :cx="dot.x" :cy="dot.y" r="3"
          :fill="dot.color"
          stroke="#fff" stroke-width="1.5"
        />
        <text
          v-for="(d, i) in trendData"
          :key="d.year"
          :x="trendX(i)" :y="svgH - 4"
          text-anchor="middle"
          font-size="8" fill="#475569"
        >{{ d.year }}</text>
      </svg>
    </div>

    <!-- 재평가 결정 분석: 연도별 + 사업부/기술분야별 -->
    <div class="decision-row">

      <!-- 연도별 유지·포기 비율 (스택 바) -->
      <div class="chart-card">
        <div class="chart-card__header">
          <h3 class="chart-card__title">분기별 재평가 결정 비율</h3>
          <div class="chart-legend chart-legend--inline">
            <div class="legend-item"><span class="legend-dot" style="background: var(--color-keep)" />유지</div>
            <div class="legend-item"><span class="legend-dot" style="background: var(--color-dispose)" />포기</div>
          </div>
        </div>
        <div class="decision-chart" style="position: relative">
          <div
            v-for="d in decisionData"
            :key="d.year"
            class="decision-bar-group"
            @mouseenter="showTooltip($event, d)"
            @mouseleave="hideTooltip"
          >
            <div class="decision-bar-stack" :class="{ 'decision-bar-stack--inprogress': d.inProgress }">
              <div class="decision-bar-seg decision-bar-seg--keep" :style="{ height: keepPct(d) + '%' }" />
              <div class="decision-bar-seg decision-bar-seg--dispose" :style="{ height: disposePct(d) + '%' }" />
            </div>
            <p class="decision-bar-label">{{ d.inProgress ? `${d.year} (진행중)` : d.year }}</p>
          </div>
          <div v-if="tooltip.visible" class="decision-tooltip" :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }">
            <p class="decision-tooltip__year">{{ tooltip.year }}</p>
            <div class="decision-tooltip__row"><span class="decision-tooltip__dot" style="background: var(--color-keep)" />유지 {{ tooltip.keep }}건 ({{ tooltip.keepPct }}%)</div>
            <div class="decision-tooltip__row"><span class="decision-tooltip__dot" style="background: var(--color-dispose)" />포기 {{ tooltip.dispose }}건 ({{ tooltip.disposePct }}%)</div>
          </div>
        </div>
      </div>

      <!-- 사업부별 / 기술분야별 유지·포기 비율 (탭 전환) -->
      <div class="chart-card">
        <div class="chart-card__header">
          <h3 class="chart-card__title">유지 · 포기 비율 분석</h3>
          <div class="breakdown-tabs">
            <button class="breakdown-tab" :class="{ 'breakdown-tab--active': breakdownTab === 'dept' }" @click="breakdownTab = 'dept'">사업부별</button>
            <button class="breakdown-tab" :class="{ 'breakdown-tab--active': breakdownTab === 'tech' }" @click="breakdownTab = 'tech'">기술분야별</button>
          </div>
        </div>
        <div class="hbar-list">
          <div v-for="d in breakdownTab === 'dept' ? deptDecision : techDecision" :key="d.name" class="hbar-item">
            <span class="hbar-item__label">{{ d.name }}</span>
            <div class="hbar-track">
              <div class="hbar-seg hbar-seg--keep"    :style="{ width: Math.round(d.keep/(d.keep+d.dispose)*100) + '%' }" :title="`유지 ${d.keep}건`" />
              <div class="hbar-seg hbar-seg--dispose" :style="{ width: Math.round(d.dispose/(d.keep+d.dispose)*100) + '%' }" :title="`포기 ${d.dispose}건`" />
            </div>
            <span class="hbar-item__pct">{{ Math.round(d.keep/(d.keep+d.dispose)*100) }}%</span>
          </div>
        </div>
      </div>

    </div>


  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

// ── 색상 팔레트 ──────────────────────────────────────
const techColors = ['#6366f1','#0ea5e9','#10b981','#f59e0b','#ec4899','#8b5cf6','#ef4444','#06b6d4']
const trendColors = ['#6366f1','#22c55e','#f59e0b']

// ── 요약 카운트 ──────────────────────────────────────
const summaryCounts = [
  { value: '247', label: '총 보유 특허' },
  { value: '38',  label: '만료 예정 (1년)' },
  { value: '4',   label: '국가' },
  { value: '5',   label: '기술 분야' },
]

const totalPatents = 247

// ── 트리맵 데이터 ────────────────────────────────────
const treemapItems = [
  { name: '반도체', count: 82 },
  { name: '배터리', count: 58 },
  { name: '소재',   count: 42 },
  { name: 'AI/SW',  count: 35 },
  { name: '바이오', count: 18 },
  { name: '기타',   count: 12 },
]

// ── 기술 분야 도넛 세그먼트 ──────────────────────────
const techDonutSegments = computed(() => {
  const circ = 314
  let offset = -circ / 4
  return treemapItems.map(item => {
    const dash = Math.round((item.count / totalPatents) * circ)
    const seg = { dash, offset }
    offset -= dash
    return seg
  })
})

// ── 국가별 ───────────────────────────────────────────
const countryItems = [
  { country: 'KR', flag: '🇰🇷', count: 142 },
  { country: 'US', flag: '🇺🇸', count: 58 },
  { country: 'JP', flag: '🇯🇵', count: 28 },
  { country: 'EP', flag: '🇪🇺', count: 12 },
  { country: 'CN', flag: '🇨🇳', count: 7 },
]
const totalCountry = countryItems.reduce((s, i) => s + i.count, 0)

const countryDonutSegments = computed(() => {
  const circ = 314
  let offset = -circ / 4
  return countryItems.map(item => {
    const dash = Math.round((item.count / totalCountry) * circ)
    const seg = { dash, offset }
    offset -= dash
    return seg
  })
})

// ── 연도별 추이 ──────────────────────────────────────
const trendData = [
  { year: '2020', filed: 18, registered: 14, expired: 3 },
  { year: '2021', filed: 24, registered: 19, expired: 5 },
  { year: '2022', filed: 31, registered: 26, expired: 7 },
  { year: '2023', filed: 38, registered: 30, expired: 9 },
  { year: '2024', filed: 42, registered: 35, expired: 11 },
  { year: '2025', filed: 45, registered: 38, expired: 8 },
  { year: '2026', filed: 29, registered: 22, expired: 4 },
]
const maxTrend = computed(() => Math.max(...trendData.flatMap(d => [d.filed, d.registered, d.expired])))

// ── 꺾은선 차트 설정 ─────────────────────────────────
const svgW = 540
const svgH = 130
const pad = { t: 14, b: 26, l: 8, r: 8 }
const plotW = svgW - pad.l - pad.r
const plotH = svgH - pad.t - pad.b

function trendX(i: number) {
  return pad.l + (i / (trendData.length - 1)) * plotW
}
function trendY(v: number, max: number) {
  return pad.t + (1 - v / max) * plotH
}

type TrendKey = 'filed' | 'registered' | 'expired'
const trendSeries: { key: TrendKey; label: string }[] = [
  { key: 'filed',      label: '출원' },
  { key: 'registered', label: '등록' },
  { key: 'expired',    label: '만료' },
]

const trendLines = computed(() =>
  trendSeries.map((s, si) => ({
    color: trendColors[si],
    points: trendData.map((d, i) => `${trendX(i)},${trendY(d[s.key], maxTrend.value)}`).join(' '),
  }))
)

const trendDots = computed(() =>
  trendSeries.flatMap((s, si) =>
    trendData.map((d, di) => ({
      x: trendX(di),
      y: trendY(d[s.key], maxTrend.value),
      color: trendColors[si],
      id: `${si}-${di}`,
    }))
  )
)

// ── 분기별 재평가 결정 데이터 ─────────────────────────
const decisionData = [
  { year: '2024Q3', keep: 22, dispose: 12, inProgress: false },
  { year: '2024Q4', keep: 30, dispose: 10, inProgress: false },
  { year: '2025Q1', keep: 20, dispose: 14, inProgress: false },
  { year: '2025Q2', keep: 34, dispose: 9,  inProgress: false },
  { year: '2025Q3', keep: 24, dispose: 13, inProgress: false },
  { year: '2025Q4', keep: 32, dispose: 8,  inProgress: false },
  { year: '2026Q1', keep: 19, dispose: 11, inProgress: true  },
]
function keepPct(d: typeof decisionData[0])    { return Math.round(d.keep    / (d.keep + d.dispose) * 100) }
function disposePct(d: typeof decisionData[0]) { return Math.round(d.dispose / (d.keep + d.dispose) * 100) }

// ── 툴팁 ─────────────────────────────────────────────
const breakdownTab = ref<'dept' | 'tech'>('dept')

// ── 도넛 툴팁 ────────────────────────────────────────
const donutTooltip = ref({ visible: false, x: 0, y: 0, name: '', count: 0, pct: 0, color: '' })
const mousePos = ref({ x: 0, y: 0 })

function trackMouse(e: MouseEvent) {
  mousePos.value = { x: e.clientX, y: e.clientY }
  if (donutTooltip.value.visible) {
    donutTooltip.value.x = e.clientX + 14
    donutTooltip.value.y = e.clientY - 10
  }
}
function showDonutTooltip(name: string, count: number, total: number, color: string) {
  donutTooltip.value = {
    visible: true,
    x: mousePos.value.x + 14,
    y: mousePos.value.y - 10,
    name, count, color,
    pct: Math.round(count / total * 100),
  }
}
function hideDonutTooltip() { donutTooltip.value.visible = false }

const tooltip = ref<{
  visible: boolean; x: number; y: number;
  year: string; keep: number; dispose: number; keepPct: number; disposePct: number
}>({ visible: false, x: 0, y: 0, year: '', keep: 0, dispose: 0, keepPct: 0, disposePct: 0 })

function showTooltip(e: MouseEvent, d: typeof decisionData[0]) {
  const rect = (e.currentTarget as HTMLElement).closest('.decision-chart')!.getBoundingClientRect()
  const el = (e.currentTarget as HTMLElement).getBoundingClientRect()
  tooltip.value = {
    visible: true,
    x: el.left - rect.left + el.width / 2,
    y: el.top - rect.top - 8,
    year: d.year,
    keep: d.keep,
    dispose: d.dispose,
    keepPct: keepPct(d),
    disposePct: disposePct(d),
  }
}
function hideTooltip() { tooltip.value.visible = false }

// ── 사업부별 / 기술분야별 유지·포기 데이터 ───────────
const deptDecision = [
  { name: '반도체 사업부', keep: 52, dispose: 18 },
  { name: '배터리 사업부', keep: 38, dispose: 15 },
  { name: 'AI 사업부',    keep: 29, dispose: 8  },
  { name: '소재 사업부',  keep: 19, dispose: 9  },
]
const techDecision = [
  { name: '반도체',  keep: 48, dispose: 14 },
  { name: '배터리',  keep: 35, dispose: 12 },
  { name: 'AI/SW',  keep: 26, dispose: 7  },
  { name: '소재',   keep: 18, dispose: 8  },
  { name: '기타',   keep: 11, dispose: 5  },
]

// ── 사업부 도넛 ──────────────────────────────────────
const deptItems = [
  { name: '반도체 사업부', count: 98  },
  { name: '배터리 사업부', count: 72  },
  { name: 'AI 사업부',    count: 44  },
  { name: '소재 사업부',  count: 33  },
]

const donutSegments = computed(() => {
  const circ = 314
  let offset = -circ / 4
  return deptItems.map(d => {
    const dash = Math.round((d.count / totalPatents) * circ)
    const seg = { dash, offset }
    offset -= dash
    return seg
  })
})

// ── 가치 등급 ────────────────────────────────────────
const gradeItems = [
  { grade: 'S', label: '핵심 특허',  count: 28,  bg: '#fefce8', color: '#ca8a04' },
  { grade: 'A', label: '고가치',     count: 62,  bg: '#f0fdf4', color: '#16a34a' },
  { grade: 'B', label: '보통',       count: 89,  bg: '#eff6ff', color: '#2563eb' },
  { grade: 'C', label: '낮은 가치',  count: 45,  bg: '#fef2f2', color: '#dc2626' },
  { grade: 'D', label: '포기 권장',  count: 23,  bg: '#f8fafc', color: '#94a3b8' },
]

// ── AI 인사이트 ──────────────────────────────────────
const insights = [
  {
    type: 'warn',
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
    text: '반도체 분야 특허 38건이 1년 이내 만료 예정입니다. 유지 여부 검토가 필요합니다.',
  },
  {
    type: 'info',
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    text: 'S·A 등급 핵심 특허 90건 중 US 등록 비율이 42%로 해외 권리화가 양호합니다.',
  },
  {
    type: 'suggest',
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
    text: 'D 등급 특허 23건은 연차료 대비 가치가 낮아 포기 검토를 권장합니다.',
  },
]
</script>

<style scoped>
.portfolio-page {
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
  font-size: 12px; font-weight: 600;
  letter-spacing: .06em; text-transform: uppercase;
  color: var(--color-primary); margin: 0 0 5px;
}
.page-header__title {
  font-size: 22px; font-weight: 700;
  color: var(--color-text); margin: 0 0 4px; letter-spacing: -0.02em;
}
.page-header__desc { font-size: 13.5px; color: var(--color-text-muted); margin: 0; }

.header-summary {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.summary-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 18px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  min-width: 80px;
}
.summary-chip__value { font-size: 20px; font-weight: 800; color: var(--color-text); letter-spacing: -.02em; }
.summary-chip__label { font-size: 11px; color: var(--color-text-subtle); font-weight: 500; margin-top: 2px; }

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
.chart-card--insight { background: linear-gradient(145deg, var(--color-surface-soft), var(--c-primary-50)); border-color: var(--color-primary-border); }

.chart-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
}
.chart-card__title {
  display: flex; align-items: center; gap: 8px;
  font-size: 14px; font-weight: 700; color: var(--color-text); margin: 0;
}
.chart-card__sub { font-size: 12.5px; color: var(--color-text-secondary); font-weight: 600; }

/* ── 레이아웃 행 ─────────────────────────────────── */
.donut-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
@media (max-width: 1000px) { .donut-row { grid-template-columns: 1fr 1fr; } }
@media (max-width: 640px)  { .donut-row { grid-template-columns: 1fr; } }

.bottom-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
@media (max-width: 720px) { .bottom-row { grid-template-columns: 1fr; } }

/* ── 공통 도넛 래퍼 ──────────────────────────────── */
.donut-wrap {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

/* ── 연도별 추이 2-컬럼 ─────────────────────────── */
.decision-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
@media (max-width: 860px) { .decision-row { grid-template-columns: 1fr; } }

/* ── 연도별 재평가 결정 스택 바 ──────────────────── */
.decision-chart {
  flex: 1;
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  gap: 6px;
  min-height: 120px;
}
.decision-bar-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  flex: 1;
  height: 100%;
}
.decision-bar-stack {
  display: flex;
  flex-direction: column-reverse;
  align-items: center;
  width: 22px;
  height: 100%;
  max-height: 140px;
  gap: 1px;
  overflow: hidden;
  border-radius: 4px;
}
.decision-bar-seg {
  width: 100%;
  transition: opacity 0.15s;
  min-height: 2px;
}
.decision-bar-seg:hover { opacity: 0.75; }
.decision-bar-seg--keep    { background: var(--color-keep); }
.decision-bar-seg--dispose { background: var(--color-dispose); }
.decision-bar-label {
  font-size: 10px;
  color: var(--color-text-secondary);
  font-weight: 600;
  margin-top: 6px;
  white-space: nowrap;
}

/* ── 연도별 추이 (꺾은선) ─────────────────────── */
.trend-svg {
  width: 100%;
  height: auto;
  max-height: 200px;
  display: block;
  overflow: visible;
}

/* ── 도넛 차트 ───────────────────────────────────── */
.donut-svg {
  width: 140px; height: 140px; flex-shrink: 0;
  transform: rotate(-90deg);
  /* text는 rotate 보정 */
}
.donut-svg text { transform: rotate(90deg); transform-origin: 60px 60px; }

.donut-legend {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  min-width: 140px;
}

.donut-legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12.5px;
}
.donut-legend-item__name { flex: 1; color: var(--color-text); font-weight: 500; }
.donut-legend-item__count { font-weight: 700; color: var(--color-text); }
.donut-legend-item__pct { color: var(--color-text-secondary); font-weight: 600; min-width: 32px; text-align: right; }

/* ── 가치 등급 ───────────────────────────────────── */
.grade-dist { display: flex; flex-direction: column; gap: 10px; }

.grade-dist-item { display: flex; flex-direction: column; gap: 6px; }

.grade-dist-item__header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.grade-badge {
  width: 24px; height: 24px;
  border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 800;
  flex-shrink: 0;
}

.grade-dist-item__label { font-size: 13px; font-weight: 500; color: var(--color-text-secondary); flex: 1; }
.grade-dist-item__count { font-size: 13px; font-weight: 700; color: var(--color-text); }

.grade-bar-wrap { height: 6px; background: var(--color-surface-muted); border-radius: 3px; overflow: hidden; }
.grade-bar { height: 100%; border-radius: 3px; transition: width .7s cubic-bezier(.4,0,.2,1); }

.grade-note {
  display: flex; align-items: center; gap: 6px;
  padding: 10px 12px;
  background: var(--color-surface-hover);
  border-radius: 8px;
  font-size: 12px; color: var(--color-text-muted); line-height: 1.5;
}

/* ── AI 인사이트 ─────────────────────────────────── */
.ai-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--color-primary);
  box-shadow: 0 0 6px rgba(99,102,241,.7);
  flex-shrink: 0;
  animation: pulse 2s ease-in-out infinite;
}
@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: .5; } }

.insight-list { display: flex; flex-direction: column; gap: 10px; }

.insight-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 10px;
  font-size: 13px;
  line-height: 1.6;
}
.insight-item--warn    { background: var(--color-warn-bg); color: var(--c-amber-900); }
.insight-item--info    { background: var(--color-primary-bg); color: var(--c-primary-800); }
.insight-item--suggest { background: var(--color-success-bg); color: var(--c-green-900); }

.insight-item__icon {
  flex-shrink: 0;
  margin-top: 1px;
}
.insight-item__text { margin: 0; }

/* ── 공통 범례 ───────────────────────────────────── */
.chart-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.chart-legend--inline { gap: 14px; }

.legend-item {
  display: flex; align-items: center; gap: 6px;
  font-size: 12px; color: var(--color-text-muted);
}
.legend-dot {
  width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
}

/* ── 탭 전환 버튼 ────────────────────────────────── */
.breakdown-tabs { display: flex; gap: 2px; background: var(--color-surface-muted); border-radius: 8px; padding: 3px; }
.breakdown-tab {
  background: none; border: none; border-radius: 6px;
  padding: 3px 12px; font-size: 12px; cursor: pointer;
  color: var(--color-text-muted); transition: all 0.12s;
}
.breakdown-tab--active { background: var(--color-surface); color: var(--color-text); font-weight: 600; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }

/* ── 가로 스택 바 ─────────────────────────────────── */
.hbar-list { display: flex; flex-direction: column; gap: 12px; max-height: 260px; overflow-y: auto; }
.hbar-list::-webkit-scrollbar { width: 4px; }
.hbar-list::-webkit-scrollbar-thumb { background: var(--color-border); border-radius: 2px; }
.hbar-item { display: flex; align-items: center; gap: 10px; }
.hbar-item__label { font-size: 12.5px; color: var(--color-text-secondary); width: 90px; flex-shrink: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.hbar-track { flex: 1; height: 10px; border-radius: 5px; overflow: hidden; display: flex; background: var(--color-surface-muted); }
.hbar-seg { height: 100%; transition: width 0.3s; }
.hbar-seg--keep    { background: var(--color-keep); }
.hbar-seg--dispose { background: var(--color-dispose); }
.hbar-item__pct { font-size: 12px; font-weight: 700; color: var(--color-text-muted); min-width: 36px; text-align: right; }

/* ── 진행중 바 ───────────────────────────────────── */
.decision-bar-stack--inprogress { opacity: 0.65; outline: 2px dashed var(--color-text-subtle); outline-offset: 2px; border-radius: 4px; }

/* ── 툴팁 ───────────────────────────────────────── */
.decision-tooltip {
  position: absolute;
  transform: translate(-50%, -100%);
  background: var(--color-tooltip-bg);
  color: var(--color-tooltip-text);
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 12px;
  pointer-events: none;
  white-space: nowrap;
  z-index: 10;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}
.decision-tooltip__year { font-weight: 700; margin-bottom: 4px; font-size: 12.5px; }
.decision-tooltip__row { display: flex; align-items: center; gap: 6px; line-height: 1.8; }
.decision-tooltip__dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

/* ── 도넛 호버 툴팁 (body teleport) ──────────────── */
.donut-tooltip {
  position: fixed;
  display: flex;
  align-items: center;
  gap: 7px;
  background: var(--color-tooltip-bg);
  color: var(--color-tooltip-text);
  border-radius: 8px;
  padding: 7px 12px;
  font-size: 12.5px;
  pointer-events: none;
  white-space: nowrap;
  z-index: 9999;
  box-shadow: 0 4px 14px rgba(0,0,0,0.18);
}
.donut-tooltip__dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
.donut-tooltip__name { font-weight: 600; }
.donut-tooltip__count { color: var(--color-tooltip-muted); }
.donut-tooltip__pct { font-weight: 700; color: var(--color-tooltip-accent); margin-left: 2px; }
</style>
