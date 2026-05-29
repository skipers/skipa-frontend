<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import { PATENTS } from '@/data/patents.js'
import { useAuthStore } from '@/stores/auth.js'

const router = useRouter()
const auth = useAuthStore()

const activeTab = ref('유지 중인 특허')
const tabs = ['유지 중인 특허', '만료 및 포기한 특허', '검토 제출 이력', '이번 분기 재평가 대상']

const myPatents = computed(() => PATENTS.filter((p) => p.dept === auth.currentUser?.dept))
const held = computed(() => myPatents.value.filter((p) => p.status === '등록' || p.status === '만료 예정'))
const abandoned = computed(() => myPatents.value.filter((p) => p.status === '포기+만료'))
const history = computed(() => myPatents.value.filter((p) => p.evaluation?.replyDate).sort((a, b) => b.evaluation.replyDate.localeCompare(a.evaluation.replyDate)))
const thisQuarter = computed(() => myPatents.value.filter((p) => p.evaluation?.quarter === '2025-Q1' && p.evaluation?.status !== '요청 전'))
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

    <!-- 탭 -->
    <div class="flex gap-2 mb-4 flex-wrap">
      <button
        v-for="tab in tabs"
        :key="tab"
        @click="activeTab = tab"
        class="px-4 py-2 text-sm rounded-lg cursor-pointer"
        :style="activeTab === tab ? 'background:#FF7A00; color:#fff; border:none;' : 'background:#fff; color:#6b7280; border:1px solid #E2E8F0;'"
      >{{ tab }}</button>
    </div>

    <!-- 유지 중인 특허 -->
    <div v-if="activeTab === '유지 중인 특허'" class="bg-white rounded-xl overflow-hidden" style="border:1px solid #E2E8F0;">
      <table class="w-full text-sm">
        <thead><tr style="background:#F8FAFC; border-bottom:1px solid #E2E8F0;">
          <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500">특허번호</th>
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
            <td class="px-4 py-3"><StatusBadge :status="p.status" /></td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 만료 및 포기한 특허 -->
    <div v-else-if="activeTab === '만료 및 포기한 특허'" class="bg-white rounded-xl overflow-hidden" style="border:1px solid #E2E8F0;">
      <table class="w-full text-sm">
        <thead><tr style="background:#F8FAFC; border-bottom:1px solid #E2E8F0;">
          <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500">특허번호</th>
          <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500">특허명</th>
          <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500">만료일</th>
          <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500">국가</th>
          <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500">상태</th>
        </tr></thead>
        <tbody>
          <tr v-for="p in abandoned" :key="p.id" style="border-bottom:1px solid #F1F5F9;">
            <td class="px-4 py-3 text-xs font-mono text-gray-600">{{ p.number }}</td>
            <td class="px-4 py-3 text-gray-600 max-w-xs truncate">{{ p.title }}</td>
            <td class="px-4 py-3 text-xs text-gray-500">{{ p.expiryDate }}</td>
            <td class="px-4 py-3 text-xs text-gray-500">{{ p.country }}</td>
            <td class="px-4 py-3"><StatusBadge :status="p.status" /></td>
          </tr>
          <tr v-if="abandoned.length === 0"><td colspan="5" class="px-4 py-12 text-center text-sm text-gray-400">해당 특허가 없습니다.</td></tr>
        </tbody>
      </table>
    </div>

    <!-- 검토 제출 이력 -->
    <div v-else-if="activeTab === '검토 제출 이력'" class="bg-white rounded-xl overflow-hidden" style="border:1px solid #E2E8F0;">
      <table class="w-full text-sm">
        <thead><tr style="background:#F8FAFC; border-bottom:1px solid #E2E8F0;">
          <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500">제출일</th>
          <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500">분기</th>
          <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500">의견</th>
          <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500">특허번호</th>
          <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500">상세</th>
        </tr></thead>
        <tbody>
          <tr v-for="p in history" :key="p.id" style="border-bottom:1px solid #F1F5F9;">
            <td class="px-4 py-3 text-xs text-gray-600">{{ p.evaluation.replyDate }}</td>
            <td class="px-4 py-3 text-xs text-gray-600">{{ p.evaluation.quarter }}</td>
            <td class="px-4 py-3"><StatusBadge :status="p.evaluation.opinion" /></td>
            <td class="px-4 py-3 text-xs font-mono text-gray-600">{{ p.number }}</td>
            <td class="px-4 py-3">
              <button @click="router.push(`/patents/${p.id}`)" class="text-xs px-2 py-1 rounded cursor-pointer" style="background:#FFF7F0; color:#FF7A00; border:1px solid rgba(255,122,0,0.3);">상세보기</button>
            </td>
          </tr>
          <tr v-if="history.length === 0"><td colspan="5" class="px-4 py-12 text-center text-sm text-gray-400">제출 이력이 없습니다.</td></tr>
        </tbody>
      </table>
    </div>

    <!-- 이번 분기 재평가 대상 -->
    <div v-else-if="activeTab === '이번 분기 재평가 대상'" class="bg-white rounded-xl overflow-hidden" style="border:1px solid #E2E8F0;">
      <table class="w-full text-sm">
        <thead><tr style="background:#F8FAFC; border-bottom:1px solid #E2E8F0;">
          <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500">특허번호</th>
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
