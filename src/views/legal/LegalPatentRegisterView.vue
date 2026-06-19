<template>
  <div class="manage-page">

    <!-- 페이지 헤더 -->
    <div class="page-header">
      <div>
        <h2 class="page-header__title">특허 관리</h2>
        <p class="page-header__desc">특허를 등록하거나 기존 특허를 수정·삭제합니다.</p>
      </div>
      <button class="btn-new-register" @click="openRegisterModal">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        신규 등록
      </button>
    </div>

    <!-- 검색 필터 카드 -->
      <div class="filter-card">
        <div class="search-bar">
          <span class="search-bar__icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </span>
          <input
            v-model="searchQuery"
            type="text"
            class="search-bar__input"
            placeholder="특허명, 출원번호로 검색"
          />
          <button v-if="searchQuery" class="search-bar__clear" @click="searchQuery = ''">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- 결과 건수 -->
      <div class="result-bar">
        <p class="result-count">
          <span class="result-count__num">{{ totalPatentCount.toLocaleString() }}</span>건
        </p>
      </div>

      <div class="list-card">
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
            <div v-for="p in pagedPatents" :key="p.id" class="list-row list-row--clickable" @click="startEdit(p)">
              <div class="list-row__cell list-row__title">{{ p.title }}</div>
              <div class="list-row__cell">{{ p.applicationNumber }}</div>
              <div class="list-row__cell">
                <span v-if="p.techField" class="field-tag">{{ p.techField }}</span>
                <span v-else class="text-muted">—</span>
              </div>
              <div class="list-row__cell">
                <span class="status-badge" :class="statusClass(p.latestLegalStatus ?? '')">{{ statusLabel(p.latestLegalStatus ?? '') }}</span>
              </div>
              <div class="list-row__cell">{{ p.applicationDate }}</div>
              <div class="list-row__cell list-row__actions">
                <button class="btn-action btn-action--delete" @click.stop="confirmDelete(p)">
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

          <!-- 페이지네이션 -->
          <div v-if="totalPages > 1" class="pagination">
            <button class="page-btn" :disabled="currentPage === 1" @click="currentPage--">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <button
              v-for="p in totalPages"
              :key="p"
              class="page-btn"
              :class="{ 'page-btn--active': p === currentPage }"
              @click="currentPage = p"
            >{{ p }}</button>
            <button class="page-btn" :disabled="currentPage === totalPages" @click="currentPage++">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        </template>
      </div>

    <!-- ── 신규 등록 / 수정 모달 ── -->
    <Teleport to="body">
      <Transition name="reg-modal">
        <div v-if="showRegisterModal" class="reg-overlay" @click.self="closeRegisterModal">
          <div class="reg-panel">

            <!-- 모달 헤더 - 뷰 모드 -->
            <div v-if="editMode && isViewMode" class="reg-panel__head reg-panel__head--view">
              <h2 class="view-patent-title">{{ editTargetTitle }}</h2>
              <div class="head-btn-group">
                <button class="btn-edit-toggle" type="button" @click="isViewMode = false">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  수정
                </button>
                <button class="reg-panel__close" @click="closeRegisterModal">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            </div>

            <!-- 모달 헤더 - 수정/신규 모드 -->
            <div v-else class="reg-panel__head">
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

            <!-- 모달 바디 - 뷰 모드 -->
            <div v-if="editMode && isViewMode" class="reg-panel__body">
              <div class="form-section">
                <div class="form-section__title">기본 정보</div>
                <div class="form-grid">
                  <label class="form-field full">
                    <span class="form-label">특허 제목</span>
                    <div class="form-input form-input--view">{{ form.title || '-' }}</div>
                  </label>
                  <label class="form-field">
                    <span class="form-label">관리번호</span>
                    <div class="form-input form-input--view">{{ form.managementNumber || '-' }}</div>
                  </label>
                  <label class="form-field">
                    <span class="form-label">발명자</span>
                    <div class="form-input form-input--view">{{ form.inventors || '-' }}</div>
                  </label>
                  <label class="form-field">
                    <span class="form-label">출원인명</span>
                    <div class="form-input form-input--view">{{ form.applicant || '-' }}</div>
                  </label>
                </div>
              </div>
              <div class="form-section">
                <div class="form-section__title">분류 및 제품</div>
                <div class="form-grid">
                  <label class="form-field">
                    <span class="form-label">관련사업 분야</span>
                    <div class="form-input form-input--view">{{ form.bizField || '-' }}</div>
                  </label>
                  <label class="form-field">
                    <span class="form-label">관련기술 분야</span>
                    <div class="form-input form-input--view">{{ form.techField || '-' }}</div>
                  </label>
                  <label class="form-field full">
                    <span class="form-label">관련제품</span>
                    <div class="form-input form-input--view">{{ form.relatedProducts || '-' }}</div>
                  </label>
                </div>
              </div>
              <div class="form-section">
                <div class="form-section__title">출원 및 등록</div>
                <div class="form-grid">
                  <label class="form-field">
                    <span class="form-label">출원국</span>
                    <div class="form-input form-input--view">{{ form.country || '-' }}</div>
                  </label>
                  <label class="form-field">
                    <span class="form-label">상태</span>
                    <div class="form-input form-input--view">{{ form.status || '-' }}</div>
                  </label>
                  <label class="form-field">
                    <span class="form-label">공동출원여부</span>
                    <div class="form-input form-input--view">{{ form.coApplicant }}</div>
                  </label>
                  <label class="form-field">
                    <span class="form-label">공동출원인명</span>
                    <div class="form-input form-input--view">{{ form.coApplicantName || '-' }}</div>
                  </label>
                  <label class="form-field">
                    <span class="form-label">출원일</span>
                    <div class="form-input form-input--view">{{ form.applicationDate || '-' }}</div>
                  </label>
                  <label class="form-field">
                    <span class="form-label">등록일</span>
                    <div class="form-input form-input--view">{{ form.registrationDate || '-' }}</div>
                  </label>
                  <label class="form-field">
                    <span class="form-label">공개일</span>
                    <div class="form-input form-input--view">{{ form.publicationDate || '-' }}</div>
                  </label>
                  <label class="form-field">
                    <span class="form-label">공고일</span>
                    <div class="form-input form-input--view">{{ form.announcementDate || '-' }}</div>
                  </label>
                  <label class="form-field">
                    <span class="form-label">출원번호</span>
                    <div class="form-input form-input--view">{{ form.applicationNumber || '-' }}</div>
                  </label>
                  <label class="form-field">
                    <span class="form-label">등록번호</span>
                    <div class="form-input form-input--view">{{ form.registrationNumber || '-' }}</div>
                  </label>
                  <label class="form-field">
                    <span class="form-label">공개번호</span>
                    <div class="form-input form-input--view">{{ form.publicationNumber || '-' }}</div>
                  </label>
                  <label class="form-field">
                    <span class="form-label">공고번호</span>
                    <div class="form-input form-input--view">{{ form.announcementNumber || '-' }}</div>
                  </label>
                  <label class="form-field">
                    <span class="form-label">IPC 코드</span>
                    <div class="form-input form-input--view">{{ form.ipc.join(', ') || '-' }}</div>
                  </label>
                  <label class="form-field">
                    <span class="form-label">CPC 코드</span>
                    <div class="form-input form-input--view">{{ form.cpc.join(', ') || '-' }}</div>
                  </label>
                  <label class="form-field">
                    <span class="form-label">심사청구항수</span>
                    <div class="form-input form-input--view">{{ form.examinationClaimCount || '-' }}</div>
                  </label>
                  <label class="form-field">
                    <span class="form-label">피인용 수</span>
                    <div class="form-input form-input--view">{{ form.citationCount || '-' }}</div>
                  </label>
                  <label class="form-field">
                    <span class="form-label">예상 소멸일</span>
                    <div class="form-input form-input--view">{{ form.expiryDate || '-' }}</div>
                  </label>
                </div>
              </div>
              <div class="form-section">
                <div class="form-section__title">내용 요약</div>
                <div class="form-grid">
                  <label class="form-field full">
                    <span class="form-label">키워드</span>
                    <div class="form-input form-input--view">{{ form.keywords.join(', ') || '-' }}</div>
                  </label>
                  <label class="form-field full">
                    <span class="form-label">발명의 요약</span>
                    <div class="form-textarea form-input--view">{{ form.summary || '-' }}</div>
                  </label>
                </div>
              </div>
              <div class="form-section">
                <div class="form-section__title">행정 상태</div>
                <div v-if="adminHistory.length > 0" class="ah-stack">
                  <div v-for="entry in adminHistory" :key="entry.type + entry.date" class="ah-row ah-row--readonly">
                    <span :class="['ah-type-select', `ah-type-select--${entry.type}`, 'ah-type-readonly']">
                      {{ AH_LABELS[entry.type] ?? entry.type }}
                    </span>
                    <span class="ah-date-readonly">{{ entry.date || '-' }}</span>
                  </div>
                </div>
                <p v-else class="ah-empty">등록된 행정 상태가 없습니다.</p>
              </div>
            </div>

            <!-- 모달 바디 - 수정/신규 모드 -->
            <div v-else class="reg-panel__body">

              <!-- PDF 업로드 (신규 등록 시만) -->
              <div v-if="!editMode" class="upload-panel">
                <label class="upload-drop" :class="{ 'upload-drop--loading': isExtracting }" for="legal-pdf">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  <span>{{ isExtracting ? 'AI 분석 중...' : uploadedFile ? uploadedFile.name : '특허 PDF 업로드 · 클릭하거나 파일을 여기에 끌어다 놓으세요' }}</span>
                </label>
                <input id="legal-pdf" class="visually-hidden" type="file" accept=".pdf" ref="fileInputRef" @change="handleFileSelect" :disabled="isExtracting" />
                <button class="btn-extract" :disabled="isExtracting" @click="fileInputRef?.click()">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <polyline points="8 17 12 21 16 17"/><line x1="12" y1="12" x2="12" y2="21"/>
                    <path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"/>
                  </svg>
                  {{ isExtracting ? '분석 중...' : 'PDF에서 항목 추출' }}
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
                <template v-if="!editMode">
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
                </template>
                <template v-else>
                  <div v-if="adminHistory.length > 0" class="ah-stack">
                    <div v-for="entry in adminHistory" :key="entry.type + entry.date" class="ah-row ah-row--readonly">
                      <span :class="['ah-type-select', `ah-type-select--${entry.type}`, 'ah-type-readonly']">
                        {{ { file:'출원', pub:'공개', reg:'등록', rejected:'거절', invalid:'무효', expired:'소멸', withdraw:'취하', abandon:'포기' }[entry.type] ?? entry.type }}
                      </span>
                      <span class="ah-date-readonly">{{ entry.date || '-' }}</span>
                    </div>
                  </div>
                  <p v-else class="ah-empty">등록된 행정 상태가 없습니다.</p>
                </template>
              </div>

            </div>

            <!-- 모달 푸터 - 뷰 모드 -->
            <div v-if="editMode && isViewMode" class="reg-panel__foot">
              <button class="btn-reset" type="button" @click="closeRegisterModal">닫기</button>
            </div>

            <!-- 모달 푸터 - 수정/신규 모드 -->
            <div v-else class="reg-panel__foot">
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
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { patentsApi, type PatentCreateRequest, type PatentListItem } from '@/api/patents'
import { patentHistoryApi } from '@/api/patentHistory'
import TagInput from '@/components/ui/TagInput.vue'
const router = useRouter()

