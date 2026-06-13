<template>
  <div class="register-page">

    <!-- 페이지 헤더 -->
    <div class="page-header">
      <div>
        <h2 class="page-header__title">신규 특허 등록 신청</h2>
        <p class="page-header__desc">특허 PDF에서 기본 항목을 추출한 뒤 내용을 확인하고 제출합니다.</p>
      </div>
    </div>

    <!-- 탭 -->
    <div class="tab-bar">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="tab-btn"
        :class="{ 'tab-btn--active': activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        <span v-html="tab.icon" class="tab-btn__icon" />
        {{ tab.label }}
        <span v-if="tab.key === 'history' && myApplications.length" class="tab-badge">{{ myApplications.length }}</span>
      </button>
    </div>

    <!-- ── 탭 1: 신청서 작성 ── -->
    <template v-if="activeTab === 'write'">

      <!-- 신청 폼 -->
      <div class="form-card">

        <!-- 재신청 배너 -->
        <div v-if="resubmitTargetId" class="resubmit-banner">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 .49-3.81"/>
          </svg>
          <span>거절된 신청 수정 후 재제출 — <strong>{{ resubmitTargetTitle }}</strong></span>
          <button class="resubmit-banner__cancel" @click="resetForm">취소</button>
        </div>

        <!-- PDF 업로드 -->
        <div class="upload-panel">
          <label class="upload-drop" for="biz-pdf">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <span>{{ uploadedFile ? uploadedFile.name : '특허 PDF 업로드 · 클릭하거나 파일을 여기에 끌어다 놓으세요' }}</span>
          </label>
          <input id="biz-pdf" class="visually-hidden" type="file" accept=".pdf" ref="fileInputRef" @change="handleFileSelect" />
          <button class="btn-extract" @click="fileInputRef?.click()">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="8 17 12 21 16 17"/><line x1="12" y1="12" x2="12" y2="21"/>
              <path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"/>
            </svg>
            PDF에서 항목 추출
          </button>
        </div>

        <!-- 기본 정보 -->
        <div class="form-section">
          <div class="form-section__title">기본 정보</div>
          <div class="form-grid">
            <label class="form-field full">
              <span class="form-label">특허 제목 <span class="required">*</span></span>
              <input class="form-input" type="text" v-model="form.title" placeholder="특허명을 입력하세요" />
            </label>
            <label class="form-field">
              <span class="form-label">관리번호</span>
              <input class="form-input" type="text" v-model="form.managementNumber" />
            </label>
            <label class="form-field">
              <span class="form-label">발명자</span>
              <input class="form-input" type="text" v-model="form.inventors" placeholder="홍길동, 김철수" />
            </label>
            <label class="form-field">
              <span class="form-label">출원인명</span>
              <input class="form-input" type="text" v-model="form.applicant" />
            </label>
          </div>
        </div>

        <!-- 분류 및 제품 -->
        <div class="form-section">
          <div class="form-section__title">분류 및 제품</div>
          <div class="form-grid">
            <label class="form-field">
              <span class="form-label">관련사업 분야</span>
              <input class="form-input" type="text" v-model="form.bizField" />
            </label>
            <label class="form-field">
              <span class="form-label">관련기술 분야</span>
              <input class="form-input" type="text" v-model="form.techField" />
            </label>
            <label class="form-field full">
              <span class="form-label">관련제품</span>
              <input class="form-input" type="text" v-model="form.relatedProducts" />
            </label>
          </div>
        </div>

        <!-- 출원 및 등록 -->
        <div class="form-section">
          <div class="form-section__title">출원 및 등록</div>
          <div class="form-grid">
            <label class="form-field">
              <span class="form-label">출원국</span>
              <input class="form-input" type="text" v-model="form.country" />
            </label>
            <label class="form-field">
              <span class="form-label">상태</span>
              <select class="form-select" v-model="form.patentStatus">
                <option>등록</option><option>출원</option><option>검토 중</option><option>포기</option>
              </select>
            </label>
            <label class="form-field">
              <span class="form-label">공동출원여부</span>
              <select class="form-select" v-model="form.coApplicant">
                <option>아니오</option><option>예</option>
              </select>
            </label>
            <label class="form-field">
              <span class="form-label">공동출원인명</span>
              <input class="form-input" type="text" v-model="form.coApplicantName" />
            </label>
            <label class="form-field">
              <span class="form-label">출원일</span>
              <input class="form-input" type="date" v-model="form.applicationDate" />
            </label>
            <label class="form-field">
              <span class="form-label">등록일</span>
              <input class="form-input" type="date" v-model="form.registrationDate" />
            </label>
            <label class="form-field">
              <span class="form-label">공개일</span>
              <input class="form-input" type="date" v-model="form.publicationDate" />
            </label>
            <label class="form-field">
              <span class="form-label">공고일</span>
              <input class="form-input" type="date" v-model="form.announcementDate" />
            </label>
            <label class="form-field">
              <span class="form-label">출원번호</span>
              <input class="form-input" type="text" v-model="form.applicationNumber" placeholder="10-2026-0000000" />
            </label>
            <label class="form-field">
              <span class="form-label">등록번호</span>
              <input class="form-input" type="text" v-model="form.registrationNumber" placeholder="10-0000000" />
            </label>
            <label class="form-field">
              <span class="form-label">공개번호</span>
              <input class="form-input" type="text" v-model="form.publicationNumber" />
            </label>
            <label class="form-field">
              <span class="form-label">공고번호</span>
              <input class="form-input" type="text" v-model="form.announcementNumber" />
            </label>
            <label class="form-field">
              <span class="form-label">IPC 코드</span>
              <TagInput v-model="form.ipc" />
            </label>
            <label class="form-field">
              <span class="form-label">CPC 코드</span>
              <TagInput v-model="form.cpc" />
            </label>
            <label class="form-field">
              <span class="form-label">심사청구항수</span>
              <input class="form-input" type="number" min="0" v-model="form.examinationClaimCount" />
            </label>
            <label class="form-field">
              <span class="form-label">피인용 수</span>
              <input class="form-input" type="number" min="0" v-model="form.citationCount" />
            </label>
            <label class="form-field">
              <span class="form-label">예상 소멸일</span>
              <input class="form-input" type="date" v-model="form.expiryDate" />
            </label>
          </div>
        </div>

        <!-- 내용 요약 -->
        <div class="form-section">
          <div class="form-section__title">내용 요약</div>
          <div class="form-grid">
            <label class="form-field full">
              <span class="form-label">키워드</span>
              <TagInput v-model="form.keywords" />
            </label>
            <label class="form-field full">
              <span class="form-label">발명의 요약</span>
              <textarea class="form-textarea" v-model="form.summary" placeholder="특허의 핵심 기술 내용을 요약해 주세요." />
            </label>
          </div>
        </div>

        <!-- 행정 상태 -->
        <div class="form-section">
          <div class="form-section__title">행정 상태</div>
          <div class="ah-stack">
            <div v-for="(entry, idx) in adminHistory" :key="idx" class="ah-row">
              <select :class="['ah-type-select', `ah-type-select--${entry.type}`]" v-model="entry.type">
                <option value="file">출원</option>
                <option value="pub">공개</option>
                <option value="reg">등록</option>
                <option value="rejected">거절</option>
                <option value="invalid">무효</option>
                <option value="expired">소멸</option>
                <option value="withdraw">취하</option>
                <option value="abandon">포기</option>
              </select>
              <input class="form-input ah-date" type="date" v-model="entry.date" />
              <button class="btn-ah-del" type="button" @click="adminHistory.splice(idx, 1)">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>
          <button class="btn-ah-add" type="button" @click="adminHistory.push({ type: 'file', date: '' })">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            상태 추가
          </button>
        </div>

        <!-- 하단 버튼 -->
        <div class="form-footer">
          <button class="btn-reset" type="button" @click="resetForm">초기화</button>
          <button class="btn-submit" type="button" :disabled="!form.title.trim()" @click="handleSubmit">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M22 2L11 13"/><path d="M22 2L15 22 11 13 2 9l20-7z"/>
            </svg>
            {{ resubmitTargetId ? '재신청' : '등록 신청' }}
          </button>
        </div>

        <!-- 출원 및 등록 -->
        <div class="form-section">
          <div class="form-section__title">출원 및 등록</div>
          <div class="form-grid">
            <label class="form-field">
              <span class="form-label">출원국</span>
              <input class="form-input" type="text" v-model="form.country" />
            </label>
            <label class="form-field">
              <span class="form-label">상태</span>
              <select class="form-select" v-model="form.patentStatus">
                <option>등록</option><option>출원</option><option>검토 중</option><option>포기</option>
              </select>
            </label>
            <label class="form-field">
              <span class="form-label">공동출원여부</span>
              <select class="form-select" v-model="form.coApplicant">
                <option>아니오</option><option>예</option>
              </select>
            </label>
            <label class="form-field">
              <span class="form-label">공동출원인명</span>
              <input class="form-input" type="text" v-model="form.coApplicantName" />
            </label>
            <label class="form-field">
              <span class="form-label">출원일</span>
              <input class="form-input" type="date" v-model="form.applicationDate" />
            </label>
            <label class="form-field">
              <span class="form-label">등록일</span>
              <input class="form-input" type="date" v-model="form.registrationDate" />
            </label>
            <label class="form-field">
              <span class="form-label">출원번호</span>
              <input class="form-input" type="text" v-model="form.applicationNumber" placeholder="10-2026-0000000" />
            </label>
            <label class="form-field">
              <span class="form-label">등록번호</span>
              <input class="form-input" type="text" v-model="form.registrationNumber" placeholder="10-0000000" />
            </label>
            <label class="form-field">
              <span class="form-label">IPC</span>
              <input class="form-input" type="text" v-model="form.ipc" />
            </label>
            <label class="form-field">
              <span class="form-label">예상 소멸일</span>
              <input class="form-input" type="date" v-model="form.expiryDate" />
            </label>
          </div>
        </div>

        <!-- 내용 요약 -->
        <div class="form-section">
          <div class="form-section__title">내용 요약</div>
          <div class="form-grid">
            <label class="form-field full">
              <span class="form-label">특허 개요</span>
              <textarea class="form-textarea" v-model="form.summary" placeholder="특허의 핵심 기술 내용을 요약해 주세요." />
            </label>
            <label class="form-field full">
              <span class="form-label">핵심 내용</span>
              <textarea class="form-textarea" v-model="form.coreContent" />
            </label>
          </div>
        </div>

        <!-- 행정 상태 -->
        <div class="form-section">
          <div class="form-section__title">행정 상태</div>
          <div class="ah-stack">
            <div v-for="(entry, idx) in adminHistory" :key="idx" class="ah-row">
              <select :class="['ah-type-select', `ah-type-select--${entry.type}`]" v-model="entry.type">
                <option value="file">출원</option>
                <option value="pub">공개</option>
                <option value="reg">등록</option>
                <option value="rejected">거절</option>
                <option value="invalid">무효</option>
                <option value="expired">소멸</option>
                <option value="withdraw">취하</option>
                <option value="abandon">포기</option>
              </select>
              <input class="form-input ah-date" type="date" v-model="entry.date" />
              <button class="btn-ah-del" type="button" @click="adminHistory.splice(idx, 1)">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>
          <button class="btn-ah-add" type="button" @click="adminHistory.push({ type: 'file', date: '' })">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            상태 추가
          </button>
        </div>

        <!-- 하단 버튼 -->
        <div class="form-footer">
          <button class="btn-reset" type="button" @click="resetForm">초기화</button>
          <button class="btn-submit" type="button" :disabled="!form.title.trim()" @click="handleSubmit">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M22 2L11 13"/><path d="M22 2L15 22 11 13 2 9l20-7z"/>
            </svg>
            {{ resubmitTargetId ? '재신청' : '등록 신청' }}
          </button>
        </div>
      </div>
    </template>

    <!-- ── 탭 2: 신청 현황 ── -->
    <template v-else>
      <div v-if="!myApplications.length" class="list-empty-card">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
        <p>아직 신청한 특허가 없습니다.</p>
        <button class="btn-outline" @click="activeTab = 'write'">신규 신청하기</button>
      </div>

      <div v-else class="review-list">
        <div
          v-for="app in myApplications"
          :key="app.id"
          class="review-row"
          @click="router.push({ name: 'BizApplicationDetail', params: { appId: app.id } })"
        >
          <span
            class="app-status-badge"
            :class="app.appStatus === 'pending' && app.isResubmit ? 'app-status--resubmit' : `app-status--${app.appStatus}`"
          >
            {{ app.appStatus === 'pending' && app.isResubmit ? '재신청' : appStatusLabel(app.appStatus) }}
          </span>
          <span class="review-row__title">{{ app.title }}</span>
          <span class="review-row__dept">신청일 {{ app.submittedAt }}</span>

          <!-- 오른쪽 끝: 항상 chevron, 승인이면 hover 시 절대위치 쓰레기통 -->
          <div class="row-end">
            <button
              v-if="app.appStatus === 'approved'"
              class="btn-row-trash"
              @click.stop="confirmDeleteId = confirmDeleteId === app.id ? null : app.id"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6"/><path d="M14 11v6"/>
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
            </button>
            <div v-if="confirmDeleteId === app.id" class="delete-popover">
              <p class="delete-popover__msg">목록에서 삭제할까요?</p>
              <div class="delete-popover__btns">
                <button class="btn-pop-cancel" @click.stop="confirmDeleteId = null">취소</button>
                <button class="btn-pop-delete" @click.stop="remove(app.id)">삭제</button>
              </div>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="review-row__chevron">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </div>
        </div>
      </div>
    </template>

  </div>

  <!-- ── 재신청 완료 팝업 ── -->
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="showSuccessModal" class="modal-backdrop" @click.self="confirmSuccess">
        <div class="modal-box">
          <div class="modal-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <h3 class="modal-title">{{ resubmitTargetId ? '재신청이 완료되었습니다' : '등록 신청이 완료되었습니다' }}</h3>
          <p class="modal-desc">{{ resubmitTargetId ? '재신청' : '신청' }} 진행현황은 신청 현황에서 확인하실 수 있습니다.</p>
          <button class="modal-confirm-btn" @click="confirmSuccess">확인</button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { usePatentApplications, type PatentApplication } from '@/composables/usePatentApplications'
