<template>
  <div class="review-detail">

    <!-- 찾을 수 없음 -->
    <div v-if="!app" class="not-found">
      <p>신청 정보를 찾을 수 없습니다.</p>
      <button class="back-btn" @click="goBack">목록으로 돌아가기</button>
    </div>

    <template v-else>

      <!-- ── 헤더 ── -->
      <div class="rd-header">
        <button class="back-btn" @click="goBack">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
          목록으로
        </button>

        <div class="rd-header__main rd-header__card">
          <div class="rd-header__title-row">
            <h1 class="rd-title">{{ app.title }}</h1>
            <div class="rd-header__actions" v-if="app.appStatus === 'pending'">
              <button class="btn-hd-reject" @click="showRejectForm = !showRejectForm">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
                거절
              </button>
              <button class="btn-hd-approve" @click="handleApprove">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                승인
              </button>
            </div>
          </div>

          <div class="rd-header__meta">
            <span
              class="app-status-badge"
              :class="app.appStatus === 'pending' && app.isResubmit ? 'app-status--resubmit' : `app-status--${app.appStatus}`"
            >
              {{ app.appStatus === 'pending' && app.isResubmit ? '재신청' : appStatusLabel(app.appStatus) }}
            </span>
            <span class="meta-chip">{{ app.submittedBy }}</span>
            <span class="meta-chip">신청일 {{ formatDate(app.submittedAt) }}</span>
            <span v-if="app.reviewedAt" class="meta-chip">검토일 {{ formatDate(app.reviewedAt) }}</span>
          </div>
        </div>
      </div>

      <!-- 거절 폼 (헤더 아래 inline) -->
      <div v-if="showRejectForm" class="reject-banner">
        <p class="reject-banner__label">거절 사유 입력</p>
        <textarea
          class="reject-reason-input"
          v-model="rejectReason"
          placeholder="거절 사유를 입력하세요. 사업부에서 이 내용을 확인하고 수정하거나 철회할 수 있습니다."
          rows="3"
        />
        <div class="reject-banner__btns">
          <button class="btn-cancel-sm" @click="showRejectForm = false; rejectReason = ''">취소</button>
          <button class="btn-reject-confirm" :disabled="!rejectReason.trim()" @click="handleReject">
            거절 확정
          </button>
        </div>
      </div>

      <!-- 거절 사유 표시 (이미 거절된 경우) -->
      <div v-if="app.appStatus === 'rejected' && app.rejectionReason" class="rejection-notice">
        <div class="rejection-notice__label">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          거절 사유 ({{ app.reviewedAt }})
        </div>
        <p class="rejection-notice__text">{{ app.rejectionReason }}</p>
      </div>

      <!-- ── 탭 바 ── -->
      <div class="rd-tabs">
        <button class="rd-tab" :class="{ 'rd-tab--active': activeTab === 'info' }" @click="activeTab = 'info'">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
          특허 정보
        </button>
        <button class="rd-tab" :class="{ 'rd-tab--active': activeTab === 'pdf' }" @click="activeTab = 'pdf'">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          원문 PDF
        </button>
      </div>

      <!-- ── 탭 1: 특허 정보 ── -->
      <div v-if="activeTab === 'info'" class="rd-sections">

        <!-- 기본 정보 -->
        <section class="content-section">
          <div class="section-header">
            <h2 class="section-heading">기본 정보</h2>
          </div>
          <table class="info-table">
            <tbody>
              <tr><th>특허 제목</th><td>{{ app.title }}</td></tr>
              <tr><th>발명의 명칭(최종)</th><td>{{ app.finalTitle || '—' }}</td></tr>
              <tr><th>발명자</th><td>{{ formatInventors(app.inventors) }}</td></tr>
              <tr><th>관리번호</th><td>{{ app.managementNumber || '—' }}</td></tr>
            </tbody>
          </table>
        </section>

        <div class="section-divider" />

        <!-- 분류 및 제품 -->
        <section class="content-section">
          <div class="section-header">
            <h2 class="section-heading">분류 및 제품</h2>
          </div>
          <table class="info-table">
            <tbody>
              <tr><th>관련사업 분야</th><td>{{ app.bizField || '—' }}</td></tr>
              <tr><th>관련기술 분야</th><td>{{ app.techField || '—' }}</td></tr>
              <tr><th>관련제품</th><td>{{ joinArray(app.relatedProducts) }}</td></tr>
            </tbody>
          </table>
        </section>

        <div class="section-divider" />

        <!-- 출원 및 등록 -->
        <section class="content-section">
          <div class="section-header">
            <h2 class="section-heading">출원 및 등록</h2>
          </div>
          <table class="info-table">
            <tbody>
              <tr><th>출원국</th><td>{{ app.country ? countryLabel(app.country) : '—' }}</td></tr>
              <tr><th>특허 상태</th><td>{{ app.patentStatus ? patentStatusLabel(app.patentStatus) : '—' }}</td></tr>
              <tr><th>출원번호</th><td>{{ app.applicationNumber || '—' }}</td></tr>
              <tr><th>등록번호</th><td>{{ app.registrationNumber || '—' }}</td></tr>
              <tr><th>출원일</th><td>{{ app.applicationDate || '—' }}</td></tr>
              <tr><th>등록일</th><td>{{ app.registrationDate || '—' }}</td></tr>
              <tr><th>IPC</th><td>{{ joinArray(app.ipc) }}</td></tr>
              <tr><th>예상 소멸일</th><td>{{ app.expiryDate || '—' }}</td></tr>
              <tr><th>공동출원여부</th><td>{{ app.coApplicant }}</td></tr>
              <tr v-if="app.coApplicant === '예'"><th>공동출원인명</th><td>{{ app.coApplicantName }}</td></tr>
            </tbody>
          </table>
        </section>

        <div class="section-divider" />

        <!-- 내용 요약 -->
        <section class="content-section">
          <div class="section-header">
            <h2 class="section-heading">내용 요약</h2>
          </div>
          <div v-if="app.summary" class="info-section">
            <h3 class="info-section__title">특허 개요</h3>
            <p class="info-text">{{ app.summary }}</p>
          </div>
          <div v-if="app.coreContent" class="info-section">
            <h3 class="info-section__title">핵심 내용</h3>
            <p class="info-text">{{ app.coreContent }}</p>
          </div>
          <p v-if="!app.summary && !app.coreContent" class="info-empty">내용 없음</p>
        </section>

      </div>

      <!-- ── 탭 2: 원문 PDF ── -->
      <div v-else class="rd-pdf">
        <div class="pdf-placeholder">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.8">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
          <p class="pdf-placeholder__name">{{ app.title }}</p>
          <p class="pdf-placeholder__sub">첨부된 PDF 원문이 없습니다.</p>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePatentApplications } from '@/composables/usePatentApplications'
