<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import { PATENTS } from '@/data/patents.js'
import { useAuthStore } from '@/stores/auth.js'

const router = useRouter()
const auth = useAuthStore()

const activeTab = ref('이번 분기 재평가 대상')
const tabs = ['이번 분기 재평가 대상', '유지 중인 특허', '만료/포기', '검토 제출 이력']

const myPatents = computed(() => PATENTS.filter((p) => p.dept === auth.currentUser?.dept))
const held = computed(() => myPatents.value.filter((p) => p.status === '등록' || p.status === '만료 예정'))
const closed = computed(() => myPatents.value.filter((p) => ['포기/만료', '만료', '포기'].includes(p.status)))
const history = computed(() => myPatents.value.filter((p) => p.evaluation?.replyDate).sort((a, b) => b.evaluation.replyDate.localeCompare(a.evaluation.replyDate)))
const thisQuarter = computed(() => myPatents.value.filter((p) => p.evaluation?.quarter === '2025-Q1' && p.evaluation?.status !== '요청 전'))
const thisQuarterDone = computed(() => thisQuarter.value.filter((p) => p.evaluation?.replyDate).length)
const thisQuarterPct = computed(() => {
  if (thisQuarter.value.length === 0) return 0
  return Math.round((thisQuarterDone.value / thisQuarter.value.length) * 100)
})

function isExpiringWithinOneYear(expiryDate) {
  if (!expiryDate) return false

  const today = new Date()
  const expiry = new Date(expiryDate)
  const diffMs = expiry - today
  const oneYearMs = 1000 * 60 * 60 * 24 * 365

  return diffMs >= 0 && diffMs <= oneYearMs
}

function getClosedStatusLabel(patent) {
  if (patent.status === '포기/만료') return patent.evaluation?.opinion === '포기' ? '포기' : '만료'
  return patent.status
}
</script>