import { useAuthStore } from '@/stores/auth'
import { patentsApi, type PatentCreateRequest } from '@/api/patents'
import TagInput from '@/components/ui/TagInput.vue'

const router = useRouter()
const route  = useRoute()
const auth = useAuthStore()
const { applications, submit, resubmit, withdraw, remove, fetchApplications } = usePatentApplications()

onMounted(() => fetchApplications())

const confirmDeleteId = ref<number | null>(null)
const submitted = ref(false)

// ── 탭 ──────────────────────────────────────────────
type TabKey = 'write' | 'history'
const activeTab = ref<TabKey>(route.query.tab === 'history' ? 'history' : 'write')

const tabs: { key: TabKey; label: string; icon: string }[] = [
  {
    key: 'write',
    label: '신청서 작성',
    icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
  },
  {
    key: 'history',
    label: '신청 현황',
    icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
  },
]

// 내 신청 목록 (실제로는 내 사업부 소속만)
const myDept = computed(() => auth.user?.name ?? '반도체사업부')
const myApplications = computed(() =>
  applications.value.filter(a => a.appStatus !== 'withdrawn')
)

// ── 폼 ──────────────────────────────────────────────
const fileInputRef = ref<HTMLInputElement | null>(null)
const uploadedFile = ref<File | null>(null)
const showSuccessModal = ref(false)
const resubmitTargetId = ref<number | null>(null)
const resubmitTargetTitle = ref('')

