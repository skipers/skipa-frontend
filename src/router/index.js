import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/login' },
    { path: '/login', component: () => import('@/views/LoginView.vue') },

    { path: '/patents', component: () => import('@/views/patents/PatentListView.vue'), meta: { requiresAuth: true } },
    { path: '/patents/register', component: () => import('@/views/patents/PatentRegisterView.vue'), meta: { requiresAuth: true } },
    { path: '/patents/:id', component: () => import('@/views/patents/PatentDetailView.vue'), meta: { requiresAuth: true } },
    { path: '/expiring', component: () => import('@/views/ExpiringView.vue'), meta: { requiresAuth: true } },

    { path: '/legal/home', component: () => import('@/views/legal/LegalHomeView.vue'), meta: { requiresAuth: true, role: 'legal' } },
    { path: '/legal/evaluation', component: () => import('@/views/legal/LegalEvaluationView.vue'), meta: { requiresAuth: true, role: 'legal' } },
    { path: '/legal/portfolio', component: () => import('@/views/legal/LegalPortfolioView.vue'), meta: { requiresAuth: true, role: 'legal' } },
    { path: '/legal/expiring', component: () => import('@/views/legal/LegalExpiringView.vue'), meta: { requiresAuth: true, role: 'legal' } },

    { path: '/dept/home', component: () => import('@/views/dept/DeptHomeView.vue'), meta: { requiresAuth: true, role: 'dept' } },
    { path: '/dept/review', component: () => import('@/views/dept/DeptReviewView.vue'), meta: { requiresAuth: true, role: 'dept' } },
    { path: '/dept/patents', component: () => import('@/views/dept/DeptPatentsView.vue'), meta: { requiresAuth: true, role: 'dept' } },
    { path: '/dept/lab', component: () => import('@/views/dept/DeptLabView.vue'), meta: { requiresAuth: true, role: 'dept' } },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isLoggedIn) return '/login'
  if (to.meta.role === 'legal' && !auth.isLegal) return auth.isLoggedIn ? '/dept/home' : '/login'
  if (to.meta.role === 'dept' && !auth.isDept) return auth.isLoggedIn ? '/legal/home' : '/login'
})

export default router
