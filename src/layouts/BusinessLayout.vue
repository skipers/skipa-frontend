<template>
  <div class="app-shell">
    <aside class="sidebar">
      <div class="sidebar__inner">

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

        <div class="sidebar__role-badge">
          <span class="sidebar__role-dot sidebar__role-dot--biz" />
          반도체사업부
        </div>

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
          </RouterLink>
        </nav>

        <div class="sidebar__bottom">
          <div class="sidebar__user">
            <div class="sidebar__avatar sidebar__avatar--biz">
              {{ avatarInitial }}
            </div>
            <div class="sidebar__user-info">
              <p class="sidebar__user-name">이담당</p>
              <p class="sidebar__user-role">반도체사업부</p>
            </div>
          </div>

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

    <div class="main-area">
      <header class="topbar">
        <div class="topbar__left">
          <h1 class="topbar__title">{{ currentPageTitle }}</h1>
        </div>
        <div class="topbar__right">
          <RouterLink to="/biz/patent-search" class="topbar__search-btn">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            특허 검색
          </RouterLink>
          <NotificationDropdown />
        </div>
      </header>

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
import NotificationDropdown from '@/components/ui/NotificationDropdown.vue'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const avatarInitial = computed(() => (auth.user?.name ?? 'B').charAt(0))

const navItems = [
  {
    name: 'BizHome',
    to: '/biz/home',
    label: '홈',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  },
  {
    name: 'ReviewStatus',
    to: '/biz/review',
    label: '검토 현황',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`,
  },
  {
    name: 'MyPatents',
    to: '/biz/patents',
    label: '담당 특허 관리',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
  },
  {
    name: 'PreEvalLab',
    to: '/biz/pre-eval-lab',
    label: '사전 평가 Lab',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v11m0 0H5a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2h-4m-6 0h6"/></svg>`,
  },
  {
    name: 'PatentSearch',
    to: '/biz/patent-search',
    label: '특허 검색',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>`,
  },
]

const pageTitleMap: Record<string, string> = {
  '/biz/home': '홈',
  '/biz/review': '검토 현황',
  '/biz/patents': '담당 특허 관리',
  '/biz/pre-eval-lab': '사전 평가 Lab',
  '/biz/patent-search': '특허 검색',
}

const currentPageTitle = computed(() => {
  const path = route.path
  if (path === '/biz/patents/new') return '특허 등록'
  if (path.startsWith('/biz/patent-search/')) return '특허 상세'
  if (path.match(/^\/biz\/patents\/\d+$/)) return '특허 상세'
  return pageTitleMap[path] ?? ''
})

function isActive(to: string) {
  const isDetailPage = !!route.path.match(/^\/biz\/patent-search\/\d+$/)
  const fromParam    = route.query.from

  const isFromManagement = isDetailPage && fromParam === 'management'
  const isFromReview     = isDetailPage && fromParam === 'review'

  if (to === '/biz/review') {
    return route.path === '/biz/review' || isFromReview
  }
  if (to === '/biz/patents') {
    return route.path.startsWith('/biz/patents') || isFromManagement
  }
  if (to === '/biz/patent-search') {
    if (isFromManagement || isFromReview) return false
    return route.path.startsWith('/biz/patent-search')
  }
  return route.path.startsWith(to)
}

async function handleLogout() {
  await auth.logout()
  router.push('/login')
}
</script>

<!-- LegalLayout과 동일한 스타일 재사용 + 사업부 전용 오버라이드 -->
<style scoped>
.app-shell {
  display: flex;
  min-height: 100vh;
  background: #f5f4f0;
  font-family: 'Pretendard', 'Apple SD Gothic Neo', sans-serif;
}

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
  overflow: hidden;
}

.sidebar__inner {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 24px 0 20px;
  overflow: hidden;
}

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
/* 사업부 액센트 — 초록 */
.sidebar__role-dot--biz {
  background: #34d399;
  box-shadow: 0 0 5px rgba(52, 211, 153, 0.8);
}

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
.nav-item:hover { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.85); }
.nav-item--active { background: rgba(52, 211, 153, 0.12); color: #6ee7b7; }
.nav-item--active::before {
  content: '';
  position: absolute;
  left: 0; top: 25%; bottom: 25%;
  width: 3px;
  background: #34d399;
  border-radius: 0 3px 3px 0;
}

.nav-item__icon { display: flex; flex-shrink: 0; width: 18px; }
.nav-item__label { flex: 1; overflow: hidden; text-overflow: ellipsis; }

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
.sidebar__avatar--biz {
  background: linear-gradient(135deg, #059669, #34d399);
}

.sidebar__user-info { overflow: hidden; }
.sidebar__user-name { font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.85); margin: 0; overflow: hidden; text-overflow: ellipsis; }
.sidebar__user-role { font-size: 11.5px; color: rgba(255,255,255,0.35); margin: 0; overflow: hidden; text-overflow: ellipsis; }

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
.sidebar__logout:hover { background: rgba(239, 68, 68, 0.12); color: #f87171; }


.main-area { flex: 1; min-width: 0; display: flex; flex-direction: column; }

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
  z-index: 20;
}

.topbar__title { font-size: 16px; font-weight: 600; color: #0f172a; margin: 0; letter-spacing: -0.01em; }
.topbar__right { display: flex; align-items: center; gap: 8px; }

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
.topbar__search-btn:hover { background: #e8edf5; color: #0f172a; }

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
.topbar__icon-btn:hover { background: #f1f5f9; color: #0f172a; }

.page-content { flex: 1; padding: 32px; overflow-y: auto; }

</style>
