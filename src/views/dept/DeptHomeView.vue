<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { CalendarDays } from 'lucide-vue-next'
import AppLayout from '@/components/layout/AppLayout.vue'
import AppCard from '@/components/ui/AppCard.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import { PATENTS } from '@/data/patents.js'
import { useAuthStore } from '@/stores/auth.js'

const router = useRouter()
const auth = useAuthStore()
const deptName = computed(() => auth.currentUser?.dept || '사업부')
const deptDisplayName = computed(() => deptName.value.replace('사업부', ' 사업부').replace(/\s+/g, ' ').trim())
const myPatents = computed(() => PATENTS.filter((p) => p.dept === auth.currentUser?.dept))

const quarterTargets = computed(() =>
  myPatents.value.filter((p) => p.evaluation?.quarter === '2025-Q1' && p.evaluation?.status !== '요청 전')
)
const submitted = computed(() => quarterTargets.value.filter((p) => p.evaluation?.replyDate).length)
const pending = computed(() => quarterTargets.value.length - submitted.value)
const submissionPct = computed(() => (quarterTargets.value.length > 0 ? Math.round((submitted.value / quarterTargets.value.length) * 100) : 0))

function aiScore(patent) {
  if (!patent.aiScore) return 0
  return Math.round((patent.aiScore.tech + patent.aiScore.rights + patent.aiScore.business) / 3)
}

function aiOpinion(patent) {
  const score = aiScore(patent)
  if (score >= 80) return '유지 권고'
  if (score >= 65) return '재검토 필요'
  return '포기 권고'
}

const aiMaintain = computed(() => quarterTargets.value.filter((p) => aiOpinion(p) === '유지 권고').length)
const aiRecheck = computed(() => quarterTargets.value.filter((p) => aiOpinion(p) === '재검토 필요').length)
const aiDrop = computed(() => quarterTargets.value.filter((p) => aiOpinion(p) === '포기 권고').length)
const aiSegmentTotal = computed(() => quarterTargets.value.length || 1)

const reviewPreview = computed(() =>
  [...quarterTargets.value]
    .sort((a, b) => (a.evaluation?.dueDate || '').localeCompare(b.evaluation?.dueDate || ''))
    .slice(0, 5)
)

const reviewStart = new Date('2026-03-01')
const deadline = new Date('2026-03-31')
const now = new Date()
const dday = computed(() => {
  if (now < reviewStart || now > deadline) return null
  return Math.ceil((deadline - now) / (1000 * 60 * 60 * 24))
})

const recentOpinions = computed(() =>
  myPatents.value
    .filter((p) => p.evaluation?.replyDate)
    .sort((a, b) => b.evaluation.replyDate.localeCompare(a.evaluation.replyDate))
    .slice(0, 5)
)

function scoreColor(score) {
  if (score >= 80) return '#10B981'
  if (score >= 65) return '#FF7A00'
  return '#EA002C'
}

function opinionBadgeStyle(opinion) {
  if (opinion === '유지 권고') return 'background:rgba(16,185,129,0.1); color:#059669; border:1px solid rgba(16,185,129,0.25);'
  if (opinion === '재검토 필요') return 'background:rgba(255,122,0,0.1); color:#D97706; border:1px solid rgba(255,122,0,0.25);'
  return 'background:rgba(234,0,44,0.1); color:#EA002C; border:1px solid rgba(234,0,44,0.25);'
}

function segmentWidth(count) {
  return `${(count / aiSegmentTotal.value) * 100}%`
}
</script>

