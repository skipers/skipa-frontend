<template>
  <div class="detail-page" :style="{ '--chat-width': chatPanelWidth }">

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

      <!-- ── 헤더 (스크롤과 함께 사라짐) ── -->
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

      <!-- ── 탭바 (sticky: 앱바 바로 아래 고정) ── -->
      <div class="tabs" ref="tabsEl">
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

      <!-- ── 섹션 본문 ── -->
      <div class="sections-body">

        <!-- ── 섹션 1: 유지/포기 의견 제출 ── -->
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

        <div class="section-divider"></div>

        <!-- ── 섹션 2: 특허 원문 ── -->
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

            <!-- ① 종합 점수 카드 -->
            <div class="rpt-score-cards">
              <div class="rpt-score-card" style="--rpt-card-color:#0f172a">
                <div class="rpt-score-card__label">종합</div>
                <div class="rpt-score-card__value">65<span class="rpt-score-card__denom"> / 100</span></div>
                <div class="rpt-score-card__bar"><div class="rpt-score-card__bar-fill" style="width:65%"></div></div>
              </div>
              <div class="rpt-score-card" style="--rpt-card-color:#16a34a">
                <div class="rpt-score-card__label">기술성</div>
                <div class="rpt-score-card__value">65<span class="rpt-score-card__denom"> / 100</span></div>
                <div class="rpt-score-card__bar"><div class="rpt-score-card__bar-fill" style="width:65%"></div></div>
              </div>
              <div class="rpt-score-card" style="--rpt-card-color:#b45309">
                <div class="rpt-score-card__label">권리성</div>
                <div class="rpt-score-card__value">66<span class="rpt-score-card__denom"> / 100</span></div>
                <div class="rpt-score-card__bar"><div class="rpt-score-card__bar-fill" style="width:66%"></div></div>
              </div>
              <div class="rpt-score-card" style="--rpt-card-color:#dc2626">
                <div class="rpt-score-card__label">시장성 및 사업성</div>
                <div class="rpt-score-card__value">60<span class="rpt-score-card__denom"> / 100</span></div>
                <div class="rpt-score-card__bar"><div class="rpt-score-card__bar-fill" style="width:60%"></div></div>
              </div>
            </div>

            <!-- ② 평가 기준별 상세 (accordion) -->
            <div v-for="block in REPORT_EVAL_BLOCKS" :key="block.key" class="rpt-eval-block">
              <div class="rpt-eval-block-header">
                <span class="rpt-eval-block-title">{{ block.title }}</span>
                <span class="rpt-eval-block-score">{{ block.score }} / 100</span>
              </div>
              <div class="rpt-table-wrap">
                <table class="rpt-eval-table">
                  <thead>
                    <tr>
                      <th style="width:180px">평가 항목</th>
                      <th style="width:72px">점수</th>
                      <th style="width:110px">산출 방식</th>
                      <th>판단 요지</th>
                      <th style="width:36px"></th>
                    </tr>
                  </thead>
                  <tbody>
                    <template v-for="item in block.items" :key="item.id">
                      <tr class="rpt-data-row" @click="reportOpenRows[item.id] = !reportOpenRows[item.id]">
                        <td class="rpt-item-name">{{ item.name }}</td>
                        <td><span :class="['rpt-score-pill', 'rpt-score-' + item.score]">{{ item.score }}/5</span></td>
                        <td class="rpt-method">{{ item.method }}</td>
                        <td class="rpt-summary">{{ item.summary }}</td>
                        <td>
                          <button class="rpt-toggle-btn" :class="{ open: reportOpenRows[item.id] }" type="button">▶</button>
                        </td>
                      </tr>
                      <tr v-show="reportOpenRows[item.id]" class="rpt-detail-row">
                        <td colspan="5">
                          <div class="rpt-detail-content">
                            <div class="rpt-detail-label">판단 근거</div>
                            <div class="rpt-detail-text">{{ item.grounds }}</div>
                            <div class="rpt-detail-label">출처</div>
                            <div class="rpt-detail-text">{{ item.sources }}</div>
                          </div>
                        </td>
                      </tr>
                    </template>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- ③ 종합 의견 -->
            <div class="rpt-subsection">
              <p class="rpt-subsection-title">종합 의견</p>
              <div class="rpt-opinion-box">
                <p>메시지 지향 미들웨어 병목 모니터링 특허의 종합 점수는 65/100으로 보통 수준입니다. 기술성(65/100)은 토폴로지 기반 동적 상태 갱신 구조의 혁신성(4/5)과 높은 모방 난이도(4/5)가 강점이나, 대형 경쟁사 대비 낮은 시장 점유율로 대체기술 경쟁성(2/5)이 약점으로 작용합니다. 동일 IPC 분야(H04L, G06F) 내 자사 점유율은 1.17%에 불과해 경쟁 우위 확보가 어려운 구조입니다.</p>
                <p>권리성(66/100)은 출원인 1명·심판이력 0건으로 권리행사 제한 가능성(5/5)이 최고점을 기록했으며, 핵심 기능 중심의 간결한 청구항 구성(4/5)도 긍정적입니다. 반면 해외출원이 없어 글로벌 보호 범위가 부재하고, 독립항 일부가 실시예 수준으로 기재되어 권리 범위가 좁아질 우려가 있습니다. 심사관 인용 선행기술 3건 존재로 무효 가능성도 완전히 배제하기 어렵습니다.</p>
                <p>시장성 및 사업성(60/100)은 KOSIS 기준 전자부품·컴퓨터·통신장비제조업 5년 평균 성장률 8.32%가 긍정적 신호이나, KIPRIS IPC 출원 증가율 -78.1%로 특허출원 활성도(1/5)가 최저점입니다. 마이크로서비스 아키텍처를 운영하는 기업 고객 대상 실시간 병목 시각화 기능의 운영 효율성 기여도는 높게 평가됩니다. 전반적으로 기술적 완성도는 준수하나 시장 경쟁성 강화와 글로벌 권리 범위 보강이 시급합니다.</p>
              </div>
            </div>

            <!-- ④ 추가 확인 필요 사항 -->
            <div class="rpt-subsection">
              <p class="rpt-subsection-title">추가 확인 필요 사항</p>
              <p class="rpt-subsection-desc">점수가 낮은 평가 항목에서 자동 추출했습니다. 사업부 자체 자료와의 교차 검토를 권장합니다.</p>
              <div v-for="item in REPORT_CONFIRM_ITEMS" :key="item.title" class="rpt-confirm-item">
                <div class="rpt-confirm-item-title">{{ item.title }}<span>{{ item.meta }}</span></div>
                <div class="rpt-confirm-item-desc">{{ item.desc }}</div>
              </div>
            </div>

            <!-- ⑤ 참고문헌 -->
            <div class="rpt-subsection rpt-subsection--last">
              <p class="rpt-subsection-title">참고문헌</p>
              <ol class="rpt-ref-list">
                <li v-for="(ref, i) in REPORT_REFS" :key="i">
                  <span class="rpt-ref-num">[{{ i + 1 }}]</span>
                  <span>{{ ref }}</span>
                </li>
              </ol>
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


      </div><!-- /sections-body -->

    </template>

    <!-- ── 챗봇 FAB ── -->
    <button v-if="!chatbotOpen" class="chat-fab" type="button" aria-label="AI 챗봇에게 질문하기" @click="toggleChatbot">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    </button>

    <!-- ── 챗봇 패널 ── -->
    <aside class="chat-panel" :class="{ open: chatbotOpen, expanded: chatbotExpanded }">
      <div class="chat-shell">
        <header class="chat-header">
          <button class="icon-button" type="button" @click="chatbotExpanded = !chatbotExpanded">
            <svg v-if="!chatbotExpanded" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 9V5h4M19 15v4h-4M5 15v4h4M19 9V5h-4"/>
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M14 10V6h4M10 14v4H6M10 10 6 6M18 18l-4-4"/>
            </svg>
          </button>
          <strong>SKIPA AI</strong>
          <button class="icon-button" type="button" @click="closeChatbot">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18"/>
            </svg>
          </button>
        </header>

        <div ref="chatViewport" class="chat-body">
          <div v-for="message in chatMessages" :key="message.id" class="chat-row" :class="message.role">
            <div class="chat-bubble" :class="message.role">
              <template v-if="message.typing">
                <span class="typing-dots"><span/><span/><span/></span>
              </template>
              <template v-else>{{ message.text }}</template>
            </div>
          </div>
        </div>

        <form class="chat-composer" @submit.prevent="sendChatMessage">
          <input v-model="chatInput" type="text" placeholder="특허에 대해 질문해 보세요." @keydown="handleChatKeydown"/>
          <button type="submit">전송</button>
        </form>
      </div>
    </aside>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, reactive } from 'vue'
