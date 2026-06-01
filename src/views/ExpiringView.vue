<script setup>
import { ref, computed } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import AppCard from '@/components/ui/AppCard.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import AppModal from '@/components/ui/AppModal.vue'
import { PATENTS } from '@/data/patents.js'
import { useAuthStore } from '@/stores/auth.js'

const auth = useAuthStore()

const basePatents = computed(() =>
  auth.isDept ? PATENTS.filter((p) => p.dept === auth.currentUser?.dept) : PATENTS,
)

const now = new Date('2025-05-29')
function dayDiff(dateStr) {
  return (new Date(dateStr) - now) / (1000 * 60 * 60 * 24 * 365)
}

const within1y = computed(() => basePatents.value.filter((p) => p.status !== '포기/만료' && new Date(p.expiryDate) > now && dayDiff(p.expiryDate) <= 1).length)
const within3y = computed(() => basePatents.value.filter((p) => p.status !== '포기/만료' && new Date(p.expiryDate) > now && dayDiff(p.expiryDate) <= 3).length)
const within5y = computed(() => basePatents.value.filter((p) => p.status !== '포기/만료' && new Date(p.expiryDate) > now && dayDiff(p.expiryDate) <= 5).length)

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
  return basePatents.value.filter((p) => p.expiryDate === dateStr && p.status !== '포기/만료')
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

    <!-- 만료 캘린더 (전체 너비) -->
    <AppCard title="만료 캘린더" class="mb-4">
      <div class="flex items-center justify-between mb-4">
        <button @click="prevMonth" class="text-gray-400 hover:text-gray-600 cursor-pointer" style="background:none;border:none;font-size:24px;">‹</button>
        <span class="text-base font-semibold text-gray-700">{{ calendarLabel }}</span>
        <button @click="nextMonth" class="text-gray-400 hover:text-gray-600 cursor-pointer" style="background:none;border:none;font-size:24px;">›</button>
      </div>
      <div class="grid grid-cols-7 text-center" style="gap:2px;">
        <div v-for="dow in ['일','월','화','수','목','금','토']" :key="dow" class="text-xs font-semibold text-gray-400 py-2 border-b border-gray-100">{{ dow }}</div>
        <div
          v-for="(day, i) in calendarDays"
          :key="i"
          class="relative flex flex-col items-center justify-center rounded-lg py-3"
          :class="day && expiringOnDay(day).length ? 'cursor-pointer hover:bg-orange-50' : ''"
          @click="clickDay(day)"
        >
          <span
            class="text-sm w-8 h-8 flex items-center justify-center rounded-full"
            :class="day && expiringOnDay(day).length ? 'font-bold' : 'text-gray-500'"
            :style="day && expiringOnDay(day).length ? 'color:#FF7A00;' : ''"
          >{{ day }}</span>
          <span v-if="day && expiringOnDay(day).length" class="mt-1 w-1.5 h-1.5 rounded-full" style="background:#FF7A00;" />
        </div>
      </div>
      <div class="mt-3 flex items-center gap-2 text-xs text-gray-400">
        <span class="inline-block w-2 h-2 rounded-full" style="background:#FF7A00;"></span>
        만료 예정 특허 있음 · 날짜를 클릭하면 목록을 확인할 수 있습니다
      </div>
    </AppCard>

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
