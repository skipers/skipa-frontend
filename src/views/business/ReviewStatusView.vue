<template>
  <div class="review-page">

    <!-- 페이지 헤더 -->
    <div class="page-header">
      <div>
        <p class="page-header__eyebrow">{{ quarterLabel }}</p>
        <h2 class="page-header__title">검토 현황</h2>
        <p class="page-header__desc">이번 분기 재평가 요청받은 특허를 검토하고 의견을 제출하세요</p>
      </div>
      <!-- 재평가 로직 안내 버튼 -->
      <button class="btn-guide" @click="showGuide = true">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        재평가 안내
      </button>
    </div>

    <!-- 제출 진행 현황 바 -->
    <div class="progress-card">
      <div class="progress-card__header">
        <span class="progress-card__label">제출 현황</span>
        <span class="progress-card__fraction">{{ submittedCount }} / {{ totalCount }}건</span>
      </div>
      <div class="progress-track">
        <div class="progress-fill" :style="{ width: submitPct + '%' }" />
      </div>
      <div class="progress-card__chips">
        <span class="chip-stat chip-stat--pending">
          <span class="chip-stat__dot" />
          미제출 {{ pendingCount }}건
        </span>
        <span class="chip-stat chip-stat--done">
          <span class="chip-stat__dot" />
          제출 완료 {{ submittedCount }}건
        </span>
        <span v-if="ddayValue > 0" class="chip-stat chip-stat--dday">
          D-{{ ddayValue }}
        </span>
        <span v-else class="chip-stat chip-stat--overdue">마감 초과</span>
      </div>
    </div>

    <!-- 상태 탭 -->
    <div class="tab-row">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        class="tab"
        :class="{ 'tab--active': activeTab === tab.value }"
        @click="activeTab = tab.value"
      >
        {{ tab.label }}
        <span class="tab__badge" :class="{ 'tab__badge--warn': tab.value === 'pending' && pendingCount > 0 }">
          {{ tab.value === 'pending' ? pendingCount : submittedCount }}
        </span>
      </button>
    </div>

    <!-- 특허 목록 -->
    <div class="review-list-card">
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
        <p>{{ activeTab === 'pending' ? '미제출 특허가 없습니다 🎉' : '제출 완료된 특허가 없습니다' }}</p>
      </div>

      <div v-else class="review-items">
        <div
          v-for="item in filteredItems"
          :key="item.decisionId"
          class="review-item"
          :class="{ 'review-item--done': item.decision }"
          @click="goDetail(item.patentId)"
        >
          <!-- 상태 아이콘 -->
          <div class="review-item__status-icon" :class="item.decision ? 'status-icon--done' : 'status-icon--pending'">
            <svg v-if="item.decision" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>

          <!-- 특허 정보 -->
          <div class="review-item__info">
            <p class="review-item__title">{{ item.title }}</p>
            <div class="review-item__meta">
              <span class="meta-pill">{{ item.applicationNumber }}</span>
              <span v-if="item.expiryDate" class="meta-pill meta-pill--expiry">
                만료 {{ formatDate(item.expiryDate) }}
              </span>
            </div>
          </div>

          <!-- 결정 배지 또는 제출 유도 -->
          <div class="review-item__right" @click.stop>
            <div v-if="item.decision" class="decision-result">
              <span class="decision-badge" :class="`decision-badge--${item.decision.toLowerCase()}`">
                {{ decisionLabel(item.decision) }}
              </span>
              <span class="decision-date">{{ formatDate(item.decidedAt) }}</span>
            </div>
            <button v-else class="btn-submit-now" @click.stop="openQuickSubmit(item)">
              의견 제출
            </button>
          </div>

          <svg class="review-item__arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </div>
      </div>

      <!-- 페이지네이션 -->
      <div v-if="totalPages > 1" class="list-footer">
        <BasePagination :page="page" :total-pages="totalPages" :total-items="totalCount" @update:page="fetchList" />
      </div>
    </div>

    <!-- ── 빠른 제출 모달 ── -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showQuickSubmit" class="modal-overlay" @click.self="showQuickSubmit = false">
          <div class="modal">
            <div class="modal__header">
              <h3 class="modal__title">의견 제출</h3>
              <button class="modal__close" @click="showQuickSubmit = false">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div class="modal__body">
              <p class="modal__patent-name">{{ quickTarget?.title }}</p>
              <div class="decision-btns">
                <button
                  v-for="opt in decisionOptions"
                  :key="opt.value"
                  class="decision-btn"
                  :class="[`decision-btn--${opt.value.toLowerCase()}`, { 'decision-btn--selected': quickForm.decision === opt.value }]"
                  @click="quickForm.decision = opt.value"
                >
                  <span class="decision-btn__emoji">{{ opt.emoji }}</span>
                  {{ opt.label }}
                </button>
              </div>
              <textarea
                v-model="quickForm.comment"
                class="comment-textarea"
                placeholder="의견을 입력하세요 (선택)"
                rows="3"
              />
            </div>
            <div class="modal__footer">
              <button class="btn-cancel" @click="showQuickSubmit = false">취소</button>
              <button class="btn-confirm" :disabled="!quickForm.decision || submitting" @click="handleQuickSubmit">
                <span v-if="submitting" class="spinner" />
                제출
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ── 재평가 안내 모달 ── -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showGuide" class="modal-overlay" @click.self="showGuide = false">
          <div class="modal modal--guide">
            <div class="modal__header">
              <h3 class="modal__title">재평가 프로세스 안내</h3>
              <button class="modal__close" @click="showGuide = false">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div class="modal__body modal__body--guide">

              <!-- 프로세스 스텝 -->
              <div class="guide-section">
                <h4 class="guide-section__title">재평가 프로세스</h4>
                <div class="guide-steps">
                  <div v-for="(step, i) in guideSteps" :key="i" class="guide-step">
                    <div class="guide-step__num">{{ i + 1 }}</div>
                    <div class="guide-step__content">
                      <p class="guide-step__title">{{ step.title }}</p>
                      <p class="guide-step__desc">{{ step.desc }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 평가 항목 -->
              <div class="guide-section">
                <h4 class="guide-section__title">평가 항목 설명</h4>
                <div class="guide-criteria">
                  <div v-for="c in guideCriteria" :key="c.label" class="guide-criterion">
                    <div class="guide-criterion__badge" :style="{ background: c.bg, color: c.color }">
                      {{ c.label }}
                    </div>
                    <p class="guide-criterion__desc">{{ c.desc }}</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { inboxApi } from '@/api/misc'
import { usePagination } from '@/composables/usePagination'
import BasePagination from '@/components/ui/BasePagination.vue'
import type { InboxItem } from '@/types'

const router = useRouter()
const auth   = useAuthStore()
const { page, totalPages, totalItems: totalCount, query: pageQuery, setPage, setTotal } = usePagination({ defaultSize: 15 })

// ── 상태 ────────────────────────────────────────────
const loading        = ref(false)
const submitting     = ref(false)
const showQuickSubmit = ref(false)
const showGuide      = ref(false)
const activeTab      = ref<'pending' | 'done'>('pending')
const allItems       = ref<InboxItem[]>([])
const quickTarget    = ref<InboxItem | null>(null)
const quickForm      = reactive<{ decision: string; comment: string }>({ decision: '', comment: '' })

// ── 계산값 ──────────────────────────────────────────
const submittedItems = computed(() => allItems.value.filter(i => i.decision !== null))
const pendingItems   = computed(() => allItems.value.filter(i => i.decision === null))
const submittedCount = computed(() => submittedItems.value.length)
const pendingCount   = computed(() => pendingItems.value.length)
const filteredItems  = computed(() => activeTab.value === 'pending' ? pendingItems.value : submittedItems.value)
const submitPct      = computed(() => totalCount.value ? Math.round((submittedCount.value / totalCount.value) * 100) : 0)

// ── 마감일 ───────────────────────────────────────────
const ddayValue = computed(() => {
  const d = new Date()
  const q = Math.ceil((d.getMonth() + 1) / 3)
  const deadline = new Date(d.getFullYear(), q * 3, 0)
  return Math.max(0, Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
})

const quarterLabel = computed(() => {
  const d = new Date()
  return `${d.getFullYear()}년 ${Math.ceil((d.getMonth() + 1) / 3)}분기`
})

// ── 탭 ──────────────────────────────────────────────
const tabs = [
  { value: 'pending', label: '미제출' },
  { value: 'done',    label: '제출 완료' },
]

// ── 결정 옵션 ────────────────────────────────────────
const decisionOptions = [
  { value: 'KEEP',    label: '유지',  emoji: '✅' },
  { value: 'DISPOSE', label: '포기',  emoji: '🗑' },
]

// ── 가이드 콘텐츠 ─────────────────────────────────────
const guideSteps = [
  { title: 'Legal팀 재평가 요청', desc: '분기별로 Legal팀이 검토 대상 특허를 선정하여 각 사업부에 검토 요청을 전송합니다.' },
  { title: 'AI 자동 분석', desc: 'AI가 특허 원문을 분석하여 기술성·권리성·사업성 평가 보고서를 자동 생성합니다.' },
  { title: '사업부 검토', desc: '담당 사업부는 AI 보고서와 특허 정보를 바탕으로 유지/포기 의견을 제출합니다.' },
  { title: '최종 의사결정', desc: 'Legal팀이 사업부 의견을 종합하여 연차료 납부 및 포트폴리오 조정을 결정합니다.' },
]

const guideCriteria = [
  { label: '유지',  bg: '#f0fdf4', color: '#15803d', desc: '현재 사업과의 연관성이 높고 향후 활용 가능성이 있는 특허' },
  { label: '포기',  bg: '#fef2f2', color: '#dc2626', desc: '사업 연관성이 낮고 유지 비용 대비 가치가 미미한 특허' },
]

// ── 유틸 ────────────────────────────────────────────
function decisionLabel(d: string) {
  return { KEEP: '유지', DISPOSE: '포기' }[d] ?? d
}
function formatDate(d?: string | null) {
  if (!d) return '—'
  return d.slice(0, 10).replace(/-/g, '.')
}
function goDetail(id: number) { router.push(`/patents/${id}`) }

// ── 빠른 제출 ─────────────────────────────────────────
function openQuickSubmit(item: InboxItem) {
  quickTarget.value = item
  quickForm.decision = ''
  quickForm.comment  = ''
  showQuickSubmit.value = true
}

async function handleQuickSubmit() {
  if (!quickForm.decision || !quickTarget.value) return
  submitting.value = true
  try {
    await inboxApi.decide(quickTarget.value.decisionId, {
      decision: quickForm.decision as any,
      comment: quickForm.comment || undefined,
    })
    showQuickSubmit.value = false
    await fetchList(page.value)
  } catch (e) { console.error(e) }
  finally { submitting.value = false }
}

// ── 데이터 로드 ──────────────────────────────────────
async function fetchList(p = 1) {
  loading.value = true
  setPage(p)
  try {
    const res = await inboxApi.list({ status: 'all', ...pageQuery.value })
    allItems.value = res.items
    setTotal(res.totalItems, res.totalPages)
  } catch (e) { console.error(e) }
  finally { loading.value = false }
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
.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.page-header__eyebrow {
  font-size: 12px; font-weight: 600;
  letter-spacing: .06em; text-transform: uppercase;
  color: var(--c-green-400); margin: 0 0 5px;
}
.page-header__title {
  font-size: 22px; font-weight: 700;
  color: var(--color-text); margin: 0 0 4px;
  letter-spacing: -0.02em;
}
.page-header__desc { font-size: 13.5px; color: var(--color-text-muted); margin: 0; }

.btn-guide {
  display: flex; align-items: center; gap: 7px;
  padding: 9px 16px;
  background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 9px;
  font-size: 13px; font-weight: 600; font-family: inherit; cursor: pointer; color: var(--color-text-secondary);
  transition: background .13s, border-color .13s;
}
.btn-guide:hover { background: var(--color-surface-hover); border-color: var(--c-slate-300); }

/* ── 진행 카드 ────────────────────────────────────── */
.progress-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.progress-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.progress-card__label   { font-size: 13.5px; font-weight: 700; color: var(--color-text); }
.progress-card__fraction { font-size: 13.5px; font-weight: 700; color: var(--c-green-400); }

.progress-track { height: 8px; background: var(--color-surface-muted); border-radius: 4px; overflow: hidden; }
.progress-fill  {
  height: 100%;
  background: linear-gradient(90deg, var(--c-green-500), var(--c-green-300));
  border-radius: 4px;
  transition: width .6s cubic-bezier(.4,0,.2,1);
}

.progress-card__chips { display: flex; gap: 8px; flex-wrap: wrap; }

.chip-stat {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 4px 10px; border-radius: 20px;
  font-size: 12.5px; font-weight: 600;
}
.chip-stat__dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; flex-shrink: 0; }

.chip-stat--pending { background: var(--color-warn-bg); color: var(--color-warn-dark); }
.chip-stat--done    { background: var(--color-success-bg); color: var(--color-success-dark); }
.chip-stat--dday    { background: var(--color-primary-bg); color: var(--color-primary-darker); }
.chip-stat--overdue { background: var(--color-danger-bg); color: var(--color-danger); }

/* ── 탭 ─────────────────────────────────────────── */
.tab-row {
  display: flex;
  gap: 4px;
  border-bottom: 1.5px solid var(--color-border);
}

.tab {
  display: flex; align-items: center; gap: 7px;
  padding: 10px 18px;
  background: none; border: none; cursor: pointer;
  font-size: 13.5px; font-weight: 500; font-family: inherit; color: var(--color-text-muted);
  position: relative; transition: color .13s; white-space: nowrap;
}
.tab:hover { color: var(--color-text); }
.tab--active { color: var(--color-primary-dark); font-weight: 700; }
.tab--active::after {
  content: ''; position: absolute; bottom: -1.5px; left: 0; right: 0;
  height: 2px; background: var(--color-primary-dark); border-radius: 2px 2px 0 0;
}

.tab__badge {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 20px; height: 18px; padding: 0 6px;
  background: var(--color-surface-muted); color: var(--color-text-muted);
  border-radius: 10px; font-size: 11px; font-weight: 700;
}
.tab__badge--warn { background: var(--color-danger-bg); color: var(--color-danger); }

/* ── 목록 카드 ────────────────────────────────────── */
.review-list-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  overflow: hidden;
}

.review-items { display: flex; flex-direction: column; }

.review-item {
  display: grid;
  grid-template-columns: 40px 1fr auto auto;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-surface-hover);
  cursor: pointer;
  transition: background .12s;
}
.review-item:last-child { border-bottom: none; }
.review-item:hover { background: var(--color-surface-hover); }
.review-item--done { opacity: 0.85; }

