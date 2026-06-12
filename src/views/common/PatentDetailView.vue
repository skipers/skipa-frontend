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
            <button class="btn-pdf-download">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              원문 PDF
            </button>
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

      <!-- ── 본문 컬럼 레이아웃 ── -->
      <div class="detail-columns">

        <div class="sections-body">

        <!-- ── 섹션 1: 기본 정보 ── -->
        <section id="section-info" data-section="info" class="content-section">
          <div class="section-header">
            <h2 class="section-heading">기본 정보</h2>
          </div>

          <div class="info-section" v-if="patentBiblio">
            <h3 class="info-section__title">서지정보</h3>
            <table class="biblio-table">
              <tbody>
                <tr>
                  <th>IPC</th>
                  <td>
                    <div class="code-tag-row">
                      <span v-for="code in patentBiblio.ipcCodes" :key="code" class="code-tag">{{ code }}</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <th>CPC</th>
                  <td>
                    <div class="code-tag-row">
                      <span v-for="code in patentBiblio.cpcCodes" :key="code" class="code-tag">{{ code }}</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <th>출원번호(일자)</th>
                  <td>{{ patentBiblio.applicationNum }} ({{ patentBiblio.applicationDate }})</td>
                </tr>
                <tr>
                  <th>출원인</th>
                  <td>{{ patentBiblio.applicant }}</td>
                </tr>
                <tr>
                  <th>발명자</th>
                  <td>{{ detailExtras.inventor }}</td>
                </tr>
                <tr>
                  <th>등록번호(일자)</th>
                  <td>{{ patentBiblio.registrationNum ? `${patentBiblio.registrationNum} (${patentBiblio.registrationDate})` : '' }}</td>
                </tr>
                <tr>
                  <th>공개번호(일자)</th>
                  <td>{{ patentBiblio.pubNum }} ({{ patentBiblio.pubDate }})</td>
                </tr>
                <tr>
                  <th>공고번호(일자)</th>
                  <td>{{ patentBiblio.annNum }}</td>
                </tr>
                <tr><th>심사청구항수</th><td>{{ patentBiblio.claimsCount }}</td></tr>
                <tr>
                  <th>소멸일</th>
                  <td :class="expiryClass">{{ formatDate(patent.expiryDate) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="info-section">
            <h3 class="info-section__title">키워드</h3>
            <div class="kw-chip-row">
              <span v-for="kw in patent.tags" :key="kw" class="kw-chip"># {{ kw }}</span>
            </div>
          </div>

          <div class="info-section">
            <h3 class="info-section__title">발명의 요약</h3>
            <p class="info-text">{{ detailExtras.summary }}</p>
          </div>

        </section>

        <div v-if="isOwnDept" class="section-divider"></div>

        <!-- ── 섹션 2: AI 평가 보고서 ── -->
        <section v-if="isOwnDept" id="section-report" data-section="report" class="content-section">
          <div class="section-header">
            <h2 class="section-heading">AI 평가 보고서</h2>
          </div>

          <template v-if="patent.grade">

            <!-- 1. 평가 요약 -->
            <div class="rpt-part">
              <h3 class="rpt-part-title"><span class="rpt-part-num">01</span>평가 요약</h3>
              <div class="rpt-score-cards">
                <div class="rpt-score-card" style="--rpt-card-color:#111827">
                  <div class="rpt-score-card__label">종합</div>
                  <div class="rpt-score-card__value">{{ totalScore }}<span class="rpt-score-card__denom"> / 100</span></div>
                  <div class="rpt-score-card__bar"><div class="rpt-score-card__bar-fill" :style="{ width: totalScore + '%' }"></div></div>
                </div>
                <div class="rpt-score-card" style="--rpt-card-color:#1a6e3c">
                  <div class="rpt-score-card__label">기술성</div>
                  <div class="rpt-score-card__value">{{ aiScores.tech }}<span class="rpt-score-card__denom"> / 100</span></div>
                  <div class="rpt-score-card__bar"><div class="rpt-score-card__bar-fill" :style="{ width: aiScores.tech + '%' }"></div></div>
                </div>
                <div class="rpt-score-card" style="--rpt-card-color:#7a6a00">
                  <div class="rpt-score-card__label">권리성</div>
                  <div class="rpt-score-card__value">{{ aiScores.rights }}<span class="rpt-score-card__denom"> / 100</span></div>
                  <div class="rpt-score-card__bar"><div class="rpt-score-card__bar-fill" :style="{ width: aiScores.rights + '%' }"></div></div>
                </div>
                <div class="rpt-score-card" style="--rpt-card-color:#8b1a1a">
                  <div class="rpt-score-card__label">시장성 및 사업성</div>
                  <div class="rpt-score-card__value">{{ aiScores.biz }}<span class="rpt-score-card__denom"> / 100</span></div>
                  <div class="rpt-score-card__bar"><div class="rpt-score-card__bar-fill" :style="{ width: aiScores.biz + '%' }"></div></div>
                </div>
              </div>
              <div class="rpt-opinion-box">
                <p>{{ aiComments.tech }}</p>
                <p>{{ aiComments.rights }}</p>
                <p>{{ aiComments.biz }}</p>
              </div>
            </div>

            <!-- 2. 평가 기준별 상세 점수 -->
            <div class="rpt-part">
              <h3 class="rpt-part-title"><span class="rpt-part-num">02</span>평가 기준별 상세 점수</h3>

              <!-- ① 점수 + 요약 한 행씩 -->
              <div class="rpt-criteria-list">
                <div v-for="(block, bi) in REPORT_EVAL_BLOCKS" :key="block.key" class="rpt-criteria-row">
                  <div class="rpt-criteria-score"
                    :style="bi === 0 ? '--rc-color:#1a6e3c' : bi === 1 ? '--rc-color:#7a6a00' : '--rc-color:#8b1a1a'">
                    <div class="rpt-criteria-score__label">{{ block.title }}</div>
                    <div class="rpt-criteria-score__value">{{ block.score }}<span>/100</span></div>
                    <div class="rpt-criteria-score__bar">
                      <div class="rpt-criteria-score__bar-fill" :style="{ width: block.score + '%' }"></div>
                    </div>
                  </div>
                  <p class="rpt-criteria-text">{{
                    bi === 0 ? aiComments.tech : bi === 1 ? aiComments.rights : aiComments.biz
                  }}</p>
                </div>
              </div>

              <!-- ③ 평가 항목 세부 내역 (토글) -->
              <details class="rpt-appendix">
                <summary class="rpt-appendix__summary">
                  평가 항목 세부 내역
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="rpt-appendix__chevron"><path d="M6 9l6 6 6-6"/></svg>
                </summary>
                <div class="rpt-appendix__body">
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
                </div>
              </details>
            </div>

            <!-- 3. 사내 프로젝트 활용 현황 -->
            <div class="rpt-part">
              <h3 class="rpt-part-title"><span class="rpt-part-num">03</span>사내 프로젝트 활용 현황</h3>

              <table class="rpt-info-table">
                <tbody>
                  <tr><th>사업화 여부</th><td>진행 중</td></tr>
                  <tr><th>적용 사업·서비스</th><td>스마트 팩토리 시스템 통합 미들웨어 솔루션</td></tr>
                  <tr><th>사업 적용 이력</th><td>2025년 이후 고객 사례와 함께 적용되고 있는 것으로 보임</td></tr>
                  <tr><th>고객·파트너</th><td>반도체 소재 제조 업체 S사</td></tr>
                  <tr><th>사업화 신호</th><td>고객 사례, 수상·인증</td></tr>
                </tbody>
              </table>

              <div class="rpt-project-card">
                <div class="rpt-project-card__name">요약 설명</div>
                <p class="rpt-project-card__desc" style="margin-bottom:0">
                  RAG 검색 결과, 이 특허와 연결되는 사내 활용 영역은 '스마트 팩토리 시스템 통합 미들웨어 솔루션'이며 사업화 상태는 '진행 중'입니다. iFacts DiFlow는 스마트 팩토리 시스템의 통합을 위한 미들웨어 솔루션으로, 자동화와 지능화를 통해 생산 프로세스를 최적화하고 효율성을 향상시킵니다. 현재 고객 사례를 통해 사업화가 진행 중입니다. 사업 적용 이력은 '2025년 이후 고객 사례와 함께 적용되고 있는 것으로 보임', 고객·파트너는 '반도체 소재 제조 업체 S사'로 확인됩니다. 사업화 신호는 고객 사례, 수상·인증입니다.
                </p>
              </div>

              <div class="rpt-project-card">
                <div class="rpt-project-card__name">근거 자료</div>
                <ol class="rpt-evidence-list">
                  <li v-for="(ev, i) in MOCK_PROJECT_EVIDENCE" :key="i">
                    <a class="rpt-evidence-link" :href="ev.url" target="_blank" rel="noopener">{{ ev.title }}</a>
                  </li>
                </ol>
              </div>
            </div>

            <!-- 4. 유사 특허 분석 -->
            <div class="rpt-part">
              <h3 class="rpt-part-title"><span class="rpt-part-num">04</span>유사 특허 분석</h3>

              <!-- 통계 -->
              <div class="rpt-stat-row">
                <div class="rpt-stat"><span class="rpt-stat-num" style="color:#2563eb">{{ MOCK_SIMILAR_PATENTS.length }}</span><span class="rpt-stat-label">분석 대상</span></div>
                <div class="rpt-stat"><span class="rpt-stat-num" style="color:#166534">6</span><span class="rpt-stat-label">등록/유지</span></div>
                <div class="rpt-stat"><span class="rpt-stat-num" style="color:#6b7280">1</span><span class="rpt-stat-label">공개/심사중</span></div>
                <div class="rpt-stat"><span class="rpt-stat-num" style="color:#374151">3</span><span class="rpt-stat-label">거절/소멸</span></div>
                <div class="rpt-stat"><span class="rpt-stat-num" style="color:#854d0e">2.2</span><span class="rpt-stat-label">평균 피인용수</span></div>
              </div>

              <!-- 요약 (통계 바로 아래) -->
              <div class="rpt-opinion-box">
                <p>KIPRIS 유사도 상위 {{ MOCK_SIMILAR_PATENTS.length }}건 중 등록/유지 6건, 공개/심사중 1건, 거절/소멸 3건으로 나타납니다. 분석 대상 특허는 '실시간 병목 자동 분석 방법'과 '차량 네트워크에서 ASIL에 기초한 통신 방법'과 같은 비교 특허와 네트워크 시스템의 병목 구간 모니터링에서 기술적 겹침이 나타납니다. 그러나 메시지 지향 미들웨어에서의 병목 모니터링에 집중한다는 점에서 차별화됩니다.</p>
              </div>

              <!-- 상위 3개 상세 카드 (유사도 내림차순 이미 정렬됨) -->
              <div v-for="(s, si) in [...MOCK_SIMILAR_PATENTS].sort((a,b) => b.similarityScore - a.similarityScore).slice(0, 3)" :key="s.id" class="rpt-similar-card">
                <div class="rpt-similar-card__top">
                  <div class="rpt-similar-card__info">
                    <div class="rpt-similar-card__name">#{{ si + 1 }} {{ s.title }}</div>
                    <div class="rpt-similar-card__meta">
                      <span>{{ s.applicant }}</span>
                      <span :class="['rpt-status-badge', s.status === '유지' ? 'rpt-status--keep' : s.status === '소멸' ? 'rpt-status--expired' : 'rpt-status--open']">{{ s.status }}</span>
                      <span>출원번호 {{ s.applicationNumber }}</span>
                      <span>피인용 {{ s.citations }}</span>
                    </div>
                  </div>
                  <span class="rpt-similar-score-badge">유사도 {{ s.similarityScore }}</span>
                </div>
                <p class="rpt-similar-card__desc">{{ s.desc }}</p>
                <div v-if="s.detail" class="rpt-similar-card__detail">
                  <p v-for="(line, li) in s.detail.split('\n')" :key="li">{{ line }}</p>
                </div>
              </div>

              <!-- 전체 목록 테이블 (유사도 내림차순) -->
              <div class="rpt-table-wrap rpt-table-wrap--similar">
                <table class="rpt-eval-table">
                  <thead>
                    <tr>
                      <th style="width:150px">출원번호</th>
                      <th>특허명</th>
                      <th style="width:150px">출원인</th>
                      <th style="width:80px">출원연도</th>
                      <th style="width:80px">유사도</th>
                      <th style="width:80px">피인용수</th>
                      <th style="width:70px">상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="s in [...MOCK_SIMILAR_PATENTS].sort((a,b) => b.similarityScore - a.similarityScore)" :key="s.id">
                      <td><span class="mono text-muted-sm">{{ s.applicationNumber }}</span></td>
                      <td class="rpt-item-name">{{ s.title }}</td>
                      <td><span class="similar-applicant">{{ s.applicant }}</span></td>
                      <td class="rpt-method">{{ s.year }}</td>
                      <td class="rpt-method" style="font-weight:600">{{ s.similarityScore }}</td>
                      <td class="rpt-method">{{ s.citations }}</td>
                      <td>
                        <span :class="['rpt-status-badge', s.status === '유지' ? 'rpt-status--keep' : s.status === '소멸' ? 'rpt-status--expired' : 'rpt-status--open']">{{ s.status }}</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- 5. 추가 확인 필요 사항 -->
            <div class="rpt-part">
              <h3 class="rpt-part-title"><span class="rpt-part-num">05</span>추가 확인 필요 사항</h3>
              <p class="rpt-subsection-desc">점수가 낮은 평가 항목에서 자동 추출했습니다. 사업부 자체 자료와의 교차 검토를 권장합니다.</p>
              <div v-for="item in REPORT_CONFIRM_ITEMS" :key="item.title" class="rpt-confirm-item">
                <div class="rpt-confirm-item-title">{{ item.title }}<span>{{ item.meta }}</span></div>
                <div class="rpt-confirm-item-desc">{{ item.desc }}</div>
              </div>
            </div>

            <!-- 6. 참고문헌 -->
            <div class="rpt-part rpt-part--last">
              <h3 class="rpt-part-title"><span class="rpt-part-num">06</span>참고문헌</h3>
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

        <!-- ── 섹션 3: 등록료 납부 내역 ── -->
        <section id="section-fee" data-section="fee" class="content-section">
          <div class="section-header">
            <h2 class="section-heading">등록료 납부 내역</h2>
            <div v-if="isLegal" class="fee-edit-actions">
              <template v-if="!feeEditMode">
                <button class="btn-fee-edit" @click="startFeeEdit">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  수정
                </button>
              </template>
              <template v-else>
                <button class="btn-fee-cancel" @click="cancelFeeEdit">취소</button>
                <button class="btn-fee-save" @click="saveFeeEdit">저장</button>
              </template>
            </div>
          </div>

          <!-- 일반 보기 -->
          <table v-if="!feeEditMode" class="fee-table">
            <thead>
              <tr>
                <th>분기</th>
                <th>금액</th>
                <th>납부일</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in feeRecords" :key="row.quarter">
                <td>{{ row.quarter }}</td>
                <td>{{ row.amount.toLocaleString() }} 원</td>
                <td>{{ formatDate(row.paid) }}</td>
                <td>납입</td>
              </tr>
            </tbody>
          </table>

          <!-- 편집 모드 (legal 전용) -->
          <template v-else>
            <table class="fee-table fee-table--edit">
              <thead>
                <tr>
                  <th>시작 년분</th>
                  <th>종료 년분</th>
                  <th>금액 (원)</th>
                  <th>납부일</th>
                  <th>상태</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, idx) in feeEditDraft" :key="idx">
                  <td>
                    <div class="fee-year-input-wrap">
                      <span class="fee-year-prefix">제</span>
                      <input class="fee-input fee-input--year" type="number" v-model.number="row.yearStart" min="1" placeholder="1" />
                      <span class="fee-year-suffix">년분</span>
                    </div>
                  </td>
                  <td>
                    <div class="fee-year-input-wrap">
                      <span class="fee-year-prefix">제</span>
                      <input class="fee-input fee-input--year" type="number" v-model.number="row.yearEnd" min="1" placeholder="3" />
                      <span class="fee-year-suffix">년분</span>
                    </div>
                  </td>
                  <td><input class="fee-input fee-input--num" type="number" v-model.number="row.amount" min="0" step="1000" /></td>
                  <td><input class="fee-input fee-input--date" type="date" v-model="row.paid" /></td>
                  <td><span class="fee-status-tag">납입</span></td>
                  <td>
                    <button class="btn-fee-row-del" @click="feeEditDraft.splice(idx, 1)" title="삭제">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                        <path d="M10 11v6"/><path d="M14 11v6"/>
                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                      </svg>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
            <button class="btn-fee-add" @click="feeEditDraft.push({ yearStart: 0, yearEnd: 0, amount: 0, paid: '' })">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              행 추가
            </button>
          </template>

        </section>

        <div class="section-divider"></div>

        <!-- ── 섹션 4: 헹정 상태 ── -->
        <section id="section-history" data-section="history" class="content-section">
          <div class="section-header">
            <h2 class="section-heading">행정 상태</h2>
          </div>
          <div class="patent-timeline">
            <div v-for="(ev, i) in patentHistory" :key="i" class="ptl-item">
              <div class="ptl-center">
                <div :class="['ptl-dot', `ptl-dot--${ev.variant}`]"></div>
                <div v-if="i < patentHistory.length - 1" class="ptl-line"></div>
              </div>
              <div class="ptl-right">
                <span :class="['ptl-badge', `ptl-badge--${ev.variant}`]">{{ ev.label }}</span>
                <span class="ptl-date">{{ formatDate(ev.date) }}</span>
              </div>
            </div>
          </div>
        </section>

        <div v-if="isOwnDept" class="section-divider"></div>

        <!-- ── 섹션 5: 평가이력 ── -->
        <section v-if="isOwnDept" id="section-eval" data-section="eval" class="content-section">
          <div class="section-header">
            <h2 class="section-heading">평가 이력</h2>
          </div>
          <div class="eval-history-list">
            <div v-for="(item, idx) in evalHistory" :key="idx" class="eval-history-item">
              <div class="eval-history-item__top">
                <div class="eval-history-item__left">
                  <span class="eval-history-item__date">{{ item.date }}</span>
                  <div :class="['eval-grade-badge', `eval-grade-badge--${item.grade.toLowerCase()}`]">{{ item.grade }}</div>
<span :class="['eval-decision-badge', item.decision === '유지' ? 'eval-decision-badge--keep' : 'eval-decision-badge--dispose']">{{ item.decision }}</span>
                </div>
                <button v-if="item.report" class="eval-report-btn" @click="openEvalReport(item.report)" type="button">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  보고서 보기
                </button>
              </div>
              <p class="eval-history-item__opinion">{{ item.opinion }}</p>
            </div>
          </div>
        </section>

        </div><!-- /sections-body -->

        <!-- ── 우측 사이드바 ── -->
        <aside class="detail-body__side">

          <template v-if="isOwnDept">

          <!-- 등급 카드 -->
          <div class="side-card side-card--grade">
            <p class="side-card__label">AI 종합 등급</p>
            <div class="side-grade-row">
              <div v-if="patent.grade" class="side-grade" :class="`side-grade--${patent.grade.toLowerCase()}`">
                {{ patent.grade }}
              </div>
              <div v-else class="side-grade side-grade--none">—</div>
              <div v-if="patent.grade" class="side-grade__total">
                <p class="side-grade__total-label">종합 점수</p>
                <p class="side-grade__total-value">{{ totalScore }}<span> / 100</span></p>
              </div>
            </div>
          </div>

          <!-- 의견 제출 카드 -->
          <div class="side-card">
            <h3 class="side-card__title">의견 제출</h3>

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

          </div><!-- /side opinion card -->

          </template><!-- /isOwnDept -->

          <!-- 섹션 내비게이션 (목차만 sticky로 따라다님) -->
          <nav class="side-nav">
            <p class="side-nav__label">목차</p>
            <ul class="side-nav__list">
              <li v-for="tab in tabs" :key="tab.key">
                <button
                  class="side-nav__item"
                  :class="{ 'side-nav__item--active': activeTab === tab.key }"
                  @click="scrollToSection(tab.key)"
                  type="button"
                >
                  {{ tab.label }}
                </button>
              </li>
            </ul>
          </nav>

        </aside><!-- /detail-body__side -->

        <!-- ── 평가 보고서 패널 (fixed overlay) ── -->
        <aside class="eval-report-panel" :class="{ open: evalReportOpen }">
          <div class="eval-report-shell">
            <header class="eval-report-header">
              <strong class="eval-report-title">{{ selectedEvalReport?.title }}</strong>
              <button class="icon-button" type="button" @click="closeEvalReport">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M6 6l12 12M18 6 6 18"/>
                </svg>
              </button>
            </header>

            <div class="eval-report-body" v-if="selectedEvalReport">

            <!-- 01 평가 요약 -->
            <div class="erp-section">
              <h3 class="rpt-part-title"><span class="rpt-part-num">01</span>평가 요약</h3>
              <div class="rpt-score-cards">
                <div class="rpt-score-card" style="--rpt-card-color:#111827">
                  <div class="rpt-score-card__label">종합</div>
                  <div class="rpt-score-card__value">{{ evalPanelTotal }}<span class="rpt-score-card__denom"> / 100</span></div>
                  <div class="rpt-score-card__bar"><div class="rpt-score-card__bar-fill" :style="{ width: evalPanelTotal + '%' }"></div></div>
                </div>
                <div class="rpt-score-card" style="--rpt-card-color:#1a6e3c">
                  <div class="rpt-score-card__label">기술성</div>
                  <div class="rpt-score-card__value">{{ selectedEvalReport.scores.tech }}<span class="rpt-score-card__denom"> / 100</span></div>
                  <div class="rpt-score-card__bar"><div class="rpt-score-card__bar-fill" :style="{ width: selectedEvalReport.scores.tech + '%' }"></div></div>
                </div>
                <div class="rpt-score-card" style="--rpt-card-color:#7a6a00">
                  <div class="rpt-score-card__label">권리성</div>
                  <div class="rpt-score-card__value">{{ selectedEvalReport.scores.rights }}<span class="rpt-score-card__denom"> / 100</span></div>
                  <div class="rpt-score-card__bar"><div class="rpt-score-card__bar-fill" :style="{ width: selectedEvalReport.scores.rights + '%' }"></div></div>
                </div>
                <div class="rpt-score-card" style="--rpt-card-color:#8b1a1a">
                  <div class="rpt-score-card__label">시장성 및 사업성</div>
                  <div class="rpt-score-card__value">{{ selectedEvalReport.scores.biz }}<span class="rpt-score-card__denom"> / 100</span></div>
                  <div class="rpt-score-card__bar"><div class="rpt-score-card__bar-fill" :style="{ width: selectedEvalReport.scores.biz + '%' }"></div></div>
                </div>
              </div>
              <div class="rpt-opinion-box">
                <p>{{ selectedEvalReport.comments.tech }}</p>
                <p>{{ selectedEvalReport.comments.rights }}</p>
                <p>{{ selectedEvalReport.comments.biz }}</p>
              </div>
            </div>

            <!-- 02 평가 기준별 상세 점수 -->
            <div class="erp-section">
              <h3 class="rpt-part-title"><span class="rpt-part-num">02</span>평가 기준별 상세 점수</h3>
              <div class="rpt-criteria-list">
                <div v-for="(block, bi) in selectedEvalReport.evalBlocks" :key="block.key" class="rpt-criteria-row">
                  <div class="rpt-criteria-score"
                    :style="bi === 0 ? '--rc-color:#1a6e3c' : bi === 1 ? '--rc-color:#7a6a00' : '--rc-color:#8b1a1a'">
                    <div class="rpt-criteria-score__label">{{ block.title }}</div>
                    <div class="rpt-criteria-score__value">{{ block.score }}<span>/100</span></div>
                    <div class="rpt-criteria-score__bar">
                      <div class="rpt-criteria-score__bar-fill" :style="{ width: block.score + '%' }"></div>
                    </div>
                  </div>
                  <p class="rpt-criteria-text">{{
                    bi === 0 ? selectedEvalReport.comments.tech
                    : bi === 1 ? selectedEvalReport.comments.rights
                    : selectedEvalReport.comments.biz
                  }}</p>
                </div>
              </div>
              <details class="rpt-appendix">
                <summary class="rpt-appendix__summary">
                  평가 항목 세부 내역
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="rpt-appendix__chevron"><path d="M6 9l6 6 6-6"/></svg>
                </summary>
                <div class="rpt-appendix__body">
                  <div v-for="block in selectedEvalReport.evalBlocks" :key="block.key" class="rpt-eval-block">
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
                </div>
              </details>
            </div>

            <!-- 03 사내 프로젝트 활용 현황 -->
            <div class="erp-section">
              <h3 class="rpt-part-title"><span class="rpt-part-num">03</span>사내 프로젝트 활용 현황</h3>
              <table class="rpt-info-table">
                <tbody>
                  <tr><th>사업화 여부</th><td>{{ selectedEvalReport.project.commercialized }}</td></tr>
                  <tr><th>적용 사업·서비스</th><td>{{ selectedEvalReport.project.service }}</td></tr>
                  <tr><th>사업 적용 이력</th><td>{{ selectedEvalReport.project.history }}</td></tr>
                  <tr><th>고객·파트너</th><td>{{ selectedEvalReport.project.customer }}</td></tr>
                  <tr><th>사업화 신호</th><td>{{ selectedEvalReport.project.signal }}</td></tr>
                </tbody>
              </table>
              <div class="rpt-project-card">
                <div class="rpt-project-card__name">요약 설명</div>
                <p class="rpt-project-card__desc" style="margin-bottom:0">{{ selectedEvalReport.project.summary }}</p>
              </div>
              <div class="rpt-project-card">
                <div class="rpt-project-card__name">근거 자료</div>
                <ol class="rpt-evidence-list">
                  <li v-for="(ev, i) in selectedEvalReport.project.evidence" :key="i">
                    <a class="rpt-evidence-link" :href="ev.url" target="_blank" rel="noopener">{{ ev.title }}</a>
                  </li>
                </ol>
              </div>
            </div>

            <!-- 04 유사 특허 분석 -->
            <div class="erp-section">
              <h3 class="rpt-part-title"><span class="rpt-part-num">04</span>유사 특허 분석</h3>
              <div class="rpt-stat-row">
                <div class="rpt-stat"><span class="rpt-stat-num" style="color:#2563eb">{{ selectedEvalReport.similarStats.total }}</span><span class="rpt-stat-label">분석 대상</span></div>
                <div class="rpt-stat"><span class="rpt-stat-num" style="color:#166534">{{ selectedEvalReport.similarStats.registered }}</span><span class="rpt-stat-label">등록/유지</span></div>
                <div class="rpt-stat"><span class="rpt-stat-num" style="color:#6b7280">{{ selectedEvalReport.similarStats.pending }}</span><span class="rpt-stat-label">공개/심사중</span></div>
                <div class="rpt-stat"><span class="rpt-stat-num" style="color:#374151">{{ selectedEvalReport.similarStats.rejectedExpired }}</span><span class="rpt-stat-label">거절/소멸</span></div>
                <div class="rpt-stat"><span class="rpt-stat-num" style="color:#854d0e">{{ selectedEvalReport.similarStats.avgCitations }}</span><span class="rpt-stat-label">평균 피인용수</span></div>
              </div>
              <div class="rpt-opinion-box">
                <p>{{ selectedEvalReport.similarSummary }}</p>
              </div>
              <div v-for="(s, si) in [...selectedEvalReport.similarPatents].sort((a,b) => b.similarityScore - a.similarityScore).slice(0, 3)" :key="s.id" class="rpt-similar-card">
                <div class="rpt-similar-card__top">
                  <div class="rpt-similar-card__info">
                    <div class="rpt-similar-card__name">#{{ si + 1 }} {{ s.title }}</div>
                    <div class="rpt-similar-card__meta">
                      <span>{{ s.applicant }}</span>
                      <span :class="['rpt-status-badge', s.status === '유지' ? 'rpt-status--keep' : s.status === '소멸' ? 'rpt-status--expired' : 'rpt-status--open']">{{ s.status }}</span>
                      <span>출원번호 {{ s.applicationNumber }}</span>
                      <span>피인용 {{ s.citations }}</span>
                    </div>
                  </div>
                  <span class="rpt-similar-score-badge">유사도 {{ s.similarityScore }}</span>
                </div>
                <p v-if="s.desc" class="rpt-similar-card__desc">{{ s.desc }}</p>
                <div v-if="s.detail" class="rpt-similar-card__detail">
                  <p v-for="(line, li) in s.detail.split('\n')" :key="li">{{ line }}</p>
                </div>
              </div>
              <div class="rpt-table-wrap rpt-table-wrap--similar">
                <table class="rpt-eval-table">
                  <thead>
                    <tr>
                      <th style="width:150px">출원번호</th>
                      <th>특허명</th>
                      <th style="width:140px">출원인</th>
                      <th style="width:80px">출원연도</th>
                      <th style="width:80px">유사도</th>
                      <th style="width:80px">피인용수</th>
                      <th style="width:70px">상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="s in [...selectedEvalReport.similarPatents].sort((a,b) => b.similarityScore - a.similarityScore)" :key="s.id">
                      <td><span class="mono text-muted-sm">{{ s.applicationNumber }}</span></td>
                      <td class="rpt-item-name">{{ s.title }}</td>
                      <td><span class="similar-applicant">{{ s.applicant }}</span></td>
                      <td class="rpt-method">{{ s.year }}</td>
                      <td class="rpt-method" style="font-weight:600">{{ s.similarityScore }}</td>
                      <td class="rpt-method">{{ s.citations }}</td>
                      <td>
                        <span :class="['rpt-status-badge', s.status === '유지' ? 'rpt-status--keep' : s.status === '소멸' ? 'rpt-status--expired' : 'rpt-status--open']">{{ s.status }}</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- 05 추가 확인 필요 사항 -->
            <div class="erp-section">
              <h3 class="rpt-part-title"><span class="rpt-part-num">05</span>추가 확인 필요 사항</h3>
              <p class="rpt-subsection-desc">점수가 낮은 평가 항목에서 자동 추출했습니다. 사업부 자체 자료와의 교차 검토를 권장합니다.</p>
              <div v-for="item in selectedEvalReport.confirmItems" :key="item.title" class="rpt-confirm-item">
                <div class="rpt-confirm-item-title">{{ item.title }}<span>{{ item.meta }}</span></div>
                <div class="rpt-confirm-item-desc">{{ item.desc }}</div>
              </div>
            </div>

            <!-- 06 참고문헌 -->
            <div class="erp-section">
              <h3 class="rpt-part-title"><span class="rpt-part-num">06</span>참고문헌</h3>
              <ol class="rpt-ref-list">
                <li v-for="(ref, i) in selectedEvalReport.refs" :key="i">
                  <span class="rpt-ref-num">[{{ i + 1 }}]</span>
                  <span>{{ ref }}</span>
                </li>
              </ol>
            </div>

            <!-- 07 등록료 납부 내역 -->
            <div class="erp-section">
              <h3 class="rpt-part-title"><span class="rpt-part-num">07</span>등록료 납부 내역</h3>
              <table class="fee-table">
                <thead>
                  <tr><th>분기</th><th>금액</th><th>납부일</th><th>상태</th></tr>
                </thead>
                <tbody>
                  <tr v-for="row in selectedEvalReport.feeRecords" :key="row.quarter">
                    <td>{{ row.quarter }}</td>
                    <td>{{ row.amount.toLocaleString() }} 원</td>
                    <td>{{ formatDate(row.paid) }}</td>
                    <td>납입</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- 08 행정 상태 -->
            <div class="erp-section">
              <h3 class="rpt-part-title"><span class="rpt-part-num">08</span>행정 상태</h3>
              <div class="patent-timeline">
                <div v-for="(ev, i) in selectedEvalReport.history" :key="i" class="ptl-item">
                  <div class="ptl-center">
                    <div :class="['ptl-dot', `ptl-dot--${ev.variant}`]"></div>
                    <div v-if="i < selectedEvalReport.history.length - 1" class="ptl-line"></div>
                  </div>
                  <div class="ptl-right">
                    <span :class="['ptl-badge', `ptl-badge--${ev.variant}`]">{{ ev.label }}</span>
                    <span class="ptl-date">{{ formatDate(ev.date) }}</span>
                  </div>
                </div>
              </div>
            </div>

            </div><!-- /eval-report-body -->
          </div><!-- /eval-report-shell -->
        </aside><!-- /eval-report-panel -->

      </div><!-- /detail-columns -->

    </template>

    <!-- ── 챗봇 FAB ── -->
    <button v-if="showChatbot && !chatbotOpen" class="chat-fab" type="button" aria-label="AI 챗봇에게 질문하기" @click="toggleChatbot">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    </button>

    <!-- ── 챗봇 패널 ── -->
    <aside v-if="showChatbot" class="chat-panel" :class="{ open: chatbotOpen, expanded: chatbotExpanded }">
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
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { patentChatHistories, nextChatId, type ChatMessage } from '@/composables/usePatentChat'
import { patentsApi, type PatentDetail } from '@/api/patents'
import { reviewsApi } from '@/api/reviews'
import type { ReviewResponse } from '@/api/reviews'
import { reportsApi } from '@/api/reports'
import { businessReviewsApi } from '@/api/businessReviews'
import type { BusinessReviewDetailResponse } from '@/api/businessReviews'

type ChatRole = 'assistant' | 'user'
import PatentStatusBadge from '@/components/patent/PatentStatusBadge.vue'
import {
  MOCK_SIMILAR_PATENTS, MOCK_RELATED_PROJECTS, MOCK_PROJECT_EVIDENCE,
  COUNTRY_LABEL, TECH_FIELD_CLAIMS, AI_REPORT_COMMENTS, AI_GRADE_SCORES, DEPT_MAP,
  type MockSimilarPatent,
} from '@/mocks/data'

const props = defineProps<{ patentId: number }>()
const auth  = useAuthStore()
const route = useRoute()

const isLegal    = computed(() => auth.isLegal || auth.isAdmin)
const isBusiness = computed(() => auth.isBusiness)
const showChatbot = computed(() => route.name === 'ReviewPatentDetail')
const myDept     = computed(() => DEPT_MAP[auth.user?.departmentId ?? 0] ?? null)

// ── 특허 데이터 (API) ─────────────────────────────────
const isLoading = ref(false)
const error = ref<string | null>(null)
const patentData = ref<PatentDetail | null>(null)
const reviewData = ref<ReviewResponse | null>(null)
const businessReviewData = ref<BusinessReviewDetailResponse | null>(null)
const evalHistory = ref<EvalHistoryItem[]>([])

function mapStatus(status?: string): 'REGISTERED' | 'EXPIRED' | 'ABANDONED' {
  if (!status) return 'REGISTERED'
  if (status === 'REGISTERED') return 'REGISTERED'
  if (status === 'EXPIRED' || status === 'LAPSED') return 'EXPIRED'
  return 'ABANDONED'
}

function scoreToGrade(score?: number): 'S' | 'A' | 'B' | 'C' | undefined {
  if (score == null) return undefined
  if (score >= 90) return 'S'
  if (score >= 75) return 'A'
  if (score >= 60) return 'B'
  return 'C'
}

const patent = computed(() => {
  const d = patentData.value
  if (!d) return null
  return {
    id: d.id,
    title: d.title,
    applicationNumber: d.applicationNumber,
    registrationNumber: d.registrationNumber ?? '',
    registrationDate: d.registrationDate,
    publicationNumber: d.publicationNumber,
    publicationDate: d.publicationDate,
    announcementNumber: d.announcementNumber,
    announcementDate: d.announcementDate,
    applicationDate: d.applicationDate ?? '',
    expiryDate: d.expiryDate,
    ipcCodes: d.ipcCodes ?? [],
    cpcCodes: d.cpcCodes ?? [],
    applicant: d.applicant ?? '',
    inventor: d.inventor ?? '',
    examinationClaimCount: d.examinationClaimCount,
    status: mapStatus(d.latestLegalStatus),
    techField: d.techField ?? '',
    dept: d.currentDepartmentName ?? '',
    grade: scoreToGrade(d.latestReportScore),
    tags: d.keywords ?? [],
    summary: d.summary ?? '',
  }
})

async function fetchPatent() {
  isLoading.value = true
  error.value = null
  try {
    patentData.value = await patentsApi.getPatent(props.patentId)
  } catch (e) {
    console.error('특허 상세 조회 실패:', e)
    error.value = '특허 정보를 불러오지 못했습니다.'
  } finally {
    isLoading.value = false
  }
}

async function fetchReviewData() {
  try {
    if (isBusiness.value) {
      businessReviewData.value = await businessReviewsApi.getBusinessReview(props.patentId)
    } else {
      const res = await reviewsApi.getReviewTargets({ patentId: props.patentId, size: 1 })
      reviewData.value = res.items[0] ?? null
    }
  } catch (e) {
    console.error('재평가 데이터 조회 실패:', e)
  }
}

async function fetchEvalHistory() {
  try {
    const data = await reportsApi.getReportHistory(props.patentId)
    evalHistory.value = data.map(r => ({
      date: r.evaluatedAt ? formatDate(r.evaluatedAt) : '—',
      grade: ((r.valueGrade ?? 'C') as EvalHistoryItem['grade']),
      score: r.totalScore ?? 0,
      decision: (r.opinion === 'KEEP' ? '유지' : r.opinion === 'DISPOSE' ? '포기' : '—') as '유지' | '포기',
      opinion: r.comment ?? '',
      report: null,
    }))
  } catch (e) {
    console.error('평가이력 조회 실패:', e)
    evalHistory.value = []
  }
}

const accessDenied = computed(() => {
  if (!patent.value) return false
  return false
})

const isOwnDept = computed(() => {
  if (!patent.value) return false
  if (isLegal.value) return true
  if (isBusiness.value) return patent.value.dept === myDept.value
  return true
})

// ── 국가 표시 ────────────────────────────────────────
const patentCountry = computed(() => {
  if (!patent.value) return ''
  const code = patent.value.applicationNumber.split('-')[0]
  return COUNTRY_LABEL[code] ?? code
})

const FEE_SCHEDULES: Record<string, { quarter: string; amount: number; paid: string }[]> = {
  REGISTERED: [
    { quarter: '제  1 -  3 년분', amount:  630000, paid: '2012-09-20' },
    { quarter: '제  4 -  6 년분', amount: 1110000, paid: '2015-08-24' },
    { quarter: '제  7 -  9 년분', amount: 2010000, paid: '2018-08-22' },
    { quarter: '제 10 - 12 년분', amount: 3195000, paid: '2021-08-25' },
    { quarter: '제 13 - 15 년분', amount: 3177000, paid: '2024-06-04' },
  ],
  EXPIRED: [
    { quarter: '제  1 -  3 년분', amount:  630000, paid: '2012-09-20' },
    { quarter: '제  4 -  6 년분', amount: 1110000, paid: '2015-08-24' },
  ],
}

type FeeRecord     = { quarter: string; amount: number; paid: string }
type FeeEditRow    = { yearStart: number; yearEnd: number; amount: number; paid: string }

function formatQuarter(start: number, end: number): string {
  const fmt = (n: number) => n < 10 ? ` ${n}` : `${n}`
  return `제 ${fmt(start)} - ${fmt(end)} 년분`
}

function parseQuarter(q: string): { yearStart: number; yearEnd: number } {
  const m = q.match(/(\d+)[^0-9]+(\d+)/)
  return m ? { yearStart: Number(m[1]), yearEnd: Number(m[2]) } : { yearStart: 0, yearEnd: 0 }
}

const feeRecords = computed(() => {
  const status = patent.value?.status ?? ''
  return customFeeRecords.value ?? FEE_SCHEDULES[status] ?? FEE_SCHEDULES['REGISTERED']
})

const customFeeRecords = ref<FeeRecord[] | null>(null)
const feeEditMode      = ref(false)
const feeEditDraft     = ref<FeeEditRow[]>([])

function startFeeEdit() {
  feeEditDraft.value = feeRecords.value.map(r => ({
    ...parseQuarter(r.quarter),
    amount: r.amount,
    paid: r.paid,
  }))
  feeEditMode.value = true
}

function cancelFeeEdit() {
  feeEditMode.value = false
  feeEditDraft.value = []
}

function saveFeeEdit() {
  customFeeRecords.value = feeEditDraft.value
    .filter(r => r.yearStart > 0)
    .map(r => ({
      quarter: formatQuarter(r.yearStart, r.yearEnd),
      amount: r.amount,
      paid: r.paid,
    }))
  feeEditMode.value = false
  feeEditDraft.value = []
}

type HistoryVariant = 'file' | 'pub' | 'reg' | 'rejected' | 'invalid' | 'expired' | 'withdraw' | 'abandon'
const patentHistory = computed(() => {
  const p = patent.value
  if (!p) return []
  type Event = { date: string; label: string; desc: string; variant: HistoryVariant }
  const events: Event[] = []

  events.push({ date: p.applicationDate, label: '출원', desc: `${p.title} 특허 출원`, variant: 'file' })

  const pubDate = addMonths(p.applicationDate, 6)
  events.push({ date: pubDate, label: '공개', desc: '신청한 기술 내용이 세상에 공개된 상태', variant: 'pub' })

  const regDate = addMonths(p.applicationDate, 18)

  if (p.status === 'REGISTERED') {
    events.push({ date: regDate, label: '등록', desc: '심사를 통과하여 권리가 정식으로 확정된 상태', variant: 'reg' })
  } else if (p.status === 'EXPIRED') {
    events.push({ date: regDate, label: '등록', desc: '심사를 통과하여 권리가 정식으로 확정된 상태', variant: 'reg' })
    const expDate = addMonths(regDate, 36)
    events.push({ date: expDate, label: '소멸', desc: '권리 기간 소멸 또는 연차료 미납으로 권리가 사라진 상태', variant: 'expired' })
  } else if (p.status === 'ABANDONED') {
    const withdrawDate = addMonths(p.applicationDate, 12)
    events.push({ date: withdrawDate, label: '취하', desc: '신청자 스스로 신청을 없던 일로 돌린 상태', variant: 'withdraw' })
  }

  return events.sort((a, b) => a.date.localeCompare(b.date))
})

const patentBiblio = computed(() => {
  const p = patent.value
  if (!p) return null
  const isRegistered = p.status === 'REGISTERED'
  const isExpired = p.status === 'EXPIRED'
  const numSeed = String(p.id * 123456789 % 10000000).padStart(7, '0')
  const year = new Date(p.applicationDate).getFullYear()
  const regDate = addMonths(p.applicationDate, 18)
  const pubDate = addMonths(p.applicationDate, 6)
  const appDateFmt = formatDate(p.applicationDate)
  return {
    ipcCodes: p.ipcCodes,
    cpcCodes: p.cpcCodes,
    applicationNum: p.applicationNumber,
    applicationDate: appDateFmt,
    applicant: p.applicant || 'SKIPA 주식회사',
    registrationNum: p.registrationNumber || (isRegistered ? `10118${numSeed.slice(0, 4)}90000` : ''),
    registrationDate: p.registrationDate ? formatDate(p.registrationDate) : (isRegistered ? formatDate(regDate) : ''),
    pubNum: p.publicationNumber || `1020${year}${numSeed}`,
    pubDate: p.publicationDate ? formatDate(p.publicationDate) : formatDate(pubDate),
    annNum: p.announcementNumber || (isRegistered ? `(${formatDate(regDate)})` : ''),
    annDate: p.announcementDate ? formatDate(p.announcementDate) : (isRegistered ? formatDate(regDate) : ''),
    legalStatus: isRegistered ? '등록' : isExpired ? '소멸' : '심사중',
    examStatus: isRegistered ? '등록결정(일반)' : isExpired ? '소멸' : '심사중',
    classification: '국내출원/신규',
    examinationRequested: `Y(${appDateFmt})`,
    claimsCount: p.examinationClaimCount ?? (TECH_FIELD_CLAIMS[p.techField] ?? []).length,
  }
})

// ── 상세 보조 데이터 ─────────────────────────────────
const detailExtras = computed(() => {
  const p = patent.value
  if (!p) return { inventor: '', ipcCode: '', registrationDate: '—', summary: '', claims: [] }
  const regDate = p.registrationDate ?? addMonths(p.applicationDate, 18)
  return {
    inventor: p.inventor || '—',
    ipcCode: (p.ipcCodes ?? []).join(', ') || '—',
    registrationDate: p.status === 'REGISTERED' ? formatDate(regDate) : '—',
    summary: p.summary || '',
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

const totalScore = computed(() => {
  const { tech, rights, biz } = aiScores.value
  return Math.round((tech + rights + biz) / 3)
})

// ── 재평가 레코드 ────────────────────────────────────
const REVIEW_STATUS_MAP: Record<string, 'unassigned' | 'requested' | 'overdue' | 'done'> = {
  SCHEDULED: 'unassigned',
  PENDING:   'requested',
  OVERDUE:   'overdue',
  SUBMITTED: 'done',
}

const reevalRecord = computed(() => {
  const r = reviewData.value
  if (!r) return null
  return {
    patentId: r.patentId,
    reviewStatus: REVIEW_STATUS_MAP[r.status] ?? 'unassigned',
    decision: r.opinion ?? null,
    decidedAt: r.submittedAt ?? null,
    dueDate: r.dueDate ?? null,
    isOverdue: r.status === 'OVERDUE',
  }
})

const opinionAssigned = computed(() => {
  if (isBusiness.value) {
    const r = businessReviewData.value
    return r && ['PENDING', 'OVERDUE', 'SUBMITTED'].includes(r.status)
  }
  const r = reevalRecord.value
  return r && (r.reviewStatus === 'requested' || r.reviewStatus === 'overdue' || r.reviewStatus === 'done')
})

// ── 소멸일 강조 ──────────────────────────────────────
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

const ALL_TABS = [
  { key: 'info',    label: '기본 정보' },
  { key: 'report',  label: 'AI 평가 보고서' },
  { key: 'fee',     label: '등록료 납부 내역' },
  { key: 'history', label: '행정 상태' },
  { key: 'eval',    label: '평가 이력' },
]
const RESTRICTED_TABS = new Set(['report', 'eval'])

const tabs = computed(() =>
  isOwnDept.value ? ALL_TABS : ALL_TABS.filter(t => !RESTRICTED_TABS.has(t.key))
)

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
      for (const tab of tabs.value) {
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

  for (const tab of tabs.value) {
    const el = document.getElementById(`section-${tab.key}`)
    if (el) observer.observe(el)
  }
}

// ── 챗봇 ─────────────────────────────────────────────
const chatbotOpen     = ref(false)
const chatbotExpanded = ref(false)
const chatInput       = ref('')
const chatViewport    = ref<HTMLElement | null>(null)
const pendingTimers   = new Set<number>()

if (!patentChatHistories[props.patentId]) {
  patentChatHistories[props.patentId] = [
    { id: nextChatId(), role: 'assistant', text: `${patent.value?.title ?? '이 특허'}에 대해 궁금한 점을 질문해주세요.` },
  ]
}
const chatMessages = computed(() => patentChatHistories[props.patentId])

const chatPanelWidth = computed(() =>
  chatbotOpen.value ? (chatbotExpanded.value ? '100vw' : '480px') : '0px'
)

function scrollChatToBottom() {
  if (chatViewport.value) chatViewport.value.scrollTop = chatViewport.value.scrollHeight
}

function nextMessageId() { return nextChatId() }

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

  const history = patentChatHistories[props.patentId]
  history.push({ id: nextMessageId(), role: 'user', text })
  chatInput.value = ''

  const typingId = nextMessageId()
  history.push({ id: typingId, role: 'assistant', text: '', typing: true })
  await nextTick()
  scrollChatToBottom()

  const timerId = window.setTimeout(() => {
    const idx = history.findIndex((m) => m.id === typingId)
    if (idx !== -1) {
      history.splice(idx, 1, {
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
  await Promise.all([fetchPatent(), fetchReviewData(), fetchEvalHistory()])
  await nextTick()

  if (patent.value && isBusiness.value && businessReviewData.value?.opinion) {
    const brd = businessReviewData.value
    submittedOpinion.value = {
      decision: brd.opinion === 'MAINTAIN' ? 'KEEP' : 'DISPOSE',
      comment: brd.comment ?? '',
      submittedAt: brd.submittedAt ?? '',
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
  try {
    const apiOpinion = opinionForm.decision === 'KEEP' ? 'MAINTAIN' : 'ABANDON'
    const result = await businessReviewsApi.submitOpinion(
      props.patentId,
      apiOpinion,
      opinionForm.comment || undefined,
    )
    submittedOpinion.value = {
      decision: opinionForm.decision as 'KEEP' | 'DISPOSE',
      comment: opinionForm.comment,
      submittedAt: result.submittedAt ?? new Date().toISOString().slice(0, 10),
    }
    if (businessReviewData.value) {
      businessReviewData.value = {
        ...businessReviewData.value,
        opinion: result.opinion,
        submittedAt: result.submittedAt,
        status: result.status,
      }
    }
  } catch (e) {
    console.error('의견 제출 오류:', e)
  } finally {
    opinionSubmitting.value = false
  }
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

// ── 평가이력 ─────────────────────────────────────────
interface EvalFeeRecord   { quarter: string; amount: number; paid: string }
interface EvalHistoryEvent { date: string; label: string; variant: HistoryVariant }
interface EvalProjectInfo {
  commercialized: string; service: string; history: string
  customer: string; signal: string; summary: string
  evidence: { title: string; url: string }[]
}
interface EvalSimilarStats {
  total: number; registered: number; pending: number; rejectedExpired: number; avgCitations: number
}
interface EvalReport {
  title: string
  grade: 'S' | 'A' | 'B' | 'C'
  scores: { tech: number; rights: number; biz: number }
  comments: { tech: string; rights: string; biz: string }
  evalBlocks: RptBlock[]
  project: EvalProjectInfo
  similarPatents: MockSimilarPatent[]
  similarStats: EvalSimilarStats
  similarSummary: string
  confirmItems: { title: string; meta: string; desc: string }[]
  refs: string[]
  feeRecords: EvalFeeRecord[]
  history: EvalHistoryEvent[]
}
interface EvalHistoryItem {
  date: string
  grade: 'S' | 'A' | 'B' | 'C'
  score: number
  decision: '유지' | '포기' | '—'
  opinion: string
  report: EvalReport | null
}

const evalReportOpen = ref(false)
const selectedEvalReport = ref<EvalReport | null>(null)

const evalPanelTotal = computed(() => {
  if (!selectedEvalReport.value) return 0
  const { tech, rights, biz } = selectedEvalReport.value.scores
  return Math.round((tech + rights + biz) / 3)
})

function openEvalReport(report: EvalReport) {
  selectedEvalReport.value = report
  evalReportOpen.value = true
}

function closeEvalReport() {
  evalReportOpen.value = false
}
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

.btn-pdf-download {
  display: flex; align-items: center; gap: 7px; padding: 8px 16px;
  background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 9px;
  font-size: 13px; font-weight: 600; font-family: inherit;
  color: #475569; cursor: pointer; white-space: nowrap; flex-shrink: 0;
  transition: background .12s, border-color .12s;
}
.btn-pdf-download:hover { background: #f1f5f9; border-color: #cbd5e1; }

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

/* ── 두 컬럼 레이아웃 ────────────────────────────── */
.detail-columns {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 16px;
  align-items: stretch;
  margin-top: 4px;
  margin-bottom: 20px;
}
@media (max-width: 900px) { .detail-columns { grid-template-columns: 1fr; } }

/* ── 우측 패널 ───────────────────────────────────── */
.detail-body__side {
  display: flex;
  flex-direction: column;
  gap: 14px;
  align-items: stretch;
}

.side-nav {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 16px 18px;
  position: sticky;
  top: 112px;
}
.side-nav__label {
  font-size: 10.5px; font-weight: 700; color: #94a3b8;
  text-transform: uppercase; letter-spacing: 0.07em;
  margin: 0 0 10px;
}
.side-nav__list {
  list-style: none; margin: 0; padding: 0;
  display: flex; flex-direction: column; gap: 2px;
}
.side-nav__item {
  width: 100%;
  text-align: left;
  padding: 7px 10px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
  background: none;
  border: none;
  cursor: pointer;
  transition: background 0.12s, color 0.12s;
}
.side-nav__item:hover { background: #f1f5f9; color: #0f172a; }
.side-nav__item--active { background: #f1f5f9; color: #4f46e5; font-weight: 600; }

.side-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.side-card__label {
  font-size: 10.5px; font-weight: 700; color: #94a3b8;
  text-transform: uppercase; letter-spacing: 0.07em; margin: 0;
}

.side-card__title {
  font-size: 14px; font-weight: 700; color: #0f172a;
  margin: 0; padding-bottom: 12px;
  border-bottom: 1px solid #f1f5f9;
}

.side-grade-row { display: flex; align-items: center; gap: 16px; }

.side-grade {
  width: 64px; height: 64px; flex-shrink: 0;
  border-radius: 14px;
  font-size: 32px; font-weight: 900; line-height: 1;
  display: flex; align-items: center; justify-content: center;
}
.side-grade--s { background: linear-gradient(135deg, #dcfce7, #bbf7d0); color: #14532d; }
.side-grade--a { background: linear-gradient(135deg, #dbeafe, #bfdbfe); color: #1e3a8a; }
.side-grade--b { background: linear-gradient(135deg, #fff7ed, #fed7aa); color: #7c2d12; }
.side-grade--c { background: linear-gradient(135deg, #f1f5f9, #e2e8f0); color: #475569; }
.side-grade--none { background: #f8fafc; color: #94a3b8; }

.side-grade__total { display: flex; flex-direction: column; gap: 3px; }
.side-grade__total-label {
  font-size: 11px; font-weight: 600; color: #94a3b8;
  text-transform: uppercase; letter-spacing: 0.06em; margin: 0;
}
.side-grade__total-value {
  font-size: 26px; font-weight: 800; color: #0f172a;
  letter-spacing: -0.02em; line-height: 1; margin: 0;
}
.side-grade__total-value span { font-size: 14px; font-weight: 500; color: #94a3b8; }

/* ── 섹션 본문 ───────────────────────────────────── */
.sections-body {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  overflow: hidden;
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

.biblio-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13.5px;
}
.biblio-table th {
  width: 160px;
  text-align: left;
  padding: 10px 14px;
  background: #f8fafc;
  color: #64748b;
  font-weight: 500;
  font-size: 13px;
  border: 1px solid #e2e8f0;
  vertical-align: middle;
  white-space: nowrap;
}
.biblio-table td {
  padding: 10px 14px;
  color: #0f172a;
  border: 1px solid #e2e8f0;
  vertical-align: middle;
  line-height: 1.6;
}
.code-tag-row { display: flex; flex-wrap: wrap; gap: 6px; }
.code-tag {
  padding: 3px 9px;
  background: #f1f5f9; color: #475569;
  border: 1px solid #e2e8f0; border-radius: 5px;
  font-family: 'JetBrains Mono', 'Consolas', monospace;
  font-size: 12px; font-weight: 500;
}
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

.fee-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13.5px;
}
.fee-table thead th {
  text-align: center;
  padding: 10px 14px;
  background: #f8fafc;
  color: #64748b;
  font-weight: 500;
  font-size: 13px;
  border: 1px solid #e2e8f0;
}
.fee-table tbody td {
  text-align: center;
  padding: 10px 14px;
  color: #0f172a;
  border: 1px solid #e2e8f0;
}
.fee-table tbody tr:hover td { background: #f8fafc; }

/* ── 등록료 편집 ── */
.fee-edit-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-fee-edit {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  background: var(--color-surface-muted);
  border: 1px solid var(--color-border);
  border-radius: 7px;
  font-size: 12.5px;
  font-weight: 600;
  font-family: inherit;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: background .13s;
}
.btn-fee-edit:hover { background: var(--color-surface-hover); }

.btn-fee-cancel {
  padding: 5px 14px;
  background: none;
  border: 1px solid var(--color-border);
  border-radius: 7px;
  font-size: 12.5px;
  font-weight: 600;
  font-family: inherit;
  color: var(--color-text-muted);
  cursor: pointer;
}

.btn-fee-save {
  padding: 5px 14px;
  background: var(--color-primary-dark);
  border: none;
  border-radius: 7px;
  font-size: 12.5px;
  font-weight: 600;
  font-family: inherit;
  color: #fff;
  cursor: pointer;
  transition: background .13s;
}
.btn-fee-save:hover { background: var(--color-primary-darker); }

.fee-table--edit tbody td { padding: 6px 8px; }

.fee-input {
  width: 100%;
  padding: 6px 10px;
  border: 1.5px solid var(--color-border);
  border-radius: 6px;
  font-size: 13px;
  font-family: inherit;
  color: var(--color-text);
  background: var(--color-surface);
  box-sizing: border-box;
  outline: none;
  transition: border-color .13s;
}
.fee-input:focus { border-color: var(--color-primary); }
.fee-input--num  { text-align: right; min-width: 110px; }
.fee-input--date { min-width: 130px; }
.fee-input--year { width: 56px; text-align: center; padding: 6px 6px; }

.fee-year-input-wrap {
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}
.fee-year-prefix, .fee-year-suffix {
  font-size: 13px;
  color: var(--color-text-secondary);
  flex-shrink: 0;
}

.fee-status-tag {
  display: inline-block;
  padding: 3px 10px;
  background: var(--color-success-bg);
  color: var(--color-success-dark);
  border-radius: 5px;
  font-size: 12px;
  font-weight: 600;
}

.btn-fee-row-del {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-subtle);
  display: flex;
  align-items: center;
  padding: 4px;
  border-radius: 5px;
  transition: color .13s, background .13s;
}
.btn-fee-row-del:hover { color: var(--color-danger); background: var(--color-danger-bg); }

.btn-fee-add {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 10px;
  padding: 7px 16px;
  background: var(--color-primary-bg);
  border: 1px dashed var(--color-primary-border);
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  color: var(--color-primary-dark);
  cursor: pointer;
  transition: background .13s;
  width: 100%;
  justify-content: center;
}
.btn-fee-add:hover { background: var(--color-primary-border); }

/* ── 행정 상태 타임라인 ── */
.patent-timeline { display: flex; flex-direction: column; }
.ptl-item { display: flex; gap: 0; min-height: 40px; }
.ptl-date { font-size: 12px; color: #94a3b8; white-space: nowrap; align-self: center; }
.ptl-center {
  flex-shrink: 0; width: 20px;
  display: flex; flex-direction: column; align-items: center;
}
.ptl-dot {
  width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0;
  border: 2px solid currentColor; background: #fff; margin-top: 3px;
}
.ptl-dot--file     { color: #6366f1; }
.ptl-dot--pub      { color: #6b7280; }
.ptl-dot--reg      { color: #16a34a; background: #16a34a; }
.ptl-dot--rejected { color: #dc2626; background: #dc2626; }
.ptl-dot--invalid  { color: #ea580c; background: #ea580c; }
.ptl-dot--expired  { color: #374151; background: #374151; }
.ptl-dot--withdraw { color: #ca8a04; background: #ca8a04; }
.ptl-dot--abandon  { color: #e11d48; background: #e11d48; }
.ptl-line {
  flex: 1; width: 2px; background: #e2e8f0; margin: 4px 0;
}
.ptl-right {
  padding: 0 0 20px 16px;
  display: flex; flex-direction: row; align-items: center; gap: 10px;
}
.ptl-badge {
  display: inline-block; font-size: 11px; font-weight: 700;
  padding: 2px 8px; border-radius: 20px; width: fit-content;
}
.ptl-badge--file     { background: #ede9fe; color: #4f46e5; }
.ptl-badge--pub      { background: #f3f4f6; color: #4b5563; }
.ptl-badge--reg      { background: #dcfce7; color: #15803d; }
.ptl-badge--rejected { background: #fee2e2; color: #b91c1c; }
.ptl-badge--invalid  { background: #ffedd5; color: #c2410c; }
.ptl-badge--expired  { background: #e5e7eb; color: #374151; }
.ptl-badge--withdraw { background: #fef9c3; color: #854d0e; }
.ptl-badge--abandon  { background: #ffe4e6; color: #be123c; }
.ptl-desc { margin: 0; font-size: 13px; color: #334155; line-height: 1.5; }


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
  margin-bottom: 20px;
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
.rpt-table-wrap--similar { margin-top: 24px; position: relative; }

.rpt-eval-table {
  width: 100%; border-collapse: collapse;
  table-layout: auto;
  border: 1px solid #e2e8f0;
  background: #fff; min-width: 700px;
}
.rpt-eval-table thead tr { background: #f8fafc; }
.rpt-eval-table th {
  padding: 9px 14px; text-align: left;
  font-size: 11px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.07em; color: #94a3b8;
  border-bottom: 1px solid #e2e8f0;
  white-space: nowrap;
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

.rpt-opinion-cats { display: flex; flex-direction: column; gap: 0; }
.rpt-opinion-cat {
  padding: 14px 18px;
  border-left: 3px solid #e2e8f0;
  margin-bottom: 10px;
  background: #f8fafc;
  border-radius: 0 10px 10px 0;
}
.rpt-opinion-cat:last-child { margin-bottom: 0; }
.rpt-opinion-cat:nth-child(1) { border-left-color: #6366f1; }
.rpt-opinion-cat:nth-child(2) { border-left-color: #0ea5e9; }
.rpt-opinion-cat:nth-child(3) { border-left-color: #10b981; }
.rpt-opinion-cat__label {
  font-size: 11px; font-weight: 700; letter-spacing: 0.05em;
  margin: 0 0 6px; color: #64748b; text-transform: uppercase;
}
.rpt-opinion-cat:nth-child(1) .rpt-opinion-cat__label { color: #6366f1; }
.rpt-opinion-cat:nth-child(2) .rpt-opinion-cat__label { color: #0ea5e9; }
.rpt-opinion-cat:nth-child(3) .rpt-opinion-cat__label { color: #10b981; }
.rpt-opinion-cat__text { margin: 0; font-size: 13px; line-height: 1.85; color: #374151; }

.rpt-appendix {
  margin-top: 24px;
  border: 1px solid #e2e8f0; border-radius: 12px;
  overflow: hidden;
}
.rpt-appendix__summary {
  list-style: none;
  display: flex; align-items: center; justify-content: space-between;
  padding: 13px 18px;
  font-size: 12.5px; font-weight: 600; color: #64748b;
  background: #f8fafc; cursor: pointer;
  user-select: none;
}
.rpt-appendix__summary::-webkit-details-marker { display: none; }
.rpt-appendix__summary:hover { background: #f1f5f9; color: #0f172a; }
.rpt-appendix__chevron { transition: transform 0.2s; flex-shrink: 0; }
details[open] .rpt-appendix__chevron { transform: rotate(180deg); }
.rpt-appendix__body {
  padding: 20px 20px 4px;
  border-top: 1px solid #e2e8f0;
}

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

/* ── rpt-part: numbered section wrapper ── */
.rpt-part {
  margin-bottom: 48px;
}
.rpt-part--last { margin-bottom: 0; }
.rpt-part-title {
  display: flex; align-items: center; gap: 12px;
  font-size: 16px; font-weight: 700; color: #0f172a;
  margin: 0 0 20px;
}
.rpt-part-num {
  display: inline-flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; border-radius: 6px;
  background: #0f172a; color: #fff;
  font-size: 12px; font-weight: 700; font-family: 'JetBrains Mono', monospace;
  flex-shrink: 0;
}

/* ── 01 평가 요약 ── */
.rpt-opinion-box {
  background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px;
  padding: 18px 20px; margin-top: 20px;
  display: flex; flex-direction: column; gap: 12px;
}
.rpt-opinion-box p { margin: 0; font-size: 13px; color: #475569; line-height: 1.7; }

/* ── 02 평가 기준별 상세 점수 ── */
.rpt-criteria-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
.rpt-criteria-row {
  display: flex; gap: 20px; align-items: center;
  background: #fff; border: 1px solid #e2e8f0; border-radius: 12px;
  padding: 16px 20px;
}
.rpt-criteria-score {
  flex-shrink: 0; width: 130px;
  border-right: 1px solid #e2e8f0; padding-right: 20px;
}
.rpt-criteria-score__label {
  font-size: 12px; font-weight: 600; color: var(--rc-color); margin-bottom: 4px;
}
.rpt-criteria-score__value {
  font-size: 24px; font-weight: 800; color: #0f172a; line-height: 1.1; margin-bottom: 8px;
}
.rpt-criteria-score__value span { font-size: 13px; font-weight: 400; color: #94a3b8; margin-left: 2px; }
.rpt-criteria-score__bar {
  height: 5px; background: #e2e8f0; border-radius: 99px; overflow: hidden;
}
.rpt-criteria-score__bar-fill {
  height: 100%; background: var(--rc-color); border-radius: 99px;
}
.rpt-criteria-text {
  margin: 0; font-size: 13px; color: #475569; line-height: 1.75; flex: 1;
}


/* ── 03 사내 프로젝트 ── */
.rpt-info-table {
  width: 100%; border-collapse: collapse; margin-bottom: 20px;
  font-size: 13px;
}
.rpt-info-table th {
  width: 140px; padding: 10px 14px;
  background: #f8fafc; color: #64748b;
  border: 1px solid #e2e8f0; font-weight: 600; text-align: left;
  white-space: nowrap;
}
.rpt-info-table td {
  padding: 10px 14px; border: 1px solid #e2e8f0; color: #0f172a;
}
.rpt-project-card {
  background: #fff; border: 1px solid #e2e8f0; border-radius: 10px;
  padding: 16px 18px; margin-bottom: 12px;
}
.rpt-project-card:last-of-type { margin-bottom: 0; }
.rpt-project-card__name { font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 10px; }
.rpt-project-card__desc { font-size: 13px; color: #475569; line-height: 1.75; margin: 0; }
.rpt-evidence-list {
  margin: 0; padding-left: 18px;
  display: flex; flex-direction: column; gap: 6px;
}
.rpt-evidence-list li { font-size: 13px; color: #475569; }
.rpt-evidence-link {
  color: #2563eb; text-decoration: none;
}
.rpt-evidence-link:hover { text-decoration: underline; }

/* ── 04 유사 특허 분석 ── */
.rpt-stat-row {
  display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 16px;
}
.rpt-stat {
  flex: 1; min-width: 90px;
  background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px;
  padding: 14px 16px; display: flex; flex-direction: column; gap: 4px;
}
.rpt-stat-num { font-size: 22px; font-weight: 800; color: #0f172a; }
.rpt-stat-label { font-size: 11.5px; color: #94a3b8; }
.rpt-similar-card {
  background: #fff; border: 1px solid #e2e8f0; border-radius: 10px;
  padding: 16px 18px; margin-bottom: 12px;
}
.rpt-opinion-box + .rpt-similar-card { margin-top: 20px; }
.rpt-similar-card__top {
  display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;
  margin-bottom: 10px;
}
.rpt-similar-card__name { font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 6px; }
.rpt-similar-card__meta { display: flex; gap: 10px; font-size: 12px; color: #64748b; flex-wrap: wrap; align-items: center; }
.rpt-similar-card__desc { margin: 0 0 10px; font-size: 13px; color: #374151; line-height: 1.75; }
.rpt-similar-card__detail {
  padding-top: 10px; border-top: 1px solid #e2e8f0;
  font-size: 12px; color: #64748b; line-height: 1.7;
  display: flex; flex-direction: column; gap: 4px;
}
.rpt-similar-card__detail p { margin: 0; }
.rpt-similar-score-badge {
  font-size: 12px; font-weight: 700; color: #dc2626;
  background: #fef2f2; padding: 4px 12px; border-radius: 20px;
  border: 1px solid #fecaca; flex-shrink: 0; white-space: nowrap;
}
.rpt-status-badge {
  font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 20px;
  white-space: nowrap;
}
.rpt-status--keep    { background: #dcfce7; color: #166534; }
.rpt-status--expired { background: #f1f5f9; color: #475569; }
.rpt-status--open    { background: #dbeafe; color: #1e40af; }

/* ── 평가이력 ────────────────────────────────────── */
.eval-history-list {
  display: flex; flex-direction: column; gap: 12px;
}
.eval-history-item {
  border: 1px solid #e2e8f0; border-radius: 12px;
  padding: 18px 20px; display: flex; flex-direction: column; gap: 10px;
}
.eval-history-item__top {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
}
.eval-history-item__left {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
}
.eval-history-item__date {
  font-size: 12px; color: #94a3b8; white-space: nowrap;
}
.eval-grade-badge {
  display: inline-flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; border-radius: 8px;
  font-size: 13px; font-weight: 800; flex-shrink: 0;
}
.eval-grade-badge--s { background: linear-gradient(135deg,#dcfce7,#bbf7d0); color: #14532d; }
.eval-grade-badge--a { background: linear-gradient(135deg,#dbeafe,#bfdbfe); color: #1e3a8a; }
.eval-grade-badge--b { background: linear-gradient(135deg,#fff7ed,#fed7aa); color: #7c2d12; }
.eval-grade-badge--c { background: linear-gradient(135deg,#f1f5f9,#e2e8f0); color: #475569; }
.eval-history-item__score {
  font-size: 15px; font-weight: 700; color: #0f172a;
}
.eval-score-denom { font-size: 12px; font-weight: 400; color: #94a3b8; }
.eval-decision-badge {
  font-size: 11px; font-weight: 700; padding: 2px 9px; border-radius: 20px;
}
.eval-decision-badge--keep    { background: #dcfce7; color: #166534; }
.eval-decision-badge--dispose { background: #fee2e2; color: #b91c1c; }
.eval-history-item__opinion {
  margin: 0; font-size: 13px; color: #475569; line-height: 1.55;
}
.eval-report-btn {
  display: inline-flex; align-items: center; gap: 5px; flex-shrink: 0;
  padding: 6px 12px; border-radius: 8px; border: 1px solid #e2e8f0;
  background: #f8fafc; font-size: 12px; font-weight: 600; color: #374151;
  cursor: pointer; transition: background 0.13s, border-color 0.13s;
  font-family: inherit;
}
.eval-report-btn:hover { background: #f1f5f9; border-color: #cbd5e1; }

/* ── 평가 보고서 오버레이 패널 ──────────────────── */
.eval-report-panel {
  position: fixed;
  right: 0;
  top: 0;
  width: 50vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-left: 1px solid #e2e8f0;
  box-shadow: -8px 0 40px rgba(15,23,42,0.12);
  z-index: 100;
  transform: translateX(100%);
  transition: transform 0.3s ease;
  overflow: hidden;
}
.eval-report-panel.open {
  transform: translateX(0);
}
.eval-report-shell {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}
.eval-report-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
  background: #fff;
  z-index: 1;
}
.eval-report-header .icon-button {
  color: #64748b;
  background: transparent;
}
.eval-report-header .icon-button:hover { background: #f1f5f9; color: #0f172a; }
.eval-report-title {
  font-size: 13px; font-weight: 700; color: #0f172a;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.eval-report-body {
  flex: 1; overflow-y: auto; padding: 0;
}
.erp-section {
  padding: 16px 16px 14px;
  border-bottom: 1px solid #f1f5f9;
}
.erp-section:last-child { border-bottom: none; }
.erp-section-title {
  font-size: 13px; font-weight: 700; color: #0f172a;
  margin: 0 0 16px; text-transform: uppercase; letter-spacing: 0.04em;
}
</style>
