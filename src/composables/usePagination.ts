import { ref, computed, watch } from 'vue'

interface UsePaginationOptions {
  defaultSize?: number
  defaultPage?: number
}

/**
 * 페이지네이션 상태 관리 composable
 *
 * @example
 * const { page, size, totalItems, totalPages, setPage, setTotal, query } = usePagination()
 * const { data } = await patentsApi.list({ ...filters, ...query.value })
 * setTotal(data.totalItems, data.totalPages)
 */
export function usePagination(options: UsePaginationOptions = {}) {
  const { defaultSize = 20, defaultPage = 1 } = options

  const page = ref(defaultPage)
  const size = ref(defaultSize)
  const totalItems = ref(0)
  const totalPages = ref(0)

  const query = computed(() => ({ page: page.value, size: size.value }))

  const hasPrev = computed(() => page.value > 1)
  const hasNext = computed(() => page.value < totalPages.value)

  function setPage(p: number) {
    page.value = Math.max(1, Math.min(p, totalPages.value || 1))
  }

  function setTotal(items: number, pages: number) {
    totalItems.value = items
    totalPages.value = pages
  }

  function reset() {
    page.value = defaultPage
    totalItems.value = 0
    totalPages.value = 0
  }

  return {
    page,
    size,
    totalItems,
    totalPages,
    query,
    hasPrev,
    hasNext,
    setPage,
    setTotal,
    reset,
  }
}
