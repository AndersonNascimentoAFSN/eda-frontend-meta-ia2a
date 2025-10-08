import { tool } from 'ai'
import { z } from 'zod'
import { EdaService } from '@/services/eda-service'
import { AnalysisTypeEnum } from '@/types/eda'

// Armazenar análises ativas na sessão
const activeAnalyses = new Map<string, string>()

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

      const status = await EdaService.getAnalysisStatus(targetAnalysisId)

      // if (status.status === 'completed') {
      //   // Se completado, buscar resultados
      //   const result = await EdaService.getAnalysisResult(targetAnalysisId)

      //   return {
      //     success: true,
      //     analysisId: result.analysis_id,
      //     status: status.status,
      //     progress: status.progress,
      //     message: status.message,
      //     results: result.results,
      //     isComplete: true
      //   }
      // } else {
      //   return {
      //     success: true,
      //     analysisId: targetAnalysisId,
      //     status: status.status,
      //     progress: status.progress,
      //     message: status.message,
      //     isComplete: false
      //   }
      // }

      return {
        success: true,
        analysisId: targetAnalysisId,
        status: status.status,
        progress: status.progress,
        message: status.message,
        isComplete: false
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        message: 'Falha ao verificar status da análise'
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

      const result = await EdaService.getAnalysisResult(targetAnalysisId)

      return {
        success: true,
        analysisId: targetAnalysisId,
        status: result.status,
        results: result.results,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        message: 'Falha ao obter resultados da análise'
      }
    }
  }
})