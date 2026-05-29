# SKIPA - SK IP Agent

SK AX 사내 특허 관리 시스템. Legal팀과 사업부가 특허의 유지/포기 의사결정을 효율적으로 수행할 수 있도록 지원한다.

## 핵심 규칙

- 상세 페이지 구성 → `docs/02_pages.md`
- 디자인 시스템 → `docs/03_design.md`
- 개발 시작 전 반드시 `docs/` 전체 파일 숙지

## 기술 스택

- **Frontend**: React + TypeScript + Tailwind CSS
- **라우팅**: React Router v6
- **차트**: Recharts
- **데이터**: 더미 데이터 (백엔드 연동 없음)
- **폰트**: Pretendard (없으면 Noto Sans KR fallback)

## 사용자 역할

| 역할 | 접근 범위 |
|------|-----------|
| Legal팀 | 전체 특허 조회 + 모든 보고서 열람 |
| 사업부 | 담당 특허만 조회 + 자신의 보고서만 열람 |

## 라우팅 구조

```
/login
/patents                    ← 전체 특허 목록 (공통)
/patents/register           ← 특허 등록 (공통)
/patents/:id                ← 특허 상세 (공통)
/expiring                   ← 만료 예정 특허 관리 (공통)

/legal/home                 ← Legal 홈
/legal/evaluation           ← 재평가 관리
/legal/portfolio            ← 포트폴리오 분석
/legal/expiring             ← 만료 예정 특허 관리 (Legal 전용)

/dept/home                  ← 사업부 홈
/dept/review                ← 검토 현황
/dept/patents               ← 담당 특허 관리
/dept/lab                   ← 사전 평가 Lab
```

## 전체 페이지 목록

### 공통
- 로그인
- 전체 특허 목록
- 특허 상세
- 만료 예정 특허 관리

### Legal팀
- 홈
- 재평가 관리
- 포트폴리오 분석
- 만료 예정 특허 관리

### 사업부
- 홈
- 검토 현황
- 담당 특허 관리
- 사전 평가 Lab

## 구현 우선순위

1. 레이아웃 (사이드바 + 헤더) + 라우팅
2. 로그인 + 역할 기반 분기
3. 전체 특허 목록 + 특허 상세
4. Legal 홈, 재평가 관리
5. 사업부 홈, 검토 현황, 담당 특허 관리
6. 포트폴리오 분석, 만료 예정 관리
7. 사전 평가 Lab (챗봇 포함)
