<script setup>
import { computed, ref } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppModal from '@/components/ui/AppModal.vue'
import { PATENTS } from '@/data/patents.js'

const calendarMonth = ref(new Date('2025-07-01'))
const selectedDateLabel = ref('')
const selectedDatePatents = ref([])
const modalShow = ref(false)

const baseDate = new Date('2025-03-15')

function prevMonth() {
  const next = new Date(calendarMonth.value)
  next.setMonth(next.getMonth() - 1)
  calendarMonth.value = next
}

function nextMonth() {
  const next = new Date(calendarMonth.value)
  next.setMonth(next.getMonth() + 1)
  calendarMonth.value = next
}

const calendarLabel = computed(() => `${calendarMonth.value.getFullYear()}년 ${calendarMonth.value.getMonth() + 1}월`)

const calendarDays = computed(() => {
  const year = calendarMonth.value.getFullYear()
  const month = calendarMonth.value.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < firstDay; i += 1) cells.push(null)
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(day)
  return cells
})

const expiringPatents = computed(() =>
  PATENTS.filter((patent) => patent.status === '만료 예정').sort((a, b) => a.expiryDate.localeCompare(b.expiryDate))
)

const within1y = computed(() => countWithinDays(365))
const within3y = computed(() => countWithinDays(365 * 3))
const within5y = computed(() => countWithinDays(365 * 5))

function daysFromBase(dateStr) {
  return Math.floor((new Date(dateStr) - baseDate) / (1000 * 60 * 60 * 24))
}

function countWithinDays(limit) {
  return expiringPatents.value.filter((patent) => {
    const diff = daysFromBase(patent.expiryDate)
    return diff >= 0 && diff <= limit
  }).length
}

function dateStringForDay(day) {
  const year = calendarMonth.value.getFullYear()
  const month = String(calendarMonth.value.getMonth() + 1).padStart(2, '0')
  const date = String(day).padStart(2, '0')
  return `${year}-${month}-${date}`
}

function expiringOnDay(day) {
  if (!day) return []
  const dateStr = dateStringForDay(day)
  return expiringPatents.value.filter((patent) => patent.expiryDate === dateStr)
}

function clickDay(day) {
  const patents = expiringOnDay(day)
  if (!patents.length) return
  selectedDateLabel.value = dateStringForDay(day)
  selectedDatePatents.value = patents
  modalShow.value = true
}

function isSelectedDay(day) {
  return Boolean(day && selectedDateLabel.value === dateStringForDay(day))
}
</script>

