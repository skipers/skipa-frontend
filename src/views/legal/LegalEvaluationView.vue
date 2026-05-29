<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import AppCard from '@/components/ui/AppCard.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import AppModal from '@/components/ui/AppModal.vue'
import { PATENTS } from '@/data/patents.js'

const router = useRouter()
const activeTab = ref('전체')
const tabs = ['전체', '요청 전', '요청 완료', '지연', '회신 완료']

const evalPatents = computed(() => PATENTS.filter((p) => p.evaluation?.quarter === '2025-Q1'))

const filtered = computed(() => {
  if (activeTab.value === '전체') return evalPatents.value
  return evalPatents.value.filter((p) => p.evaluation.status === activeTab.value)
})

const progress = computed(() => {
  const total = evalPatents.value.length
  const done = evalPatents.value.filter((p) => p.evaluation.status === '회신 완료').length
  return { total, done, pct: total > 0 ? Math.round((done / total) * 100) : 0 }
})

// 부서 배정 모달
const assignModal = ref(false)
const assignTarget = ref(null)
const selectedDept = ref('')
const depts = ['반도체사업부', '통신사업부', '에너지사업부', '제조사업부']

function openAssign(patent) {
  assignTarget.value = patent
  selectedDept.value = patent.dept
  assignModal.value = true
}

function confirmAssign() {
  if (assignTarget.value) {
    assignTarget.value.evaluation.status = '요청 완료'
    assignTarget.value.evaluation.requestDate = '2025-05-29'
    assignTarget.value.evaluation.dueDate = '2025-06-30'
  }
  assignModal.value = false
}
</script>

<template>
  <AppLayout title="재평가 관리">
    <!-- 상단 정보 -->
    <AppCard class="mb-4">
      <div class="flex items-center justify-between">
        <div>
          <div class="text-sm font-semibold text-gray-800">2025년 1분기 재평가</div>
          <div class="text-xs text-gray-500 mt-0.5">제출 마감일: 2025년 3월 31일</div>
        </div>
        <div class="text-right">
          <div class="text-xs text-gray-500 mb-1">보고서 생성 현황 {{ progress.done }} / {{ progress.total }}건 완료</div>
          <div class="w-48 h-2 rounded-full bg-gray-200 overflow-hidden">
            <div class="h-2 rounded-full transition-all" style="background:#FF7A00;" :style="`width:${progress.pct}%`" />
          </div>
          <div class="text-xs mt-1" style="color:#FF7A00;">{{ progress.pct }}%</div>
        </div>
      </div>
    </AppCard>

    <!-- 탭 필터 -->
    <div class="flex gap-2 mb-4">
      <button
        v-for="tab in tabs"
        :key="tab"
        @click="activeTab = tab"
        class="px-4 py-2 text-sm rounded-lg cursor-pointer transition-all"
        :style="activeTab === tab
          ? 'background:#FF7A00; color:#fff; border:none;'
          : 'background:#fff; color:#6b7280; border:1px solid #E2E8F0;'"
      >{{ tab }}</button>
    </div>

    <!-- 테이블 -->
    <div class="bg-white rounded-xl overflow-hidden" style="border:1px solid #E2E8F0;">
      <table class="w-full text-sm">
        <thead>
          <tr style="background:#F8FAFC; border-bottom:1px solid #E2E8F0;">
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500">특허번호</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500">특허명</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500">사업부</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500">상태</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500">요청일</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500">회신 기한</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500">회신일</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500">액션</th>
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
            <td class="px-4 py-3 text-xs text-gray-600">{{ p.dept }}</td>
            <td class="px-4 py-3"><StatusBadge :status="p.evaluation.status" /></td>
            <td class="px-4 py-3 text-xs text-gray-500">{{ p.evaluation.requestDate || '-' }}</td>
            <td class="px-4 py-3 text-xs text-gray-500">{{ p.evaluation.dueDate || '-' }}</td>
            <td class="px-4 py-3 text-xs text-gray-500">{{ p.evaluation.replyDate || '-' }}</td>
            <td class="px-4 py-3" @click.stop>
              <button
                v-if="p.evaluation.status === '요청 전'"
                @click="openAssign(p)"
                class="px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer"
                style="background:#FF7A00; color:#fff; border:none;"
              >부서 배정</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 부서 배정 모달 -->
    <AppModal :show="assignModal" title="부서 배정" @close="assignModal = false">
      <div v-if="assignTarget" class="space-y-4">
        <div class="p-3 rounded-lg" style="background:#F8FAFC; border:1px solid #E2E8F0;">
          <div class="text-sm font-semibold text-gray-800">{{ assignTarget.title }}</div>
          <div class="text-xs text-gray-500 mt-0.5">{{ assignTarget.number }}</div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">사업부 선택</label>
          <select v-model="selectedDept" class="w-full px-3 py-2.5 text-sm rounded-lg outline-none" style="border:1px solid #E2E8F0;">
            <option v-for="d in depts" :key="d">{{ d }}</option>
          </select>
        </div>
      </div>
      <template #footer>
        <button @click="assignModal = false" class="px-4 py-2 text-sm rounded-lg cursor-pointer" style="border:1px solid #E2E8F0; background:#fff; color:#374151;">취소</button>
        <button @click="confirmAssign" class="px-4 py-2 text-sm font-semibold text-white rounded-lg cursor-pointer" style="background:#FF7A00; border:none;">요청 확정</button>
      </template>
    </AppModal>
  </AppLayout>
</template>