/* 상태 아이콘 */
.review-item__status-icon {
  width: 32px; height: 32px;
  border-radius: 9px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.status-icon--pending { background: var(--color-warn-bg); color: var(--color-warn); }
.status-icon--done    { background: var(--color-success-bg); color: var(--color-success); }

/* 특허 정보 */
.review-item__info { display: flex; flex-direction: column; gap: 5px; min-width: 0; }

.review-item__title {
  font-size: 13.5px; font-weight: 600; color: var(--color-text);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  margin: 0;
}

.review-item__meta { display: flex; gap: 6px; flex-wrap: wrap; }

.meta-pill {
  display: inline-block; padding: 2px 7px;
  background: var(--color-surface-hover); border: 1px solid var(--color-border); border-radius: 5px;
  font-size: 11.5px; color: var(--color-text-muted);
  font-family: 'JetBrains Mono', monospace;
}
.meta-pill--expiry { color: var(--color-warn-dark); background: var(--color-warn-bg); border-color: var(--c-amber-200); font-family: inherit; }

/* 오른쪽 */
.review-item__right { display: flex; align-items: center; justify-content: flex-end; }

.decision-result { display: flex; flex-direction: column; align-items: flex-end; gap: 3px; }
.decision-badge {
  padding: 3px 10px; border-radius: 6px; font-size: 12.5px; font-weight: 700;
}
.decision-badge--keep    { background: var(--color-success-bg); color: var(--color-success-dark); }
.decision-badge--sell    { background: var(--color-primary-bg); color: var(--color-primary-darker); }
.decision-badge--dispose { background: var(--color-danger-bg); color: var(--color-danger); }
.decision-date { font-size: 11px; color: var(--color-text-subtle); }

.btn-submit-now {
  padding: 7px 14px;
  background: linear-gradient(135deg, var(--color-primary-dark), var(--color-primary));
  color: var(--color-surface); border: none; border-radius: 8px;
  font-size: 12.5px; font-weight: 600; font-family: inherit; cursor: pointer;
  box-shadow: 0 3px 8px rgba(79,70,229,.25);
  transition: opacity .13s, transform .12s;
  white-space: nowrap;
}
.btn-submit-now:hover { opacity: .9; transform: translateY(-1px); }

.review-item__arrow {
  color: var(--c-slate-300);
  flex-shrink: 0;
  transition: color .12s;
}
.review-item:hover .review-item__arrow { color: var(--color-primary); }

/* ── 스켈레톤 ────────────────────────────────────── */
.skel-rows { display: flex; flex-direction: column; }
.skel-row {
  height: 64px; border-bottom: 1px solid var(--color-surface-hover);
  background: linear-gradient(90deg, var(--color-surface-hover) 25%, var(--color-surface-muted) 50%, var(--color-surface-hover) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

/* ── 빈 상태 ─────────────────────────────────────── */
.empty-state {
  padding: 56px 24px;
  display: flex; flex-direction: column; align-items: center; gap: 10px;
  text-align: center; color: var(--color-text-subtle);
}
.empty-state__icon {
  width: 52px; height: 52px; background: var(--color-surface-muted); border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 4px;
}
.empty-state p { font-size: 14px; font-weight: 500; }

/* ── 목록 푸터 ────────────────────────────────────── */
.list-footer {
  display: flex; justify-content: center;
  padding: 16px; border-top: 1px solid var(--color-surface-muted);
}

/* ── 모달 ────────────────────────────────────────── */
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(15,23,42,.45);
  display: flex; align-items: center; justify-content: center;
  z-index: 200; backdrop-filter: blur(2px);
}
.modal {
  background: var(--color-surface); border-radius: 18px;
  width: min(480px, 94vw);
  box-shadow: 0 24px 64px rgba(15,23,42,.18);
  overflow: hidden;
}
.modal--guide { width: min(580px, 94vw); }

.modal__header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 24px 16px; border-bottom: 1px solid var(--color-surface-muted);
}
.modal__title { font-size: 17px; font-weight: 700; color: var(--color-text); margin: 0; }
.modal__close {
  width: 32px; height: 32px; background: var(--color-surface-muted); border: none; border-radius: 8px;
  cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--color-text-muted);
}
.modal__body { padding: 20px 24px; display: flex; flex-direction: column; gap: 14px; }
.modal__body--guide { gap: 24px; max-height: 70vh; overflow-y: auto; }
.modal__patent-name { font-size: 14px; font-weight: 600; color: var(--color-text-secondary); margin: 0; line-height: 1.4; }
.modal__footer {
  display: flex; justify-content: flex-end; gap: 10px;
  padding: 14px 24px 20px; border-top: 1px solid var(--color-surface-muted);
}

