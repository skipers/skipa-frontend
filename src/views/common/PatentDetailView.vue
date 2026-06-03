<template>
  <div class="detail-page">

    <!-- 접근 권한 없음 -->
    <div v-if="accessDenied" class="access-denied">
      <div class="access-denied__icon">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
        </svg>
      </div>
      <h2 class="access-denied__title">접근 권한이 없습니다</h2>
      <p class="access-denied__desc">담당 사업부의 특허만 접근할 수 있습니다.</p>
      <button class="back-btn back-btn--center" @click="$router.back()">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M15 18l-6-6 6-6"/>
        </svg>
        목록으로 돌아가기
      </button>
    </div>

    <!-- 특허 없음 -->
    <div v-else-if="!patent" class="access-denied">
      <div class="access-denied__icon" style="background:#f1f5f9;color:#94a3b8">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
      </div>
      <h2 class="access-denied__title">특허를 찾을 수 없습니다</h2>
      <p class="access-denied__desc">요청한 특허가 존재하지 않습니다.</p>
      <button class="back-btn back-btn--center" @click="$router.back()">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M15 18l-6-6 6-6"/>
        </svg>
        목록으로 돌아가기
      </button>
    </div>

    <template v-else>

      <!-- ── 고정 헤더 블록 ── -->
      <div class="sticky-header-block" ref="stickyBlock">

        <div class="detail-header">
          <button class="back-btn" @click="$router.back()">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
            목록으로
          </button>

          <div class="detail-header__main">
            <div class="detail-header__title-row">
              <div class="detail-header__title-area">
                <h1 class="detail-title">{{ patent.title }}</h1>
                <div class="detail-header__meta">
                  <span class="mono meta-app-num">{{ patent.applicationNumber }}</span>
                  <PatentStatusBadge :status="patent.status" />
                  <span class="meta-chip">{{ patentCountry }}</span>
                  <span class="meta-chip meta-chip--dept">{{ patent.dept }}</span>
                </div>
              </div>
              <div v-if="patent.grade" class="grade-badge" :class="`grade-badge--${patent.grade.toLowerCase()}`">
                <span class="grade-badge__label">AI 종합 등급</span>
                <span class="grade-badge__value">{{ patent.grade }}</span>
              </div>
              <div v-else class="grade-badge grade-badge--none">
                <span class="grade-badge__label">AI 종합 등급</span>
                <span class="grade-badge__value" style="font-size:18px;color:#94a3b8">—</span>
              </div>
            </div>
          </div>
        </div>

        <!-- ── 탭 ── -->
        <div class="tabs">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            class="tab"
            :class="{ 'tab--active': activeTab === tab.key }"
            @click="scrollToSection(tab.key)"
          >
            {{ tab.label }}
          </button>
        </div>

      </div><!-- /sticky-header-block -->

      <!-- ── 섹션 본문 ── -->
      <div class="sections-body">

        <!-- ── 섹션 1: 특허 원문 ── -->
        <section id="section-info" data-section="info" class="content-section">
          <div class="section-header">
            <h2 class="section-heading">특허 원문</h2>
          </div>

          <div class="info-section">
            <h3 class="info-section__title">기본 정보</h3>
            <div class="info-grid-2col">
              <div class="info-item">
                <p class="info-item__label">특허번호 (출원번호)</p>
                <p class="info-item__value mono">{{ patent.applicationNumber }}</p>
              </div>
              <div class="info-item">
                <p class="info-item__label">출원인</p>
                <p class="info-item__value">SKIPA 주식회사</p>
              </div>
              <div class="info-item">
                <p class="info-item__label">발명자</p>
                <p class="info-item__value">{{ detailExtras.inventor }}</p>
              </div>
              <div class="info-item">
                <p class="info-item__label">IPC 분류</p>
                <p class="info-item__value mono">{{ detailExtras.ipcCode }}</p>
              </div>
              <div class="info-item">
                <p class="info-item__label">출원일</p>
                <p class="info-item__value">{{ formatDate(patent.applicationDate) }}</p>
              </div>
              <div class="info-item">
                <p class="info-item__label">등록일</p>
                <p class="info-item__value">{{ detailExtras.registrationDate }}</p>
              </div>
              <div class="info-item">
                <p class="info-item__label">만료일</p>
                <p class="info-item__value" :class="expiryClass">{{ formatDate(patent.expiryDate) }}</p>
              </div>
              <div class="info-item">
                <p class="info-item__label">키워드 (AI 추출)</p>
                <div class="kw-chip-row">
                  <span v-for="kw in patent.tags" :key="kw" class="kw-chip"># {{ kw }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="info-section">
            <h3 class="info-section__title">발명의 요약</h3>
            <p class="info-text">{{ detailExtras.summary }}</p>
          </div>

          <div class="info-section" style="margin-bottom:0">
            <h3 class="info-section__title">청구항</h3>
            <ol class="claims-list">
              <li v-for="(claim, i) in detailExtras.claims" :key="i" class="claims-list__item">
                <span class="claim-num">{{ i + 1 }}.</span>
                <span>{{ claim }}</span>
              </li>
            </ol>
          </div>
        </section>

        <div class="section-divider"></div>

        <!-- ── 섹션 2: AI 평가 보고서 ── -->
        <section id="section-report" data-section="report" class="content-section">
          <div class="section-header">
            <h2 class="section-heading">AI 평가 보고서</h2>
          </div>

          <template v-if="patent.grade">
            <div class="grade-card" :class="`grade-card--${patent.grade.toLowerCase()}`">
              <div class="grade-card__left">
                <p class="grade-card__label">AI 종합 평가 등급</p>
                <div class="grade-card__grade">{{ patent.grade }}</div>
                <p class="grade-card__opinion">{{ patent.aiOpinion ?? '—' }}</p>
              </div>
              <div class="grade-card__scores">
                <div class="grade-mini-score" v-for="s in miniScores" :key="s.label">
                  <span class="grade-mini-score__label">{{ s.label }}</span>
                  <span class="grade-mini-score__value">{{ s.value }}</span>
                </div>
              </div>
            </div>

            <div class="report-section">
              <div class="report-section__header">
                <div class="report-section__title-row">
                  <span class="report-section__icon report-section__icon--tech">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
                  </span>
                  <span class="report-section__name">기술성</span>
                  <span class="report-section__score">{{ aiScores.tech }}<span class="report-section__score-max">/100</span></span>
                </div>
                <div class="gauge-bar">
                  <div class="gauge-bar__fill gauge-bar__fill--tech" :style="{ width: aiScores.tech + '%' }" />
                </div>
              </div>
              <p class="report-section__comment">{{ aiComments.tech }}</p>
            </div>

            <div class="report-section">
              <div class="report-section__header">
                <div class="report-section__title-row">
                  <span class="report-section__icon report-section__icon--rights">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  </span>
                  <span class="report-section__name">권리성</span>
                  <span class="report-section__score">{{ aiScores.rights }}<span class="report-section__score-max">/100</span></span>
                </div>
                <div class="gauge-bar">
                  <div class="gauge-bar__fill gauge-bar__fill--rights" :style="{ width: aiScores.rights + '%' }" />
                </div>
              </div>
              <p class="report-section__comment">{{ aiComments.rights }}</p>
            </div>

            <div class="report-section">
              <div class="report-section__header">
                <div class="report-section__title-row">
                  <span class="report-section__icon report-section__icon--biz">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
                  </span>
                  <span class="report-section__name">사업성</span>
                  <span class="report-section__score">{{ aiScores.biz }}<span class="report-section__score-max">/100</span></span>
                </div>
                <div class="gauge-bar">
                  <div class="gauge-bar__fill gauge-bar__fill--biz" :style="{ width: aiScores.biz + '%' }" />
                </div>
              </div>
              <p class="report-section__comment">{{ aiComments.biz }}</p>
            </div>

            <div v-if="isLegal" class="biz-comment-card">
              <p class="biz-comment-card__title">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                사업부 제출 코멘트
              </p>
              <p class="biz-comment-card__text">{{ aiComments.bizSubmit }}</p>
            </div>
          </template>

          <div v-else class="empty-section">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
            <p>AI 평가 보고서가 아직 생성되지 않았습니다.</p>
          </div>
        </section>

        <div class="section-divider"></div>

        <!-- ── 섹션 3: 유사 특허 분석 ── -->
        <section id="section-similar" data-section="similar" class="content-section">
          <div class="section-header">
            <h2 class="section-heading">유사 특허 분석</h2>
            <span class="similar-count">{{ MOCK_SIMILAR_PATENTS.length }}건 검색됨</span>
          </div>
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th style="width:140px">유사도 점수</th>
                  <th style="width:180px">출원번호</th>
                  <th>특허명</th>
                  <th>출원인</th>
                  <th style="width:100px">출원일</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="s in MOCK_SIMILAR_PATENTS" :key="s.id">
                  <td>
                    <div class="similarity-cell">
                      <span class="similarity-score" :class="similarityClass(s.similarityScore)">{{ s.similarityScore }}%</span>
                      <div class="mini-gauge">
                        <div class="mini-gauge__fill" :class="similarityClass(s.similarityScore)" :style="{ width: s.similarityScore + '%' }" />
                      </div>
                    </div>
                  </td>
                  <td><span class="mono text-muted-sm">{{ s.applicationNumber }}</span></td>
                  <td><span class="similar-title">{{ s.title }}</span></td>
                  <td><span class="similar-applicant">{{ s.applicant }}</span></td>
                  <td><span class="text-muted-sm">{{ formatDate(s.applicationDate) }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <div class="section-divider"></div>

        <!-- ── 섹션 4: 사내 프로젝트 연관 정보 ── -->
        <section id="section-projects" data-section="projects" class="content-section">
          <div class="section-header">
            <h2 class="section-heading">사내 프로젝트 연관 정보</h2>
            <span class="similar-count">{{ MOCK_RELATED_PROJECTS.length }}건</span>
          </div>
          <div class="project-cards">
            <div v-for="proj in MOCK_RELATED_PROJECTS" :key="proj.id" class="project-card">
              <div class="project-card__header">
                <div class="project-card__title-row">
                  <span class="project-card__icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
                  </span>
                  <h4 class="project-card__name">{{ proj.projectName }}</h4>
                </div>
                <div class="project-card__meta">
                  <span class="project-dept">{{ proj.department }}</span>
                  <span class="relevance-badge" :class="`relevance-badge--${relevanceClass(proj.relevance)}`">
                    연관도 {{ proj.relevance }}
                  </span>
                </div>
              </div>
              <p class="project-card__desc">{{ proj.description }}</p>
            </div>
          </div>
        </section>

        <div class="section-divider"></div>

        <!-- ── 섹션 5: 유지/포기 의견 제출 ── -->
        <section id="section-opinion" data-section="opinion" class="content-section">
          <div class="section-header">
            <h2 class="section-heading">유지/포기 의견 제출</h2>
          </div>

          <!-- 사업부 -->
          <template v-if="isBusiness">
            <div v-if="submittedOpinion" class="opinion-done">
              <div class="opinion-done__header">
                <div class="opinion-done__badge" :class="`opinion-done__badge--${submittedOpinion.decision.toLowerCase()}`">
                  {{ submittedOpinion.decision === 'KEEP' ? '유지' : '포기' }}
                </div>
                <div>
                  <p class="opinion-done__label">제출 완료</p>
                  <p class="opinion-done__date">{{ formatDate(submittedOpinion.submittedAt) }} 제출</p>
                </div>
              </div>
              <div v-if="submittedOpinion.comment" class="opinion-done__comment">
                <p class="opinion-done__comment-label">제출 의견</p>
                <p class="opinion-done__comment-text">{{ submittedOpinion.comment }}</p>
              </div>
              <div class="opinion-done__notice">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                이미 제출된 의견은 수정할 수 없습니다. 변경이 필요한 경우 Legal팀에 문의하세요.
              </div>
            </div>

            <div v-else-if="opinionAssigned" class="opinion-form">
              <p class="opinion-form__desc">이번 분기 재평가 요청에 대한 의견을 제출해 주세요.</p>

              <div class="radio-group">
                <label
                  v-for="opt in opinionOptions"
                  :key="opt.value"
                  class="radio-card"
                  :class="[`radio-card--${opt.value.toLowerCase()}`, { 'radio-card--selected': opinionForm.decision === opt.value }]"
                >
                  <input type="radio" :value="opt.value" v-model="opinionForm.decision" class="radio-input" />
                  <span class="radio-indicator"></span>
                  <span class="radio-card__label">{{ opt.label }}</span>
                </label>
              </div>

              <div class="opinion-textarea-wrap">
                <label class="field__label">검토 의견</label>
                <textarea
                  v-model="opinionForm.comment"
                  class="opinion-textarea"
                  placeholder="유지 또는 포기 결정에 대한 상세 의견을 입력하세요..."
                  rows="4"
                />
                <p class="field__hint">* 유지/포기 선택은 필수, 의견 작성은 선택입니다.</p>
              </div>

              <button
                class="btn-submit-opinion"
                :disabled="!opinionForm.decision || opinionSubmitting"
                @click="submitOpinion"
              >
                <span v-if="opinionSubmitting" class="spinner-sm" />
                의견 제출
              </button>
            </div>

            <div v-else class="empty-section">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
              <p>이 특허에 대한 검토 요청이 아직 발송되지 않았습니다.</p>
            </div>
          </template>

          <!-- Legal: 읽기 전용 -->
          <template v-else-if="isLegal">
            <div class="legal-opinion-view">
              <div class="legal-opinion-view__header">
                <h3 class="info-section__title" style="margin:0">사업부 제출 현황</h3>
                <span class="similar-count">{{ patent.dept }}</span>
              </div>

              <template v-if="reevalRecord">
                <div v-if="reevalRecord.decision" class="opinion-done">
                  <div class="opinion-done__header">
                    <div class="opinion-done__badge" :class="`opinion-done__badge--${reevalRecord.decision.toLowerCase()}`">
                      {{ reevalRecord.decision === 'KEEP' ? '유지' : '포기' }}
                    </div>
                    <div>
                      <p class="opinion-done__label">제출 완료</p>
                      <p class="opinion-done__date">{{ formatDate(reevalRecord.decidedAt) }} 제출</p>
                    </div>
                  </div>
                  <div class="opinion-done__comment">
                    <p class="opinion-done__comment-label">제출 의견</p>
                    <p class="opinion-done__comment-text">{{ aiComments.bizSubmit }}</p>
                  </div>
                </div>
                <div v-else class="opinion-pending">
                  <div class="opinion-pending__icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  </div>
                  <div>
                    <p class="opinion-pending__text">제출 대기 중</p>
                    <p class="opinion-pending__sub">기한: {{ formatDate(reevalRecord.dueDate) }}</p>
                  </div>
                  <span v-if="reevalRecord.isOverdue" class="overdue-badge">기한 초과</span>
                </div>
              </template>

              <div v-else class="empty-section">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
                <p>검토 요청이 발송되지 않은 특허입니다.</p>
              </div>
            </div>
          </template>

        </section>

      </div><!-- /sections-body -->

    </template>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, reactive } from 'vue'
