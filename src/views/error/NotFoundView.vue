<template>
  <div class="error-page">
    <div class="error-page__inner">
      <div class="error-page__code">404</div>
      <h1 class="error-page__title">페이지를 찾을 수 없습니다</h1>
      <p class="error-page__desc">요청하신 페이지가 존재하지 않거나 이동되었습니다.</p>
      <button class="error-page__btn" @click="$router.back()">이전 페이지로</button>
    </div>
  </div>
</template>

<script setup lang="ts"></script>

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
