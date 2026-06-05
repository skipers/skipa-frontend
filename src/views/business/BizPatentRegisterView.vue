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
          <button class="btn primary" type="button" @click="handleSave">저장</button>
        </div>
      </div>

      <!-- 별도 저장 -->
      <div class="doc-modal-save-row">
        <div class="doc-modal-save-label">별도 저장:</div>
        <input class="doc-save-name-input" type="text" v-model="saveName" aria-label="저장 파일명" />
      </div>

      <!-- PDF 업로드 -->
      <div class="doc-upload-panel" aria-label="특허 PDF 업로드">
        <label class="doc-upload-drop" for="doc-new-pdf">
          <span aria-hidden="true">↥</span>
          <span>{{ uploadedFile ? uploadedFile.name : '특허 PDF 업로드 · patent_notice_A.pdf' }}</span>
        </label>
        <input id="doc-new-pdf" class="visually-hidden" type="file" accept=".pdf" ref="fileInputRef" @change="handleFileSelect" />
        <button class="btn" type="button" @click="handleExtract">PDF에서 항목 추출</button>
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

      <!-- 푸터 -->
      <div class="doc-work-foot">
        <button class="btn" type="button" @click="handleReExtract">추출 내용 다시 불러오기</button>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const fileInputRef = ref<HTMLInputElement | null>(null)
const uploadedFile = ref<File | null>(null)
const saveName = ref('patent-notice-sample.pdf')

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

function handleFileSelect(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) uploadedFile.value = file
}

function handleExtract() {
  fileInputRef.value?.click()
}

function handleReExtract() {
  // TODO: PDF 재추출
}

function handleCancel() {
  router.push('/biz/patent-search')
}

async function handleSave() {
  // TODO: API 연동
  console.log('저장', { ...form })
}
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

/* ── 별도 저장 ──────────────────────────────────── */
.doc-modal-save-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.doc-modal-save-label {
  font-size: 13px;
  font-weight: 600;
  color: #475569;
  white-space: nowrap;
}

.doc-save-name-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 13.5px;
  font-family: inherit;
  color: #0f172a;
  outline: none;
}

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

/* ── 푸터 ───────────────────────────────────────── */
.doc-work-foot {
  display: flex;
  justify-content: flex-start;
  padding-top: 4px;
}
</style>
