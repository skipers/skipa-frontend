<template>
  <div class="register-page">

    <!-- 페이지 헤더 -->
    <div class="page-header">
      <div>
        <h2 class="page-header__title">특허 등록</h2>
        <p class="page-header__desc">새로운 특허 정보를 입력하여 등록합니다</p>
      </div>
      <div class="action-btns">
        <button class="btn-cancel" @click="handleCancel">취소</button>
        <button class="btn-save" @click="handleSave">저장</button>
      </div>
    </div>

    <!-- 섹션 1: PDF 자동 추출 -->
    <div class="section-card">
      <div class="section-header">
        <div>
          <h3 class="section-title">PDF 자동 추출</h3>
          <p class="section-desc">특허 원문 PDF를 업로드하면 AI가 정보를 자동으로 채워드립니다</p>
        </div>
      </div>

      <div
        class="upload-zone"
        :class="{ 'upload-zone--dragover': isDragOver }"
        @dragover.prevent="isDragOver = true"
        @dragleave="isDragOver = false"
        @drop.prevent="handleDrop"
        @click="fileInputRef?.click()"
      >
        <input ref="fileInputRef" type="file" accept=".pdf" style="display:none" @change="handleFileSelect" />

        <div v-if="!uploadedFile" class="upload-zone__inner">
          <div class="upload-icon">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </div>
          <p class="upload-zone__title">PDF를 여기에 끌어다 놓거나 클릭하여 업로드</p>
          <p class="upload-zone__sub">특허 원문 PDF를 업로드하면 AI가 메타데이터, 청구항, 키워드를 자동 추출합니다</p>
        </div>

        <div v-else class="upload-zone__file">
          <div class="upload-zone__file-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <span class="upload-zone__file-name">{{ uploadedFile.name }}</span>
          <button class="upload-zone__remove" @click.stop="uploadedFile = null">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- 섹션 2: 기본 정보 -->
    <div class="section-card">
      <div class="section-header">
        <div>
          <h3 class="section-title">기본 정보</h3>
          <p class="section-desc">핵심 필드만 빠르게 입력할 수 있도록 구성했습니다</p>
        </div>
        <span class="required-note"><span class="req-star">*</span> 필수 항목</span>
      </div>

      <div class="form-grid">
        <div class="field">
          <label class="field__label">출원번호 <span class="req-star">*</span></label>
          <input v-model="form.applicationNumber" type="text" class="field__input" placeholder="10-2026-0000000" />
        </div>
        <div class="field">
          <label class="field__label">특허명 <span class="req-star">*</span></label>
          <input v-model="form.title" type="text" class="field__input" placeholder="특허명 입력" />
        </div>

        <div class="field">
          <label class="field__label">출원일 <span class="req-star">*</span></label>
          <input v-model="form.applicationDate" type="date" class="field__input" />
        </div>
        <div class="field">
          <label class="field__label">소멸일 <span class="req-star">*</span></label>
          <input v-model="form.expiryDate" type="date" class="field__input" />
        </div>

        <div class="field">
          <label class="field__label">국가 <span class="req-star">*</span></label>
          <div class="field__select-wrap">
            <select v-model="form.country" class="field__input field__select">
              <option value="">국가 선택</option>
              <option v-for="c in countryOptions" :key="c.value" :value="c.value">{{ c.label }}</option>
            </select>
            <span class="select-arrow">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </span>
          </div>
        </div>
        <div class="field">
          <label class="field__label">사업부 <span class="req-star">*</span></label>
          <div class="field__select-wrap">
            <select v-model="form.department" class="field__input field__select">
              <option value="">사업부 선택</option>
              <option v-for="d in departmentOptions" :key="d" :value="d">{{ d }}</option>
            </select>
            <span class="select-arrow">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </span>
          </div>
        </div>

        <div class="field">
          <label class="field__label">IPC <span class="req-star">*</span></label>
          <input v-model="form.ipc" type="text" class="field__input" placeholder="예: H01L 21/02" />
        </div>
        <div class="field">
          <label class="field__label">발명자 <span class="req-star">*</span></label>
          <input v-model="form.inventors" type="text" class="field__input" placeholder="홍길동, 김발명 (쉼표로 구분)" />
        </div>

        <div class="field field--full">
          <label class="field__label">키워드 <span class="req-star">*</span></label>
          <div class="tag-input-wrap" :class="{ 'tag-input-wrap--focus': tagFocused }" @click="focusTagInput">
            <span v-for="(tag, i) in form.keywords" :key="i" class="kw-tag">
              {{ tag }}
              <button class="kw-tag__remove" @click.stop="removeKeyword(i)">×</button>
            </span>
            <input
              ref="tagInputRef"
              v-model="tagInput"
              class="tag-input"
              placeholder="키워드 입력 후 Enter 또는 쉼표"
              @focus="tagFocused = true"
              @blur="tagFocused = false"
              @keydown.enter.prevent="addKeyword"
              @keydown="handleTagKeydown"
            />
          </div>
          <p class="field__hint">AI 제안 키워드를 기반으로 수정해서 사용할 수 있습니다</p>
        </div>
      </div>
    </div>

    <!-- 섹션 3: 추가 정보 -->
    <div class="section-card">
      <div class="section-header section-header--clickable" @click="extraOpen = !extraOpen">
        <div>
          <h3 class="section-title">
            추가 정보
            <span class="optional-badge">선택</span>
          </h3>
        </div>
        <button class="toggle-btn" tabindex="-1">
          {{ extraOpen ? '접기' : '펼치기' }}
          <svg
            width="14" height="14"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
            :style="{ transform: extraOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }"
          >
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
      </div>

      <Transition name="expand">
        <div v-if="extraOpen" class="form-grid">
          <div class="field">
            <label class="field__label">특허번호</label>
            <input v-model="extra.patentNumber" type="text" class="field__input" placeholder="특허번호 입력" />
          </div>
          <div class="field">
            <label class="field__label">법적상태</label>
            <div class="field__select-wrap">
              <select v-model="extra.legalStatus" class="field__input field__select">
                <option value="">선택</option>
                <option value="REGISTERED">등록</option>
                <option value="PUBLISHED">공개</option>
                <option value="EXPIRED">소멸</option>
                <option value="ABANDONED">포기</option>
                <option value="PENDING">출원 중</option>
              </select>
              <span class="select-arrow">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </span>
            </div>
          </div>

          <div class="field">
            <label class="field__label">등록번호</label>
            <input v-model="extra.registrationNumber" type="text" class="field__input" placeholder="등록번호 입력" />
          </div>
          <div class="field">
            <label class="field__label">등록일</label>
            <input v-model="extra.registrationDate" type="date" class="field__input" />
          </div>

          <div class="field">
            <label class="field__label">공개번호</label>
            <input v-model="extra.publicationNumber" type="text" class="field__input" placeholder="공개번호 입력" />
          </div>
          <div class="field">
            <label class="field__label">공개일</label>
            <input v-model="extra.publicationDate" type="date" class="field__input" />
          </div>

          <div class="field">
            <label class="field__label">출원인</label>
            <input v-model="extra.applicants" type="text" class="field__input" placeholder="출원인 (쉼표로 구분)" />
          </div>
          <div class="field">
            <label class="field__label">CPC</label>
            <input v-model="extra.cpc" type="text" class="field__input" placeholder="예: H01L 21/02, H01L 27/146" />
          </div>

          <div class="field">
            <label class="field__label">선행기술 인용</label>
            <input v-model="extra.priorArt" type="text" class="field__input" placeholder="특허번호 (쉼표로 구분)" />
          </div>
          <div class="field">
            <label class="field__label">원출원 특허번호</label>
            <input v-model="extra.parentPatentNumber" type="text" class="field__input" placeholder="원출원 특허번호" />
          </div>

          <div class="field">
            <label class="field__label">원출원일</label>
            <input v-model="extra.parentFilingDate" type="date" class="field__input" />
          </div>
          <div class="field">
            <label class="field__label">삭제된 청구항</label>
            <input v-model.number="extra.cancelledClaims" type="number" class="field__input" placeholder="0" min="0" />
          </div>

          <div class="field field--full">
            <label class="field__label">발명의 요약</label>
            <textarea v-model="extra.abstract" class="field__textarea" rows="4" placeholder="발명의 요약을 입력하세요" />
          </div>

          <div class="field field--full">
            <label class="field__label">특허 상세 설명</label>
            <textarea v-model="extra.description" class="field__textarea" rows="6" placeholder="특허의 상세 설명을 입력하세요" />
          </div>
        </div>
      </Transition>
    </div>

    <!-- 하단 버튼 -->
    <div class="bottom-actions">
      <button class="btn-cancel" @click="handleCancel">취소</button>
      <button class="btn-save" @click="handleSave">저장</button>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

