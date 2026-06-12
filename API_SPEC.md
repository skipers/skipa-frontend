# SKIPA API 명세서

SK IP Analytics 백엔드 API 구현 가이드.  
프론트엔드 코드(`src/api/`, `src/types/`)를 기준으로 작성되었습니다.

---

## 목차

1. [공통 규칙](#1-공통-규칙)
2. [인증 API](#2-인증-api)
3. [특허 API](#3-특허-api)
4. [권리 이력 & 연차료 API](#4-권리-이력--연차료-api)
5. [AI 평가 보고서 API](#5-ai-평가-보고서-api)
6. [평가 보고서 PDF API](#6-평가-보고서-pdf-api)
7. [Legal — 검토 요청 API](#7-legal--검토-요청-api)
8. [Business — 검토 의견 API](#8-business--검토-의견-api)
9. [대시보드 API](#9-대시보드-api)
10. [소멸 예정 API](#10-소멸-예정-api)
11. [포트폴리오 API](#11-포트폴리오-api)
12. [신규 특허 등록 신청 API](#12-신규-특허-등록-신청-api)
13. [사전 평가 Lab API](#13-사전-평가-lab-api)

---

## 1. 공통 규칙

### Base URL

```
VITE_API_BASE_URL (환경변수)
예시: https://api.skipa.internal/v1
```

### 인증 헤더

로그인 이후 모든 요청에 포함합니다.

```
Authorization: Bearer {accessToken}
```

### 공통 응답 포맷

**성공**

```json
{
  "success": true,
  "data": { ... }
}
```

**실패**

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "사람이 읽을 수 있는 오류 메시지",
    "details": { }
  }
}
```

> `data` 필드 구조는 각 엔드포인트 응답 명세에 정의합니다.

### HTTP 상태 코드

| 코드 | 의미 |
|------|------|
| `200` | 성공 |
| `201` | 생성 성공 |
| `204` | 성공 (응답 바디 없음) |
| `400` | 잘못된 요청 (유효성 검사 실패 등) |
| `401` | 인증 실패 (토큰 없음 또는 만료) |
| `403` | 권한 없음 |
| `404` | 리소스 없음 |
| `409` | 충돌 (중복 데이터 등) |
| `500` | 서버 내부 오류 |

### 에러 코드 목록

| code | HTTP | 설명 |
|------|------|------|
| `INVALID_CREDENTIALS` | 401 | 아이디 또는 비밀번호 불일치 |
| `TOKEN_EXPIRED` | 401 | 액세스 토큰 만료 |
| `TOKEN_INVALID` | 401 | 토큰 형식 오류 |
| `REFRESH_TOKEN_EXPIRED` | 401 | 리프레시 토큰 만료 (재로그인 필요) |
| `FORBIDDEN` | 403 | 역할 권한 없음 |
| `NOT_FOUND` | 404 | 리소스 없음 |
| `DUPLICATE_APPLICATION_NUMBER` | 409 | 출원번호 중복 |
| `VALIDATION_ERROR` | 400 | 필드 유효성 실패 (`details`에 필드별 메시지 포함) |
| `UNKNOWN_ERROR` | 500 | 서버 오류 |

### 페이지네이션

**요청 쿼리 파라미터**

| 파라미터 | 타입 | 기본값 | 설명 |
|---------|------|--------|------|
| `page` | number | `1` | 1-based 페이지 번호 |
| `size` | number | `20` | 페이지당 항목 수 |

> 프론트엔드는 API 호출 시 내부적으로 `page - 1`을 전달합니다. **백엔드는 0-based로 처리해도 되고 1-based로 처리해도 됩니다. 단, 프론트와 사전에 합의 필요.**

**응답 구조**

```json
{
  "success": true,
  "data": {
    "items": [ ... ],
    "page": 1,
    "size": 20,
    "totalItems": 100,
    "totalPages": 5
  }
}
```

### 사용자 역할

| 역할 | 설명 |
|------|------|
| `LEGAL` | Legal AI팀. 특허 전체 관리, 재평가 총괄 |
| `BUSINESS` | 사업부. 담당 특허 검토 및 의견 제출 |
| `ADMIN` | 시스템 관리자. LEGAL과 동일 권한 |

---

## 2. 인증 API

### POST /auth/login

로그인

**요청 Body**

```json
{
  "id": "string",
  "password": "string"
}
```

**응답 `data`**

```json
{
  "accessToken": "string",
  "refreshToken": "string",
  "user": {
    "id": "string",
    "role": "LEGAL | BUSINESS | ADMIN",
    "deptId": "string | null"
  }
}
```

---

### POST /auth/logout

로그아웃 (리프레시 토큰 무효화)

**요청 Body**: 없음

**응답**: `204 No Content`

---

### GET /auth/me

현재 로그인한 사용자 정보 조회

**응답 `data`**

```json
{
  "user": {
    "id": "string",
    "name": "string",
    "email": "string",
    "role": "LEGAL | BUSINESS | ADMIN",
    "departmentId": "number | null",
    "createdAt": "YYYY-MM-DD HH:mm:ss",
    "updatedAt": "YYYY-MM-DD HH:mm:ss"
  }
}
```

---

### POST /auth/refresh

액세스 토큰 갱신

**요청 Body**

```json
{
  "refreshToken": "string"
}
```

**응답 `data`**

```json
{
  "accessToken": "string"
}
```

---

## 3. 특허 API

### GET /patents

특허 목록 조회

**쿼리 파라미터**

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `q` | string | 선택 | 통합 검색 (특허명 / 출원번호 / 발명자 / 키워드) |
| `status` | string | 선택 | 특허 상태. `REGISTERED`, `EXPIRED`, `ABANDONED` 또는 콤마 구분 다중 값 |
| `techField` | string | 선택 | 기술분야. `AI/ML`, `반도체`, `통신`, `에너지`, `제조` |
| `country` | string | 선택 | 국가 코드. `KR`, `US`, `EP`, `CN`, `JP` |
| `departmentId` | number | 선택 | 담당 사업부 ID (LEGAL/ADMIN만 사용 가능) |
| `sort` | string | 선택 | 정렬 기준. `applicationDate`, `registrationDate`, `expiryDate` |
| `order` | string | 선택 | 정렬 방향. `asc`, `desc` (기본: `desc`) |
| `page` | number | 선택 | 페이지 번호 (기본: `1`) |
| `size` | number | 선택 | 페이지 크기 (기본: `20`) |

**응답 `data`** — 페이지네이션 구조

```json
{
  "items": [
    {
      "id": 1,
      "title": "string",
      "applicationNumber": "KR-2021-0087234",
      "registrationNumber": "string",
      "manageNumber": "string | null",
      "expiryDate": "YYYY-MM-DD | null",
      "techField": "string",
      "status": "REGISTERED | EXPIRED | ABANDONED",
      "grade": "S | A | B | C | D | null",
      "keywords": ["string"],
      "departments": [
        { "departmentId": 2, "departmentName": "반도체사업부" }
      ]
    }
  ],
  "page": 1,
  "size": 20,
  "totalItems": 100,
  "totalPages": 5
}
```

---

### GET /patents/:patentId

특허 상세 조회

**Path Parameter**: `patentId` (number)

**응답 `data`**

```json
{
  "patent": {
    "id": 1,
    "title": "string",
    "applicationNumber": "string",
    "registrationNumber": "string",
    "publicationNumber": "string | null",
    "announcementNumber": "string | null",
    "manageNumber": "string | null",
    "applicationDate": "YYYY-MM-DD | null",
    "registrationDate": "YYYY-MM-DD | null",
    "publicationDate": "YYYY-MM-DD | null",
    "announcementDate": "YYYY-MM-DD | null",
    "expiryDate": "YYYY-MM-DD | null",
    "ipcCode": "string | null",
    "cpcCode": "string | null",
    "applicant": "string | null",
    "inventor": "string | null",
    "filingCountry": "KR | US | EP | CN | JP | null",
    "techField": "string | null",
    "businessField": "string | null",
    "relatedProducts": ["string"],
    "keywords": ["string"],
    "overview": "string | null",
    "coreContent": "string | null",
    "isJointApplication": false,
    "jointApplicant": "string | null",
    "citationCount": 0,
    "originalPdfKey": "string | null",
    "status": "REGISTERED | EXPIRED | ABANDONED",
    "grade": "S | A | B | C | D | null",
    "aiOpinion": "유지 권고 | 재검토 필요 | 포기 권고 | null",
    "departments": [
      { "id": 1, "departmentId": 2, "departmentName": "반도체사업부", "assignedAt": "YYYY-MM-DD" }
    ]
  }
}
```

---

### POST /patents

특허 신규 등록 (LEGAL/ADMIN 전용)

**요청 Body**

```json
{
  "title": "string (필수)",
  "applicationNumber": "string (필수, 고유)",
  "registrationNumber": "string (필수)",
  "manageNumber": "string | null",
  "applicant": "string | null",
  "inventor": "string | null",
  "applicationDate": "YYYY-MM-DD | null",
  "registrationDate": "YYYY-MM-DD | null",
  "publicationDate": "YYYY-MM-DD | null",
  "announcementDate": "YYYY-MM-DD | null",
  "ipcCode": "string | null",
  "cpcCode": "string | null",
  "expiryDate": "YYYY-MM-DD | null",
  "filingCountry": "KR | US | EP | CN | JP | null",
  "techField": "string | null",
  "businessField": "string | null",
  "keywords": ["string"],
  "relatedProducts": ["string"],
  "overview": "string | null",
  "coreContent": "string | null",
  "isJointApplication": false,
  "jointApplicant": "string | null"
}
```

**응답 `data`** (`201 Created`)

```json
{
  "patentId": 1
}
```

---

### PATCH /patents/:patentId

특허 정보 수정 (LEGAL/ADMIN 전용)

**요청 Body**: `POST /patents`와 동일한 구조, 수정할 필드만 포함

**응답 `data`**

```json
{
  "patentId": 1
}
```

---

### DELETE /patents/:patentId

특허 삭제 (LEGAL/ADMIN 전용)

**응답**: `204 No Content`

---

### POST /patents/extract

PDF 파일에서 특허 정보 자동 추출 (신청서 작성 시 사용)

**요청 Body**: `multipart/form-data`

| 필드 | 타입 | 설명 |
|------|------|------|
| `file` | File | 특허 PDF 파일 |

**응답 `data`**: 특허 필드 일부 (추출 가능한 항목만 포함)

```json
{
  "title": "string | null",
  "applicationNumber": "string | null",
  "registrationNumber": "string | null",
  "applicationDate": "YYYY-MM-DD | null",
  "registrationDate": "YYYY-MM-DD | null",
  "ipcCode": "string | null",
  "cpcCode": "string | null",
  "applicant": "string | null",
  "inventor": "string | null",
  "expiryDate": "YYYY-MM-DD | null",
  "keywords": ["string"],
  "overview": "string | null"
}
```

---

### POST /patents/:patentId/documents

특허에 PDF 파일 업로드

**요청 Body**: `multipart/form-data`

| 필드 | 타입 | 설명 |
|------|------|------|
| `file` | File | 특허 PDF 파일 |

**응답 `data`**

```json
{
  "patentId": 1,
  "originalPdfKey": "string"
}
```

---

### DELETE /patents/:patentId/documents

특허 PDF 삭제

**응답**: `204 No Content`

---

### GET /patents/:patentId/departments

특허에 배정된 사업부 목록 조회

**응답 `data`**

```json
{
  "items": [
    {
      "id": 1,
      "patentId": 1,
      "departmentId": 2,
      "departmentName": "반도체사업부",
      "assignedAt": "YYYY-MM-DD"
    }
  ]
}
```

---

### POST /patents/:patentId/departments

특허에 사업부 배정

**요청 Body**

```json
{
  "departmentId": 2
}
```

**응답 `data`** (`201 Created`)

```json
{
  "id": 1,
  "patentId": 1,
  "departmentId": 2,
  "departmentName": "반도체사업부",
  "assignedAt": "YYYY-MM-DD"
}
```

---

### PATCH /patents/:patentId/departments/:deptId

특허의 담당 사업부 변경

**요청 Body**

```json
{
  "departmentId": 3
}
```

**응답 `data`**

```json
{
  "patentId": 1,
  "fromDepartmentId": 2,
  "toDepartmentId": 3
}
```

---

### DELETE /patents/:patentId/departments/:deptId

특허에서 사업부 배정 해제

**응답**: `204 No Content`

---

## 4. 권리 이력 & 연차료 API

### GET /patents/:patentId/legal-statuses

특허 권리 상태 이력 조회 (등록 이력 탭)

**응답 `data`**

```json
[
  {
    "id": 1,
    "patentId": 1,
    "status": "출원 | 공개 | 등록 | 유지 | 포기 | 소멸 | 취하 | 거절 | 무효",
    "variant": "file | pub | reg | maintain | expired | withdraw | rejected | invalid",
    "date": "YYYY-MM-DD",
    "description": "string | null",
    "createdAt": "YYYY-MM-DD HH:mm:ss"
  }
]
```

> `status`는 표시용 한글 레이블, `variant`는 UI 아이콘/색상 결정에 사용됩니다.

---

### POST /patents/:patentId/legal-statuses

권리 상태 이력 항목 추가 (LEGAL/ADMIN 전용)

**요청 Body**

```json
{
  "status": "string",
  "variant": "string",
  "date": "YYYY-MM-DD",
  "description": "string | null"
}
```

**응답 `data`** (`201 Created`)

```json
{
  "id": 1,
  "patentId": 1,
  "status": "string",
  "variant": "string",
  "date": "YYYY-MM-DD",
  "description": "string | null",
  "createdAt": "YYYY-MM-DD HH:mm:ss"
}
```

---

### GET /patents/:patentId/annuities

연차료(등록료) 납부 이력 조회

**응답 `data`**

```json
[
  {
    "id": 1,
    "patentId": 1,
    "yearRange": "제  1 -  3 년분",
    "amount": 1200000,
    "paidAt": "YYYY-MM-DD",
    "status": "PAID | UNPAID"
  }
]
```

---

### POST /patents/:patentId/annuities/pay

연차료 납부 내역 추가 (LEGAL/ADMIN 전용)

**요청 Body**

```json
{
  "yearRange": "제  4 -  6 년분",
  "amount": 1500000,
  "paidAt": "YYYY-MM-DD"
}
```

**응답 `data`** (`201 Created`)

```json
{
  "id": 2,
  "patentId": 1,
  "yearRange": "string",
  "amount": 1500000,
  "paidAt": "YYYY-MM-DD",
  "status": "PAID"
}
```

---

## 5. AI 평가 보고서 API

### GET /patents/:patentId/ai-report

AI 평가 보고서 조회

**응답 `data`**

```json
{
  "patentId": 1,
  "status": "NONE | GENERATING | COMPLETED | FAILED",
  "generatedAt": "YYYY-MM-DD HH:mm:ss | null",
  "report": {
    "totalScore": 85,
    "techScore": 88,
    "rightsScore": 82,
    "bizScore": 85,
    "techComment": "string",
    "rightsComment": "string",
    "bizComment": "string",
    "evalBlocks": [
      {
        "key": "tech | rights | market",
        "title": "string",
        "score": 88,
        "items": [
          {
            "id": "string",
            "name": "string",
            "score": 4,
            "method": "string",
            "summary": "string",
            "grounds": "string",
            "sources": "string"
          }
        ]
      }
    ],
    "similarPatents": [
      {
        "applicationNumber": "string",
        "title": "string",
        "applicant": "string",
        "year": 2021,
        "similarityScore": 0.87,
        "citations": 12,
        "status": "유지 | 소멸 | 공개",
        "desc": "string",
        "detail": "string"
      }
    ],
    "relatedProjects": [
      {
        "id": 1,
        "projectName": "string",
        "department": "string",
        "relevance": "상 | 중 | 하",
        "description": "string"
      }
    ],
    "confirmItems": [
      {
        "title": "string",
        "meta": "string",
        "desc": "string"
      }
    ],
    "refs": ["string"]
  }
}
```

> `status`가 `NONE`이면 `report`는 `null`입니다.

---

### POST /patents/:patentId/ai-report/retry

AI 평가 보고서 재생성 요청

**요청 Body**: 없음

**응답 `data`**

```json
{
  "patentId": 1,
  "status": "GENERATING"
}
```

---

## 6. 평가 보고서 PDF API

### GET /patents/:patentId/reports

특허의 보고서 목록 조회

**응답 `data`** — 페이지네이션 구조

```json
{
  "items": [
    {
      "id": 1,
      "patentId": 1,
      "status": "PENDING | PROCESSING | COMPLETED | FAILED",
      "url": "string | null",
      "totalScore": 85,
      "valueGrade": "A",
      "evaluatedAt": "YYYY-MM-DD | null",
      "opinion": "KEEP | DISPOSE | null",
      "comment": "string | null",
      "createdAt": "YYYY-MM-DD HH:mm:ss",
      "updatedAt": "YYYY-MM-DD HH:mm:ss"
    }
  ],
  "page": 1,
  "size": 20,
  "totalItems": 3,
  "totalPages": 1
}
```

---

### POST /patents/:patentId/reports

평가 보고서 PDF 생성 요청

**요청 Body**: 없음

**응답 `data`** (`201 Created`)

```json
{
  "id": 1,
  "patentId": 1,
  "status": "PENDING",
  "createdAt": "YYYY-MM-DD HH:mm:ss",
  "updatedAt": "YYYY-MM-DD HH:mm:ss"
}
```

---

### GET /patents/:patentId/reports/latest

특허의 최신 보고서 조회

**응답 `data`**: `GET /patents/:patentId/reports`의 item 단건과 동일한 구조

---

### GET /patents/:patentId/reports/history

보고서 생성 이력 조회 (점수·의견 이력)

**응답 `data`**

```json
[
  {
    "id": 1,
    "patentId": 1,
    "totalScore": 85,
    "valueGrade": "A",
    "evaluatedAt": "YYYY-MM-DD",
    "opinion": "KEEP | DISPOSE | null",
    "comment": "string | null"
  }
]
```

---

### GET /reports/:reportId

보고서 단건 조회 (URL 포함)

**응답 `data`**: `GET /patents/:patentId/reports`의 item 단건과 동일

---

### GET /reports/:reportId/status

보고서 생성 상태 폴링

> 프론트엔드는 3초 간격, 최대 60회 폴링합니다.

**응답 `data`**

```json
{
  "id": 1,
  "status": "PENDING | PROCESSING | COMPLETED | FAILED",
  "progress": 60,
  "message": "string | null"
}
```

---

## 7. Legal — 검토 요청 API

Legal 팀이 사업부에 재평가 의견을 요청하고 관리하는 API입니다.

### GET /review-targets

재평가 대상 목록 조회 (Legal 전용)

**쿼리 파라미터**

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `status` | string | `SCHEDULED`, `PENDING`, `OVERDUE`, `SUBMITTED` |
| `departmentId` | number | 담당 사업부 필터 |
| `patentId` | number | 특정 특허 필터 |
| `checked` | boolean | 확인 여부 필터 (`false` = 미확인 회신) |
| `sort` | string | 정렬 기준 |
| `page` | number | 페이지 번호 |
| `size` | number | 페이지 크기 |

**응답 `data`** — 페이지네이션 구조

```json
{
  "items": [
    {
      "id": 1,
      "patentId": 1,
      "title": "string",
      "applicationNumber": "string",
      "reportId": 1,
      "departmentId": 2,
      "departmentName": "반도체사업부",
      "reviewCycleId": 1,
      "reviewCycleYear": 2026,
      "reviewCycleQuarter": 2,
      "opinion": "MAINTAIN | ABANDON | null",
      "comment": "string | null",
      "status": "SCHEDULED | PENDING | OVERDUE | SUBMITTED",
      "checked": false,
      "submittedAt": "YYYY-MM-DD | null",
      "dueDate": "YYYY-MM-DD | null",
      "createdAt": "YYYY-MM-DD HH:mm:ss",
      "updatedAt": "YYYY-MM-DD HH:mm:ss"
    }
  ],
  "page": 1,
  "size": 20,
  "totalItems": 18,
  "totalPages": 1
}
```

---

### GET /review-targets/:reviewId

재평가 대상 단건 조회

**응답 `data`**: items 단건과 동일한 구조

---

### POST /patents/:patentId/reviews

단일 특허 검토 요청 전송 (LEGAL 전용)

**요청 Body**: 없음

**응답 `data`** (`201 Created`): 생성된 review-target 단건

---

### POST /reviews/bulk

복수 특허 검토 요청 일괄 전송 (LEGAL 전용)

**요청 Body**

```json
{
  "patentIds": [1, 2, 3]
}
```

**응답 `data`**

```json
{
  "reviewCycleId": 1,
  "createdCount": 3,
  "skippedCount": 0,
  "items": [
    { "patentId": 1, "status": "created" },
    { "patentId": 2, "status": "skipped", "reason": "already_requested" }
  ]
}
```

---

### PATCH /reviews/:reviewId/confirm

사업부 회신 확인 처리 (LEGAL 전용)

**요청 Body**: 없음

**응답 `data`**

```json
{
  "id": 1,
  "checked": true
}
```

---

## 8. Business — 검토 의견 API

사업부가 자신에게 배정된 특허의 유지/포기 의견을 관리하는 API입니다.

### GET /business-reviews

검토 의견 목록 조회 (BUSINESS 전용)

> 요청한 사용자의 `departmentId` 기준으로 자동 필터링됩니다.

**쿼리 파라미터**

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `status` | string | `PENDING`, `OVERDUE`, `SUBMITTED` |
| `opinion` | string | `MAINTAIN`, `ABANDON` |
| `submittedFrom` | string | 제출일 시작 (YYYY-MM-DD) |
| `submittedTo` | string | 제출일 종료 (YYYY-MM-DD) |
| `sort` | string | 정렬 기준 |
| `page` | number | 페이지 번호 |
| `size` | number | 페이지 크기 |

**응답 `data`** — 페이지네이션 구조

```json
{
  "items": [
    {
      "id": 1,
      "patentId": 1,
      "title": "string",
      "applicationNumber": "string",
      "keywords": ["string"],
      "summary": "string | null",
      "opinion": "MAINTAIN | ABANDON | null",
      "comment": "string | null",
      "status": "PENDING | OVERDUE | SUBMITTED",
      "submittedAt": "YYYY-MM-DD | null",
      "reviewRequestedAt": "YYYY-MM-DD | null",
      "dueDate": "YYYY-MM-DD | null",
      "totalScore": 85,
      "valueGrade": "S | A | B | C | D | null",
      "createdAt": "YYYY-MM-DD HH:mm:ss",
      "updatedAt": "YYYY-MM-DD HH:mm:ss"
    }
  ],
  "page": 1,
  "size": 20,
  "totalItems": 8,
  "totalPages": 1
}
```

---

### GET /business-reviews/summary

현재 분기 검토 요약 조회 (BUSINESS 전용)

**응답 `data`**

```json
{
  "reviewCycle": {
    "id": 1,
    "year": 2026,
    "quarter": 2,
    "startDate": "YYYY-MM-DD",
    "endDate": "YYYY-MM-DD"
  },
  "kpi": {
    "submitted": 3,
    "notSubmitted": 5
  }
}
```

---

### GET /business-reviews/:patentId

특정 특허의 검토 의견 상세 조회 (BUSINESS 전용)

**응답 `data`**

```json
{
  "patent": { /* GET /patents/:patentId 응답의 patent 객체와 동일 */ },
  "opinion": "MAINTAIN | ABANDON | null",
  "comment": "string | null",
  "status": "PENDING | OVERDUE | SUBMITTED",
  "submittedAt": "YYYY-MM-DD | null",
  "reviewRequestedAt": "YYYY-MM-DD | null",
  "dueDate": "YYYY-MM-DD | null"
}
```

---

### POST /business-reviews/:patentId/opinions

유지/포기 의견 제출 (BUSINESS 전용)

**요청 Body**

```json
{
  "opinion": "MAINTAIN | ABANDON",
  "comment": "string | null"
}
```

**응답 `data`**: 해당 business-review 단건 (items 구조와 동일)

---

### GET /business-reviews/history

제출 이력 조회 (BUSINESS 전용)

**쿼리 파라미터**

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `year` | number | 연도 필터 |
| `quarter` | number | 분기 필터 (`1`, `2`, `3`, `4`) |
| `opinion` | string | `MAINTAIN`, `ABANDON` |
| `page` | number | 페이지 번호 |
| `size` | number | 페이지 크기 |

**응답 `data`** — 페이지네이션 구조

```json
{
  "items": [
    {
      "id": 1,
      "patentId": 1,
      "reviewCycle": {
        "id": 1,
        "year": 2026,
        "quarter": 2,
        "startDate": "YYYY-MM-DD",
        "endDate": "YYYY-MM-DD"
      },
      "title": "string",
      "applicationNumber": "string",
      "opinion": "MAINTAIN | ABANDON | null",
      "comment": "string | null",
      "status": "SUBMITTED",
      "submittedAt": "YYYY-MM-DD",
      "totalScore": 85,
      "valueGrade": "A"
    }
  ],
  "page": 1,
  "size": 20,
  "totalItems": 12,
  "totalPages": 1
}
```

---

## 9. 대시보드 API

### GET /dashboard/legal

Legal 홈 대시보드 데이터

**쿼리 파라미터**

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `reviewCycleId` | number | 선택. 특정 리뷰 사이클 기준 (생략 시 현재 사이클) |

**응답 `data`**

```json
{
  "reviewCycle": {
    "id": 1,
    "year": 2026,
    "quarter": 2,
    "startDate": "YYYY-MM-DD",
    "endDate": "YYYY-MM-DD"
  },
  "kpi": {
    "requested": 5,
    "reviewing": 4,
    "decided": 8,
    "overdue": 4,
    "unread": 2,
    "unrequested": 3
  },
  "departments": [
    {
      "departmentId": 2,
      "departmentName": "반도체사업부",
      "assigned": 6,
      "decided": 3
    }
  ],
  "byTechField": [
    { "name": "AI/ML", "count": 8 }
  ],
  "byExpiryQuarter": [
    { "quarter": "2026 Q3", "count": 3 }
  ],
  "recentReplies": [
    {
      "reviewId": 1,
      "patentId": 1,
      "title": "string",
      "applicationNumber": "string",
      "departmentId": 2,
      "departmentName": "반도체사업부",
      "opinion": "MAINTAIN | ABANDON",
      "submittedAt": "YYYY-MM-DD",
      "checked": false,
      "dueDate": "YYYY-MM-DD"
    }
  ]
}
```

---

### GET /dashboard/business

Business 홈 대시보드 데이터

**쿼리 파라미터**

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `reviewCycleId` | number | 선택. 특정 리뷰 사이클 기준 |

**응답 `data`**

```json
{
  "reviewCycle": {
    "id": 1,
    "year": 2026,
    "quarter": 2,
    "startDate": "YYYY-MM-DD",
    "endDate": "YYYY-MM-DD"
  },
  "kpi": {
    "total": 8,
    "submitted": 3,
    "notSubmitted": 5
  },
  "pendingPatents": [
    {
      "reviewId": 1,
      "patentId": 2,
      "title": "string",
      "applicationNumber": "string",
      "status": "PENDING | OVERDUE"
    }
  ],
  "recentSubmissions": [
    {
      "reviewId": 1,
      "patentId": 1,
      "title": "string",
      "applicationNumber": "string",
      "opinion": "MAINTAIN | ABANDON",
      "submittedAt": "YYYY-MM-DD"
    }
  ],
  "patentStatus": {
    "active": 6,
    "inactive": 2
  },
  "yearlyTrends": [
    {
      "year": 2026,
      "applications": 16,
      "expiredOrAbandoned": 6
    }
  ]
}
```

---

## 10. 소멸 예정 API

### GET /patents/expiring

소멸 예정 특허 목록 조회

**쿼리 파라미터**

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `departmentId` | number | 사업부 필터 (BUSINESS는 자신의 부서로 자동 고정) |
| `period` | string | 기간 필터. `3m`, `6m`, `1y`, `3y`, `5y` |
| `sort` | string | 정렬. `expiryDate` (기본: `asc`) |
| `page` | number | 페이지 번호 |
| `size` | number | 페이지 크기 |

**응답 `data`** — 페이지네이션 구조

```json
{
  "items": [
    {
      "id": 1,
      "title": "string",
      "applicationNumber": "string",
      "techField": "string",
      "departmentId": 2,
      "departmentName": "반도체사업부",
      "expiryDate": "YYYY-MM-DD"
    }
  ],
  "page": 1,
  "size": 20,
  "totalItems": 5,
  "totalPages": 1
}
```

---

### GET /patents/expiring/summary

소멸 예정 기간별 요약

**쿼리 파라미터**

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `departmentId` | number | 사업부 필터 |

**응답 `data`**

```json
{
  "totalCount": 12,
  "periods": [
    {
      "period": "3m | 6m | 1y | 3y | 5y",
      "count": 3,
      "byTechField": {
        "AI/ML": 1,
        "반도체": 2
      }
    }
  ]
}
```

---

### GET /patents/expiring/calendar

소멸 예정 특허 캘린더용 데이터 (연도별 전체)

**쿼리 파라미터**

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `year` | number | **필수**. 조회 연도 |
| `departmentId` | number | 사업부 필터 |

**응답 `data`** — 배열

```json
[
  {
    "id": 1,
    "title": "string",
    "applicationNumber": "string",
    "techField": "string",
    "departmentId": 2,
    "departmentName": "반도체사업부",
    "expiryDate": "YYYY-MM-DD"
  }
]
```

---

## 11. 포트폴리오 API

### GET /portfolio/distribution

특허 분포 통계

**응답 `data`**

```json
{
  "totalPatents": 22,
  "techFields": [
    { "name": "AI/ML", "count": 7 }
  ],
  "countries": [
    { "country": "KR", "flag": "🇰🇷", "count": 14 }
  ],
  "departments": [
    { "name": "반도체사업부", "count": 9 }
  ],
  "gradeDistribution": [
    {
      "name": "AI/ML",
      "S": 1, "A": 2, "B": 3, "C": 1, "D": 0,
      "total": 7
    }
  ]
}
```

---

### GET /portfolio/trends

연도별 출원·등록·소멸 추이

**응답 `data`**

```json
{
  "yearlyTrends": [
    {
      "year": "2026",
      "filed": 16,
      "registered": 14,
      "expired": 6
    }
  ],
  "annuityTrends": [
    {
      "year": 2026,
      "amount": 45000000
    }
  ]
}
```

---

### GET /portfolio/decisions

분기별·사업부별·기술분야별 유지/포기 결정 통계

**응답 `data`**

```json
{
  "quarters": [
    {
      "year": "2026 Q2",
      "keep": 8,
      "dispose": 4,
      "inProgress": true
    }
  ],
  "byDepartment": [
    { "name": "반도체사업부", "keep": 4, "dispose": 2 }
  ],
  "byTechField": [
    { "name": "AI/ML", "keep": 5, "dispose": 1 }
  ]
}
```

---

### GET /portfolio/insights

AI 포트폴리오 인사이트

**응답 `data`** — 배열

```json
[
  {
    "type": "warning | info | success",
    "icon": "string",
    "text": "string"
  }
]
```

---

## 12. 신규 특허 등록 신청 API

사업부가 신규 특허 등록을 Legal에 신청하고, Legal이 검토·승인·거절하는 API입니다.

### GET /patent-applications

신청 목록 조회

- LEGAL/ADMIN: 전체 신청 목록
- BUSINESS: 자신의 부서가 제출한 신청만

**쿼리 파라미터**

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `status` | string | `pending`, `approved`, `rejected`, `withdrawn` |
| `departmentId` | number | 사업부 필터 (LEGAL 전용) |
| `page` | number | 페이지 번호 |
| `size` | number | 페이지 크기 |

**응답 `data`** — 페이지네이션 구조

```json
{
  "items": [
    {
      "id": 1,
      "title": "string",
      "finalTitle": "string",
      "managementNumber": "string",
      "inventors": "string",
      "bizField": "string",
      "techField": "string",
      "relatedProducts": "string",
      "country": "KR | US | EP | CN | JP",
      "patentStatus": "출원 | 등록",
      "coApplicant": "아니오 | 예",
      "coApplicantName": "string | null",
      "applicationDate": "YYYY-MM-DD",
      "registrationDate": "YYYY-MM-DD | null",
      "applicationNumber": "string",
      "registrationNumber": "string | null",
      "ipc": "string",
      "expiryDate": "YYYY-MM-DD | null",
      "summary": "string",
      "coreContent": "string",
      "appStatus": "pending | approved | rejected | withdrawn",
      "isResubmit": false,
      "submittedAt": "YYYY-MM-DD",
      "submittedBy": "반도체사업부",
      "reviewedAt": "YYYY-MM-DD | null",
      "rejectionReason": "string | null"
    }
  ],
  "page": 1,
  "size": 20,
  "totalItems": 3,
  "totalPages": 1
}
```

---

### POST /patent-applications

신규 특허 등록 신청 제출 (BUSINESS 전용)

**요청 Body**

```json
{
  "title": "string (필수)",
  "finalTitle": "string",
  "managementNumber": "string",
  "inventors": "string",
  "bizField": "string",
  "techField": "string",
  "relatedProducts": "string",
  "country": "KR",
  "patentStatus": "출원 | 등록",
  "coApplicant": "아니오 | 예",
  "coApplicantName": "string | null",
  "applicationDate": "YYYY-MM-DD",
  "registrationDate": "YYYY-MM-DD | null",
  "applicationNumber": "string",
  "registrationNumber": "string | null",
  "ipc": "string",
  "expiryDate": "YYYY-MM-DD | null",
  "summary": "string",
  "coreContent": "string"
}
```

**응답 `data`** (`201 Created`): 생성된 신청 단건 (items 구조와 동일)

---

### GET /patent-applications/:appId

신청 단건 조회

**응답 `data`**: items 단건과 동일한 구조

---

### PATCH /patent-applications/:appId

신청 내용 수정 및 재신청 (BUSINESS 전용)

> `appStatus`가 `rejected` 상태인 신청만 수정 가능합니다.  
> 수정 후 `appStatus`는 `pending`, `isResubmit`은 `true`로 자동 변경됩니다.

**요청 Body**: `POST /patent-applications`와 동일한 구조, 수정할 필드만 포함

**응답 `data`**: 수정된 신청 단건

---

### POST /patent-applications/:appId/withdraw

신청 철회 (BUSINESS 전용)

> `appStatus`가 `pending` 또는 `rejected`인 경우만 가능합니다.

**요청 Body**: 없음

**응답 `data`**

```json
{
  "id": 1,
  "appStatus": "withdrawn"
}
```

---

### POST /patent-applications/:appId/approve

신청 승인 (LEGAL/ADMIN 전용)

**요청 Body**: 없음

**응답 `data`**

```json
{
  "id": 1,
  "appStatus": "approved",
  "reviewedAt": "YYYY-MM-DD"
}
```

---

### POST /patent-applications/:appId/reject

신청 거절 (LEGAL/ADMIN 전용)

**요청 Body**

```json
{
  "rejectionReason": "string (필수)"
}
```

**응답 `data`**

```json
{
  "id": 1,
  "appStatus": "rejected",
  "rejectionReason": "string",
  "reviewedAt": "YYYY-MM-DD"
}
```

---

## 13. 사전 평가 Lab API

사업부가 출원 전 특허 아이디어를 AI로 사전 평가하는 API입니다.

### POST /pre-eval

사전 평가 요청 (BUSINESS 전용)

**요청 Body**

```json
{
  "title": "string (필수)",
  "description": "string (필수)",
  "claims": "string (필수)",
  "relatedBusiness": "string | null",
  "targetCountries": ["KR", "US"]
}
```

**응답 `data`** (`201 Created`)

```json
{
  "id": 1,
  "title": "string",
  "techScore": 82,
  "rightsScore": 75,
  "bizScore": 88,
  "techComment": "string",
  "rightsComment": "string",
  "bizComment": "string",
  "evaluatedAt": "YYYY-MM-DD HH:mm:ss"
}
```

---

### GET /pre-eval

사전 평가 이력 조회 (BUSINESS 전용)

**응답 `data`** — 배열

```json
[
  {
    "id": 1,
    "title": "string",
    "techScore": 82,
    "rightsScore": 75,
    "bizScore": 88,
    "evaluatedAt": "YYYY-MM-DD"
  }
]
```

---

### GET /pre-eval/:id

사전 평가 결과 상세 조회

**응답 `data`**: `POST /pre-eval` 응답과 동일한 구조
