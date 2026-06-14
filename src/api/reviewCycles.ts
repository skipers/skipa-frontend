import apiClient from './axios'

export interface ReviewCycleResponse {
  id: number
  year: number
  quarter: number
  startDate: string
  endDate: string
  deadline: string
  createdAt: string
  updatedAt: string
}

export interface ReviewCycleCreateRequest {
  year: number
  quarter: number
  startDate: string
  endDate: string
}

export interface ReviewCycleUpdateRequest {
  year?: number
  quarter?: number
  startDate?: string
  endDate?: string
}

export const reviewCyclesApi = {
  getCurrent: async (): Promise<ReviewCycleResponse> => {
    return apiClient.get('/review-cycles/current')
  },

  getList: async (): Promise<{ items: ReviewCycleResponse[]; totalItems: number }> => {
    return apiClient.get('/review-cycles')
  },

  get: async (reviewCycleId: number): Promise<ReviewCycleResponse> => {
    return apiClient.get(`/review-cycles/${reviewCycleId}`)
  },

  create: async (body: ReviewCycleCreateRequest): Promise<ReviewCycleResponse> => {
    return apiClient.post('/review-cycles', body)
  },

  update: async (reviewCycleId: number, body: ReviewCycleUpdateRequest): Promise<ReviewCycleResponse> => {
    return apiClient.put(`/review-cycles/${reviewCycleId}`, body)
  },

  delete: async (reviewCycleId: number): Promise<void> => {
    return apiClient.delete(`/review-cycles/${reviewCycleId}`)
  },

  updateDeadline: async (reviewCycleId: number, deadline: string): Promise<ReviewCycleResponse> => {
    return apiClient.patch(`/review-cycles/${reviewCycleId}/deadline`, { deadline })
  },
}