const patentItems = ref<PatentListItem[]>([])
const totalPatentCount = ref(0)

async function fetchPatents() {
  try {
    const res = await patentsApi.getPatents({ size: 200 })
    patentItems.value = res.items
    totalPatentCount.value = res.totalItems
  } catch (err) {
    console.error('특허 목록 조회 오류:', err)
  }
}

onMounted(() => { fetchPatents() })

// ── 등록 모달 ────────────────────────────────────────
const AH_LABELS: Record<string, string> = {
  file: '출원', pub: '공개', reg: '등록', rejected: '거절',
  invalid: '무효', expired: '소멸', withdraw: '취하', abandon: '포기',
}

const adminHistory = ref<{ type: string; date: string }[]>([])

const showRegisterModal = ref(false)
const isViewMode = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)
const uploadedFile = ref<File | null>(null)
const editMode = ref(false)
const editTargetId = ref<number | null>(null)
const editTargetTitle = ref('')

const form = reactive({
  title: '', finalTitle: '', managementNumber: '', inventors: '', applicant: '',
  bizField: '', techField: '', relatedProducts: '', country: '한국',
  status: '등록', coApplicant: '아니오', coApplicantName: '',
  applicationDate: '', registrationDate: '', publicationDate: '', announcementDate: '',
  applicationNumber: '', registrationNumber: '', publicationNumber: '', announcementNumber: '',
  ipc: [] as string[], cpc: [] as string[], examinationClaimCount: '', citationCount: '',
  expiryDate: '', keywords: [] as string[], summary: '',
})