const isDragOver = ref(false)
const uploadedFile = ref<File | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
const tagInputRef = ref<HTMLInputElement | null>(null)
const tagInput = ref('')
const tagFocused = ref(false)
const extraOpen = ref(false)

const form = reactive({
  applicationNumber: '',
  title: '',
  applicationDate: '',
  expiryDate: '',
  country: '',
  department: '',
  ipc: '',
  inventors: '',
  keywords: [] as string[],
})

const extra = reactive({
  patentNumber: '',
  legalStatus: '',
  registrationNumber: '',
  registrationDate: '',
  publicationNumber: '',
  publicationDate: '',
  applicants: '',
  cpc: '',
  priorArt: '',
  parentPatentNumber: '',
  parentFilingDate: '',
  cancelledClaims: null as number | null,
  abstract: '',
  description: '',
})

const countryOptions = [
  { value: 'KR', label: '한국 (KR)' },
  { value: 'US', label: '미국 (US)' },
  { value: 'EP', label: '유럽 (EP)' },
  { value: 'JP', label: '일본 (JP)' },
  { value: 'CN', label: '중국 (CN)' },
]

const departmentOptions = ['반도체사업부', '디스플레이사업부', 'AI사업부', '소재사업부']

function handleFileSelect(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) uploadedFile.value = file
}

