<template>
  <div class="app-shell">
    <!-- 사이드바 -->
    <aside class="sidebar" :class="{ 'sidebar--collapsed': collapsed }">
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
          <transition name="fade-slide">
            <span v-if="!collapsed" class="sidebar__logo-text">SKIPA</span>
          </transition>
        </div>

        <!-- 역할 배지 -->
        <transition name="fade-slide">
          <div v-if="!collapsed" class="sidebar__role-badge">
            <span class="sidebar__role-dot" />
            Legal AI팀
          </div>
        </transition>

        <!-- 네비게이션 -->
        <nav class="sidebar__nav">
          <p class="sidebar__nav-label" v-if="!collapsed">메뉴</p>
          <RouterLink
            v-for="item in navItems"
            :key="item.name"
            :to="item.to"
            class="nav-item"
            :class="{ 'nav-item--active': isActive(item.to) }"
            :title="collapsed ? item.label : undefined"
          >
            <span class="nav-item__icon" v-html="item.icon" />
            <transition name="fade-slide">
              <span v-if="!collapsed" class="nav-item__label">{{ item.label }}</span>
            </transition>
            <transition name="fade-slide">
              <span v-if="!collapsed && item.badge" class="nav-item__badge">{{ item.badge }}</span>
            </transition>
          </RouterLink>
        </nav>

        <!-- 하단 영역 -->
        <div class="sidebar__bottom">
          <!-- 사용자 정보 -->
          <div class="sidebar__user" :class="{ 'sidebar__user--compact': collapsed }">
            <div class="sidebar__avatar">
              {{ avatarInitial }}
            </div>
            <transition name="fade-slide">
              <div v-if="!collapsed" class="sidebar__user-info">
                <p class="sidebar__user-name">{{ auth.user?.name ?? 'Legal AI팀' }}</p>
                <p class="sidebar__user-role">{{ auth.user?.email ?? '' }}</p>
              </div>
            </transition>
          </div>

          <!-- 로그아웃 -->
          <button class="sidebar__logout" @click="handleLogout" :title="collapsed ? '로그아웃' : undefined">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            <transition name="fade-slide">
              <span v-if="!collapsed">로그아웃</span>
            </transition>
          </button>
        </div>
      </div>

      <!-- 접기 버튼 -->
      <button class="sidebar__toggle" @click="collapsed = !collapsed" :aria-label="collapsed ? '사이드바 펼치기' : '사이드바 접기'">
        <svg
          width="14" height="14"
          viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
          :style="{ transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.25s' }"
        >
          <path d="M15 18l-6-6 6-6"/>
        </svg>
      </button>
    </aside>

    <!-- 메인 콘텐츠 -->
    <div class="main-area">
      <!-- 상단 헤더 -->
      <header class="topbar">
        <div class="topbar__left">
          <h1 class="topbar__title">{{ currentPageTitle }}</h1>
        </div>
        <div class="topbar__right">
          <!-- 특허 검색 바로가기 -->
          <RouterLink to="/legal/patent-search" class="topbar__search-btn">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            특허 검색
          </RouterLink>
          <NotificationDropdown />
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
import { ref, computed } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import NotificationDropdown from '@/components/ui/NotificationDropdown.vue'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const collapsed = ref(false)

const avatarInitial = computed(() => {
  const name = auth.user?.name ?? 'L'
  return name.charAt(0)
})

const navItems = [
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
  if (path === '/legal/patents/new') return '특허 등록'
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
  background: #0f172a;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  position: sticky;
  top: 0;
  height: 100vh;
  transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.sidebar--collapsed {
  width: 68px;
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
  color: #a5b4fc;
  flex-shrink: 0;
}

.sidebar__logo-text {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: #fff;
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
  background: #6366f1;
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
  color: #a5b4fc;
}

.nav-item--active::before {
  content: '';
  position: absolute;
  left: 0; top: 25%; bottom: 25%;
  width: 3px;
  background: #6366f1;
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
  background: #6366f1;
  color: #fff;
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

.sidebar__user--compact {
  padding: 10px 8px;
  justify-content: center;
}

.sidebar__avatar {
  width: 32px; height: 32px;
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  color: #fff;
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
  color: #f87171;
}

/* 접기 버튼 */
.sidebar__toggle {
  position: absolute;
  right: -12px;
  top: 50%;
  transform: translateY(-50%);
  width: 24px; height: 24px;
  background: #1e293b;
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: rgba(255,255,255,0.5);
  z-index: 10;
  transition: background 0.15s, color 0.15s;
}

.sidebar__toggle:hover {
  background: #334155;
  color: #fff;
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
  background: #fff;
  border-bottom: 1px solid #e2e8f0;
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
  color: #0f172a;
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
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  color: #475569;
  text-decoration: none;
  font-family: inherit;
  font-weight: 500;
  transition: background 0.15s, color 0.15s;
}
.topbar__search-btn:hover {
  background: #e8edf5;
  color: #0f172a;
}

.topbar__icon-btn {
  width: 36px; height: 36px;
  background: none;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #64748b;
  transition: background 0.15s, color 0.15s;
}
.topbar__icon-btn:hover {
  background: #f1f5f9;
  color: #0f172a;
}

/* 페이지 콘텐츠 */
.page-content {
  flex: 1;
  padding: 32px;
  overflow-y: auto;
}

/* ── 전환 애니메이션 ──────────────────────────────────── */
.fade-slide-enter-active {
  transition: opacity 0.18s, transform 0.18s;
}
.fade-slide-leave-active {
  transition: opacity 0.1s, transform 0.1s;
  position: absolute;
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(-6px);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-4px);
}
</style>
