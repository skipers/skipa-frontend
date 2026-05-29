<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import AppCard from '@/components/ui/AppCard.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import AppModal from '@/components/ui/AppModal.vue'
import { PATENTS } from '@/data/patents.js'
import { useAuthStore } from '@/stores/auth.js'

const router = useRouter()
const auth = useAuthStore()

const activeTab = ref('전체')
const infoModal = ref(false)

const myEvalPatents = computed(() =>
  PATENTS.filter((p) => p.dept === auth.currentUser?.dept && p.evaluation?.quarter === '2025-Q1' && p.evaluation?.status !== '요청 전')
)

const filtered = computed(() => {
  if (activeTab.value === '완료') return myEvalPatents.value.filter((p) => p.evaluation?.replyDate)
  if (activeTab.value === '미완료') return myEvalPatents.value.filter((p) => !p.evaluation?.replyDate)
  return myEvalPatents.value
})
</script>

<template>
  <AppLayout title="검토 현황">
    <!-- 상단 -->
    <AppCard class="mb-4">
      <div class="flex items-center justify-between">
        <div>
          <div class="text-sm font-semibold text-gray-800">2025년 1분기 재평가</div>
          <div class="text-xs text-gray-500 mt-0.5">재평가 대상 {{ myEvalPatents.length }}건</div>
        </div>
        <button
          @click="infoModal = true"
          class="w-8 h-8 rounded-full text-sm font-bold cursor-pointer"
          style="background:#F8FAFC; border:1px solid #E2E8F0; color:#6b7280;"
        >?</button>
      </div>
    </AppCard>

    <!-- 탭 -->
    <div class="flex gap-2 mb-4">
      <button
        v-for="tab in ['전체', '완료', '미완료']"
        :key="tab"
        @click="activeTab = tab"
        class="px-4 py-2 text-sm rounded-lg cursor-pointer"
        :style="activeTab === tab ? 'background:#FF7A00; color:#fff; border:none;' : 'background:#fff; color:#6b7280; border:1px solid #E2E8F0;'"
      >{{ tab }}</button>
    </div>

    <!-- 테이블 -->
    <div class="bg-white rounded-xl overflow-hidden" style="border:1px solid #E2E8F0;">
      <table class="w-full text-sm">
        <thead>
          <tr style="background:#F8FAFC; border-bottom:1px solid #E2E8F0;">
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500">특허번호</th>
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
            <td class="px-4 py-3 text-gray-800 font-medium max-w-xs truncate">{{ p.title }}</td>
            <td class="px-4 py-3 text-xs text-gray-500">{{ p.expiryDate }}</td>
            <td class="px-4 py-3">
              <StatusBadge :status="p.evaluation?.replyDate ? '완료' : '미완료'" />
            </td>
            <td class="px-4 py-3 text-xs text-gray-500">{{ p.evaluation?.replyDate || '-' }}</td>
          </tr>
          <tr v-if="filtered.length === 0">
            <td colspan="5" class="px-4 py-12 text-center text-sm text-gray-400">해당 항목이 없습니다.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 재평가 안내 모달 -->
    <AppModal :show="infoModal" title="재평가 프로세스 안내" width="max-w-xl" @close="infoModal = false">
      <div class="space-y-4 text-sm text-gray-700">
        <div>
          <div class="font-semibold text-gray-800 mb-2">재평가 프로세스</div>
          <div class="space-y-2">
            <div class="flex items-start gap-2">
              <span class="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold" style="background:#FF7A00;">1</span>
              <span>Legal팀이 분기별 재평가 대상 특허를 선정하고 사업부에 배정합니다.</span>
            </div>
            <div class="flex items-start gap-2">
              <span class="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold" style="background:#FF7A00;">2</span>
              <span>사업부는 특허 상세 페이지에서 AI 평가 보고서를 확인합니다.</span>
            </div>
            <div class="flex items-start gap-2">
              <span class="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold" style="background:#FF7A00;">3</span>
              <span>유지 또는 포기 의견을 선택하고 의견을 작성하여 제출합니다.</span>
            </div>
            <div class="flex items-start gap-2">
              <span class="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold" style="background:#FF7A00;">4</span>
              <span>Legal팀이 회신을 확인하고 최종 결정을 내립니다.</span>
            </div>
          </div>
        </div>
        <div class="p-3 rounded-lg" style="background:#FFF7F0; border:1px solid rgba(255,122,0,0.2);">
          <div class="font-semibold mb-1" style="color:#FF7A00;">평가 항목</div>
          <div class="text-xs text-gray-600 space-y-1">
            <div>• 기술성: 기술적 독창성 및 완성도 (0~100)</div>
            <div>• 권리성: 청구항의 범위 및 유효성 (0~100)</div>
            <div>• 사업성: 상업적 활용 가능성 (0~100)</div>
          </div>
        </div>
      </div>
    </AppModal>
  </AppLayout>
</template>
