<template>
  <div class="doc-register-page">
    <div class="doc-modal-body">

      <!-- 헤더 -->
      <div class="doc-work-head">
        <div class="doc-work-title">
          <div class="card-title">신규 특허 등록</div>
          <div class="muted doc-list-meta">특허 PDF에서 기본 항목을 추출한 뒤 이상한 문구를 수정해 등록합니다.</div>
        </div>
        <div class="doc-work-actions">
          <button class="btn" type="button" @click="handleCancel">취소</button>
          <button class="btn primary" type="button" :disabled="isSubmitting || isExtracting" @click="handleSave">저장</button>
        </div>
      </div>


      <!-- PDF 업로드 -->
      <div class="doc-upload-panel" aria-label="특허 PDF 업로드">
        <label class="doc-upload-drop" for="doc-new-pdf">
          <span aria-hidden="true">↥</span>
          <span>{{ uploadedFile ? uploadedFile.name : '특허 PDF 업로드 · patent_notice_A.pdf' }}</span>
        </label>
        <input id="doc-new-pdf" class="visually-hidden" type="file" accept=".pdf" ref="fileInputRef" @change="handleFileSelect" />
        <button class="btn" type="button" :disabled="isExtracting" @click="handleExtract">PDF에서 항목 추출</button>
      </div>
      <button class="btn-new-register" @click="openRegisterModal">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        신규 등록
      </button>
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
        <span v-if="tab.key === 'review' && pendingCount > 0" class="tab-badge tab-badge--alert">{{ pendingCount }}</span>
      </button>
    </div>

    <!-- ── 탭 1: 신청 검토 ── -->
    <template v-if="activeTab === 'review'">
      <div v-if="!reviewApplications.length" class="list-card">
        <div class="list-empty">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          <p>검토할 신청이 없습니다.</p>
        </div>
      </div>

      <div v-else class="review-list">
        <div
          v-for="app in reviewApplications"
          :key="app.id"
          class="review-row"
          @click="router.push({ name: 'LegalReviewDetail', params: { appId: app.id } })"
        >
          <span
            class="app-status-badge"
            :class="app.appStatus === 'pending' && app.isResubmit ? 'app-status--resubmit' : `app-status--${app.appStatus}`"
          >
            {{ app.appStatus === 'pending' && app.isResubmit ? '재신청' : appStatusLabel(app.appStatus) }}
          </span>
          <span class="review-row__title">{{ app.title }}</span>
          <span class="review-row__dept">{{ app.submittedBy }}</span>
          <span class="review-row__date">신청일 {{ app.submittedAt }}</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="review-row__chevron">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </div>
      </div>
    </template>

    <!-- ── 탭 2: 특허 목록 ── -->
    <template v-else>
      <div class="list-card">

        <div class="list-toolbar">
          <div class="list-search-wrap">
            <svg class="list-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input class="list-search-input" type="text" v-model="searchQuery" placeholder="특허명, 출원번호로 검색" />
          </div>
          <p class="list-total">총 <strong>{{ filteredPatents.length }}</strong>건</p>
        </div>

        <div v-if="!filteredPatents.length" class="list-empty">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <p>검색 결과가 없습니다.</p>
        </div>

        <template v-else>
          <div class="list-header">
            <div class="list-header__cell">특허명</div>
            <div class="list-header__cell">출원번호</div>
            <div class="list-header__cell">기술분야</div>
            <div class="list-header__cell">상태</div>
            <div class="list-header__cell">출원일</div>
            <div class="list-header__cell list-header__cell--action"></div>
          </div>

          <div class="list-rows">
            <div v-for="p in filteredPatents" :key="p.id" class="list-row">
              <div class="list-row__cell list-row__title">{{ p.title }}</div>
              <div class="list-row__cell list-row__mono">{{ p.applicationNumber }}</div>
              <div class="list-row__cell">
                <span v-if="p.techField" class="field-tag">{{ p.techField }}</span>
                <span v-else class="text-muted">—</span>
              </div>
              <div class="list-row__cell">
                <span class="status-badge" :class="statusClass(p.status)">{{ statusLabel(p.status) }}</span>
              </div>
              <div class="list-row__cell list-row__mono">{{ p.applicationDate }}</div>
              <div class="list-row__cell list-row__actions">
                <button class="btn-action btn-action--edit" @click="startEdit(p)">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  수정
                </button>
                <button class="btn-action btn-action--delete" @click="confirmDelete(p)">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                    <path d="M10 11v6"/><path d="M14 11v6"/>
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                  </svg>
                  삭제
                </button>
              </div>
            </div>
          </div>
        </template>
      </div>
    </template>

    <!-- ── 신규 등록 / 수정 모달 ── -->
    <Teleport to="body">
      <Transition name="reg-modal">
        <div v-if="showRegisterModal" class="reg-overlay" @click.self="closeRegisterModal">
          <div class="reg-panel">

            <!-- 모달 헤더 -->
            <div class="reg-panel__head">
              <div>
                <h3 class="reg-panel__title">{{ editMode ? '특허 수정' : '신규 특허 등록' }}</h3>
                <p class="reg-panel__sub">{{ editMode ? editTargetTitle : '새 특허 정보를 입력하세요.' }}</p>
              </div>
              <button class="reg-panel__close" @click="closeRegisterModal">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <!-- 모달 바디 -->
            <div class="reg-panel__body">

              <!-- PDF 업로드 (신규 등록 시만) -->
              <div v-if="!editMode" class="upload-panel">
                <label class="upload-drop" for="legal-pdf">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  <span>{{ uploadedFile ? uploadedFile.name : '특허 PDF 업로드 · 클릭하거나 파일을 여기에 끌어다 놓으세요' }}</span>
                </label>
                <input id="legal-pdf" class="visually-hidden" type="file" accept=".pdf" ref="fileInputRef" @change="handleFileSelect" />
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
                  <label class="form-field full">
                    <span class="form-label">발명의 명칭(최종)</span>
                    <input class="form-input" type="text" v-model="form.finalTitle" />
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
                    <select class="form-select" v-model="form.status">
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

            </div>

            <!-- 모달 푸터 -->
            <div class="reg-panel__foot">
              <button class="btn-reset" type="button" @click="closeRegisterModal">취소</button>
              <button class="btn-submit" type="button" :disabled="!form.title.trim()" @click="handleSave">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                  <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
                </svg>
                {{ editMode ? '수정 저장' : '등록' }}
              </button>
            </div>

          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- 삭제 확인 모달 -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="deleteTarget" class="modal-overlay" @click.self="deleteTarget = null">
          <div class="modal">
            <div class="modal__header">
              <h3 class="modal__title">특허 삭제</h3>
              <button class="modal__close" @click="deleteTarget = null">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div class="modal__body">
              <p class="delete-confirm-text">
                아래 특허를 삭제하면 복구할 수 없습니다.<br />정말 삭제하시겠습니까?
              </p>
              <div class="delete-target-name">{{ deleteTarget?.title }}</div>
            </div>
            <div class="modal__footer">
              <button class="btn-cancel" @click="deleteTarget = null">취소</button>
              <button class="btn-delete-confirm" @click="handleDelete">삭제</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { patentsApi, type PatentCreateRequest } from '@/api/patents'

