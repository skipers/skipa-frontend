<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import * as pdfjsLib from 'pdfjs-dist/build/pdf.mjs'
import AppLayout from '@/components/layout/AppLayout.vue'

const router = useRouter()

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString()

const form = ref({
  number: '',
  applicationNumber: '',
  title: '',
  legalStatus: '등록',
  assignee: '',
  abstract: '',
  filingDate: '',
  applicationDate: '',
  publicationNumber: '',
  publicationDate: '',
  registrationNumber: '',
  registrationDate: '',
  expiryDate: '',
  country: '',
  dept: '',
  ipc: '',
  cpc: '',
  inventors: '',
  priorArtCited: '',
  originalPatentNumber: '',
  originalApplicationDate: '',
  totalClaims: 1,
  deletedClaims: '',
  descriptionSummary: '',
  claims: [''],
})

const keywordSuggestion = ref('')
const pdfInputRef = ref(null)
const pdfState = ref('idle')
const pdfMessage = ref('')
const pdfFileName = ref('')
const isDragOver = ref(false)
const showAdditionalInfo = ref(false)

const depts = ['반도체사업부', '통신사업부', '에너지사업부', '제조사업부']
const countries = ['한국', '미국', '일본', '유럽', '중국']

function tokenize(text) {
  return (text || '')
    .split(/[,/\n\s]+/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function normalizeKeywords(text) {
  return [...new Set(tokenize(text))].slice(0, 5).join(', ')
}

function firstMatch(text, regexList) {
  for (const regex of regexList) {
    const match = text.match(regex)
    if (match?.[1]) return match[1].trim()
  }
  return ''
}

function extractSection(text, startPatterns, endPatterns) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  const startIndex = lines.findIndex((line) => startPatterns.some((pattern) => pattern.test(line)))
  if (startIndex === -1) return ''

  const collected = []
  for (let i = startIndex + 1; i < lines.length; i += 1) {
    const line = lines[i]
    if (endPatterns.some((pattern) => pattern.test(line))) break
    collected.push(line)
  }
  return collected.join(' ').trim()
}

function extractClaims(text) {
  const matches = [...text.matchAll(/(?:청구항\s*)?(\d+)\s*[\.\)]\s*([\s\S]*?)(?=(?:청구항\s*)?\d+\s*[\.\)]|$)/g)]
  const claims = matches
    .map((match) => match[2].replace(/\s+/g, ' ').trim())
    .filter((claim) => claim.length > 10)
  return claims
}

function inferIpc(text) {
  const t = (text || '').toLowerCase()
  if (t.includes('딥러닝') || t.includes('cnn') || t.includes('비전') || t.includes('이미지')) return 'G06T 7/00'
  if (t.includes('네트워크') || t.includes('5g') || t.includes('통신') || t.includes('qkd')) return 'H04L 12/00'
  if (t.includes('배터리') || t.includes('연료전지') || t.includes('수소') || t.includes('에너지')) return 'H02J 3/38'
  if (t.includes('로봇') || t.includes('제조') || t.includes('자동화') || t.includes('공정')) return 'B25J 9/16'
  if (t.includes('반도체')) return 'G06F 17/00'
  return 'G06F 9/50'
}

