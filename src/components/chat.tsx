'use client'

import { DefaultChatTransport } from 'ai';
import { useChat } from '@ai-sdk/react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileUpload } from '@/components/file-upload'
import { Send, Bot, User, BarChart3 } from 'lucide-react'

export function Chat() {
  const [input, setInput] = useState('')
  const { messages, sendMessage } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
    }),
  })

  const handleFileSelect = async (file: File) => {
    try {
      // Converter arquivo para base64
      const reader = new FileReader()
      reader.onload = async () => {
        const base64Content = reader.result?.toString().split(',')[1]
        if (base64Content) {
          // Enviar uma única mensagem com texto visível e dados ocultos
          sendMessage({
            text: `Carreguei um arquivo CSV "${file.name}" para análise. Por favor, processe-o e inicie a análise exploratória de dados.

[DADOS_ARQUIVO] ARQUIVO_CSV_BASE64: ${base64Content} NOME_ARQUIVO: ${file.name}`
          })
        }
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Error uploading file:', error)
      sendMessage({
        text: `Erro ao carregar o arquivo "${file.name}". Por favor, tente novamente.`,
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
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <Bot className="mx-auto h-16 w-16 text-gray-400 mb-6" />
              <h3 className="text-xl font-medium text-gray-900 mb-4">Bem-vindo ao Assistente EDA</h3>
              <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                Estou aqui para ajudar você a analisar seus dados! Faça upload de um arquivo CSV para começar com a análise exploratória de dados,
                ou me faça perguntas sobre técnicas de análise de dados e melhores práticas.
              </p>

              <FileUpload
                onFileSelect={handleFileSelect}
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
                className={`max-w-xs lg:max-w-2xl px-4 py-3 rounded-lg ${message.role === 'user'
                  ? 'bg-blue-500 text-white rounded-br-sm'
                  : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                  }`}
              >
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {message.parts?.map((part) => {
                    switch (part.type) {
                      case 'text':
                        // Filtrar apenas a parte dos dados, mantendo o texto principal
                        const text = part.text
                        const dadosIndex = text.indexOf('[DADOS_ARQUIVO]')
                        if (dadosIndex !== -1) {
                          return text.substring(0, dadosIndex).trim()
                        }
                        return text;
                      case 'tool-uploadAndAnalyzeData': {
                        const callId = part?.toolCallId;

                        switch (part.state) {
                          case 'input-streaming':
                            return (
                              <div key={callId}>Preparando solicitação de análise...</div>
                            )
                          case 'input-available':
                            return <div key={callId}>Iniciando solicitação de análise...</div>;
                          case 'output-available':
                            return <div key={callId}>Análise: {JSON.stringify(part?.output)}</div>;
                          case 'output-error':
                            return (
                              <div key={callId}>
                                Erro ao obter análise: {JSON.stringify(part.errorText)}
                              </div>
                            );
                        }
                      }

                      case 'tool-checkAnalysisStatus': {
                        const callId = part?.toolCallId;

                        switch (part.state) {
                          case 'input-streaming':
                            return (
                              <div key={callId}>Preparando solicitação de status da análise...</div>
                            );
                          case 'input-available':
                            return <div key={callId}>Obtendo status da análise...</div>;
                          case 'output-available':
                            return <div key={callId}>Status da análise: {JSON.stringify(part?.output)}</div>;
                          case 'output-error':
                            return (
                              <div key={callId}>
                                Erro ao obter status da análise: {JSON.stringify(part.errorText)}
                              </div>
                            );
                        }
                      }

                      case 'tool-getAnalysisResult': {
                        const callId = part?.toolCallId;

                        switch (part.state) {
                          case 'input-streaming':
                            return <div key={callId}>Preparando solicitação de resultado da análise...</div>
                          case 'input-available':
                            return <div key={callId}>Obtendo resultado da análise...</div>;
                          case 'output-available':
                            return <div key={callId}>Resultado da análise: {JSON.stringify(part?.output)}</div>;
                          case 'output-error':
                            return (
                              <div key={callId}>
                                Erro ao obter resultado da análise: {JSON.stringify(part.errorText)}
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

          {/* {isLoading && (
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="bg-gray-100 text-gray-900 px-4 py-3 rounded-lg rounded-bl-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:0.1s]"></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                </div>
              </div>
            </div>
          )} */}
        </div>

        {/* Input */}
        <div className="border-t p-4 bg-gray-50 rounded-b-lg">
          {messages.length > 0 && (
            <div className="mb-4">
              <FileUpload
                onFileSelect={handleFileSelect}
              // disabled={isLoading} 
              />
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex space-x-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Faça uma pergunta sobre seus dados ou análise de dados..."
              className="flex-1 border border-gray-300 rounded-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            // disabled={isLoading}
            />
            <Button
              type="submit"
              // disabled={isLoading || !input.trim()}
              className="rounded-full px-6 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>

          <p className="text-xs text-gray-500 mt-2 text-center">
            Faça upload de arquivos CSV • Pergunte sobre análise de dados • Obtenha insights e recomendações
          </p>
        </div>
      </div>
    </div>
  )
}