import { useAuthStore } from '@/stores/auth'
import PatentStatusBadge from '@/components/patent/PatentStatusBadge.vue'
import {
  MOCK_PATENTS, MOCK_REEVAL, MOCK_SIMILAR_PATENTS, MOCK_RELATED_PROJECTS,
  PATENT_INVENTORS, TECH_FIELD_IPC, COUNTRY_LABEL, TECH_FIELD_SUMMARY,
  TECH_FIELD_CLAIMS, AI_REPORT_COMMENTS, AI_GRADE_SCORES, DEPT_MAP,
} from '@/mocks/data'

const props = defineProps<{ patentId: number }>()
const auth  = useAuthStore()

const isLegal    = computed(() => auth.isLegal || auth.isAdmin)
const isBusiness = computed(() => auth.isBusiness)
const myDept     = computed(() => DEPT_MAP[auth.user?.departmentId ?? 0] ?? null)

// ── 특허 데이터 ──────────────────────────────────────
const patent = computed(() => MOCK_PATENTS.find(p => p.id === props.patentId) ?? null)

const accessDenied = computed(() => {
  if (!patent.value) return false
  if (isLegal.value) return false
  if (isBusiness.value) return patent.value.dept !== myDept.value
  return false
})

// ── 국가 표시 ────────────────────────────────────────
const patentCountry = computed(() => {
  if (!patent.value) return ''
  const code = patent.value.applicationNumber.split('-')[0]
  return COUNTRY_LABEL[code] ?? code
})