function applyExtractedData(text) {
  const cleanText = (text || '').replace(/\u0000/g, ' ')
  const title = firstMatch(cleanText, [
    /발명의\s*명칭[:\s]*([^\n]+)/i,
    /명칭[:\s]*([^\n]+)/i,
  ])
  const summary = extractSection(cleanText, [/^요약$/i, /^발명의\s*요약$/i], [/^청구범위$/i, /^청구항\s*1/i, /^도면$/i])
  const abstract = summary || firstMatch(cleanText, [/요약[:\s]*([\s\S]{20,400}?)(?=청구범위|청구항|발명의\s*상세한\s*설명|$)/i])
  const claims = extractClaims(cleanText)
  const inventors = firstMatch(cleanText, [/발명자[:\s]*([^\n]+)/i, /inventors?[:\s]*([^\n]+)/i])
  const assignee = firstMatch(cleanText, [/출원인[:\s]*([^\n]+)/i, /assignee[:\s]*([^\n]+)/i])
  const applicationNumber = firstMatch(cleanText, [/출원번호[:\s]*([^\n]+)/i, /application\s*number[:\s]*([^\n]+)/i])
  const applicationDate = firstMatch(cleanText, [/출원일[:\s]*([^\n]+)/i, /application\s*date[:\s]*([^\n]+)/i])
  const registrationNumber = firstMatch(cleanText, [/등록번호[:\s]*([^\n]+)/i, /registration\s*number[:\s]*([^\n]+)/i])
  const registrationDate = firstMatch(cleanText, [/등록일[:\s]*([^\n]+)/i, /registration\s*date[:\s]*([^\n]+)/i])
  const publicationNumber = firstMatch(cleanText, [/공개번호[:\s]*([^\n]+)/i, /publication\s*number[:\s]*([^\n]+)/i])
  const publicationDate = firstMatch(cleanText, [/공개일[:\s]*([^\n]+)/i, /publication\s*date[:\s]*([^\n]+)/i])
  const priorArt = firstMatch(cleanText, [/선행기술[:\s]*([^\n]+)/i, /prior\s*art[:\s]*([^\n]+)/i])
  const originalPatent = firstMatch(cleanText, [/원출원[:\s]*([^\n]+)/i, /original\s*application[:\s]*([^\n]+)/i])

  if (title) form.value.title = title
  if (abstract) form.value.abstract = abstract
  if (summary) form.value.descriptionSummary = summary
  if (inventors) form.value.inventors = inventors
  if (assignee) form.value.assignee = assignee
  if (applicationNumber) form.value.applicationNumber = applicationNumber
  if (applicationDate) form.value.applicationDate = applicationDate
  if (registrationNumber) form.value.registrationNumber = registrationNumber
  if (registrationDate) form.value.registrationDate = registrationDate
  if (publicationNumber) form.value.publicationNumber = publicationNumber
  if (publicationDate) form.value.publicationDate = publicationDate
  if (priorArt) form.value.priorArtCited = priorArt
  if (originalPatent) form.value.originalPatentNumber = originalPatent

  const inferredIpc = inferIpc(cleanText)
  if (!form.value.ipc) form.value.ipc = inferredIpc

  const extractedClaims = claims.length > 0 ? claims : [cleanText.slice(0, 300).replace(/\s+/g, ' ').trim()].filter(Boolean)
  form.value.claims = extractedClaims.length > 0 ? extractedClaims : ['']
  form.value.totalClaims = form.value.claims.length

  pdfState.value = 'done'
  pdfMessage.value = `PDF에서 ${form.value.totalClaims}개의 청구항과 기본 정보를 추출했습니다.`
  generateKeywords()
}

async function processPdfFile(file) {
  if (!file) return

  pdfFileName.value = file.name
  pdfState.value = 'extracting'
  pdfMessage.value = 'AI가 PDF를 읽고 정보를 추출하고 있습니다.'

  try {
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    let text = ''

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber)
      const content = await page.getTextContent()
      const pageText = content.items.map((item) => item.str).join(' ')
      text += `${pageText}\n`
    }

    applyExtractedData(text)
  } catch (error) {
    pdfState.value = 'error'
    pdfMessage.value = 'PDF 추출에 실패했습니다. 스캔본이거나 텍스트가 없는 파일일 수 있습니다.'
    console.error(error)
  }
}

async function handlePdfChange(event) {
  const file = event.target.files?.[0]
  await processPdfFile(file)
}

async function handlePdfDrop(event) {
  isDragOver.value = false
  const file = event.dataTransfer?.files?.[0]
  await processPdfFile(file)
}

function openPdfPicker() {
  pdfInputRef.value?.click()
}

function generateKeywords() {
  const source = `${form.value.title} ${form.value.abstract} ${form.value.descriptionSummary} ${form.value.ipc} ${form.value.dept}`
  const t = source.toLowerCase()
  const keywords = []

  if (t.includes('딥러닝') || t.includes('cnn') || t.includes('비전') || t.includes('이미지')) keywords.push('AI', '딥러닝', '이미지분석')
  if (t.includes('네트워크') || t.includes('5g') || t.includes('통신') || t.includes('qkd')) keywords.push('통신', '5G', '네트워크최적화')
  if (t.includes('배터리') || t.includes('연료전지') || t.includes('수소') || t.includes('에너지')) keywords.push('에너지', '배터리', '수소')
  if (t.includes('로봇') || t.includes('제조') || t.includes('자동화') || t.includes('공정')) keywords.push('제조', '자동화', '스마트팩토리')
  if (t.includes('반도체')) keywords.push('반도체', '결함검출', '공정')

  const normalized = normalizeKeywords([...keywords, ...tokenize(form.value.title), ...tokenize(form.value.ipc), ...tokenize(form.value.dept)].join(', '))
  keywordSuggestion.value = normalized || '핵심기술, 응용분야, 차별점'
}

watch(
  () => [form.value.title, form.value.abstract, form.value.descriptionSummary, form.value.ipc, form.value.dept],
  () => generateKeywords(),
  { immediate: true },
)

