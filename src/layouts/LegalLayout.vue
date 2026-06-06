<template>
  <div class="app-shell">
    <!-- 사이드바 -->
    <aside class="sidebar">
      <div class="sidebar__inner">

        <!-- 로고 -->
        <div class="sidebar__logo">
          <span class="sidebar__logo-icon">
            <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
              <path d="M4 14 L14 4 L24 14" stroke="currentColor" stroke-width="2" stroke-linejoin="round" fill="none"/>
              <path d="M8 18 L14 12 L20 18 L14 24 Z" fill="currentColor" opacity="0.7"/>
              <circle cx="14" cy="14" r="2" fill="currentColor"/>
            </svg>
          </span>
          <span class="sidebar__logo-text">SKIPA</span>
        </div>

        <!-- 역할 배지 -->
        <div class="sidebar__role-badge">
          <span class="sidebar__role-dot" />
          Legal AI팀
        </div>

        <!-- 네비게이션 -->
        <nav class="sidebar__nav">
          <p class="sidebar__nav-label">메뉴</p>
          <RouterLink
            v-for="item in navItems"
            :key="item.name"
            :to="item.to"
            class="nav-item"
            :class="{ 'nav-item--active': isActive(item.to) }"
          >
            <span class="nav-item__icon" v-html="item.icon" />
            <span class="nav-item__label">{{ item.label }}</span>
            <span v-if="item.badge" class="nav-item__badge">{{ item.badge }}</span>
          </RouterLink>
        </nav>

        <!-- 하단 영역 -->
        <div class="sidebar__bottom">
          <!-- 사용자 정보 -->
          <div class="sidebar__user">
            <div class="sidebar__avatar">
              {{ avatarInitial }}
            </div>
            <div class="sidebar__user-info">
              <p class="sidebar__user-name">{{ auth.user?.name ?? 'Legal AI팀' }}</p>
              <p class="sidebar__user-role">{{ auth.user?.email ?? '' }}</p>
            </div>
          </div>

          <!-- 로그아웃 -->
          <button class="sidebar__logout" @click="handleLogout">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            <span>로그아웃</span>
          </button>
        </div>
      </div>

    </aside>

    <!-- 메인 콘텐츠 -->
    <div class="main-area">
      <!-- 상단 헤더 -->
      <header class="topbar">
        <div class="topbar__left">
          <h1 class="topbar__title">{{ currentPageTitle }}</h1>
        </div>
        <div class="topbar__right">
          <!-- 알림 (추후 연결) -->
          <button class="topbar__icon-btn" aria-label="알림">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </button>
        </div>
      </header>

      <!-- 페이지 콘텐츠 -->
      <main class="page-content">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const avatarInitial = computed(() => {
  const name = auth.user?.name ?? 'L'
  return name.charAt(0)
})

const navItems: { name: string; to: string; label: string; icon: string; badge?: string }[] = [
  {
    name: 'LegalHome',
    to: '/legal/home',
    label: '홈',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  },
  {
    name: 'Reevaluation',
    to: '/legal/reevaluation',
    label: '재평가 관리',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>`,
  },
  {
    name: 'Portfolio',
    to: '/legal/portfolio',
    label: '포트폴리오 분석',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
  },
  {
    name: 'Expiring',
    to: '/legal/expiring',
    label: '만료 예정 관리',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
  },
  {
    name: 'PatentSearch',
    to: '/legal/patent-search',
    label: '특허 검색',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>`,
  },
]

const pageTitleMap: Record<string, string> = {
  '/legal/home': '홈',
  '/legal/reevaluation': '재평가 관리',
  '/legal/portfolio': '포트폴리오 분석',
  '/legal/expiring': '만료 예정 관리',
  '/legal/patent-search': '특허 검색',
}

const currentPageTitle = computed(() => {
  const path = route.path
  if (path.startsWith('/legal/patent-search/')) return '특허 상세'
  return pageTitleMap[path] ?? ''
})

function isActive(to: string) {
  if (to === '/legal/patent-search') return route.path.startsWith('/legal/patent-search')
  return route.path.startsWith(to)
}

async function handleLogout() {
  await auth.logout()
  router.push('/login')
}
</script>

<style scoped>
/* ── 셸 ─────────────────────────────────────────────── */
.app-shell {
  display: flex;
  min-height: 100vh;
  background: #f5f4f0;
  font-family: 'Pretendard', 'Apple SD Gothic Neo', sans-serif;
}

/* ── 사이드바 ─────────────────────────────────────────── */
.sidebar {
  width: 240px;
  min-height: 100vh;
  background: var(--color-text);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  position: sticky;
  top: 0;
  height: 100vh;
  overflow: hidden;
}