function handleDrop(e: DragEvent) {
  isDragOver.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file?.type === 'application/pdf') uploadedFile.value = file
}

function focusTagInput() {
  tagInputRef.value?.focus()
}

function addKeyword() {
  const val = tagInput.value.replace(',', '').trim()
  if (val && !form.keywords.includes(val)) {
    form.keywords.push(val)
  }
  tagInput.value = ''
}

function handleTagKeydown(e: KeyboardEvent) {
  if (e.key === ',') {
    e.preventDefault()
    addKeyword()
  } else if (e.key === 'Backspace' && !tagInput.value && form.keywords.length) {
    form.keywords.pop()
  }
}

function removeKeyword(i: number) {
  form.keywords.splice(i, 1)
}

function handleCancel() {
  const base = auth.isLegal || auth.isAdmin ? '/legal' : '/biz'
  router.push(`${base}/patent-search`)
}

async function handleSave() {
  // TODO: API 연동
  console.log('저장', { ...form, extra: { ...extra } })
}
</script>

<style scoped>
.register-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  font-family: 'Pretendard', 'Apple SD Gothic Neo', sans-serif;
  max-width: 1000px;
}

/* ── 페이지 헤더 ─────────────────────────────────── */
.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}

.page-header__title {
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 4px;
  letter-spacing: -0.02em;
}

.page-header__desc {
  font-size: 13.5px;
  color: #64748b;
  margin: 0;
}

