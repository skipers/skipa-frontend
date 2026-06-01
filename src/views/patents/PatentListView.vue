<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import { PATENTS } from '@/data/patents.js'
import { useAuthStore } from '@/stores/auth.js'

const router = useRouter()
const auth = useAuthStore()

const search = ref('')
const filterStatus = ref('')
const filterDept = ref('')
const filterCountry = ref('')
const filterFilingStart = ref('')
const filterFilingEnd = ref('')
const filterExpiryStart = ref('')
const filterExpiryEnd = ref('')
const filterKeyword = ref('')
const filterIpc = ref('')
const sortBy = ref('filingDate')
const showMoreFilters = ref(false)
const page = ref(1)
const perPage = 10

const depts = [...new Set(PATENTS.map((p) => p.dept))]
const countries = [...new Set(PATENTS.map((p) => p.country))]

const basePatents = computed(() =>
  auth.isDept ? PATENTS.filter((p) => p.dept === auth.currentUser?.dept) : PATENTS,
)

const filtered = computed(() => {
  let list = basePatents.value
  if (search.value) {
    const q = search.value.toLowerCase()
    list = list.filter((p) => p.title.toLowerCase().includes(q) || p.number.toLowerCase().includes(q))
  }
  if (filterStatus.value) list = list.filter((p) => p.status === filterStatus.value)
  if (filterDept.value) list = list.filter((p) => p.dept === filterDept.value)
  if (filterCountry.value) list = list.filter((p) => p.country === filterCountry.value)
  if (filterFilingStart.value) list = list.filter((p) => p.filingDate >= filterFilingStart.value)
  if (filterFilingEnd.value) list = list.filter((p) => p.filingDate <= filterFilingEnd.value)
  if (filterExpiryStart.value) list = list.filter((p) => p.expiryDate >= filterExpiryStart.value)
  if (filterExpiryEnd.value) list = list.filter((p) => p.expiryDate <= filterExpiryEnd.value)
  if (filterKeyword.value) {
    const q = filterKeyword.value.toLowerCase()
    list = list.filter((p) => (p.keywords || '').toLowerCase().includes(q))
  }
  if (filterIpc.value) {
    const q = filterIpc.value.toLowerCase()
    list = list.filter((p) => (p.ipc || '').toLowerCase().includes(q))
  }
  list = [...list].sort((a, b) => {
    if (sortBy.value === 'citations') return b.citations - a.citations
    if (sortBy.value === 'expiryDate') return a.expiryDate.localeCompare(b.expiryDate)
    return b.filingDate.localeCompare(a.filingDate)
  })
  return list
})

const totalPages = computed(() => Math.ceil(filtered.value.length / perPage))
const paginated = computed(() => filtered.value.slice((page.value - 1) * perPage, page.value * perPage))

watch(
  [search, filterStatus, filterDept, filterCountry, filterFilingStart, filterFilingEnd, filterExpiryStart, filterExpiryEnd, filterKeyword, filterIpc, sortBy],
  () => {
    page.value = 1
  },
)
</script>

