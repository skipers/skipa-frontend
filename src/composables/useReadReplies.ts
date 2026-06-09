import { ref } from 'vue'

const readIds = ref<Set<number>>(new Set())

export function useReadReplies() {
  function markRead(id: number) {
    readIds.value = new Set([...readIds.value, id])
  }
  return { readIds, markRead }
}
