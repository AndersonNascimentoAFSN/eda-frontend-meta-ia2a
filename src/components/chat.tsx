'use client'

import { DefaultChatTransport } from 'ai';
import { useChat } from '@ai-sdk/react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ServerUpload } from '@/components/server-upload'
import { AnalysisContext } from '@/components/analysis-context'
import { Send, Bot, User, BarChart3, Paperclip } from 'lucide-react'
import { useFileUpload } from '@/hooks/use-file-upload'

export function Chat() {
  const [input, setInput] = useState('')
  const { messages, sendMessage } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
    }),
  })

  const { uploadFile } = useFileUpload()

  const handleFileSelect = async (file: File) => {
    try {
      // Enviar mensagem informativa sobre o início do upload
      // sendMessage({
      //   text: `📤 Fazendo upload do arquivo CSV "${file.name}" (${(file.size / 1024 / 1024).toFixed(2)}MB)...`
      // });

      // Fazer upload usando server action
      const result = await uploadFile(file)

      // Enviar mensagem de sucesso
      sendMessage({
        text: `✅ Upload concluído com sucesso! 

📄 **Arquivo:** ${file.name}
📊 **Análise iniciada:** ID ${result?.analysisId || 'N/A'}
🔄 **Status:** ${result?.status || 'iniciado'}

A análise está sendo processada. Você pode verificar o progresso ou fazer perguntas sobre os dados.`
      });

    } catch (error) {
      console.error('Error uploading file:', error);
      sendMessage({
        text: `❌ Erro ao fazer upload do arquivo "${file.name}": ${error instanceof Error ? error.message : 'Erro desconhecido'}. Por favor, tente novamente.`
      });
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim()) {
      let messageText = input.trim()

      // Se a pergunta parece ser sobre análise, incluir ID automaticamente
      const analysisKeywords = ['análise', 'resultado', 'status', 'progresso', 'dados', 'estatística']
      const hasAnalysisKeyword = analysisKeywords.some(keyword =>
        messageText.toLowerCase().includes(keyword)
      )

      if (hasAnalysisKeyword) {
        // Tentar obter o ID da análise ativa
        const latestAnalysis = typeof window !== 'undefined' ?
          JSON.parse(localStorage.getItem('eda_active_analyses') || '[]').pop() : null

        if (latestAnalysis?.id) {
          messageText += `\n\n[ID da análise: ${latestAnalysis.id}]`
        }
      }

      sendMessage({
        text: messageText
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
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Contexto de análise ativa */}
          {messages.length > 0 && <AnalysisContext />}

          {messages.length === 0 && (
            <div className="text-center py-12">
              <Bot className="mx-auto h-16 w-16 text-gray-400 mb-6" />
              <h3 className="text-xl font-medium text-gray-900 mb-4">Bem-vindo ao Assistente EDA</h3>
              <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                Estou aqui para ajudar você a analisar seus dados! Faça upload de um arquivo CSV para começar com a análise exploratória de dados,
                ou me faça perguntas sobre técnicas de análise de dados e melhores práticas.
              </p>

              <ServerUpload
                onUploadStart={(fileName) => {
                  sendMessage({
                    text: `📤 Iniciando upload do arquivo "${fileName}"...`
                  });
                }}
                onUploadComplete={(result) => {
                  sendMessage({
                    text: `✅ Upload concluído com sucesso! 

📄 **Arquivo:** ${result.fileName}
📊 **Análise iniciada:** ID ${result.analysisId}
🔄 **Status:** ${result.status}

A análise está sendo processada. Você pode verificar o progresso ou fazer perguntas sobre os dados.`
                  });
                }}
                onUploadError={(error) => {
                  sendMessage({
                    text: `❌ Erro durante o upload: ${error}. Por favor, tente novamente.`
                  });
                }}
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
                className={`max-w-xs lg:max-w-2xl px-4 py-3 rounded-lg ${message.role === 'user'
                  ? 'bg-blue-500 text-white rounded-br-sm'
                  : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                  }`}
              >
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {message.parts?.map((part, index) => {
                    switch (part.type) {
                      case 'text':
                        // Filtrar dados grandes, mantendo apenas o texto principal
                        const text = part.text
                        const dadosIndex = text.indexOf('[DADOS_ARQUIVO]')
                        if (dadosIndex !== -1) {
                          return <span key={index}>{text.substring(0, dadosIndex).trim()}</span>
                        }
                        return <span key={index}>{part.text}</span>

                      case 'tool-checkAnalysisStatus': {
                        const callId = part?.toolCallId;

                        switch (part.state) {
                          case 'input-streaming':
                            return (
                              <div key={callId} className="flex items-center space-x-2 text-blue-600">
                                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                <span>Verificando status da análise...</span>
                              </div>
                            );
                          case 'input-available':
                            return (
                              <div key={callId} className="flex items-center space-x-2 text-blue-600">
                                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                <span>Consultando progresso...</span>
                              </div>
                            );
                          case 'output-available':
                            const statusResult = part?.output as { success?: boolean, status?: string, progress?: number, isComplete?: boolean, message?: string };
                            return (
                              <div key={callId} className={`border-l-4 p-3 rounded-r ${statusResult?.isComplete ? 'bg-green-50 border-green-400' : 'bg-blue-50 border-blue-400'
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
                              <div key={callId} className="bg-red-50 border-l-4 border-red-400 p-3 rounded-r">
                                <div className="flex items-center space-x-2">
                                  <span className="text-red-600">❌</span>
                                  <span className="font-medium text-red-800">Erro ao Verificar Status</span>
                                </div>
                                <p className="mt-2 text-sm text-red-700">{part.errorText || 'Erro desconhecido'}</p>
                              </div>
                            );
                        }
                      }

                      case 'tool-getAnalysisResult': {
                        const callId = part?.toolCallId;

                        switch (part.state) {
                          case 'input-streaming':
                            return (
                              <div key={callId} className="flex items-center space-x-2 text-blue-600">
                                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                <span>Preparando relatório de resultados...</span>
                              </div>
                            )
                          case 'input-available':
                            return (
                              <div key={callId} className="flex items-center space-x-2 text-blue-600">
                                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                <span>Obtendo resultados da análise...</span>
                              </div>
                            );
                          case 'output-available':
                            const analysisResult = part?.output as { success?: boolean, results?: Record<string, unknown>, analysisId?: string };
                            return (
                              <div key={callId} className="bg-green-50 border-l-4 border-green-400 p-3 rounded-r">
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
                              <div key={callId} className="bg-red-50 border-l-4 border-red-400 p-3 rounded-r">
                                <div className="flex items-center space-x-2">
                                  <span className="text-red-600">❌</span>
                                  <span className="font-medium text-red-800">Erro ao Obter Resultados</span>
                                </div>
                                <p className="mt-2 text-sm text-red-700">{part.errorText || 'Erro desconhecido ao buscar resultados'}</p>
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
                      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
                        handleFileSelect(file)
                      } else {
                        sendMessage({
                          text: `❌ Formato de arquivo inválido. Por favor, selecione apenas arquivos CSV (.csv).`
                        })
                      }
                      e.target.value = '' // Reset input
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