<template>
  <div class="error-page">
    <div class="error-page__inner">
      <div class="error-page__code">403</div>
      <h1 class="error-page__title">접근 권한이 없습니다</h1>
      <p class="error-page__desc">이 페이지에 접근할 권한이 없습니다.<br />계정 역할을 확인하거나 관리자에게 문의하세요.</p>
      <button class="error-page__btn" @click="goHome">홈으로 돌아가기</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
const router = useRouter()
const auth = useAuthStore()
function goHome() {
  if (auth.isLegal || auth.isAdmin) router.push('/legal/home')
  else if (auth.isBusiness) router.push('/biz/home')
  else router.push('/login')
}
</script>

<style scoped>
.error-page {
  min-height: 100vh;
  background: #f5f4f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Pretendard', sans-serif;
}
.error-page__inner { text-align: center; }
.error-page__code {
  font-size: 88px;
  font-weight: 800;
  color: #e2e8f0;
  line-height: 1;
  margin-bottom: 16px;
  letter-spacing: -0.04em;
}
.error-page__title { font-size: 22px; font-weight: 700; color: #0f172a; margin: 0 0 12px; }
.error-page__desc { font-size: 14px; color: #64748b; line-height: 1.7; margin: 0 0 32px; }
.error-page__btn {
  padding: 11px 28px;
  background: #0f172a;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.15s;
}
.error-page__btn:hover { background: #1e293b; }
</style>
