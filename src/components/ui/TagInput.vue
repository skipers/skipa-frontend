<template>
  <div class="tag-input" :class="{ 'tag-input--focused': focused }" @click="inputEl?.focus()">
    <span v-for="(tag, i) in modelValue" :key="i" class="tag-chip">
      {{ tag }}
      <button type="button" class="tag-chip__remove" @click.stop="remove(i)">×</button>
    </span>
    <input
      ref="inputEl"
      v-model="raw"
      class="tag-input__field"
      :placeholder="modelValue.length === 0 ? placeholder : ''"
      @keydown="onKeydown"
      @compositionend="onCompositionEnd"
      @blur="flush(); focused = false"
      @focus="focused = true"
      @paste.prevent="onPaste"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'

const props = withDefaults(defineProps<{
  modelValue: string[]
  placeholder?: string
}>(), { placeholder: '코드 입력 후 콤마(,) 또는 엔터(Enter)를 입력하세요' })

const emit = defineEmits<{ 'update:modelValue': [value: string[]] }>()

const raw         = ref('')
const focused     = ref(false)
const inputEl     = ref<HTMLInputElement | null>(null)
let pendingFlush  = false

function flush() {
  const current = inputEl.value?.value ?? raw.value
  const parts = current.split(',').map(s => s.trim()).filter(Boolean)
  raw.value = ''
  if (inputEl.value) inputEl.value.value = ''
  if (parts.length === 0) return
  const next = [...props.modelValue]
  for (const p of parts) {
    if (!next.includes(p)) next.push(p)
  }
  emit('update:modelValue', next)
}

function remove(i: number) {
  const next = [...props.modelValue]
  next.splice(i, 1)
  emit('update:modelValue', next)
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault()
    if (e.isComposing) {
      pendingFlush = true
      return
    }
    flush()
  } else if (e.key === 'Backspace' && !e.isComposing && raw.value === '' && props.modelValue.length > 0) {
    remove(props.modelValue.length - 1)
  }
}

function onCompositionEnd() {
  if (pendingFlush) {
    pendingFlush = false
    nextTick(flush)
  }
}

function onPaste(e: ClipboardEvent) {
  const text = e.clipboardData?.getData('text') ?? ''
  raw.value += text
  flush()
}
</script>

<style scoped>
.tag-input {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 5px;
  min-height: 36px;
  padding: 4px 8px;
  border: 1.5px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface);
  cursor: text;
  transition: border-color 0.15s;
}
.tag-input--focused { border-color: var(--color-primary); }

.tag-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  background: var(--color-primary-light, #eef2ff);
  color: var(--color-primary);
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}
.tag-chip__remove {
  background: none;
  border: none;
  padding: 0;
  line-height: 1;
  font-size: 14px;
  cursor: pointer;
  color: var(--color-primary);
  opacity: 0.6;
  display: flex;
  align-items: center;
}
.tag-chip__remove:hover { opacity: 1; }

.tag-input__field {
  border: none;
  outline: none;
  background: transparent;
  font-size: 13px;
  color: var(--color-text);
  flex: 1;
  min-width: 80px;
  padding: 2px 0;
}
.tag-input__field::placeholder { color: var(--color-text-muted); }
</style>