<template>
  <AppLayout title="만료 예정 관리">
    <div class="space-y-3">
      <!-- 상단 요약 카드 3개 -->
      <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
        <AppCard padding="p-4">
          <div class="text-xs font-semibold text-gray-500">1년 이내 만료</div>
          <div class="mt-1 text-2xl font-bold" style="color:#EA002C;">{{ within1y }}건</div>
        </AppCard>
        <AppCard padding="p-4">
          <div class="text-xs font-semibold text-gray-500">3년 이내 만료</div>
          <div class="mt-1 text-2xl font-bold" style="color:#FF7A00;">{{ within3y }}건</div>
        </AppCard>
        <AppCard padding="p-4">
          <div class="text-xs font-semibold text-gray-500">5년 이내 만료</div>
          <div class="mt-1 text-2xl font-bold" style="color:#10B981;">{{ within5y }}건</div>
        </AppCard>
      </div>

      <!-- 만료 캘린더 (전체 너비) -->
      <AppCard padding="p-4">
        <div class="mb-4 flex items-center justify-between">
          <div class="section-title">만료 캘린더뷰</div>
          <div class="flex items-center gap-2">
            <button
              @click="prevMonth"
              class="h-7 w-7 rounded-md text-sm text-gray-500 hover:bg-gray-100"
              style="border:1px solid #E2E8F0; background:#FFFFFF;"
              aria-label="이전 달"
            >‹</button>
            <div class="min-w-24 text-center text-sm font-semibold text-gray-800">{{ calendarLabel }}</div>
            <button
              @click="nextMonth"
              class="h-7 w-7 rounded-md text-sm text-gray-500 hover:bg-gray-100"
              style="border:1px solid #E2E8F0; background:#FFFFFF;"
              aria-label="다음 달"
            >›</button>
          </div>
        </div>

        <div class="calendar-grid text-center">
          <div v-for="dayName in ['일', '월', '화', '수', '목', '금', '토']" :key="dayName" class="py-2 text-xs font-semibold text-gray-400 border-b border-gray-100">
            {{ dayName }}
          </div>
          <button
            v-for="(day, index) in calendarDays"
            :key="index"
            class="calendar-day relative flex flex-col items-center justify-center rounded-lg"
            :class="[
              day && expiringOnDay(day).length ? 'cursor-pointer font-semibold text-gray-800 hover:bg-orange-50' : 'text-gray-400',
              isSelectedDay(day) ? 'selected-day' : '',
            ]"
            :style="day ? 'border:1px solid #EEF2F7; background:#FFFFFF;' : 'border:1px solid transparent; background:transparent;'"
            :disabled="!day || expiringOnDay(day).length === 0"
            @click="clickDay(day)"
          >
            <span v-if="day" class="text-sm">{{ day }}</span>
            <span
              v-if="day && expiringOnDay(day).length"
              class="mt-0.5 h-1.5 w-1.5 rounded-full"
              style="background:#FF7A00;"
            ></span>
          </button>
        </div>

        <div class="mt-3 flex items-center gap-2 text-xs text-gray-400">
          <span class="inline-block h-2 w-2 rounded-full" style="background:#FF7A00;"></span>
          만료 예정 특허 있음 · 날짜를 클릭하면 목록을 확인할 수 있습니다
        </div>
      </AppCard>

      <!-- 만료 예정 특허 목록 -->
      <AppCard padding="p-4">
        <div class="section-title mb-3">만료 예정 특허 목록</div>
        <div class="overflow-x-auto rounded-lg" style="border:1px solid #D9E2EC;">
          <table class="expiry-table w-full min-w-[760px] text-sm">
            <thead>
              <tr>
                <th class="px-4 py-2.5 text-left text-xs font-bold text-gray-600">출원번호</th>
                <th class="px-4 py-2.5 text-left text-xs font-bold text-gray-600">특허명</th>
                <th class="px-4 py-2.5 text-left text-xs font-bold text-gray-600">만료일</th>
                <th class="px-4 py-2.5 text-left text-xs font-bold text-gray-600">사업부</th>
                <th class="px-4 py-2.5 text-left text-xs font-bold text-gray-600">상태</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="patent in expiringPatents" :key="patent.id">
                <td class="px-4 py-3 text-xs font-mono text-gray-600">{{ patent.number }}</td>
                <td class="px-4 py-3">
                  <div class="text-gray-800">{{ patent.title }}</div>
                  <div v-if="patent.aiTags?.length" class="flex flex-wrap gap-1 mt-1">
                    <span v-for="tag in patent.aiTags" :key="tag" style="background:#F1F5F9;color:#64748B;font-size:11px;border-radius:4px;padding:2px 6px;">{{ tag }}</span>
                  </div>
                </td>
                <td class="px-4 py-3 text-xs font-semibold" style="color:#FF7A00;">{{ patent.expiryDate }}</td>
                <td class="px-4 py-3 text-xs text-gray-600">{{ patent.dept }}</td>
                <td class="px-4 py-3"><span class="expiry-badge">만료 예정</span></td>
              </tr>
              <tr v-if="expiringPatents.length === 0">
                <td colspan="5" class="px-4 py-10 text-center text-sm text-gray-400">표시할 만료 예정 특허가 없습니다.</td>
              </tr>
            </tbody>
          </table>
        </div>
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
            <tr v-for="patent in selectedDatePatents" :key="patent.id" style="border-bottom:1px solid #F1F5F9;">
              <td class="px-3 py-2 text-xs font-mono text-gray-600">{{ patent.number }}</td>
              <td class="px-3 py-2 text-sm text-gray-800">{{ patent.title }}</td>
              <td class="px-3 py-2 text-xs text-gray-600">{{ patent.dept }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </AppModal>
  </AppLayout>
</template>

<style scoped>
.section-title {
  color: #1F2937;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.35;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 4px;
}

.calendar-day {
  height: 56px;
}

.calendar-day:disabled {
  cursor: default;
  opacity: 0.6;
}

.selected-day {
  border-color: rgba(255, 122, 0, 0.55) !important;
  background: #FFF7F0 !important;
  box-shadow: inset 0 0 0 1px rgba(255, 122, 0, 0.35);
}

.expiry-table thead tr {
  background: #F1F5F9;
  border-bottom: 1px solid #CBD5E1;
}

.expiry-table tbody tr {
  height: 44px;
  border-bottom: 1px solid #E2E8F0;
}

.expiry-table tbody tr:hover {
  background: #FFF7F0;
}

.expiry-badge {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  border-radius: 6px;
  padding: 3px 9px;
  background: rgba(255, 122, 0, 0.14);
  color: #D97706;
  font-size: 12px;
  font-weight: 700;
}
</style>