import { useAuthStore } from '@/stores/auth'

type ChatRole = 'assistant' | 'user'
interface ChatMessage {
  id: number
  role: ChatRole
  text: string
  typing?: boolean
}
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
const activeTab = ref('info')
const tabsEl   = ref<HTMLElement | null>(null)

const TOPBAR_H = 60

const tabs = [
  { key: 'opinion',  label: '유지/포기 의견 제출' },
  { key: 'info',     label: '특허 원문' },
  { key: 'report',   label: 'AI 평가 보고서' },
  { key: 'similar',  label: '유사 특허 분석' },
  { key: 'projects', label: '사내 프로젝트 연관 정보' },
]

function scrollToSection(key: string) {
  const el = document.getElementById(`section-${key}`)
  if (!el) return
  const offset = TOPBAR_H + (tabsEl.value?.offsetHeight ?? 0)
  const top = el.getBoundingClientRect().top + window.scrollY - offset
  window.scrollTo({ top, behavior: 'smooth' })
}

let observer: IntersectionObserver | null = null

function setupObserver() {
  const offset = TOPBAR_H + (tabsEl.value?.offsetHeight ?? 0)

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

// ── 챗봇 ─────────────────────────────────────────────
const chatbotOpen     = ref(false)
const chatbotExpanded = ref(false)
const chatInput       = ref('')
const chatMessages    = ref<ChatMessage[]>([
  { id: 1, role: 'assistant', text: `${patent.value?.title ?? '이 특허'}에 대해 궁금한 점을 질문해주세요.` },
])
const chatViewport  = ref<HTMLElement | null>(null)
const messageId     = ref(2)
const pendingTimers = new Set<number>()

const chatPanelWidth = computed(() =>
  chatbotOpen.value ? (chatbotExpanded.value ? '100vw' : '480px') : '0px'
)

function scrollChatToBottom() {
  if (chatViewport.value) chatViewport.value.scrollTop = chatViewport.value.scrollHeight
}

function nextMessageId() {
  return messageId.value++
}

async function toggleChatbot() {
  chatbotOpen.value = !chatbotOpen.value
  if (!chatbotOpen.value) { chatbotExpanded.value = false; return }
  await nextTick()
  scrollChatToBottom()
}

function closeChatbot() { chatbotOpen.value = false; chatbotExpanded.value = false }

async function sendChatMessage() {
  const text = chatInput.value.trim()
  if (!text) return
  if (!chatbotOpen.value) { chatbotOpen.value = true; await nextTick() }

  chatMessages.value.push({ id: nextMessageId(), role: 'user', text })
  chatInput.value = ''

  const typingId = nextMessageId()
  chatMessages.value.push({ id: typingId, role: 'assistant', text: '', typing: true })
  await nextTick()
  scrollChatToBottom()

  const timerId = window.setTimeout(() => {
    const idx = chatMessages.value.findIndex((m) => m.id === typingId)
    if (idx !== -1) {
      chatMessages.value.splice(idx, 1, {
        id: nextMessageId(),
        role: 'assistant',
        text: '해당 특허의 평가 결과를 분석한 결과, 기술적 독창성이 높게 평가되었습니다. 추가적으로 궁금한 점이 있으시면 질문해주세요.',
      })
    }
    pendingTimers.delete(timerId)
    void nextTick(() => { scrollChatToBottom() })
  }, 1000)
  pendingTimers.add(timerId)
}

function handleChatKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void sendChatMessage() }
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
  pendingTimers.forEach((t) => window.clearTimeout(t))
  pendingTimers.clear()
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

