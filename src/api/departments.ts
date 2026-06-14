import apiClient from './axios'
import type { PageResponse } from './patents'

export interface Department {
  id: number
  name: string
  status: string
  createdAt: string
  updatedAt: string
}

export interface DepartmentCreateRequest {
  name: string
}

export interface DepartmentUpdateRequest {
  name?: string
}

export const departmentsApi = {
  getDepartments: async (params?: { keyword?: string }): Promise<PageResponse<Department>> => {
    return apiClient.get('/departments', { params })
  },

  getDepartment: async (departmentId: number): Promise<Department> => {
    return apiClient.get(`/departments/${departmentId}`)
  },

  createDepartment: async (body: DepartmentCreateRequest): Promise<Department> => {
    return apiClient.post('/departments', body)
  },

  updateDepartment: async (departmentId: number, body: DepartmentUpdateRequest): Promise<Department> => {
    return apiClient.put(`/departments/${departmentId}`, body)
  },

  deleteDepartment: async (departmentId: number): Promise<void> => {
    return apiClient.delete(`/departments/${departmentId}`)
  },
}
