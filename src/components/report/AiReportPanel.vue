<template>
  <div class="ai-report">

    <!-- ── 생성 중 상태 ── -->
    <div v-if="pollingStatus === 'polling'" class="report-generating">
      <div class="generating-visual">
        <div class="generating-ring generating-ring--1" />
        <div class="generating-ring generating-ring--2" />
        <div class="generating-ring generating-ring--3" />
        <div class="generating-core">
          <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
            <path d="M4 14 L14 4 L24 14" stroke="#6366f1" stroke-width="2" stroke-linejoin="round" fill="none"/>
            <path d="M8 18 L14 12 L20 18 L14 24 Z" fill="#6366f1" opacity="0.7"/>
          </svg>
        </div>
      </div>
      <p class="generating-title">AI 분석 중</p>
      <p class="generating-desc">특허 원문을 분석하고 평가 보고서를 생성하고 있습니다.<br />잠시만 기다려주세요.</p>
      <div class="generating-steps">
        <div v-for="(step, i) in generatingSteps" :key="i" class="gen-step" :class="genStepClass(i)">
          <div class="gen-step__dot" />
          <span>{{ step }}</span>
        </div>
      </div>
    </div>

    <!-- ── 실패 상태 ── -->
    <div v-else-if="pollingStatus === 'failed' || pollingStatus === 'timeout'" class="report-failed">
      <div class="failed-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>
      <p class="failed-title">보고서 생성에 실패했습니다</p>
      <p class="failed-desc">AI 분석 중 오류가 발생했습니다.</p>
      <button v-if="isLegal" class="btn-retry" @click="handleRetry">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="1 4 1 10 7 10"/>
          <path d="M3.51 15a9 9 0 1 0 .49-3.1"/>
        </svg>
        재시도
      </button>
    </div>

    <!-- ── 완료: 보고서 렌더 ── -->
    <template v-else-if="report">

      <!-- 메타 헤더 -->
      <div class="report-meta">
        <div class="report-meta__left">
          <span class="report-meta__badge">
            <span class="report-meta__badge-dot" />
            AI 평가 완료
          </span>
          <span class="report-meta__date">{{ formatDate(report.generatedAt) }} 생성</span>
        </div>
        <button v-if="isLegal" class="btn-regenerate" @click="handleRegenerate" :disabled="regenerating">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" :class="{ 'spinning': regenerating }">
            <polyline points="1 4 1 10 7 10"/>
            <path d="M3.51 15a9 9 0 1 0 .49-3.1"/>
          </svg>
          {{ regenerating ? '재생성 중...' : '보고서 재생성' }}
        </button>
      </div>

      <!-- 요약 카드 -->
      <div class="report-summary-card">
        <div class="report-summary-card__label">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
          종합 요약
        </div>
        <p class="report-summary-card__text">{{ report.report.summary }}</p>
      </div>

      <!-- 평가 등급 표시 (있을 경우) -->
      <div v-if="gradeInfo" class="grade-row">
        <div class="grade-card" v-for="g in gradeInfo" :key="g.label">
          <p class="grade-card__label">{{ g.label }}</p>
          <div class="grade-bar">
            <div class="grade-bar__fill" :style="{ width: g.pct + '%', background: g.color }" />
          </div>
          <p class="grade-card__value" :style="{ color: g.color }">{{ g.value }}</p>
        </div>
      </div>

      <!-- 섹션들 -->
      <div class="report-sections">
        <div
          v-for="(section, i) in report.report.sections"
          :key="i"
          class="report-section"
          :class="{ 'report-section--open': openSections.has(i) }"
        >
          <button class="report-section__header" @click="toggleSection(i)">
            <div class="report-section__header-left">
              <span class="report-section__num">{{ String(i + 1).padStart(2, '0') }}</span>
              <span class="report-section__title">{{ section.title }}</span>
            </div>
            <svg
              class="report-section__chevron"
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
              :style="{ transform: openSections.has(i) ? 'rotate(180deg)' : 'rotate(0deg)' }"
            >
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </button>
          <Transition name="section-expand">
            <div v-if="openSections.has(i)" class="report-section__body">
              <p class="report-section__content">{{ section.content }}</p>
            </div>
          </Transition>
        </div>
      </div>

    </template>

    <!-- ── 미생성 상태 (Legal만 생성 트리거 가능) ── -->
    <div v-else class="report-empty">
      <div class="report-empty__icon">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="12" y1="13" x2="12" y2="17"/>
          <line x1="10" y1="15" x2="14" y2="15"/>
        </svg>
      </div>
      <p class="report-empty__title">AI 보고서가 없습니다</p>
      <p class="report-empty__desc">AI 분석을 시작하면 특허 가치 평가 보고서가 자동으로 생성됩니다.</p>
      <button v-if="isLegal" class="btn-generate" @click="handleGenerate">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polygon points="5 3 19 12 5 21 5 3"/>
        </svg>
        AI 분석 시작
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { patentsApi } from '@/api/patents'
import { usePolling } from '@/composables/usePolling'
import type { AiReport } from '@/types'