// ── 상세 보조 데이터 ─────────────────────────────────
const detailExtras = computed(() => {
  const p = patent.value
  if (!p) return { inventor: '', ipcCode: '', registrationDate: '—', summary: '', claims: [] }
  const regDate = addMonths(p.applicationDate, 18)
  return {
    inventor: PATENT_INVENTORS[p.id] ?? '—',
    ipcCode: TECH_FIELD_IPC[p.techField] ?? '—',
    registrationDate: p.status === 'REGISTERED' || p.status === 'EXPIRING_SOON' ? formatDate(regDate) : '—',
    summary: TECH_FIELD_SUMMARY[p.techField] ?? '',
    claims: TECH_FIELD_CLAIMS[p.techField] ?? [],
  }
})

function addMonths(dateStr: string, months: number) {
  const d = new Date(dateStr)
  d.setMonth(d.getMonth() + months)
  return d.toISOString().slice(0, 10)
}

// ── AI 점수 / 코멘트 ─────────────────────────────────
const aiScores = computed(() => {
  const g = patent.value?.grade
  if (!g) return { tech: 0, rights: 0, biz: 0 }
  const base = AI_GRADE_SCORES[g] ?? { tech: 50, rights: 50, biz: 50 }
  const v = (props.patentId % 7) - 3
  return {
    tech: Math.min(99, Math.max(1, base.tech + v)),
    rights: Math.min(99, Math.max(1, base.rights + Math.round(v * 0.7))),
    biz: Math.min(99, Math.max(1, base.biz + Math.round(v * 0.5))),
  }
})