function handleSubmit() {
  const payload = {
    patent_id: form.value.number || form.value.registrationNumber || form.value.applicationNumber || form.value.title,
    meta: {
      title: form.value.title,
      application_number: form.value.applicationNumber,
      application_date: form.value.applicationDate,
      registration_number: form.value.registrationNumber,
      registration_date: form.value.registrationDate,
      publication_number: form.value.publicationNumber,
      publication_date: form.value.publicationDate,
      legal_status: form.value.legalStatus,
      assignee: tokenize(form.value.assignee),
      inventors: tokenize(form.value.inventors),
      ipc: tokenize(form.value.ipc),
      cpc: tokenize(form.value.cpc),
      total_claims: Number(form.value.totalClaims) || form.value.claims.length,
      deleted_claims: tokenize(form.value.deletedClaims),
      prior_art_cited: tokenize(form.value.priorArtCited),
      original_application: {
        patent_number: form.value.originalPatentNumber,
        application_date: form.value.originalApplicationDate,
      },
    },
    claims_text: Object.fromEntries(
      form.value.claims
        .filter((claim) => claim.trim())
        .map((claim, index) => [`claim_${index + 1}`, { type: index === 0 ? '독립항' : '종속항', text: claim }]),
    ),
    description_summary: form.value.descriptionSummary,
    keywords: keywordSuggestion.value,
  }

  console.log('register payload', payload)
  alert('특허가 등록되었습니다.')
  router.push('/patents')
}
</script>

