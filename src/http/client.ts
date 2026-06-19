// DEPRECATED: 모든 API 호출은 src/api/ 모듈을 사용하세요. 이 파일은 삭제 예정입니다.
import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios'

// ============================================================
// 토큰 스토리지 헬퍼
// ============================================================

const TOKEN_KEY = 'skipa_access_token'
const LEGACY_REFRESH_KEY = 'skipa_refresh_token'

export const tokenStorage = {
  getAccess: () => localStorage.getItem(TOKEN_KEY),
  setAccess: (token: string) => {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.removeItem(LEGACY_REFRESH_KEY)
  },
  clear: () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(LEGACY_REFRESH_KEY)
  },
}

// ============================================================
// Axios 인스턴스
// ============================================================

const client: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'https://api.skipa.internal/v1',
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

// ============================================================
// Request 인터셉터 — access token 자동 주입
// ============================================================

client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStorage.getAccess()
  if (token && config.headers) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

// ============================================================
// 토큰 갱신 큐 (중복 갱신 방지)
// ============================================================

let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (err: unknown) => void
}> = []

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else resolve(token!)
  })
  failedQueue = []
}

// ============================================================
// Response 인터셉터 — 401 자동 갱신 + 에러 정규화
// ============================================================

client.interceptors.response.use(
  (response) => {
    // 서버가 success:false 로 200을 내려주는 경우 처리
    if (response.data?.success === false) {
      return Promise.reject(response.data.error)
    }
    return response
  },
  async (error) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }

    // 401 && 아직 재시도 안 한 요청
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // 이미 갱신 중이면 큐에 쌓아서 대기
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          if (originalRequest.headers) {
            (originalRequest.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
          }
          return client(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL ?? 'https://api.skipa.internal/v1'}/auth/refresh`,
          {},
          { withCredentials: true },
        )
        const newToken: string = data.data.accessToken
        tokenStorage.setAccess(newToken)
        processQueue(null, newToken)

        if (originalRequest.headers) {
          (originalRequest.headers as Record<string, string>)['Authorization'] = `Bearer ${newToken}`
        }
        return client(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        tokenStorage.clear()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    // 403 — 권한 없음 (페이지 이동은 router에서 처리, 여기선 에러만 던짐)
    if (error.response?.status === 403) {
      return Promise.reject({
        code: 'FORBIDDEN',
        message: '접근 권한이 없습니다.',
      })
    }

    // 그 외 서버 에러 정규화
    const serverError = error.response?.data?.error
    return Promise.reject(
      serverError ?? {
        code: 'UNKNOWN_ERROR',
        message: error.message ?? '알 수 없는 오류가 발생했습니다.',
      },
    )
  },
)

export default client