const aiComments = computed(() => {
  const g = patent.value?.grade
  if (!g) return { tech: '', rights: '', biz: '', bizSubmit: '' }
  return AI_REPORT_COMMENTS[g] ?? AI_REPORT_COMMENTS['B']
})

const miniScores = computed(() => [
  { label: '기술성', value: aiScores.value.tech },
  { label: '권리성', value: aiScores.value.rights },
  { label: '사업성', value: aiScores.value.biz },
])

// ── 재평가 레코드 ────────────────────────────────────
const reevalRecord = computed(() => {
  if (!patent.value) return null
  return MOCK_REEVAL.find(r => r.patentId === props.patentId) ?? null
})

const opinionAssigned = computed(() => {
  const r = reevalRecord.value
  return r && (r.reviewStatus === 'requested' || r.reviewStatus === 'overdue' || r.reviewStatus === 'done')
})

// ── 만료일 강조 ──────────────────────────────────────
const expiryClass = computed(() => {
  if (!patent.value?.expiryDate) return ''
  const diff = (new Date(patent.value.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  if (diff < 0) return 'text-expired'
  if (diff < 365) return 'text-expiring'
  return ''
})

// ── 탭 & 스크롤 스파이 ───────────────────────────────
const activeTab  = ref('info')
const stickyBlock = ref<HTMLElement | null>(null)

const tabs = [
  { key: 'info',     label: '특허 원문' },
  { key: 'report',   label: 'AI 평가 보고서' },
  { key: 'similar',  label: '유사 특허 분석' },
  { key: 'projects', label: '사내 프로젝트 연관 정보' },
  { key: 'opinion',  label: '유지/포기 의견 제출' },
]

function scrollToSection(key: string) {
  const el = document.getElementById(`section-${key}`)
  if (!el) return
  const offset = stickyBlock.value?.offsetHeight ?? 0
  const top = el.getBoundingClientRect().top + window.scrollY - offset
  window.scrollTo({ top, behavior: 'smooth' })
}

let observer: IntersectionObserver | null = null

function setupObserver() {
  const offset = stickyBlock.value?.offsetHeight ?? 0

  // 탭 순서대로 교차 중인 섹션 중 가장 위에 있는 것을 활성화
  const intersecting = new Set<string>()

  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const key = (entry.target as HTMLElement).dataset.section
        if (!key) continue
        if (entry.isIntersecting) intersecting.add(key)
        else intersecting.delete(key)
      }
      for (const tab of tabs) {
        if (intersecting.has(tab.key)) {
          activeTab.value = tab.key
          break
        }
      }
    },
    {
      rootMargin: `-${offset + 2}px 0px -55% 0px`,
      threshold: 0,
    }
  )

  for (const tab of tabs) {
    const el = document.getElementById(`section-${tab.key}`)
    if (el) observer.observe(el)
  }
}

