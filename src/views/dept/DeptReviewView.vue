<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import AppCard from '@/components/ui/AppCard.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import { PATENTS } from '@/data/patents.js'
import { useAuthStore } from '@/stores/auth.js'

const router = useRouter()
const auth = useAuthStore()

const activeTab = ref('전체')

const myEvalPatents = computed(() =>
  PATENTS.filter((p) => p.dept === auth.currentUser?.dept && p.evaluation?.quarter === '2025-Q1' && p.evaluation?.status !== '요청 전')
)

const reviewStats = computed(() => ({
  total: myEvalPatents.value.length,
  done: myEvalPatents.value.filter((p) => p.evaluation?.replyDate).length,
  pending: myEvalPatents.value.filter((p) => !p.evaluation?.replyDate).length,
}))

const reviewPct = computed(() => {
  if (reviewStats.value.total === 0) return 0
  return Math.round((reviewStats.value.done / reviewStats.value.total) * 100)
})

const filtered = computed(() => {
  if (activeTab.value === '제출 완료') return myEvalPatents.value.filter((p) => p.evaluation?.replyDate)
  if (activeTab.value === '미제출') return myEvalPatents.value.filter((p) => !p.evaluation?.replyDate)
  return myEvalPatents.value
})
</script>

<template>
  <AppLayout title="검토 현황" subtitle="반도체사업부 · 2025년 1분기 재평가 현황">
    <!-- 상단 -->
    <AppCard class="mb-4">
      <div class="flex items-start gap-2">
        <div>
          <div class="text-sm font-semibold text-gray-800">2025년 1분기 재평가</div>
          <div class="text-xs text-gray-500 mt-0.5">재평가 대상 {{ reviewStats.total }}건 · 제출 완료 {{ reviewStats.done }}건 · 미제출 {{ reviewStats.pending }}건</div>
        </div>
      </div>
    </AppCard>

    <div class="mb-4">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div class="rounded-xl p-4" style="border:1px solid #E2E8F0; background:#F8FAFC;">
          <div class="text-xs font-semibold text-gray-500">재평가 대상</div>
          <div class="mt-1 text-2xl font-bold text-gray-700">전체 {{ reviewStats.total }}건</div>
        </div>
        <div class="rounded-xl p-4" style="border:1px solid rgba(255,122,0,0.25); background:#FFF7F0;">
          <div class="text-xs font-semibold" style="color:#FF7A00;">제출 완료</div>
          <div class="mt-1 text-2xl font-bold" style="color:#FF7A00;">{{ reviewStats.done }}건</div>
        </div>
        <div class="rounded-xl p-4" style="border:1px solid rgba(245,158,11,0.3); background:rgba(245,158,11,0.1);">
          <div class="text-xs font-semibold" style="color:#B45309;">미제출</div>
          <div class="mt-1 text-2xl font-bold" style="color:#F59E0B;">{{ reviewStats.pending }}건</div>
        </div>
      </div>

      <div class="mt-3 rounded-xl p-4" style="border:1px solid #E2E8F0; background:#FFFFFF;">
        <div class="flex items-center justify-between mb-2">
          <div class="text-sm font-semibold text-gray-700">이번 분기 재평가 진행률</div>
          <div class="text-xs text-gray-500">{{ reviewPct }}%</div>
        </div>
        <div class="text-xs text-gray-600 mb-2">2025년 1분기 재평가 {{ reviewStats.total }}건 중 {{ reviewStats.done }}건 완료</div>
        <div class="h-2.5 rounded-full bg-gray-200 overflow-hidden">
          <div class="h-full rounded-full" style="background:#FF7A00;" :style="`width:${reviewPct}%`" />
        </div>
      </div>
    </div>

    <!-- 탭 -->
    <div class="flex gap-6 border-b border-gray-200 mb-4">
      <button
        v-for="tab in ['전체', '제출 완료', '미제출']"
        :key="tab"
        @click="activeTab = tab"
        class="pb-3 text-sm cursor-pointer -mb-px"
        :class="activeTab === tab ? 'border-b-2 border-[#FF7A00] text-[#FF7A00] font-semibold' : 'text-gray-500 hover:text-gray-700'"
      >{{ tab }}</button>
    </div>

    <!-- 테이블 -->
    <div class="bg-white rounded-xl overflow-hidden" style="border:1px solid #E2E8F0;">
      <table class="w-full text-sm">
        <thead>
          <tr style="background:#F8FAFC; border-bottom:1px solid #E2E8F0;">
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500">출원번호</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500">특허명</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500">만료일</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500">상태</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500">제출일</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="p in filtered"
            :key="p.id"
            class="cursor-pointer"
            style="border-bottom:1px solid #F1F5F9;"
            @click="router.push(`/patents/${p.id}`)"
            @mouseenter="$event.currentTarget.style.background='#FFF7F0';"
            @mouseleave="$event.currentTarget.style.background='';"
          >
            <td class="px-4 py-3 text-xs font-mono text-gray-600">{{ p.number }}</td>
            <td class="px-4 py-3">
              <div class="font-medium text-gray-800">{{ p.title }}</div>
              <div v-if="p.aiTags?.length" class="flex flex-wrap gap-1 mt-1">
                <span v-for="tag in p.aiTags" :key="tag" style="background:#F1F5F9;color:#64748B;font-size:11px;border-radius:4px;padding:2px 6px;">{{ tag }}</span>
              </div>
            </td>
            <td class="px-4 py-3 text-xs text-gray-500">{{ p.expiryDate }}</td>
            <td class="px-4 py-3">
              <StatusBadge :status="p.evaluation?.replyDate ? '제출 완료' : '미제출'" />
            </td>
            <td class="px-4 py-3 text-xs text-gray-500">{{ p.evaluation?.replyDate || '-' }}</td>
          </tr>
          <tr v-if="filtered.length === 0">
            <td colspan="5" class="px-4 py-12 text-center text-sm text-gray-400">해당 항목이 없습니다.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </AppLayout>
</template>