import { usePatentDatabase } from '@/composables/usePatentDatabase'

const props = defineProps<{ appId: number }>()
const router = useRouter()

const { applications, approve, reject, fetchApplications } = usePatentApplications()
const { addApprovedPatent } = usePatentDatabase()

onMounted(() => fetchApplications())

const app = computed(() => applications.value.find(a => a.id === props.appId) ?? null)

const activeTab      = ref<'info' | 'pdf'>('info')
const showRejectForm = ref(false)
const rejectReason   = ref('')

function appStatusLabel(s: string) {
  return { pending: '검토 중', approved: '승인', rejected: '거절', withdrawn: '철회' }[s] ?? s
}

function formatInventors(s: string) {
  return s ? s.replace(/\s*;\s*/g, ', ') : '—'
}

function countryLabel(code: string) {
  return ({
    KR: '한국', US: '미국', JP: '일본', CN: '중국',
    EP: '유럽', DE: '독일', GB: '영국', FR: '프랑스',
  } as Record<string, string>)[code?.toUpperCase()] ?? code
}

function patentStatusLabel(s: string) {
  return ({
    REGISTERED: '등록', ABANDONED: '포기', EXPIRED: '소멸',
    PENDING: '출원', REJECTED: '거절', INVALID: '무효', WITHDRAW: '취하',
    등록: '등록', 포기: '포기', 소멸: '소멸', 출원: '출원',
    거절: '거절', 무효: '무효', 취하: '취하', 공개: '공개',
  } as Record<string, string>)[s] ?? s
}

function formatDate(s: string) {
  return s ? s.slice(0, 10) : ''
}

function joinArray(arr: string[] | undefined) {
  return arr?.length ? arr.join(', ') : '—'
}

