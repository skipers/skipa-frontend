<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Doughnut } from 'vue-chartjs'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import AppLayout from '@/components/layout/AppLayout.vue'
import AppCard from '@/components/ui/AppCard.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import { PATENTS } from '@/data/patents.js'
import { useAuthStore } from '@/stores/auth.js'

ChartJS.register(ArcElement, Tooltip, Legend)

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

const reviewPreview = computed(() =>
  [...quarterTargets.value]
    .sort((a, b) => (a.evaluation?.dueDate || '').localeCompare(b.evaluation?.dueDate || ''))
    .slice(0, 5)
)

const highPotentialCount = computed(() => quarterTargets.value.filter((p) => (p.projects || []).some((project) => project.relevance >= 90)).length)
const riskyCount = computed(() => quarterTargets.value.filter((p) => (p.similarPatents || []).some((sp) => sp.similarity >= 80)).length)
const lowEfficiencyCount = computed(() => quarterTargets.value.filter((p) => aiScore(p) < 70 && p.status === '등록').length)

const submissionDonutData = computed(() => ({
  labels: ['제출 완료', '미제출'],
  datasets: [{ data: [submitted.value, pending.value], backgroundColor: ['#10B981', '#94A3B8'], borderWidth: 2, borderColor: '#fff' }],
}))
const donutOpts = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '70%',
  plugins: {
    legend: { display: false },
    tooltip: { enabled: false },
  },
}

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

function goInsight(type) {
  router.push({ path: '/dept/patents', query: { insight: type } })
}
</script>

<template>
  <AppLayout :title="deptDisplayName">
    <div class="mb-4 rounded-xl px-4 py-3" style="border:1px solid #E2E8F0; background:#FFFFFF;">
      <div class="flex items-center justify-between gap-4">
        <div>
          <div v-if="dday !== null" class="text-sm font-semibold text-gray-700">2026-03-01 ~ 2026-03-31 재평가 진행 중</div>
          <div v-else class="text-sm font-semibold text-gray-700">현재 재평가 기간이 아닙니다.</div>
          <div v-if="dday === null" class="text-xs text-gray-500 mt-1">다음 재평가 기간: 2026-03-01 ~ 2026-03-31</div>
        </div>

        <div class="flex items-center gap-4">
          <div v-if="dday !== null" class="text-3xl font-bold" style="color:#FF7A00;">D-{{ dday }}</div>
          <button @click="router.push('/dept/review')" class="text-sm font-semibold cursor-pointer" style="background:transparent; border:none; color:#FF7A00;">일정 재평가 자세히 보기 ></button>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-4 gap-3 mb-4">
      <AppCard padding="p-4">
        <div class="text-xs text-gray-500">📌 이번 분기 검토 대상</div>
        <div class="text-3xl font-bold text-gray-800 mt-1">{{ quarterTargets.length }}건</div>
        <button @click="router.push('/dept/review')" class="mt-2 text-xs font-semibold cursor-pointer" style="background:transparent; border:none; color:#4B5563;">내 검토 목록 보기 ></button>
      </AppCard>
      <AppCard padding="p-4" style="background:rgba(16,185,129,0.06); border:1px solid rgba(16,185,129,0.2);">
        <div class="text-xs" style="color:#059669;">✅ AI 유지 권고</div>
        <div class="text-3xl font-bold mt-1" style="color:#059669;">{{ aiMaintain }}건</div>
        <div class="text-xs text-gray-500 mt-1">사업 활용 가능성이 높은 건</div>
      </AppCard>
      <AppCard padding="p-4" style="background:rgba(255,122,0,0.06); border:1px solid rgba(255,122,0,0.2);">
        <div class="text-xs" style="color:#D97706;">⚠ 재검토 필요</div>
        <div class="text-3xl font-bold mt-1" style="color:#D97706;">{{ aiRecheck }}건</div>
        <div class="text-xs text-gray-500 mt-1">추가 검토가 필요한 건</div>
      </AppCard>
      <AppCard padding="p-4" style="background:rgba(234,0,44,0.06); border:1px solid rgba(234,0,44,0.2);">
        <div class="text-xs" style="color:#EA002C;">⛔ AI 포기 권고</div>
        <div class="text-3xl font-bold mt-1" style="color:#EA002C;">{{ aiDrop }}건</div>
        <div class="text-xs text-gray-500 mt-1">비용 대비 효율이 낮은 건</div>
      </AppCard>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-4">
      <AppCard class="xl:col-span-2" padding="p-4">
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
                <td class="px-3 py-2.5 text-sm text-gray-800 max-w-[220px] truncate">{{ p.title }}</td>
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

      <AppCard padding="p-4">
        <div class="text-base font-semibold text-gray-800 mb-3">AI 인사이트</div>
        <div class="space-y-2">
          <button @click="goInsight('high-potential')" class="w-full text-left p-3 rounded-lg cursor-pointer" style="border:1px solid rgba(16,185,129,0.2); background:rgba(16,185,129,0.06);">
            <div class="text-sm font-semibold text-gray-800">활용 가능성이 높은 특허</div>
            <div class="text-xs text-gray-500 mt-0.5">내부 프로젝트 연관 특허 {{ highPotentialCount }}건</div>
          </button>
          <button @click="goInsight('risky')" class="w-full text-left p-3 rounded-lg cursor-pointer" style="border:1px solid rgba(255,122,0,0.2); background:rgba(255,122,0,0.06);">
            <div class="text-sm font-semibold text-gray-800">주의가 필요한 특허</div>
            <div class="text-xs text-gray-500 mt-0.5">유사 특허 증가 분야 {{ riskyCount }}건</div>
          </button>
          <button @click="goInsight('low-efficiency')" class="w-full text-left p-3 rounded-lg cursor-pointer" style="border:1px solid rgba(234,0,44,0.2); background:rgba(234,0,44,0.06);">
            <div class="text-sm font-semibold text-gray-800">비용 대비 효율 검토 필요</div>
            <div class="text-xs text-gray-500 mt-0.5">유지 비용 대비 활용도 낮은 특허 {{ lowEfficiencyCount }}건</div>
          </button>
        </div>
      </AppCard>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
      <AppCard padding="p-4">
        <div class="flex items-center justify-between mb-2">
          <div class="text-base font-semibold text-gray-800">의견 제출 현황</div>
          <button @click="router.push('/dept/review')" class="text-sm font-semibold cursor-pointer" style="background:transparent; border:none; color:#FF7A00;">의견 제출 내역 보기 ></button>
        </div>
        <div class="flex items-center justify-center" style="height:220px;">
          <div class="relative" style="width:220px; height:220px;">
            <Doughnut :data="submissionDonutData" :options="donutOpts" />
            <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div class="text-xs text-gray-500">진행률</div>
              <div class="text-2xl font-bold" style="color:#FF7A00;">{{ submissionPct }}%</div>
              <div class="text-[11px] text-gray-500 mt-1">{{ submitted }} / {{ quarterTargets.length }} 완료</div>
            </div>
          </div>
        </div>
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
