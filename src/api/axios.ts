import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios'

const TOKEN_KEY = 'skipa_access_token'
const REFRESH_KEY = 'skipa_refresh_token'
const AUTH_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/refresh']

export const tokenStorage = {
  getAccess: () => localStorage.getItem(TOKEN_KEY),
  setAccess: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  setRefresh: (token: string) => localStorage.setItem(REFRESH_KEY, token),
  clear: () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_KEY)
  },
}

const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
  paramsSerializer: (params) => {
    const search = new URLSearchParams()
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue
      if (Array.isArray(value)) {
        value.forEach(v => search.append(key, String(v)))
      } else {
        search.append(key, String(value))
      }
    }
    return search.toString()
  },
})

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStorage.getAccess()
  if (token && config.headers && !isAuthEndpoint(config)) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

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

function isAuthEndpoint(config?: AxiosRequestConfig) {
  const url = config?.url
  if (!url) return false

  try {
    const pathname = new URL(url, config?.baseURL ?? import.meta.env.VITE_API_BASE_URL).pathname
    return AUTH_ENDPOINTS.includes(pathname)
  } catch {
    return AUTH_ENDPOINTS.some(endpoint => url.startsWith(endpoint) || url.endsWith(endpoint))
  }
}

function normalizeApiError(error: unknown) {
  if (axios.isAxiosError(error)) {
    const serverError = error.response?.data?.error
    return serverError ?? {
      code: 'UNKNOWN_ERROR',
      message: error.message ?? '알 수 없는 오류가 발생했습니다.',
    }
  }

  return error
}

apiClient.interceptors.response.use(
  (response) => {
    if (response.data?.success === false) {
      return Promise.reject(response.data.error)
    }
    // Auto-unwrap { success, data } backend response structure
    return response.data?.data !== undefined ? response.data.data : response.data
  },
  async (error) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }
    const normalizedError = normalizeApiError(error)

    if (error.response?.status === 401 && isAuthEndpoint(originalRequest)) {
      return Promise.reject(normalizedError)
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      const refreshToken = tokenStorage.getRefresh()

      if (!refreshToken) {
        tokenStorage.clear()
        window.location.href = '/login'
        return Promise.reject(normalizedError)
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          if (originalRequest.headers) {
            (originalRequest.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
          }
          return apiClient(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/auth/refresh`,
          { refreshToken },
        )
        const newToken: string = data.data.accessToken
        tokenStorage.setAccess(newToken)
        processQueue(null, newToken)

        if (originalRequest.headers) {
          (originalRequest.headers as Record<string, string>)['Authorization'] = `Bearer ${newToken}`
        }
        return apiClient(originalRequest)
      } catch (refreshError) {
        const normalizedRefreshError = normalizeApiError(refreshError)
        processQueue(normalizedRefreshError, null)
        tokenStorage.clear()
        window.location.href = '/login'
        return Promise.reject(normalizedRefreshError)
      } finally {
        isRefreshing = false
      }
    }

    if (error.response?.status === 403) {
      return Promise.reject({
        code: 'FORBIDDEN',
        message: '접근 권한이 없습니다.',
      })
    }

    return Promise.reject(
      normalizedError ?? {
        code: 'UNKNOWN_ERROR',
        message: '알 수 없는 오류가 발생했습니다.',
      },
    )
  },
)

export default apiClient