/* 결정 버튼 그룹 */
.decision-btns { display: flex; gap: 8px; }
.decision-btn {
  flex: 1; display: flex; flex-direction: column; align-items: center; gap: 5px;
  padding: 12px 8px;
  border: 1.5px solid var(--color-border); border-radius: 10px;
  background: var(--color-surface); font-size: 13px; font-weight: 600;
  font-family: inherit; cursor: pointer; color: var(--color-text-muted);
  transition: border-color .13s, background .13s, color .13s;
}
.decision-btn:hover { background: var(--color-surface-hover); }
.decision-btn__emoji { font-size: 20px; }
.decision-btn--keep.decision-btn--selected    { border-color: var(--color-success); background: var(--color-success-bg); color: var(--color-success-dark); }
.decision-btn--sell.decision-btn--selected    { border-color: var(--color-primary); background: var(--color-primary-bg); color: var(--color-primary-darker); }
.decision-btn--dispose.decision-btn--selected { border-color: var(--color-danger-light); background: var(--color-danger-bg); color: var(--color-danger); }

.comment-textarea {
  width: 100%; padding: 10px 12px;
  border: 1.5px solid var(--color-border); border-radius: 9px;
  font-size: 13.5px; font-family: inherit; color: var(--color-text); background: var(--color-surface-soft);
  resize: vertical; outline: none; transition: border-color .15s;
  box-sizing: border-box;
}
.comment-textarea:focus { border-color: var(--color-primary); background: var(--color-surface); }