const router = useRouter()
const { applications } = usePatentApplications()
const { addApprovedPatent } = usePatentDatabase()

// ── 탭 ──────────────────────────────────────────────
type TabKey = 'review' | 'list'
const activeTab = ref<TabKey>('review')

const tabs: { key: TabKey; label: string; icon: string }[] = [
  {
    key: 'review',
    label: '신청 검토',
    icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`,
  },
  {
    key: 'list',
    label: '특허 목록 / 수정·삭제',
    icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>`,
  },
]

// ── 신청 검토 ────────────────────────────────────────
const reviewApplications = computed(() =>
  applications.value.filter(a => a.appStatus !== 'withdrawn' && a.appStatus !== 'approved')
)
const pendingCount = computed(() =>
  applications.value.filter(a => a.appStatus === 'pending').length
)

function appStatusLabel(s: string) {
  return { pending: '신규 신청', approved: '승인', rejected: '거절', withdrawn: '철회' }[s] ?? s
}

// ── 등록 모달 ────────────────────────────────────────
const AH_LABELS: Record<string, string> = {
  file: '출원', pub: '공개', reg: '등록', rejected: '거절',
  invalid: '무효', expired: '소멸', withdraw: '취하', abandon: '포기',
}

const adminHistory = ref<{ type: string; date: string }[]>([])

