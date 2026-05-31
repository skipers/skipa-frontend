<script setup>
import { ref, computed } from 'vue'
import { Bar } from 'vue-chartjs'
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js'
import AppLayout from '@/components/layout/AppLayout.vue'
import AppCard from '@/components/ui/AppCard.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import AppModal from '@/components/ui/AppModal.vue'
import { PATENTS } from '@/data/patents.js'

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend)

const calendarMonth = ref(new Date('2025-05-01'))
const selectedDatePatents = ref([])
const selectedDateLabel = ref('')
const modalShow = ref(false)
const activePeriodTab = ref('전체')

const periodTabs = ['전체', '단기(1년)', '중기(3년)', '장기(5년)']
const baseDate = new Date('2025-03-15')

function prevMonth() { const d = new Date(calendarMonth.value); d.setMonth(d.getMonth() - 1); calendarMonth.value = d }
function nextMonth() { const d = new Date(calendarMonth.value); d.setMonth(d.getMonth() + 1); calendarMonth.value = d }

const calendarLabel = computed(() => `${calendarMonth.value.getFullYear()}년 ${calendarMonth.value.getMonth() + 1}월`)

const calendarDays = computed(() => {
  const y = calendarMonth.value.getFullYear()
  const m = calendarMonth.value.getMonth()
  const first = new Date(y, m, 1).getDay()
  const daysInMonth = new Date(y, m + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < first; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  return cells
})

function expiringOnDay(day) {
  if (!day) return []
  const y = calendarMonth.value.getFullYear()
  const m = String(calendarMonth.value.getMonth() + 1).padStart(2, '0')
  const dd = String(day).padStart(2, '0')
  const dateStr = `${y}-${m}-${dd}`
  return PATENTS.filter((p) => p.expiryDate === dateStr && p.status !== '포기/만료')
}

function clickDay(day) {
  const patents = expiringOnDay(day)
  if (patents.length) {
    const y = calendarMonth.value.getFullYear()
    const m = String(calendarMonth.value.getMonth() + 1).padStart(2, '0')
    const dd = String(day).padStart(2, '0')
    selectedDateLabel.value = `${y}-${m}-${dd}`
    selectedDatePatents.value = patents
    modalShow.value = true
  }
}

// 경쟁사 뷰 (더미 데이터)
const competitorData = computed(() => ({
  labels: ['AI/ML', '반도체', '통신', '에너지', '제조'],
  datasets: [
    { label: '자사', data: [8, 5, 4, 4, 4], backgroundColor: '#FF7A00', borderRadius: 4 },
    { label: '경쟁사', data: [5, 7, 6, 3, 5], backgroundColor: '#4B6BFB', borderRadius: 4 },
  ],
}))
const competitorOpts = { responsive: true, plugins: { legend: { position: 'top' } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }

const expiringList = computed(() => {
  const list = PATENTS.filter((p) => p.status === '만료 예정')
  const daysByTab = {
    '단기(1년)': 365,
    '중기(3년)': 365 * 3,
    '장기(5년)': 365 * 5,
  }

  if (activePeriodTab.value === '전체') {
    return [...list].sort((a, b) => a.expiryDate.localeCompare(b.expiryDate))
  }

  const limit = daysByTab[activePeriodTab.value]
  return list
    .filter((p) => {
      const diff = Math.floor((new Date(p.expiryDate) - baseDate) / (1000 * 60 * 60 * 24))
      return diff >= 0 && diff <= limit
    })
    .sort((a, b) => a.expiryDate.localeCompare(b.expiryDate))
})
</script>

<template>
  <AppLayout title="만료 예정 관리">
    <div class="pt-2 md:pt-3">
      <div class="grid grid-cols-2 gap-4 mb-4">
      <!-- 캘린더 -->
      <AppCard title="만료 캘린더">
        <div class="flex items-center justify-between mb-3">
          <button @click="prevMonth" class="text-gray-400 hover:text-gray-600 cursor-pointer" style="background:none;border:none;font-size:20px;">‹</button>
          <span class="text-sm font-semibold text-gray-700">{{ calendarLabel }}</span>
          <button @click="nextMonth" class="text-gray-400 hover:text-gray-600 cursor-pointer" style="background:none;border:none;font-size:20px;">›</button>
        </div>
        <div class="grid grid-cols-7 gap-0.5 text-center">
          <div v-for="dow in ['일','월','화','수','목','금','토']" :key="dow" class="text-xs text-gray-400 py-1">{{ dow }}</div>
          <div
            v-for="(day, i) in calendarDays"
            :key="i"
            class="text-xs py-2 rounded relative"
            :class="day && expiringOnDay(day).length ? 'cursor-pointer font-bold' : ''"
            :style="day && expiringOnDay(day).length ? 'background:#FFF7F0; color:#FF7A00;' : 'color:#6b7280;'"
            @click="clickDay(day)"
          >
            {{ day }}
            <span v-if="day && expiringOnDay(day).length" class="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full" style="background:#FF7A00;" />
          </div>
        </div>
      </AppCard>

      <!-- 경쟁사 뷰 -->
      <AppCard title="자사 vs 경쟁사 특허 현황">
        <div class="text-xs text-gray-500 mb-3">기술 분야별 보유 특허 비교</div>
        <Bar :data="competitorData" :options="competitorOpts" style="max-height:200px;" />
        <div class="mt-3 px-3 py-2 rounded-lg text-xs" style="border-left:3px solid #EA002C; background:rgba(234,0,44,0.05); color:#EA002C;">
          ⚠ 반도체·통신 분야에서 경쟁사 특허가 자사 대비 증가 추세입니다.
        </div>
      </AppCard>
      </div>

      <!-- 만료 예정 목록 -->
      <AppCard title="만료 예정 특허 목록">
        <div class="flex gap-6 border-b border-gray-200 mb-3">
          <button
            v-for="tab in periodTabs"
            :key="tab"
            @click="activePeriodTab = tab"
            class="pb-3 text-sm cursor-pointer -mb-px"
            :class="activePeriodTab === tab ? 'border-b-2 border-[#FF7A00] text-[#FF7A00] font-semibold' : 'text-gray-500 hover:text-gray-700'"
          >{{ tab }}</button>
        </div>

        <table class="w-full text-sm">
          <thead>
            <tr style="background:#F8FAFC; border-bottom:1px solid #E2E8F0;">
              <th class="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">출원번호</th>
              <th class="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">특허명</th>
              <th class="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">만료일</th>
              <th class="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">사업부</th>
              <th class="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">상태</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in expiringList" :key="p.id" style="border-bottom:1px solid #F1F5F9;">
              <td class="px-4 py-2.5 text-xs font-mono text-gray-600">{{ p.number }}</td>
              <td class="px-4 py-2.5 text-gray-800 text-sm">{{ p.title }}</td>
              <td class="px-4 py-2.5 text-xs font-semibold" style="color:#FF7A00;">{{ p.expiryDate }}</td>
              <td class="px-4 py-2.5 text-xs text-gray-600">{{ p.dept }}</td>
              <td class="px-4 py-2.5"><StatusBadge :status="p.status" /></td>
            </tr>
          </tbody>
        </table>
      </AppCard>
    </div>

    <AppModal :show="modalShow" :title="`${selectedDateLabel} 만료 예정 특허`" @close="modalShow = false">
      <div class="overflow-hidden rounded-lg" style="border:1px solid #E2E8F0;">
        <table class="w-full text-sm">
          <thead>
            <tr style="background:#F8FAFC; border-bottom:1px solid #E2E8F0;">
              <th class="px-3 py-2 text-left text-xs font-semibold text-gray-500">출원번호</th>
              <th class="px-3 py-2 text-left text-xs font-semibold text-gray-500">특허명</th>
              <th class="px-3 py-2 text-left text-xs font-semibold text-gray-500">사업부</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in selectedDatePatents" :key="p.id" style="border-bottom:1px solid #F1F5F9;">
              <td class="px-3 py-2 text-xs font-mono text-gray-600">{{ p.number }}</td>
              <td class="px-3 py-2 text-sm text-gray-800">{{ p.title }}</td>
              <td class="px-3 py-2 text-xs text-gray-600">{{ p.dept }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </AppModal>
  </AppLayout>
</template>