function clearForm() {
  Object.assign(form, {
    title: '', finalTitle: '', managementNumber: '', inventors: '', applicant: '',
    bizField: '', techField: '', relatedProducts: '', country: '한국',
    status: '등록', coApplicant: '아니오', coApplicantName: '',
    applicationDate: '', registrationDate: '', publicationDate: '', announcementDate: '',
    applicationNumber: '', registrationNumber: '', publicationNumber: '', announcementNumber: '',
    ipc: [], cpc: [], examinationClaimCount: '', citationCount: '',
    expiryDate: '', keywords: [] as string[], summary: '',
  })
  uploadedFile.value = null
  adminHistory.value = []
  editMode.value = false
  editTargetId.value = null
  editTargetTitle.value = ''
  currentExtractJobId.value = null
}

const isExtracting = ref(false)
const isSubmitting = ref(false)
const currentExtractJobId = ref<number | null>(null)

function fillFormFromResult(r: Partial<PatentCreateRequest>) {
  form.title = ''; form.finalTitle = ''; form.applicationNumber = ''
  form.registrationNumber = ''; form.managementNumber = ''; form.applicant = ''
  form.inventors = ''; form.applicationDate = ''; form.registrationDate = ''
  form.ipc = []; form.cpc = []; form.expiryDate = ''; form.bizField = ''
  form.techField = ''; form.relatedProducts = ''; form.keywords = []; form.summary = ''

  if (r.title)              { form.title = r.title; form.finalTitle = r.title }
  if (r.applicationNumber)  form.applicationNumber = r.applicationNumber
  if (r.registrationNumber) form.registrationNumber = r.registrationNumber ?? ''
  if (r.managementNumber)   form.managementNumber   = r.managementNumber ?? ''
  if (r.applicant)          form.applicant = r.applicant ?? ''
  if (r.inventor)           form.inventors = r.inventor ?? ''
  if (r.applicationDate)    form.applicationDate = r.applicationDate ?? ''
  if (r.registrationDate)   form.registrationDate = r.registrationDate ?? ''
  if (r.ipcCodes)           form.ipc = r.ipcCodes
  if (r.cpcCodes)           form.cpc = r.cpcCodes ?? []
  if (r.expiryDate)         form.expiryDate = r.expiryDate ?? ''
  if (r.businessField)      form.bizField = r.businessField ?? ''
  if (r.techField)          form.techField = r.techField ?? ''
  if (r.relatedProducts)    form.relatedProducts = r.relatedProducts.join(', ')
  if (r.keywords)           form.keywords = r.keywords
  if (r.summary)            form.summary = r.summary ?? ''
}

