// ============================================================
// User & Auth Types
// ============================================================

export type UserRole = 'ADMIN' | 'LEGAL' | 'BUSINESS'

export interface User {
  id: string
  departmentId?: number
  departmentName?: string
  name: string
  email: string
  role: UserRole
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
  user: Pick<User, 'id' | 'role'> & { deptId?: string }
}

export interface RefreshResponse {
  accessToken: string
}
