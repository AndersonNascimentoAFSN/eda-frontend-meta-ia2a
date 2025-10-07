'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, X, CheckCircle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileUploadDirectProps {
  onFileUploaded: (fileKey: string, fileName: string, fileSize: number) => void
  className?: string
}

interface UploadState {
  status: 'idle' | 'preparing' | 'uploading' | 'success' | 'error'
  message: string
  progress: number
}

interface PresignedUrlResponse {
  upload_url: string
  file_key: string
  fileName: string
  fileSize: number
  fileSizeMB: string
}

export function FileUploadDirect({ onFileUploaded, className }: FileUploadDirectProps) {
  const [uploadState, setUploadState] = useState<UploadState>({
    status: 'idle',
    message: '',
    progress: 0
  })
  const [dragOver, setDragOver] = useState(false)

  const resetUploadState = useCallback(() => {
    setUploadState({
      status: 'idle',
      message: '',
      progress: 0
    })
  }, [])

  const handleFileUpload = useCallback(async (file: File) => {
    try {
      // Validações iniciais
      if (!file.name.toLowerCase().endsWith('.csv')) {
        setUploadState({
          status: 'error',
          message: 'Por favor, selecione apenas arquivos CSV',
          progress: 0
        })
        return
      }

      const maxSize = 200 * 1024 * 1024 // 200MB
      if (file.size > maxSize) {
        setUploadState({
          status: 'error',
          message: 'Arquivo muito grande. Máximo permitido: 200MB',
          progress: 0
        })
        return
      }

      // Passo 1: Obter URL pré-assinada
      setUploadState({
        status: 'preparing',
        message: 'Preparando upload...',
        progress: 10
      })

      const response = await fetch('/api/presigned-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: file.name,
          fileSize: file.size,
          contentType: 'text/csv',
        }),
      })

      if (!response.ok) {
        throw new Error(`Erro ao obter URL: ${response.status}`)
      }

      const result: PresignedUrlResponse = await response.json()
      
      if (!result.upload_url) {
        throw new Error('URL de upload não recebida')
      }

      // Passo 2: Upload direto para R2 (bypassa Vercel)
      setUploadState({
        status: 'uploading',
        message: `Enviando ${file.name} para nuvem...`,
        progress: 30
      })

      let uploadResponse: Response
      
      try {
        // Tentar upload direto primeiro
        uploadResponse = await fetch(result.upload_url, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': 'text/csv',
          },
        })
        
        if (!uploadResponse.ok) {
          throw new Error(`Upload failed: ${uploadResponse.status}`)
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        
        // Se erro de CORS ou Failed to fetch, tentar proxy
        if (errorMessage.includes('Failed to fetch') || 
            errorMessage.includes('CORS') ||
            errorMessage.includes('Network')) {
          
          console.log('🔄 Upload direto falhou (CORS), tentando proxy...')
          setUploadState({
            status: 'uploading',
            message: `Tentando via proxy CORS...`,
            progress: 40
          })
          
          // Fallback: usar proxy CORS do backend
          const backendUrl = process.env.NEXT_PUBLIC_EDA_BACKEND_URL || 'http://localhost:8000'
          const proxyUrl = `${backendUrl}/cors-proxy/r2-upload?target_url=${encodeURIComponent(result.upload_url)}`
          
          uploadResponse = await fetch(proxyUrl, {
            method: 'PUT',
            body: file,
            headers: {
              'Content-Type': 'text/csv',
            },
          })
          
          if (!uploadResponse.ok) {
            throw new Error(`Proxy upload failed: ${uploadResponse.status}`)
          }
        } else {
          throw error
        }
      }

      // Upload bem-sucedido
      setUploadState({
        status: 'success',
        message: `${file.name} enviado com sucesso! (${result.fileSizeMB})`,
        progress: 100
      })

      // Notificar o componente pai sobre o upload
      onFileUploaded(result.file_key, result.fileName, result.fileSize)

      // Reset após 3 segundos
      setTimeout(resetUploadState, 3000)

    } catch (error) {
      console.error('Upload error:', error)
      setUploadState({
        status: 'error',
        message: error instanceof Error ? error.message : 'Erro no upload',
        progress: 0
      })
    }
  }, [onFileUploaded, resetUploadState])

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
  }, [handleFileUpload])

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    setDragOver(false)
  }, [])

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    setDragOver(false)
    
    const file = event.dataTransfer.files[0]
    if (file) {
      handleFileUpload(file)
    }
  }, [handleFileUpload])

  const isActive = uploadState.status === 'uploading' || uploadState.status === 'preparing'
  const isSuccess = uploadState.status === 'success'
  const isError = uploadState.status === 'error'

  return (
    <div className={cn("w-full max-w-2xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200", className)}>
      <div className="p-6">
        <div
          className={cn(
            "relative border-2 border-dashed rounded-lg p-8 text-center transition-colors",
            dragOver && "border-blue-500 bg-blue-50",
            isActive && "border-yellow-500 bg-yellow-50",
            isSuccess && "border-green-500 bg-green-50",
            isError && "border-red-500 bg-red-50",
            !dragOver && !isActive && !isSuccess && !isError && "border-gray-300 hover:border-gray-400"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Progress Bar */}
          {isActive && (
            <div 
              className="absolute top-0 left-0 h-1 bg-blue-500 transition-all duration-300 ease-out rounded-t-lg"
              style={{ width: `${uploadState.progress}%` }} 
            />
          )}

          {/* Status Icons */}
          <div className="mb-4">
            {isActive && (
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto" />
            )}
            {isSuccess && (
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
            )}
            {isError && (
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
            )}
            {uploadState.status === 'idle' && (
              <Upload className="h-12 w-12 text-gray-400 mx-auto" />
            )}
          </div>

          {/* Status Message */}
          <div className="space-y-2">
            <p className={cn(
              "text-lg font-medium",
              isSuccess && "text-green-700",
              isError && "text-red-700",
              isActive && "text-blue-700",
              uploadState.status === 'idle' && "text-gray-700"
            )}>
              {uploadState.message || "Clique ou arraste arquivos CSV aqui"}
            </p>
            
            {uploadState.status === 'idle' && (
              <p className="text-sm text-gray-500">
                Suporta arquivos até 200MB • Formatos: CSV
              </p>
            )}
          </div>

          {/* Upload Button */}
          {uploadState.status === 'idle' && (
            <div className="mt-6">
              <Button asChild disabled={isActive}>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={isActive}
                  />
                  Selecionar Arquivo
                </label>
              </Button>
            </div>
          )}

          {/* Reset Button */}
          {(isError || isSuccess) && (
            <div className="mt-4">
              <Button 
                variant="outline" 
                onClick={resetUploadState}
                className="inline-flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Enviar Outro Arquivo
              </Button>
            </div>
          )}
        </div>

        {/* Technical Info */}
        {isActive && (
          <div className="mt-4 text-sm text-gray-600 space-y-1">
            <p>📊 Progresso: {uploadState.progress}%</p>
            <p>☁️ Upload direto para Cloudflare R2</p>
            <p>🚀 Bypassa limitações do Vercel</p>
          </div>
        )}
      </div>
    </div>
  )
}