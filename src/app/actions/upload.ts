'use server'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

interface PresignedUrlResponse {
  upload_url: string
  file_key: string
}

interface AnalysisStartRequest {
  file_key: string
  analysis_type: string
}

interface AnalysisStartResponse {
  analysis_id: string
  status: string
  message?: string
}

export async function uploadFileAction(formData: FormData) {
  try {
    const file = formData.get('file') as File
    
    if (!file) {
      return {
        success: false,
        error: 'Nenhum arquivo fornecido'
      }
    }

    // Validar tipo de arquivo
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      return {
        success: false,
        error: 'Formato de arquivo inválido. Por favor, selecione apenas arquivos CSV (.csv).'
      }
    }

    // Passo 1: Obter URL presignada
    const presignedResponse = await fetch(`${API_BASE_URL}/api/v1/r2/presigned-upload/?filename=${file.name}&folder=uploads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!presignedResponse.ok) {
      const errorText = await presignedResponse.text()
      throw new Error(`Erro ao obter URL de upload: ${presignedResponse.statusText} - ${errorText}`)
    }

    const presignedData: PresignedUrlResponse = await presignedResponse.json()

    // Passo 2: Upload para R2
    const uploadResponse = await fetch(presignedData.upload_url, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': 'text/csv',
      },
    })

    if (!uploadResponse.ok) {
      throw new Error(`Erro no upload: ${uploadResponse.statusText}`)
    }

    // Passo 3: Iniciar análise
    const analysisRequest: AnalysisStartRequest = {
      file_key: presignedData.file_key,
      analysis_type: 'basic_eda' // ou 'advanced_stats'
    }

    const analysisResponse = await fetch(`${API_BASE_URL}/api/v1/analysis/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(analysisRequest),
    })

    if (!analysisResponse.ok) {
      const errorText = await analysisResponse.text()
      throw new Error(`Erro ao iniciar análise: ${analysisResponse.statusText} - ${errorText}`)
    }

    const analysisData: AnalysisStartResponse = await analysisResponse.json()

    return {
      success: true,
      data: {
        fileName: file.name,
        fileSize: file.size,
        analysisId: analysisData.analysis_id,
        status: analysisData.status,
        fileKey: presignedData.file_key
      }
    }

  } catch (error) {
    console.error('Error in uploadFileAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido durante o upload'
    }
  }
}

export async function checkAnalysisStatusAction(analysisId: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/analysis/status/${analysisId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Erro ao verificar status: ${response.statusText}`)
    }

    const statusData = await response.json()

    return {
      success: true,
      data: statusData
    }

  } catch (error) {
    console.error('Error in checkAnalysisStatusAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao verificar status'
    }
  }
}

export async function getAnalysisResultAction(analysisId: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/analysis/results/${analysisId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Erro ao obter resultados: ${response.statusText}`)
    }

    const resultData = await response.json()

    return {
      success: true,
      data: resultData
    }

  } catch (error) {
    console.error('Error in getAnalysisResultAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao obter resultados'
    }
  }
}