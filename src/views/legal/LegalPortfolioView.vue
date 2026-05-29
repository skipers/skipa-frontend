<script setup>
import { computed } from 'vue'
import { Bar, Doughnut, Line } from 'vue-chartjs'
import { Chart as ChartJS, ArcElement, LineElement, BarElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend, Filler } from 'chart.js'
import AppLayout from '@/components/layout/AppLayout.vue'
import AppCard from '@/components/ui/AppCard.vue'
import { PATENTS, ANNUAL_DATA } from '@/data/patents.js'

ChartJS.register(ArcElement, LineElement, BarElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend, Filler)

const COLORS = ['#FF7A00', '#EA002C', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#94A3B8']

// 기술 분야별 트리맵 (CSS 기반으로 구현)
const techData = computed(() => {
  const counts = {}
  PATENTS.forEach((p) => { counts[p.techField] = (counts[p.techField] || 0) + 1 })
  const total = PATENTS.length
  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .map(([name, count], i) => ({ name, count, pct: Math.round((count / total) * 100), color: COLORS[i % COLORS.length] }))
})

// 국가별
const countryBarData = computed(() => {
  const counts = {}
  PATENTS.forEach((p) => { counts[p.country] = (counts[p.country] || 0) + 1 })
  const labels = Object.keys(counts).sort((a, b) => counts[b] - counts[a])
  return {
    labels,
    datasets: [{ data: labels.map((l) => counts[l]), backgroundColor: '#3B82F6', borderRadius: 4 }],
  }
})
const hbarOpts = { indexAxis: 'y', responsive: true, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true, ticks: { stepSize: 1 } } } }

// 연도별 출원·등록·만료 추이
const lineData = computed(() => ({
  labels: ANNUAL_DATA.map((d) => `${d.year}`),
  datasets: [
    { label: '출원', data: ANNUAL_DATA.map((d) => d.filed), borderColor: '#FF7A00', backgroundColor: 'rgba(255,122,0,0.05)', fill: false, tension: 0.4, pointBackgroundColor: '#FF7A00' },
    { label: '등록', data: ANNUAL_DATA.map((d) => d.registered), borderColor: '#10B981', backgroundColor: 'rgba(16,185,129,0.05)', fill: false, tension: 0.4, pointBackgroundColor: '#10B981' },
    { label: '만료', data: ANNUAL_DATA.map((d) => d.expired), borderColor: '#EA002C', backgroundColor: 'rgba(234,0,44,0.05)', fill: false, tension: 0.4, pointBackgroundColor: '#EA002C' },
  ],
}))
const lineOpts = { responsive: true, plugins: { legend: { position: 'top' } }, scales: { y: { beginAtZero: true } } }

// 사업부별 도넛
const deptData = computed(() => {
  const counts = {}
  PATENTS.forEach((p) => { counts[p.dept] = (counts[p.dept] || 0) + 1 })
  const labels = Object.keys(counts)
  return {
    labels,
    datasets: [{ data: labels.map((l) => counts[l]), backgroundColor: COLORS.slice(0, labels.length), borderWidth: 2, borderColor: '#fff' }],
  }
})
const donutOpts = { responsive: true, maintainAspectRatio: false, cutout: '60%', plugins: { legend: { position: 'right', labels: { font: { size: 11 } } } } }

// 가치평가 등급 분포
const gradeData = computed(() => {
  const counts = { S: 0, A: 0, B: 0, C: 0 }
  PATENTS.forEach((p) => { if (p.aiScore?.grade) counts[p.aiScore.grade]++ })
  return {
    labels: ['S등급', 'A등급', 'B등급', 'C등급'],
    datasets: [{ data: [counts.S, counts.A, counts.B, counts.C], backgroundColor: ['#FF7A00', '#3B82F6', '#10B981', '#94A3B8'], borderRadius: 4 }],
  }
})
const barOpts = { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
</script>

<template>
  <AppLayout title="포트폴리오 분석">
    <div class="grid grid-cols-2 gap-4">
      <!-- 기술 분야별 트리맵 (CSS) -->
      <AppCard title="기술 분야별 분포">
        <div class="flex flex-wrap gap-2">
          <div
            v-for="item in techData"
            :key="item.name"
            class="flex-none rounded-xl flex flex-col items-center justify-center text-white font-semibold"
            :style="`background:${item.color}; width:${Math.max(item.pct * 2.2, 60)}px; height:${Math.max(item.pct * 1.8, 50)}px; font-size:${item.pct > 10 ? 14 : 11}px;`"
          >
            <div>{{ item.name }}</div>
            <div class="text-xs opacity-80 mt-0.5">{{ item.count }}건</div>
          </div>
        </div>
      </AppCard>

      <!-- 국가별 -->
      <AppCard title="국가별 보유 특허">
        <Bar :data="countryBarData" :options="hbarOpts" style="max-height:220px;" />
      </AppCard>

      <!-- 연도별 추이 (전체 너비) -->
      <AppCard title="연도별 출원·등록·만료 추이" class="col-span-2">
        <Line :data="lineData" :options="lineOpts" style="max-height:240px;" />
      </AppCard>

      <!-- 사업부별 도넛 -->
      <AppCard title="사업부별 보유 현황">
        <div style="height:220px; display:flex; align-items:center; justify-content:center;">
          <Doughnut :data="deptData" :options="donutOpts" style="max-height:220px;" />
        </div>
      </AppCard>

      <!-- 가치평가 등급 -->
      <AppCard title="가치평가 등급 분포">
        <Bar :data="gradeData" :options="barOpts" style="max-height:220px;" />
      </AppCard>
    </div>
  </AppLayout>
</template>
