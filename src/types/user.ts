// ============================================================
// User & Auth Types
// ============================================================

export type UserRole = 'ADMIN' | 'LEGAL' | 'BUSINESS'

export interface User {
  id: number
  loginId?: string
  departmentId?: number
  departmentName?: string
  name: string
  email: string
  role: UserRole
  status?: string
  createdAt?: string
  updatedAt?: string
}

export interface Department {
  id: number
  name: string
}

// Auth
export interface LoginRequest {
  id: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  user: Pick<User, 'id' | 'role' | 'departmentId'>
}

export interface RefreshResponse {
  accessToken: string
}
