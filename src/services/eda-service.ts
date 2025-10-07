import { API_BASE_URL } from '@/lib/utils'
import { PresignedUrlResponse, AnalysisStartRequest, AnalysisStartResponse, AnalysisStatus, EdaAnalysisResponse } from '@/types/eda'

export class EdaService {
  static async getPresignedUrl(fileName: string): Promise<PresignedUrlResponse> {
    const response = await fetch(`${API_BASE_URL}/api/v1/r2/presigned-upload/?filename=${fileName}&folder=uploads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to get presigned URL: ${response.statusText} - ${error}`)
    }

    return response.json()
  }

  static async uploadToR2(upload_url: string, file: File): Promise<void> {
    const response = await fetch(upload_url, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': 'text/csv',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to upload file: ${response.statusText}`)
    }
  }

  static async startAnalysis(request: AnalysisStartRequest): Promise<AnalysisStartResponse> {
    const response = await fetch(`${API_BASE_URL}/api/v1/analysis/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to start analysis: ${response.statusText} - ${error}`)
    }

    return response.json()
  }

  static async getAnalysisStatus(analysisId: string): Promise<AnalysisStatus> {
    const response = await fetch(`${API_BASE_URL}/api/v1/analysis/status/${analysisId}`)

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to get analysis status: ${response.statusText} - ${error}`)
    }

    return response.json()
  }

  static async getAnalysisResult(analysisId: string): Promise<EdaAnalysisResponse> {
    const response = await fetch(`${API_BASE_URL}/api/v1/analysis/results/${analysisId}`)

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to get analysis result: ${response.statusText} - ${error}`)
    }

    return response.json()
  }
}