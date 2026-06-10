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

      <!-- 기본 정보 -->
      <div class="doc-form-section">
        <div class="doc-form-section-title">기본 정보</div>
        <div class="doc-extract-grid" aria-label="기본 정보 입력 항목">
          <label class="doc-extract-field full">
            <span class="doc-extract-label">특허 제목</span>
            <input class="doc-extract-input" type="text" v-model="form.title" />
          </label>
          <label class="doc-extract-field">
            <span class="doc-extract-label">관리번호</span>
            <input class="doc-extract-input" type="text" v-model="form.managementNumber" />
          </label>
          <label class="doc-extract-field">
            <span class="doc-extract-label">발명자</span>
            <input class="doc-extract-input" type="text" v-model="form.inventors" />
          </label>
          <label class="doc-extract-field full">
            <span class="doc-extract-label">발명의 명칭(최종)</span>
            <input class="doc-extract-input" type="text" v-model="form.finalTitle" />
          </label>
        </div>
      </div>

      <!-- 분류 및 제품 -->
      <div class="doc-form-section">
        <div class="doc-form-section-title">분류 및 제품</div>
        <div class="doc-extract-grid" aria-label="분류 및 제품 입력 항목">
          <label class="doc-extract-field">
            <span class="doc-extract-label">관련사업 분야</span>
            <input class="doc-extract-input" type="text" v-model="form.bizField" />
          </label>
          <label class="doc-extract-field">
            <span class="doc-extract-label">관련기술 분야</span>
            <input class="doc-extract-input" type="text" v-model="form.techField" />
          </label>
          <label class="doc-extract-field doc-manual-field full">
            <span class="doc-extract-label">관련제품</span>
            <input class="doc-extract-input" type="text" v-model="form.relatedProducts" />
          </label>
        </div>
      </div>

      <!-- 출원 및 등록 -->
      <div class="doc-form-section">
        <div class="doc-form-section-title">출원 및 등록</div>
        <div class="doc-extract-grid" aria-label="출원 및 등록 입력 항목">
          <label class="doc-extract-field">
            <span class="doc-extract-label">출원국</span>
            <input class="doc-extract-input" type="text" v-model="form.country" />
          </label>
          <label class="doc-extract-field">
            <span class="doc-extract-label">상태</span>
            <select class="doc-extract-select" v-model="form.status">
              <option>등록</option>
              <option>출원</option>
              <option>검토 중</option>
              <option>포기</option>
            </select>
          </label>
          <label class="doc-extract-field">
            <span class="doc-extract-label">공동출원여부</span>
            <select class="doc-extract-select" v-model="form.coApplicant">
              <option>아니오</option>
              <option>예</option>
            </select>
          </label>
          <label class="doc-extract-field">
            <span class="doc-extract-label">공동출원인명</span>
            <input class="doc-extract-input" type="text" v-model="form.coApplicantName" placeholder="공동출원인명 입력" />
          </label>
          <label class="doc-extract-field">
            <span class="doc-extract-label">출원일</span>
            <input class="doc-extract-input" type="date" v-model="form.applicationDate" />
          </label>
          <label class="doc-extract-field">
            <span class="doc-extract-label">등록일</span>
            <input class="doc-extract-input" type="date" v-model="form.registrationDate" />
          </label>
          <label class="doc-extract-field">
            <span class="doc-extract-label">출원번호</span>
            <input class="doc-extract-input" type="text" v-model="form.applicationNumber" />
          </label>
          <label class="doc-extract-field">
            <span class="doc-extract-label">등록번호</span>
            <input class="doc-extract-input" type="text" v-model="form.registrationNumber" />
          </label>
          <label class="doc-extract-field">
            <span class="doc-extract-label">IPC</span>
            <input class="doc-extract-input" type="text" v-model="form.ipc" />
          </label>
          <label class="doc-extract-field">
            <span class="doc-extract-label">예상 소멸일</span>
            <input class="doc-extract-input" type="date" v-model="form.expiryDate" />
          </label>
        </div>
      </div>

      <!-- 추출 요약 -->
      <div class="doc-form-section">
        <div class="doc-form-section-title">추출 요약</div>
        <div class="doc-extract-grid" aria-label="PDF 추출 요약 입력 항목">
          <label class="doc-extract-field full">
            <span class="doc-extract-label">특허 개요</span>
            <textarea class="doc-extract-textarea" v-model="form.summary"></textarea>
          </label>
          <label class="doc-extract-field full">
            <span class="doc-extract-label">핵심 내용</span>
            <textarea class="doc-extract-textarea" v-model="form.coreContent"></textarea>
          </label>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { patentsApi, type PatentCreateRequest } from '@/api/patents'

