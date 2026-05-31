<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Bar } from 'vue-chartjs'
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js'
import AppLayout from '@/components/layout/AppLayout.vue'
import AppCard from '@/components/ui/AppCard.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import { PATENTS, ANNUAL_FEE } from '@/data/patents.js'
import { useAuthStore } from '@/stores/auth.js'

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend)

const router = useRouter()
const auth = useAuthStore()

const legalName = computed(() => auth.currentUser?.name || '김법무')
const q1Patents = computed(() => PATENTS.filter((p) => p.evaluation?.quarter === '2025-Q1'))

const evalStats = computed(() => ({
  beforeRequest: q1Patents.value.filter((p) => p.evaluation.status === '요청 전').length,
  requested: q1Patents.value.filter((p) => p.evaluation.status === '요청 완료').length,
  delayed: q1Patents.value.filter((p) => p.evaluation.status === '지연').length,
  replied: q1Patents.value.filter((p) => p.evaluation.status === '회신 완료').length,
}))

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

function aiOpinionStyle(opinion) {
  if (opinion === '유지 권고') return 'background:rgba(16,185,129,0.1); color:#059669; border:1px solid rgba(16,185,129,0.2);'
  if (opinion === '재검토 필요') return 'background:rgba(255,122,0,0.1); color:#D97706; border:1px solid rgba(255,122,0,0.2);'
  return 'background:rgba(234,0,44,0.1); color:#EA002C; border:1px solid rgba(234,0,44,0.2);'
}

function goEvaluation(tab = '전체') {
  router.push({ path: '/legal/evaluation', query: { tab } })
}

const reviewPreview = computed(() =>
  [...q1Patents.value]
    .sort((a, b) => (a.evaluation?.dueDate || '').localeCompare(b.evaluation?.dueDate || ''))
    .slice(0, 5)
)

const lowPotentialCount = computed(() => q1Patents.value.filter((p) => aiOpinion(p) === '포기 권고').length)
const expiringSoonCount = computed(() => {
  const now = new Date('2026-01-01')
  return PATENTS.filter((p) => {
    if (p.status !== '만료 예정') return false
    const diff = Math.floor((new Date(p.expiryDate) - now) / (1000 * 60 * 60 * 24))
    return diff >= 0 && diff <= 365
  }).length
})
const overdueCount = computed(() => q1Patents.value.filter((p) => p.evaluation?.status === '지연').length)

const statusCounts = computed(() => ({
  total: PATENTS.length,
  registered: PATENTS.filter((p) => p.status === '등록').length,
  expiring: PATENTS.filter((p) => p.status === '만료 예정').length,
  abandoned: PATENTS.filter((p) => p.status === '포기/만료').length,
}))

const countryData = computed(() => {
  const counts = {}
  PATENTS.forEach((p) => { counts[p.country] = (counts[p.country] || 0) + 1 })
  const labels = Object.keys(counts).sort((a, b) => counts[b] - counts[a])
  return {
    labels,
    datasets: [{ data: labels.map((l) => counts[l]), backgroundColor: '#4B6BFB', borderRadius: 4 }],
  }
})
const hbarOptions = { indexAxis: 'y', responsive: true, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true, ticks: { stepSize: 1 } } } }

const quarterlyFeeEstimate = computed(() => {
  if (!ANNUAL_FEE.length) return 0
  const latestAnnual = ANNUAL_FEE[ANNUAL_FEE.length - 1].amount
  return Math.round(latestAnnual / 4)
})

const formatKrw = (amount) => `${amount.toLocaleString('ko-KR')}원`

const recentReplies = computed(() =>
  PATENTS
    .filter((p) => p.evaluation?.replyDate)
    .sort((a, b) => b.evaluation.replyDate.localeCompare(a.evaluation.replyDate))
    .slice(0, 5)
)
</script>