<template>
  <AppLayout :title="deptDisplayName">
    <div class="mb-4 rounded-lg px-4 py-3" style="border:1px solid #E2E8F0; background:#F8FAFC;">
      <div class="flex items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style="background:#FFFFFF; border:1px solid #E2E8F0; color:#FF7A00;">
            <CalendarDays class="h-5 w-5" />
          </div>
          <div>
            <div v-if="dday !== null" class="text-sm font-semibold text-gray-700">2026-03-01 ~ 2026-03-31 재평가 진행 중</div>
            <div v-else class="text-sm font-semibold text-gray-700">현재 재평가 기간이 아닙니다.</div>
            <div v-if="dday === null" class="text-xs text-gray-500 mt-1">다음 재평가 기간: 2026-03-01 ~ 2026-03-31</div>
          </div>
        </div>

        <div class="flex items-center gap-4">
          <div v-if="dday !== null" class="text-3xl font-bold" style="color:#FF7A00;">D-{{ dday }}</div>
          <button @click="router.push('/dept/review')" class="text-sm font-semibold cursor-pointer" style="background:transparent; border:none; color:#FF7A00;">재평가 일정 보기 ></button>
        </div>
      </div>
    </div>

    <AppCard class="mb-4" padding="p-4">
      <div class="mb-3 flex items-center justify-between gap-3">
        <div class="text-base font-semibold text-gray-800">이번 분기 AI 검토 결과</div>
        <div class="text-sm text-gray-500">전체 {{ quarterTargets.length }}건</div>
      </div>
      <div class="flex h-3 w-full overflow-hidden rounded-full bg-gray-200">
        <div v-if="aiMaintain > 0" class="h-full" :style="{ width: segmentWidth(aiMaintain), background: '#10B981' }"></div>
        <div v-if="aiRecheck > 0" class="h-full" :style="{ width: segmentWidth(aiRecheck), background: '#FF7A00' }"></div>
        <div v-if="aiDrop > 0" class="h-full" :style="{ width: segmentWidth(aiDrop), background: '#EA002C' }"></div>
      </div>
      <div class="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-600">
        <div class="flex items-center gap-2">
          <span class="h-2.5 w-2.5 rounded-full" style="background:#10B981;"></span>
          <span>유지 권고 {{ aiMaintain }}건</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="h-2.5 w-2.5 rounded-full" style="background:#FF7A00;"></span>
          <span>재검토 필요 {{ aiRecheck }}건</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="h-2.5 w-2.5 rounded-full" style="background:#EA002C;"></span>
          <span>포기 권고 {{ aiDrop }}건</span>
        </div>
      </div>
    </AppCard>

    <div class="mb-4">
      <AppCard padding="p-4">
        <div class="flex items-center justify-between mb-3">
          <div class="text-base font-semibold text-gray-800">이번 분기 검토 대상 특허</div>
          <button @click="router.push('/dept/review')" class="text-sm font-semibold cursor-pointer" style="background:transparent; border:none; color:#FF7A00;">전체 보기 ></button>
        </div>
        <div class="overflow-hidden rounded-lg" style="border:1px solid #E2E8F0;">
          <table class="w-full text-sm">
            <thead>
              <tr style="background:#F8FAFC; border-bottom:1px solid #E2E8F0;">
                <th class="px-3 py-2.5 text-left text-xs font-semibold text-gray-500">특허명</th>
                <th class="px-3 py-2.5 text-left text-xs font-semibold text-gray-500">출원번호</th>
                <th class="px-3 py-2.5 text-left text-xs font-semibold text-gray-500">AI 의견</th>
                <th class="px-3 py-2.5 text-left text-xs font-semibold text-gray-500">AI 종합 점수</th>
                <th class="px-3 py-2.5 text-left text-xs font-semibold text-gray-500">마감일</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="p in reviewPreview"
                :key="p.id"
                class="cursor-pointer"
                style="border-bottom:1px solid #F1F5F9;"
                @click="router.push(`/patents/${p.id}`)"
                @mouseenter="$event.currentTarget.style.background='#FFF7F0';"
                @mouseleave="$event.currentTarget.style.background='';"
              >
                <td class="px-3 py-2.5">
                  <div class="text-sm text-gray-800">{{ p.title }}</div>
                  <div v-if="p.aiTags?.length" class="flex flex-wrap gap-1 mt-1">
                    <span v-for="tag in p.aiTags" :key="tag" style="background:#F1F5F9;color:#64748B;font-size:11px;border-radius:4px;padding:2px 6px;">{{ tag }}</span>
                  </div>
                </td>
                <td class="px-3 py-2.5 text-xs font-mono text-gray-600">{{ p.number }}</td>
                <td class="px-3 py-2.5">
                  <span class="inline-flex px-2 py-1 rounded text-xs font-semibold" :style="opinionBadgeStyle(aiOpinion(p))">{{ aiOpinion(p) }}</span>
                </td>
                <td class="px-3 py-2.5">
                  <div class="text-xs font-semibold" :style="`color:${scoreColor(aiScore(p))};`">{{ aiScore(p) }}점</div>
                  <div class="mt-1 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                    <div class="h-full rounded-full" :style="`width:${aiScore(p)}%; background:${scoreColor(aiScore(p))};`" />
                  </div>
                </td>
                <td class="px-3 py-2.5 text-xs text-gray-500">{{ p.evaluation?.dueDate || '-' }}</td>
              </tr>
              <tr v-if="reviewPreview.length === 0">
                <td colspan="5" class="px-3 py-8 text-center text-sm text-gray-400">표시할 검토 대상이 없습니다.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </AppCard>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
      <AppCard padding="p-4">
        <div class="mb-4 text-base font-semibold text-gray-800">제출 현황</div>
        <div class="mb-4 grid grid-cols-2 gap-3">
          <div>
            <div class="text-xs font-medium text-gray-500">완료</div>
            <div class="mt-1 text-3xl font-bold" style="color:#FF7A00;">{{ submitted }}건</div>
          </div>
          <div>
            <div class="text-xs font-medium text-gray-500">미제출</div>
            <div class="mt-1 text-3xl font-bold text-gray-500">{{ pending }}건</div>
          </div>
        </div>
        <div class="flex h-3 w-full overflow-hidden rounded-full bg-gray-200">
          <div class="h-full rounded-full" :style="{ width: `${submissionPct}%`, background: '#FF7A00' }"></div>
        </div>
        <div class="mt-3 text-sm text-gray-500">{{ quarterTargets.length }}건 중 {{ submitted }}건 완료 ({{ submissionPct }}%)</div>
      </AppCard>

      <AppCard padding="p-4">
        <div class="flex items-center justify-between mb-2">
          <div class="text-base font-semibold text-gray-800">최근 의견 제출 내역</div>
          <button @click="router.push('/dept/review')" class="text-sm font-semibold cursor-pointer" style="background:transparent; border:none; color:#FF7A00;">전체 보기 ></button>
        </div>
        <div class="overflow-hidden rounded-lg" style="border:1px solid #E2E8F0;">
          <table class="w-full text-sm">
            <thead>
              <tr style="background:#F8FAFC; border-bottom:1px solid #E2E8F0;">
                <th class="px-3 py-2 text-left text-xs font-semibold text-gray-500">특허명</th>
                <th class="px-3 py-2 text-left text-xs font-semibold text-gray-500">결정</th>
                <th class="px-3 py-2 text-left text-xs font-semibold text-gray-500">제출일</th>
                <th class="px-3 py-2 text-left text-xs font-semibold text-gray-500">AI 점수</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in recentOpinions" :key="p.id" style="border-bottom:1px solid #F1F5F9;">
                <td class="px-3 py-2 text-sm text-gray-800 truncate max-w-[220px]">{{ p.title }}</td>
                <td class="px-3 py-2"><StatusBadge :status="p.evaluation?.opinion || '-'" /></td>
                <td class="px-3 py-2 text-xs text-gray-500">{{ p.evaluation?.replyDate || '-' }}</td>
                <td class="px-3 py-2 text-xs font-semibold" :style="`color:${scoreColor(aiScore(p))};`">{{ aiScore(p) }}점</td>
              </tr>
              <tr v-if="recentOpinions.length === 0">
                <td colspan="4" class="px-3 py-10 text-center text-sm text-gray-400">최근 제출 내역이 없습니다.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </AppCard>
    </div>

  </AppLayout>
</template>
