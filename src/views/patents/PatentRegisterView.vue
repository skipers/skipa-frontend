<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'

const router = useRouter()

const form = ref({
  number: '',
  title: '',
  filingDate: '',
  expiryDate: '',
  country: '',
  dept: '',
  ipc: '',
  keywords: '',
  inventors: '',
})

const depts = ['반도체사업부', '통신사업부', '에너지사업부', '제조사업부']
const countries = ['한국', '미국', '일본', '유럽', '중국']

function handleSubmit() {
  alert('특허가 등록되었습니다.')
  router.push('/patents')
}
</script>

<template>
  <AppLayout title="특허 등록">
    <div class="max-w-2xl">
      <div class="bg-white rounded-xl p-6" style="border:1px solid #E2E8F0;">
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">특허번호</label>
              <input v-model="form.number" placeholder="예: KR-2025-0001234" class="field" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">국가</label>
              <select v-model="form.country" class="field">
                <option value="">선택</option>
                <option v-for="c in countries" :key="c">{{ c }}</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">특허명</label>
            <input v-model="form.title" placeholder="특허 명칭을 입력하세요" class="field" />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">출원일</label>
              <input v-model="form.filingDate" type="date" class="field" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">만료일</label>
              <input v-model="form.expiryDate" type="date" class="field" />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">사업부</label>
            <select v-model="form.dept" class="field">
              <option value="">선택</option>
              <option v-for="d in depts" :key="d">{{ d }}</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">IPC 분류</label>
            <input v-model="form.ipc" placeholder="예: G06T 7/00" class="field" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">키워드</label>
            <input v-model="form.keywords" placeholder="쉼표로 구분하여 입력" class="field" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">발명자</label>
            <input v-model="form.inventors" placeholder="쉼표로 구분하여 입력" class="field" />
          </div>

          <div class="flex justify-end gap-3 pt-2">
            <button type="button" @click="router.push('/patents')" class="px-5 py-2.5 text-sm rounded-lg cursor-pointer" style="border:1px solid #E2E8F0; background:#fff; color:#374151;">취소</button>
            <button type="submit" class="px-5 py-2.5 text-sm font-semibold text-white rounded-lg cursor-pointer" style="background:#FF7A00; border:none;">저장</button>
          </div>
        </form>
      </div>
    </div>
  </AppLayout>
</template>

<style scoped>
.field {
  width: 100%;
  padding: 8px 12px;
  font-size: 14px;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  outline: none;
  font-family: inherit;
}
.field:focus {
  border-color: #FF7A00;
  box-shadow: 0 0 0 3px rgba(255, 122, 0, 0.1);
}
</style>
