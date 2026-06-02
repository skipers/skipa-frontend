// ============================================================
// 공통 API 응답 래퍼
// ============================================================

export interface ApiSuccess<T> {
  success: true
  data: T
}

export interface ApiError {
  success: false
  error: {
    code: string
    message: string
    details?: Record<string, unknown>
  }
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError

// Pagination
export interface PaginatedData<T> {
  items: T[]
  page: number
  size: number
  totalItems: number
  totalPages: number
}

export interface PaginationQuery {
  page?: number
  size?: number
}