// ── AI 보고서 accordion ──────────────────────────────────
const reportOpenRows = reactive<Record<string, boolean>>({})

interface RptItem { id: string; name: string; score: number; method: string; summary: string; grounds: string; sources: string }
interface RptBlock { key: string; title: string; score: number; items: RptItem[] }

const REPORT_EVAL_BLOCKS: RptBlock[] = [
  {
    key: 'tech', title: '기술성', score: 65,
    items: [
      {
        id: 'rt-1', name: '차별성 및 파급성', score: 3, method: 'LLM 분석',
        summary: '트랜잭션 분석 기반 병목 감지는 단일시장 적용 가능하나 차별성 제한적.',
        grounds: '모니터링 시스템은 특정 노드 간 메시지의 전송 과정에서 트랜잭션 정보를 분석하여 병목 구간의 발생 여부를 확인하고, 이를 기반으로 모니터링 화면의 정보를 갱신합니다. 이러한 기능은 단일시장에서 여러 신제품에 적용 가능하나, 제한된 차별성으로 보입니다. 현재 시장에서 유사한 모니터링 기능을 제공하는 솔루션이 다수 존재하여, 본 기술만의 독자적 차별화 포인트를 추가 확보하지 않으면 파급 효과가 제한될 수 있습니다.',
        sources: '비면허 주파수 관리 정책의 경제적 파급효과 (한국전자파학회 논문지, 2024); 메시지 지향 미들웨어(MOM) 개요 (Oracle 기술문서)',
      },
      {
        id: 'rt-2', name: '혁신성 및 개척성', score: 4, method: 'LLM 분석',
        summary: '토폴로지 기반 동적 상태 갱신 구조로 기술적 개척성 상당 부분 인정.',
        grounds: '본 발명은 메시지 지향 미들웨어에서의 토폴로지 기반 시스템 상태 및 병목 구간 모니터링 방법을 제시하며, 트랜잭션 정보를 기반으로 모니터링 화면을 갱신하고 병목 구간 발생 시 표시 방식을 가변시키는 혁신적 요소가 포함됩니다. 기존의 정적 모니터링 방식에서 벗어나 토폴로지 기반의 동적 상태 갱신 구조를 채택한 점은 기술적 개척성 측면에서 긍정적으로 평가됩니다.',
        sources: 'OSGi 기반 미들웨어의 개발에 관한 연구 (한국지식정보기술학회); ETRI 유선 네트워크 기술 동향 및 전망 보고서; 스마트제조혁신 생태계 고도화방안 (관계부처 합동)',
      },
      {
        id: 'rt-3', name: '대체기술 및 경쟁성', score: 2, method: 'LLM 분석',
        summary: '삼성·LG·퀄컴 등 대형 경쟁사 점유율 압도적, 자사 점유율 1.17%로 낮음.',
        grounds: '동일 IPC 분야(H04L, G06F) 내 등록 특허 표본 기준으로 자사 점유율은 1.17%에 불과하며, 상위 5개 경쟁 출원인(삼성전자, 엘지전자, 퀄컴, KT, 삼성디스플레이)의 합산 점유율이 17.9%에 달해 경쟁 우위를 확보하기 어려운 구조입니다.\n\nKIPRIS 근거: 동일 IPC 전체 검색 464,967건, 등록 표본 1,363건, 출원인 567개, 자사 순위 11위.',
        sources: 'Samsung Newsroom Korea; KIPRIS IPC 표본 분석 (H04L, G06F)',
      },
      {
        id: 'rt-4', name: '기술 모방 및 회피설계 난이도', score: 4, method: 'LLM 분석',
        summary: '병목 감지 로직과 화면 표시 연계 구조로 모방·회피설계 모두 어려움.',
        grounds: '기술적 모방이 어렵고, 노드 간 메시지의 전송 과정에서 트랜잭션 정보를 분석하여 병목 구간을 확인하는 복잡성이 존재합니다. 트랜잭션 실패 건수 기반 병목 감지 로직과 토폴로지 화면 표시 방식의 연계 구조는 구현 단계에서 상당한 기술적 이해를 요구하며, 이를 유사 기능으로 대체하더라도 동일한 성능을 달성하기 어렵습니다.',
        sources: 'KIPRIS 한국 등록특허 10-2893083',
      },
    ],
  },
  {
    key: 'rights', title: '권리성', score: 66,
    items: [
      {
        id: 'rr-1', name: 'IP 원천성', score: 3, method: '자동산출',
        summary: '심사관 인용 선행기술 3건, 피인용수 0건.',
        grounds: '심사관 인용 선행기술 3건이 확인되었으며, 피인용수는 0건입니다. 이는 원천 특허로서의 파급력이 아직 형성되지 않았음을 의미합니다.',
        sources: '별도 출처 없음 (KIPRIS 자동산출)',
      },
      {
        id: 'rr-2', name: '권리의 충실성', score: 3, method: '자동산출',
        summary: '청구항 3개, 카테고리 3개, 해외출원 없음.',
        grounds: '청구항 수 3개, 카테고리 3개로 구성되어 있으며 해외출원이 없습니다. 청구항 수가 적고 해외 보호 범위가 없어 권리의 충실성이 보통 수준입니다.',
        sources: '별도 출처 없음 (KIPRIS 자동산출)',
      },
      {
        id: 'rr-3', name: '권리행사 제한 가능성', score: 5, method: '자동산출',
        summary: '출원인 1명, 심판이력 0건으로 제한 요소 없음.',
        grounds: '출원인이 1명이며 심판이력이 0건입니다. 공동출원인에 의한 권리행사 제한 또는 무효심판 등의 제약 요소가 전혀 없어 최고 점수를 부여합니다.',
        sources: '별도 출처 없음 (KIPRIS 자동산출)',
      },
      {
        id: 'rr-4', name: '무효 가능성', score: 3, method: 'LLM 분석',
        summary: '선행기술 3건 존재로 무효 가능성 완전 배제 어려움.',
        grounds: '모니터링 시스템의 구체적인 단계가 명시되어 있으나, 동일 IPC 분야에 선행기술이 다수 존재하고 심사관 인용 선행기술이 3건 확인된 점은 무효 가능성을 완전히 배제하기 어렵게 만드는 요인입니다.',
        sources: 'KIPRIS 한국 등록특허 10-2893083',
      },
      {
        id: 'rr-5', name: '회피설계 용이성', score: 3, method: 'LLM 분석',
        summary: '한정적 구성요소로 우회 설계 이론적 가능, 난이도 보통.',
        grounds: '청구범위에 한정적인 구성요소가 일부 있어서 회피설계 난이도가 보통 수준입니다. \'특정 노드 간 메시지 전송\'이라는 구체적 구성이 명시된 만큼, 이를 우회하는 설계가 이론적으로는 가능합니다.',
        sources: 'KIPRIS 한국 등록특허 10-2893083',
      },
      {
        id: 'rr-6', name: '권리범위 적절성', score: 3, method: 'LLM 분석',
        summary: '특정 기능 흐름 중심 청구항으로 전체 사업화 범위 보호 불충분.',
        grounds: '청구항이 모니터링 시스템의 특정 기능 흐름에 집중되어 있어, 기술이 다양한 환경에 적용되더라도 권리 범위로 포섭되지 않을 가능성이 있습니다.',
        sources: 'KIPRIS 한국 등록특허 10-2893083',
      },
      {
        id: 'rr-7', name: '권리의 구성요소', score: 4, method: 'LLM 분석',
        summary: '핵심 기능 명확히 기재, 비본질적 요소 최소화로 청구범위 실효성 높음.',
        grounds: '모니터링 시스템의 핵심 기능이 명확하게 설명되어 있으며, 비본질적인 구성요소가 거의 포함되지 않았습니다. 병목 구간 발생 여부 확인과 모니터링 화면 갱신 기능에 대한 기술적 세부사항이 포함되어 독립항의 완결성이 높습니다.',
        sources: 'KIPRIS 한국 등록특허 10-2893083',
      },
      {
        id: 'rr-8', name: '권리의 추상성', score: 3, method: 'LLM 분석',
        summary: '일부 구성이 실시예 수준으로 기재, 청구범위가 좁아질 가능성.',
        grounds: '독립항의 일부 구성요소가 실시예에 가깝게 기재되어 있습니다. \'특정 노드 간 메시지의 전송 과정에서 트랜잭션 정보를 분석하여, 병목 구간의 발생 여부를 확인함\'은 구체적인 실시예에 가까운 내용으로, 독립항의 범위가 과도하게 좁아져 경쟁사의 변형 기술을 포섭하지 못할 위험이 있습니다.',
        sources: 'KIPRIS 한국 등록특허 10-2893083',
      },
      {
        id: 'rr-9', name: 'IP 포트폴리오 구축 적절성', score: 3, method: 'LLM 분석',
        summary: '국내 개량IP 복수 보유하나 해외 출원 없어 글로벌 보호 한계.',
        grounds: '복수의 국내 개량IP가 포함되어 있으며, 보통 수준으로 제품 및 서비스 보호가 가능합니다. 다만 해외 출원이 없어 글로벌 시장에서의 권리 보호 측면에서 한계로 작용할 수 있습니다.',
        sources: 'KIPRIS 한국 등록특허 10-2893083',
      },
      {
        id: 'rr-10', name: '침해 발견 및 입증 용이성', score: 3, method: 'LLM 분석',
        summary: '실험으로 침해 확인 가능하나 내부 동작의 블랙박스 특성으로 감정 필요 가능.',
        grounds: '정밀한 실험이나 조사를 통해 침해 발견 및 입증이 가능합니다. 다만, 시스템 내부 동작(트랜잭션 분석, 병목 감지 로직)은 외부에서 직접 관찰하기 어려운 블랙박스적 특성이 있어, 실제 침해 입증 과정에서 기술 감정이 필요할 수 있습니다.',
        sources: 'KIPRIS 한국 등록특허 10-2893083',
      },
    ],
  },
  {
    key: 'market', title: '시장성 및 사업성', score: 60,
    items: [
      {
        id: 'rm-1', name: '특허출원 활성도', score: 1, method: '자동산출',
        summary: 'KIPRIS IPC 출원 증가율 -78.1% (전체 -81.2%).',
        grounds: 'KIPRIS IPC 출원 증가율 -78.1% (전체 -81.2%). 해당 기술 분야의 특허 출원이 급격히 감소하고 있어 시장 활성도가 매우 낮습니다.',
        sources: '별도 출처 없음 (KIPRIS 자동산출)',
      },
      {
        id: 'rm-2', name: '매출 성장성', score: 4, method: '자동산출 (KOSIS)',
        summary: 'KOSIS 전자부품·컴퓨터·통신장비제조업 5년 평균 성장률 8.32%.',
        grounds: 'KOSIS 전자부품·컴퓨터·통신장비제조업 5년 평균 성장률 8.32%로 양호한 시장 성장세를 보이고 있습니다. 제조 데이터 분석 기반의 미들웨어 솔루션 수요는 지속 증가 추세입니다.',
        sources: '별도 출처 없음 (KOSIS 자동산출)',
      },
      {
        id: 'rm-3', name: '고객에 미치는 영향', score: 4, method: 'LLM 분석',
        summary: '마이크로서비스 운영 기업에 실시간 병목 시각화로 운영 효율성 직접 기여.',
        grounds: '토폴로지 타입의 모니터링 화면 내 노드 간 연결 상태 및 병목 구간의 발생 여부를 직관적으로 확인할 수 있어 고객이 기술사용에 따른 이익을 실감할 수 있습니다. 특히 복잡한 마이크로서비스 아키텍처를 운영하는 기업 고객의 경우, 실시간 병목 시각화 기능이 운영 효율성 개선에 직접적인 가치를 제공합니다.',
        sources: '4차 산업혁명 관련 新특허분류체계 Z코드 및 기술설명서 (특허청); OSGi 기반 미들웨어의 개발에 관한 연구 (한국지식정보기술학회)',
      },
    ],
  },
]

