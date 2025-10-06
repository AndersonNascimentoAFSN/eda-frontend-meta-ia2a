/* eslint-disable @typescript-eslint/no-explicit-any */
export interface PresignedUrlRequest {
  filename: string;
  folder: string
  content_type?: string
}

export interface PresignedUrlResponse {
  upload_url: string;
  success: boolean
  file_url: string;
  file_key: string;
  content_type: string
  max_file_size_mb: number // 100
}

export enum AnalysisTypeEnum {
  BASIC_EDA = "basic_eda",
  ADVANCED_STATS = "advanced_stats",
  DATA_QUALITY = "data_quality",
}

export interface AnalysisStartRequest {
  file_key: string;
  analysis_type?: AnalysisTypeEnum;
}

export interface AnalysisStartResponse {
  analysis_id: string;
  status: string;
  message: string;
}

export interface AnalysisStatus {
  analysis_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  message?: string;
  created_at: string;
  updated_at: string;
}

export interface EdaAnalysisResponse {
  analysis_id: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  file_key: string
  created_at: string
  completed_at?: string
  results: EdaAnalysisResults
}

export interface EdaAnalysisResults {
  analysis_type: string
  dataset_info: DatasetInfo
  column_stats: ColumnStat[]
  correlations: CorrelationData
  data_quality: DataQuality
  summary: EdaSummary
}

/* ---------------- DATASET INFO ---------------- */
export interface DatasetInfo {
  filename: string
  rows: number
  columns: number
  memory_usage: number
  dtypes: Record<string, number>
  file_size: number | null
  column_names: string[]
  data_types: Record<string, string>
}

/* ---------------- COLUMN STATS ---------------- */
export interface ColumnStat {
  name: string
  dtype: string
  count: number
  non_null_count: number
  null_count: number
  null_percentage: number
  unique_count: number
  most_frequent?: string | null
  frequency?: number | null
  mean?: number | null
  median?: number | null
  std?: number | null
  min?: number | null
  max?: number | null
  q25?: number | null
  q75?: number | null
  cardinality?: number | null
  mode?: number | null
  variance?: number | null
  range?: number | null
  q50?: number | null
  iqr?: number | null
  skewness?: number | null
  kurtosis?: number | null
  distribution_type?: string
  normality_tests?: Record<string, any>
  outliers?: Outliers
  percentiles?: Percentiles
  most_frequent_count?: number
  most_frequent_percentage?: number
  least_frequent?: string
  least_frequent_count?: number
  top_values?: Record<string, { count: number; percentage: number }>
  frequency_distribution?: FrequencyDistribution
  potential_datetime?: boolean
  potential_numeric?: boolean
  potential_boolean?: boolean
}

export interface Outliers {
  iqr_method: {
    count: number
    percentage: number
    bounds: { lower: number; upper: number }
    values: any[]
  }
  zscore_method: {
    count: number
    percentage: number
    values: any[]
  }
}

export interface Percentiles {
  p5?: number
  p10?: number
  p25?: number
  p50?: number
  p75?: number
  p90?: number
  p95?: number
  p99?: number
}

export interface FrequencyDistribution {
  entropy: number
  gini_coefficient: number
  concentration_ratio: number
}

/* ---------------- CORRELATIONS ---------------- */
export interface CorrelationData {
  correlations: {
    pearson?: Record<string, Record<string, number>>
    spearman?: Record<string, Record<string, number>>
    kendall?: Record<string, Record<string, number>>
    summary?: {
      total_pairs: number
      strong_correlations_count: number
      max_correlation: number
    }
  }
  strong_correlations: StrongCorrelation[]
}

export interface StrongCorrelation {
  variable1: string
  variable2: string
  correlation: number
  strength: 'weak' | 'moderate' | 'strong' | 'very_strong'
  direction: 'positive' | 'negative'
}

/* ---------------- DATA QUALITY ---------------- */
export interface DataQuality {
  completeness: {
    overall_score: number
    by_column: Record<string, number>
  }
  duplicates: {
    total_rows: number
    duplicate_rows: number
    duplicate_percentage: number
    unique_rows: number
  }
  consistency: {
    high_cardinality_columns: string[]
    low_variance_columns: string[]
    potential_datetime_columns: string[]
  }
}

/* ---------------- SUMMARY ---------------- */
export interface EdaSummary {
  completeness_score: number
  numeric_columns: number
  categorical_columns: number
  datetime_columns: number
  recommendations: string[]
  analysis_type: string
  dataset_health_score: number
  key_findings: string[]
  data_distribution_summary: {
    normal_distributions: number
    skewed_distributions: number
    high_kurtosis: number
  }
  relationship_strength: {
    strong_correlations: number
    moderate_correlations: number
    weak_correlations: number
  }
  anomaly_summary: {
    total_outliers: number
    columns_with_outliers: number
  }
  next_steps: string[]
}