const AH_LABELS: Record<string, string> = {
  file: '출원', pub: '공개', reg: '등록', rejected: '거절',
  invalid: '무효', expired: '소멸', withdraw: '취하', abandon: '포기',
}

const adminHistory = ref<{ type: string; date: string }[]>([])

const form = reactive({
  title: '', finalTitle: '', managementNumber: '', inventors: '', applicant: '',
  bizField: '', techField: '', relatedProducts: [] as string[], country: 'KR',
  patentStatus: '출원', coApplicant: '아니오', coApplicantName: '',
  applicationDate: '', registrationDate: '', publicationDate: '', announcementDate: '',
  applicationNumber: '', registrationNumber: '', publicationNumber: '', announcementNumber: '',
  ipc: [] as string[], cpc: [] as string[], examinationClaimCount: '', citationCount: '',
  expiryDate: '', keywords: [] as string[], summary: '', coreContent: '',
})

function handleFileSelect(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) uploadedFile.value = file
}

function resetForm() {
  Object.assign(form, {
    title: '', finalTitle: '', managementNumber: '', inventors: '', applicant: '',
    bizField: '', techField: '', relatedProducts: [], country: 'KR',
    patentStatus: '출원', coApplicant: '아니오', coApplicantName: '',
    applicationDate: '', registrationDate: '', publicationDate: '', announcementDate: '',
    applicationNumber: '', registrationNumber: '', publicationNumber: '', announcementNumber: '',
    ipc: [], cpc: [], examinationClaimCount: '', citationCount: '',
    expiryDate: '', keywords: [] as string[], summary: '', coreContent: '',
  })
  uploadedFile.value = null
  adminHistory.value = []
  resubmitTargetId.value = null
  resubmitTargetTitle.value = ''
}

