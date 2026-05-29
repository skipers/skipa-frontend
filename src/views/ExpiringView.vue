<script setup>
import { ref, computed } from 'vue'
import { Bar, Pie } from 'vue-chartjs'
import { Chart as ChartJS, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js'
import AppLayout from '@/components/layout/AppLayout.vue'
import AppCard from '@/components/ui/AppCard.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import AppModal from '@/components/ui/AppModal.vue'
import { PATENTS } from '@/data/patents.js'
import { useAuthStore } from '@/stores/auth.js'

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend)

const auth = useAuthStore()

const basePatents = computed(() =>
  auth.isDept ? PATENTS.filter((p) => p.dept === auth.currentUser?.dept) : PATENTS,
)

const now = new Date('2025-05-29')
function dayDiff(dateStr) {
  return (new Date(dateStr) - now) / (1000 * 60 * 60 * 24 * 365)
}

const within1y = computed(() => basePatents.value.filter((p) => p.status !== '포기+만료' && new Date(p.expiryDate) > now && dayDiff(p.expiryDate) <= 1).length)
const within3y = computed(() => basePatents.value.filter((p) => p.status !== '포기+만료' && new Date(p.expiryDate) > now && dayDiff(p.expiryDate) <= 3).length)
const within5y = computed(() => basePatents.value.filter((p) => p.status !== '포기+만료' && new Date(p.expiryDate) > now && dayDiff(p.expiryDate) <= 5).length)

const barData = computed(() => ({
  labels: ['1년 이내', '3년 이내', '5년 이내'],
  datasets: [{ data: [within1y.value, within3y.value, within5y.value], backgroundColor: ['#EA002C', '#FF7A00', '#94A3B8'], borderRadius: 4 }],
}))
const barOptions = { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }

const pieData = computed(() => {
  const techCounts = {}
  basePatents.value.filter((p) => p.status !== '포기+만료').forEach((p) => { techCounts[p.techField] = (techCounts[p.techField] || 0) + 1 })
  const labels = Object.keys(techCounts)
  const data = labels.map((l) => techCounts[l])
  const COLORS = ['#FF7A00', '#EA002C', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6']
  return {
    labels,
    datasets: [{ data, backgroundColor: COLORS.slice(0, labels.length), borderWidth: 2, borderColor: '#fff' }],
  }
})
const pieOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { font: { size: 12 } } } } }

// Calendar
const calendarMonth = ref(new Date('2025-05-01'))
const selectedDatePatents = ref([])
const modalShow = ref(false)

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
  return basePatents.value.filter((p) => p.expiryDate === dateStr && p.status !== '포기+만료')
}

function clickDay(day) {
  const patents = expiringOnDay(day)
  if (patents.length) { selectedDatePatents.value = patents; modalShow.value = true }
}

const expiringList = computed(() =>
  basePatents.value.filter((p) => p.status === '만료 예정').sort((a, b) => a.expiryDate.localeCompare(b.expiryDate))
)
</script>

<template>
  <AppLayout title="만료 예정 특허 관리">
    <!-- 상단 카운트 카드 -->
    <div class="grid grid-cols-3 gap-4 mb-4">
      <AppCard>
        <div class="text-xs text-gray-400 mb-1">1년 이내 만료</div>
        <div class="text-3xl font-bold" style="color:#EA002C;">{{ within1y }}</div>
        <div class="text-xs text-gray-400 mt-1">건</div>
      </AppCard>
      <AppCard>
        <div class="text-xs text-gray-400 mb-1">3년 이내 만료</div>
        <div class="text-3xl font-bold" style="color:#FF7A00;">{{ within3y }}</div>
        <div class="text-xs text-gray-400 mt-1">건</div>
      </AppCard>
      <AppCard>
        <div class="text-xs text-gray-400 mb-1">5년 이내 만료</div>
        <div class="text-3xl font-bold text-gray-700">{{ within5y }}</div>
        <div class="text-xs text-gray-400 mt-1">건</div>
      </AppCard>
    </div>

    <div class="grid grid-cols-3 gap-4 mb-4">
      <!-- 바 차트 -->
      <AppCard title="기간별 만료 예정 건수">
        <Bar :data="barData" :options="barOptions" style="max-height:200px;" />
      </AppCard>

      <!-- 파이 차트 -->
      <AppCard title="기술 분야별 분포">
        <Pie :data="pieData" :options="pieOptions" style="max-height:200px;" />
      </AppCard>

      <!-- 캘린더 -->
      <AppCard title="만료 캘린더">
        <div class="flex items-center justify-between mb-2">
          <button @click="prevMonth" class="text-gray-400 hover:text-gray-600 cursor-pointer" style="background:none;border:none;font-size:20px;">‹</button>
          <span class="text-sm font-semibold text-gray-700">{{ calendarLabel }}</span>
          <button @click="nextMonth" class="text-gray-400 hover:text-gray-600 cursor-pointer" style="background:none;border:none;font-size:20px;">›</button>
        </div>
        <div class="grid grid-cols-7 gap-0.5 text-center">
          <div v-for="dow in ['일','월','화','수','목','금','토']" :key="dow" class="text-xs text-gray-400 py-1">{{ dow }}</div>
          <div
            v-for="(day, i) in calendarDays"
            :key="i"
            class="text-xs py-1.5 rounded relative"
            :class="day && expiringOnDay(day).length ? 'cursor-pointer font-bold' : ''"
            :style="day && expiringOnDay(day).length ? 'background:#FFF7F0; color:#FF7A00;' : 'color:#6b7280;'"
            @click="clickDay(day)"
          >
            {{ day }}
            <span v-if="day && expiringOnDay(day).length" class="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full" style="background:#FF7A00;" />
          </div>
        </div>
      </AppCard>
    </div>

    <!-- 목록 -->
    <AppCard title="만료 예정 특허 목록">
      <table class="w-full text-sm">
        <thead>
          <tr style="background:#F8FAFC; border-bottom:1px solid #E2E8F0;">
            <th class="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">특허번호</th>
            <th class="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">특허명</th>
            <th class="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">만료일</th>
            <th v-if="auth.isLegal" class="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">사업부</th>
            <th class="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">상태</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in expiringList" :key="p.id" style="border-bottom:1px solid #F1F5F9;">
            <td class="px-4 py-2.5 text-xs font-mono text-gray-600">{{ p.number }}</td>
            <td class="px-4 py-2.5 text-gray-800 text-sm">{{ p.title }}</td>
            <td class="px-4 py-2.5 text-xs font-semibold" style="color:#FF7A00;">{{ p.expiryDate }}</td>
            <td v-if="auth.isLegal" class="px-4 py-2.5 text-xs text-gray-600">{{ p.dept }}</td>
            <td class="px-4 py-2.5"><StatusBadge :status="p.status" /></td>
          </tr>
        </tbody>
      </table>
    </AppCard>

    <AppModal :show="modalShow" title="만료 예정 특허" @close="modalShow = false">
      <div class="space-y-3">
        <div v-for="p in selectedDatePatents" :key="p.id" class="p-3 rounded-lg" style="background:#F8FAFC; border:1px solid #E2E8F0;">
          <div class="text-sm font-semibold text-gray-800">{{ p.title }}</div>
          <div class="text-xs text-gray-500 mt-0.5">{{ p.number }} · {{ p.dept }}</div>
          <div class="text-xs mt-1" style="color:#FF7A00;">만료일: {{ p.expiryDate }}</div>
        </div>
      </div>
    </AppModal>
  </AppLayout>
</template>
