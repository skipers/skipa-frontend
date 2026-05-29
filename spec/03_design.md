# SKIPA 디자인 시스템

SK AX 사내 서비스 SKIPA의 디자인 가이드.
SK 그룹 브랜드 아이덴티티를 기반으로 전문적이고 신뢰감 있는 기업용 대시보드 스타일로 구현한다.

---

## 브랜드 컬러

### Primary / Secondary

| 이름 | 용도 | HEX | RGB |
|------|------|-----|-----|
| SK Orange | 메인 컬러. 버튼, 강조, 활성 상태, 핵심 수치 | `#FF7A00` | 255/122/0 |
| SK Red | 경고, 지연, 기한 초과 등 위험 상태에만 사용 | `#EA002C` | 234/0/44 |

### 배경 / 서피스

| 이름 | 용도 | HEX |
|------|------|-----|
| Neutral Dark | 사이드바, 헤더 배경 | `#1A1A2E` |
| Page Background | 전체 페이지 배경 | `#F5F6FA` |
| Card Background | 카드, 테이블, 모달 배경 | `#FFFFFF` |
| Border | 구분선, 테두리 | `#E2E8F0` |

---

## 상태(Status) 컬러

| 상태 | HEX | 용도 |
|------|-----|------|
| 등록 / 완료 | `#10B981` | 그린 |
| 만료 예정 | `#FF7A00` | SK Orange (Primary) |
| 포기 / 만료 | `#94A3B8` | 그레이 |
| 지연 / 경고 | `#EA002C` | SK Red (Secondary) |
| 요청 완료 | `#3B82F6` | 블루 |
| 미완료 | `#94A3B8` | 그레이 |

배지(Badge) 스타일: 해당 상태 컬러 10% 투명도 배경 + 진한 텍스트 컬러

---

## 타이포그래피

- **폰트**: `Pretendard` → fallback: `Noto Sans KR` → `sans-serif`
- CDN: `https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css`

| 용도 | 굵기 | 크기 |
|------|------|------|
| 페이지 제목 | Bold (700) | 24px |
| 섹션 제목 | SemiBold (600) | 18px |
| 카드 제목 | SemiBold (600) | 16px |
| 본문 | Regular (400) | 14px |
| 테이블 | Regular (400) | 14px |
| 캡션 / 라벨 | Regular (400) | 12px |

---

## 레이아웃

### 사이드바

| 항목 | 값 |
|------|-----|
| 너비 | 240px |
| 배경 | `#1A1A2E` (다크 네이비) |
| 상단 | SKIPA 로고 고정 |
| 활성 메뉴 | 좌측 SK Orange(`#FF7A00`) 세로 바 3px + 텍스트 오렌지 |
| 비활성 메뉴 | 흰색 텍스트 60% 투명도 (`rgba(255,255,255,0.6)`) |
| 메뉴 아이콘 | Lucide React 아이콘 사용 권장 |
| 역할 구분 | Legal팀 / 사업부 메뉴 구성 다르게 렌더링 |

### 헤더

| 항목 | 값 |
|------|-----|
| 높이 | 64px |
| 배경 | `#FFFFFF` |
| 하단 | `1px solid #E2E8F0` |
| 우측 | 사용자 이름 + 역할 배지 표시 |

### 콘텐츠 영역

| 항목 | 값 |
|------|-----|
| 좌측 여백 | 사이드바 240px 이후 시작 |
| 내부 패딩 | 24px |
| 최대 너비 | 제한 없음 (데스크탑 기준) |

---

## 컴포넌트 스타일

### 카드

```css
background: #FFFFFF;
border-radius: 12px;
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
padding: 20px;
```

### 버튼

| 종류 | 스타일 |
|------|--------|
| Primary | SK Orange 배경 `#FF7A00` + 흰색 텍스트, `border-radius: 8px` |
| Secondary | 흰색 배경 + SK Orange 보더 + SK Orange 텍스트 |
| Danger | SK Red 배경 `#EA002C` + 흰색 텍스트 |
| Ghost | 투명 배경 + 그레이 텍스트 |

### 테이블

```css
헤더 배경: #F8FAFC
행 hover: #FFF7F0  /* SK Orange 틴트 */
border: 1px solid #E2E8F0
```

### 입력 폼 (Input)

```css
border: 1px solid #E2E8F0;
border-radius: 8px;
padding: 8px 12px;
focus: border-color: #FF7A00; box-shadow: 0 0 0 3px rgba(255,122,0,0.1);
```

### 모달

```css
background: #FFFFFF;
border-radius: 16px;
box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
```

---

## 차트 (Recharts)

### 컬러 팔레트

```javascript
const CHART_COLORS = [
  '#FF7A00', // SK Orange (Primary)
  '#EA002C', // SK Red
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#8B5CF6', // Purple
  '#94A3B8', // Gray
];
```

### 차트별 가이드

| 차트 | 컴포넌트 | 비고 |
|------|----------|------|
| 도넛 차트 | `PieChart` + `Pie` (innerRadius 설정) | 사업부 현황, 담당 특허 현황 |
| 멀티 라인 | `LineChart` + 복수 `Line` | 연도별 추이 |
| 가로 막대 | `BarChart` + `layout="vertical"` | 국가별 현황 |
| 히스토그램 | `BarChart` | 가치평가 등급 분포 |
| 트리맵 | `Treemap` | 기술 분야별 분포 |

---

## 로고 처리

### 사이드바 상단 로고

```
SKIPA
SK IP Agent
```

- **"SK"**: SK Orange `#FF7A00`, Bold
- **"IPA"**: 흰색, Bold
- 서브텍스트 "SK IP Agent": 흰색 50% 투명도, 12px

### 파비콘 / 탭 제목

```
SKIPA | 특허 관리 시스템
```

---

## Tailwind 커스텀 컬러 설정

`tailwind.config.js`에 아래 추가:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        'sk-orange': '#FF7A00',
        'sk-red': '#EA002C',
        'sk-navy': '#1A1A2E',
        'sk-orange-light': 'rgba(255, 122, 0, 0.1)',
      },
    },
  },
};
```

---

## 반응형

- **우선순위 낮음**: 데스크탑(1280px 이상) 기준으로 구현
- 모바일 대응은 추후 확장 과제
