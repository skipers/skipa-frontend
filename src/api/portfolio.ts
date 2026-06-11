import apiClient from './axios'

// ── Types ────────────────────────────────────────────

export interface TechFieldItem {
  name: string
  count: number
}

export interface CountryItem {
  country: string
  flag: string
  count: number
}

export interface DepartmentItem {
  name: string
  count: number
}

export interface GradeDistributionItem {
  name: string
  S: number
  A: number
  B: number
  C: number
  D: number
  total: number
}

export interface PortfolioDistributionResponse {
  totalPatents: number
  techFields: TechFieldItem[]
  countries: CountryItem[]
  departments: DepartmentItem[]
  gradeDistribution: GradeDistributionItem[]
}

export interface YearlyTrendItem {
  year: string
  filed: number
  registered: number
  expired: number
}

export interface AnnuityTrendItem {
  year: number
  amount: number
}

export interface PortfolioTrendsResponse {
  yearlyTrends: YearlyTrendItem[]
  annuityTrends: AnnuityTrendItem[]
}

export interface QuarterDecisionItem {
  year: string
  keep: number
  dispose: number
  inProgress: boolean
}

export interface BreakdownDecisionItem {
  name: string
  keep: number
  dispose: number
}

export interface PortfolioDecisionResponse {
  quarters: QuarterDecisionItem[]
  byDepartment: BreakdownDecisionItem[]
  byTechField: BreakdownDecisionItem[]
}

export interface PortfolioInsightItem {
  type: string
  icon: string
  text: string
}

// ── API ──────────────────────────────────────────────

export const portfolioApi = {
  getPortfolioDistribution: async (): Promise<PortfolioDistributionResponse> => {
    return apiClient.get('/portfolio/distribution')
  },

  getPortfolioTrends: async (): Promise<PortfolioTrendsResponse> => {
    return apiClient.get('/portfolio/trends')
  },

  getPortfolioDecisions: async (): Promise<PortfolioDecisionResponse> => {
    return apiClient.get('/portfolio/decisions')
  },

  getPortfolioInsights: async (): Promise<PortfolioInsightItem[]> => {
    return apiClient.get('/portfolio/insights')
  },
}
