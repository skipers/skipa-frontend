<template>
  <div class="app-detail">

    <div v-if="!app" class="not-found">
      <p>신청 정보를 찾을 수 없습니다.</p>
      <button class="back-btn" @click="goBack">신청 현황으로 돌아가기</button>
    </div>

    <template v-else>

      <!-- ── 헤더 ── -->
      <div class="rd-header">
        <button class="back-btn" @click="goBack">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
          신청 현황으로
        </button>

        <div class="rd-header__main rd-header__card">
          <div class="rd-header__title-row">
            <h1 class="rd-title">{{ isEditing ? editForm.title || app.title : app.title }}</h1>
            <div class="rd-header__actions">
              <!-- 편집 모드 -->
              <template v-if="isEditing">
                <button class="btn-hd-cancel" @click="cancelEdit">취소</button>
                <button class="btn-hd-resubmit" @click="submitResubmit">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <line x1="22" y1="2" x2="11" y2="13"/>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                  재신청
                </button>
              </template>
              <!-- 일반 모드 -->
              <template v-else-if="app.appStatus === 'pending' || app.appStatus === 'rejected'">
                <button v-if="app.appStatus === 'rejected'" class="btn-hd-resubmit" @click="startEdit">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <polyline points="23 4 23 10 17 10"/>
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                  </svg>
                  수정 후 재신청
                </button>
                <button class="btn-hd-withdraw" @click="handleWithdraw">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                  철회
                </button>
              </template>
            </div>
          </div>

          <div class="rd-header__meta">
            <span
              class="app-status-badge"
              :class="app.appStatus === 'pending' && app.isResubmit ? 'app-status--resubmit' : `app-status--${app.appStatus}`"
            >
              {{ app.appStatus === 'pending' && app.isResubmit ? '재신청' : appStatusLabel(app.appStatus) }}
            </span>
            <span class="meta-chip">신청일 {{ app.submittedAt }}</span>
            <span v-if="app.reviewedAt" class="meta-chip">검토일 {{ app.reviewedAt }}</span>
          </div>
        </div>
      </div>

      <!-- 거절 사유 표시 -->
      <div v-if="app.appStatus === 'rejected' && app.rejectionReason" class="rejection-notice">
        <div class="rejection-notice__label">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          거절 사유 ({{ app.reviewedAt }})
        </div>
        <p class="rejection-notice__text">{{ app.rejectionReason }}</p>
      </div>

      <!-- ── 탭 바 (편집 중 비활성) ── -->
      <div class="rd-tabs">
        <button class="rd-tab" :class="{ 'rd-tab--active': activeTab === 'info' }" @click="activeTab = 'info'">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
          특허 정보
        </button>
        <button class="rd-tab" :class="{ 'rd-tab--active': activeTab === 'pdf' }" :disabled="isEditing" @click="activeTab = 'pdf'">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          원문 PDF
        </button>
      </div>

      <!-- ── 탭 1: 특허 정보 ── -->
      <div v-if="activeTab === 'info'" class="rd-sections" :class="{ 'rd-sections--editing': isEditing }">

        <!-- 기본 정보 -->
        <section class="content-section">
          <h2 class="section-heading">기본 정보</h2>
          <table class="info-table">
            <tbody>
              <tr>
                <th>특허 제목</th>
                <td><input v-if="isEditing" class="edit-input" v-model="editForm.title" /><span v-else>{{ app.title }}</span></td>
              </tr>
              <tr>
                <th>발명의 명칭(최종)</th>
                <td><input v-if="isEditing" class="edit-input" v-model="editForm.finalTitle" /><span v-else>{{ app.finalTitle || '—' }}</span></td>
              </tr>
              <tr>
                <th>발명자</th>
                <td><input v-if="isEditing" class="edit-input" v-model="editForm.inventors" /><span v-else>{{ app.inventors || '—' }}</span></td>
              </tr>
              <tr>
                <th>관리번호</th>
                <td><input v-if="isEditing" class="edit-input" v-model="editForm.managementNumber" /><span v-else>{{ app.managementNumber || '—' }}</span></td>
              </tr>
            </tbody>
          </table>
        </section>

        <div class="section-divider" />

        <!-- 분류 및 제품 -->
        <section class="content-section">
          <h2 class="section-heading">분류 및 제품</h2>
          <table class="info-table">
            <tbody>
              <tr>
                <th>관련사업 분야</th>
                <td><input v-if="isEditing" class="edit-input" v-model="editForm.bizField" /><span v-else>{{ app.bizField || '—' }}</span></td>
              </tr>
              <tr>
                <th>관련기술 분야</th>
                <td><input v-if="isEditing" class="edit-input" v-model="editForm.techField" /><span v-else>{{ app.techField || '—' }}</span></td>
              </tr>
              <tr>
                <th>관련제품</th>
                <td><input v-if="isEditing" class="edit-input" v-model="editForm.relatedProducts" /><span v-else>{{ app.relatedProducts || '—' }}</span></td>
              </tr>
            </tbody>
          </table>
        </section>

        <div class="section-divider" />

        <!-- 출원 및 등록 -->
        <section class="content-section">
          <h2 class="section-heading">출원 및 등록</h2>
          <table class="info-table">
            <tbody>
              <tr>
                <th>출원국</th>
                <td><input v-if="isEditing" class="edit-input" v-model="editForm.country" /><span v-else>{{ app.country || '—' }}</span></td>
              </tr>
              <tr>
                <th>특허 상태</th>
                <td><input v-if="isEditing" class="edit-input" v-model="editForm.patentStatus" /><span v-else>{{ app.patentStatus || '—' }}</span></td>
              </tr>
              <tr>
                <th>출원번호</th>
                <td><input v-if="isEditing" class="edit-input mono" v-model="editForm.applicationNumber" /><span v-else class="mono-text">{{ app.applicationNumber || '—' }}</span></td>
              </tr>
              <tr>
                <th>등록번호</th>
                <td><input v-if="isEditing" class="edit-input mono" v-model="editForm.registrationNumber" /><span v-else class="mono-text">{{ app.registrationNumber || '—' }}</span></td>
              </tr>
              <tr>
                <th>출원일</th>
                <td><input v-if="isEditing" class="edit-input" type="date" v-model="editForm.applicationDate" /><span v-else>{{ app.applicationDate || '—' }}</span></td>
              </tr>
              <tr>
                <th>등록일</th>
                <td><input v-if="isEditing" class="edit-input" type="date" v-model="editForm.registrationDate" /><span v-else>{{ app.registrationDate || '—' }}</span></td>
              </tr>
              <tr>
                <th>IPC</th>
                <td><input v-if="isEditing" class="edit-input" v-model="editForm.ipc" /><span v-else>{{ app.ipc || '—' }}</span></td>
              </tr>
              <tr>
                <th>예상 소멸일</th>
                <td><input v-if="isEditing" class="edit-input" type="date" v-model="editForm.expiryDate" /><span v-else>{{ app.expiryDate || '—' }}</span></td>
              </tr>
              <tr>
                <th>공동출원여부</th>
                <td>
                  <select v-if="isEditing" class="edit-input" v-model="editForm.coApplicant">
                    <option>아니오</option><option>예</option>
                  </select>
                  <span v-else>{{ app.coApplicant }}</span>
                </td>
              </tr>
              <tr v-if="editForm.coApplicant === '예' || (!isEditing && app.coApplicant === '예')">
                <th>공동출원인명</th>
                <td><input v-if="isEditing" class="edit-input" v-model="editForm.coApplicantName" /><span v-else>{{ app.coApplicantName }}</span></td>
              </tr>
            </tbody>
          </table>
        </section>

        <div class="section-divider" />

        <!-- 내용 요약 -->
        <section class="content-section">
          <h2 class="section-heading">내용 요약</h2>
          <div class="info-section">
            <h3 class="info-section__title">발명의 요약</h3>
            <textarea v-if="isEditing" class="edit-textarea" v-model="editForm.summary" rows="4" />
            <p v-else-if="app.summary" class="info-text">{{ app.summary }}</p>
            <p v-else class="info-empty">내용 없음</p>
          </div>
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
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { usePatentApplications } from '@/composables/usePatentApplications'

