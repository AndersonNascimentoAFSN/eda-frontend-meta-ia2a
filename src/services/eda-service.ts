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
    const maxRetries = 3
    const retryDelay = 2000 // 2 segundos
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔍 Checking analysis status for: ${analysisId} (tentativa ${attempt}/${maxRetries})`)
        console.log(`🌐 Using API_BASE_URL: ${API_BASE_URL}`)
        
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 segundos
        
        const response = await fetch(`${API_BASE_URL}/api/v1/analysis/status/${analysisId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          },
          signal: controller.signal
        })

        clearTimeout(timeoutId)
        console.log(`📊 Status response: ${response.status} ${response.statusText}`)

        if (!response.ok) {
          const error = await response.text()
          console.error(`❌ Status check failed: ${response.status} ${response.statusText} - ${error}`)
          
          // Se for erro 404 ou 500, não vale a pena tentar novamente
          if (response.status === 404 || response.status >= 500) {
            throw new Error(`Failed to get analysis status: ${response.statusText} - ${error}`)
          }
          
          // Para outros erros, tentar novamente
          if (attempt === maxRetries) {
            throw new Error(`Failed to get analysis status after ${maxRetries} attempts: ${response.statusText} - ${error}`)
          }
          continue
        }

        const result = await response.json()
        console.log(`✅ Status result:`, result)
        return result
        
      } catch (error) {
        console.error(`❌ Error in getAnalysisStatus (attempt ${attempt}):`, error)
        
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            console.log(`⏰ Request timeout on attempt ${attempt}`)
          }
          
          // Se for o último attempt, jogar o erro
          if (attempt === maxRetries) {
            if (error.name === 'AbortError') {
              throw new Error('Timeout ao verificar status da análise. O backend pode estar sobrecarregado ou a análise pode estar processando um arquivo muito grande.')
            }
            throw error
          }
        }
        
        // Aguardar antes da próxima tentativa
        if (attempt < maxRetries) {
          console.log(`⏳ Aguardando ${retryDelay}ms antes da próxima tentativa...`)
          await new Promise(resolve => setTimeout(resolve, retryDelay))
        }
      }
    }
    
    throw new Error('Failed to get analysis status after all retry attempts')
  }

  static async getAnalysisResult(analysisId: string): Promise<EdaAnalysisResponse> {
    try {
      console.log(`📋 Getting analysis results for: ${analysisId}`)
      console.log(`🌐 Using API_BASE_URL: ${API_BASE_URL}`)
      
      const response = await fetch(`${API_BASE_URL}/api/v1/analysis/results/${analysisId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        // Timeout mais longo para resultados grandes
        signal: AbortSignal.timeout(60000) // 60 segundos
      })

      console.log(`📊 Results response: ${response.status} ${response.statusText}`)

      if (!response.ok) {
        const error = await response.text()
        console.error(`❌ Results fetch failed: ${response.status} ${response.statusText} - ${error}`)
        throw new Error(`Failed to get analysis result: ${response.statusText} - ${error}`)
      }

      const result = await response.json()
      console.log(`✅ Results obtained successfully`)
      return result
    } catch (error) {
      console.error(`❌ Error in getAnalysisResult:`, error)
      if (error instanceof Error && error.name === 'TimeoutError') {
        throw new Error('Timeout ao obter resultados da análise. A análise pode estar processando um arquivo muito grande.')
      }
      throw error
    }
  }
}