<template>
  <AppLayout title="전체 특허 목록">
    <!-- 필터 영역 -->
    <div class="bg-white rounded-xl p-4 mb-4" style="border:1px solid #E2E8F0;">
      <div class="flex flex-wrap gap-3 items-center">
        <input
          v-model="search"
          placeholder="특허명 또는 특허번호 검색"
          class="flex-1 min-w-48 px-3 py-2 text-sm rounded-lg outline-none"
          style="border:1px solid #E2E8F0; min-width:220px;"
          @focus="$event.target.style.borderColor='#FF7A00';"
          @blur="$event.target.style.borderColor='#E2E8F0';"
        />
        <select v-model="filterStatus" class="px-3 py-2 text-sm rounded-lg outline-none cursor-pointer" style="border:1px solid #E2E8F0;">
          <option value="">상태 전체</option>
          <option>등록</option>
          <option>만료 예정</option>
          <option>포기/만료</option>
        </select>
        <select v-if="auth.isLegal" v-model="filterDept" class="px-3 py-2 text-sm rounded-lg outline-none cursor-pointer" style="border:1px solid #E2E8F0;">
          <option value="">사업부 전체</option>
          <option v-for="d in depts" :key="d">{{ d }}</option>
        </select>
        <select v-model="filterCountry" class="px-3 py-2 text-sm rounded-lg outline-none cursor-pointer" style="border:1px solid #E2E8F0;">
          <option value="">국가 전체</option>
          <option v-for="c in countries" :key="c">{{ c }}</option>
        </select>
        <select v-model="sortBy" class="px-3 py-2 text-sm rounded-lg outline-none cursor-pointer" style="border:1px solid #E2E8F0;">
          <option value="filingDate">출원일순</option>
          <option value="expiryDate">만료일순</option>
          <option value="citations">피인용수순</option>
        </select>
        <button
          @click="showMoreFilters = !showMoreFilters"
          class="px-3 py-2 text-xs rounded-lg cursor-pointer"
          style="background:#fff; color:#64748b; border:1px solid #E2E8F0;"
        >{{ showMoreFilters ? '필터 접기' : '필터 더보기' }}</button>
        <div class="flex-1" />
        <button
          @click="router.push('/patents/register')"
          class="px-4 py-2 text-sm font-semibold text-white rounded-lg cursor-pointer"
          style="background:#FF7A00; border:none;"
        >
          + 특허 등록
        </button>
      </div>

      <div v-if="showMoreFilters" class="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label class="block text-xs font-medium text-gray-500 mb-1">출원일 시작</label>
          <input v-model="filterFilingStart" type="date" class="w-full px-3 py-2 text-sm rounded-lg outline-none" style="border:1px solid #E2E8F0;" />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-500 mb-1">출원일 끝</label>
          <input v-model="filterFilingEnd" type="date" class="w-full px-3 py-2 text-sm rounded-lg outline-none" style="border:1px solid #E2E8F0;" />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-500 mb-1">만료일 시작</label>
          <input v-model="filterExpiryStart" type="date" class="w-full px-3 py-2 text-sm rounded-lg outline-none" style="border:1px solid #E2E8F0;" />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-500 mb-1">만료일 끝</label>
          <input v-model="filterExpiryEnd" type="date" class="w-full px-3 py-2 text-sm rounded-lg outline-none" style="border:1px solid #E2E8F0;" />
        </div>
        <div class="md:col-span-1 lg:col-span-2">
          <label class="block text-xs font-medium text-gray-500 mb-1">키워드</label>
          <input v-model="filterKeyword" placeholder="예: 반도체, 딥러닝" class="w-full px-3 py-2 text-sm rounded-lg outline-none" style="border:1px solid #E2E8F0;" />
        </div>
        <div class="md:col-span-1 lg:col-span-2">
          <label class="block text-xs font-medium text-gray-500 mb-1">IPC</label>
          <input v-model="filterIpc" placeholder="예: G06T, H04L" class="w-full px-3 py-2 text-sm rounded-lg outline-none" style="border:1px solid #E2E8F0;" />
        </div>
      </div>
    </div>

    <!-- 테이블 -->
    <div class="bg-white rounded-xl overflow-hidden" style="border:1px solid #E2E8F0;">
      <table class="w-full text-sm">
        <thead>
          <tr style="background:#F8FAFC; border-bottom:1px solid #E2E8F0;">
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500">출원번호</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500">특허명</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500">상태</th>
            <th v-if="auth.isLegal" class="px-4 py-3 text-left text-xs font-semibold text-gray-500">사업부</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500">국가</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500">출원일</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500">만료일</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500">피인용수</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="patent in paginated"
            :key="patent.id"
            class="border-b border-gray-100 cursor-pointer transition-colors"
            style="border-bottom:1px solid #F1F5F9;"
            @click="router.push(`/patents/${patent.id}`)"
            @mouseenter="$event.currentTarget.style.background='#FFF7F0';"
            @mouseleave="$event.currentTarget.style.background='';"
          >
            <td class="px-4 py-3 text-xs font-mono text-gray-600">{{ patent.number }}</td>
            <td class="px-4 py-3">
              <div class="font-medium text-gray-800">{{ patent.title }}</div>
              <div v-if="patent.aiTags?.length" class="flex flex-wrap gap-1 mt-1">
                <span v-for="tag in patent.aiTags" :key="tag" style="background:#F1F5F9;color:#64748B;font-size:11px;border-radius:4px;padding:2px 6px;">{{ tag }}</span>
              </div>
            </td>
            <td class="px-4 py-3"><StatusBadge :status="patent.status" /></td>
            <td v-if="auth.isLegal" class="px-4 py-3 text-gray-600 text-xs">{{ patent.dept }}</td>
            <td class="px-4 py-3 text-gray-600 text-xs">{{ patent.country }}</td>
            <td class="px-4 py-3 text-gray-600 text-xs">{{ patent.filingDate }}</td>
            <td class="px-4 py-3 text-xs" :style="patent.status === '만료 예정' ? 'color:#FF7A00; font-weight:600;' : 'color:#6b7280;'">{{ patent.expiryDate }}</td>
            <td class="px-4 py-3 text-gray-600 text-xs text-center">{{ patent.citations }}</td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div class="flex items-center justify-between px-4 py-3 border-t border-gray-100">
        <span class="text-xs text-gray-500">총 {{ filtered.length }}건</span>
        <div class="flex items-center gap-1">
          <button
            v-for="p in totalPages" :key="p"
            @click="page = p"
            class="w-8 h-8 text-xs rounded-full cursor-pointer"
            :style="page === p
              ? 'background:#FF7A00; color:#fff; border:none;'
              : 'background:transparent; color:#6b7280; border:1px solid #E2E8F0;'"
          >{{ p }}</button>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
