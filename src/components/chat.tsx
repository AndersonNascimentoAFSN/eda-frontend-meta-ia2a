'use client'

import { DefaultChatTransport } from 'ai';
import { useChat } from '@ai-sdk/react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileUploadDirect } from '@/components/file-upload-direct'
import { Chart } from '@/components/chart/Chart'
import { Send, Bot, User, BarChart3, Paperclip } from 'lucide-react'
import { Streamdown } from 'streamdown';

export function Chat() {
  const [input, setInput] = useState('')
  const { messages, sendMessage } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
    }),
  })

  const handleFileUploaded = async (fileKey: string, fileName: string, fileSize: number) => {
    try {
      // Enviar mensagem informando sobre o upload e solicitando análise
      const fileSizeMB = Math.round((fileSize / 1024 / 1024) * 100) / 100
      
      sendMessage({
        text: `Arquivo "${fileName}" (${fileSizeMB}MB) foi enviado com sucesso! Por favor, inicie a análise exploratória de dados usando a chave do arquivo: ${fileKey}`
      })
    } catch (error) {
      console.error('Error handling file upload:', error)
      sendMessage({
        text: `Erro ao processar o arquivo "${fileName}". Por favor, tente fazer o upload novamente.`,
      })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim()) {
      sendMessage({
        text: input
      })
      setInput('')
    }
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="bg-white flex flex-col h-full">
        {/* Header */}
        <div className="border-b p-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="flex items-center space-x-3 gap-4">
            <BarChart3 className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-bold">Assistente EDA</h1>
              <p className="text-blue-100">Seu companheiro de análise exploratória de dados com IA</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-none">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <Bot className="mx-auto h-16 w-16 text-gray-400 mb-6" />
              <h3 className="text-xl font-medium text-gray-900 mb-4">Bem-vindo ao Assistente EDA</h3>
              <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                Estou aqui para ajudar você a analisar seus dados! Faça upload de um arquivo CSV para começar com a análise exploratória de dados,
                ou me faça perguntas sobre técnicas de análise de dados e melhores práticas.
              </p>

              {/* Usar upload direto para arquivos grandes (melhor para Vercel) */}
              <FileUploadDirect
                onFileUploaded={handleFileUploaded}
              // disabled={isLoading} 
              />
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start space-x-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-white" />
                </div>
              )}

              <div
                className={`px-4 py-3 rounded-lg ${message.role === 'user'
                  ? 'bg-blue-500 text-white rounded-br-sm max-w-xs lg:max-w-2xl'
                  : 'bg-gray-100 text-gray-900 rounded-bl-sm w-full max-w-[max-content]'
                  }`}
              >
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {message.parts?.map((part, index) => {
                    switch (part.type) {
                      case 'text':
                        return <Streamdown key={`text-${index}`}>{part.text}</Streamdown>
                      case 'tool-startAnalysisFromUpload': {
                        const callId = part?.toolCallId || `start-${index}`;

                        switch (part.state) {
                          case 'input-streaming':
                            return (
                              <div key={`${callId}-streaming`} className="flex items-center space-x-2 text-blue-600">
                                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                <span>Preparando análise do arquivo...</span>
                              </div>
                            )
                          case 'input-available':
                            return (
                              <div key={`${callId}-input`} className="flex items-center space-x-2 text-blue-600">
                                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                <span>Solicitando a análise exploratória...</span>
                              </div>
                            );
                          case 'output-available':
                            const result = part?.output as { success?: boolean, fileName?: string, analysisId?: string, status?: string, fileKey?: string };
                            return (
                              <div key={`${callId}-output`} className="bg-green-50 border-l-4 border-green-400 p-3 rounded-r">
                                <div className="flex items-center space-x-2">
                                  <span className="text-green-600">✅</span>
                                  <span className="font-medium text-green-800">Análise Iniciada!</span>
                                </div>
                                {result?.success && (
                                  <div className="mt-2 text-sm text-green-700">
                                    <p>📄 Arquivo: <span className="font-medium">{result.fileName}</span></p>
                                    <p>🆔 ID da Análise: <span className="font-mono text-xs">{result.analysisId}</span></p>
                                    <p>📊 Status: <span className="capitalize">{result.status}</span></p>
                                    <p>🔑 File Key: <span className="font-mono text-xs">{result.fileKey}</span></p>
                                  </div>
                                )}
                              </div>
                            );
                          case 'output-error':
                            return (
                              <div key={`${callId}-error`} className="bg-red-50 border-l-4 border-red-400 p-3 rounded-r">
                                <div className="flex items-center space-x-2">
                                  <span className="text-red-600">❌</span>
                                  <span className="font-medium text-red-800">Erro na Análise</span>
                                </div>
                                <p className="mt-2 text-sm text-red-700">{part.errorText || 'Erro desconhecido durante o início da análise'}</p>
                              </div>
                            );
                        }
                      }

                      case 'tool-checkAnalysisStatus': {
                        const callId = part?.toolCallId || `status-${index}`;

                        switch (part.state) {
                          case 'input-streaming':
                            return (
                              <div key={`${callId}-streaming`} className="flex items-center space-x-2 text-blue-600">
                                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                <span>Verificando status da análise...</span>
                              </div>
                            );
                          case 'input-available':
                            return (
                              <div key={`${callId}-input`} className="flex items-center space-x-2 text-blue-600">
                                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                <span>Consultando progresso...</span>
                              </div>
                            );
                          case 'output-available':
                            const statusResult = part?.output as { success?: boolean, status?: string, progress?: number, isComplete?: boolean, message?: string };
                            return (
                              <div key={`${callId}-output`} className={`border-l-4 p-3 rounded-r ${statusResult?.isComplete ? 'bg-green-50 border-green-400' : 'bg-blue-50 border-blue-400'
                                }`}>
                                <div className="flex items-center space-x-2">
                                  <span>{statusResult?.isComplete ? '✅' : '🔄'}</span>
                                  <span className={`font-medium ${statusResult?.isComplete ? 'text-green-800' : 'text-blue-800'
                                    }`}>
                                    {statusResult?.isComplete ? 'Análise Concluída!' : 'Análise em Progresso'}
                                  </span>
                                </div>
                                {statusResult?.progress !== undefined && (
                                  <div className="mt-2">
                                    <div className="flex justify-between text-sm">
                                      <span>Progresso</span>
                                      <span>{statusResult.progress}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                      <div
                                        className={`bg-blue-600 h-2 rounded-full transition-all duration-300 ${statusResult.progress >= 100 ? 'w-full' :
                                          statusResult.progress >= 75 ? 'w-3/4' :
                                            statusResult.progress >= 50 ? 'w-1/2' :
                                              statusResult.progress >= 25 ? 'w-1/4' : 'w-1/12'
                                          }`}
                                      ></div>
                                    </div>
                                  </div>
                                )}
                                {statusResult?.message && (
                                  <p className="mt-2 text-sm text-gray-700">{statusResult.message}</p>
                                )}
                              </div>
                            );
                          case 'output-error':
                            return (
                              <div key={`${callId}-error`} className="bg-red-50 border-l-4 border-red-400 p-3 rounded-r">
                                <div className="flex items-center space-x-2">
                                  <span className="text-red-600">❌</span>
                                  <span className="font-medium text-red-800">Erro ao Verificar Status</span>
                                </div>
                                <p className="mt-2 text-sm text-red-700">{part.errorText || 'Erro desconhecido'}</p>
                              </div>
                            );
                        }
                      }

                      case 'tool-generateChartData': {
                        const callId = part?.toolCallId || `chart-${index}`;

                        switch (part.state) {
                          case 'input-streaming':
                            return (
                              <div key={`${callId}-streaming`} className="flex items-center space-x-2 text-blue-600">
                                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                <span>Preparando dados de visualização...</span>
                              </div>
                            )
                          case 'input-available':
                            return (
                              <div key={`${callId}-input`} className="flex items-center space-x-2 text-blue-600">
                                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                <span>Gerando gráfico...</span>
                              </div>
                            );
                          case 'output-available':
                            const chartResult = part?.output as { 
                              success?: boolean, 
                              chartType?: string, 
                              dataPoints?: number, 
                              chartData?: { value: string | number, count: number }[],
                              chartConfig?: { title: string, xLabel: string, yLabel: string }
                            };
                            
                            console.log('🔍 Chart result received in chat:', chartResult);
                            
                            return (
                              <div key={`${callId}-output`} className="bg-purple-50 border-l-4 border-purple-400 p-3 rounded-r">
                                <div className="flex items-center space-x-2">
                                  <span className="text-purple-600">📊</span>
                                  <span className="font-medium text-purple-800">Gráfico Gerado!</span>
                                </div>
                                {chartResult?.success && (
                                  <div className="mt-2 text-sm text-purple-700">
                                    <p>📈 Tipo: <span className="font-medium capitalize">{chartResult.chartType}</span></p>
                                    <p>📊 Pontos de dados: <span className="font-medium">{chartResult.dataPoints}</span></p>
                                    {chartResult.chartConfig?.title && (
                                      <p>🏷️ Título: <span className="font-medium">{chartResult.chartConfig.title}</span></p>
                                    )}
                                    {chartResult.chartData && chartResult.chartData.length > 0 && (
                                      <div className="mt-3 space-y-4">
                                        {/* Preview dos dados */}
                                        <div className="p-3 bg-white rounded border">
                                          <p className="font-medium mb-2">Primeiros dados:</p>
                                          <div className="text-xs space-y-1">
                                            {chartResult.chartData.slice(0, 3).map((point, i) => (
                                              <div key={i} className="flex justify-between">
                                                <span className="truncate max-w-32">{point.value}</span>
                                                <span className="font-mono">{point.count}</span>
                                              </div>
                                            ))}
                                            {chartResult.chartData.length > 3 && (
                                              <div className="text-gray-500">... e mais {chartResult.chartData.length - 3} pontos</div>
                                            )}
                                          </div>
                                        </div>
                                        
                                        {/* Gráfico Visual */}
                                        <div className="border rounded-lg p-4 bg-white">
                                          <p className="text-xs text-gray-500 mb-2">🔍 Debug: Renderizando gráfico com {chartResult.chartData.length} pontos</p>
                                          <Chart
                                            data={chartResult.chartData}
                                            chartType={chartResult.chartType as 'histogram' | 'bar' | 'line' | 'scatter' | 'correlation_heatmap' | 'missing_values' | 'outliers' | 'distribution' | 'boxplot' | 'density'}
                                            title={chartResult.chartConfig?.title}
                                            xLabel={chartResult.chartConfig?.xLabel}
                                            yLabel={chartResult.chartConfig?.yLabel}
                                            width={600}
                                            height={350}
                                          />
                                          <p className="text-xs text-gray-500 mt-2">📊 Componente Chart renderizado</p>
                                        </div>
                                      </div>
                                    )}
                                    {(!chartResult.chartData || chartResult.chartData.length === 0) && (
                                      <div className="mt-3 space-y-3">
                                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                                          <div className="flex items-start space-x-2">
                                            <span className="text-yellow-600 mt-0.5">⚠️</span>
                                            <div>
                                              <p className="text-yellow-800 text-sm font-medium">Nenhum dado encontrado para este gráfico</p>
                                              <p className="text-yellow-700 text-xs mt-1">
                                                Tipo: <span className="font-medium">{chartResult.chartType}</span> • 
                                                Pontos retornados: <span className="font-medium">{chartResult.dataPoints}</span>
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                        
                                        <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                                          <div className="flex items-start space-x-2">
                                            <span className="text-blue-600 mt-0.5">💡</span>
                                            <div>
                                              <p className="text-blue-800 text-sm font-medium">Sugestões para resolver:</p>
                                              <ul className="text-blue-700 text-xs mt-1 space-y-1">
                                                <li>• Verifique se o nome da coluna está correto</li>
                                                <li>• Para scatter plots, certifique-se de que existem duas colunas numéricas</li>
                                                <li>• Para gráficos de barras, use colunas categóricas com dados</li>
                                                <li>• Experimente primeiro ver as sugestões de colunas disponíveis</li>
                                              </ul>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                                {!chartResult?.success && (
                                  <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded">
                                    <p className="text-red-800 text-sm">❌ Falha ao gerar gráfico</p>
                                  </div>
                                )}
                              </div>
                            );
                          case 'output-error':
                            return (
                              <div key={`${callId}-error`} className="bg-red-50 border-l-4 border-red-400 p-3 rounded-r">
                                <div className="flex items-center space-x-2">
                                  <span className="text-red-600">❌</span>
                                  <span className="font-medium text-red-800">Erro ao Gerar Gráfico</span>
                                </div>
                                <p className="mt-2 text-sm text-red-700">{part.errorText || 'Erro desconhecido ao gerar visualização'}</p>
                              </div>
                            );
                        }
                      }

                      case 'tool-getAnalysisResult': {
                        const callId = part?.toolCallId || `result-${index}`;

                        switch (part.state) {
                          case 'input-streaming':
                            return (
                              <div key={`${callId}-streaming`} className="flex items-center space-x-2 text-blue-600">
                                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                <span>Preparando relatório de resultados...</span>
                              </div>
                            )
                          case 'input-available':
                            return (
                              <div key={`${callId}-input`} className="flex items-center space-x-2 text-blue-600">
                                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                <span>Obtendo resultados da análise...</span>
                              </div>
                            );
                          case 'output-available':
                            const analysisResult = part?.output as { success?: boolean, results?: Record<string, unknown>, analysisId?: string };
                            return (
                              <div key={`${callId}-output`} className="bg-green-50 border-l-4 border-green-400 p-3 rounded-r">
                                <div className="flex items-center space-x-2">
                                  <span className="text-green-600">📊</span>
                                  <span className="font-medium text-green-800">Resultados da Análise</span>
                                </div>
                                {analysisResult?.success && (
                                  <div className="mt-2 text-sm text-green-700">
                                    <p>✅ Análise completa! Os resultados estão sendo processados...</p>
                                    {analysisResult?.analysisId && (
                                      <p className="mt-1">🆔 ID: <span className="font-mono text-xs">{analysisResult.analysisId}</span></p>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          case 'output-error':
                            return (
                              <div key={`${callId}-error`} className="bg-red-50 border-l-4 border-red-400 p-3 rounded-r">
                                <div className="flex items-center space-x-2">
                                  <span className="text-red-600">❌</span>
                                  <span className="font-medium text-red-800">Erro ao Obter Resultados</span>
                                </div>
                                <p className="mt-2 text-sm text-red-700">{part.errorText || 'Erro desconhecido ao buscar resultados'}</p>
                              </div>
                            );
                        }
                      }

                      case 'tool-suggestChartColumns': {
                        const callId = part?.toolCallId || `suggest-${index}`;

                        switch (part.state) {
                          case 'input-streaming':
                            return (
                              <div key={`${callId}-streaming`} className="flex items-center space-x-2 text-blue-600">
                                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                <span>Analisando dados disponíveis...</span>
                              </div>
                            )
                          case 'input-available':
                            return (
                              <div key={`${callId}-input`} className="flex items-center space-x-2 text-blue-600">
                                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                <span>Sugerindo colunas apropriadas...</span>
                              </div>
                            );
                          case 'output-available':
                            const suggestions = part?.output as { 
                              success?: boolean, 
                              suggestions?: { 
                                chart_type: string,
                                recommended_columns: Record<string, unknown>[],
                                explanations?: Record<string, string>,
                                examples?: Record<string, unknown>
                              }, 
                              total_recommendations?: number 
                            };
                            
                            return (
                              <div key={`${callId}-output`} className="bg-indigo-50 border-l-4 border-indigo-400 p-4 rounded-r">
                                <div className="flex items-center space-x-2 mb-3">
                                  <span className="text-indigo-600">🎯</span>
                                  <span className="font-medium text-indigo-800">Sugestões de Colunas para Gráficos</span>
                                </div>
                                {suggestions?.success && suggestions.suggestions && (
                                  <div className="text-sm text-indigo-700 space-y-4">
                                    <div className="bg-white p-3 rounded border">
                                      <p className="font-medium mb-2">📊 Tipo de Gráfico: <span className="capitalize text-indigo-600">{suggestions.suggestions.chart_type}</span></p>
                                      <p>📋 {suggestions.total_recommendations} opções encontradas</p>
                                    </div>

                                    {suggestions.suggestions.recommended_columns.length > 0 ? (
                                      <div className="space-y-3">
                                        <p className="font-medium text-indigo-800">🏆 Colunas Recomendadas:</p>
                                        {suggestions.suggestions.recommended_columns.slice(0, 5).map((col: Record<string, unknown>, idx: number) => (
                                          <div key={idx} className="bg-white p-3 rounded border-l-4 border-indigo-200">
                                            <div className="flex justify-between items-start mb-2">
                                              <span className="font-medium text-gray-900">{String(col.name || '')}</span>
                                              <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-800">
                                                {String(col.data_quality || 'N/A')}
                                              </span>
                                            </div>
                                            
                                            <div className="text-xs text-gray-600 space-y-1">
                                              <p>📊 Coluna: {String(col.name || 'N/A')}</p>
                                              <p>✨ Qualidade: {String(col.data_quality || 'N/A')}</p>
                                              <p>� Detalhes: {JSON.stringify(col).slice(0, 100)}...</p>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="bg-yellow-50 border border-yellow-200 p-3 rounded">
                                        <p className="text-yellow-800 text-sm">⚠️ Nenhuma coluna apropriada encontrada para este tipo de gráfico</p>
                                      </div>
                                    )}

                                    {/* Explicações */}
                                    {suggestions.suggestions.explanations && (
                                      <div className="bg-white p-3 rounded border">
                                        <p className="font-medium text-gray-800 mb-2">💡 Explicações:</p>
                                        <div className="text-xs text-gray-600 space-y-1">
                                          {suggestions.suggestions.explanations.why_these_columns && (
                                            <p>• <strong>Por que essas colunas:</strong> {suggestions.suggestions.explanations.why_these_columns}</p>
                                          )}
                                          {suggestions.suggestions.explanations.data_source && (
                                            <p>• <strong>Fonte dos dados:</strong> {suggestions.suggestions.explanations.data_source}</p>
                                          )}
                                          {suggestions.suggestions.explanations.limitations && (
                                            <p>• <strong>Limitações:</strong> {suggestions.suggestions.explanations.limitations}</p>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                                {!suggestions?.success && (
                                  <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded">
                                    <p className="text-red-800 text-sm">❌ Erro ao obter sugestões de colunas</p>
                                  </div>
                                )}
                              </div>
                            );
                          case 'output-error':
                            return (
                              <div key={`${callId}-error`} className="bg-red-50 border-l-4 border-red-400 p-3 rounded-r">
                                <div className="flex items-center space-x-2">
                                  <span className="text-red-600">❌</span>
                                  <span className="font-medium text-red-800">Erro ao Sugerir Colunas</span>
                                </div>
                                <p className="mt-2 text-sm text-red-700">{part.errorText || 'Erro desconhecido ao analisar colunas'}</p>
                              </div>
                            );
                        }
                      }
                    }
                    return null
                  })}
                </div>
              </div>

              {message.role === 'user' && (
                <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-white" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="border-t p-4 bg-gray-50 rounded-b-lg">
          <form onSubmit={handleSubmit} className="flex space-x-3 items-end">
            <div className="flex-1 relative">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Faça uma pergunta sobre seus dados ou análise de dados..."
                className="w-full border border-gray-300 rounded-full px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              // disabled={isLoading}
              />

              {/* Botão de anexo */}
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      (async () => {
                        if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
                          try {
                            // Passo 1: Obter URL pré-assinada
                            const response = await fetch('/api/presigned-upload', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({
                                fileName: file.name,
                                fileSize: file.size
                              })
                            })
                            
                            const result = await response.json()
                            
                            if (result.success) {
                              // Passo 2: Upload direto para R2
                              const uploadResponse = await fetch(result.upload_url, {
                                method: 'PUT',
                                body: file,
                                headers: {
                                  'Content-Type': 'text/csv',
                                },
                              })
                              
                              if (uploadResponse.ok) {
                                handleFileUploaded(result.file_key, result.fileName, result.fileSize)
                              } else {
                                throw new Error(`Upload falhou: ${uploadResponse.status}`)
                              }
                            } else {
                              sendMessage({
                                text: `❌ Erro no upload: ${result.error}`
                              })
                            }
                          } catch (error) {
                            sendMessage({
                              text: `❌ Erro no upload: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
                            })
                          }
                        } else {
                          sendMessage({
                            text: `❌ Formato de arquivo inválido. Por favor, selecione apenas arquivos CSV (.csv).`
                          })
                        }
                        e.target.value = '' // Reset input
                      })()
                    }
                  }}
                  className="hidden"
                  id="file-upload-clip"
                  aria-label="Anexar arquivo CSV"
                />
                <label
                  htmlFor="file-upload-clip"
                  className="cursor-pointer p-1 rounded-full hover:bg-gray-200 transition-colors"
                  title="Anexar arquivo CSV"
                >
                  <Paperclip className="w-5 h-5 text-gray-500 hover:text-gray-700" />
                </label>
              </div>
            </div>

            <Button
              type="submit"
              // disabled={isLoading || !input.trim()}
              className="rounded-full px-6 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>

          <p className="text-xs text-gray-500 mt-2 text-center">
            Use o 📎 para anexar CSV • Pergunte sobre análise de dados • Obtenha insights e recomendações
          </p>
        </div>
      </div>
    </div>
  )
}