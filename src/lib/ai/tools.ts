import { tool } from 'ai'
import { z } from 'zod'
import { EdaService } from '@/services/eda-service'
import { AnalysisTypeEnum } from '@/types/eda'

// Armazenar análises ativas na sessão
const activeAnalyses = new Map<string, string>()

export const diagnosePlatformTool = tool({
  description: 'Diagnose platform-specific issues between local and Vercel environments',
  inputSchema: z.object({}),
  execute: async () => {
    try {
      const diagnostics: Record<string, unknown> = {
        platform: typeof window !== 'undefined' ? 'client' : 'server',
        apiBaseUrl: process.env.NEXT_PUBLIC_EDA_BACKEND_URL || 'http://localhost:8000',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        vercel: process.env.VERCEL === '1',
        deployment: process.env.VERCEL_ENV || 'local'
      }

      // Teste de conectividade básica
      try {
        const response = await fetch(`${diagnostics.apiBaseUrl}/api/v1/health`, {
          method: 'GET',
          signal: AbortSignal.timeout(10000)
        })
        diagnostics.backendConnectivity = {
          status: response.status,
          ok: response.ok,
          statusText: response.statusText
        }
      } catch (error) {
        diagnostics.backendConnectivity = {
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        }
      }

      const connectivity = diagnostics.backendConnectivity as { ok?: boolean } | { error: string }
      const isOk = 'ok' in connectivity ? connectivity.ok : false

      return {
        success: true,
        diagnostics,
        message: `Diagnóstico: ${diagnostics.vercel ? 'Vercel' : 'Local'} - Backend: ${isOk ? 'OK' : 'ERRO'}`
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        message: 'Falha no diagnóstico da plataforma'
      }
    }
  }
})

export const startAnalysisFromUploadTool = tool({
  description: 'Start data analysis using a pre-uploaded CSV file. Use this after a file has been uploaded via the upload interface.',
  inputSchema: z.object({
    fileKey: z.string().describe('File key from the upload (received after successful file upload)'),
    fileName: z.string().describe('Original name of the uploaded CSV file'),
    analysisType: z.enum(AnalysisTypeEnum).optional().default(AnalysisTypeEnum.BASIC_EDA).describe('Type of analysis to perform (optional)')
  }),
  execute: async ({ fileKey, fileName, analysisType }) => {
    try {
      console.log('🔧 Starting analysis with pre-uploaded file:', { fileKey, fileName, analysisType })

      // Iniciar análise diretamente com file_key
      console.log('🚀 Starting analysis...')
      const analysisResponse = await EdaService.startAnalysis({
        file_key: fileKey,
        analysis_type: analysisType
      })
      console.log('✅ Analysis started:', analysisResponse)

      // Armazenar ID da análise
      activeAnalyses.set('current', analysisResponse.analysis_id)

      return {
        success: true,
        analysisId: analysisResponse.analysis_id,
        message: `Análise iniciada com sucesso para o arquivo "${fileName}"! ID da análise: ${analysisResponse.analysis_id}. Status: ${analysisResponse.status}`,
        status: analysisResponse.status,
        fileName: fileName,
        fileKey: fileKey
      }
    } catch (error) {
      console.error('❌ Error in startAnalysisFromUploadTool:', error)
      
      // Garantir que sempre retornamos um objeto válido
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      return {
        success: false,
        error: errorMessage,
        message: `Falha ao iniciar análise dos dados: ${errorMessage}`,
        fileName: fileName,
        fileKey: fileKey
      }
    }
  }
})

export const checkAnalysisStatusTool = tool({
  description: 'Check the status of a data analysis. Use this tool to monitor analysis progress and get results when complete.',
  inputSchema: z.object({
    analysisId: z.string().optional().describe('Analysis ID to check. If not provided, will check the most recent analysis.')
  }),
  execute: async ({ analysisId }) => {
    try {
      const targetAnalysisId = analysisId || activeAnalyses.get('current')

      if (!targetAnalysisId) {
        return {
          success: false,
          message: 'Nenhum ID de análise fornecido e nenhuma análise ativa encontrada. Por favor, inicie uma análise primeiro.'
        }
      }

      console.log(`🔍 Checking status for analysis: ${targetAnalysisId}`)
      const status = await EdaService.getAnalysisStatus(targetAnalysisId)

      return {
        success: true,
        analysisId: targetAnalysisId,
        status: status.status,
        progress: status.progress,
        message: status.message,
        isComplete: status.status === 'completed'
      }
    } catch (error) {
      console.error('❌ Error in checkAnalysisStatusTool:', error)
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      return {
        success: false,
        error: errorMessage,
        message: `Falha ao verificar status da análise: ${errorMessage}. Verifique se o backend está acessível e se a análise não expirou.`
      }
    }
  }
})

export const getAnalysisResultTool = tool({
  description: 'Get detailed results of a completed data analysis including statistical summaries, correlations, and insights.',
  inputSchema: z.object({
    analysisId: z.string().optional().describe('Analysis ID to get results for. If not provided, will get results for the most recent analysis.')
  }),
  execute: async ({ analysisId }) => {
    try {
      const targetAnalysisId = analysisId || activeAnalyses.get('current')

      if (!targetAnalysisId) {
        return {
          success: false,
          message: 'Nenhum ID de análise fornecido e nenhuma análise ativa encontrada. Por favor, inicie uma análise primeiro.'
        }
      }

      console.log(`📋 Getting results for analysis: ${targetAnalysisId}`)
      const result = await EdaService.getAnalysisResult(targetAnalysisId)

      return {
        success: true,
        analysisId: targetAnalysisId,
        status: result.status,
        results: result.results,
      }
    } catch (error) {
      console.error('❌ Error in getAnalysisResultTool:', error)
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      return {
        success: false,
        error: errorMessage,
        message: `Falha ao obter resultados da análise: ${errorMessage}. Para arquivos grandes (160MB), o processamento pode demorar mais. Verifique se a análise foi concluída antes de solicitar os resultados.`
      }
    }
  }
})