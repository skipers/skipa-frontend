import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { tokenStorage } from '@/api/axios'
import { useAuthStore } from '@/stores/auth'
import type { UserRole } from '@/types'

// ============================================================
// 라우트 정의
// ============================================================

const routes: RouteRecordRaw[] = [
  // ── 인증 ────────────────────────────────────────────────
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/LoginView.vue'),
    meta: { requiresAuth: false },
  },

  // ── Legal 팀 ─────────────────────────────────────────────
  {
    path: '/legal',
    component: () => import('@/layouts/LegalLayout.vue'),
    meta: { requiresAuth: true, roles: ['LEGAL', 'ADMIN'] as UserRole[] },
    children: [
      {
        path: '',
        redirect: { name: 'LegalHome' },
      },
      {
        path: 'home',
        name: 'LegalHome',
        component: () => import('@/views/legal/LegalHomeView.vue'),
      },
      {
        path: 'reevaluation',
        name: 'Reevaluation',
        component: () => import('@/views/legal/ReevaluationView.vue'),
      },
      {
        path: 'portfolio',
        name: 'Portfolio',
        component: () => import('@/views/legal/PortfolioView.vue'),
      },
      {
        path: 'expiring',
        name: 'Expiring',
        component: () => import('@/views/legal/ExpiringView.vue'),
      },
      {
        path: 'expiring/:patentId',
        name: 'LegalExpiringPatentDetail',
        component: () => import('@/views/common/PatentDetailView.vue'),
        props: (route) => ({ patentId: Number(route.params.patentId) }),
      },
      {
        path: 'patent-search',
        name: 'LegalPatentSearch',
        component: () => import('@/views/common/PatentSearchView.vue'),
      },
      {
        path: 'patent-search/:patentId',
        name: 'LegalPatentDetail',
        component: () => import('@/views/common/PatentDetailView.vue'),
        props: (route) => ({ patentId: Number(route.params.patentId) }),
      },
      {
        path: 'patents/:patentId',
        name: 'LegalPatentDetailDirect',
        component: () => import('@/views/common/PatentDetailView.vue'),
        props: (route) => ({ patentId: Number(route.params.patentId) }),
      },
      {
        path: 'patent-manage',
        name: 'LegalPatentManage',
        component: () => import('@/views/legal/LegalPatentRegisterView.vue'),
      },
      {
        path: 'patent-manage/review/:appId',
        name: 'LegalReviewDetail',
        component: () => import('@/views/legal/LegalReviewDetailView.vue'),
        props: (route) => ({ appId: Number(route.params.appId) }),
      },
    ],
  },

  // ── 사업부 ───────────────────────────────────────────────
  {
    path: '/biz',
    component: () => import('@/layouts/BusinessLayout.vue'),
    meta: { requiresAuth: true, roles: ['BUSINESS'] as UserRole[] },
    children: [
      {
        path: '',
        redirect: { name: 'BizHome' },
      },
      {
        path: 'home',
        name: 'BizHome',
        component: () => import('@/views/business/BizHomeView.vue'),
      },
      {
        path: 'review',
        name: 'ReviewStatus',
        component: () => import('@/views/business/ReviewStatusView.vue'),
      },
      {
        path: 'review/:patentId',
        name: 'ReviewPatentDetail',
        component: () => import('@/views/common/PatentDetailView.vue'),
        props: (route) => ({ patentId: Number(route.params.patentId) }),
      },
      {
        path: 'patents',
        name: 'MyPatents',
        component: () => import('@/views/business/MyPatentsView.vue'),
      },
      {
        path: 'history',
        name: 'SubmissionHistory',
        component: () => import('@/views/business/SubmissionHistoryView.vue'),
      },
      {
        path: 'pre-eval-lab',
        name: 'PreEvalLab',
        component: () => import('@/views/business/PreEvalLabView.vue'),
      },
      {
        path: 'expiring',
        name: 'BizExpiring',
        component: () => import('@/views/business/BizExpiringView.vue'),
      },
      {
        path: 'expiring/:patentId',
        name: 'BizExpiringPatentDetail',
        component: () => import('@/views/common/PatentDetailView.vue'),
        props: (route) => ({ patentId: Number(route.params.patentId) }),
      },
      {
        path: 'patent-search',
        name: 'BizPatentSearch',
        component: () => import('@/views/common/PatentSearchView.vue'),
      },
      {
        path: 'patent-search/:patentId',
        name: 'BizPatentDetail',
        component: () => import('@/views/common/PatentDetailView.vue'),
        props: (route) => ({ patentId: Number(route.params.patentId) }),
      },
      {
        path: 'patents/:patentId',
        name: 'BizPatentDetailDirect',
        component: () => import('@/views/common/PatentDetailView.vue'),
        props: (route) => ({ patentId: Number(route.params.patentId) }),
      },
      {
        path: 'patents/:id',
        name: 'ExpiredPatentDetail',
        component: () => import('@/views/business/ExpiredPatentDetailView.vue'),
        props: (route) => ({ patentId: Number(route.params.id) }),
      },
    ],
  },

  // ── 리다이렉트 & 에러 ────────────────────────────────────
  {
    path: '/',
    redirect: () => {
      // 로그인 여부에 따라 분기는 beforeEach에서 처리
      return '/login'
    },
  },
  {
    path: '/403',
    name: 'Forbidden',
    component: () => import('@/views/error/ForbiddenView.vue'),
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/error/NotFoundView.vue'),
  },
]

// ============================================================
// 라우터 인스턴스
// ============================================================

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

// ============================================================
// 전역 네비게이션 가드
// ============================================================

router.beforeEach(async (to) => {
  const requiresAuth = to.meta.requiresAuth !== false
  const allowedRoles = to.meta.roles as UserRole[] | undefined
  const hasToken = !!tokenStorage.getAccess()

  // 1. 인증 필요 없는 페이지 (로그인 등)
  if (!requiresAuth) {
    // 이미 로그인된 경우 역할별 홈으로 리다이렉트
    if (hasToken) {
      const auth = useAuthStore()
      await auth.init()
      return roleBasedHome(auth.user?.role)
    }
    return true
  }

  // 2. 토큰 없으면 로그인 페이지로
  if (!hasToken) {
    return { name: 'Login', query: { redirect: to.fullPath } }
  }

  // 3. user 정보 없으면 fetch
  const auth = useAuthStore()
  if (!auth.user) {
    await auth.init()
  }

  if (!tokenStorage.getAccess() || !auth.user) {
    return { name: 'Login', query: { redirect: to.fullPath } }
  }

  // 4. 역할 체크
  if (allowedRoles && auth.user && !allowedRoles.includes(auth.user.role)) {
    return { name: 'Forbidden' }
  }

  return true
})

// ── 역할별 홈 경로 ────────────────────────────────────────

function roleBasedHome(role?: UserRole) {
  switch (role) {
    case 'LEGAL':
    case 'ADMIN':
      return { name: 'LegalHome' }
    case 'BUSINESS':
      return { name: 'BizHome' }
    default:
      return { name: 'Login' }
  }
}

// ── meta 타입 확장 ─────────────────────────────────────────

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    roles?: UserRole[]
  }
}

export default router
