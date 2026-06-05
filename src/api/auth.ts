import client from '@/http/client'
import type { LoginRequest, LoginResponse, RefreshResponse, User } from '@/types'

export const authApi = {
  login: async (body: LoginRequest): Promise<LoginResponse> => {
    const { data } = await client.post('/auth/login', body)
    return data.data
  },

  logout: async (): Promise<void> => {
    await client.post('/auth/logout')
  },

  me: async (): Promise<{ user: User }> => {
    const { data } = await client.get('/auth/me')
    return data.data
  },

  refresh: async (refreshToken: string): Promise<RefreshResponse> => {
    const { data } = await client.post('/auth/refresh', { refreshToken })
    return data.data
  },
}
