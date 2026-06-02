<template>
  <div class="review-page">

    <!-- 페이지 헤더 -->
    <div class="page-header">
      <div>
        <p class="page-header__eyebrow">{{ quarterLabel }}</p>
        <h2 class="page-header__title">
          검토 현황
          <button class="btn-guide-icon" type="button" aria-label="재평가 안내" @click="showGuide = true">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </button>
        </h2>
        <p class="page-header__desc">이번 분기 재평가 요청받은 특허를 검토하고 의견을 제출하세요</p>
      </div>
    </div>

    <!-- 프로그레스 바 -->
    <div class="progress-section">
      <div class="progress-section__header">
        <span class="progress-section__text">
          {{ quarterLabel }} 재평가 <strong>{{ totalCount }}건</strong> 중
          <strong class="progress-section__done">{{ submittedCount }}건</strong> 제출 완료
        </span>
        <span class="progress-section__pct">{{ submitPct }}%</span>
      </div>
      <div class="progress-track">
        <div class="progress-fill" :style="{ width: submitPct + '%' }" />
      </div>
      <div class="progress-section__sub">
        <span>제출 완료 {{ submittedCount }}건</span>
        <span class="dot-sep">·</span>
        <span>미제출 {{ pendingCount }}건</span>
        <span class="dot-sep">·</span>
        <span class="dday-text">D-{{ ddayValue }}</span>
      </div>
    </div>

    <!-- 탭 -->
    <div class="tab-row">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        class="tab"
        :class="{ 'tab--active': activeTab === tab.value }"
        @click="activeTab = tab.value as 'all' | 'done' | 'pending'"
      >
        {{ tab.label }}
        <span class="tab__badge" :class="{ 'tab__badge--warn': tab.value === 'pending' && pendingCount > 0 }">
          {{ tabCount(tab.value) }}
        </span>
      </button>
    </div>

    <!-- 테이블 카드 -->
    <div class="table-card">
      <div v-if="loading" class="skel-rows">
        <div class="skel-row" v-for="n in 6" :key="n" />
      </div>

      <div v-else-if="!filteredItems.length" class="empty-state">
        <div class="empty-state__icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M9 11l3 3L22 4"/>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
          </svg>
        </div>
        <p>해당 항목이 없습니다.</p>
      </div>

      <template v-else>
        <table class="review-table">
          <thead>
            <tr>
              <th>출원번호</th>
              <th>특허명</th>
              <th>AI 종합 점수</th>
              <th>상태</th>
              <th>제출일</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in filteredItems"
              :key="item.decisionId"
              class="review-row"
              @click="goDetail(item.patentId)"
            >
              <!-- 특허번호 -->
              <td class="col-appno">
                <span class="mono">{{ item.applicationNumber }}</span>
              </td>

              <!-- 특허명 -->
              <td class="col-title">
                <span class="title-text">{{ item.title }}</span>
                <div class="tag-row">
                  <span v-for="tag in item.tags" :key="tag" class="kw-tag">{{ tag }}</span>
                </div>
              </td>

              <!-- AI 종합 점수 -->
              <td class="col-score">
                <template v-if="item.aiScore !== null">
                  <div class="score-cell">
                    <span class="score-num" :class="scoreClass(item.aiScore)">{{ item.aiScore }}</span>
                    <div class="score-track">
                      <div class="score-fill" :class="scoreClass(item.aiScore)" :style="{ width: item.aiScore + '%' }" />
                    </div>
                  </div>
                </template>
                <span v-else class="text-muted">—</span>
              </td>

              <!-- 상태 -->
              <td class="col-status">
                <span class="status-badge" :class="item.decision ? 'status-badge--done' : 'status-badge--pending'">
                  {{ item.decision ? '제출 완료' : '미제출' }}
                </span>
              </td>

              <!-- 제출일 -->
              <td class="col-date">
                <span v-if="item.decidedAt" class="date-text">{{ formatDate(item.decidedAt) }}</span>
                <span v-else class="text-muted">—</span>
              </td>

            </tr>
          </tbody>
        </table>

        <div v-if="totalPages > 1" class="table-footer">
          <BasePagination :page="page" :total-pages="totalPages" :total-items="totalCount" @update:page="fetchList" />
        </div>
      </template>
    </div>

    <!-- ── SKIPA 재평가 안내 패널 ── -->
    <Teleport to="body">
      <Transition name="guide-panel">
        <div v-if="showGuide" class="gp-backdrop" @click.self="showGuide = false">
          <aside class="gp-panel">

            <!-- 헤더 -->
            <div class="gp-header">
              <div class="gp-header__left">
                <span class="gp-header__badge">SKIPA</span>
                <div>
                  <h3 class="gp-header__title">AI 특허 재평가 시스템</h3>
                  <p class="gp-header__sub">재평가 배경 및 운영 방식 안내</p>
                </div>
              </div>
              <button class="gp-close" @click="showGuide = false">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <!-- 스크롤 콘텐츠 -->
            <div class="gp-body">

              <!-- §1 왜 재평가를 하는가 -->
              <section class="gp-section">
                <div class="gp-section__head">
                  <span class="gp-num">01</span>
                  <h4 class="gp-section__title">왜 재평가를 하는가</h4>
                </div>
                <div class="gp-why-list">
                  <div class="gp-why-item">
                    <div class="gp-why-item__icon" style="background:#eff6ff; color:#3b82f6;">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                    </div>
                    <div>
                      <p class="gp-why-item__title">분기별 연차료 납부 결정</p>
                      <p class="gp-why-item__desc">연차료 납부 시점이 도래한 특허에 대해 매 분기마다 유지/포기 여부를 결정합니다.</p>
                    </div>
                  </div>
                  <div class="gp-why-item">
                    <div class="gp-why-item__icon" style="background:#f0fdf4; color:#16a34a;">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 2l3 7h7l-5.5 4 2 7L12 16l-6.5 4 2-7L2 9h7z"/>
                      </svg>
                    </div>
                    <div>
                      <p class="gp-why-item__title">주관적 판단 → 객관적 가치 평가</p>
                      <p class="gp-why-item__desc">기존의 주관적·추상적 체크리스트 방식에서 벗어나 AI 기반 객관적 가치 평가 시스템으로 전환했습니다.</p>
                    </div>
                  </div>
                </div>
              </section>

              <!-- §2 평가 기준 및 지표 -->
              <section class="gp-section">
                <div class="gp-section__head">
                  <span class="gp-num">02</span>
                  <h4 class="gp-section__title">평가 기준 및 지표</h4>
                </div>
                <p class="gp-section__meta">특허청·한국발명진흥회 「IP 가치평가 실무 가이드」 기반 · 세부 항목 17개</p>
                <div class="gp-pillars">
                  <div class="gp-pillar" style="border-top-color:#6366f1;">
                    <p class="gp-pillar__emoji">🔬</p>
                    <p class="gp-pillar__name">기술성</p>
                    <p class="gp-pillar__desc">기술 완성도, 진보성, 구현 난이도</p>
                  </div>
                  <div class="gp-pillar" style="border-top-color:#0ea5e9;">
                    <p class="gp-pillar__emoji">⚖️</p>
                    <p class="gp-pillar__name">권리성</p>
                    <p class="gp-pillar__desc">청구항 범위, 등록 안정성, 침해 회피 가능성</p>
                  </div>
                  <div class="gp-pillar" style="border-top-color:#10b981;">
                    <p class="gp-pillar__emoji">📈</p>
                    <p class="gp-pillar__name">시장성·사업성</p>
                    <p class="gp-pillar__desc">시장 규모, 경쟁 현황, 사내 활용 가능성</p>
                  </div>
                </div>
              </section>

              <!-- §3 점수 산출 방식 -->
              <section class="gp-section">
                <div class="gp-section__head">
                  <span class="gp-num">03</span>
                  <h4 class="gp-section__title">점수 산출 방식</h4>
                </div>
                <div class="gp-methods">
                  <div class="gp-method" v-for="m in scoreMethods" :key="m.tag">
                    <span class="gp-method__tag" :style="{ background: m.bg, color: m.color }">{{ m.tag }}</span>
                    <div class="gp-method__body">
                      <p class="gp-method__title">{{ m.title }}</p>
                      <p class="gp-method__desc">{{ m.desc }}</p>
                    </div>
                  </div>
                </div>
              </section>

              <!-- §4 판단 보조 자료 -->
              <section class="gp-section">
                <div class="gp-section__head">
                  <span class="gp-num">04</span>
                  <h4 class="gp-section__title">판단 보조 자료</h4>
                </div>
                <div class="gp-supports">
                  <div class="gp-support" v-for="s in supportItems" :key="s.title">
                    <div class="gp-support__dot" />
                    <div>
                      <p class="gp-support__title">{{ s.title }}</p>
                      <p class="gp-support__desc">{{ s.desc }}</p>
                    </div>
                  </div>
                </div>
              </section>

              <!-- §5 프로세스 흐름 -->
              <section class="gp-section gp-section--last">
                <div class="gp-section__head">
                  <span class="gp-num">05</span>
                  <h4 class="gp-section__title">재평가 프로세스 흐름</h4>
                </div>
                <div class="gp-flow">
                  <div class="gp-flow__item" v-for="(s, i) in flowSteps" :key="i">
                    <div class="gp-flow__track">
                      <div class="gp-flow__dot">{{ i + 1 }}</div>
                      <div v-if="i < flowSteps.length - 1" class="gp-flow__line" />
                    </div>
                    <div class="gp-flow__content">
                      <p class="gp-flow__label">{{ s.label }}</p>
                      <p class="gp-flow__sub">{{ s.sub }}</p>
                    </div>
                  </div>
                </div>
              </section>

            </div>
          </aside>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePagination } from '@/composables/usePagination'
