<template>
  <div class="login-root">
    <!-- 배경 장식 -->
    <div class="bg-grid" />
    <div class="bg-glow bg-glow--1" />
    <div class="bg-glow bg-glow--2" />

    <div class="login-wrapper">
      <!-- 왼쪽 브랜드 패널 -->
      <aside class="brand-panel">
        <div class="brand-panel__inner">
          <div class="brand-logo">
            <span class="brand-logo__icon">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path d="M4 14 L14 4 L24 14 L14 24 Z" fill="currentColor" opacity="0.15"/>
                <path d="M4 14 L14 4 L24 14" stroke="currentColor" stroke-width="2" stroke-linejoin="round" fill="none"/>
                <path d="M8 18 L14 12 L20 18 L14 24 Z" fill="currentColor" opacity="0.6"/>
                <circle cx="14" cy="14" r="2.5" fill="currentColor"/>
              </svg>
            </span>
            <span class="brand-logo__text">SKIPA</span>
          </div>

          <div class="brand-copy">
            <h1 class="brand-copy__headline">
              특허 포트폴리오,<br />
              AI로 더 정밀하게
            </h1>
            <p class="brand-copy__sub">
              AI 기반 특허 재평가 플랫폼.<br />
              보유 특허의 가치를 정확히 파악하고<br />
              전략적 의사결정을 지원합니다.
            </p>
          </div>

          <!-- 기능 하이라이트 -->
          <ul class="feature-list">
            <li class="feature-item" v-for="f in features" :key="f.label">
              <span class="feature-item__dot" />
              <span>{{ f.label }}</span>
            </li>
          </ul>

          <!-- 하단 장식 -->
          <div class="brand-panel__footer">
            <span class="badge-ai">
              <span class="badge-ai__pulse" />
              AI 분석 엔진 가동 중
            </span>
          </div>
        </div>
      </aside>

      <!-- 오른쪽 폼 패널 -->
      <main class="form-panel">
        <div class="form-panel__inner">
          <div class="form-header">
            <p class="form-header__eyebrow">환영합니다</p>
            <h2 class="form-header__title">로그인</h2>
            <p class="form-header__desc">계정에 로그인하여 특허 관리를 시작하세요</p>
          </div>

          <form class="login-form" @submit.prevent="handleSubmit" novalidate>
            <!-- 아이디 -->
            <div class="field" :class="{ 'field--error': errors.id }">
              <label class="field__label" for="login-id">아이디</label>
              <div class="field__input-wrap">
                <span class="field__icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </span>
                <input
                  id="login-id"
                  v-model="form.id"
                  type="text"
                  class="field__input"
                  placeholder="아이디를 입력하세요"
                  autocomplete="username"
                  @input="clearError('id')"
                />
              </div>
              <p v-if="errors.id" class="field__error">{{ errors.id }}</p>
            </div>

            <!-- 비밀번호 -->
            <div class="field" :class="{ 'field--error': errors.password }">
              <label class="field__label" for="login-pw">비밀번호</label>
              <div class="field__input-wrap">
                <span class="field__icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </span>
                <input
                  id="login-pw"
                  v-model="form.password"
                  :type="showPassword ? 'text' : 'password'"
                  class="field__input"
                  placeholder="비밀번호를 입력하세요"
                  autocomplete="current-password"
                  @input="clearError('password')"
                />
                <button
                  type="button"
                  class="field__toggle"
                  @click="showPassword = !showPassword"
                  :aria-label="showPassword ? '비밀번호 숨기기' : '비밀번호 보기'"
                >
                  <svg v-if="!showPassword" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                </button>
              </div>
              <p v-if="errors.password" class="field__error">{{ errors.password }}</p>
            </div>

            <!-- 서버 에러 -->
            <transition name="shake">
              <div v-if="serverError" class="alert-error">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {{ serverError }}
              </div>
            </transition>

            <!-- 제출 버튼 -->
            <button type="submit" class="btn-submit" :disabled="loading">
              <span v-if="!loading" class="btn-submit__inner">
                로그인
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </span>
              <span v-else class="btn-submit__loading">
                <span class="spinner" />
                인증 중...
              </span>
            </button>
          </form>

          <p class="form-footer">
            © 2026 SKIPA · SK IP Analytics
          </p>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const form = reactive({ id: '', password: '' })