async function handleExtract() {
  if (!uploadedFile.value) return
  isExtracting.value = true
  currentExtractJobId.value = null
  try {
    const { extractJobId, uploadUrl } = await patentsApi.createExtractUploadUrl()
    await fetch(uploadUrl, { method: 'PUT', body: uploadedFile.value, headers: { 'Content-Type': 'application/pdf' } })
    await patentsApi.completeExtractUpload(extractJobId)
    let attempts = 0
    while (attempts < 30) {
      await new Promise(r => setTimeout(r, 2000))
      const status = await patentsApi.getExtractJobStatus(extractJobId)
      if (status.status === 'COMPLETED') break
      if (status.status === 'FAILED') throw new Error('PDF 분석에 실패했습니다. 다시 시도해주세요.')
      attempts++
    }
    const result = await patentsApi.getExtractJobResult(extractJobId)
    if (result.result) {
      fillFormFromResult(result.result)
      currentExtractJobId.value = extractJobId
    }
  } catch (err: any) {
    alert(err?.message ?? 'PDF 추출 중 오류가 발생했습니다.')
  } finally {
    isExtracting.value = false
  }
}

function openRegisterModal() {
  clearForm()
  showRegisterModal.value = true
}

function closeRegisterModal() {
  showRegisterModal.value = false
  isViewMode.value = false
  clearForm()
}