const props = defineProps<{ patentId: number }>()

const auth   = useAuthStore()
const isLegal = computed(() => auth.isLegal || auth.isAdmin)

const report      = ref<AiReport | null>(null)
const regenerating = ref(false)
const openSections = reactive(new Set<number>([0])) // 첫 섹션 기본 오픈

// ── 폴링 설정 ────────────────────────────────────────
const { status: pollingStatus, start: startPolling, reset: resetPolling } = usePolling({
  fetcher: async () => {
    const data = await patentsApi.getAiReport(props.patentId)
    return data
  },
  isDone: (r) => r.status === 'completed',
  isFailed: (r) => r.status === 'failed',
  interval: 3000,
})

// ── 생성 중 단계 애니메이션 ──────────────────────────
const generatingSteps = ['특허 원문 파싱', '기술 분야 분류', '유사 특허 검색', '가치 평가 산출', '보고서 작성']
const genStepIdx = ref(0)
let stepTimer: ReturnType<typeof setInterval> | null = null

function startStepAnimation() {
  genStepIdx.value = 0
  stepTimer = setInterval(() => {
    if (genStepIdx.value < generatingSteps.length - 1) genStepIdx.value++
  }, 2800)
}

function stopStepAnimation() {
  if (stepTimer) { clearInterval(stepTimer); stepTimer = null }
}

function genStepClass(i: number) {
  if (i < genStepIdx.value) return 'gen-step--done'
  if (i === genStepIdx.value) return 'gen-step--active'
  return ''
}

// ── 보고서 로드 ──────────────────────────────────────
async function loadReport() {
  try {
    const data = await patentsApi.getAiReport(props.patentId)
    if (data.status === 'completed') {
      report.value = data
    } else if (data.status === 'processing' || data.status === 'queued') {
      startStepAnimation()
      startPolling()
    }
  } catch {
    // 보고서 없음 → 미생성 상태로 유지
  }
}

// ── 생성 요청 ────────────────────────────────────────
async function handleGenerate() {
  try {
    await patentsApi.generateReport(props.patentId)
    resetPolling()
    startStepAnimation()
    startPolling()
  } catch (e) {
    console.error(e)
  }
}

// ── 재생성 ───────────────────────────────────────────
async function handleRegenerate() {
  regenerating.value = true
  try {
    await patentsApi.retryAiReport(props.patentId)
    report.value = null
    resetPolling()
    startStepAnimation()
    startPolling()
  } catch (e) {
    console.error(e)
  } finally {
    regenerating.value = false
  }
}

// ── 재시도 ───────────────────────────────────────────
async function handleRetry() {
  resetPolling()
  startStepAnimation()
  await handleGenerate()
}

// ── 폴링 완료 감지 ───────────────────────────────────
// usePolling의 result를 watch로 감지
import { watch } from 'vue'
const { result: pollingResult } = usePolling({
  fetcher: async () => patentsApi.getAiReport(props.patentId),
  isDone: (r) => r.status === 'completed',
  isFailed: (r) => r.status === 'failed',
  interval: 3000,
})

watch(pollingStatus, (val) => {
  if (val === 'done' && pollingResult.value) {
    stopStepAnimation()
    report.value = pollingResult.value as AiReport
  }
})

// ── 섹션 토글 ────────────────────────────────────────
function toggleSection(i: number) {
  if (openSections.has(i)) openSections.delete(i)
  else openSections.add(i)
}

