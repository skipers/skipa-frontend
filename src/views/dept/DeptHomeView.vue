<script setup>
import { computed } from 'vue'
import { Doughnut } from 'vue-chartjs'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import AppLayout from '@/components/layout/AppLayout.vue'
import AppCard from '@/components/ui/AppCard.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import { PATENTS } from '@/data/patents.js'
import { useAuthStore } from '@/stores/auth.js'

ChartJS.register(ArcElement, Tooltip, Legend)

const auth = useAuthStore()
const myPatents = computed(() => PATENTS.filter((p) => p.dept === auth.currentUser?.dept))

const held = computed(() => myPatents.value.filter((p) => p.status === '등록').length)
const abandoned = computed(() => myPatents.value.filter((p) => p.status === '포기+만료').length)

const donutData = computed(() => ({
  labels: ['유지 중', '포기/만료'],
  datasets: [{ data: [held.value, abandoned.value], backgroundColor: ['#10B981', '#94A3B8'], borderWidth: 2, borderColor: '#fff' }],
}))
const donutOpts = { responsive: true, maintainAspectRatio: false, cutout: '60%', plugins: { legend: { position: 'bottom', labels: { font: { size: 11 } } } } }

const evalPatents = computed(() => myPatents.value.filter((p) => p.evaluation?.quarter === '2025-Q1' && p.evaluation?.status !== '요청 전'))
const submitted = computed(() => evalPatents.value.filter((p) => p.evaluation?.replyDate).length)
const total = computed(() => evalPatents.value.length)
const pct = computed(() => total.value > 0 ? Math.round((submitted.value / total.value) * 100) : 0)

const deadline = new Date('2025-03-31')
const now = new Date('2025-05-29')
const dday = computed(() => {
  const diff = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24))
  return diff
})

const recentOpinions = computed(() =>
  myPatents.value
    .filter((p) => p.evaluation?.replyDate)
    .sort((a, b) => b.evaluation.replyDate.localeCompare(a.evaluation.replyDate))
    .slice(0, 5)
)
</script>

<template>
  <AppLayout title="사업부 홈">
    <div class="grid grid-cols-2 gap-4 mb-4">
      <!-- 최근 의견 제출 -->
      <AppCard title="최근 의견 제출">
        <div class="space-y-2">
          <div
            v-for="p in recentOpinions"
            :key="p.id"
            class="flex items-center justify-between p-3 rounded-lg"
            style="background:#F8FAFC; border:1px solid #F1F5F9;"
          >
            <div>
              <div class="text-xs font-semibold text-gray-700 truncate max-w-xs">{{ p.title }}</div>
              <div class="flex items-center gap-2 mt-0.5">
                <span class="text-xs font-mono text-gray-400">{{ p.number }}</span>
                <span class="text-xs text-gray-400">{{ p.evaluation.quarter }}</span>
              </div>
              <div class="text-xs text-gray-400 mt-0.5">제출일: {{ p.evaluation.replyDate }}</div>
            </div>
            <StatusBadge :status="p.evaluation.opinion" class="ml-2 shrink-0" />
          </div>
          <div v-if="recentOpinions.length === 0" class="text-center py-6 text-sm text-gray-400">제출한 의견이 없습니다.</div>
        </div>
      </AppCard>

      <!-- D-day -->
      <AppCard>
        <div class="text-sm font-semibold text-gray-700 mb-2">이번 분기 제출 기한</div>
        <div class="text-center py-6">
          <div v-if="dday < 0" class="text-base text-gray-400">아직 재평가 기간이 아닙니다.</div>
          <div v-else>
            <div class="text-5xl font-bold mb-2" :style="dday <= 7 ? 'color:#EA002C;' : 'color:#FF7A00;'">
              D-{{ dday }}
            </div>
            <div class="text-sm text-gray-500">2025년 3월 31일 마감</div>
          </div>
        </div>
      </AppCard>
    </div>

    <div class="grid grid-cols-2 gap-4">
      <!-- 담당 특허 현황 도넛 -->
      <AppCard title="담당 특허 현황">
        <div class="flex flex-col items-center">
          <div style="height:180px; width:180px;">
            <Doughnut :data="donutData" :options="donutOpts" />
          </div>
          <div class="text-xs text-gray-400 mt-2">전체 {{ myPatents.length }}건</div>
        </div>
      </AppCard>

      <!-- 제출 현황 -->
      <AppCard title="이번 분기 재평가 제출 현황">
        <div class="space-y-4 py-4">
          <div class="text-center">
            <div class="text-4xl font-bold mb-1" style="color:#FF7A00;">{{ submitted }}</div>
            <div class="text-sm text-gray-500">/ {{ total }}건 완료</div>
          </div>
          <div>
            <div class="flex justify-between text-xs text-gray-500 mb-1.5">
              <span>진행률</span><span>{{ pct }}%</span>
            </div>
            <div class="h-3 rounded-full bg-gray-200 overflow-hidden">
              <div class="h-3 rounded-full transition-all" style="background:#FF7A00;" :style="`width:${pct}%`" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3 mt-4">
            <div class="text-center p-3 rounded-xl" style="background:rgba(16,185,129,0.08);">
              <div class="text-xl font-bold" style="color:#059669;">{{ submitted }}</div>
              <div class="text-xs text-gray-500 mt-0.5">제출 완료</div>
            </div>
            <div class="text-center p-3 rounded-xl" style="background:rgba(148,163,184,0.1);">
              <div class="text-xl font-bold text-gray-600">{{ total - submitted }}</div>
              <div class="text-xs text-gray-500 mt-0.5">미제출</div>
            </div>
          </div>
        </div>
      </AppCard>
    </div>
  </AppLayout>
</template>