import BasePagination from '@/components/ui/BasePagination.vue'
import { MOCK_PATENTS, MOCK_REEVAL } from '@/mocks/data'

const router = useRouter()
const { page, totalPages, totalItems: totalCount, setPage, setTotal } = usePagination({ defaultSize: 15 })

interface ReviewItem {
  decisionId:        number
  patentId:          number
  title:             string
  applicationNumber: string
  expiryDate:        string | null
  decision:          string | null
  decidedAt:         string | null
  aiScore:           number | null
  tags:              string[]
}

// ── 상태 ────────────────────────────────────────────
const loading   = ref(false)
const showGuide = ref(false)
const activeTab = ref<'all' | 'done' | 'pending'>('all')
const allItems  = ref<ReviewItem[]>([])

// ── 계산값 ──────────────────────────────────────────
const submittedCount = computed(() => allItems.value.filter(i => i.decision !== null).length)
const pendingCount   = computed(() => allItems.value.filter(i => i.decision === null).length)
const submitPct      = computed(() =>
  totalCount.value ? Math.round((submittedCount.value / totalCount.value) * 100) : 0
)

const filteredItems = computed(() => {
  if (activeTab.value === 'done')    return allItems.value.filter(i => i.decision !== null)
  if (activeTab.value === 'pending') return allItems.value.filter(i => i.decision === null)
  return allItems.value
})