const router = useRouter()

const fileInputRef = ref<HTMLInputElement | null>(null)
const uploadedFile = ref<File | null>(null)
const isExtracting = ref(false)
const isSubmitting = ref(false)
const extractJobId = ref<number | null>(null)
let extractPollTimer: ReturnType<typeof setInterval> | null = null

const form = reactive({
  title: '',
  managementNumber: '',
  inventors: '',
  finalTitle: '',
  bizField: '',
  techField: '',
  relatedProducts: '',
  country: 'KR',
  status: '등록',
  coApplicant: '아니오',
  coApplicantName: '',
  applicationDate: '',
  registrationDate: '',
  applicationNumber: '',
  registrationNumber: '',
  ipc: '',
  expiryDate: '',
  summary: '',
  coreContent: '',
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

function handleExtract() {
  fileInputRef.value?.click()
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
.doc-register-page {
  font-family: 'Pretendard', 'Apple SD Gothic Neo', sans-serif;
  max-width: 860px;
}

.doc-modal-body {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 28px 32px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* ── 헤더 ───────────────────────────────────────── */
.doc-work-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.card-title {
  font-size: 17px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 4px;
}

.muted {
  color: #64748b;
}

.doc-list-meta {
  font-size: 13px;
}

.doc-work-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

/* ── 버튼 ───────────────────────────────────────── */
.btn {
  padding: 8px 18px;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13.5px;
  font-weight: 600;
  font-family: inherit;
  background: #fff;
  color: #475569;
  cursor: pointer;
  transition: background 0.13s, border-color 0.13s;
}
.btn:hover { background: #f8fafc; border-color: #cbd5e1; }

.btn.primary {
  background: linear-gradient(135deg, #059669, #34d399);
  color: #fff;
  border: none;
  box-shadow: 0 3px 10px rgba(16, 185, 129, 0.25);
}
.btn.primary:hover { opacity: 0.9; }


/* ── PDF 업로드 ─────────────────────────────────── */
.doc-upload-panel {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  border: 2px dashed #d1d5db;
  border-radius: 10px;
  background: #fafafa;
}

.doc-upload-drop {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13.5px;
  color: #475569;
  cursor: pointer;
}

.doc-upload-drop span:first-child {
  font-size: 20px;
  color: #10b981;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

/* ── 섹션 ───────────────────────────────────────── */
.doc-form-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.doc-form-section-title {
  font-size: 13px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding-bottom: 8px;
  border-bottom: 1px solid #f1f5f9;
}

/* ── 그리드 ─────────────────────────────────────── */
.doc-extract-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 20px;
}

.doc-extract-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.doc-extract-field.full {
  grid-column: 1 / -1;
}

.doc-extract-label {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
}

.doc-extract-input,
.doc-extract-select {
  padding: 8px 12px;
  border: 1.5px solid #e2e8f0;
  border-radius: 7px;
  font-size: 13.5px;
  font-family: inherit;
  color: #0f172a;
  background: #fafafa;
  outline: none;
  width: 100%;
  box-sizing: border-box;
  transition: border-color 0.15s, background 0.15s;
}
.doc-extract-input:focus,
.doc-extract-select:focus {
  border-color: #10b981;
  background: #fff;
}
.doc-extract-input::placeholder { color: #cbd5e1; }

.doc-extract-select {
  appearance: none;
  -webkit-appearance: none;
  cursor: pointer;
}

.doc-extract-textarea {
  padding: 8px 12px;
  border: 1.5px solid #e2e8f0;
  border-radius: 7px;
  font-size: 13.5px;
  font-family: inherit;
  color: #0f172a;
  background: #fafafa;
  outline: none;
  resize: vertical;
  line-height: 1.6;
  min-height: 72px;
  width: 100%;
  box-sizing: border-box;
  transition: border-color 0.15s, background 0.15s;
}
.doc-extract-textarea:focus {
  border-color: #10b981;
  background: #fff;
}

</style>