const props = defineProps<{ appId: number }>()
const router = useRouter()

const { applications, resubmit, withdraw } = usePatentApplications()

const app = computed(() => applications.value.find(a => a.id === props.appId) ?? null)

const activeTab  = ref<'info' | 'pdf'>('info')
const isEditing  = ref(false)
const editForm   = reactive({
  title: '', finalTitle: '', inventors: '', managementNumber: '',
  bizField: '', techField: '', relatedProducts: [] as string[],
  country: '', patentStatus: '', coApplicant: '', coApplicantName: '',
  applicationNumber: '', registrationNumber: '',
  applicationDate: '', registrationDate: '', ipc: [] as string[], expiryDate: '',
  summary: '',
})

function appStatusLabel(s: string) {
  return { pending: '검토 중', approved: '승인', rejected: '거절', withdrawn: '철회' }[s] ?? s
}

function goBack() {
  router.push({ name: 'BizPatentRegister', query: { tab: 'history' } })
}

function startEdit() {
  if (!app.value) return
  Object.assign(editForm, {
    title: app.value.title,
    finalTitle: app.value.finalTitle,
    inventors: app.value.inventors,
    managementNumber: app.value.managementNumber,
    bizField: app.value.bizField,
    techField: app.value.techField,
    relatedProducts: app.value.relatedProducts,
    country: app.value.country,
    patentStatus: app.value.patentStatus,
    coApplicant: app.value.coApplicant,
    coApplicantName: app.value.coApplicantName,
    applicationNumber: app.value.applicationNumber,
    registrationNumber: app.value.registrationNumber,
    applicationDate: app.value.applicationDate,
    registrationDate: app.value.registrationDate,
    ipc: app.value.ipc,
    expiryDate: app.value.expiryDate,
    summary: app.value.summary,
  })
  activeTab.value = 'info'
  isEditing.value = true
}

