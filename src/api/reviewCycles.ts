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

export const reviewCyclesApi = {
  getCurrent: async (): Promise<ReviewCycleResponse> => {
    return apiClient.get('/review-cycles/current')
  },
}