function startResubmit(app: PatentApplication) {
  resubmitTargetId.value = app.id
  resubmitTargetTitle.value = app.title
  Object.assign(form, {
    title: app.title,
    managementNumber: app.managementNumber,
    inventors: app.inventors,
    finalTitle: app.finalTitle,
    bizField: app.bizField,
    techField: app.techField,
    relatedProducts: Array.isArray(app.relatedProducts) ? app.relatedProducts : (app.relatedProducts ? [app.relatedProducts] : []),
    country: app.country,
    patentStatus: app.patentStatus,
    coApplicant: app.coApplicant,
    coApplicantName: app.coApplicantName,
    applicationDate: app.applicationDate,
    registrationDate: app.registrationDate,
    publicationDate: app.publicationDate ?? '',
    announcementDate: app.announcementDate ?? '',
    applicationNumber: app.applicationNumber,
    registrationNumber: app.registrationNumber,
    publicationNumber: app.publicationNumber ?? '',
    announcementNumber: app.announcementNumber ?? '',
    ipc: Array.isArray(app.ipc) ? app.ipc : (app.ipc ? [app.ipc] : []),
    cpc: Array.isArray(app.cpc) ? app.cpc : (app.cpc ? [app.cpc] : []),
    examinationClaimCount: app.examinationClaimCount ?? '',
    citationCount: app.citationCount ?? '',
    expiryDate: app.expiryDate,
    keywords: Array.isArray(app.keywords) ? app.keywords : (app.keywords ? [app.keywords] : []),
    summary: app.summary,
  })
  submitted.value = false
  activeTab.value = 'write'
}