// ── 의견 제출 ────────────────────────────────────────
interface SubmittedOpinion { decision: 'KEEP' | 'DISPOSE'; comment: string; submittedAt: string }
const submittedOpinion = ref<SubmittedOpinion | null>(null)
const opinionForm = reactive<{ decision: 'KEEP' | 'DISPOSE' | ''; comment: string }>({ decision: '', comment: '' })
const opinionSubmitting = ref(false)

const opinionOptions = [
  { value: 'KEEP',    label: '유지' },
  { value: 'DISPOSE', label: '포기' },
]

onMounted(async () => {
  await nextTick()

  if (patent.value) {
    const r = MOCK_REEVAL.find(rv => rv.patentId === props.patentId && rv.decision !== null)
    if (r && isBusiness.value) {
      submittedOpinion.value = {
        decision: r.decision as 'KEEP' | 'DISPOSE',
        comment: aiComments.value.bizSubmit,
        submittedAt: r.decidedAt ?? '',
      }
    }
  }

  setupObserver()
})

onUnmounted(() => {
  observer?.disconnect()
})

async function submitOpinion() {
  if (!opinionForm.decision) return
  opinionSubmitting.value = true
  await new Promise(r => setTimeout(r, 600))
  submittedOpinion.value = {
    decision: opinionForm.decision as 'KEEP' | 'DISPOSE',
    comment: opinionForm.comment,
    submittedAt: new Date().toISOString().slice(0, 10),
  }
  opinionSubmitting.value = false
}

// ── 유틸 ────────────────────────────────────────────
function formatDate(d?: string | null) {
  if (!d) return '—'
  return d.slice(0, 10).replace(/-/g, '.')
}

function similarityClass(score: number) {
  if (score >= 85) return 'high'
  if (score >= 70) return 'mid'
  return 'low'
}

function relevanceClass(r: '상' | '중' | '하') {
  return r === '상' ? 'high' : r === '중' ? 'mid' : 'low'
}
</script>

