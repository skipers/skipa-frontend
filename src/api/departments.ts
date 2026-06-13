import apiClient from './axios'
import type { PageResponse } from './patents'

export interface Department {
  id: number
  name: string
  status: string
  createdAt: string
  updatedAt: string
}

export const departmentsApi = {
  getDepartments: async (): Promise<PageResponse<Department>> => {
    return apiClient.get('/departments')
  },
}
