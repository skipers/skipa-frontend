import apiClient from './axios'

export const adminApi = {
  approveUser: async (userId: number, departmentId: number): Promise<void> => {
    return apiClient.patch(`/admin/users/${userId}/approve`, { departmentId })
  },
}