function handleFileSelect(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) {
    uploadedFile.value = file
    handleExtract()
  }
}

async function handleSave() {
  if (isSubmitting.value) return
  isSubmitting.value = true
  try {
    if (editMode.value && editTargetId.value !== null) {
      await patentsApi.updatePatent(editTargetId.value, {
        title: form.title,
        applicationNumber: form.applicationNumber,
        applicationDate: form.applicationDate || undefined,
        techField: form.techField || undefined,
        inventor: form.inventors || undefined,
        applicant: form.applicant || undefined,
        registrationNumber: form.registrationNumber || undefined,
        ipcCodes: form.ipc?.length ? form.ipc : undefined,
        cpcCodes: form.cpc?.length ? form.cpc : undefined,
        expiryDate: form.expiryDate || undefined,
        businessField: form.bizField || undefined,
        keywords: form.keywords?.length ? form.keywords : undefined,
        summary: form.summary || undefined,
        filingCountry: form.country || undefined,
      })
      await fetchPatents()
      closeRegisterModal()
    } else {
      await patentsApi.createPatent({
        title: form.finalTitle || form.title,
        applicationNumber: form.applicationNumber,
        registrationNumber: form.registrationNumber || undefined,
        publicationNumber: form.publicationNumber || undefined,
        announcementNumber: form.announcementNumber || undefined,
        managementNumber: form.managementNumber || undefined,
        applicant: form.applicant || undefined,
        inventor: form.inventors || undefined,
        applicationDate: form.applicationDate || undefined,
        registrationDate: form.registrationDate || undefined,
        publicationDate: form.publicationDate || undefined,
        announcementDate: form.announcementDate || undefined,
        ipcCodes: form.ipc ? form.ipc.map(s => s.trim()).filter(Boolean) : undefined,
        cpcCodes: form.cpc ? form.cpc.map(s => s.trim()).filter(Boolean) : undefined,
        expiryDate: form.expiryDate || undefined,
        examinationClaimCount: form.examinationClaimCount ? Number(form.examinationClaimCount) : undefined,
        citationCount: form.citationCount ? Number(form.citationCount) : undefined,
        businessField: form.bizField || undefined,
        techField: form.techField || undefined,
        relatedProducts: form.relatedProducts
          ? form.relatedProducts.split(',').map(s => s.trim()).filter(Boolean)
          : undefined,
        summary: form.summary || undefined,
        filingCountry: form.country || undefined,
        isJointApplication: form.coApplicant === '예',
        jointApplicant: form.coApplicant === '예' ? (form.coApplicantName || undefined) : undefined,
        keywords: form.keywords?.length ? form.keywords : undefined,
        extractJobId: currentExtractJobId.value ?? undefined,
      })
      await fetchPatents()
      closeRegisterModal()
    }
  } catch (err) {
    console.error('특허 저장 오류:', err)
  } finally {
    isSubmitting.value = false
  }
}

const searchQuery = ref('')
const currentPage = ref(1)
const PAGE_SIZE = 50

const filteredPatents = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return patentItems.value
  return patentItems.value.filter(p =>
    p.title.toLowerCase().includes(q) ||
    p.applicationNumber.toLowerCase().includes(q)
  )
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredPatents.value.length / PAGE_SIZE)))
const pagedPatents = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filteredPatents.value.slice(start, start + PAGE_SIZE)
})