.btn-cancel {
  padding: 9px 20px; background: var(--color-surface-muted); border: 1px solid var(--color-border); border-radius: 9px;
  font-size: 13.5px; font-weight: 600; font-family: inherit; cursor: pointer; color: var(--c-slate-600);
}
.btn-confirm {
  display: flex; align-items: center; gap: 8px;
  padding: 9px 22px; background: linear-gradient(135deg, var(--color-primary-dark), var(--color-primary));
  color: var(--color-surface); border: none; border-radius: 9px;
  font-size: 13.5px; font-weight: 600; font-family: inherit; cursor: pointer;
  box-shadow: 0 4px 12px rgba(79,70,229,.3);
}
.btn-confirm:disabled { opacity: .6; cursor: not-allowed; }
.spinner { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,.3); border-top-color: var(--color-surface); border-radius: 50%; animation: spin .7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* 가이드 모달 */
.guide-section { display: flex; flex-direction: column; gap: 14px; }
.guide-section__title {
  font-size: 13px; font-weight: 700; color: var(--color-text-secondary);
  text-transform: uppercase; letter-spacing: .06em;
  padding-bottom: 8px; border-bottom: 1px solid var(--color-surface-muted);
  margin: 0;
}

.guide-steps { display: flex; flex-direction: column; gap: 10px; }
.guide-step { display: flex; align-items: flex-start; gap: 12px; }
.guide-step__num {
  width: 24px; height: 24px; border-radius: 50%;
  background: var(--color-primary-bg); color: var(--color-primary);
  font-size: 12px; font-weight: 800;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; margin-top: 1px;
}
.guide-step__title { font-size: 13.5px; font-weight: 700; color: var(--color-text); margin: 0 0 3px; }
.guide-step__desc  { font-size: 13px; color: var(--color-text-muted); margin: 0; line-height: 1.6; }

.guide-criteria { display: flex; flex-direction: column; gap: 8px; }
.guide-criterion {
  display: flex; align-items: flex-start; gap: 12px;
  padding: 12px 14px;
  background: var(--color-surface-hover); border-radius: 10px;
}
.guide-criterion__badge {
  padding: 4px 10px; border-radius: 6px;
  font-size: 12px; font-weight: 700; flex-shrink: 0; margin-top: 1px;
}
.guide-criterion__desc { font-size: 13px; color: var(--color-text-secondary); line-height: 1.6; margin: 0; }

/* 전환 */
.modal-enter-active { transition: opacity .2s; }
.modal-leave-active { transition: opacity .15s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-active .modal { animation: modalUp .22s cubic-bezier(.34,1.56,.64,1); }
@keyframes modalUp { from { transform: translateY(12px) scale(.98); } to { transform: translateY(0) scale(1); } }
</style>
