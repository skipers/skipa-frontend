# SKIPA Frontend

**SK IP Analytics** — 특허 재평가 관리 시스템 프론트엔드.

Legal AI팀이 보유 특허의 유지·포기 결정 워크플로우를 관리하고, 사업부가 담당 특허를 검토·제출하는 협업 플랫폼입니다.

---

## 목차

1. [소개](#소개)
2. [설치](#설치)
3. [사용법](#사용법)
4. [기여](#기여)
5. [라이선스](#라이선스)

---

## 소개

### 프로젝트 목적

기업이 보유한 특허 포트폴리오를 체계적으로 관리하기 위한 내부 도구입니다. Legal AI팀은 전체 특허의 재평가를 총괄하고, 각 사업부는 담당 특허에 대한 유지 또는 포기 결정을 제출합니다.

### 주요 기능

| 기능 | 설명 |
|------|------|
| 재평가 관리 | 특허별 재평가 상태 추적, 사업부 배정, 검토 요청 일괄 전송 |
| AI 평가 보고서 | 기술성·권리성·사업성 점수 및 유사 특허 분석 결과 제공 |
| 포트폴리오 분석 | 기술분야·국가·사업부별 분포 시각화, 연도별 출원·소멸 추이 |
| 소멸 예정 관리 | 타임라인 및 캘린더 뷰로 만료 임박 특허 긴급도별 관리 |
| 사전 평가 Lab | 채팅형 인터페이스로 신규 특허 AI 사전 평가 |
| 특허 등록 신청 | 사업부 PDF 업로드 → 자동 정보 추출 → Legal 검토·승인 워크플로우 |

### 기술 스택

- **Vue 3** (Composition API, `<script setup>`) + **TypeScript**
- **Vite** (빌드 도구) / **Pinia** (상태 관리) / **Vue Router 4**
- **Playwright** (E2E 테스트)
- **Docker** + **nginx** (프로덕션 배포)
- CSS Custom Properties (Design Tokens — `src/assets/base.css`)

---

## 설치

### 사전 요구사항

- **Node.js** 20 이상
- **npm** 9 이상

### 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성합니다.

```sh
cp .env.example .env
```

| 변수 | 설명 | 예시 |
|------|------|------|
| `VITE_API_BASE_URL` | 백엔드 API 서버 주소 | `http://localhost:8080` |

### 로컬 설치

```sh
npm install
```

### Docker 빌드

```sh
docker build \
  --build-arg VITE_API_BASE_URL=http://your-api-server \
  -t skipa-frontend .

docker run -p 80:80 skipa-frontend
```

---

## 사용법

### 개발 서버 실행

```sh
npm run dev
```

브라우저에서 `http://localhost:5173`으로 접속합니다.

### 프로덕션 빌드

```sh
npm run build    # dist/ 디렉토리에 빌드 결과물 생성
npm run preview  # 빌드 결과물 로컬 미리보기
```

### E2E 테스트

```sh
npm run test:e2e        # Playwright 테스트 실행
npm run test:e2e:ui     # Playwright UI 모드로 실행
```

### 로그인 및 역할

| 역할 | 접근 경로 | 설명 |
|------|-----------|------|
| `LEGAL` | `/legal/*` | Legal AI팀 — 전체 특허 관리·재평가 총괄 |
| `BUSINESS` | `/biz/*` | 사업부 — 담당 특허 검토·결정 제출 |
| `ADMIN` | `/legal/*` | 시스템 관리자 — LEGAL과 동일 권한 |

> 백엔드 미연결 시 mock 데이터로 동작합니다. `src/stores/auth.ts`의 mock 로그인 로직은 백엔드 연동 시 실제 API 호출로 교체합니다.

### 라우트 구조

```
/login                                         로그인
/403                                           권한 없음
/404                                           페이지 없음

# Legal AI팀
/legal/home                                    대시보드
/legal/reevaluation                            재평가 관리
/legal/portfolio                               포트폴리오 분석
/legal/expiring                                소멸 예정 관리
/legal/patent-search                           특허 검색
/legal/patent-manage                           특허 관리 (신청 검토 + 특허 목록)
/legal/patent-manage/review/:appId             신청 검토 상세

# 사업부
/biz/home                                      홈 대시보드
/biz/review                                    검토 현황
/biz/patents                                   담당 특허 관리
/biz/history                                   제출 이력
/biz/pre-eval-lab                              사전 평가 Lab
/biz/expiring                                  소멸 예정 관리
/biz/patent-search                             특허 검색
/biz/register                                  신규 특허 등록 신청
/biz/register/history/:appId                   신청 상세
```

---

## 기여

### 브랜치 전략

```
main        배포 브랜치 (직접 커밋 금지)
dev         개발 통합 브랜치
feat/<name> 기능 개발
fix/<name>  버그 수정
```

모든 변경사항은 `dev` 브랜치로 Pull Request를 제출합니다.

### 커밋 메시지 규칙

[Conventional Commits](https://www.conventionalcommits.org/) 스타일을 따릅니다.

```
<type>: <요약>

예시:
feat: 재평가 관리 사업부 일괄 배정 기능 추가
fix: 특허 상세 탭 스크롤 위치 오감지 버그 수정
refactor: PatentDetailView 탭 컴포넌트 분리
chore: Playwright 의존성 업데이트
```

| type | 사용 시점 |
|------|-----------|
| `feat` | 새로운 기능 |
| `fix` | 버그 수정 |
| `refactor` | 동작 변경 없는 코드 개선 |
| `style` | 포맷·공백 등 스타일만 변경 |
| `chore` | 빌드·의존성·설정 변경 |
| `docs` | 문서 변경 |

### 코드 규칙

- **컴포넌트**: `<script setup lang="ts">` + Composition API 사용
- **상태 관리**: 전역 상태는 Pinia store(`src/stores/`)에 위치
- **API 호출**: `src/api/` 모듈을 통해서만 수행, 컴포넌트 내 직접 axios 호출 금지
- **타입**: `src/types/`에 공통 타입 정의, `any` 사용 금지
- **스타일**: CSS Custom Properties(`src/assets/base.css`) 변수 우선 사용, 인라인 색상 하드코딩 금지
- **린트**: PR 전 `eslint` 경고·오류 없음 확인

### Pull Request 체크리스트

- [ ] `dev` 브랜치 기준 최신 상태에서 분기
- [ ] 기능 단위로 커밋 분리
- [ ] E2E 테스트 통과 (`npm run test:e2e`)
- [ ] 타입 오류 없음 (`npm run build`)

---

## 라이선스

Copyright © 2026 skipers. All rights reserved.

본 소프트웨어는 SKALA 3기 내부 프로젝트로, 무단 복제·배포·수정을 금합니다.