watch(searchQuery, () => { currentPage.value = 1 })

function statusLabel(s: string) {
  return ({ REGISTERED: '등록', EXPIRED: '소멸', ABANDONED: '포기', PUBLISHED: '공개', PENDING: '출원', WITHDRAWN: '취하', REJECTED: '거절' } as Record<string, string>)[s] ?? s
}
function statusClass(s: string) {
  return ({ REGISTERED: 'status--registered', EXPIRED: 'status--expired', ABANDONED: 'status--abandoned', PUBLISHED: 'status--published', PENDING: 'status--pending', WITHDRAWN: 'status--withdrawn', REJECTED: 'status--rejected' } as Record<string, string>)[s] ?? ''
}

const LEGAL_TYPE_MAP: Record<string, string> = {
  APPLIED: 'file', PUBLISHED: 'pub', REGISTERED: 'reg',
  REJECTED: 'rejected', INVALID: 'invalid', EXPIRED: 'expired', WITHDRAWN: 'withdraw', ABANDONED: 'abandon',
  '출원': 'file', '공개': 'pub', '등록': 'reg',
  '거절': 'rejected', '무효': 'invalid', '소멸': 'expired', '취하': 'withdraw', '포기': 'abandon',
}

async function startEdit(p: PatentListItem) {
  editMode.value = true
  isViewMode.value = true
  editTargetId.value = p.id
  editTargetTitle.value = p.title
  adminHistory.value = []
  Object.assign(form, {
    title: p.title,
    applicationNumber: p.applicationNumber,
    applicationDate: p.applicationDate ?? '',
    techField: p.techField ?? '',
    status: statusLabel(p.latestLegalStatus ?? ''),
    managementNumber: '', inventors: p.inventor ? p.inventor.replace(/\s*;\s*/g, ', ') : '',
    applicant: p.applicant ?? '',
    bizField: p.businessField ?? '', relatedProducts: '', country: (p.filingCountry === 'KR' ? '한국' : p.filingCountry) ?? '한국',
    coApplicant: '아니오', coApplicantName: '',
    registrationDate: '', publicationDate: '', announcementDate: '',
    registrationNumber: p.registrationNumber ?? '', publicationNumber: '', announcementNumber: '',
    ipc: p.ipcCodes ?? [], cpc: p.cpcCodes ?? [],
    examinationClaimCount: p.examinationClaimCount?.toString() ?? '',
    citationCount: p.citationCount?.toString() ?? '',
    expiryDate: p.expiryDate ?? '', keywords: p.keywords ?? [], summary: p.summary ?? '',
  })
  showRegisterModal.value = true

  try {
    const [detail, history] = await Promise.all([
      patentsApi.getPatent(p.id),
      patentHistoryApi.getLegalStatusHistory(p.id),
    ])
    Object.assign(form, {
      managementNumber: detail.managementNumber ?? '',
      inventors: detail.inventor ? detail.inventor.replace(/\s*;\s*/g, ', ') : '',
      applicant: detail.applicant ?? '',
      relatedProducts: detail.relatedProducts?.join(', ') ?? '',
      coApplicant: detail.isJointApplication ? '예' : '아니오',
      coApplicantName: detail.jointApplicant ?? '',
      registrationDate: detail.registrationDate ?? '',
      publicationDate: detail.publicationDate ?? '',
      announcementDate: detail.announcementDate ?? '',
      registrationNumber: detail.registrationNumber ?? '',
      publicationNumber: detail.publicationNumber ?? '',
      announcementNumber: detail.announcementNumber ?? '',
      examinationClaimCount: detail.examinationClaimCount?.toString() ?? '',
      citationCount: detail.citationCount?.toString() ?? '',
    })
    const items: any[] = Array.isArray(history) ? history : (history as any)?.items ?? []
    adminHistory.value = items.map(h => ({
      type: LEGAL_TYPE_MAP[h.status] ?? h.status,
      date: h.changedAt ? h.changedAt.slice(0, 10) : '',
    }))
  } catch (err) {
    console.error('특허 상세 조회 오류:', err)
  }
}

// ── 삭제 ────────────────────────────────────────────
const deleteTarget = ref<PatentListItem | null>(null)