const showRegisterModal = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)
const uploadedFile = ref<File | null>(null)
const isExtracting = ref(false)
const isSubmitting = ref(false)
const extractJobId = ref<number | null>(null)
let extractPollTimer: ReturnType<typeof setInterval> | null = null

const form = reactive({
  title: '', managementNumber: '', inventors: '', finalTitle: '',
  bizField: '', techField: '', relatedProducts: '', country: 'KR',
  status: '등록', coApplicant: '아니오', coApplicantName: '',
  applicationDate: '', registrationDate: '', applicationNumber: '',
  registrationNumber: '', ipc: '', expiryDate: '', summary: '', coreContent: '',
})

function fillFormFromResult(result: Partial<PatentCreateRequest>) {
  if (result.title) { form.title = result.title; form.finalTitle = result.title }
  if (result.applicationNumber) form.applicationNumber = result.applicationNumber
  if (result.registrationNumber) form.registrationNumber = result.registrationNumber
  if (result.managementNumber) form.managementNumber = result.managementNumber
  if (result.inventor) form.inventors = result.inventor
  if (result.applicationDate) form.applicationDate = result.applicationDate
  if (result.registrationDate) form.registrationDate = result.registrationDate
  if (result.ipcCodes?.length) form.ipc = result.ipcCodes.join(', ')
  if (result.expiryDate) form.expiryDate = result.expiryDate
  if (result.businessField) form.bizField = result.businessField
  if (result.techField) form.techField = result.techField
  if (result.relatedProducts?.length) form.relatedProducts = result.relatedProducts.join(', ')
  if (result.summary) form.summary = result.summary
  if (result.filingCountry) form.country = result.filingCountry
}

async function handleFileSelect(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  uploadedFile.value = file
  isExtracting.value = true

  try {
    // 1. 업로드 URL 생성
    const { extractJobId: jobId, uploadUrl } = await patentsApi.createExtractUploadUrl()
    extractJobId.value = jobId

    // 2. presigned URL로 PUT 업로드 (인증 헤더 없이)
    const putRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/pdf' },
      body: file,
    })
    if (!putRes.ok) throw new Error('PDF 업로드 실패')

    // 3. 업로드 완료 신호
    await patentsApi.completeExtractUpload(jobId)

    // 4. 상태 폴링 (1초 간격)
    await new Promise<void>((resolve, reject) => {
      extractPollTimer = setInterval(async () => {
        try {
          const { status } = await patentsApi.getExtractJobStatus(jobId)
          if (status === 'COMPLETED') {
            clearInterval(extractPollTimer!)
            extractPollTimer = null
            resolve()
          } else if (status === 'FAILED') {
            clearInterval(extractPollTimer!)
            extractPollTimer = null
            reject(new Error('추출 작업 실패'))
          }
        } catch (err) {
          clearInterval(extractPollTimer!)
          extractPollTimer = null
          reject(err)
        }
      }, 1000)
    })

    // 5. 결과 조회 후 폼 자동 입력
    const result = await patentsApi.getExtractJobResult(jobId)
    fillFormFromResult(result)
  } catch (err) {
    console.error('PDF 추출 오류:', err)
  } finally {
    isExtracting.value = false
  }
}