function cancelEdit() {
  isEditing.value = false
}

function submitResubmit() {
  resubmit(props.appId, { ...editForm })
  isEditing.value = false
  goBack()
}

function handleWithdraw() {
  if (!app.value) return
  withdraw(props.appId)
  goBack()
}
</script>

<style scoped>
.app-detail {
  display: flex; flex-direction: column; gap: 16px;
  font-family: 'Pretendard', sans-serif;
}

/* ── 헤더 ── */
.rd-header { display: flex; flex-direction: column; gap: 14px; }

.rd-header__card {
  background: #fff; border: 1px solid #e2e8f0;
  border-radius: 16px; padding: 20px 24px;
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

.btn-hd-resubmit {
  display: flex; align-items: center; gap: 7px;
  padding: 9px 20px; border-radius: 9px;
  background: linear-gradient(135deg, #5b21b6, #7c3aed);
  border: none; color: #fff;
  font-size: 13.5px; font-weight: 600; font-family: inherit;
  cursor: pointer; box-shadow: 0 4px 12px rgba(124,58,237,.25); transition: opacity .15s;
}
.btn-hd-resubmit:hover { opacity: .9; }

.btn-hd-cancel {
  display: flex; align-items: center; gap: 7px;
  padding: 9px 20px; border-radius: 9px;
  background: var(--color-surface-muted); border: 1px solid var(--color-border);
  font-size: 13.5px; font-weight: 600; font-family: inherit;
  color: var(--color-text-secondary); cursor: pointer; transition: background .12s;
}
.btn-hd-cancel:hover { background: #f1f5f9; }

.btn-hd-withdraw {
  display: flex; align-items: center; gap: 7px;
  padding: 9px 20px; border-radius: 9px;
  background: var(--color-surface-muted); border: 1px solid var(--color-border);
  font-size: 13.5px; font-weight: 600; font-family: inherit;
  color: var(--color-text-secondary); cursor: pointer; transition: background .12s, color .12s;
}
.btn-hd-withdraw:hover { background: #fee2e2; border-color: #fecaca; color: #b91c1c; }

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

/* ── 거절 사유 ── */
.rejection-notice {
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
  display: flex; gap: 4px;
  border-bottom: 1.5px solid #e2e8f0; background: #f8fafc;
}
.rd-tab {
  display: flex; align-items: center; gap: 7px;
  padding: 10px 18px; background: none; border: none; cursor: pointer;
  font-size: 13.5px; font-weight: 500; font-family: inherit;
  color: #64748b; white-space: nowrap; position: relative; transition: color .13s;
}
.rd-tab:disabled { opacity: .4; cursor: not-allowed; }
.rd-tab:not(:disabled):hover { color: #0f172a; }
.rd-tab--active { color: #4f46e5; font-weight: 700; }
.rd-tab--active::after {
  content: ''; position: absolute; bottom: -1.5px; left: 0; right: 0;
  height: 2px; background: #4f46e5; border-radius: 2px 2px 0 0;
}

/* ── 정보 섹션 ── */
.rd-sections {
  background: #fff; border: 1px solid #e2e8f0;
  border-radius: 16px; overflow: hidden; display: flex; flex-direction: column;
}
.rd-sections--editing { border-color: #e2e8f0; }

.content-section { padding: 28px 28px; }

.section-heading {
  font-size: 15px; font-weight: 700; color: #0f172a;
  margin: 0 0 16px; letter-spacing: -0.01em;
}

.section-divider { height: 1px; background: #e2e8f0; }

.info-table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
.info-table th {
  width: 140px; text-align: left; vertical-align: middle;
  padding: 8px 16px 8px 0;
  color: var(--color-text-muted); font-weight: 600; white-space: nowrap;
}
.info-table td { padding: 6px 0; color: var(--color-text-secondary); line-height: 1.5; }
.info-table tr { border-bottom: 1px solid #f1f5f9; }
.info-table tr:last-child { border-bottom: none; }
.mono-text { font-family: 'JetBrains Mono', monospace; font-size: 12.5px; }

/* ── 편집 인풋 ── */
.edit-input {
  width: 100%; padding: 6px 10px; box-sizing: border-box;
  border: 1.5px solid #e2e8f0; border-radius: 7px;
  font-size: 13.5px; font-family: inherit; color: var(--color-text);
  background: #f8fafc; outline: none; transition: border-color .13s, background .13s;
}
.edit-input:focus { border-color: #94a3b8; background: #fff; }
.edit-input.mono { font-family: 'JetBrains Mono', monospace; font-size: 12.5px; }

.edit-textarea {
  width: 100%; padding: 8px 10px; box-sizing: border-box;
  border: 1.5px solid #e2e8f0; border-radius: 7px;
  font-size: 13.5px; font-family: inherit; color: var(--color-text);
  background: #f8fafc; outline: none; resize: vertical; line-height: 1.6;
  transition: border-color .13s, background .13s;
}
.edit-textarea:focus { border-color: #94a3b8; background: #fff; }

.info-section { margin-bottom: 16px; }
.info-section:last-child { margin-bottom: 0; }
.info-section__title {
  font-size: 12.5px; font-weight: 700; color: var(--color-text-muted);
  text-transform: uppercase; letter-spacing: .05em; margin: 0 0 8px;
}
.info-text { font-size: 13.5px; color: var(--color-text-secondary); line-height: 1.7; margin: 0; }
.info-empty { font-size: 13.5px; color: #cbd5e1; margin: 0; }

/* ── PDF 탭 ── */
.rd-pdf {
  background: #fff; border: 1px solid #e2e8f0;
  border-radius: 16px; overflow: hidden;
  display: flex; flex-direction: column; min-height: 560px;
}
.pdf-placeholder {
  flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 14px; padding: 60px 40px; text-align: center; background: #f8fafc; color: #94a3b8;
}
.pdf-placeholder__name { font-size: 15px; font-weight: 600; color: #334155; margin: 0; line-height: 1.5; }
.pdf-placeholder__sub  { font-size: 13.5px; color: #94a3b8; margin: 0; }

.not-found {
  padding: 80px 32px; text-align: center;
  display: flex; flex-direction: column; align-items: center; gap: 16px;
  color: var(--color-text-muted);
}
</style>