const REPORT_CONFIRM_ITEMS = [
  { title: '특허출원 활성도', meta: ' · 시장성 및 사업성 · 1/5', desc: 'KIPRIS IPC 출원 증가율 -78.1% (전체 -81.2%). 해당 기술 분야의 출원이 급격히 감소하고 있어 시장 관심도 하락 여부를 추가 검토하십시오.' },
  { title: '대체기술 및 경쟁성', meta: ' · 기술성 · 2/5', desc: '삼성전자, 엘지전자, 퀄컴 등 대형 경쟁 출원인의 합산 점유율이 17.9%에 달합니다. 자사 시장 점유 전략 및 차별화 포인트의 구체화가 필요합니다.' },
  { title: 'IP 원천성', meta: ' · 권리성 · 3/5', desc: '심사관 인용 선행기술 3건이 존재하며 피인용수 0건입니다. 선행기술과의 기술적 차별성 문서화 및 개량 청구항 검토를 권장합니다.' },
  { title: '권리의 충실성', meta: ' · 권리성 · 3/5', desc: '청구항 3개, 카테고리 3개로 구성되어 있고 해외출원이 없습니다. 사업화 범위 확대를 위한 추가 청구항 또는 해외 출원(PCT) 검토가 필요합니다.' },
  { title: '차별성 및 파급성', meta: ' · 기술성 · 3/5', desc: '유사 모니터링 솔루션 대비 본 기술만의 독자적 차별화 포인트가 명확하지 않습니다. 성능 벤치마크 또는 특화 시장 설정을 통한 포지셔닝 보강을 권장합니다.' },
]