function handleSave() {
  const mappedStatus = form.status === '등록' ? 'REGISTERED' : form.status === '포기' ? 'ABANDONED' : 'EXPIRED'

  if (editMode.value && editTargetId.value !== null) {
    const idx = patentList.value.findIndex(p => p.id === editTargetId.value)
    if (idx !== -1) {
      patentList.value[idx] = {
        ...patentList.value[idx],
        title: form.title,
        applicationNumber: form.applicationNumber,
        applicationDate: form.applicationDate,
        techField: form.techField,
        status: mappedStatus,
      }
    }
  } else {
    const newId = Date.now()
    patentList.value.unshift({
      id: newId,
      title: form.title,
      applicationNumber: form.applicationNumber,
      applicationDate: form.applicationDate,
      techField: form.techField,
      status: mappedStatus,
      dept: 'Legal',
    })
    addApprovedPatent({
      title: form.title,
      applicationNumber: form.applicationNumber,
      registrationNumber: form.registrationNumber,
      applicationDate: form.applicationDate,
      expiryDate: form.expiryDate,
      techField: form.techField,
      status: mappedStatus,
      summary: form.summary,
      citationCount: 0,
    })
  }
  closeRegisterModal()
}

function handleCancel() {
  router.push('/legal/patent-search')
}

async function handleSave() {
  if (isSubmitting.value) return
  isSubmitting.value = true
  try {
    await patentsApi.createPatent({
      title: form.finalTitle || form.title,
      applicationNumber: form.applicationNumber,
      registrationNumber: form.registrationNumber || undefined,
      managementNumber: form.managementNumber || undefined,
      inventor: form.inventors || undefined,
      applicationDate: form.applicationDate || undefined,
      registrationDate: form.registrationDate || undefined,
      ipcCodes: form.ipc ? form.ipc.split(',').map(s => s.trim()).filter(Boolean) : undefined,
      expiryDate: form.expiryDate || undefined,
      businessField: form.bizField || undefined,
      techField: form.techField || undefined,
      relatedProducts: form.relatedProducts
        ? form.relatedProducts.split(',').map(s => s.trim()).filter(Boolean)
        : undefined,
      summary: form.summary || undefined,
      filingCountry: form.country || undefined,
      // TODO: 확인 필요 - isJointApplication / jointApplicant 필드 API 지원 여부
    })
    router.push('/legal/patent-search')
  } catch (err) {
    console.error('특허 저장 오류:', err)
  } finally {
    isSubmitting.value = false
  }
}

onUnmounted(() => {
  if (extractPollTimer) {
    clearInterval(extractPollTimer)
    extractPollTimer = null
  }
})
</script>

<style scoped>
.manage-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  font-family: 'Pretendard', sans-serif;
}

.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
}
.page-header__title { font-size: 22px; font-weight: 700; color: var(--color-text); margin: 0 0 4px; letter-spacing: -0.02em; }
.page-header__desc  { font-size: 13.5px; color: var(--color-text-muted); margin: 0; }

.btn-new-register {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 9px 18px;
  background: linear-gradient(135deg, var(--color-primary-dark), var(--color-primary));
  color: #fff;
  border: none;
  border-radius: 9px;
  font-size: 13.5px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(79,70,229,.25);
  transition: opacity .15s;
}
.btn-new-register:hover { opacity: .9; }

/* ── 탭 ── */
.tab-bar {
  display: flex;
  gap: 4px;
  border-bottom: 1.5px solid var(--color-border);
}
.tab-btn {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 10px 18px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 13.5px;
  font-weight: 500;
  font-family: inherit;
  color: var(--color-text-muted);
  white-space: nowrap;
  position: relative;
  transition: color .13s;
}
.tab-btn:hover { color: var(--color-text); }
.tab-btn--active { color: var(--color-primary-dark); font-weight: 700; }
.tab-btn--active::after {
  content: '';
  position: absolute;
  bottom: -1.5px; left: 0; right: 0;
  height: 2px;
  background: var(--color-primary-dark);
  border-radius: 2px 2px 0 0;
}
.tab-btn__icon { display: flex; }