function confirmDelete(p: PatentListItem) { deleteTarget.value = p }

async function handleDelete() {
  if (!deleteTarget.value) return
  try {
    await patentsApi.deletePatent(deleteTarget.value.id)
    await fetchPatents()
  } catch (err) {
    console.error('특허 삭제 오류:', err)
  }
  deleteTarget.value = null
}
</script>

<style scoped>
.manage-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  font-family: 'Pretendard', sans-serif;
}
.btn-action--edit { background: var(--color-primary-bg); border: 1px solid var(--color-primary-border); color: var(--color-primary-dark); }
.btn-action--edit:hover { background: var(--color-primary-border); }
.btn-action--delete { background: var(--color-danger-bg); border: 1px solid #fecaca; color: var(--color-danger); }
.btn-action--delete:hover { background: #fecaca; }

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

.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 20px; }
.form-field { display: flex; flex-direction: column; gap: 5px; }
.form-field.full { grid-column: 1 / -1; }
.form-label { font-size: 12px; font-weight: 600; color: var(--color-text-secondary); }
.required { color: var(--color-danger); }

/* ── 필터 카드 ────────────────────────────────────── */
.filter-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.search-bar {
  display: flex;
  align-items: center;
  border: 1.5px solid var(--color-border);
  border-radius: 10px;
  overflow: hidden;
  background: var(--color-surface-soft);
  transition: border-color 0.15s, box-shadow 0.15s;
}
.search-bar:focus-within {
  border-color: var(--color-primary);
  background: var(--color-surface);
  box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
}
.search-bar__icon {
  padding: 0 14px;
  color: var(--color-text-subtle);
  display: flex;
  flex-shrink: 0;
}
.search-bar__input {
  flex: 1;
  padding: 11px 0;
  border: none;
  background: transparent;
  font-size: 14px;
  font-family: inherit;
  color: var(--color-text);
  outline: none;
}
.search-bar__input::placeholder { color: var(--c-slate-300); }
.search-bar__clear {
  padding: 0 10px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-subtle);
  display: flex;
  transition: color 0.13s;
}
.search-bar__clear:hover { color: var(--c-slate-600); }

/* ── 결과 바 ────────────────────────────────────── */
.result-bar { padding: 0 2px; }
.result-count { font-size: 13.5px; color: var(--color-text-muted); margin: 0; }
.result-count__num { font-size: 15px; font-weight: 700; color: var(--color-text); margin-right: 2px; }

.list-empty {
  padding: 56px 24px;
  display: flex; flex-direction: column; align-items: center; gap: 10px;
  text-align: center; color: var(--color-text-subtle);
}
.list-empty p { font-size: 13.5px; margin: 0; }