// ── 등급 정보 파싱 (report에 grade 필드가 있을 경우) ──
const gradeInfo = computed(() => {
  const r = report.value?.report as any
  if (!r?.grade) return null
  return [
    { label: '기술성', value: r.grade.tech,    pct: r.grade.tech    * 10, color: '#6366f1' },
    { label: '권리성', value: r.grade.rights,  pct: r.grade.rights  * 10, color: '#0ea5e9' },
    { label: '사업성', value: r.grade.business,pct: r.grade.business* 10, color: '#10b981' },
  ]
})

function formatDate(d?: string) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

onMounted(loadReport)
</script>

<style scoped>
.ai-report {
  display: flex;
  flex-direction: column;
  gap: 16px;
  font-family: 'Pretendard', sans-serif;
}

/* ── 생성 중 ─────────────────────────────────────────── */
.report-generating {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 40px 24px;
  text-align: center;
}

.generating-visual {
  position: relative;
  width: 80px; height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
}

.generating-ring {
  position: absolute;
  border-radius: 50%;
  border: 2px solid transparent;
  border-top-color: var(--color-primary);
  animation: spin linear infinite;
}
.generating-ring--1 { width: 80px; height: 80px; animation-duration: 1.2s; border-top-color: rgba(99,102,241,0.8); }
.generating-ring--2 { width: 62px; height: 62px; animation-duration: 0.9s; animation-direction: reverse; border-top-color: rgba(99,102,241,0.4); }
.generating-ring--3 { width: 44px; height: 44px; animation-duration: 1.5s; border-top-color: rgba(99,102,241,0.2); }

.generating-core {
  position: relative;
  z-index: 1;
  width: 32px; height: 32px;
  background: var(--color-primary-bg);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

@keyframes spin { to { transform: rotate(360deg); } }

.generating-title { font-size: 16px; font-weight: 700; color: var(--color-text); margin: 0; }
.generating-desc  { font-size: 13px; color: var(--color-text-muted); margin: 0; line-height: 1.7; }

.generating-steps {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
  width: 100%;
  max-width: 280px;
}

.gen-step {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: var(--c-slate-300);
  transition: color 0.3s;
}
.gen-step--active { color: var(--color-primary); font-weight: 600; }
.gen-step--done   { color: var(--color-success); }

.gen-step__dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  background: currentColor;
  flex-shrink: 0;
  transition: background 0.3s;
}
.gen-step--active .gen-step__dot { box-shadow: 0 0 6px rgba(99,102,241,0.7); animation: pulseDot 1s ease-in-out infinite; }
@keyframes pulseDot { 0%,100% { transform: scale(1); } 50% { transform: scale(1.4); } }

/* ── 실패 ────────────────────────────────────────────── */
.report-failed {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 40px 24px;
  text-align: center;
}
.failed-icon { width: 52px; height: 52px; background: var(--color-danger-bg); border-radius: 14px; display: flex; align-items: center; justify-content: center; color: var(--color-danger); }
.failed-title { font-size: 15px; font-weight: 700; color: var(--color-text); margin: 0; }
.failed-desc  { font-size: 13px; color: var(--color-text-muted); margin: 0; }

.btn-retry {
  display: flex; align-items: center; gap: 7px;
  padding: 9px 20px;
  background: var(--color-surface); border: 1.5px solid var(--color-border); border-radius: 9px;
  font-size: 13.5px; font-weight: 600; font-family: inherit; cursor: pointer; color: var(--color-text-secondary);
  transition: background 0.13s, border-color 0.13s;
  margin-top: 4px;
}
.btn-retry:hover { background: var(--color-surface-hover); border-color: var(--c-slate-300); }

/* ── 메타 헤더 ───────────────────────────────────────── */
.report-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.report-meta__left { display: flex; align-items: center; gap: 10px; }

.report-meta__badge {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 4px 10px;
  background: var(--color-primary-bg); color: var(--color-primary-darker);
  border: 1px solid var(--c-primary-200); border-radius: 20px;
  font-size: 12px; font-weight: 600;
}
.report-meta__badge-dot {
  width: 6px; height: 6px; border-radius: 50%; background: var(--color-primary);
  box-shadow: 0 0 5px rgba(99,102,241,0.7);
}

.report-meta__date { font-size: 12.5px; color: var(--color-text-subtle); }

