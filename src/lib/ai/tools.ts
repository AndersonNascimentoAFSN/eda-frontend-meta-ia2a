import { tool } from 'ai'
import { z } from 'zod'
import { EdaService } from '@/services/eda-service'
import { AnalysisTypeEnum, ColumnStat } from '@/types/eda'

// Tipos para dados do gráfico
interface ChartDataPoint {
  value: string | number
  count: number
  index?: number
  x?: number | string // Para scatter plots (number) e correlações (string)
  y?: number | string // Para scatter plots (number) e correlações (string)
}

interface CorrelationChartDataPoint extends ChartDataPoint {
  x: string
  y: string
  correlationValue: number
}

interface ChartConfig {
  title: string
  xLabel: string
  yLabel: string
  width: number
  height: number
}

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

export const suggestChartColumnsTool = tool({
  description: 'Suggest appropriate columns for different chart types based on analysis results. Helps users choose the best data for visualizations.',
  inputSchema: z.object({
    analysisId: z.string().optional().describe('Analysis ID to analyze. If not provided, will use the most recent analysis.'),
    chartType: z.enum(['bar', 'histogram', 'scatter', 'boxplot', 'line']).describe('Type of chart to get column suggestions for')
  }),
  execute: async ({ analysisId, chartType }) => {
    try {
      const targetAnalysisId = analysisId || activeAnalyses.get('current')

      if (!targetAnalysisId) {
        return {
          success: false,
          message: 'Nenhum ID de análise fornecido e nenhuma análise ativa encontrada. Por favor, inicie uma análise primeiro.'
        }
      }

      console.log(`🎯 Sugerindo colunas para gráfico ${chartType} da análise: ${targetAnalysisId}`)
      const result = await EdaService.getAnalysisResult(targetAnalysisId)

      if (!result.results || !result.results.column_stats) {
        return {
          success: false,
          message: 'Resultados da análise não disponíveis ou incompletos'
        }
      }

      const columnStats = result.results.column_stats
      
      // Verificar se column_stats está vazio mas há dados de correlação disponíveis
      if (columnStats.length === 0 && result.results.correlations?.correlations) {
        console.log('⚠️ column_stats vazio, mas correlações disponíveis. Usando dados de correlação para sugestões limitadas.')
        
        const correlations = result.results.correlations.correlations as Record<string, Record<string, number>>
        const numericColumns = Object.keys(correlations)
        
        // Para scatter plots, podemos usar as colunas das correlações
        if (chartType === 'scatter' && numericColumns.length >= 2) {
          const pairs = []
          for (let i = 0; i < numericColumns.length; i++) {
            for (let j = i + 1; j < numericColumns.length; j++) {
              const col1 = numericColumns[i]
              const col2 = numericColumns[j]
              const correlation = Math.abs(correlations[col1]?.[col2] || 0)
              
              pairs.push({
                x_column: col1,
                y_column: col2,
                correlation: correlation,
                relationship: correlation > 0.7 ? 'Forte' : correlation > 0.4 ? 'Moderada' : 'Fraca'
              })
            }
          }

          const suggestions: Record<string, unknown> = {
            chart_type: chartType,
            recommended_columns: pairs.sort((a, b) => b.correlation - a.correlation).slice(0, 5),
            explanations: {
              why_these_columns: 'Baseado nas correlações disponíveis entre colunas numéricas',
              data_source: 'Dados de correlação da análise estatística',
              limitations: 'Estatísticas individuais das colunas não disponíveis, apenas correlações'
            },
            data_source_warning: 'column_stats vazio - usando dados de correlação como alternativa'
          }

          return {
            success: true,
            analysisId: targetAnalysisId,
            suggestions,
            total_recommendations: pairs.length,
            message: `Encontrei ${pairs.length} opções para gráfico de ${chartType} baseado em correlações`
          }
        }
        
        // Para outros tipos de gráfico, retornar erro específico
        return {
          success: false,
          message: `Dados de column_stats não disponíveis. Apenas gráficos de correlação podem ser gerados com os dados atuais. Tipo solicitado: ${chartType}`,
          available_chart_types: ['scatter (limitado)', 'correlation_heatmap'],
          issue: 'column_stats array vazio - backend pode não estar processando estatísticas individuais das colunas'
        }
      }
      console.log('🔍 Debug - Column stats received:', {
        totalColumns: columnStats.length,
        columns: columnStats.map((col: ColumnStat) => ({
          name: col.name,
          dtype: col.dtype,
          unique_count: col.unique_count,
          null_percentage: col.null_percentage,
          hasTopValues: !!col.top_values,
          hasStats: !!(col.mean || col.std)
        }))
      })

      const suggestions: Record<string, unknown> = {
        chart_type: chartType,
        recommended_columns: [],
        explanations: {},
        examples: {}
      }

      switch (chartType) {
        case 'bar': {
          // Sugerir colunas categóricas com boa distribuição
          const categoricalColumns = columnStats.filter((col: ColumnStat) => 
            col.dtype === 'object' && 
            col.unique_count && 
            col.unique_count >= 2 && 
            col.unique_count <= 20 && // Não muitas categorias
            col.top_values &&
            Object.keys(col.top_values).length > 0
          )

          console.log('🔍 Debug - Bar chart analysis:', {
            totalColumns: columnStats.length,
            objectColumns: columnStats.filter(col => col.dtype === 'object').length,
            withUniqueCount: columnStats.filter(col => col.unique_count).length,
            withTopValues: columnStats.filter(col => col.top_values).length,
            categoricalColumns: categoricalColumns.length,
            details: categoricalColumns.map(col => ({
              name: col.name,
              dtype: col.dtype,
              unique_count: col.unique_count,
              hasTopValues: !!col.top_values,
              topValuesKeys: col.top_values ? Object.keys(col.top_values).length : 0
            }))
          })

          suggestions.recommended_columns = categoricalColumns.map((col: ColumnStat) => ({
            name: col.name,
            unique_count: col.unique_count,
            most_frequent: col.most_frequent,
            frequency: col.frequency,
            data_quality: col.null_percentage < 5 ? 'Excelente' : col.null_percentage < 15 ? 'Boa' : 'Regular',
            top_values_preview: Object.entries(col.top_values || {}).slice(0, 3)
          }))

          suggestions.explanations = {
            why_these_columns: 'Colunas categóricas com 2-20 valores únicos são ideais para gráficos de barras',
            data_source: 'Utilizamos os "top_values" de cada coluna categórica',
            limitations: 'Mostramos apenas os 5-10 valores mais frequentes para melhor visualização'
          }

          suggestions.examples = categoricalColumns.slice(0, 3).reduce((acc: Record<string, unknown>, col: ColumnStat) => {
            acc[col.name] = {
              sample_data: Object.entries(col.top_values || {}).slice(0, 3).map(([value, data]) => ({
                category: value,
                count: typeof data === 'number' ? data : data.count
              })),
              description: `Mostra a frequência de cada ${col.name}`
            }
            return acc
          }, {})

          break
        }

        case 'histogram': {
          // Sugerir colunas numéricas
          const numericColumns = columnStats.filter((col: ColumnStat) => 
            (col.dtype === 'float64' || col.dtype === 'int64' || col.dtype === 'number') &&
            col.std && col.std > 0 // Deve ter variação
          )

          suggestions.recommended_columns = numericColumns.map((col: ColumnStat) => ({
            name: col.name,
            mean: col.mean,
            std: col.std,
            min: col.min,
            max: col.max,
            data_quality: col.null_percentage < 5 ? 'Excelente' : col.null_percentage < 15 ? 'Boa' : 'Regular',
            distribution_info: `Média: ${col.mean?.toFixed(2)}, DP: ${col.std?.toFixed(2)}`
          }))

          suggestions.explanations = {
            why_these_columns: 'Colunas numéricas com variação são perfeitas para mostrar distribuições',
            data_source: 'Utilizamos estatísticas (min, max, média, desvio padrão) para simular a distribuição',
            limitations: 'Histogramas são simulados baseados em estatísticas, não nos dados brutos'
          }

          break
        }

        case 'scatter': {
          // Sugerir pares de colunas numéricas
          const numericColumns = columnStats.filter((col: ColumnStat) => 
            (col.dtype === 'float64' || col.dtype === 'int64' || col.dtype === 'number') &&
            col.std && col.std > 0
          )

          console.log('🔍 Debug - Scatter plot analysis:', {
            totalColumns: columnStats.length,
            numericTypes: {
              float64: columnStats.filter((col: ColumnStat) => col.dtype === 'float64').length,
              int64: columnStats.filter((col: ColumnStat) => col.dtype === 'int64').length,
              number: columnStats.filter((col: ColumnStat) => col.dtype === 'number').length,
              otherTypes: columnStats.filter((col: ColumnStat) => !['float64', 'int64', 'number'].includes(col.dtype)).map((col: ColumnStat) => ({ name: col.name, dtype: col.dtype }))
            },
            withStd: columnStats.filter((col: ColumnStat) => col.std && col.std > 0).length,
            numericColumns: numericColumns.length,
            details: numericColumns.map((col: ColumnStat) => ({
              name: col.name,
              dtype: col.dtype,
              std: col.std,
              mean: col.mean,
              min: col.min,
              max: col.max
            }))
          })

          if (numericColumns.length >= 2) {
            // Sugerir os melhores pares baseados em correlações
            const correlations = result.results.correlations?.correlations?.pearson || {}
            const pairs = []

            for (let i = 0; i < numericColumns.length; i++) {
              for (let j = i + 1; j < numericColumns.length; j++) {
                const col1 = numericColumns[i]
                const col2 = numericColumns[j]
                const correlation = Math.abs(correlations[col1.name]?.[col2.name] || 0)
                
                pairs.push({
                  x_column: col1.name,
                  y_column: col2.name,
                  correlation: correlation,
                  relationship: correlation > 0.7 ? 'Forte' : correlation > 0.4 ? 'Moderada' : 'Fraca'
                })
              }
            }

            suggestions.recommended_columns = pairs
              .sort((a, b) => b.correlation - a.correlation)
              .slice(0, 5)
          }

          suggestions.explanations = {
            why_these_columns: 'Pares de colunas numéricas mostram relações entre variáveis',
            data_source: 'Geramos pontos simulados baseados nas estatísticas de cada coluna',
            limitations: 'Scatter plots são simulados, não baseados em dados reais'
          }

          break
        }

        case 'boxplot': {
          // Similar ao histogram, mas foco em quartis
          const numericColumns = columnStats.filter((col: ColumnStat) => 
            (col.dtype === 'float64' || col.dtype === 'int64' || col.dtype === 'number') &&
            col.q25 && col.q75 && col.median
          )

          suggestions.recommended_columns = numericColumns.map((col: ColumnStat) => ({
            name: col.name,
            median: col.median,
            q25: col.q25,
            q75: col.q75,
            iqr: col.iqr,
            outliers: (col.outliers?.iqr_method?.count) || 0,
            data_quality: col.null_percentage < 5 ? 'Excelente' : col.null_percentage < 15 ? 'Boa' : 'Regular'
          }))

          suggestions.explanations = {
            why_these_columns: 'Colunas numéricas com quartis calculados são ideais para boxplots',
            data_source: 'Utilizamos quartis (Q1, Q2, Q3) e valores mín/máx',
            limitations: 'Mostra estatísticas resumidas, não a distribuição completa'
          }

          break
        }

        case 'line': {
          // Sugerir colunas que podem representar séries temporais ou sequências
          const numericColumns = columnStats.filter((col: ColumnStat) => 
            (col.dtype === 'float64' || col.dtype === 'int64' || col.dtype === 'number')
          )

          const temporalColumns = columnStats.filter((col: ColumnStat) => 
            col.potential_datetime === true
          )

          suggestions.recommended_columns = [
            ...temporalColumns.map((col: ColumnStat) => ({
              name: col.name,
              type: 'temporal',
              data_quality: col.null_percentage < 5 ? 'Excelente' : 'Regular',
              note: 'Detectada como potencial coluna temporal'
            })),
            ...numericColumns.slice(0, 5).map((col: ColumnStat) => ({
              name: col.name,
              type: 'numeric',
              mean: col.mean,
              trend_simulation: 'Pode ser usado para simular tendências'
            }))
          ]

          suggestions.explanations = {
            why_these_columns: 'Colunas temporais ou numéricas para mostrar tendências ao longo do tempo',
            data_source: 'Para temporais usamos dados reais, para numéricas simulamos tendências',
            limitations: 'Gráficos de linha numéricos são simulações baseadas em estatísticas'
          }

          break
        }
      }

      return {
        success: true,
        analysisId: targetAnalysisId,
        suggestions,
        total_recommendations: Array.isArray(suggestions.recommended_columns) ? suggestions.recommended_columns.length : 0,
        message: `Encontrei ${Array.isArray(suggestions.recommended_columns) ? suggestions.recommended_columns.length : 0} opções para gráfico de ${chartType}`
      }

    } catch (error) {
      console.error('❌ Error in suggestChartColumnsTool:', error)
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      return {
        success: false,
        error: errorMessage,
        message: `Falha ao sugerir colunas: ${errorMessage}`
      }
    }
  }
})

