<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'

const router = useRouter()
const auth = useAuthStore()

const email = ref('')
const password = ref('')
const selectedRole = ref('legal')

function handleLogin() {
  auth.login(selectedRole.value)
  router.push(selectedRole.value === 'legal' ? '/legal/home' : '/dept/home')
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center" style="background:#F5F6FA;">
    <div class="w-full max-w-md">
      <!-- Logo -->
      <div class="text-center mb-8">
        <div class="text-4xl font-bold mb-2">
          <span style="color:#FF7A00;">SK</span><span style="color:#1A1A2E;">IPA</span>
        </div>
        <div class="text-sm text-gray-500">SK IP Agent · 특허 관리 시스템</div>
      </div>

      <!-- Card -->
      <div class="bg-white rounded-2xl p-8" style="box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <h2 class="text-xl font-semibold text-gray-800 mb-6">로그인</h2>

        <form @submit.prevent="handleLogin" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">이메일</label>
            <input
              v-model="email"
              type="email"
              placeholder="이메일을 입력하세요"
              class="w-full px-3 py-2.5 text-sm rounded-lg outline-none transition"
              style="border:1px solid #E2E8F0;"
              @focus="$event.target.style.borderColor='#FF7A00'; $event.target.style.boxShadow='0 0 0 3px rgba(255,122,0,0.1)';"
              @blur="$event.target.style.borderColor='#E2E8F0'; $event.target.style.boxShadow='none';"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">비밀번호</label>
            <input
              v-model="password"
              type="password"
              placeholder="비밀번호를 입력하세요"
              class="w-full px-3 py-2.5 text-sm rounded-lg outline-none transition"
              style="border:1px solid #E2E8F0;"
              @focus="$event.target.style.borderColor='#FF7A00'; $event.target.style.boxShadow='0 0 0 3px rgba(255,122,0,0.1)';"
              @blur="$event.target.style.borderColor='#E2E8F0'; $event.target.style.boxShadow='none';"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">역할 선택</label>
            <div class="grid grid-cols-2 gap-3">
              <button
                type="button"
                @click="selectedRole = 'legal'"
                class="py-3 rounded-lg text-sm font-medium transition-all cursor-pointer"
                :style="selectedRole === 'legal'
                  ? 'background:#FF7A00; color:#fff; border:2px solid #FF7A00;'
                  : 'background:#fff; color:#374151; border:2px solid #E2E8F0;'"
              >
                Legal팀
              </button>
              <button
                type="button"
                @click="selectedRole = 'dept'"
                class="py-3 rounded-lg text-sm font-medium transition-all cursor-pointer"
                :style="selectedRole === 'dept'
                  ? 'background:#FF7A00; color:#fff; border:2px solid #FF7A00;'
                  : 'background:#fff; color:#374151; border:2px solid #E2E8F0;'"
              >
                사업부
              </button>
            </div>
          </div>

          <button
            type="submit"
            class="w-full py-3 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 cursor-pointer mt-2"
            style="background:#FF7A00; border:none;"
          >
            로그인
          </button>
        </form>

        <p class="text-xs text-center text-gray-400 mt-5">
          데모 계정으로 바로 로그인됩니다
        </p>
      </div>
    </div>
  </div>
</template>
