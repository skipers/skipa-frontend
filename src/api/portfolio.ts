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
  byTechField: TechFieldItem[]
  byFilingCountry: CountryItem[]
  byDepartment: DepartmentItem[]
  byGrade: GradeDistributionItem[]
}

export interface YearlyTrendItem {
  year: string
  applications: number
  registrations: number
  expiries: number
}

export interface AnnuityTrendItem {
  year: number
  amount: number
}

export interface PortfolioTrendsResponse {
  yearlyPatentTrends: YearlyTrendItem[]
  yearlyAnnuityCosts: AnnuityTrendItem[]
}

export interface QuarterDecisionItem {
  quarter: string
  maintain: number
  abandon: number
}

export interface BreakdownDecisionItem {
  name: string
  maintain: number
  abandon: number
}

export interface PortfolioDecisionResponse {
  byQuarter: QuarterDecisionItem[]
  byDepartment: BreakdownDecisionItem[]
  byTechField: BreakdownDecisionItem[]
}

export interface PortfolioInsightsResponse {
  insights: string[]
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

  getPortfolioInsights: async (): Promise<PortfolioInsightsResponse> => {
    return apiClient.get('/portfolio/insights')
  },
}
