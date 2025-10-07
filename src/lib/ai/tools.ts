import { tool } from 'ai'
import { z } from 'zod'
import { checkAnalysisStatusAction, getAnalysisResultAction } from '@/app/actions/upload'

// Função helper para extrair ID de análise de texto
function extractAnalysisId(text: string): string | null {
  // Patterns para encontrar IDs de análise
  const patterns = [
    /\[ID da análise:\s+([a-f0-9-]{36})\]/i,  // "[ID da análise: abc123-def456-...]"
    /ID\s+([a-f0-9-]{36})/i,  // "ID abc123-def456-..."
    /Análise iniciada.*ID\s+([a-f0-9-]{36})/i,  // "Análise iniciada: ID abc123..."
    /([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i  // UUID direto
  ]
  
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      return match[1] || match[0]
    }
  }
  
  return null
}

export const checkAnalysisStatusTool = tool({
  description: 'Check the status of a data analysis. Use this tool to monitor analysis progress and get results when complete.',
  inputSchema: z.object({
    analysisId: z.string().optional().describe('Analysis ID to check. If not provided, will try to extract from recent conversation context.')
  }),
  execute: async ({ analysisId }) => {
    try {
      const targetAnalysisId = analysisId

      // Se não foi fornecido um ID, solicitar que o usuário forneça
      if (!targetAnalysisId) {
        return {
          success: false,
          message: 'Para verificar o status da análise, preciso do ID da análise. Por favor, me informe qual é o ID da análise que você gostaria de verificar.'
        }
      }

      const result = await checkAnalysisStatusAction(targetAnalysisId)

      if (!result.success) {
        return {
          success: false,
          message: result.error || 'Erro ao verificar status da análise'
        }
      }

      return {
        success: true,
        analysisId: targetAnalysisId,
        status: result.data?.status,
        progress: result.data?.progress,
        message: result.data?.message,
        isComplete: result.data?.status === 'completed'
      }
    } catch (error) {
      console.error('Error checking analysis status:', error)
      return {
        success: false,
        message: `Erro ao verificar status da análise: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      }
    }
  }
})

export const getAnalysisResultTool = tool({
  description: 'Get detailed results of a completed data analysis including statistical summaries, correlations, and insights.',
  inputSchema: z.object({
    analysisId: z.string().optional().describe('Analysis ID to get results for. If not provided, will ask user to provide the ID.')
  }),
  execute: async ({ analysisId }) => {
    try {
      const targetAnalysisId = analysisId

      if (!targetAnalysisId) {
        return {
          success: false,
          message: 'Para obter os resultados da análise, preciso do ID da análise. Por favor, me informe qual é o ID da análise da qual você gostaria de ver os resultados.'
        }
      }

      const result = await getAnalysisResultAction(targetAnalysisId)

      if (!result.success) {
        return {
          success: false,
          message: result.error || 'Erro ao obter resultados da análise'
        }
      }

      return {
        success: true,
        analysisId: targetAnalysisId,
        results: result.data?.results,
      }
    } catch (error) {
      console.error('Error getting analysis results:', error)
      return {
        success: false,
        message: `Erro ao obter resultados da análise: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      }
    }
  }
})

export const extractAnalysisIdTool = tool({
  description: 'Extract analysis ID from recent conversation context. Use when you need to find the analysis ID from recent upload messages.',
  inputSchema: z.object({
    searchText: z.string().describe('Text to search for analysis ID patterns (usually recent upload message)')
  }),
  execute: async ({ searchText }) => {
    try {
      const analysisId = extractAnalysisId(searchText)
      
      if (analysisId) {
        return {
          success: true,
          analysisId: analysisId,
          message: `ID de análise encontrado: ${analysisId}`
        }
      } else {
        return {
          success: false,
          message: 'Nenhum ID de análise encontrado no texto fornecido. Por favor, verifique se há um ID válido na conversa recente.'
        }
      }
    } catch (error) {
      return {
        success: false,
        message: `Erro ao extrair ID: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      }
    }
  }
})

// Função removida - não é mais necessária