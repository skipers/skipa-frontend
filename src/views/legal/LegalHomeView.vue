<script setup>
import { computed } from 'vue'
import { Line, Doughnut, Bar } from 'vue-chartjs'
import { Chart as ChartJS, ArcElement, LineElement, BarElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend, Filler } from 'chart.js'
import AppLayout from '@/components/layout/AppLayout.vue'
import AppCard from '@/components/ui/AppCard.vue'
import { PATENTS, ANNUAL_FEE } from '@/data/patents.js'

ChartJS.register(ArcElement, LineElement, BarElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend, Filler)

const evalStats = computed(() => {
  const evals = PATENTS.filter((p) => p.evaluation?.quarter === '2025-Q1')
  return {
    total: evals.length,
    beforeRequest: evals.filter((p) => p.evaluation.status === '요청 전').length,
    requested: evals.filter((p) => p.evaluation.status === '요청 완료').length,
    delayed: evals.filter((p) => p.evaluation.status === '지연').length,
    replied: evals.filter((p) => p.evaluation.status === '회신 완료').length,
  }
})

const statusCounts = computed(() => {
  const registered = PATENTS.filter((p) => p.status === '등록').length
  const expiring = PATENTS.filter((p) => p.status === '만료 예정').length
  const abandoned = PATENTS.filter((p) => p.status === '포기+만료').length
  return { registered, expiring, abandoned }
})

const donutData = computed(() => ({
  labels: ['등록', '만료 예정', '포기+만료'],
  datasets: [{ data: [statusCounts.value.registered, statusCounts.value.expiring, statusCounts.value.abandoned], backgroundColor: ['#10B981', '#FF7A00', '#94A3B8'], borderWidth: 2, borderColor: '#fff' }],
}))
const donutOptions = { responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { position: 'right', labels: { font: { size: 11 } } } } }

const countryData = computed(() => {
  const counts = {}
  PATENTS.forEach((p) => { counts[p.country] = (counts[p.country] || 0) + 1 })
  const labels = Object.keys(counts)
  return {
    labels,
    datasets: [{ data: labels.map((l) => counts[l]), backgroundColor: '#3B82F6', borderRadius: 4 }],
  }
})
const hbarOptions = { indexAxis: 'y', responsive: true, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true, ticks: { stepSize: 1 } } } }

const feeData = computed(() => ({
  labels: ANNUAL_FEE.map((d) => `${d.year}년`),
  datasets: [{
    label: '연차료 (만원)',
    data: ANNUAL_FEE.map((d) => Math.round(d.amount / 10000)),
    borderColor: '#FF7A00',
    backgroundColor: 'rgba(255,122,0,0.08)',
    fill: true,
    tension: 0.4,
    pointBackgroundColor: '#FF7A00',
  }],
}))
const lineOptions = { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }

const recentReplies = computed(() =>
  PATENTS.filter((p) => p.evaluation?.replyDate).sort((a, b) => b.evaluation.replyDate.localeCompare(a.evaluation.replyDate)).slice(0, 5)
)
</script>

<template>
  <AppLayout title="Legal 홈">
    <!-- 재평가 파이프라인 -->
    <AppCard class="mb-4">
      <div class="text-sm font-semibold text-gray-700 mb-4">2025년 1분기 재평가 파이프라인</div>
      <div class="flex items-center gap-2">
        <div
          v-for="(step, i) in [
            { label: '요청 전', count: evalStats.beforeRequest, color: '#94A3B8' },
            { label: '요청 완료', count: evalStats.requested, color: '#3B82F6' },
            { label: '지연', count: evalStats.delayed, color: '#EA002C' },
            { label: '회신 완료', count: evalStats.replied, color: '#10B981' },
          ]"
          :key="step.label"
          class="flex-1"
        >
          <div class="rounded-xl p-4 text-center" :style="`background:${step.color}15; border:1px solid ${step.color}40;`">
            <div class="text-2xl font-bold mb-1" :style="`color:${step.color};`">{{ step.count }}</div>
            <div class="text-xs font-medium text-gray-600">{{ step.label }}</div>
          </div>
          <div v-if="i < 3" class="text-gray-300 text-xl text-center mt-2">→</div>
        </div>
      </div>
      <div v-if="evalStats.delayed > 0" class="mt-3 px-3 py-2 rounded-lg text-xs" style="background:rgba(234,0,44,0.08); color:#EA002C;">
        ⚠ 기한 초과 {{ evalStats.delayed }}건 — 즉시 확인이 필요합니다
      </div>
    </AppCard>

    <div class="grid grid-cols-2 gap-4 mb-4">
      <!-- 상태별 도넛 -->
      <AppCard title="총 관리 특허 상태 분포">
        <div class="flex items-center gap-4">
          <div style="width:200px; height:160px;">
            <Doughnut :data="donutData" :options="donutOptions" />
          </div>
          <div class="space-y-2">
            <div class="text-xs text-gray-500">전체 <span class="font-bold text-gray-800 text-base">{{ PATENTS.length }}</span>건</div>
            <div class="text-xs"><span class="inline-block w-2.5 h-2.5 rounded-full mr-1.5" style="background:#10B981;" />등록 {{ statusCounts.registered }}건</div>
            <div class="text-xs"><span class="inline-block w-2.5 h-2.5 rounded-full mr-1.5" style="background:#FF7A00;" />만료 예정 {{ statusCounts.expiring }}건</div>
            <div class="text-xs"><span class="inline-block w-2.5 h-2.5 rounded-full mr-1.5" style="background:#94A3B8;" />포기+만료 {{ statusCounts.abandoned }}건</div>
          </div>
        </div>
      </AppCard>

      <!-- 국가별 분포 -->
      <AppCard title="국가별 보유 특허">
        <Bar :data="countryData" :options="hbarOptions" style="max-height:180px;" />
      </AppCard>
    </div>

    <div class="grid grid-cols-2 gap-4">
      <!-- 연차료 추이 -->
      <AppCard title="연간 연차료 지출 추이">
        <Line :data="feeData" :options="lineOptions" style="max-height:200px;" />
      </AppCard>

      <!-- 사업부 회신 알림 -->
      <AppCard title="사업부 회신 알림">
        <div class="space-y-2">
          <div
            v-for="p in recentReplies"
            :key="p.id"
            class="flex items-center justify-between p-3 rounded-lg"
            style="background:#F8FAFC; border:1px solid #F1F5F9;"
          >
            <div>
              <div class="text-xs font-semibold text-gray-700">{{ p.dept }}</div>
              <div class="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{{ p.title }}</div>
              <div class="text-xs font-mono text-gray-400 mt-0.5">{{ p.number }}</div>
            </div>
            <div class="text-right shrink-0 ml-4">
              <div class="text-xs text-gray-400">{{ p.evaluation.replyDate }}</div>
              <div class="mt-1">
                <span class="text-xs px-2 py-0.5 rounded font-semibold"
                  :style="p.evaluation.opinion === '유지' ? 'background:rgba(16,185,129,0.1); color:#059669;' : 'background:rgba(234,0,44,0.1); color:#EA002C;'">
                  {{ p.evaluation.opinion }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </AppCard>
    </div>
  </AppLayout>
</template>