.tab-badge {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 18px; height: 18px; padding: 0 5px;
  background: var(--color-surface-muted); color: var(--color-text-muted);
  border-radius: 9px; font-size: 11px; font-weight: 700;
}
.tab-badge--alert { background: var(--color-danger-bg); color: var(--color-danger); }

/* ── 목록 카드 ── */
.list-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  overflow: hidden;
}

.list-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 20px;
  border-bottom: 1px solid var(--color-surface-muted);
}

.list-search-wrap { position: relative; flex: 1; max-width: 320px; }
.list-search-icon {
  position: absolute; left: 10px; top: 50%; transform: translateY(-50%);
  color: var(--color-text-muted); pointer-events: none;
}
.list-search-input {
  width: 100%; padding: 7px 12px 7px 32px;
  border: 1.5px solid var(--color-border); border-radius: 8px;
  font-size: 13.5px; font-family: inherit; color: var(--color-text);
  background: var(--color-surface-muted); outline: none; box-sizing: border-box;
  transition: border-color .13s;
}
.list-search-input:focus { border-color: var(--color-primary); background: var(--color-surface); }
.list-search-input::placeholder { color: var(--color-text-subtle); }

.list-total { font-size: 13px; color: var(--color-text-muted); margin: 0; white-space: nowrap; }
.list-total strong { color: var(--color-text); }

.list-empty {
  padding: 56px 24px;
  display: flex; flex-direction: column; align-items: center; gap: 10px;
  text-align: center; color: var(--color-text-subtle);
}
.list-empty p { font-size: 13.5px; margin: 0; }

.list-header {
  display: grid;
  grid-template-columns: 2.5fr 1.5fr 100px 80px 110px 160px;
  gap: 16px;
  padding: 8px 20px;
  background: var(--color-surface-muted);
  border-bottom: 1.5px solid var(--color-border);
}
.list-header__cell {
  font-size: 11.5px; font-weight: 600;
  color: var(--color-text-muted);
  letter-spacing: .04em; text-transform: uppercase; white-space: nowrap;
}
.list-header__cell--action { text-align: right; }

.list-rows { display: flex; flex-direction: column; }
.list-row {
  display: grid;
  grid-template-columns: 2.5fr 1.5fr 100px 80px 110px 160px;
  gap: 16px; align-items: center;
  padding: 13px 20px;
  border-bottom: 1px solid var(--color-surface-hover);
  transition: background .12s;
}
.list-row:last-child { border-bottom: none; }
.list-row:hover { background: var(--color-surface-hover); }