.list-header {
  display: grid;
  grid-template-columns: 2.5fr 1.3fr 1.4fr 80px 110px 80px;
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
  grid-template-columns: 2.5fr 1.3fr 1.4fr 80px 110px 80px;
  gap: 16px; align-items: center;
  padding: 13px 20px;
  border-bottom: 1px solid var(--color-surface-hover);
  transition: background .12s;
}
.list-row:last-child { border-bottom: none; }
.list-row:hover { background: var(--color-surface-hover); }
.list-row--clickable { cursor: pointer; }

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
.status--published  { background: #ede9fe; color: #5b21b6; }
.status--pending    { background: #fef9c3; color: #854d0e; }
.status--withdrawn  { background: #f1f5f9; color: #475569; }
.status--rejected   { background: #fee2e2; color: #b91c1c; }

.result-count__page { font-size: 12px; color: var(--color-text-muted); margin-left: 8px; }

.pagination {
  display: flex; align-items: center; justify-content: center; gap: 4px;
  padding: 16px 0 4px;
}
.page-btn {
  min-width: 32px; height: 32px; padding: 0 8px;
  display: flex; align-items: center; justify-content: center;
  border: 1px solid var(--color-border); border-radius: 7px;
  background: var(--color-surface); color: var(--color-text-secondary);
  font-size: 13px; font-family: inherit; cursor: pointer;
  transition: background .12s, color .12s;
}
.page-btn:hover:not(:disabled) { background: var(--color-surface-muted); color: var(--color-text); }
.page-btn--active { background: var(--color-primary); color: #fff; border-color: var(--color-primary); font-weight: 700; }
.page-btn:disabled { opacity: 0.35; cursor: default; }

.btn-action {
  display: flex; align-items: center; gap: 5px; padding: 5px 11px;
  border-radius: 7px; font-size: 12.5px; font-weight: 600; font-family: inherit;
  cursor: pointer; transition: background .12s, color .12s; white-space: nowrap;
}
.btn-action--edit { background: var(--color-primary-bg); border: 1px solid var(--color-primary-border); color: var(--color-primary-dark); }
.btn-action--edit:hover { background: var(--color-primary-border); }
.btn-action--delete { background: var(--color-danger-bg); border: 1px solid #fecaca; color: var(--color-danger); }
.btn-action--delete:hover { background: #fecaca; }


/* ── 뷰 모드 ── */
.reg-panel__head--view { align-items: center; }
.view-patent-title {
  font-size: 20px; font-weight: 700; color: var(--color-text);
  margin: 0; line-height: 1.4; flex: 1; min-width: 0;
}
.head-btn-group { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.btn-edit-toggle {
  display: flex; align-items: center; gap: 6px; padding: 7px 16px;
  background: linear-gradient(135deg, var(--color-primary-dark), var(--color-primary));
  color: #fff; border: none; border-radius: 8px;
  font-size: 13px; font-weight: 600; font-family: inherit;
  cursor: pointer; transition: opacity .15s;
}
.btn-edit-toggle:hover { opacity: .88; }

.view-section { display: flex; flex-direction: column; gap: 10px; }
.view-section__title {
  font-size: 12px; font-weight: 700; color: var(--color-text-muted);
  text-transform: uppercase; letter-spacing: .06em;
  padding-bottom: 8px; border-bottom: 1px solid var(--color-surface-muted);
}
.view-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 20px; }
.view-row { display: flex; flex-direction: column; gap: 3px; }
.view-row.full { grid-column: 1 / -1; }
.view-label { font-size: 11.5px; font-weight: 600; color: var(--color-text-muted); }
.view-val { font-size: 13.5px; color: var(--color-text); line-height: 1.5; word-break: break-word; }
.view-val--summary { white-space: pre-wrap; }

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
.btn-submit {
  display: flex; align-items: center; gap: 8px; padding: 9px 24px;
  background: linear-gradient(135deg, var(--color-primary-dark), var(--color-primary));
  color: #fff; border: none; border-radius: 9px;
  font-size: 13.5px; font-weight: 600; font-family: inherit;
  cursor: pointer; box-shadow: 0 4px 12px rgba(79,70,229,.25); transition: opacity .15s;
}
.btn-submit:disabled { opacity: .45; cursor: not-allowed; }
.btn-submit:not(:disabled):hover { opacity: .9; }

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
.btn-delete-confirm:hover { opacity: .85; }

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
.upload-drop--loading { pointer-events: none; opacity: 0.6; }
.btn-extract {
  display: flex; align-items: center; gap: 7px; padding: 8px 16px;
  background: var(--color-surface); border: 1.5px solid var(--color-border); border-radius: 8px;
  font-size: 13px; font-weight: 600; font-family: inherit; color: var(--color-text-secondary);
  cursor: pointer; white-space: nowrap;
}
.btn-extract:hover:not(:disabled) { background: var(--color-surface-hover); }
.btn-extract:disabled { opacity: 0.55; cursor: not-allowed; }

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
.form-input--view { cursor: default; user-select: text; pointer-events: none; }
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

.ah-row--readonly { cursor: default; }
.ah-type-readonly {
  display: inline-flex; align-items: center; justify-content: center;
  padding: 3px 10px; border-radius: 6px; font-size: 12px; font-weight: 600;
  pointer-events: none;
}
.ah-date-readonly { font-size: 13px; color: var(--color-text-secondary); }
.ah-empty { font-size: 13px; color: var(--color-text-muted); margin: 4px 0 8px; }

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