const REPORT_REFS = [
  '비면허 주파수 관리 정책의 경제적 파급효과: 기술기준 개정을 중심으로 (변희섭, 한국전자파학회 논문지, 2024)',
  '메시지 지향 미들웨어(MOM) 개요 (Oracle 기술문서)',
  'OSGi 기반 미들웨어의 개발에 관한 연구 (한국지식정보기술학회 논문지)',
  '유선 네트워크 기술 동향 및 전망 (ETRI 기술기획보고서)',
  '스마트제조혁신 생태계 고도화방안 (관계부처 합동, 대한민국 정책브리핑)',
  '통신 장비 시장 규모·점유율·전망 보고서 2025–2032 (Consegic Business Intelligence)',
  '삼성전자, AI·초연결로 HVAC 시장 주도권 잡는다 (Samsung Newsroom Korea)',
  '4차 산업혁명 관련 新특허분류체계 Z코드 및 기술설명서 (특허청)',
  '스마트 팩토리 구축을 위한 설비제어 데이터 표준화 및 통합 관제 플랫폼 (skax.co.kr)',
  '스마트 팩토리 시스템의 통합을 실현하는 미들웨어 솔루션 (skax.co.kr)',
  '제조 데이터 분석 기반 스마트 팩토리 구축 및 고도화 (skax.co.kr)',
  'KIPRIS 유사 특허 분석 결과: 10-2893083',
]
</script>

