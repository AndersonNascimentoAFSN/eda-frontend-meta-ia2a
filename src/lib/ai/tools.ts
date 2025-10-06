import { tool } from 'ai'
import { z } from 'zod'
import { EdaService } from '@/services/eda-service'
import { AnalysisTypeEnum } from '@/types/eda'

// Armazenar análises ativas na sessão
const activeAnalyses = new Map<string, string>()

export const uploadAndAnalyzeDataTool = tool({
  description: 'Upload a CSV file and start data analysis. This tool handles the complete flow: gets presigned URL, uploads file to R2, and starts analysis.',
  inputSchema: z.object({
    fileName: z.string().describe('Name of the CSV file to upload'),
    fileContent: z.string().describe('Base64 encoded content of the CSV file'),
    analysisType: z.enum(AnalysisTypeEnum).optional().describe('Type of analysis to perform (optional)')
  }),
  execute: async ({ fileName, fileContent, analysisType }) => {
    try {
      console.log('🔧 Starting uploadAndAnalyzeDataTool with:', { fileName, analysisType, contentLength: fileContent.length })

      // Converter base64 para File
      const byteCharacters = atob(fileContent)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const file = new File([byteArray], fileName, { type: 'text/csv' })

      console.log('📁 File created:', { name: file.name, size: file.size, type: file.type })

      // 1. Obter URL pré-assinada
      console.log('🔗 Getting presigned URL...')
      const presignedData = await EdaService.getPresignedUrl(fileName)
      console.log('✅ Got presigned URL:', presignedData)

      // 2. Upload para R2
      console.log('⬆️ Uploading to R2...')
      await EdaService.uploadToR2(presignedData.upload_url, file)
      console.log('✅ File uploaded to R2 successfully')

      // 3. Iniciar análise
      console.log('🚀 Starting analysis...')
      const analysisResponse = await EdaService.startAnalysis({
        file_key: presignedData.file_key,
        analysis_type: analysisType
      })
      console.log('✅ Analysis started:', analysisResponse)

      // Armazenar ID da análise
      activeAnalyses.set('current', analysisResponse.analysis_id)

      return {
        success: true,
        analysisId: analysisResponse.analysis_id,
        message: `Análise iniciada com sucesso! ID da análise: ${analysisResponse.analysis_id}. Status: ${analysisResponse.status}`,
        status: analysisResponse.status,
        fileName: fileName
      }
    } catch (error) {
      console.error('❌ Error in uploadAndAnalyzeDataTool:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        message: `Falha ao fazer upload e analisar os dados: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
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