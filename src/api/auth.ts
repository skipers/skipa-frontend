import apiClient from './axios'
import type { LoginResponse, RefreshResponse, User } from '@/types'

export interface RegisterRequest {
  loginId: string
  password: string
  name: string
  email: string
  role: string
  departmentId?: number
}

export const authApi = {
  login: async (loginId: string, password: string): Promise<LoginResponse> => {
    return apiClient.post('/auth/login', { loginId, password })
  },

  register: async (body: RegisterRequest): Promise<{ id: number; loginId: string; name: string; email: string; role: string; status: string }> => {
    return apiClient.post('/auth/register', body)
  },

  logout: async (): Promise<void> => {
    return apiClient.post('/auth/logout')
  },

  refresh: async (refreshToken: string): Promise<RefreshResponse> => {
    return apiClient.post('/auth/refresh', { refreshToken })
  },

  me: async (): Promise<{ user: User }> => {
    return apiClient.get('/auth/me')
  },
}