.sidebar__inner {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 24px 0 20px;
  overflow: hidden;
}

/* 로고 */
.sidebar__logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 18px;
  margin-bottom: 6px;
  overflow: hidden;
  white-space: nowrap;
}

.sidebar__logo-icon {
  width: 36px; height: 36px;
  background: rgba(99, 102, 241, 0.15);
  border: 1px solid rgba(99, 102, 241, 0.3);
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--c-primary-300);
  flex-shrink: 0;
}

.sidebar__logo-text {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: var(--color-surface);
}

/* 역할 배지 */
.sidebar__role-badge {
  display: flex;
  align-items: center;
  gap: 7px;
  margin: 8px 18px 20px;
  padding: 5px 10px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 6px;
  font-size: 11.5px;
  color: rgba(255,255,255,0.55);
  white-space: nowrap;
  overflow: hidden;
}

.sidebar__role-dot {
  width: 6px; height: 6px;
  background: var(--color-primary);
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 0 5px rgba(99, 102, 241, 0.8);
}

/* 네비 레이블 */
.sidebar__nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0 10px;
  overflow: hidden;
}

.sidebar__nav-label {
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.25);
  padding: 0 8px;
  margin: 0 0 6px;
  white-space: nowrap;
}

/* 네비 아이템 */
.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 10px;
  border-radius: 9px;
  text-decoration: none;
  color: rgba(255,255,255,0.55);
  font-size: 13.5px;
  font-weight: 500;
  transition: background 0.15s, color 0.15s;
  white-space: nowrap;
  overflow: hidden;
  position: relative;
}

.nav-item:hover {
  background: rgba(255,255,255,0.07);
  color: rgba(255,255,255,0.85);
}

.nav-item--active {
  background: rgba(99, 102, 241, 0.18);
  color: var(--c-primary-300);
}

.nav-item--active::before {
  content: '';
  position: absolute;
  left: 0; top: 25%; bottom: 25%;
  width: 3px;
  background: var(--color-primary);
  border-radius: 0 3px 3px 0;
}

.nav-item__icon {
  display: flex;
  flex-shrink: 0;
  width: 18px;
}

.nav-item__label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nav-item__badge {
  background: var(--color-primary);
  color: var(--color-surface);
  font-size: 10px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 10px;
  flex-shrink: 0;
}

/* 하단 영역 */
.sidebar__bottom {
  padding: 16px 10px 0;
  border-top: 1px solid rgba(255,255,255,0.06);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sidebar__user {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 8px;
  border-radius: 9px;
  overflow: hidden;
  white-space: nowrap;
}


.sidebar__avatar {
  width: 32px; height: 32px;
  background: linear-gradient(135deg, var(--color-primary-dark), var(--c-violet-700));
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  color: var(--color-surface);
  flex-shrink: 0;
}

.sidebar__user-info {
  overflow: hidden;
}

.sidebar__user-name {
  font-size: 13px;
  font-weight: 600;
  color: rgba(255,255,255,0.85);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar__user-role {
  font-size: 11.5px;
  color: rgba(255,255,255,0.35);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar__logout {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  border-radius: 9px;
  background: none;
  border: none;
  cursor: pointer;
  color: rgba(255,255,255,0.35);
  font-size: 13px;
  font-family: inherit;
  transition: background 0.15s, color 0.15s;
  white-space: nowrap;
  overflow: hidden;
  width: 100%;
  text-align: left;
}

.sidebar__logout:hover {
  background: rgba(239, 68, 68, 0.12);
  color: var(--c-red-400);
}


/* ── 메인 영역 ───────────────────────────────────────── */
.main-area {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

/* 탑바 */
.topbar {
  height: 60px;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  position: sticky;
  top: 0;
  z-index: 10;
}

.topbar__title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
  letter-spacing: -0.01em;
}

.topbar__right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.topbar__search-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  background: var(--color-surface-muted);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-size: 13px;
  color: var(--c-slate-600);
  text-decoration: none;
  font-family: inherit;
  font-weight: 500;
  transition: background 0.15s, color 0.15s;
}
.topbar__search-btn:hover {
  background: var(--c-slate-150);
  color: var(--color-text);
}

.topbar__icon-btn {
  width: 36px; height: 36px;
  background: none;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--color-text-muted);
  transition: background 0.15s, color 0.15s;
}
.topbar__icon-btn:hover {
  background: var(--color-surface-muted);
  color: var(--color-text);
}

/* 페이지 콘텐츠 */
.page-content {
  flex: 1;
  padding: 32px;
  overflow-y: auto;
}

</style>