// ── 마감일 ───────────────────────────────────────────
const ddayValue = computed(() => {
  const deadline = new Date(2026, 5, 30) // 2026-06-30
  return Math.max(0, Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
})

const quarterLabel = computed(() => '2026년 2분기')

// ── 탭 ──────────────────────────────────────────────
const tabs = [
  { value: 'all',     label: '전체'     },
  { value: 'done',    label: '제출 완료' },
  { value: 'pending', label: '미제출'   },
]

function tabCount(v: string) {
  if (v === 'done')    return submittedCount.value
  if (v === 'pending') return pendingCount.value
  return totalCount.value
}

// ── 안내 패널 콘텐츠 ──────────────────────────────────
const scoreMethods = [
  { tag: '자동 계산',  bg: '#eff6ff', color: '#2563eb', title: '메타데이터 기반 자동 계산',  desc: '피인용 횟수, 청구항 수 등 공개 데이터를 수집해 자동 산출합니다.' },
  { tag: 'LLM 분석',  bg: '#f5f3ff', color: '#7c3aed', title: 'LLM 청구항 채점',           desc: '청구항 원문을 분석하여 체크리스트 기준으로 1–5점 척도로 채점합니다.' },
  { tag: '외부 자료',  bg: '#f0fdf4', color: '#15803d', title: '웹 검색 기반 시장성 판단',  desc: '웹 검색으로 시장 동향·경쟁 특허·사업 연관성 정보를 수집합니다.' },
  { tag: '하이브리드', bg: '#fff7ed', color: '#c2410c', title: 'LLM + 웹 검색 혼합',        desc: '복합 판단이 필요한 항목은 LLM과 웹 검색 결과를 함께 활용합니다.' },
]

const supportItems = [
  { title: '사내 활용 현황',  desc: '어떤 제품 또는 프로젝트에 활용되고 있는지 연결 정보를 제공합니다.' },
  { title: '유사 특허 분석',  desc: 'KIPRIS 기반 동일 기술 분야 특허의 유지/포기 추이를 비교합니다.' },
  { title: '근거 및 출처 링크', desc: '점수 항목마다 AI 판단 근거와 외부 출처 URL을 자동으로 첨부합니다.' },
]

const flowSteps = [
  { label: '데이터 추출',      sub: '특허 메타데이터 및 원문 수집' },
  { label: 'AI 가치 평가',     sub: '기술성·권리성·시장성 자동 분석' },
  { label: '보고서 자동 생성', sub: '점수·근거·출처 포함 보고서 생성' },
  { label: '사업부 검토',      sub: '담당자가 AI 보고서 기반 의견 제출' },
  { label: '최종 결정',        sub: 'Legal팀 최종 포트폴리오 조정' },
]

// ── 유틸 ────────────────────────────────────────────
const GRADE_SCORE: Record<string, number> = { S: 91, A: 83, B: 67, C: 54 }

function scoreClass(score: number) {
  if (score >= 80) return 'score--high'
  if (score >= 60) return 'score--mid'
  return 'score--low'
}

function formatDate(d?: string | null) {
  if (!d) return '—'
  return d.slice(0, 10)
}

function goDetail(id: number) { router.push(`/patents/${id}`) }

// ── 데이터 로드 ──────────────────────────────────────
function fetchList(_p = 1) {
  loading.value = true
  setPage(1)

  const items: ReviewItem[] = MOCK_REEVAL
    .filter(r => r.deptId === 2)
    .map(r => {
      const patent = MOCK_PATENTS.find(p => p.id === r.patentId)!
      return {
        decisionId:        r.patentId,
        patentId:          r.patentId,
        title:             patent.title,
        applicationNumber: patent.applicationNumber,
        expiryDate:        patent.expiryDate,
        decision:          r.decision,
        decidedAt:         r.decidedAt,
        aiScore:           patent.grade ? GRADE_SCORE[patent.grade] ?? null : null,
        tags:              patent.tags,
      }
    })

  allItems.value = items
  setTotal(items.length, 1)
  loading.value = false
}

onMounted(() => fetchList(1))
</script>

<style scoped>
.review-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  font-family: 'Pretendard', sans-serif;
}

