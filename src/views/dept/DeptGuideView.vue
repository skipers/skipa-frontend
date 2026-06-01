<script setup>
import AppLayout from '@/components/layout/AppLayout.vue'
import AppCard from '@/components/ui/AppCard.vue'

const reevaluationSteps = [
  'Legal팀이 분기별 재평가 대상 특허를 선정하고 사업부에 배정합니다.',
  '사업부 담당자는 특허 상세 페이지에서 특허 원문과 AI 평가 보고서를 검토합니다.',
  '유지 또는 포기 의견을 선택하고 검토 근거를 작성하여 제출합니다.',
  'Legal팀이 사업부 의견을 참고하여 최종 유지 여부를 결정합니다.',
]

const scoreCards = [
  {
    title: '기술성 (0~100)',
    body: '특허가 보호하는 기술의 독창성과 완성도를 평가합니다. 유사한 선행 기술 대비 차별점이 명확할수록 높은 점수를 받습니다.',
  },
  {
    title: '권리성 (0~100)',
    body: '청구항의 범위와 권리의 유효성을 평가합니다. 청구항이 넓고 명확할수록, 무효 위험이 낮을수록 높은 점수를 받습니다.',
  },
  {
    title: '사업성 (0~100)',
    body: '해당 기술의 상업적 활용 가능성과 시장 가치를 평가합니다. 현재 또는 미래 사업과의 연관성이 높을수록 높은 점수를 받습니다.',
  },
]

const gradeRows = [
  { grade: 'S등급', range: '90~100', desc: '매우 우수, 적극 유지 권고', highlight: true },
  { grade: 'A등급', range: '70~89', desc: '우수, 유지 권고' },
  { grade: 'B등급', range: '50~69', desc: '보통, 추가 검토 필요' },
  { grade: 'C등급', range: '0~49', desc: '미흡, 포기 검토 권고' },
]

const pageGuides = [
  {
    title: '검토 현황',
    body: '이번 분기 재평가 요청받은 특허 목록을 확인하고 제출 완료/미제출 상태를 관리하는 페이지입니다. 특허를 클릭하면 상세 페이지로 이동하여 의견을 제출할 수 있습니다.',
  },
  {
    title: '담당 특허 관리',
    body: '우리 사업부가 보유한 전체 특허를 조회하는 페이지입니다. 유지 중인 특허, 만료·포기한 특허, 검토 제출 이력을 확인할 수 있습니다.',
  },
  {
    title: '사전 평가 Lab',
    body: '출원 예정인 신규 발명을 사전에 AI로 평가해볼 수 있는 페이지입니다. 발명 정보를 입력하면 기술성/권리성/사업성 평가 보고서가 생성되며, 결과에 대해 AI 챗봇에게 질문할 수 있습니다.',
  },
]
</script>

<template>
  <AppLayout title="이용 가이드" subtitle="SKIPA 서비스 사용 방법을 안내합니다.">
    <div class="space-y-4">
      <AppCard>
        <div class="space-y-3">
          <div class="text-base font-semibold text-gray-800">SKIPA 소개</div>
          <div class="space-y-2 text-sm leading-6 text-gray-700">
            <p>SKIPA(SK IP Agent)는 SK AX의 사내 특허 관리 시스템입니다.</p>
            <p>사업부 담당자는 이 시스템을 통해 담당 특허의 AI 평가 보고서를 검토하고, 유지 또는 포기 의견을 Legal팀에 제출할 수 있습니다.</p>
          </div>
          <div class="rounded-xl p-4" style="background:#F8FAFC; border:1px solid #E2E8F0;">
            <div class="text-sm font-semibold text-gray-800 mb-2">사업부가 할 수 있는 것</div>
            <ul class="space-y-2 text-sm leading-6 text-gray-700">
              <li>· 담당 특허 목록 및 상세 정보 조회</li>
              <li>· AI 평가 보고서 열람</li>
              <li>· 유지/포기 의견 제출</li>
              <li>· 사전 평가 Lab에서 신규 발명 예비 평가</li>
            </ul>
          </div>
        </div>
      </AppCard>

      <AppCard>
        <div class="space-y-4">
          <div class="text-base font-semibold text-gray-800">재평가 프로세스 안내</div>
          <div class="space-y-3">
            <div
              v-for="(step, index) in reevaluationSteps"
              :key="step"
              class="flex items-start gap-3 rounded-xl p-4"
              style="background:#FFF; border:1px solid #E2E8F0;"
            >
              <div class="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white" style="background:#FF7A00;">
                {{ index + 1 }}
              </div>
              <div class="text-sm leading-6 text-gray-700">{{ step }}</div>
            </div>
          </div>

          <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div class="rounded-xl p-4" style="background:#FFF7F0; border:1px solid rgba(255,122,0,0.18);">
              <div class="text-sm font-semibold" style="color:#D97706;">분기별 일정 안내</div>
              <div class="mt-2 space-y-1 text-sm leading-6 text-gray-700">
                <p>· 매 분기 초 Legal팀이 검토 요청을 발송합니다.</p>
                <p>· 제출 마감일은 해당 분기 말일입니다.</p>
                <p>· 마감일 이후에는 의견 수정이 불가합니다.</p>
              </div>
            </div>
          </div>
        </div>
      </AppCard>

      <AppCard>
        <div class="space-y-4">
          <div class="text-base font-semibold text-gray-800">AI 평가 보고서 읽는 법</div>
          <div class="grid grid-cols-1 gap-3 lg:grid-cols-3">
            <div
              v-for="card in scoreCards"
              :key="card.title"
              class="rounded-xl p-5 shadow-sm"
              style="background:#FFFFFF; border:1px solid #E2E8F0;"
            >
              <div class="text-sm font-semibold text-gray-800">{{ card.title }}</div>
              <div class="mt-2 text-sm leading-6 text-gray-700">{{ card.body }}</div>
            </div>
          </div>

          <div class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <table class="w-full text-sm">
              <thead>
                <tr style="background:#F8FAFC;">
                  <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500">등급</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500">점수</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500">설명</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in gradeRows" :key="row.grade" style="border-top:1px solid #E2E8F0;" :style="row.highlight ? 'background:rgba(255,122,0,0.05);' : ''">
                  <td class="px-4 py-3 font-semibold" :style="row.highlight ? 'color:#FF7A00;' : 'color:#334155;'">{{ row.grade }}</td>
                  <td class="px-4 py-3 text-gray-600">{{ row.range }}</td>
                  <td class="px-4 py-3 text-gray-700">{{ row.desc }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </AppCard>

      <AppCard>
        <div class="space-y-4">
          <div class="text-base font-semibold text-gray-800">페이지별 사용법</div>
          <div class="grid grid-cols-1 gap-3 xl:grid-cols-3">
            <div
              v-for="page in pageGuides"
              :key="page.title"
              class="rounded-xl p-5"
              style="background:#FFFFFF; border:1px solid #E2E8F0; box-shadow:0 1px 3px rgba(0,0,0,0.08);"
            >
              <div class="text-sm font-semibold text-gray-800">{{ page.title }}</div>
              <div class="mt-2 text-sm leading-6 text-gray-700">{{ page.body }}</div>
            </div>
          </div>
        </div>
      </AppCard>
    </div>
  </AppLayout>
</template>