<template>
  <AppLayout :title="`${auth.currentUser?.dept} 담당 특허`">
    <!-- 헤더 -->
    <div class="flex items-center justify-between mb-4">
      <div />
      <button
        @click="router.push('/patents/register')"
        class="px-4 py-2 text-sm font-semibold text-white rounded-lg cursor-pointer"
        style="background:#FF7A00; border:none;"
      >+ 특허 등록</button>
    </div>

    <div class="mb-4">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div class="rounded-xl p-4" style="border:1px solid #E2E8F0; background:#F8FAFC;">
          <div class="text-xs font-semibold text-gray-500">전체 담당 특허</div>
          <div class="mt-1 text-2xl font-bold text-gray-700">총 {{ myPatents.length }}건</div>
        </div>
        <div class="rounded-xl p-4" style="border:1px solid rgba(255,122,0,0.25); background:#FFF7F0;">
          <div class="text-xs font-semibold" style="color:#FF7A00;">유지 중</div>
          <div class="mt-1 text-2xl font-bold" style="color:#FF7A00;">{{ held.length }}건</div>
        </div>
        <div class="rounded-xl p-4" style="border:1px solid rgba(148,163,184,0.3); background:#F8FAFC;">
          <div class="text-xs font-semibold" style="color:#64748b;">만료/포기</div>
          <div class="mt-1 text-2xl font-bold" style="color:#94A3B8;">{{ closed.length }}건</div>
        </div>
      </div>

      <div class="mt-3 rounded-xl p-4" style="border:1px solid #E2E8F0; background:#FFFFFF;">
        <div class="flex items-center justify-between mb-2">
          <div class="text-sm font-semibold text-gray-700">이번 분기 재평가 진행률</div>
          <div class="text-xs text-gray-500">{{ thisQuarterPct }}%</div>
        </div>
        <div class="text-xs text-gray-600 mb-2">2025년 1분기 재평가 {{ thisQuarter.length }}건 중 {{ thisQuarterDone }}건 완료</div>
        <div class="h-2.5 rounded-full bg-gray-200 overflow-hidden">
          <div class="h-full rounded-full" style="background:#FF7A00;" :style="`width:${thisQuarterPct}%`" />
        </div>
      </div>
    </div>

    <!-- 탭 -->
    <div class="flex gap-6 border-b border-gray-200 mb-4">
      <button
        v-for="tab in tabs"
        :key="tab"
        @click="activeTab = tab"
        class="pb-3 text-sm cursor-pointer -mb-px"
        :class="activeTab === tab ? 'border-b-2 border-[#FF7A00] text-[#FF7A00] font-semibold' : 'text-gray-500 hover:text-gray-700'"
      >{{ tab }}</button>
    </div>

    <!-- 유지 중인 특허 -->
    <div v-if="activeTab === '유지 중인 특허'" class="bg-white rounded-xl overflow-hidden" style="border:1px solid #E2E8F0;">
      <table class="w-full text-sm">
        <thead><tr style="background:#F8FAFC; border-bottom:1px solid #E2E8F0;">
          <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500">출원번호</th>
          <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500">특허명</th>
          <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500">출원일</th>
          <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500">만료일</th>
          <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500">국가</th>
          <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500">상태</th>
        </tr></thead>
        <tbody>
          <tr v-for="p in held" :key="p.id" class="cursor-pointer" style="border-bottom:1px solid #F1F5F9;"
            @click="router.push(`/patents/${p.id}`)"
            @mouseenter="$event.currentTarget.style.background='#FFF7F0';"
            @mouseleave="$event.currentTarget.style.background='';">
            <td class="px-4 py-3 text-xs font-mono text-gray-600">{{ p.number }}</td>
            <td class="px-4 py-3 text-gray-800 font-medium max-w-xs truncate">{{ p.title }}</td>
            <td class="px-4 py-3 text-xs text-gray-500">{{ p.filingDate }}</td>
            <td class="px-4 py-3 text-xs text-gray-500">{{ p.expiryDate }}</td>
            <td class="px-4 py-3 text-xs text-gray-500">{{ p.country }}</td>
            <td class="px-4 py-3">
              <StatusBadge v-if="isExpiringWithinOneYear(p.expiryDate)" status="만료 예정" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 만료/포기 -->
    <div v-else-if="activeTab === '만료/포기'" class="bg-white rounded-xl overflow-hidden" style="border:1px solid #E2E8F0;">
      <table class="w-full text-sm">
        <thead>
          <tr style="background:#F8FAFC; border-bottom:1px solid #E2E8F0;">
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500">출원번호</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500">특허명</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500">만료일</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500">국가</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500">상태</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="p in closed"
            :key="p.id"
            class="cursor-pointer"
            style="border-bottom:1px solid #F1F5F9;"
            @click="router.push(`/patents/${p.id}`)"
            @mouseenter="$event.currentTarget.style.background='#FFF7F0';"
            @mouseleave="$event.currentTarget.style.background='';"
          >
            <td class="px-4 py-3 text-xs font-mono text-gray-600">{{ p.number }}</td>
            <td class="px-4 py-3 text-gray-600 max-w-xs truncate">{{ p.title }}</td>
            <td class="px-4 py-3 text-xs text-gray-500">{{ p.expiryDate }}</td>
            <td class="px-4 py-3 text-xs text-gray-500">{{ p.country }}</td>
            <td class="px-4 py-3"><StatusBadge :status="getClosedStatusLabel(p)" /></td>
          </tr>
          <tr v-if="closed.length === 0">
            <td colspan="5" class="px-4 py-12 text-center text-sm text-gray-400">해당 특허가 없습니다.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 검토 제출 이력 -->
    <div v-else-if="activeTab === '검토 제출 이력'" class="bg-white rounded-xl overflow-hidden" style="border:1px solid #E2E8F0;">
      <table class="w-full text-sm">
        <thead>
          <tr style="background:#F8FAFC; border-bottom:1px solid #E2E8F0;">
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500">제출일</th>
          <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500">분기</th>
          <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500">의견</th>
          <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500">출원번호</th>
          <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500">상세</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="p in history"
            :key="p.id"
            class="cursor-pointer"
            style="border-bottom:1px solid #F1F5F9;"
            @click="router.push(`/patents/${p.id}`)"
            @mouseenter="$event.currentTarget.style.background='#FFF7F0';"
            @mouseleave="$event.currentTarget.style.background='';"
          >
            <td class="px-4 py-3 text-xs text-gray-600">{{ p.evaluation.replyDate }}</td>
            <td class="px-4 py-3 text-xs text-gray-600">{{ p.evaluation.quarter }}</td>
            <td class="px-4 py-3"><StatusBadge :status="p.evaluation.opinion" /></td>
            <td class="px-4 py-3 text-xs font-mono text-gray-600">{{ p.number }}</td>
            <td class="px-4 py-3">
              <button @click.stop="router.push(`/patents/${p.id}`)" class="text-xs px-2 py-1 rounded cursor-pointer" style="background:#FFF7F0; color:#FF7A00; border:1px solid rgba(255,122,0,0.3);">상세보기</button>
            </td>
          </tr>
          <tr v-if="history.length === 0">
            <td colspan="5" class="px-4 py-12 text-center text-sm text-gray-400">제출 이력이 없습니다.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 이번 분기 재평가 대상 -->
    <div v-else-if="activeTab === '이번 분기 재평가 대상'" class="bg-white rounded-xl overflow-hidden" style="border:1px solid #E2E8F0;">
      <table class="w-full text-sm">
        <thead><tr style="background:#F8FAFC; border-bottom:1px solid #E2E8F0;">
          <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500">출원번호</th>
          <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500">특허명</th>
          <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500">평가 상태</th>
        </tr></thead>
        <tbody>
          <tr v-for="p in thisQuarter" :key="p.id" class="cursor-pointer" style="border-bottom:1px solid #F1F5F9;"
            @click="router.push(`/patents/${p.id}`)"
            @mouseenter="$event.currentTarget.style.background='#FFF7F0';"
            @mouseleave="$event.currentTarget.style.background='';">
            <td class="px-4 py-3 text-xs font-mono text-gray-600">{{ p.number }}</td>
            <td class="px-4 py-3 text-gray-800 font-medium max-w-xs truncate">{{ p.title }}</td>
            <td class="px-4 py-3"><StatusBadge :status="p.evaluation?.replyDate ? '완료' : '미완료'" /></td>
          </tr>
          <tr v-if="thisQuarter.length === 0"><td colspan="3" class="px-4 py-12 text-center text-sm text-gray-400">재평가 대상 특허가 없습니다.</td></tr>
        </tbody>
      </table>
    </div>
  </AppLayout>
</template>