<style scoped>
.detail-page {
  font-family: 'Pretendard', sans-serif;
  display: flex;
  flex-direction: column;
  gap: 0;
  --chat-width: 0px;
  padding-right: var(--chat-width);
  transition: padding-right 0.3s ease;
}

/* ── 헤더 래퍼 (non-sticky) ─────────────────────────── */
.detail-header { margin-bottom: 20px; }

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

/* ── 탭바 (sticky: 앱바 60px 바로 아래) ─────────────── */
.tabs {
  position: sticky;
  top: 60px;
  z-index: 19;
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
  border-radius: 16px;
  overflow: hidden;
  margin-top: 4px;
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

/* ── 챗봇 FAB ─────────────────────────────────────── */
.chat-fab {
  position: fixed; right: 32px; bottom: 32px; z-index: 60;
  width: 58px; height: 58px; border-radius: 50%; border: none;
  background: #10b981; color: #fff; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 8px 24px rgba(16, 185, 129, 0.4);
  transition: transform 0.15s, box-shadow 0.15s;
}
.chat-fab:hover { transform: scale(1.07); box-shadow: 0 12px 32px rgba(16, 185, 129, 0.5); }
.chat-fab svg { width: 24px; height: 24px; }

/* ── 챗봇 패널 ────────────────────────────────────── */
.chat-panel {
  position: fixed; top: 0; right: 0; bottom: 0; z-index: 55;
  width: 480px;
  transform: translateX(100%);
  transition: transform 0.3s ease, width 0.3s ease;
  pointer-events: none;
}
.chat-panel.open { transform: translateX(0); pointer-events: auto; }
.chat-panel.expanded { width: 100vw; }

.chat-shell {
  display: flex; flex-direction: column;
  width: 100%; height: 100%;
  background: #f8fafc;
  border-left: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: -20px 0 48px rgba(15, 23, 42, 0.14);
}

.chat-header {
  display: grid; grid-template-columns: auto 1fr auto;
  align-items: center; gap: 14px;
  min-height: 64px; padding: 0 20px;
  background: #0f172a; color: #fff;
}
.chat-header strong { justify-self: center; font-size: 15px; font-weight: 800; }

.icon-button {
  width: 36px; height: 36px; border-radius: 50%;
  background: rgba(255,255,255,0.12); border: none; cursor: pointer;
  color: #fff; display: flex; align-items: center; justify-content: center;
  transition: background 0.13s;
}
.icon-button:hover { background: rgba(255,255,255,0.2); }
.icon-button svg { width: 18px; height: 18px; stroke: currentColor; stroke-width: 1.8; fill: none; }

.chat-body {
  flex: 1; overflow-y: auto;
  display: flex; flex-direction: column; gap: 12px; padding: 18px;
}
.chat-row           { display: flex; }
.chat-row.assistant { justify-content: flex-start; }
.chat-row.user      { justify-content: flex-end; }
.chat-bubble {
  max-width: min(80%, 300px); padding: 12px 15px;
  border-radius: 16px; font-size: 13.5px; line-height: 1.7; white-space: pre-line;
}
.chat-bubble.assistant { background: #fff; color: #102033; border-top-left-radius: 4px; box-shadow: 0 2px 8px rgba(15,23,42,0.08); }
.chat-bubble.user      { background: #0f172a; color: #fff; border-top-right-radius: 4px; }

.typing-dots { display: inline-flex; align-items: center; gap: 4px; min-height: 18px; }
.typing-dots span {
  width: 6px; height: 6px; border-radius: 50%;
  background: #94a3b8; animation: chat-bounce 1.1s infinite ease-in-out;
}
.typing-dots span:nth-child(2) { animation-delay: 0.15s; }
.typing-dots span:nth-child(3) { animation-delay: 0.3s; }

.chat-composer {
  display: grid; grid-template-columns: 1fr auto; gap: 10px;
  padding: 14px 18px 18px;
  border-top: 1px solid rgba(15,23,42,0.08);
  background: rgba(255,255,255,0.9);
}
.chat-composer input {
  width: 100%; box-sizing: border-box;
  border: 1px solid rgba(15,23,42,0.12); border-radius: 12px;
  padding: 10px 14px; font-size: 13.5px; font-family: inherit;
  color: #102033; background: #fff; outline: none;
  transition: border-color 0.15s;
}
.chat-composer input:focus { border-color: #10b981; }
.chat-composer button {
  padding: 0 18px; border-radius: 12px; border: none;
  background: #0f172a; color: #fff;
  font-size: 13.5px; font-weight: 700; font-family: inherit; cursor: pointer;
  transition: background 0.13s;
}
.chat-composer button:hover { background: #1e293b; }

@keyframes chat-bounce {
  0%, 80%, 100% { transform: translateY(0); opacity: 0.55; }
  40%            { transform: translateY(-4px); opacity: 1; }
}

@media (max-width: 768px) {
  .chat-fab { right: 20px; bottom: 20px; }
  .chat-panel { width: 100vw; }
}

/* ── AI 보고서 (rpt-*) ───────────────────────────── */
.rpt-score-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}
@media (max-width: 680px) { .rpt-score-cards { grid-template-columns: repeat(2, 1fr); } }

.rpt-score-card {
  background: #fff; border: 1px solid #e2e8f0; border-radius: 10px;
  padding: 18px 16px 14px; display: flex; flex-direction: column; gap: 10px;
}
.rpt-score-card__label {
  font-size: 11px; font-weight: 700; color: #94a3b8;
  text-transform: uppercase; letter-spacing: 0.07em;
}
.rpt-score-card__value {
  font-size: 26px; font-weight: 800;
  font-family: 'JetBrains Mono', 'Consolas', monospace;
  color: var(--rpt-card-color, #0f172a); line-height: 1;
}
.rpt-score-card__denom { font-size: 13px; font-weight: 400; color: #94a3b8; }
.rpt-score-card__bar { height: 4px; background: #f1f5f9; border-radius: 2px; overflow: hidden; }
.rpt-score-card__bar-fill { height: 100%; border-radius: 2px; background: var(--rpt-card-color, #0f172a); }

.rpt-eval-block { margin-bottom: 28px; }

.rpt-eval-block-header {
  display: flex; justify-content: space-between; align-items: center;
  background: #1e293b; color: #fff;
  padding: 10px 16px;
  border-radius: 10px 10px 0 0;
}
.rpt-eval-block-title { font-size: 13px; font-weight: 700; }
.rpt-eval-block-score {
  font-family: 'JetBrains Mono', 'Consolas', monospace;
  font-size: 16px; font-weight: 700;
}

.rpt-table-wrap { overflow-x: auto; }

.rpt-eval-table {
  width: 100%; border-collapse: collapse;
  border: 1px solid #e2e8f0; border-top: none;
  background: #fff; min-width: 560px;
}
.rpt-eval-table thead tr { background: #f8fafc; }
.rpt-eval-table th {
  padding: 9px 14px; text-align: left;
  font-size: 11px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.07em; color: #94a3b8;
  border-bottom: 1px solid #e2e8f0;
}
.rpt-eval-table td {
  padding: 10px 14px; vertical-align: top;
  border-bottom: 1px solid #f1f5f9; font-size: 12.5px; color: #374151;
}
.rpt-eval-table tbody tr:last-child td { border-bottom: none; }

.rpt-data-row { cursor: pointer; transition: background 0.1s; }
.rpt-data-row:hover { background: #f8fafc; }
.rpt-item-name { font-weight: 600; color: #0f172a; }
.rpt-method { color: #64748b; white-space: nowrap; }
.rpt-summary { color: #475569; line-height: 1.55; }

.rpt-score-pill {
  display: inline-block;
  font-family: 'JetBrains Mono', 'Consolas', monospace;
  font-size: 12px; font-weight: 700;
  padding: 3px 9px; border-radius: 5px; white-space: nowrap;
}
.rpt-score-5 { background: #f0fdf4; color: #15803d; }
.rpt-score-4 { background: #ecfdf5; color: #059669; }
.rpt-score-3 { background: #fefce8; color: #a16207; }
.rpt-score-2 { background: #fef2f2; color: #b91c1c; }
.rpt-score-1 { background: #fef2f2; color: #991b1b; }

.rpt-toggle-btn {
  background: none; border: none; cursor: pointer;
  color: #94a3b8; font-size: 10px; padding: 2px 4px;
  transition: transform 0.2s, color 0.15s; display: inline-block;
}
.rpt-toggle-btn.open { transform: rotate(90deg); color: #4f46e5; }

.rpt-detail-row td { padding: 0 !important; border-bottom: 1px solid #e2e8f0 !important; }
.rpt-detail-content { padding: 18px 22px; background: #f8fafc; border-top: 1px solid #e2e8f0; }

.rpt-detail-label {
  font-size: 10.5px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.1em; color: #94a3b8; margin-bottom: 6px; margin-top: 14px;
  font-family: 'JetBrains Mono', 'Consolas', monospace;
}
.rpt-detail-label:first-child { margin-top: 0; }
.rpt-detail-text { font-size: 12.5px; color: #374151; line-height: 1.8; white-space: pre-wrap; }

.rpt-subsection { margin-top: 28px; }
.rpt-subsection--last { margin-bottom: 0; }

.rpt-subsection-title {
  font-size: 12px; font-weight: 700; color: #0f172a;
  margin: 0 0 12px; padding-bottom: 10px;
  border-bottom: 1px solid #f1f5f9;
  text-transform: uppercase; letter-spacing: 0.04em;
}
.rpt-subsection-desc { font-size: 12.5px; color: #94a3b8; margin: 0 0 14px; }

.rpt-opinion-box {
  background: #f8fafc; border: 1px solid #e2e8f0;
  border-left: 3px solid #94a3b8; border-radius: 0 10px 10px 0;
  padding: 16px 18px; font-size: 13.5px; line-height: 1.85; color: #374151;
}
.rpt-opinion-box p { margin: 0 0 12px; }
.rpt-opinion-box p:last-child { margin-bottom: 0; }

.rpt-confirm-item {
  background: #fff; border: 1px solid #e2e8f0;
  border-left: 3px solid #dc2626; border-radius: 0 8px 8px 0;
  padding: 14px 18px; margin-bottom: 10px;
}
.rpt-confirm-item:last-of-type { margin-bottom: 0; }
.rpt-confirm-item-title { font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 5px; }
.rpt-confirm-item-title span { color: #94a3b8; font-weight: 400; font-size: 12px; }
.rpt-confirm-item-desc { font-size: 12.5px; color: #475569; line-height: 1.65; }

.rpt-ref-list {
  list-style: none; padding: 0; margin: 0;
  display: flex; flex-direction: column;
}
.rpt-ref-list li {
  display: flex; gap: 10px; align-items: flex-start;
  padding: 10px 0; border-bottom: 1px solid #f1f5f9;
  font-size: 12.5px; color: #64748b;
}
.rpt-ref-list li:last-child { border-bottom: none; }
.rpt-ref-num {
  font-family: 'JetBrains Mono', 'Consolas', monospace;
  font-size: 11px; font-weight: 500; color: #94a3b8;
  min-width: 34px; padding-top: 1px; flex-shrink: 0;
}
</style>
