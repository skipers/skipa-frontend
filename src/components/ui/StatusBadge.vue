<script setup>
defineProps({
  status: { type: String, required: true },
})

const styleMap = {
  '등록': 'background:rgba(16,185,129,0.1); color:#059669;',
  '만료 예정': 'background:rgba(255,122,0,0.1); color:#FF7A00;',
  '포기/만료': 'background:rgba(148,163,184,0.15); color:#64748b;',
  '회신 완료': 'background:rgba(16,185,129,0.1); color:#059669;',
  '요청 완료': 'background:rgba(59,130,246,0.1); color:#3B82F6;',
  '요청 전': 'background:rgba(148,163,184,0.15); color:#64748b;',
  '지연': 'background:rgba(234,0,44,0.1); color:#EA002C;',
  '완료': 'background:rgba(16,185,129,0.1); color:#059669;',
  '미완료': 'background:rgba(148,163,184,0.15); color:#64748b;',
  '제출 완료': 'background:rgba(16,185,129,0.1); color:#059669;',
  '미제출': 'background:rgba(245,158,11,0.1); color:#B45309;',
  '유지': 'background:rgba(16,185,129,0.1); color:#059669;',
  '포기': 'background:rgba(234,0,44,0.1); color:#EA002C;',
}
</script>

<template>
  <span
    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
    :style="styleMap[status] || 'background:rgba(148,163,184,0.15); color:#64748b;'"
  >
    {{ status }}
  </span>
</template>