<template>
  <AppLayout title="특허 등록">
    <div class="w-full max-w-6xl mx-auto">
      <div class="bg-white rounded-xl p-6" style="border:1px solid #E2E8F0;">
        <form @submit.prevent="handleSubmit" class="space-y-5">
          <div class="flex justify-end gap-3">
            <button type="button" @click="router.push('/patents')" class="px-5 py-2.5 text-sm rounded-lg cursor-pointer" style="border:1px solid #E2E8F0; background:#fff; color:#374151;">취소</button>
            <button type="submit" class="px-5 py-2.5 text-sm font-semibold text-white rounded-lg cursor-pointer" style="background:#FF7A00; border:none;">저장</button>
          </div>

          <section class="space-y-3">
            <div class="flex items-center justify-between gap-4">
              <div>
                <div class="text-base font-semibold text-gray-800">PDF 자동 추출</div>
                <div class="text-xs text-gray-400 mt-0.5">업로드 시 출원번호, 특허명, 발명자 등이 자동으로 입력됩니다.</div>
              </div>
            </div>
            <input ref="pdfInputRef" type="file" accept="application/pdf" class="hidden" @change="handlePdfChange" />
            <div
              class="rounded-xl p-8 text-center cursor-pointer transition"
              :style="isDragOver ? 'background:#FFF7F0; border:1px dashed #FF7A00;' : 'background:#F8FAFC; border:1px dashed #CBD5E1;'"
              @click="openPdfPicker"
              @dragover.prevent="isDragOver = true"
              @dragleave.prevent="isDragOver = false"
              @drop.prevent="handlePdfDrop"
            >
              <div class="mx-auto mb-3 w-10 h-10 rounded-full flex items-center justify-center" style="background:rgba(255,122,0,0.1); color:#FF7A00;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M12 16V5M12 5L8 9M12 5L16 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M5 15V18C5 19.1046 5.89543 20 7 20H17C18.1046 20 19 19.1046 19 18V15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </div>
              <div class="text-sm font-semibold text-gray-700">PDF를 여기에 끌어다 놓거나 클릭하여 업로드</div>
              <div class="mt-1 text-xs text-gray-500">{{ pdfFileName || '아직 선택된 PDF가 없습니다.' }}</div>
              <div class="mt-1 text-xs" :style="pdfState === 'error' ? 'color:#EA002C;' : pdfState === 'done' ? 'color:#059669;' : 'color:#6b7280;'">
                {{ pdfMessage || '등록할 특허의 명세서 PDF를 업로드하면 AI가 메타데이터, 청구항, 키워드를 자동 추출합니다.' }}
              </div>
              <div v-if="pdfState === 'extracting'" class="mt-3 text-xs font-medium text-gray-500">추출 중...</div>
              <div v-else-if="pdfState === 'done'" class="mt-3 text-xs font-medium text-green-600">추출 완료</div>
            </div>
          </section>

          <section class="space-y-4">
            <div>
              <div class="text-base font-semibold text-gray-800">기본 정보</div>
              <div class="text-xs text-gray-400 mt-0.5">핵심 필드만 빠르게 입력할 수 있도록 구성했습니다.</div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">출원번호 *</label>
                <input v-model="form.applicationNumber" placeholder="예: 10-2007-0107006" class="field" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">특허명 *</label>
                <input v-model="form.title" placeholder="특허 명칭을 입력하세요" class="field" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">출원일 *</label>
                <input v-model="form.applicationDate" type="date" class="field" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">만료일 *</label>
                <input v-model="form.expiryDate" type="date" class="field" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">국가 *</label>
                <select v-model="form.country" class="field">
                  <option value="">선택</option>
                  <option v-for="c in countries" :key="c">{{ c }}</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">사업부 *</label>
                <select v-model="form.dept" class="field">
                  <option value="">선택</option>
                  <option v-for="d in depts" :key="d">{{ d }}</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">IPC *</label>
                <input v-model="form.ipc" placeholder="예: G06T 7/00" class="field" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">발명자 *</label>
                <input v-model="form.inventors" placeholder="쉼표로 구분하여 입력" class="field" />
              </div>
            </div>
          </section>

          <section>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">키워드 *</label>
            <input v-model="keywordSuggestion" class="field" placeholder="예: 반도체, 딥러닝, 공정" />
            <div class="mt-1 text-xs text-gray-400">AI 제안 키워드를 기반으로 수정해서 사용할 수 있습니다.</div>
          </section>

          <section class="space-y-3">
            <button
              type="button"
              @click="showAdditionalInfo = !showAdditionalInfo"
              class="w-full flex items-center justify-between px-4 py-3 rounded-lg cursor-pointer"
              style="border:1px solid #E2E8F0; background:#fff;"
            >
              <span class="text-sm font-semibold text-gray-700">추가 정보 (선택)</span>
              <span class="text-xs" style="color:#64748b;">{{ showAdditionalInfo ? '접기' : '펼치기' }}</span>
            </button>

            <div v-if="showAdditionalInfo" class="rounded-xl p-4 space-y-4" style="border:1px solid #E2E8F0; background:#F8FAFC;">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">특허번호</label>
                  <input v-model="form.number" placeholder="예: KR-2025-0001234" class="field" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">법적상태</label>
                  <select v-model="form.legalStatus" class="field">
                    <option value="등록">등록</option>
                    <option value="출원">출원</option>
                    <option value="공개">공개</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">등록번호</label>
                  <input v-model="form.registrationNumber" placeholder="예: 10-0790755" class="field" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">등록일</label>
                  <input v-model="form.registrationDate" type="date" class="field" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">공개번호</label>
                  <input v-model="form.publicationNumber" placeholder="예: 10-2007-0115821" class="field" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">공개일</label>
                  <input v-model="form.publicationDate" type="date" class="field" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">출원인</label>
                  <input v-model="form.assignee" placeholder="쉼표로 구분하여 입력" class="field" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">CPC</label>
                  <input v-model="form.cpc" placeholder="예: G06T 2207/10048" class="field" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">선행기술 인용</label>
                  <input v-model="form.priorArtCited" placeholder="쉼표로 구분하여 입력" class="field" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">원출원 특허번호</label>
                  <input v-model="form.originalPatentNumber" placeholder="예: 10-2006-0048644" class="field" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">원출원일</label>
                  <input v-model="form.originalApplicationDate" type="date" class="field" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">삭제된 청구항</label>
                  <input v-model="form.deletedClaims" placeholder="예: 3, 7" class="field" />
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">발명의 요약</label>
                <textarea
                  v-model="form.descriptionSummary"
                  rows="3"
                  placeholder="발명의 목적, 효과, 핵심 구성요소를 요약해서 입력하세요"
                  class="field resize-none"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">특허 상세 설명</label>
                <textarea
                  v-model="form.abstract"
                  rows="3"
                  placeholder="발명의 핵심 내용, 기술 특징, 적용 분야를 입력하세요"
                  class="field resize-none"
                />
              </div>
            </div>
          </section>

          <div class="flex justify-end gap-3 pt-2">
            <button type="button" @click="router.push('/patents')" class="px-5 py-2.5 text-sm rounded-lg cursor-pointer" style="border:1px solid #E2E8F0; background:#fff; color:#374151;">취소</button>
            <button type="submit" class="px-5 py-2.5 text-sm font-semibold text-white rounded-lg cursor-pointer" style="background:#FF7A00; border:none;">저장</button>
          </div>
        </form>
      </div>
    </div>
  </AppLayout>
</template>

<style scoped>
.field {
  width: 100%;
  padding: 8px 12px;
  font-size: 14px;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  outline: none;
  font-family: inherit;
}
.field:focus {
  border-color: #FF7A00;
  box-shadow: 0 0 0 3px rgba(255, 122, 0, 0.1);
}
</style>