.list-row__cell { font-size: 13.5px; color: var(--color-text-secondary); min-width: 0; }
.list-row__title { font-weight: 600; color: var(--color-text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.list-row__mono { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: var(--c-slate-600); }
.list-row__actions { display: flex; gap: 6px; justify-content: flex-end; }

.field-tag {
  display: inline-block; padding: 2px 8px;
  background: var(--color-surface-muted); border-radius: 5px;
  font-size: 12px; color: var(--c-slate-600); font-weight: 500;
}
.text-muted { color: var(--c-slate-300); }

.status-badge { display: inline-block; padding: 2px 9px; border-radius: 5px; font-size: 12px; font-weight: 600; white-space: nowrap; }
.status--registered { background: #dcfce7; color: #166534; }
.status--expired    { background: #fee2e2; color: #b91c1c; }
.status--abandoned  { background: #f1f5f9; color: #475569; }

.btn-action {
  display: flex; align-items: center; gap: 5px; padding: 5px 11px;
  border-radius: 7px; font-size: 12.5px; font-weight: 600; font-family: inherit;
  cursor: pointer; transition: background .12s, color .12s; white-space: nowrap;
}
.btn-action--edit { background: var(--color-primary-bg); border: 1px solid var(--color-primary-border); color: var(--color-primary-dark); }
.btn-action--edit:hover { background: var(--color-primary-border); }
.btn-action--delete { background: var(--color-danger-bg); border: 1px solid #fecaca; color: var(--color-danger); }
.btn-action--delete:hover { background: #fecaca; }

/* ── 신청 검토 목록 ── */
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
.review-row__dept {
  font-size: 11.5px; font-weight: 600; padding: 2px 9px;
  background: var(--color-surface-muted); border-radius: 5px;
  color: var(--color-text-secondary); white-space: nowrap; flex-shrink: 0;
}
.review-row__date { font-size: 12px; color: var(--color-text-muted); white-space: nowrap; flex-shrink: 0; }
.review-row__chevron { flex-shrink: 0; color: var(--color-text-muted); }

.app-status-badge {
  display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 6px;
  font-size: 12px; font-weight: 700; white-space: nowrap; flex-shrink: 0;
}
.app-status--pending   { background: #fee2e2; color: #b91c1c; }
.app-status--resubmit  { background: #ede9fe; color: #5b21b6; }
.app-status--approved  { background: #dcfce7; color: #166534; }
.app-status--rejected  { background: #fef9c3; color: #854d0e; }
.app-status--withdrawn{ background: #f1f5f9; color: #475569; }

/* ── 신규 등록 / 수정 모달 ── */
.reg-overlay {
  position: fixed; inset: 0;
  background: rgba(15, 23, 42, 0.5);
  display: flex; align-items: center; justify-content: center;
  z-index: 200; backdrop-filter: blur(3px);
  padding: 24px;
}

.reg-panel {
  background: var(--color-surface);
  border-radius: 20px;
  width: min(820px, 100%);
  max-height: 90vh;
  display: flex; flex-direction: column;
  box-shadow: 0 32px 80px rgba(15, 23, 42, 0.22);
  overflow: hidden;
}

.reg-panel__head {
  display: flex; align-items: flex-start; justify-content: space-between; gap: 16px;
  padding: 24px 28px 20px;
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}
.reg-panel__title { font-size: 18px; font-weight: 700; color: var(--color-text); margin: 0 0 3px; }
.reg-panel__sub   { font-size: 13px; color: var(--color-text-muted); margin: 0; }
.reg-panel__close {
  width: 32px; height: 32px;
  background: var(--color-surface-muted); border: none; border-radius: 8px;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  color: var(--color-text-muted); flex-shrink: 0; transition: background .13s;
}
.reg-panel__close:hover { background: var(--color-border); }

.reg-panel__body {
  flex: 1; overflow-y: auto;
  padding: 24px 28px;
  display: flex; flex-direction: column; gap: 24px;
}

.reg-panel__foot {
  display: flex; justify-content: flex-end; gap: 10px;
  padding: 16px 28px 22px;
  border-top: 1px solid var(--color-border);
  flex-shrink: 0;
}

/* ── 폼 공통 ── */
.upload-panel {
  display: flex; align-items: center; gap: 12px; padding: 14px 18px;
  border: 2px dashed var(--color-border); border-radius: 10px;
  background: var(--color-surface-muted);
}
.upload-drop {
  flex: 1; display: flex; align-items: center; gap: 10px;
  font-size: 13.5px; color: var(--color-text-muted); cursor: pointer;
}
.upload-drop svg { color: var(--color-primary); flex-shrink: 0; }
.btn-extract {
  display: flex; align-items: center; gap: 7px; padding: 8px 16px;
  background: var(--color-surface); border: 1.5px solid var(--color-border); border-radius: 8px;
  font-size: 13px; font-weight: 600; font-family: inherit; color: var(--color-text-secondary);
  cursor: pointer; white-space: nowrap;
}
.btn-extract:hover { background: var(--color-surface-hover); }

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
.form-input:focus, .form-select:focus { border-color: var(--color-primary); background: var(--color-surface); }
.form-input::placeholder { color: var(--color-text-subtle); }
.form-select { appearance: none; cursor: pointer; }

.form-textarea {
  padding: 8px 12px; border: 1.5px solid var(--color-border); border-radius: 7px;
  font-size: 13.5px; font-family: inherit; color: var(--color-text);
  background: var(--color-surface-muted); outline: none; resize: vertical;
  line-height: 1.6; min-height: 80px; width: 100%; box-sizing: border-box;
  transition: border-color .15s, background .15s;
}
.form-textarea:focus { border-color: var(--color-primary); background: var(--color-surface); }
.form-textarea::placeholder { color: var(--color-text-subtle); }

.btn-reset {
  padding: 9px 20px; background: var(--color-surface-muted);
  border: 1px solid var(--color-border); border-radius: 9px;
  font-size: 13.5px; font-weight: 600; font-family: inherit;
  color: var(--color-text-muted); cursor: pointer;
}
.btn-submit {
  display: flex; align-items: center; gap: 8px; padding: 9px 24px;
  background: linear-gradient(135deg, var(--color-primary-dark), var(--color-primary));
  color: #fff; border: none; border-radius: 9px;
  font-size: 13.5px; font-weight: 600; font-family: inherit;
  cursor: pointer; box-shadow: 0 4px 12px rgba(79,70,229,.25); transition: opacity .15s;
}
.btn-submit:disabled { opacity: .45; cursor: not-allowed; }
.btn-submit:not(:disabled):hover { opacity: .9; }

/* ── 삭제 모달 ── */
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(15,23,42,.45);
  display: flex; align-items: center; justify-content: center;
  z-index: 300; backdrop-filter: blur(2px);
}
.modal {
  background: var(--color-surface); border-radius: 18px;
  width: min(440px, 94vw);
  box-shadow: 0 24px 64px rgba(15,23,42,.18); overflow: hidden;
}
.modal__header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 24px 16px; border-bottom: 1px solid var(--color-surface-muted);
}
.modal__title { font-size: 17px; font-weight: 700; color: var(--color-text); margin: 0; }
.modal__close {
  width: 32px; height: 32px; background: var(--color-surface-muted);
  border: none; border-radius: 8px; cursor: pointer;
  display: flex; align-items: center; justify-content: center; color: var(--color-text-muted);
}
.modal__body { padding: 20px 24px; display: flex; flex-direction: column; gap: 12px; }
.modal__footer {
  display: flex; justify-content: flex-end; gap: 10px;
  padding: 14px 24px 20px; border-top: 1px solid var(--color-surface-muted);
}

.delete-confirm-text { font-size: 13.5px; color: var(--color-text-secondary); line-height: 1.6; margin: 0; }
.delete-target-name {
  font-size: 14px; font-weight: 600; color: var(--color-text);
  background: var(--color-surface-muted); padding: 10px 14px; border-radius: 8px;
}

.btn-cancel {
  padding: 9px 20px; background: var(--color-surface-muted);
  border: 1px solid var(--color-border); border-radius: 9px;
  font-size: 13.5px; font-weight: 600; font-family: inherit; cursor: pointer; color: var(--c-slate-600);
}
.btn-delete-confirm {
  padding: 9px 22px; background: var(--color-danger); color: #fff;
  border: none; border-radius: 9px; font-size: 13.5px; font-weight: 600; font-family: inherit;
  cursor: pointer; transition: opacity .15s;
}
.btn-delete-confirm:hover { opacity: .85; }

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

.visually-hidden {
  position: absolute; width: 1px; height: 1px;
  overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap;
}

/* ── 등록 모달 애니메이션 ── */
.reg-modal-enter-active { transition: opacity .2s; }
.reg-modal-leave-active { transition: opacity .15s; }
.reg-modal-enter-from, .reg-modal-leave-to { opacity: 0; }
.reg-modal-enter-active .reg-panel { animation: panelUp .22s cubic-bezier(.34,1.56,.64,1); }
@keyframes panelUp {
  from { transform: translateY(16px) scale(.98); opacity: 0; }
  to   { transform: translateY(0) scale(1); opacity: 1; }
}

/* ── 삭제 모달 애니메이션 ── */
.modal-enter-active { transition: opacity .2s; }
.modal-leave-active { transition: opacity .15s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-active .modal { animation: modalUp .22s cubic-bezier(.34,1.56,.64,1); }
@keyframes modalUp { from { transform: translateY(12px) scale(.98); } to { transform: translateY(0) scale(1); } }
</style>
