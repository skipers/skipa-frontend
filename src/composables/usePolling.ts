import { ref, onUnmounted } from 'vue'

interface PollingOptions<T> {
  /** 상태를 fetch하는 함수 */
  fetcher: () => Promise<T>
  /** 완료 조건 */
  isDone: (result: T) => boolean
  /** 실패 조건 */
  isFailed?: (result: T) => boolean
  /** 폴링 간격 ms (기본 3초) */
  interval?: number
  /** 최대 폴링 횟수 (기본 60회 = 3분) */
  maxAttempts?: number
}

/**
 * AI 보고서 생성 등 비동기 Job 상태 폴링 composable
 *
 * @example
 * const { result, status, start, stop } = usePolling({
 *   fetcher: () => patentsApi.getReportStatus(patentId, reportId),
 *   isDone: (r) => r.status === 'COMPLETED',
 *   isFailed: (r) => r.status === 'FAILED',
 * })
 * start()
 */
export function usePolling<T>(options: PollingOptions<T>) {
  const { fetcher, isDone, isFailed, interval = 3000, maxAttempts = 60 } = options

  const result = ref<T | null>(null) as { value: T | null }
  const status = ref<'idle' | 'polling' | 'done' | 'failed' | 'timeout'>('idle')
  const error = ref<unknown>(null)
  const attempts = ref(0)

  let timer: ReturnType<typeof setTimeout> | null = null

  function stop() {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }

  async function poll() {
    if (attempts.value >= maxAttempts) {
      status.value = 'timeout'
      stop()
      return
    }

    attempts.value++

    try {
      const data = await fetcher()
      result.value = data

      if (isDone(data)) {
        status.value = 'done'
        stop()
        return
      }

      if (isFailed?.(data)) {
        status.value = 'failed'
        stop()
        return
      }

      // 아직 진행 중 → 다음 폴링 예약
      timer = setTimeout(poll, interval)
    } catch (err) {
      error.value = err
      status.value = 'failed'
      stop()
    }
  }

  function start() {
    if (status.value === 'polling') return
    status.value = 'polling'
    attempts.value = 0
    poll()
  }

  function reset() {
    stop()
    status.value = 'idle'
    result.value = null
    error.value = null
    attempts.value = 0
  }

  // 컴포넌트 언마운트 시 자동 정리
  onUnmounted(stop)

  return { result, status, error, attempts, start, stop, reset }
}