.action-btns {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

/* ── 섹션 카드 ────────────────────────────────────── */
.section-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 24px 28px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.section-header--clickable {
  cursor: pointer;
  border-radius: 8px;
  margin: -8px;
  padding: 8px;
  transition: background 0.13s;
}
.section-header--clickable:hover { background: #f8fafc; }

.section-title {
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 4px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-desc {
  font-size: 13px;
  color: #64748b;
  margin: 0;
}

.required-note {
  font-size: 12.5px;
  color: #94a3b8;
  white-space: nowrap;
  padding-top: 2px;
}

.req-star {
  color: #ef4444;
  font-weight: 700;
}

.optional-badge {
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 5px;
  padding: 2px 7px;
  letter-spacing: 0;
}

/* ── PDF 업로드 ───────────────────────────────────── */
.upload-zone {
  border: 2px dashed #d1d5db;
  border-radius: 12px;
  min-height: 156px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: border-color 0.18s, background 0.18s;
  background: #fafafa;
}
.upload-zone:hover,
.upload-zone--dragover {
  border-color: #10b981;
  background: #f0fdf4;
}

.upload-zone__inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 28px 24px;
  text-align: center;
}

.upload-icon {
  width: 56px;
  height: 56px;
  background: #ecfdf5;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #10b981;
  margin-bottom: 4px;
}

.upload-zone__title {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin: 0;
}

.upload-zone__sub {
  font-size: 13px;
  color: #94a3b8;
  margin: 0;
}

.upload-zone__file {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 28px;
}

.upload-zone__file-icon {
  width: 40px;
  height: 40px;
  background: #ecfdf5;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #10b981;
  flex-shrink: 0;
}

.upload-zone__file-name {
  font-size: 14px;
  font-weight: 500;
  color: #0f172a;
  flex: 1;
}

.upload-zone__remove {
  width: 28px;
  height: 28px;
  background: #f1f5f9;
  border: none;
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #64748b;
  transition: background 0.13s, color 0.13s;
}
.upload-zone__remove:hover { background: #fef2f2; color: #ef4444; }

/* ── 폼 그리드 ────────────────────────────────────── */
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px 24px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field--full {
  grid-column: 1 / -1;
}

.field__label {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.field__input {
  padding: 10px 14px;
  border: 1.5px solid #e2e8f0;
  border-radius: 9px;
  font-size: 13.5px;
  font-family: inherit;
  color: #0f172a;
  background: #fafafa;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
  width: 100%;
  box-sizing: border-box;
}
.field__input:focus {
  border-color: #10b981;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}
.field__input::placeholder { color: #cbd5e1; }

input[type="date"].field__input {
  color: #374151;
}

.field__select-wrap {
  position: relative;
}

.field__select {
  appearance: none;
  -webkit-appearance: none;
  cursor: pointer;
  padding-right: 36px;
}

.select-arrow {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  pointer-events: none;
  display: flex;
}

.field__textarea {
  padding: 10px 14px;
  border: 1.5px solid #e2e8f0;
  border-radius: 9px;
  font-size: 13.5px;
  font-family: inherit;
  color: #0f172a;
  background: #fafafa;
  outline: none;
  resize: vertical;
  line-height: 1.6;
  transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
  width: 100%;
  box-sizing: border-box;
}
.field__textarea:focus {
  border-color: #10b981;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}
.field__textarea::placeholder { color: #cbd5e1; }

.field__hint {
  font-size: 12px;
  color: #94a3b8;
  margin: 0;
}

/* ── 태그 입력 ────────────────────────────────────── */
.tag-input-wrap {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: 1.5px solid #e2e8f0;
  border-radius: 9px;
  background: #fafafa;
  cursor: text;
  min-height: 44px;
  transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
}
.tag-input-wrap--focus {
  border-color: #10b981;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

.kw-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px 3px 10px;
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  border-radius: 6px;
  font-size: 12.5px;
  color: #065f46;
  font-weight: 500;
  white-space: nowrap;
}

.kw-tag__remove {
  background: none;
  border: none;
  cursor: pointer;
  color: #6ee7b7;
  font-size: 14px;
  line-height: 1;
  padding: 0 1px;
  display: flex;
  align-items: center;
  transition: color 0.12s;
}
.kw-tag__remove:hover { color: #059669; }

.tag-input {
  flex: 1;
  min-width: 140px;
  border: none;
  background: transparent;
  outline: none;
  font-size: 13.5px;
  font-family: inherit;
  color: #0f172a;
  padding: 2px 0;
}
.tag-input::placeholder { color: #cbd5e1; }

/* ── 토글 버튼 ────────────────────────────────────── */
.toggle-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 14px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  color: #475569;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.13s, color 0.13s;
  flex-shrink: 0;
}
.toggle-btn:hover { background: #f1f5f9; color: #0f172a; }

/* ── 버튼 ─────────────────────────────────────────── */
.btn-cancel {
  padding: 9px 22px;
  background: #fff;
  border: 1.5px solid #e2e8f0;
  border-radius: 9px;
  font-size: 13.5px;
  font-weight: 600;
  font-family: inherit;
  color: #475569;
  cursor: pointer;
  transition: background 0.13s, border-color 0.13s;
}
.btn-cancel:hover { background: #f8fafc; border-color: #cbd5e1; }

.btn-save {
  padding: 9px 24px;
  background: linear-gradient(135deg, #059669, #34d399);
  color: #fff;
  border: none;
  border-radius: 9px;
  font-size: 13.5px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(16, 185, 129, 0.3);
  transition: opacity 0.13s, transform 0.12s;
}
.btn-save:hover { opacity: 0.92; }
.btn-save:active { transform: scale(0.98); }

/* ── 하단 버튼 영역 ──────────────────────────────── */
.bottom-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
  padding-bottom: 8px;
}

/* ── 펼치기/접기 전환 ─────────────────────────────── */
.expand-enter-active {
  transition: opacity 0.2s, transform 0.2s;
  transform-origin: top;
}
.expand-leave-active {
  transition: opacity 0.15s, transform 0.15s;
  transform-origin: top;
}
.expand-enter-from {
  opacity: 0;
  transform: scaleY(0.96) translateY(-6px);
}
.expand-leave-to {
  opacity: 0;
  transform: scaleY(0.96) translateY(-6px);
}

@media (max-width: 720px) {
  .form-grid { grid-template-columns: 1fr; }
  .field--full { grid-column: 1; }
}
</style>