function goBack() {
  router.push({ name: 'LegalPatentManage' })
}

function handleApprove() {
  if (!app.value) return
  addApprovedPatent({
    title: app.value.title,
    applicationNumber: app.value.applicationNumber || '',
    registrationNumber: app.value.registrationNumber || '',
    applicationDate: app.value.applicationDate || '',
    expiryDate: app.value.expiryDate || '',
    techField: app.value.techField || '',
    status: 'REGISTERED',
    summary: app.value.summary || '',
    citationCount: 0,
  })
  approve(props.appId)
  goBack()
}

async function handleReject() {
  if (!rejectReason.value.trim()) return
  await reject(props.appId, rejectReason.value.trim())
  goBack()
}
</script>

<style scoped>
.review-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
  font-family: 'Pretendard', sans-serif;
}

/* ── 헤더 ── */
.rd-header {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.rd-header__card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 20px 24px;
}

.back-btn {
  display: inline-flex; align-items: center; gap: 6px;
  background: none; border: none; cursor: pointer;
  font-size: 13px; font-weight: 500; color: #64748b; font-family: inherit;
  padding: 6px 0; transition: color .13s;
}
.back-btn:hover { color: #0f172a; }

.rd-header__main { display: flex; flex-direction: column; gap: 10px; }

.rd-header__title-row {
  display: flex; align-items: flex-start; justify-content: space-between; gap: 16px;
}

.rd-title {
  font-size: 22px; font-weight: 700; color: var(--color-text);
  margin: 0; line-height: 1.35; letter-spacing: -0.02em;
}

.rd-header__actions { display: flex; gap: 8px; flex-shrink: 0; align-items: center; }

.btn-hd-reject {
  display: flex; align-items: center; gap: 7px;
  padding: 9px 20px; border-radius: 9px;
  background: var(--color-surface-muted); border: 1px solid var(--color-border);
  font-size: 13.5px; font-weight: 600; font-family: inherit;
  color: var(--color-text-secondary); cursor: pointer; transition: background .12s, color .12s;
}
.btn-hd-reject:hover { background: var(--color-danger-bg); border-color: #fecaca; color: var(--color-danger); }

.btn-hd-approve {
  display: flex; align-items: center; gap: 7px;
  padding: 9px 20px; border-radius: 9px;
  background: linear-gradient(135deg, var(--color-primary-dark), var(--color-primary));
  border: none; color: #fff;
  font-size: 13.5px; font-weight: 600; font-family: inherit;
  cursor: pointer; box-shadow: 0 4px 12px rgba(79,70,229,.25);
  transition: opacity .15s;
}
.btn-hd-approve:hover { opacity: .9; }

.rd-header__meta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

.app-status-badge {
  display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 6px;
  font-size: 12px; font-weight: 700; white-space: nowrap;
}
.app-status--pending   { background: #fee2e2; color: #b91c1c; }
.app-status--resubmit  { background: #ede9fe; color: #5b21b6; }
.app-status--approved  { background: #dcfce7; color: #166534; }
.app-status--rejected  { background: #fef9c3; color: #854d0e; }
.app-status--withdrawn { background: #f1f5f9; color: #475569; }

.meta-chip {
  display: inline-flex; align-items: center;
  padding: 3px 10px; border-radius: 6px;
  background: var(--color-surface-muted); border: 1px solid var(--color-border);
  font-size: 12px; font-weight: 500; color: var(--color-text-secondary); white-space: nowrap;
}

/* ── 거절 폼 배너 ── */
.reject-banner {
  margin-top: 0;
  padding: 18px 20px; border-radius: 12px;
  background: #fff1f2; border: 1px solid #fecdd3;
  display: flex; flex-direction: column; gap: 10px;
}
.reject-banner__label { font-size: 13px; font-weight: 700; color: #b91c1c; margin: 0; }
.reject-reason-input {
  width: 100%; padding: 10px 14px; box-sizing: border-box;
  border: 1.5px solid #fca5a5; border-radius: 8px;
  font-size: 13.5px; font-family: inherit; color: var(--color-text);
  background: #fff; outline: none; resize: vertical; line-height: 1.6;
}
.reject-reason-input:focus { border-color: #b91c1c; }
.reject-reason-input::placeholder { color: #fca5a5; }
.reject-banner__btns { display: flex; gap: 8px; justify-content: flex-end; }
.btn-cancel-sm {
  padding: 7px 16px; background: var(--color-surface);
  border: 1px solid var(--color-border); border-radius: 8px;
  font-size: 13px; font-weight: 600; font-family: inherit; color: var(--color-text-muted); cursor: pointer;
}
.btn-reject-confirm {
  padding: 7px 18px; background: #b91c1c; color: #fff;
  border: none; border-radius: 8px; font-size: 13px; font-weight: 700; font-family: inherit;
  cursor: pointer; transition: opacity .15s;
}
.btn-reject-confirm:disabled { opacity: .4; cursor: not-allowed; }
.btn-reject-confirm:not(:disabled):hover { opacity: .85; }

/* ── 거절 사유 표시 ── */
.rejection-notice {
  margin-top: 0;
  padding: 16px 20px; border-radius: 12px;
  background: #fff1f2; border: 1px solid #fecdd3;
  display: flex; flex-direction: column; gap: 8px;
}
.rejection-notice__label {
  display: flex; align-items: center; gap: 7px;
  font-size: 13px; font-weight: 700; color: #b91c1c;
}
.rejection-notice__text { font-size: 13.5px; color: #7f1d1d; line-height: 1.6; margin: 0; }

/* ── 탭 바 ── */
.rd-tabs {
  display: flex;
  gap: 4px;
  border-bottom: 1.5px solid #e2e8f0;
  background: #f8fafc;
}

.rd-tab {
  display: flex; align-items: center; gap: 7px;
  padding: 10px 18px;
  background: none; border: none; cursor: pointer;
  font-size: 13.5px; font-weight: 500; font-family: inherit;
  color: #64748b; white-space: nowrap;
  position: relative; transition: color .13s;
}
.rd-tab:hover { color: #0f172a; }
.rd-tab--active { color: #4f46e5; font-weight: 700; }
.rd-tab--active::after {
  content: '';
  position: absolute; bottom: -1.5px; left: 0; right: 0;
  height: 2px; background: #4f46e5; border-radius: 2px 2px 0 0;
}

/* ── 정보 탭 섹션들 ── */
.rd-sections {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  overflow: hidden;
  display: flex; flex-direction: column;
}

.content-section { padding: 32px 28px; }

.section-header { margin-bottom: 20px; }
.section-heading {
  font-size: 15px; font-weight: 700; color: #0f172a;
  margin: 0; letter-spacing: -0.01em;
}

.section-divider {
  height: 1px; background: #e2e8f0; margin: 0;
}

.info-table {
  width: 100%; border-collapse: collapse; font-size: 13.5px;
}
.info-table th {
  width: 140px; text-align: left; vertical-align: top;
  padding: 8px 16px 8px 0;
  color: var(--color-text-muted); font-weight: 600; white-space: nowrap;
}
.info-table td {
  padding: 8px 0;
  color: var(--color-text-secondary); line-height: 1.5;
}
.info-table td.mono { font-family: 'JetBrains Mono', monospace; font-size: 12.5px; }
.info-table tr { border-bottom: 1px solid #f1f5f9; }
.info-table tr:last-child { border-bottom: none; }

.info-section { margin-bottom: 16px; }
.info-section:last-child { margin-bottom: 0; }
.info-section__title {
  font-size: 12.5px; font-weight: 700; color: var(--color-text-muted);
  text-transform: uppercase; letter-spacing: .05em; margin: 0 0 8px;
}
.info-text { font-size: 13.5px; color: var(--color-text-secondary); line-height: 1.7; margin: 0; }
.info-empty { font-size: 13.5px; color: var(--c-slate-300); margin: 0; }

/* ── PDF 탭 ── */
.rd-pdf {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 560px;
}

.pdf-placeholder {
  flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 14px; padding: 60px 40px; text-align: center;
  background: #f8fafc;
  color: #94a3b8;
}
.pdf-placeholder__name { font-size: 15px; font-weight: 600; color: #334155; margin: 0; line-height: 1.5; }
.pdf-placeholder__sub  { font-size: 13.5px; color: #94a3b8; margin: 0; }

.not-found {
  padding: 80px 32px; text-align: center;
  display: flex; flex-direction: column; align-items: center; gap: 16px;
  color: var(--color-text-muted);
}
</style>