<template>
  <AppLayout title="Legal 홈">
    <div class="mb-4 rounded-xl p-5" style="border:1px solid #E2E8F0; background:#FFFFFF;">
      <div class="flex items-start justify-between gap-4">
        <div>
          <div class="text-sm text-gray-500">안녕하세요, {{ legalName }}님 👋</div>
          <h2 class="text-2xl font-bold text-gray-800 mt-1">이번 분기 재평가 현황을 확인하세요</h2>
        </div>
        <div class="flex items-center gap-3">
          <button class="w-9 h-9 rounded-full flex items-center justify-center" style="border:1px solid #E2E8F0; background:#fff;">
            <span class="text-lg">🔔</span>
          </button>
          <div class="rounded-xl px-3 py-2" style="border:1px solid #E2E8F0; background:#F8FAFC;">
            <div class="text-xs text-gray-500">Legal팀</div>
            <div class="text-sm font-semibold text-gray-700">{{ legalName }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-4 gap-3 mb-4">
      <AppCard padding="p-4" class="cursor-pointer" @click="goEvaluation('요청 전')">
        <div class="text-xs text-gray-500">🗂 요청 전</div>
        <div class="text-3xl font-bold mt-1" style="color:#94A3B8;">{{ evalStats.beforeRequest }}건</div>
        <div class="text-xs text-gray-500 mt-1">부서 배정 및 요청 발송 필요</div>
      </AppCard>
      <AppCard padding="p-4" class="cursor-pointer" @click="goEvaluation('요청 완료')">
        <div class="text-xs text-gray-500">📨 요청 완료</div>
        <div class="text-3xl font-bold mt-1" style="color:#3B82F6;">{{ evalStats.requested }}건</div>
        <div class="text-xs text-gray-500 mt-1">사업부 검토 진행 중</div>
      </AppCard>
      <AppCard padding="p-4" class="cursor-pointer" @click="goEvaluation('지연')" style="border:1px solid rgba(234,0,44,0.25); background:rgba(234,0,44,0.04);">
        <div class="text-xs text-gray-500">⏰ 지연</div>
        <div class="text-3xl font-bold mt-1" style="color:#EA002C;">{{ evalStats.delayed }}건</div>
        <div class="text-xs text-gray-500 mt-1">기한 초과 건</div>
        <div class="mt-2 text-xs font-semibold" style="color:#EA002C;">즉시 처리 필요</div>
      </AppCard>
      <AppCard padding="p-4" class="cursor-pointer" @click="goEvaluation('회신 완료')">
        <div class="text-xs text-gray-500">✅ 회신 완료</div>
        <div class="text-3xl font-bold mt-1" style="color:#10B981;">{{ evalStats.replied }}건</div>
        <div class="text-xs text-gray-500 mt-1">Legal 검토 대기</div>
      </AppCard>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-4">
      <AppCard class="xl:col-span-2" padding="p-4">
        <div class="flex items-center justify-between mb-3">
          <div class="text-base font-semibold text-gray-800">이번 분기 검토 대상 특허</div>
          <button @click="goEvaluation('전체')" class="text-sm font-semibold cursor-pointer" style="background:transparent; border:none; color:#FF7A00;">전체 보기 ></button>
        </div>
        <div class="overflow-hidden rounded-lg" style="border:1px solid #E2E8F0;">
          <table class="w-full text-sm">
            <thead>
              <tr style="background:#F8FAFC; border-bottom:1px solid #E2E8F0;">
                <th class="px-3 py-2.5 text-left text-xs font-semibold text-gray-500">특허명</th>
                <th class="px-3 py-2.5 text-left text-xs font-semibold text-gray-500">출원번호</th>
                <th class="px-3 py-2.5 text-left text-xs font-semibold text-gray-500">사업부</th>
                <th class="px-3 py-2.5 text-left text-xs font-semibold text-gray-500">AI 의견</th>
                <th class="px-3 py-2.5 text-left text-xs font-semibold text-gray-500">상태</th>
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
                <td class="px-3 py-2.5 text-xs text-gray-600">{{ p.dept }}</td>
                <td class="px-3 py-2.5">
                  <span class="inline-flex px-2 py-1 rounded text-xs font-semibold" :style="aiOpinionStyle(aiOpinion(p))">{{ aiOpinion(p) }}</span>
                </td>
                <td class="px-3 py-2.5"><StatusBadge :status="p.evaluation?.status" /></td>
                <td class="px-3 py-2.5 text-xs text-gray-500">{{ p.evaluation?.dueDate || '-' }}</td>
              </tr>
              <tr v-if="reviewPreview.length === 0">
                <td colspan="6" class="px-3 py-10 text-center text-sm text-gray-400">표시할 대상이 없습니다.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </AppCard>

      <AppCard padding="p-4">
        <div class="text-base font-semibold text-gray-800 mb-3">AI 인사이트</div>
        <div class="space-y-2">
          <button @click="goEvaluation('전체')" class="w-full text-left p-3 rounded-lg cursor-pointer" style="border:1px solid rgba(234,0,44,0.2); background:rgba(234,0,44,0.05);">
            <div class="text-sm font-semibold text-gray-800">활용 가능성이 낮은 특허</div>
            <div class="text-xs text-gray-500 mt-0.5">포기 권고 특허 {{ lowPotentialCount }}건</div>
          </button>
          <button @click="router.push('/legal/expiring')" class="w-full text-left p-3 rounded-lg cursor-pointer" style="border:1px solid rgba(255,122,0,0.2); background:rgba(255,122,0,0.05);">
            <div class="text-sm font-semibold text-gray-800">만료 임박 특허</div>
            <div class="text-xs text-gray-500 mt-0.5">1년 이내 만료 예정 {{ expiringSoonCount }}건</div>
          </button>
          <button @click="goEvaluation('지연')" class="w-full text-left p-3 rounded-lg cursor-pointer" style="border:1px solid rgba(234,0,44,0.2); background:rgba(234,0,44,0.05);">
            <div class="text-sm font-semibold text-gray-800">미회신 기한 초과</div>
            <div class="text-xs text-gray-500 mt-0.5">지연 중인 특허 {{ overdueCount }}건</div>
          </button>
        </div>
      </AppCard>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <AppCard padding="p-4">
        <div class="text-base font-semibold text-gray-800 mb-3">총 관리 특허 현황</div>
        <div class="grid grid-cols-2 gap-2 mb-3 text-xs">
          <div class="p-2 rounded" style="background:#F8FAFC; border:1px solid #E2E8F0;">전체 <span class="font-bold text-gray-800">{{ statusCounts.total }}건</span></div>
          <div class="p-2 rounded" style="background:#F8FAFC; border:1px solid #E2E8F0;">등록 <span class="font-bold text-gray-800">{{ statusCounts.registered }}건</span></div>
          <div class="p-2 rounded" style="background:#F8FAFC; border:1px solid #E2E8F0;">만료 예정 <span class="font-bold text-gray-800">{{ statusCounts.expiring }}건</span></div>
          <div class="p-2 rounded" style="background:#F8FAFC; border:1px solid #E2E8F0;">포기·만료 <span class="font-bold text-gray-800">{{ statusCounts.abandoned }}건</span></div>
        </div>
        <div class="text-xs text-gray-500 mb-2">국가별 분포</div>
        <Bar :data="countryData" :options="hbarOptions" style="max-height:170px;" />
        <div class="mt-3 rounded-xl p-3" style="background:#FFF7F0; border:1px solid rgba(255,122,0,0.2);">
          <div class="text-xs text-gray-500">이번 분기 예상 연차료</div>
          <div class="text-lg font-bold mt-1" style="color:#FF7A00;">{{ formatKrw(quarterlyFeeEstimate) }}</div>
        </div>
      </AppCard>

      <AppCard padding="p-4">
        <div class="flex items-center justify-between mb-3">
          <div class="text-base font-semibold text-gray-800">사업부 회신 알림</div>
          <button @click="goEvaluation('회신 완료')" class="text-sm font-semibold cursor-pointer" style="background:transparent; border:none; color:#FF7A00;">전체 보기 ></button>
        </div>
        <div class="space-y-2">
          <div
            v-for="p in recentReplies"
            :key="p.id"
            class="flex items-center justify-between p-3 rounded-lg"
            style="background:#F8FAFC; border:1px solid #F1F5F9;"
          >
            <div>
              <div class="text-xs font-semibold text-gray-700">{{ p.dept }}</div>
              <div class="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{{ p.title }}</div>
              <div class="text-xs text-gray-400 mt-0.5">{{ p.evaluation.replyDate }}</div>
            </div>
            <button
              @click="router.push(`/patents/${p.id}`)"
              class="px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer"
              style="background:#FFFFFF; color:#FF7A00; border:1px solid #FF7A00;"
            >확인</button>
          </div>
        </div>
      </AppCard>
    </div>
  </AppLayout>
</template>