<style scoped>
.detail-page {
  font-family: 'Pretendard', sans-serif;
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* ── 고정 헤더 블록 ────────────────────────────────── */
.sticky-header-block {
  position: sticky;
  top: 0;
  z-index: 20;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ── 접근 거부 / 없음 ─────────────────────────────── */
.access-denied {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 80px 24px; gap: 12px; text-align: center;
}
.access-denied__icon {
  width: 64px; height: 64px; border-radius: 16px;
  background: #fef2f2; color: #ef4444;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 8px;
}
.access-denied__title { font-size: 20px; font-weight: 700; color: #0f172a; margin: 0; }
.access-denied__desc  { font-size: 14px; color: #64748b; margin: 0; }

/* ── 뒤로가기 버튼 ────────────────────────────────── */
.back-btn {
  display: inline-flex; align-items: center; gap: 6px;
  background: none; border: none; cursor: pointer;
  font-size: 13px; font-weight: 500; color: #64748b; font-family: inherit;
  padding: 6px 0; transition: color 0.13s;
}
.back-btn:hover { color: #0f172a; }
.back-btn--center { margin-top: 8px; padding: 10px 20px; background: #f1f5f9; border-radius: 9px; color: #374151; }

/* ── 상단 헤더 ───────────────────────────────────── */
.detail-header { display: flex; flex-direction: column; gap: 14px; }

.detail-header__main { background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 22px 24px; }

.detail-header__title-row {
  display: flex; align-items: flex-start; gap: 20px;
}

.detail-header__title-area { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 10px; }

.detail-title {
  font-size: 22px; font-weight: 700; color: #0f172a;
  line-height: 1.35; letter-spacing: -0.02em; margin: 0;
}

.detail-header__meta {
  display: flex; flex-wrap: wrap; align-items: center; gap: 8px;
}

.meta-app-num {
  font-family: 'JetBrains Mono', 'Consolas', monospace;
  font-size: 12.5px; color: #475569;
  background: #f1f5f9; padding: 3px 8px; border-radius: 6px;
}

.meta-chip {
  display: inline-flex; align-items: center;
  padding: 3px 9px;
  background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 20px;
  font-size: 12px; font-weight: 500; color: #475569;
}
.meta-chip--dept { background: #eef2ff; border-color: #c7d2fe; color: #4338ca; }

/* ── 등급 배지 ───────────────────────────────────── */
.grade-badge {
  flex-shrink: 0;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;
  width: 88px; min-height: 88px;
  border-radius: 14px; padding: 14px 12px;
  border: 2px solid transparent;
}
.grade-badge__label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; opacity: 0.7; }
.grade-badge__value { font-size: 44px; font-weight: 900; line-height: 1; }

.grade-badge--s { background: linear-gradient(135deg, #dcfce7, #bbf7d0); border-color: #86efac; color: #14532d; }
.grade-badge--a { background: linear-gradient(135deg, #dbeafe, #bfdbfe); border-color: #93c5fd; color: #1e3a8a; }
.grade-badge--b { background: linear-gradient(135deg, #fff7ed, #fed7aa); border-color: #fdba74; color: #7c2d12; }
.grade-badge--c { background: linear-gradient(135deg, #f1f5f9, #e2e8f0); border-color: #cbd5e1; color: #475569; }
.grade-badge--none { background: #f8fafc; border-color: #e2e8f0; color: #94a3b8; }

/* ── 탭 ──────────────────────────────────────────── */
.tabs {
  display: flex; gap: 0;
  border-bottom: 1.5px solid #e2e8f0;
  overflow-x: auto;
  background: #f8fafc;
}
.tabs::-webkit-scrollbar { display: none; }

.tab {
  flex-shrink: 0;
  padding: 12px 18px;
  background: none; border: none; cursor: pointer;
  font-size: 13.5px; font-weight: 500; font-family: inherit; color: #64748b;
  position: relative; transition: color 0.13s; white-space: nowrap;
}
.tab:hover { color: #0f172a; }
.tab--active { color: #4f46e5; font-weight: 700; }
.tab--active::after {
  content: '';
  position: absolute; bottom: -1.5px; left: 0; right: 0;
  height: 2px; background: #4f46e5; border-radius: 2px 2px 0 0;
}

/* ── 섹션 본문 ───────────────────────────────────── */
.sections-body {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-top: none;
  border-radius: 0 0 16px 16px;
  overflow: hidden;
  margin-bottom: 20px;
}

.content-section {
  padding: 32px 28px;
}

.section-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 24px;
}

.section-heading {
  font-size: 15px; font-weight: 700; color: #0f172a;
  letter-spacing: -0.01em; margin: 0;
}

.section-divider {
  height: 1px;
  background: #e2e8f0;
  margin: 0;
}

/* ── 정보 섹션 ───────────────────────────────────── */
.info-section { margin-bottom: 32px; }
.info-section:last-child { margin-bottom: 0; }

.info-section__title {
  font-size: 11.5px; font-weight: 700; color: #94a3b8;
  text-transform: uppercase; letter-spacing: 0.07em;
  margin: 0 0 16px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f1f5f9;
}

.info-grid-2col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px 32px;
}

@media (max-width: 680px) { .info-grid-2col { grid-template-columns: 1fr; } }

.info-item {}
.info-item__label {
  font-size: 11.5px; font-weight: 600; color: #94a3b8;
  margin: 0 0 5px; text-transform: uppercase; letter-spacing: 0.04em;
}
.info-item__value { font-size: 14px; color: #0f172a; margin: 0; font-weight: 500; }
.mono { font-family: 'JetBrains Mono', 'Consolas', monospace; font-size: 12.5px; }
.text-expired  { color: #dc2626; font-weight: 600; }
.text-expiring { color: #b45309; font-weight: 600; }

.kw-chip-row { display: flex; flex-wrap: wrap; gap: 5px; }
.kw-chip {
  padding: 3px 9px;
  background: #eef2ff; border-radius: 6px;
  font-size: 12px; font-weight: 500; color: #4338ca;
}

.info-text { font-size: 14px; line-height: 1.85; color: #374151; margin: 0; }

/* ── 청구항 ──────────────────────────────────────── */
.claims-list {
  list-style: none; margin: 0; padding: 0;
  display: flex; flex-direction: column; gap: 14px;
}
.claims-list__item {
  display: flex; gap: 10px;
  font-size: 13.5px; line-height: 1.8; color: #374151;
  padding: 14px 16px;
  background: #f8fafc; border-radius: 10px; border: 1px solid #f1f5f9;
}
.claim-num {
  flex-shrink: 0; font-weight: 700; color: #4f46e5;
  font-size: 13px; margin-top: 1px; min-width: 20px;
}

/* ── AI 평가 보고서 ──────────────────────────────── */
.grade-card {
  display: flex; align-items: stretch; gap: 0;
  border-radius: 14px; overflow: hidden;
  margin-bottom: 24px;
  border: 1.5px solid #e2e8f0;
}
.grade-card--s { border-color: #86efac; }
.grade-card--a { border-color: #93c5fd; }
.grade-card--b { border-color: #fdba74; }
.grade-card--c { border-color: #cbd5e1; }

.grade-card__left {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 6px; padding: 24px 32px; min-width: 140px;
}
.grade-card--s .grade-card__left { background: linear-gradient(135deg, #f0fdf4, #dcfce7); }
.grade-card--a .grade-card__left { background: linear-gradient(135deg, #eff6ff, #dbeafe); }
.grade-card--b .grade-card__left { background: linear-gradient(135deg, #fff7ed, #ffedd5); }
.grade-card--c .grade-card__left { background: linear-gradient(135deg, #f8fafc, #f1f5f9); }

.grade-card__label { font-size: 10.5px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.06em; }
.grade-card__grade { font-size: 52px; font-weight: 900; line-height: 1; }
.grade-card--s .grade-card__grade { color: #14532d; }
.grade-card--a .grade-card__grade { color: #1e3a8a; }
.grade-card--b .grade-card__grade { color: #7c2d12; }
.grade-card--c .grade-card__grade { color: #475569; }
.grade-card__opinion { font-size: 12px; font-weight: 600; color: #64748b; }

.grade-card__scores {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 0;
  padding: 20px 32px; background: #fff;
  border-left: 1.5px solid #f1f5f9;
}
.grade-mini-score {
  flex: 1; display: flex; flex-direction: column; align-items: center; gap: 5px;
  padding: 0 16px; border-right: 1px solid #f1f5f9;
}
.grade-mini-score:last-child { border-right: none; }
.grade-mini-score__label { font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.04em; }
.grade-mini-score__value { font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.02em; }

.report-section {
  padding: 20px 0;
  border-bottom: 1px solid #f1f5f9;
}
.report-section:last-of-type { border-bottom: none; }

.report-section__header { margin-bottom: 10px; }
.report-section__title-row {
  display: flex; align-items: center; gap: 10px; margin-bottom: 10px;
}
.report-section__icon {
  width: 28px; height: 28px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.report-section__icon--tech   { background: #eef2ff; color: #4f46e5; }
.report-section__icon--rights { background: #f0fdf4; color: #16a34a; }
.report-section__icon--biz    { background: #fff7ed; color: #ea580c; }

.report-section__name { font-size: 14px; font-weight: 700; color: #0f172a; flex: 1; }
.report-section__score { font-size: 22px; font-weight: 800; color: #0f172a; letter-spacing: -0.02em; }
.report-section__score-max { font-size: 12px; font-weight: 500; color: #94a3b8; }

.gauge-bar { height: 8px; background: #f1f5f9; border-radius: 99px; overflow: hidden; }
.gauge-bar__fill { height: 100%; border-radius: 99px; transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1); }
.gauge-bar__fill--tech   { background: linear-gradient(90deg, #6366f1, #818cf8); }
.gauge-bar__fill--rights { background: linear-gradient(90deg, #22c55e, #4ade80); }
.gauge-bar__fill--biz    { background: linear-gradient(90deg, #f97316, #fb923c); }

.report-section__comment { font-size: 13.5px; line-height: 1.8; color: #475569; margin: 0; }

.biz-comment-card {
  margin-top: 24px; padding: 18px 20px;
  background: #fafbff; border: 1px solid #c7d2fe; border-radius: 12px;
  display: flex; flex-direction: column; gap: 10px;
}
.biz-comment-card__title {
  display: flex; align-items: center; gap: 7px;
  font-size: 12px; font-weight: 700; color: #4338ca;
  text-transform: uppercase; letter-spacing: 0.06em; margin: 0;
}
.biz-comment-card__text { font-size: 13.5px; line-height: 1.8; color: #374151; margin: 0; }

/* ── 유사 특허 ───────────────────────────────────── */
.similar-count {
  font-size: 12px; font-weight: 600; color: #64748b;
  background: #f1f5f9; padding: 3px 10px; border-radius: 20px;
}

.table-wrap { overflow-x: auto; }

.data-table {
  width: 100%; border-collapse: collapse; font-size: 13px; min-width: 640px;
}
.data-table thead tr { border-bottom: 1.5px solid #e2e8f0; }
.data-table th {
  padding: 10px 14px; text-align: left;
  font-size: 11.5px; font-weight: 600; color: #64748b;
  text-transform: uppercase; letter-spacing: 0.03em;
}
.data-table td {
  padding: 14px 14px; border-bottom: 1px solid #f8fafc; vertical-align: middle;
}
.data-table tbody tr:last-child td { border-bottom: none; }
.data-table tbody tr:hover { background: #fafafa; }

.similarity-cell { display: flex; flex-direction: column; gap: 5px; }
.similarity-score { font-size: 13px; font-weight: 700; }
.similarity-score.high { color: #dc2626; }
.similarity-score.mid  { color: #d97706; }
.similarity-score.low  { color: #64748b; }

.mini-gauge { height: 4px; background: #f1f5f9; border-radius: 99px; width: 80px; overflow: hidden; }
.mini-gauge__fill { height: 100%; border-radius: 99px; }
.mini-gauge__fill.high { background: #ef4444; }
.mini-gauge__fill.mid  { background: #f59e0b; }
.mini-gauge__fill.low  { background: #94a3b8; }

.similar-title    { font-size: 13px; color: #0f172a; font-weight: 500; }
.similar-applicant { font-size: 12.5px; color: #64748b; }
.text-muted-sm    { font-size: 12px; color: #94a3b8; }

/* ── 사내 프로젝트 카드 ───────────────────────────── */
.project-cards { display: flex; flex-direction: column; gap: 12px; }

.project-card {
  border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px 20px;
  display: flex; flex-direction: column; gap: 10px; transition: box-shadow 0.15s;
}
.project-card:hover { box-shadow: 0 4px 16px rgba(15,23,42,0.06); }

.project-card__header { display: flex; flex-direction: column; gap: 8px; }

.project-card__title-row { display: flex; align-items: center; gap: 10px; }
.project-card__icon {
  width: 28px; height: 28px; background: #eef2ff; color: #4f46e5;
  border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.project-card__name { font-size: 15px; font-weight: 700; color: #0f172a; margin: 0; }

.project-card__meta { display: flex; align-items: center; gap: 8px; }

.project-dept {
  font-size: 12px; font-weight: 500; color: #64748b;
  background: #f1f5f9; padding: 2px 8px; border-radius: 5px;
}

.relevance-badge { font-size: 12px; font-weight: 700; padding: 2px 9px; border-radius: 5px; }
.relevance-badge--high { background: #fef2f2; color: #dc2626; }
.relevance-badge--mid  { background: #fffbeb; color: #b45309; }
.relevance-badge--low  { background: #f8fafc; color: #64748b; }

.project-card__desc { font-size: 13.5px; line-height: 1.75; color: #475569; margin: 0; }

/* ── 의견 제출 ───────────────────────────────────── */
.opinion-form { display: flex; flex-direction: column; gap: 20px; max-width: 540px; }

.opinion-form__desc { font-size: 13.5px; color: #64748b; margin: 0; }

.radio-group { display: flex; flex-direction: column; gap: 8px; }

.radio-card {
  display: flex; align-items: center; gap: 10px;
  padding: 13px 16px;
  border: 1.5px solid #e2e8f0; border-radius: 10px; cursor: pointer;
  transition: border-color 0.13s, background 0.13s;
  background: #fff;
}
.radio-card:hover { background: #f8fafc; border-color: #cbd5e1; }

.radio-card--keep.radio-card--selected    { border-color: #22c55e; background: #f0fdf4; }
.radio-card--dispose.radio-card--selected { border-color: #ef4444; background: #fef2f2; }

.radio-input { display: none; }

.radio-indicator {
  width: 17px; height: 17px; border-radius: 50%;
  border: 2px solid #cbd5e1;
  background: #fff;
  flex-shrink: 0;
  transition: border-color 0.13s, background 0.13s, box-shadow 0.13s;
}
.radio-card--keep.radio-card--selected .radio-indicator {
  border-color: #22c55e; background: #22c55e; box-shadow: inset 0 0 0 4px #fff;
}
.radio-card--dispose.radio-card--selected .radio-indicator {
  border-color: #ef4444; background: #ef4444; box-shadow: inset 0 0 0 4px #fff;
}

.radio-card__label { font-size: 14px; font-weight: 600; color: #0f172a; }

.opinion-textarea-wrap { display: flex; flex-direction: column; gap: 6px; }
.field__label { font-size: 12px; font-weight: 600; color: #374151; }
.field__hint  { font-size: 11.5px; color: #94a3b8; margin: 0; }

.opinion-textarea {
  width: 100%; padding: 12px 14px;
  border: 1.5px solid #e2e8f0; border-radius: 10px;
  font-size: 13.5px; font-family: inherit; color: #0f172a; background: #fafafa;
  resize: vertical; outline: none; transition: border-color 0.15s; box-sizing: border-box;
}
.opinion-textarea:focus { border-color: #6366f1; background: #fff; }

.btn-submit-opinion {
  padding: 13px 28px;
  background: linear-gradient(135deg, #4f46e5, #6366f1);
  color: #fff; border: none; border-radius: 10px;
  font-size: 14px; font-weight: 700; font-family: inherit; cursor: pointer;
  box-shadow: 0 4px 14px rgba(79,70,229,0.3);
  display: flex; align-items: center; justify-content: center; gap: 8px;
  align-self: flex-start; transition: opacity 0.13s, transform 0.1s;
}
.btn-submit-opinion:hover:not(:disabled) { opacity: 0.92; transform: translateY(-1px); }
.btn-submit-opinion:disabled { opacity: 0.5; cursor: not-allowed; }

/* ── 제출 완료 ───────────────────────────────────── */
.opinion-done { display: flex; flex-direction: column; gap: 16px; max-width: 540px; }
.opinion-done__header { display: flex; align-items: center; gap: 16px; }

.opinion-done__badge {
  display: flex; align-items: center; justify-content: center;
  width: 60px; height: 60px; border-radius: 14px;
  font-size: 18px; font-weight: 800; flex-shrink: 0;
}
.opinion-done__badge--keep    { background: #f0fdf4; color: #15803d; border: 2px solid #86efac; }
.opinion-done__badge--dispose { background: #fef2f2; color: #dc2626; border: 2px solid #fca5a5; }

.opinion-done__label { font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 3px; }
.opinion-done__date  { font-size: 13px; color: #94a3b8; margin: 0; }

.opinion-done__comment {
  padding: 16px 18px;
  background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 10px;
}
.opinion-done__comment-label { font-size: 11.5px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 6px; }
.opinion-done__comment-text  { font-size: 13.5px; line-height: 1.75; color: #374151; margin: 0; }

.opinion-done__notice {
  display: flex; align-items: flex-start; gap: 8px;
  padding: 12px 14px;
  background: #fffbeb; border: 1px solid #fde68a; border-radius: 9px;
  font-size: 12.5px; color: #92400e;
}

/* ── 대기 중 표시 ─────────────────────────────────── */
.opinion-pending {
  display: flex; align-items: center; gap: 14px;
  padding: 16px 18px;
  background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px;
  max-width: 540px;
}
.opinion-pending__icon { color: #d97706; flex-shrink: 0; }
.opinion-pending__text { font-size: 14px; font-weight: 600; color: #92400e; margin: 0 0 2px; }
.opinion-pending__sub  { font-size: 12px; color: #b45309; margin: 0; }

.overdue-badge {
  margin-left: auto; flex-shrink: 0;
  padding: 3px 9px; background: #fef2f2; border: 1px solid #fca5a5;
  border-radius: 5px; font-size: 12px; font-weight: 700; color: #dc2626;
}

/* ── Legal 읽기 전용 ─────────────────────────────── */
.legal-opinion-view { display: flex; flex-direction: column; gap: 16px; }
.legal-opinion-view__header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 6px;
}

/* ── 빈 섹션 ─────────────────────────────────────── */
.empty-section {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 10px; padding: 48px 24px; text-align: center; color: #94a3b8;
}
.empty-section p { font-size: 14px; font-weight: 500; margin: 0; }

/* ── 스피너 ──────────────────────────────────────── */
.spinner-sm {
  width: 13px; height: 13px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff; border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