async function handleSubmit() {
  if (resubmitTargetId.value !== null) {
    resubmit(resubmitTargetId.value, { ...form })
  } else {
    submit({ ...form }, myDept.value)
  }
  showSuccessModal.value = true
}

function confirmSuccess() {
  showSuccessModal.value = false
  resetForm()
  activeTab.value = 'history'
}

function handleWithdraw(id: number) {
  withdraw(id)
}

function appStatusLabel(s: string) {
  return { pending: '검토 중', approved: '승인', rejected: '거절', withdrawn: '철회' }[s] ?? s
}
</script>

<style scoped>
.register-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  font-family: 'Pretendard', sans-serif;
}

.page-header { display: flex; align-items: flex-end; gap: 12px; }
.page-header__title { font-size: 22px; font-weight: 700; color: var(--color-text); margin: 0 0 4px; letter-spacing: -0.02em; }
.page-header__desc  { font-size: 13.5px; color: var(--color-text-muted); margin: 0; }

/* ── 탭 ── */
.tab-bar {
  display: flex;
  gap: 4px;
  border-bottom: 1.5px solid var(--color-border);
}
.tab-btn {
  display: flex; align-items: center; gap: 7px;
  padding: 10px 18px;
  background: none; border: none; cursor: pointer;
  font-size: 13.5px; font-weight: 500; font-family: inherit;
  color: var(--color-text-muted);
  white-space: nowrap; position: relative; transition: color .13s;
}
.tab-btn:hover { color: var(--color-text); }
.tab-btn--active { color: var(--c-green-600, #16a34a); font-weight: 700; }
.tab-btn--active::after {
  content: '';
  position: absolute; bottom: -1.5px; left: 0; right: 0;
  height: 2px; background: var(--c-green-500, #22c55e);
  border-radius: 2px 2px 0 0;
}
.tab-btn__icon { display: flex; }
.tab-badge {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 18px; height: 18px; padding: 0 5px;
  background: var(--c-green-500, #22c55e); color: #fff;
  border-radius: 9px; font-size: 11px; font-weight: 700;
}

/* ── 제출 완료 ── */
.submit-success {
  background: var(--color-surface); border: 1px solid var(--color-border);
  border-radius: 16px; padding: 56px 32px;
  display: flex; flex-direction: column; align-items: center; gap: 12px; text-align: center;
}
.submit-success__icon {
  width: 64px; height: 64px; background: var(--color-success-bg); color: var(--color-success-dark);
  border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 4px;
}
.submit-success__title { font-size: 18px; font-weight: 700; color: var(--color-text); margin: 0; }
.submit-success__desc  { font-size: 14px; color: var(--color-text-muted); margin: 0; }
.submit-success__actions { display: flex; gap: 10px; margin-top: 8px; }
.btn-outline {
  padding: 9px 20px;
  background: var(--color-surface-muted); border: 1px solid var(--color-border);
  border-radius: 9px; font-size: 13.5px; font-weight: 600; font-family: inherit;
  color: var(--color-text-secondary); cursor: pointer;
}

/* ── 폼 카드 ── */
.form-card {
  background: var(--color-surface); border: 1px solid var(--color-border);
  border-radius: 16px; padding: 28px 32px;
  display: flex; flex-direction: column; gap: 24px;
}

.resubmit-banner {
  display: flex; align-items: center; gap: 10px;
  padding: 12px 16px;
  background: #fff7ed; border: 1px solid #fed7aa;
  border-radius: 9px; font-size: 13.5px; color: #c2410c;
}
.resubmit-banner svg { flex-shrink: 0; }
.resubmit-banner span { flex: 1; }
.resubmit-banner__cancel {
  padding: 4px 12px;
  background: none; border: 1px solid #fed7aa; border-radius: 6px;
  font-size: 12.5px; font-weight: 600; font-family: inherit;
  color: #c2410c; cursor: pointer;
}

/* ── PDF 업로드 ── */
.upload-panel {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 18px; border: 2px dashed var(--color-border);
  border-radius: 10px; background: var(--color-surface-muted);
}
.upload-drop {
  flex: 1; display: flex; align-items: center; gap: 10px;
  font-size: 13.5px; color: var(--color-text-muted); cursor: pointer;
}
.upload-drop svg { color: var(--c-green-500, #22c55e); flex-shrink: 0; }
.btn-extract {
  display: flex; align-items: center; gap: 7px; padding: 8px 16px;
  background: var(--color-surface); border: 1.5px solid var(--color-border);
  border-radius: 8px; font-size: 13px; font-weight: 600; font-family: inherit;
  color: var(--color-text-secondary); cursor: pointer; white-space: nowrap;
}
.btn-extract:hover { background: var(--color-surface-hover); }

/* ── 섹션/그리드 ── */
.form-section { display: flex; flex-direction: column; gap: 12px; }
.form-section__title {
  font-size: 12px; font-weight: 700; color: var(--color-text-muted);
  text-transform: uppercase; letter-spacing: .06em;
  padding-bottom: 8px; border-bottom: 1px solid var(--color-surface-muted);
}
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 20px; }
.form-field { display: flex; flex-direction: column; gap: 5px; }
.form-field.full { grid-column: 1 / -1; }
.form-label { font-size: 12px; font-weight: 600; color: var(--color-text-secondary); }
.required { color: var(--color-danger); }

.form-input, .form-select {
  padding: 8px 12px; border: 1.5px solid var(--color-border); border-radius: 7px;
  font-size: 13.5px; font-family: inherit; color: var(--color-text);
  background: var(--color-surface-muted); outline: none;
  width: 100%; box-sizing: border-box; transition: border-color .15s, background .15s;
}
.form-input:focus, .form-select:focus { border-color: var(--c-green-400, #4ade80); background: var(--color-surface); }
.form-input::placeholder { color: var(--color-text-subtle); }
.form-select { appearance: none; cursor: pointer; }
.form-textarea {
  padding: 8px 12px; border: 1.5px solid var(--color-border); border-radius: 7px;
  font-size: 13.5px; font-family: inherit; color: var(--color-text);
  background: var(--color-surface-muted); outline: none; resize: vertical;
  line-height: 1.6; min-height: 80px; width: 100%; box-sizing: border-box;
  transition: border-color .15s, background .15s;
}
.form-textarea:focus { border-color: var(--c-green-400, #4ade80); background: var(--color-surface); }
.form-textarea::placeholder { color: var(--color-text-subtle); }

/* ── 하단 버튼 ── */
/* ── 행정 상태 스택 ── */
.ah-stack { display: flex; flex-direction: column; gap: 8px; margin-bottom: 10px; }

.ah-row {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 14px;
  background: var(--color-surface-muted);
  border: 1.5px solid var(--color-border);
  border-radius: 10px;
  transition: border-color .13s;
}
.ah-row:focus-within { border-color: var(--color-primary); }

.ah-type-select {
  padding: 5px 10px; border-radius: 7px; border: 1.5px solid transparent;
  font-size: 13px; font-weight: 700; font-family: inherit;
  cursor: pointer; appearance: none; outline: none;
  flex-shrink: 0; min-width: 72px; text-align: center;
  transition: background .13s;
}
.ah-type-select--file     { background: #ede9fe; color: #4f46e5; }
.ah-type-select--pub      { background: #f3f4f6; color: #4b5563; }
.ah-type-select--reg      { background: #dcfce7; color: #15803d; }
.ah-type-select--rejected { background: #fee2e2; color: #b91c1c; }
.ah-type-select--invalid  { background: #ffedd5; color: #c2410c; }
.ah-type-select--expired  { background: #e5e7eb; color: #374151; }
.ah-type-select--withdraw { background: #fef9c3; color: #854d0e; }
.ah-type-select--abandon  { background: #ffe4e6; color: #be123c; }

.ah-date {
  flex: 1;
  padding: 5px 10px !important;
  font-size: 13px !important;
  background: var(--color-surface) !important;
}

.btn-ah-del {
  display: flex; align-items: center; justify-content: center;
  width: 26px; height: 26px; flex-shrink: 0;
  background: none; border: none; border-radius: 6px;
  color: var(--color-text-muted); cursor: pointer; transition: background .12s, color .12s;
}
.btn-ah-del:hover { background: var(--color-danger-bg); color: var(--color-danger); }

.btn-ah-add {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 16px; border-radius: 8px;
  background: none; border: 1.5px dashed var(--color-border);
  font-size: 13px; font-weight: 600; font-family: inherit;
  color: var(--color-text-muted); cursor: pointer;
  width: 100%; justify-content: center;
  transition: border-color .13s, color .13s, background .13s;
}
.btn-ah-add:hover { border-color: var(--color-primary); color: var(--color-primary); background: var(--color-primary-bg); }

.form-footer { display: flex; justify-content: flex-end; gap: 10px; padding-top: 4px; }
.btn-reset {
  padding: 9px 20px; background: var(--color-surface-muted);
  border: 1px solid var(--color-border); border-radius: 9px;
  font-size: 13.5px; font-weight: 600; font-family: inherit;
  color: var(--color-text-muted); cursor: pointer;
}
.btn-submit {
  display: flex; align-items: center; gap: 8px; padding: 9px 24px;
  background: linear-gradient(135deg, #059669, #34d399);
  color: #fff; border: none; border-radius: 9px;
  font-size: 13.5px; font-weight: 600; font-family: inherit;
  cursor: pointer; box-shadow: 0 4px 12px rgba(16,185,129,.25);
  transition: opacity .15s;
}
.btn-submit:disabled { opacity: .45; cursor: not-allowed; }
.btn-submit:not(:disabled):hover { opacity: .9; }

/* ── 신청 현황 빈 상태 ── */
.list-empty-card {
  background: var(--color-surface); border: 1px solid var(--color-border);
  border-radius: 14px; padding: 56px 32px;
  display: flex; flex-direction: column; align-items: center; gap: 12px;
  text-align: center; color: var(--color-text-subtle);
}
.list-empty-card p { font-size: 13.5px; margin: 0; }

/* ── 신청 현황 목록 ── */
.review-list {
  background: var(--color-surface); border: 1px solid var(--color-border);
  border-radius: 14px; overflow: hidden;
  display: flex; flex-direction: column;
}

.review-row {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 20px;
  border-bottom: 1px solid var(--color-surface-muted);
  cursor: pointer; transition: background .12s;
}
.review-row:last-child { border-bottom: none; }
.review-row:hover { background: var(--color-surface-hover); }

.review-row__title { flex: 1; font-size: 14px; font-weight: 600; color: var(--color-text); min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.review-row__dept  { font-size: 12px; color: var(--color-text-muted); white-space: nowrap; flex-shrink: 0; }
.review-row__date  { font-size: 12px; color: var(--color-text-muted); white-space: nowrap; flex-shrink: 0; }
.review-row__chevron { flex-shrink: 0; color: var(--color-text-muted); }

.row-end {
  position: relative; flex-shrink: 0;
  display: flex; align-items: center;
}

.btn-row-trash {
  position: absolute; right: 0;
  display: flex; align-items: center; justify-content: center;
  width: 24px; height: 24px; border-radius: 6px;
  background: #fff; border: none; cursor: pointer;
  color: #cbd5e1;
  opacity: 0; transition: opacity .15s, background .12s, color .12s;
}
.review-row:hover .btn-row-trash { opacity: 1; color: #94a3b8; }
.btn-row-trash:hover { background: #fee2e2; color: #b91c1c; }

.delete-popover {
  position: absolute; right: 0; top: calc(100% + 6px);
  background: #fff; border: 1px solid #e2e8f0; border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0,0,0,.12);
  padding: 14px 16px; display: flex; flex-direction: column; gap: 10px;
  min-width: 170px; z-index: 50;
}
.delete-popover__msg {
  font-size: 13px; font-weight: 600; color: #0f172a; margin: 0; white-space: nowrap;
}
.delete-popover__btns { display: flex; gap: 6px; justify-content: flex-end; }

.btn-pop-cancel {
  padding: 5px 12px; border-radius: 7px;
  background: var(--color-surface-muted); border: 1px solid var(--color-border);
  font-size: 12.5px; font-weight: 600; font-family: inherit;
  color: var(--color-text-muted); cursor: pointer;
}
.btn-pop-delete {
  padding: 5px 14px; border-radius: 7px;
  background: #b91c1c; border: none; color: #fff;
  font-size: 12.5px; font-weight: 700; font-family: inherit; cursor: pointer;
  transition: opacity .15s;
}
.btn-pop-delete:hover { opacity: .85; }

.app-status-badge {
  display: inline-flex; align-items: center;
  padding: 3px 10px; border-radius: 6px;
  font-size: 12px; font-weight: 700; white-space: nowrap; flex-shrink: 0;
}
.app-status--pending   { background: #fee2e2; color: #b91c1c; }
.app-status--resubmit  { background: #ede9fe; color: #5b21b6; }
.app-status--approved  { background: #dcfce7; color: #166534; }
.app-status--rejected  { background: #fef9c3; color: #854d0e; }
.app-status--withdrawn { background: #f1f5f9; color: #475569; }

.btn-action {
  display: flex; align-items: center; gap: 6px;
  padding: 7px 16px; border-radius: 8px;
  font-size: 13px; font-weight: 600; font-family: inherit;
  cursor: pointer; transition: background .12s;
}
.btn-action--edit {
  background: var(--color-primary-bg); border: 1px solid var(--color-primary-border);
  color: var(--color-primary-dark);
}
.btn-action--edit:hover { background: var(--color-primary-border); }
.btn-action--withdraw {
  background: var(--color-surface-muted); border: 1px solid var(--color-border);
  color: var(--color-text-muted);
}
.btn-action--withdraw:hover { background: var(--color-surface-hover); }

.visually-hidden {
  position: absolute; width: 1px; height: 1px;
  overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap;
}

/* ── 재신청 완료 팝업 ── */
.modal-backdrop {
  position: fixed; inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex; align-items: center; justify-content: center;
  z-index: 300; backdrop-filter: blur(2px);
}
.modal-box {
  background: var(--color-surface); border-radius: 20px;
  padding: 40px 36px; width: min(400px, 90vw);
  display: flex; flex-direction: column; align-items: center; gap: 12px;
  text-align: center;
  box-shadow: 0 24px 64px rgba(15, 23, 42, 0.18);
}
.modal-icon {
  width: 60px; height: 60px;
  background: #dcfce7; color: #16a34a;
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
  margin-bottom: 4px;
}
.modal-title { font-size: 17px; font-weight: 700; color: var(--color-text); margin: 0; }
.modal-desc  { font-size: 13.5px; color: var(--color-text-muted); margin: 0; line-height: 1.6; }
.modal-confirm-btn {
  margin-top: 8px; padding: 10px 36px;
  background: linear-gradient(135deg, #059669, #34d399);
  color: #fff; border: none; border-radius: 10px;
  font-size: 14px; font-weight: 700; font-family: inherit;
  cursor: pointer; box-shadow: 0 4px 12px rgba(16,185,129,.25);
  transition: opacity .15s;
}
.modal-confirm-btn:hover { opacity: .9; }

.modal-fade-enter-active { transition: opacity 0.2s; }
.modal-fade-leave-active { transition: opacity 0.15s; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
.modal-fade-enter-active .modal-box { animation: modalPop 0.22s cubic-bezier(0.34, 1.56, 0.64, 1); }
@keyframes modalPop {
  from { transform: translateY(12px) scale(0.96); opacity: 0; }
  to   { transform: translateY(0) scale(1); opacity: 1; }
}
</style>