export const generateChartDataTool = tool({
  description: 'Generate visualization data from analysis results to feed chart components. This tool extracts and transforms statistical data into chart-ready format.',
  inputSchema: z.object({
    analysisId: z.string().optional().describe('Analysis ID to generate charts for. If not provided, will use the most recent analysis.'),
    chartType: z.enum(['histogram', 'bar', 'line', 'scatter', 'correlation_heatmap', 'missing_values', 'outliers', 'distribution', 'boxplot', 'density']).describe('Type of chart to generate'),
    columnName: z.string().optional().describe('Specific column name for single-column visualizations (required for histogram, distribution, outliers, boxplot, density)'),
    xColumn: z.string().optional().describe('X-axis column name for scatter plots'),
    yColumn: z.string().optional().describe('Y-axis column name for scatter plots'),
    maxBins: z.number().optional().default(20).describe('Maximum number of bins for histograms (default: 20)')
  }),
  execute: async ({ analysisId, chartType, columnName, xColumn, yColumn, maxBins }) => {
    try {
      const targetAnalysisId = analysisId || activeAnalyses.get('current')

      if (!targetAnalysisId) {
        return {
          success: false,
          message: 'Nenhum ID de análise fornecido e nenhuma análise ativa encontrada. Por favor, inicie uma análise primeiro.'
        }
      }

      console.log(`📊 Generating chart data for analysis: ${targetAnalysisId}, type: ${chartType}`)
      const result = await EdaService.getAnalysisResult(targetAnalysisId)

      if (!result.results) {
        return {
          success: false,
          message: 'Resultados da análise não disponíveis'
        }
      }

      const { results } = result
      let chartData: ChartDataPoint[] = []
      let chartTitle = ''
      let xLabel = ''
      let yLabel = ''

      switch (chartType) {
        case 'histogram': {
          if (!columnName) {
            return {
              success: false,
              message: 'Nome da coluna é obrigatório para histogramas'
            }
          }

          const columnStats = results.column_stats?.find((col: ColumnStat) => col.name === columnName)
          if (!columnStats) {
            return {
              success: false,
              message: `Coluna '${columnName}' não encontrada nos resultados`
            }
          }

          // Gerar dados de histograma baseado nas estatísticas reais
          const min = columnStats.min || 0
          const max = columnStats.max || 100
          const mean = columnStats.mean || (min + max) / 2
          const std = columnStats.std || (max - min) / 6
          const totalCount = columnStats.count || 1000
          const binWidth = (max - min) / maxBins

          chartData = Array.from({ length: maxBins }, (_, i) => {
            const binStart = min + i * binWidth
            const binEnd = binStart + binWidth
            const binCenter = (binStart + binEnd) / 2
            
            // Frequência baseada na distribuição mais realista
            let frequency = 0
            
            if (columnStats.distribution_type === 'normal' || !columnStats.distribution_type) {
              // Distribuição normal
              frequency = Math.exp(-0.5 * Math.pow((binCenter - mean) / Math.max(std, 1), 2))
            } else if (columnStats.distribution_type === 'uniform') {
              // Distribuição uniforme
              frequency = 1
            } else if (columnStats.distribution_type === 'skewed') {
              // Distribuição assimétrica baseada no skewness
              const skewness = columnStats.skewness || 0
              frequency = Math.exp(-0.5 * Math.pow((binCenter - mean) / Math.max(std, 1), 2))
              // Ajustar pela assimetria
              if (skewness > 0) {
                frequency *= binCenter < mean ? 1.5 : 0.7
              } else if (skewness < 0) {
                frequency *= binCenter > mean ? 1.5 : 0.7
              }
            } else {
              // Fallback para distribuição normal
              frequency = Math.exp(-0.5 * Math.pow((binCenter - mean) / Math.max(std, 1), 2))
            }
            
            // Escalar para o número total de observações
            const scaledFrequency = frequency * (totalCount / maxBins) * 0.1
            const count = Math.max(1, Math.round(scaledFrequency + Math.random() * scaledFrequency * 0.3))
            
            return {
              value: Math.round(binCenter * 100) / 100, // Arredondar para 2 casas decimais
              count
            }
          }).filter(point => point.count > 0) // Remover bins vazios

          chartTitle = `Distribuição - ${columnName}`
          xLabel = columnName
          yLabel = 'Frequência'
          break
        }

        case 'missing_values': {
          const columnStats = results.column_stats || []
          chartData = columnStats
            .filter((col: ColumnStat) => col.null_percentage > 0)
            .map((col: ColumnStat) => ({
              value: col.name,
              count: col.null_percentage
            }))
            .sort((a: ChartDataPoint, b: ChartDataPoint) => b.count - a.count)
            .slice(0, 10) // Top 10 colunas com valores faltantes

          chartTitle = 'Valores Faltantes por Coluna'
          xLabel = 'Coluna'
          yLabel = 'Porcentagem de Valores Faltantes (%)'
          break
        }

        case 'correlation_heatmap': {
          // Usar correlações disponíveis diretamente dos resultados
          const correlations = results.correlations?.correlations as Record<string, Record<string, number>> || {}
          const columns = Object.keys(correlations)
          
          console.log('🔍 Debug - Correlation data available:', {
            hasCorrelations: !!results.correlations,
            columnsWithCorrelations: columns.length,
            correlationMatrix: correlations
          })
          
          const correlationData: CorrelationChartDataPoint[] = []
          columns.forEach((col1, i) => {
            columns.forEach((col2, j) => {
              if (i < j) { // Apenas metade superior da matriz
                const correlation = correlations[col1]?.[col2] || 0
                if (Math.abs(correlation) > 0.1) { // Apenas correlações significativas
                  const correlationValue = Math.round(Math.abs(correlation) * 100) / 100
                  // Formato que o Chart component espera para CorrelationDataPoint
                  correlationData.push({
                    value: correlationValue, // value deve ser o número da correlação
                    count: correlationValue, // count também para compatibilidade
                    x: col1,
                    y: col2,
                    correlationValue: correlationValue
                  })
                }
              }
            })
          })

          chartData = correlationData
            .sort((a: CorrelationChartDataPoint, b: CorrelationChartDataPoint) => b.correlationValue - a.correlationValue)
            .slice(0, 15)
          chartTitle = 'Correlações Mais Fortes'
          xLabel = 'Variável 1'
          yLabel = 'Variável 2'
          break
        }

        case 'outliers': {
          if (!columnName) {
            return {
              success: false,
              message: 'Nome da coluna é obrigatório para análise de outliers'
            }
          }

          const columnStats = results.column_stats?.find((col: ColumnStat) => col.name === columnName)
          if (!columnStats?.outliers) {
            return {
              success: false,
              message: `Dados de outliers não disponíveis para '${columnName}'`
            }
          }

          const outliers = columnStats.outliers.iqr_method?.values || []
          chartData = outliers.slice(0, 50).map((value: number, index: number) => ({
            value: value,
            count: 1,
            index: index + 1
          }))

          chartTitle = `Outliers - ${columnName}`
          xLabel = 'Valor'
          yLabel = 'Frequência'
          break
        }

        case 'distribution': {
          const columnStats = results.column_stats || []
          const numericColumns = columnStats.filter((col: ColumnStat) => 
            col.dtype === 'float64' || col.dtype === 'int64' || col.dtype === 'number'
          )

          chartData = numericColumns.map((col: ColumnStat) => ({
            value: col.name,
            count: col.std || 0 // Usar desvio padrão como métrica de dispersão
          })).sort((a: ChartDataPoint, b: ChartDataPoint) => b.count - a.count)

          chartTitle = 'Dispersão das Variáveis Numéricas'
          xLabel = 'Coluna'
          yLabel = 'Desvio Padrão'
          break
        }

        case 'bar': {
          // Gráfico de barras baseado em categorias mais frequentes
          const columnStats = results.column_stats || []
          const categoricalColumns = columnStats.filter((col: ColumnStat) => 
            col.dtype === 'object' || col.dtype === 'category' || col.dtype === 'string'
          )

          if (columnName) {
            const targetColumn = columnStats.find((col: ColumnStat) => col.name === columnName)
            if (targetColumn && targetColumn.top_values) {
              chartData = Object.entries(targetColumn.top_values)
                .map(([value, data]) => ({ 
                  value, 
                  count: typeof data === 'number' ? data : data.count 
                }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 10)
              chartTitle = `Valores Mais Frequentes - ${columnName}`
              xLabel = columnName
              yLabel = 'Frequência'
            }
          } else {
            // Gráfico de barras geral das colunas com mais categorias
            chartData = categoricalColumns.map((col: ColumnStat) => ({
              value: col.name,
              count: col.unique_count || 0
            })).sort((a: ChartDataPoint, b: ChartDataPoint) => b.count - a.count).slice(0, 10)

            chartTitle = 'Categorias Únicas por Coluna'
            xLabel = 'Coluna'
            yLabel = 'Número de Categorias Únicas'
          }
          break
        }

        case 'line': {
          // Gráfico de linha baseado em tendências temporais ou sequenciais
          const columnStats = results.column_stats || []
          const numericColumns = columnStats.filter((col: ColumnStat) => 
            col.dtype === 'float64' || col.dtype === 'int64' || col.dtype === 'number'
          )

          if (columnName) {
            const targetColumn = columnStats.find((col: ColumnStat) => col.name === columnName)
            if (targetColumn) {
              // Simular uma série temporal baseada nas estatísticas
              const mean = targetColumn.mean || 0
              const std = targetColumn.std || 1
              chartData = Array.from({ length: 20 }, (_, i) => ({
                value: i + 1,
                count: mean + (Math.random() - 0.5) * std * 2
              }))
              chartTitle = `Tendência Simulada - ${columnName}`
              xLabel = 'Tempo/Sequência'
              yLabel = columnName
            }
          } else {
            // Linha das médias das colunas numéricas
            chartData = numericColumns.slice(0, 10).map((col: ColumnStat) => ({
              value: col.name,
              count: col.mean || 0
            }))
            chartTitle = 'Valores Médios por Coluna'
            xLabel = 'Coluna'
            yLabel = 'Valor Médio'
          }
          break
        }

        case 'scatter': {
          // Scatter plot precisa de duas colunas numéricas
          const columnStats = results.column_stats || []
          const numericColumns = columnStats.filter((col: ColumnStat) => 
            col.dtype === 'float64' || col.dtype === 'int64' || col.dtype === 'number'
          )

          console.log('🔍 Debug - generateChartDataTool scatter analysis:', {
            totalColumns: columnStats.length,
            numericColumns: numericColumns.length,
            requestedColumns: { xColumn, yColumn },
            availableColumnsInfo: columnStats.map((col: ColumnStat) => ({
              name: col.name,
              dtype: col.dtype,
              hasStats: !!(col.min !== undefined && col.max !== undefined),
              min: col.min,
              max: col.max,
              std: col.std
            })),
            numericColumnsFiltered: numericColumns.map((col: ColumnStat) => ({
              name: col.name,
              dtype: col.dtype,
              min: col.min,
              max: col.max,
              std: col.std
            }))
          })

          // NOVO: Se column_stats vazio, mas temos correlações e colunas solicitadas
          if (columnStats.length === 0 && results.correlations?.correlations && xColumn && yColumn) {
            const correlations = results.correlations.correlations as Record<string, Record<string, number>>
            const availableColumns = Object.keys(correlations)
            
            console.log('🔧 Using correlation data for scatter plot:', {
              requestedColumns: { xColumn, yColumn },
              availableColumns,
              hasXColumn: availableColumns.includes(xColumn),
              hasYColumn: availableColumns.includes(yColumn)
            })
            
            if (!availableColumns.includes(xColumn)) {
              return {
                success: false,
                message: `Coluna '${xColumn}' não encontrada nas correlações. Colunas disponíveis: ${availableColumns.join(', ')}`
              }
            }
            
            if (!availableColumns.includes(yColumn)) {
              return {
                success: false,
                message: `Coluna '${yColumn}' não encontrada nas correlações. Colunas disponíveis: ${availableColumns.join(', ')}`
              }
            }
            
            // Obter correlação entre as colunas
            const correlation = correlations[xColumn]?.[yColumn] || correlations[yColumn]?.[xColumn] || 0
            
            // Gerar pontos simulados baseados na correlação
            const points = 50
            const baseVariance = 50 // Variância base para simular dados realistas
            
            chartData = Array.from({ length: points }, () => {
              // Gerar valores base com alguma distribuição
              const baseX = 20 + Math.random() * 60 // Range aproximado baseado nos dados reais
              const baseY = 20 + Math.random() * 60
              
              // Aplicar correlação: se correlação positiva, y tende a seguir x
              const correlatedY = baseY + (correlation * (baseX - 40) * 0.5) + (Math.random() - 0.5) * baseVariance * (1 - Math.abs(correlation))
              
              return {
                x: Math.round(baseX * 100) / 100,
                y: Math.round(Math.max(0, correlatedY) * 100) / 100,
                value: Math.round(baseX * 100) / 100, // Manter para compatibilidade
                count: Math.round(Math.max(0, correlatedY) * 100) / 100 // Manter para compatibilidade
              }
            })
            
            chartTitle = `${xColumn} vs ${yColumn} (r=${correlation.toFixed(3)})`
            xLabel = xColumn
            yLabel = yColumn
            
            console.log('📊 Generated scatter plot from correlation data:', {
              correlation,
              dataPoints: chartData.length,
              firstThreePoints: chartData.slice(0, 3)
            })
            
            break
          }

          if (xColumn && yColumn) {
            const xCol = columnStats.find((col: ColumnStat) => col.name === xColumn)
            const yCol = columnStats.find((col: ColumnStat) => col.name === yColumn)
            
            if (!xCol) {
              return {
                success: false,
                message: `Coluna '${xColumn}' não encontrada nos resultados. Colunas disponíveis: ${columnStats.map(c => c.name).join(', ')}`
              }
            }
            
            if (!yCol) {
              return {
                success: false,
                message: `Coluna '${yColumn}' não encontrada nos resultados. Colunas disponíveis: ${columnStats.map(c => c.name).join(', ')}`
              }
            }
            
            // Verificar se são colunas numéricas
            const xIsNumeric = ['float64', 'int64', 'number'].includes(xCol.dtype)
            const yIsNumeric = ['float64', 'int64', 'number'].includes(yCol.dtype)
            
            if (!xIsNumeric) {
              return {
                success: false,
                message: `Coluna '${xColumn}' não é numérica (tipo: ${xCol.dtype}). Scatter plots requerem colunas numéricas.`
              }
            }
            
            if (!yIsNumeric) {
              return {
                success: false,
                message: `Coluna '${yColumn}' não é numérica (tipo: ${yCol.dtype}). Scatter plots requerem colunas numéricas.`
              }
            }
            
            // Verificar se há dados válidos
            if ((xCol.min === undefined || xCol.max === undefined) && (yCol.min === undefined || yCol.max === undefined)) {
              return {
                success: false,
                message: `Colunas '${xColumn}' e '${yColumn}' não possuem dados estatísticos válidos para gerar scatter plot.`
              }
            }
            
            // Gerar pontos de scatter simulados baseados nas estatísticas
            const points = 50
            chartData = Array.from({ length: points }, () => {
              const xValue = (xCol.min || 0) + Math.random() * ((xCol.max || 100) - (xCol.min || 0))
              const yValue = (yCol.min || 0) + Math.random() * ((yCol.max || 100) - (yCol.min || 0))
              return {
                x: Math.round(xValue * 100) / 100,
                y: Math.round(yValue * 100) / 100,
                value: Math.round(xValue * 100) / 100, // Manter para compatibilidade
                count: Math.round(yValue * 100) / 100 // Manter para compatibilidade
              }
            })
            chartTitle = `${xColumn} vs ${yColumn}`
            xLabel = xColumn
            yLabel = yColumn
          } else if (numericColumns.length >= 2) {
            // Usar as duas primeiras colunas numéricas
            const xCol = numericColumns[0]
            const yCol = numericColumns[1]
            const points = 50
            chartData = Array.from({ length: points }, () => {
              const xValue = (xCol.min || 0) + Math.random() * ((xCol.max || 100) - (xCol.min || 0))
              const yValue = (yCol.min || 0) + Math.random() * ((yCol.max || 100) - (yCol.min || 0))
              return {
                x: Math.round(xValue * 100) / 100,
                y: Math.round(yValue * 100) / 100,
                value: Math.round(xValue * 100) / 100, // Manter para compatibilidade
                count: Math.round(yValue * 100) / 100 // Manter para compatibilidade
              }
            })
            chartTitle = `${xCol.name} vs ${yCol.name}`
            xLabel = xCol.name
            yLabel = yCol.name
          } else {
            // NOVO: Se não há column_stats mas há correlações, sugerir usar correlações
            if (columnStats.length === 0 && results.correlations?.correlations) {
              const correlations = results.correlations.correlations as Record<string, Record<string, number>>
              const availableColumns = Object.keys(correlations)
              
              return {
                success: false,
                message: `Scatter plot requer especificar xColumn e yColumn quando column_stats não disponível. Colunas disponíveis nas correlações: ${availableColumns.join(', ')}. Use a ferramenta de sugestões para encontrar as melhores combinações.`,
                available_columns: availableColumns,
                suggestion: 'Use suggestChartColumns para scatter plot para obter recomendações de pares de colunas.'
              }
            }
            
            return {
              success: false,
              message: `Scatter plot requer pelo menos 2 colunas numéricas. Encontradas apenas ${numericColumns.length} colunas numéricas: ${numericColumns.map(c => c.name).join(', ') || 'nenhuma'}`
            }
          }
          break
        }

        case 'boxplot': {
          if (!columnName) {
            return {
              success: false,
              message: 'Nome da coluna é obrigatório para boxplots'
            }
          }

          const columnStats = results.column_stats?.find((col: ColumnStat) => col.name === columnName)
          if (!columnStats) {
            return {
              success: false,
              message: `Coluna '${columnName}' não encontrada nos resultados`
            }
          }

          // Boxplot usando quartis e estatísticas
          const q1 = columnStats.q25 || 0
          const q2 = columnStats.median || columnStats.q50 || 0
          const q3 = columnStats.q75 || 0
          const min = columnStats.min || 0
          const max = columnStats.max || 100

          chartData = [
            { value: 'Min', count: min },
            { value: 'Q1', count: q1 },
            { value: 'Mediana', count: q2 },
            { value: 'Q3', count: q3 },
            { value: 'Max', count: max }
          ]

          chartTitle = `Boxplot - ${columnName}`
          xLabel = 'Estatística'
          yLabel = 'Valor'
          break
        }

        case 'density': {
          if (!columnName) {
            return {
              success: false,
              message: 'Nome da coluna é obrigatório para gráficos de densidade'
            }
          }

          const columnStats = results.column_stats?.find((col: ColumnStat) => col.name === columnName)
          if (!columnStats) {
            return {
              success: false,
              message: `Coluna '${columnName}' não encontrada nos resultados`
            }
          }

          // Gerar curva de densidade baseada nas estatísticas
          const min = columnStats.min || 0
          const max = columnStats.max || 100
          const mean = columnStats.mean || (min + max) / 2
          const std = columnStats.std || (max - min) / 6
          
          chartData = Array.from({ length: 50 }, (_, i) => {
            const x = min + (i / 49) * (max - min)
            const density = Math.exp(-0.5 * Math.pow((x - mean) / Math.max(std, 1), 2)) / Math.sqrt(2 * Math.PI * Math.max(std, 1))
            return {
              value: Math.round(x * 100) / 100,
              count: density
            }
          })

          chartTitle = `Densidade - ${columnName}`
          xLabel = columnName
          yLabel = 'Densidade'
          break
        }

        default:
          return {
            success: false,
            message: `Tipo de gráfico '${chartType}' não suportado`
          }
      }

      const chartConfig: ChartConfig = {
        title: chartTitle,
        xLabel,
        yLabel,
        width: 800,
        height: 400
      }

      console.log('📊 Chart data generated:', {
        chartType,
        dataLength: chartData.length,
        firstThreePoints: chartData.slice(0, 3),
        config: chartConfig
      });

      return {
        success: true,
        analysisId: targetAnalysisId,
        chartType,
        chartData,
        chartConfig,
        dataPoints: chartData.length,
        message: `Dados do gráfico gerados com sucesso: ${chartData.length} pontos para ${chartType}${columnName ? ` da coluna '${columnName}'` : ''}`
      }
    } catch (error) {
      console.error('❌ Error in generateChartDataTool:', error)
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      return {
        success: false,
        error: errorMessage,
        message: `Falha ao gerar dados do gráfico: ${errorMessage}`
      }
    }
  }
})