.btn-regenerate {
  display: flex; align-items: center; gap: 6px;
  padding: 7px 14px;
  background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 8px;
  font-size: 12.5px; font-weight: 600; font-family: inherit; cursor: pointer; color: var(--c-slate-600);
  transition: background 0.13s;
}
.btn-regenerate:hover:not(:disabled) { background: var(--color-surface-hover); }
.btn-regenerate:disabled { opacity: 0.5; cursor: not-allowed; }
.spinning { animation: spin 0.8s linear infinite; }

/* ── 요약 카드 ───────────────────────────────────────── */
.report-summary-card {
  background: linear-gradient(135deg, var(--color-surface-soft) 0%, #f5f7ff 100%);
  border: 1px solid var(--color-primary-border);
  border-radius: 12px;
  padding: 18px 20px;
}

.report-summary-card__label {
  display: flex; align-items: center; gap: 6px;
  font-size: 12px; font-weight: 700; color: var(--color-primary);
  text-transform: uppercase; letter-spacing: 0.06em;
  margin-bottom: 10px;
}

.report-summary-card__text {
  font-size: 14px; color: var(--color-navy-hover); line-height: 1.75; margin: 0;
}

/* ── 등급 바 ─────────────────────────────────────────── */
.grade-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.grade-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 14px 16px;
}

.grade-card__label {
  font-size: 11.5px; font-weight: 600; color: var(--color-text-muted);
  margin: 0 0 8px;
}

.grade-bar {
  height: 5px; background: var(--color-surface-muted); border-radius: 3px; overflow: hidden; margin-bottom: 6px;
}

.grade-bar__fill {
  height: 100%; border-radius: 3px;
  transition: width 0.6s cubic-bezier(0.4,0,0.2,1);
}

.grade-card__value {
  font-size: 18px; font-weight: 700; margin: 0;
}

/* ── 섹션 ────────────────────────────────────────────── */
.report-sections {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.report-section {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  overflow: hidden;
  transition: border-color 0.15s;
}
.report-section--open { border-color: var(--c-primary-200); }

.report-section__header {
  width: 100%;
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 16px;
  background: none; border: none; cursor: pointer;
  text-align: left;
  transition: background 0.12s;
}
.report-section__header:hover { background: var(--color-surface-soft); }

.report-section__header-left { display: flex; align-items: center; gap: 12px; }

.report-section__num {
  font-size: 11px; font-weight: 700; color: var(--color-primary);
  font-family: 'JetBrains Mono', monospace;
  background: var(--color-primary-bg); border-radius: 5px;
  padding: 2px 6px;
}

.report-section__title { font-size: 14px; font-weight: 600; color: var(--color-text); }

.report-section__chevron { color: var(--color-text-subtle); transition: transform 0.2s cubic-bezier(0.4,0,0.2,1); flex-shrink: 0; }

.report-section__body { padding: 0 16px 16px; }

.report-section__content {
  font-size: 13.5px; color: var(--color-text-secondary); line-height: 1.8; margin: 0;
  white-space: pre-wrap;
}

/* 섹션 전환 */
.section-expand-enter-active { transition: max-height 0.25s ease, opacity 0.2s; max-height: 800px; }
.section-expand-leave-active { transition: max-height 0.2s ease, opacity 0.15s; }
.section-expand-enter-from  { max-height: 0; opacity: 0; }
.section-expand-leave-to    { max-height: 0; opacity: 0; }

/* ── 미생성 ──────────────────────────────────────────── */
.report-empty {
  display: flex; flex-direction: column; align-items: center;
  gap: 10px; padding: 48px 24px; text-align: center;
}

.report-empty__icon {
  width: 60px; height: 60px;
  background: var(--color-surface-muted); border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  color: var(--color-text-subtle); margin-bottom: 4px;
}

.report-empty__title { font-size: 15px; font-weight: 600; color: var(--color-text-secondary); margin: 0; }
.report-empty__desc  { font-size: 13px; color: var(--color-text-subtle); margin: 0; }

.btn-generate {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 22px;
  background: linear-gradient(135deg, var(--color-primary-dark), var(--color-primary));
  color: var(--color-surface); border: none; border-radius: 10px;
  font-size: 13.5px; font-weight: 600; font-family: inherit; cursor: pointer;
  box-shadow: 0 4px 14px rgba(79,70,229,0.3);
  transition: opacity 0.13s, transform 0.12s;
  margin-top: 6px;
}
.btn-generate:hover { opacity: 0.9; transform: translateY(-1px); }
</style>
