<template>
  <div class="portfolio-page">

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

    <!-- 상단: 도넛 차트 3개 -->
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
            />
            <text x="60" y="55" text-anchor="middle" font-size="13" font-weight="800" fill="#0f172a">{{ totalPatents }}</text>
            <text x="60" y="70" text-anchor="middle" font-size="7" fill="#94a3b8">총 특허</text>
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
          <h3 class="chart-card__title">국가별 보유 현황</h3>
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
            />
            <text x="60" y="55" text-anchor="middle" font-size="13" font-weight="800" fill="#0f172a">{{ totalCountry }}</text>
            <text x="60" y="70" text-anchor="middle" font-size="7" fill="#94a3b8">총 특허</text>
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
          <h3 class="chart-card__title">사업부별 보유 현황</h3>
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
            />
            <text x="60" y="55" text-anchor="middle" font-size="13" font-weight="800" fill="#0f172a">{{ totalPatents }}</text>
            <text x="60" y="70" text-anchor="middle" font-size="7" fill="#94a3b8">총 특허</text>
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

    <!-- 연도별 출원·등록·만료 추이 (꺾은선) -->
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
        <!-- 가로 그리드 -->
        <line
          v-for="n in 4" :key="n"
          :x1="pad.l" :y1="pad.t + ((n - 1) / 3) * plotH"
          :x2="svgW - pad.r" :y2="pad.t + ((n - 1) / 3) * plotH"
          stroke="#f1f5f9" stroke-width="1"
        />
        <!-- 꺾은선 -->
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
        <!-- 데이터 포인트 -->
        <circle
          v-for="dot in trendDots"
          :key="dot.id"
          :cx="dot.x" :cy="dot.y" r="3"
          :fill="dot.color"
          stroke="#fff" stroke-width="1.5"
        />
        <!-- X축 레이블 -->
        <text
          v-for="(d, i) in trendData"
          :key="d.year"
          :x="trendX(i)" :y="svgH - 4"
          text-anchor="middle"
          font-size="8" fill="#94a3b8"
        >{{ d.year }}</text>
      </svg>
    </div>

    <!-- 하단: 가치 등급 분포 + AI 인사이트 -->
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

  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { TREND_DATA } from '@/mocks/data'

// ── 색상 팔레트 ──────────────────────────────────────
const techColors = ['#6366f1','#0ea5e9','#10b981','#f59e0b','#ec4899','#8b5cf6','#ef4444','#06b6d4']
const trendColors = ['#6366f1','#22c55e','#f59e0b']

// ── 요약 카운트 ──────────────────────────────────────
const summaryCounts = [
  { value: '22', label: '총 보유 특허' },
  { value: '5',  label: '만료 예정 (1년)' },
  { value: '5',  label: '국가' },
  { value: '5',  label: '기술 분야' },
]

const totalPatents = 22

// ── 기술 분야 분포 ───────────────────────────────────
const treemapItems = [
  { name: 'AI/ML',  count: 7 },
  { name: '반도체', count: 5 },
  { name: '통신',   count: 3 },
  { name: '에너지', count: 4 },
  { name: '제조',   count: 3 },
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
  { country: '한국', flag: '🇰🇷', count: 10 },
  { country: '미국', flag: '🇺🇸', count: 4  },
  { country: '유럽', flag: '🇪🇺', count: 3  },
  { country: '중국', flag: '🇨🇳', count: 2  },
  { country: '일본', flag: '🇯🇵', count: 1  },
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
const trendData = TREND_DATA.map(d => ({ year: String(d.year), filed: d.filed, registered: d.registered, expired: d.expired }))
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

// ── 사업부 도넛 ──────────────────────────────────────
const deptItems = [
  { name: '반도체사업부', count: 8 },
  { name: '통신사업부',   count: 5 },
  { name: '에너지사업부', count: 5 },
  { name: '제조사업부',   count: 4 },
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
  { grade: 'S', label: '핵심 특허', count: 3, bg: '#fefce8', color: '#ca8a04' },
  { grade: 'A', label: '고가치',    count: 8, bg: '#f0fdf4', color: '#16a34a' },
  { grade: 'B', label: '보통',      count: 6, bg: '#eff6ff', color: '#2563eb' },
  { grade: 'C', label: '낮은 가치', count: 3, bg: '#fef2f2', color: '#dc2626' },
]

// ── AI 인사이트 ──────────────────────────────────────
const insights = [
  {
    type: 'warn',
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
    text: '만료 예정 특허 4건(배전망 그리드, 태양광 패널 등) 중 C등급 2건은 포기 검토가 필요합니다.',
  },
  {
    type: 'info',
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    text: 'S·A 등급 핵심 특허 11건 중 US·EP·JP 해외 등록 비율이 36%로 주요 기술의 해외 권리화가 진행 중입니다.',
  },
  {
    type: 'suggest',
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
    text: '이번 분기 재평가 18건 중 33%가 아직 미회신 상태입니다. 2026-06-30 마감 전 회신을 독려하세요.',
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
  color: #6366f1; margin: 0 0 5px;
}
.page-header__title {
  font-size: 22px; font-weight: 700;
  color: #0f172a; margin: 0 0 4px; letter-spacing: -0.02em;
}
.page-header__desc { font-size: 13.5px; color: #64748b; margin: 0; }

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
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  min-width: 80px;
}
.summary-chip__value { font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -.02em; }
.summary-chip__label { font-size: 11px; color: #94a3b8; font-weight: 500; margin-top: 2px; }

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
.chart-card--insight { background: linear-gradient(145deg, #fafbff, #f5f3ff); border-color: #e0e7ff; }

.chart-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
}
.chart-card__title {
  display: flex; align-items: center; gap: 8px;
  font-size: 14px; font-weight: 700; color: #0f172a; margin: 0;
}
.chart-card__sub { font-size: 12.5px; color: #94a3b8; }

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

/* ── 연도별 추이 (꺾은선) ────────────────────────── */
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
.donut-legend-item__name { flex: 1; color: #374151; font-weight: 500; }
.donut-legend-item__count { font-weight: 700; color: #0f172a; }
.donut-legend-item__pct { color: #94a3b8; min-width: 32px; text-align: right; }

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

.grade-dist-item__label { font-size: 13px; font-weight: 500; color: #374151; flex: 1; }
.grade-dist-item__count { font-size: 13px; font-weight: 700; color: #0f172a; }

.grade-bar-wrap { height: 6px; background: #f1f5f9; border-radius: 3px; overflow: hidden; }
.grade-bar { height: 100%; border-radius: 3px; transition: width .7s cubic-bezier(.4,0,.2,1); }

.grade-note {
  display: flex; align-items: center; gap: 6px;
  padding: 10px 12px;
  background: #f8fafc;
  border-radius: 8px;
  font-size: 12px; color: #64748b; line-height: 1.5;
}

/* ── AI 인사이트 ─────────────────────────────────── */
.ai-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: #6366f1;
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
.insight-item--warn    { background: #fffbeb; color: #92400e; }
.insight-item--info    { background: #eef2ff; color: #3730a3; }
.insight-item--suggest { background: #f0fdf4; color: #14532d; }

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
  font-size: 12px; color: #64748b;
}
.legend-dot {
  width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
}
</style>