/* ── 페이지 헤더 ─────────────────────────────────── */
.page-header__eyebrow {
  font-size: 12px; font-weight: 600;
  letter-spacing: .06em; text-transform: uppercase;
  color: #10b981; margin: 0 0 5px;
}

.page-header__title {
  display: flex; align-items: center; gap: 8px;
  font-size: 22px; font-weight: 700;
  color: #0f172a; margin: 0 0 4px;
  letter-spacing: -0.02em;
}

.page-header__desc { font-size: 13.5px; color: #64748b; margin: 0; }

.btn-guide-icon {
  display: grid; place-items: center;
  width: 26px; height: 26px;
  border-radius: 50%;
  background: #f1f5f9; border: 1px solid #e2e8f0;
  cursor: pointer; color: #64748b;
  transition: background .13s, color .13s;
  flex-shrink: 0;
}
.btn-guide-icon:hover { background: #e2e8f0; color: #0f172a; }

/* ── 프로그레스 섹션 ──────────────────────────────── */
.progress-section {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.progress-section__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.progress-section__text {
  font-size: 14px; color: #374151;
}
.progress-section__text strong { color: #0f172a; font-weight: 700; }
.progress-section__done { color: #16a34a !important; }

.progress-section__pct {
  font-size: 15px; font-weight: 800; color: #16a34a;
}

.progress-track {
  height: 8px; background: #f1f5f9; border-radius: 4px; overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #059669, #34d399);
  border-radius: 4px;
  transition: width .6s cubic-bezier(.4,0,.2,1);
}

.progress-section__sub {
  display: flex; align-items: center; gap: 6px;
  font-size: 12px; color: #94a3b8;
}
.dot-sep { color: #cbd5e1; }
.dday-text { color: #4338ca; font-weight: 600; }

/* ── 탭 ─────────────────────────────────────────── */
.tab-row {
  display: flex; gap: 4px;
  border-bottom: 1.5px solid #e2e8f0;
}

.tab {
  display: flex; align-items: center; gap: 7px;
  padding: 10px 18px;
  background: none; border: none; cursor: pointer;
  font-size: 13.5px; font-weight: 500; font-family: inherit; color: #64748b;
  position: relative; transition: color .13s; white-space: nowrap;
}
.tab:hover { color: #0f172a; }
.tab--active { color: #4f46e5; font-weight: 700; }
.tab--active::after {
  content: ''; position: absolute; bottom: -1.5px; left: 0; right: 0;
  height: 2px; background: #4f46e5; border-radius: 2px 2px 0 0;
}

.tab__badge {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 20px; height: 18px; padding: 0 6px;
  background: #f1f5f9; color: #64748b;
  border-radius: 10px; font-size: 11px; font-weight: 700;
}
.tab__badge--warn { background: #fef2f2; color: #dc2626; }

/* ── 테이블 카드 ─────────────────────────────────── */
.table-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  overflow: hidden;
}

.review-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13.5px;
  table-layout: fixed;
}

.review-table thead tr {
  border-bottom: 1.5px solid #e2e8f0;
  background: #fafafa;
}

.review-table th {
  padding: 10px 16px;
  text-align: left;
  font-size: 11.5px; font-weight: 600;
  color: #64748b; letter-spacing: .02em;
  text-transform: uppercase; white-space: nowrap;
}

.review-row {
  border-bottom: 1px solid #f1f5f9;
  cursor: pointer;
  transition: background .12s;
}
.review-row:last-child { border-bottom: none; }
.review-row:hover { background: #f8fafc; }

.review-table td {
  padding: 14px 16px;
  vertical-align: middle;
}

/* 컬럼 너비 */
.col-appno  { width: 16%; white-space: nowrap; }
.col-title  { width: 40%; }
.col-score  { width: 20%; }
.col-status { width: 12%; }
.col-date   { width: 12%; white-space: nowrap; }

.mono {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px; color: #475569;
}

.title-text {
  font-weight: 600; color: #0f172a;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 5px;
}

.kw-tag {
  background: #F1F5F9;
  color: #64748B;
  font-size: 11px;
  border-radius: 4px;
  padding: 2px 6px;
  white-space: nowrap;
}

/* AI 종합 점수 */
.score-cell {
  display: flex;
  flex-direction: column;
  gap: 5px;
  width: 100%;
}
.score-num {
  font-size: 13px; font-weight: 700;
}
.score-track {
  width: 100%;
  height: 5px; background: #f1f5f9; border-radius: 3px; overflow: hidden;
}
.score-fill {
  height: 100%; border-radius: 3px;
  transition: width .4s ease;
}
.score-num.score--high,
.score-num.score--mid,
.score-num.score--low  { color: #2563eb; }
.score-fill.score--high,
.score-fill.score--mid,
.score-fill.score--low  { background: #3b82f6; }

/* 상태 배지 */
.status-badge {
  display: inline-block;
  padding: 3px 10px; border-radius: 20px;
  font-size: 12px; font-weight: 700;
  white-space: nowrap;
}
.status-badge--done    { background: #f0fdf4; color: #15803d; }
.status-badge--pending { background: #fff4e6; color: #FF7A00; }

/* 제출일 + 버튼 */
.date-text { font-size: 13px; color: #475569; }

.btn-submit-inline {
  display: inline-flex; align-items: center;
  padding: 5px 12px;
  background: #FF7A00;
  color: #fff; border: none; border-radius: 7px;
  font-size: 12px; font-weight: 600; font-family: inherit; cursor: pointer;
  white-space: nowrap;
  box-shadow: 0 2px 6px rgba(255,122,0,.3);
  transition: opacity .13s, transform .12s;
}
.btn-submit-inline:hover { opacity: .9; transform: translateY(-1px); }

.text-muted { color: #cbd5e1; font-size: 13px; }

/* ── 스켈레톤 ────────────────────────────────────── */
.skel-rows { display: flex; flex-direction: column; }
.skel-row {
  height: 60px; border-bottom: 1px solid #f8fafc;
  background: linear-gradient(90deg, #f8fafc 25%, #f1f5f9 50%, #f8fafc 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

/* ── 빈 상태 ─────────────────────────────────────── */
.empty-state {
  padding: 56px 24px;
  display: flex; flex-direction: column; align-items: center; gap: 10px;
  text-align: center; color: #94a3b8;
}
.empty-state__icon {
  width: 52px; height: 52px; background: #f1f5f9; border-radius: 14px;
  display: flex; align-items: center; justify-content: center; margin-bottom: 4px;
}
.empty-state p { font-size: 14px; font-weight: 500; }

/* ── 테이블 푸터 ─────────────────────────────────── */
.table-footer {
  display: flex; justify-content: center;
  padding: 16px; border-top: 1px solid #f1f5f9;
}

/* ── 안내 패널 ───────────────────────────────────── */
.gp-backdrop {
  position: fixed; inset: 0;
  background: rgba(15,23,42,.4);
  z-index: 200; backdrop-filter: blur(2px);
  display: flex; justify-content: flex-end;
}

.gp-panel {
  width: min(500px, 96vw);
  height: 100%;
  background: #fff;
  display: flex; flex-direction: column;
  box-shadow: -8px 0 40px rgba(15,23,42,.14);
  overflow: hidden;
}

/* 헤더 */
.gp-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 22px 24px;
  background: #0f172a;
  flex-shrink: 0;
}
.gp-header__left { display: flex; align-items: center; gap: 14px; }
.gp-header__badge {
  padding: 3px 9px;
  background: #10b981; color: #fff;
  font-size: 11px; font-weight: 800; letter-spacing: .08em;
  border-radius: 6px; flex-shrink: 0;
}
.gp-header__title { font-size: 16px; font-weight: 700; color: #f8fafc; margin: 0 0 2px; }
.gp-header__sub   { font-size: 12px; color: #94a3b8; margin: 0; }
.gp-close {
  width: 32px; height: 32px; border-radius: 8px;
  background: rgba(255,255,255,.08); border: none;
  cursor: pointer; color: #94a3b8;
  display: flex; align-items: center; justify-content: center;
  transition: background .13s, color .13s; flex-shrink: 0;
}
.gp-close:hover { background: rgba(255,255,255,.16); color: #f1f5f9; }

/* 스크롤 본문 */
.gp-body {
  flex: 1; overflow-y: auto;
  padding: 0;
}
.gp-body::-webkit-scrollbar { width: 4px; }
.gp-body::-webkit-scrollbar-track { background: transparent; }
.gp-body::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }

/* 섹션 공통 */
.gp-section {
  padding: 24px 24px 0;
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 24px;
}
.gp-section--last { border-bottom: none; }

.gp-section__head {
  display: flex; align-items: center; gap: 10px;
  margin-bottom: 14px;
}
.gp-num {
  font-size: 11px; font-weight: 800; letter-spacing: .06em;
  color: #10b981; background: #f0fdf4;
  padding: 2px 7px; border-radius: 5px; flex-shrink: 0;
}
.gp-section__title {
  font-size: 14px; font-weight: 700; color: #0f172a; margin: 0;
}
.gp-section__meta {
  font-size: 12px; color: #94a3b8; margin: -6px 0 14px;
  line-height: 1.5;
}

/* §1 왜 재평가 */
.gp-why-list { display: flex; flex-direction: column; gap: 10px; }
.gp-why-item {
  display: flex; align-items: flex-start; gap: 12px;
  padding: 14px; background: #f8fafc; border-radius: 10px;
}
.gp-why-item__icon {
  width: 32px; height: 32px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.gp-why-item__title { font-size: 13.5px; font-weight: 700; color: #0f172a; margin: 0 0 4px; }
.gp-why-item__desc  { font-size: 12.5px; color: #64748b; margin: 0; line-height: 1.6; }

/* §2 평가 기준 3대 기둥 */
.gp-pillars { display: flex; gap: 8px; }
.gp-pillar {
  flex: 1; padding: 14px 12px;
  background: #f8fafc; border-radius: 10px;
  border-top: 3px solid #e2e8f0;
  text-align: center;
}
.gp-pillar__emoji { font-size: 20px; margin: 0 0 6px; }
.gp-pillar__name  { font-size: 13px; font-weight: 700; color: #0f172a; margin: 0 0 5px; }
.gp-pillar__desc  { font-size: 11.5px; color: #64748b; margin: 0; line-height: 1.5; }

/* §3 점수 산출 */
.gp-methods { display: flex; flex-direction: column; gap: 8px; }
.gp-method  {
  display: flex; align-items: flex-start; gap: 12px;
  padding: 12px 14px; background: #f8fafc; border-radius: 10px;
}
.gp-method__tag {
  padding: 3px 9px; border-radius: 6px;
  font-size: 11.5px; font-weight: 700;
  white-space: nowrap; flex-shrink: 0; margin-top: 1px;
}
.gp-method__title { font-size: 13px; font-weight: 700; color: #0f172a; margin: 0 0 3px; }
.gp-method__desc  { font-size: 12px; color: #64748b; margin: 0; line-height: 1.55; }

/* §4 보조 자료 */
.gp-supports { display: flex; flex-direction: column; gap: 10px; }
.gp-support  {
  display: flex; align-items: flex-start; gap: 12px;
}
.gp-support__dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: #10b981; flex-shrink: 0; margin-top: 5px;
}
.gp-support__title { font-size: 13px; font-weight: 700; color: #0f172a; margin: 0 0 3px; }
.gp-support__desc  { font-size: 12px; color: #64748b; margin: 0; line-height: 1.55; }

/* §5 프로세스 흐름 */
.gp-flow { display: flex; flex-direction: column; }
.gp-flow__item {
  display: flex; align-items: flex-start; gap: 14px;
}
.gp-flow__track {
  display: flex; flex-direction: column; align-items: center;
  flex-shrink: 0;
}
.gp-flow__dot {
  width: 28px; height: 28px; border-radius: 50%;
  background: #0f172a; color: #10b981;
  font-size: 12px; font-weight: 800;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.gp-flow__line {
  width: 2px; flex: 1; min-height: 20px;
  background: #e2e8f0; margin: 4px 0;
}
.gp-flow__content { padding-bottom: 20px; padding-top: 4px; }
.gp-flow__label { font-size: 13.5px; font-weight: 700; color: #0f172a; margin: 0 0 3px; }
.gp-flow__sub   { font-size: 12px; color: #64748b; margin: 0; }

/* 패널 트랜지션 */
.guide-panel-enter-active { transition: opacity .25s; }
.guide-panel-leave-active { transition: opacity .2s; }
.guide-panel-enter-from,
.guide-panel-leave-to     { opacity: 0; }
.guide-panel-enter-active .gp-panel { animation: panelSlideIn .3s cubic-bezier(.4,0,.2,1); }
.guide-panel-leave-active .gp-panel { animation: panelSlideOut .22s ease-in; }
@keyframes panelSlideIn  { from { transform: translateX(100%); } to { transform: translateX(0); } }
@keyframes panelSlideOut { from { transform: translateX(0); }    to { transform: translateX(100%); } }
</style>