const errors = reactive<{ id?: string; password?: string }>({})
const serverError = ref('')
const loading = ref(false)
const showPassword = ref(false)

const features = [
  { label: 'AI 기반 특허 가치 자동 평가' },
  { label: '분기별 재평가 워크플로우 관리' },
  { label: '사업부 협업 의견 수렴 시스템' },
  { label: '포트폴리오 분석 대시보드' },
]

function clearError(field: 'id' | 'password') {
  delete errors[field]
  serverError.value = ''
}

function validate() {
  let valid = true
  if (!form.id.trim()) {
    errors.id = '아이디를 입력해주세요.'
    valid = false
  }
  if (!form.password.trim()) {
    errors.password = '비밀번호를 입력해주세요.'
    valid = false
  }
  return valid
}

async function handleSubmit() {
  if (!validate()) return
  loading.value = true
  serverError.value = ''
  try {
    await auth.login({ id: form.id, password: form.password })
    const redirect = route.query.redirect as string
    if (auth.isLegal || auth.isAdmin) {
      router.push(redirect || '/legal/home')
    } else {
      router.push(redirect || '/biz/home')
    }
  } catch (err: any) {
    serverError.value = err?.message ?? '로그인에 실패했습니다. 다시 시도해주세요.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* ── 토큰 ────────────────────────────────────────────── */
:root {
  --c-bg: #f5f4f0;
  --c-surface: #ffffff;
  --c-navy: #0f172a;
  --c-navy-mid: #1e293b;
  --c-indigo: #4f46e5;
  --c-indigo-light: #6366f1;
  --c-indigo-pale: #eef2ff;
  --c-muted: #64748b;
  --c-border: #e2e8f0;
  --c-error: #dc2626;
  --c-error-bg: #fef2f2;
  --radius: 14px;
  --font-sans: 'Pretendard', 'Apple SD Gothic Neo', sans-serif;
  --font-display: 'Pretendard', sans-serif;
}

/* ── 루트 ────────────────────────────────────────────── */
.login-root {
  min-height: 100vh;
  background-color: #f5f4f0;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  font-family: var(--font-sans);
}

/* ── 배경 그리드 ──────────────────────────────────────── */
.bg-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(79, 70, 229, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(79, 70, 229, 0.04) 1px, transparent 1px);
  background-size: 48px 48px;
  pointer-events: none;
}

.bg-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  pointer-events: none;
}
.bg-glow--1 {
  width: 500px; height: 500px;
  top: -120px; left: -100px;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, transparent 70%);
}
.bg-glow--2 {
  width: 400px; height: 400px;
  bottom: -80px; right: -60px;
  background: radial-gradient(circle, rgba(79, 70, 229, 0.08) 0%, transparent 70%);
}

/* ── 래퍼 ────────────────────────────────────────────── */
.login-wrapper {
  position: relative;
  z-index: 1;
  width: min(960px, 94vw);
  display: grid;
  grid-template-columns: 1fr 1fr;
  min-height: 580px;
  border-radius: 24px;
  overflow: hidden;
  box-shadow:
    0 0 0 1px rgba(15, 23, 42, 0.06),
    0 4px 6px -1px rgba(15, 23, 42, 0.04),
    0 24px 48px -12px rgba(15, 23, 42, 0.12);
}

/* ── 브랜드 패널 (좌) ─────────────────────────────────── */
.brand-panel {
  background: linear-gradient(145deg, #0f172a 0%, #1e293b 60%, #1e1b4b 100%);
  color: #fff;
  display: flex;
  flex-direction: column;
  padding: 48px 44px;
  position: relative;
  overflow: hidden;
}

.brand-panel::before {
  content: '';
  position: absolute;
  top: -60px; right: -60px;
  width: 300px; height: 300px;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, transparent 65%);
  pointer-events: none;
}
.brand-panel::after {
  content: '';
  position: absolute;
  bottom: -40px; left: -40px;
  width: 200px; height: 200px;
  background: radial-gradient(circle, rgba(79, 70, 229, 0.15) 0%, transparent 65%);
  pointer-events: none;
}

.brand-panel__inner {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.brand-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 52px;
}

.brand-logo__icon {
  width: 40px; height: 40px;
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #a5b4fc;
}

.brand-logo__text {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: #fff;
}

.brand-copy__headline {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.3;
  color: #fff;
  margin: 0 0 16px;
  letter-spacing: -0.02em;
}

.brand-copy__sub {
  font-size: 14px;
  line-height: 1.8;
  color: rgba(255,255,255,0.55);
  margin: 0 0 40px;
}

.feature-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: rgba(255,255,255,0.7);
}

.feature-item__dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: #6366f1;
  flex-shrink: 0;
  box-shadow: 0 0 6px rgba(99, 102, 241, 0.8);
}

.brand-panel__footer {
  margin-top: auto;
  padding-top: 40px;
}

.badge-ai {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: rgba(255,255,255,0.6);
  background: rgba(255,255,255,0.07);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 20px;
  padding: 6px 14px;
}

.badge-ai__pulse {
  width: 7px; height: 7px;
  border-radius: 50%;
  background: #4ade80;
  flex-shrink: 0;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.4); }
  50% { opacity: 0.7; box-shadow: 0 0 0 5px rgba(74, 222, 128, 0); }
}

/* ── 폼 패널 (우) ─────────────────────────────────────── */
.form-panel {
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 44px;
}

.form-panel__inner {
  width: 100%;
  max-width: 340px;
}

.form-header {
  margin-bottom: 36px;
}

.form-header__eyebrow {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #6366f1;
  margin: 0 0 8px;
}

.form-header__title {
  font-size: 26px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 8px;
  letter-spacing: -0.02em;
}

.form-header__desc {
  font-size: 13.5px;
  color: #64748b;
  margin: 0;
  line-height: 1.5;
}

/* ── 폼 필드 ──────────────────────────────────────────── */
.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field__label {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  letter-spacing: 0.01em;
}

.field__input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.field__icon {
  position: absolute;
  left: 14px;
  color: #94a3b8;
  display: flex;
  pointer-events: none;
}

.field__input {
  width: 100%;
  padding: 12px 14px 12px 42px;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  font-size: 14px;
  font-family: var(--font-sans);
  color: #0f172a;
  background: #fafafa;
  outline: none;
  transition: border-color 0.18s, box-shadow 0.18s, background 0.18s;
  box-sizing: border-box;
}

.field__input::placeholder {
  color: #cbd5e1;
}

.field__input:focus {
  border-color: #6366f1;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.field--error .field__input {
  border-color: #dc2626;
  background: #fff;
}

.field--error .field__input:focus {
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
}

.field__toggle {
  position: absolute;
  right: 14px;
  background: none;
  border: none;
  cursor: pointer;
  color: #94a3b8;
  display: flex;
  padding: 0;
  transition: color 0.15s;
}
.field__toggle:hover { color: #475569; }

.field__error {
  font-size: 12px;
  color: #dc2626;
  margin: 0;
}

/* ── 서버 에러 ────────────────────────────────────────── */
.alert-error {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 10px;
  font-size: 13.5px;
  color: #dc2626;
}

.shake-enter-active {
  animation: shake 0.35s ease;
}
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%       { transform: translateX(-6px); }
  40%       { transform: translateX(6px); }
  60%       { transform: translateX(-4px); }
  80%       { transform: translateX(4px); }
}

/* ── 제출 버튼 ────────────────────────────────────────── */
.btn-submit {
  width: 100%;
  padding: 13px;
  background: linear-gradient(135deg, #4f46e5, #6366f1);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  font-family: var(--font-sans);
  cursor: pointer;
  transition: opacity 0.18s, transform 0.18s, box-shadow 0.18s;
  box-shadow: 0 4px 14px rgba(79, 70, 229, 0.35);
  margin-top: 4px;
}

.btn-submit:hover:not(:disabled) {
  opacity: 0.92;
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(79, 70, 229, 0.4);
}

.btn-submit:active:not(:disabled) {
  transform: translateY(0);
}

.btn-submit:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.btn-submit__inner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-submit__loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.spinner {
  width: 16px; height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ── 하단 ─────────────────────────────────────────────── */
.form-footer {
  margin-top: 32px;
  text-align: center;
  font-size: 11.5px;
  color: #cbd5e1;
}

/* ── 반응형 ───────────────────────────────────────────── */
@media (max-width: 680px) {
  .login-wrapper {
    grid-template-columns: 1fr;
    min-height: unset;
  }
  .brand-panel {
    padding: 36px 32px 32px;
  }
  .brand-copy__headline { font-size: 22px; }
  .brand-panel__footer { display: none; }
  .form-panel {
    padding: 36px 32px 40px;
  }
}
</style>
