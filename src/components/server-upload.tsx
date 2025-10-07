'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, Paperclip, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { useFileUpload } from '@/hooks/use-file-upload'

interface UploadResult {
  fileName: string
  fileSize: number
  analysisId: string
  status: string
  fileKey: string
}

interface ServerUploadProps {
  onUploadStart?: (fileName: string) => void
  onUploadComplete?: (result: UploadResult) => void
  onUploadError?: (error: string) => void
}

export function ServerUpload({ onUploadStart, onUploadComplete, onUploadError }: ServerUploadProps) {
  const { uploadState, uploadFile } = useFileUpload()
  const [isDragOver, setIsDragOver] = useState(false)

  const handleFileSelect = async (file: File) => {
    try {
      onUploadStart?.(file.name)
      const result = await uploadFile(file)
      if (result) {
        onUploadComplete?.(result)
      }
    } catch (error) {
      onUploadError?.(error instanceof Error ? error.message : 'Erro durante upload')
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        handleFileSelect(file)
      } else {
        onUploadError?.('Formato de arquivo inválido. Por favor, selecione apenas arquivos CSV (.csv).')
      }
      e.target.value = ''
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const file = e.dataTransfer.files?.[0]
    if (file) {
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        handleFileSelect(file)
      } else {
        onUploadError?.('Formato de arquivo inválido. Por favor, selecione apenas arquivos CSV (.csv).')
      }
    }
  }

  const triggerFileInput = () => {
    const input = document.getElementById('server-upload-input') as HTMLInputElement
    if (input && !uploadState.isUploading) {
      input.click()
    }
  }

  const getStatusIcon = () => {
    if (uploadState.error) return <XCircle className="h-8 w-8 text-red-500" />
    if (uploadState.success) return <CheckCircle className="h-8 w-8 text-green-500" />
    if (uploadState.isUploading) return <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
    return <Upload className="h-8 w-8 text-gray-400" />
  }

  const getStatusMessage = () => {
    if (uploadState.error) return `Erro: ${uploadState.error}`
    if (uploadState.success) return `Upload concluído: ${uploadState.fileName}`
    if (uploadState.isUploading) return `Enviando ${uploadState.fileName}...`
    return 'Arraste um arquivo CSV ou clique para selecionar'
  }

  return (
    <div className="max-w-md mx-auto">
      {/* Área principal de upload */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
          isDragOver
            ? 'border-blue-500 bg-blue-50'
            : uploadState.error
            ? 'border-red-300 bg-red-50'
            : uploadState.success
            ? 'border-green-300 bg-green-50'
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
        }`}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragOver(true)
        }}
        onDragLeave={(e) => {
          e.preventDefault()
          setIsDragOver(false)
        }}
        onClick={triggerFileInput}
      >
        <div className="flex flex-col items-center space-y-4">
          {getStatusIcon()}
          
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Upload de Arquivo CSV
            </h3>
            <p className="text-sm text-gray-600">
              {getStatusMessage()}
            </p>
            {!uploadState.isUploading && !uploadState.success && (
              <p className="text-xs text-gray-500 mt-2">
                Arquivos CSV até 200MB
              </p>
            )}
          </div>

          <input
            id="server-upload-input"
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileInput}
            className="hidden"
            disabled={uploadState.isUploading}
            aria-label="Selecionar arquivo CSV"
          />

          {!uploadState.isUploading && !uploadState.success && (
            <Button 
              type="button"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation()
                triggerFileInput()
              }}
              disabled={uploadState.isUploading}
            >
              <Paperclip className="w-4 h-4 mr-2" />
              Escolher Arquivo
            </Button>
          )}
        </div>
      </div>

      {/* Barra de progresso */}
      {(uploadState.isUploading || uploadState.success || uploadState.error) && (
        <div className="mt-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 truncate">
              {uploadState.fileName}
              {uploadState.fileSize && (
                <span className="text-gray-400 ml-1">
                  ({(uploadState.fileSize / 1024 / 1024).toFixed(2)}MB)
                </span>
              )}
            </span>
            <span className="text-gray-600 ml-2">
              {uploadState.progress}%
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full progress-bar ${
                uploadState.error ? 'bg-red-500' :
                uploadState.success ? 'bg-green-500' : 'bg-blue-500'
              } ${
                uploadState.progress === 0 ? 'progress-0' :
                uploadState.progress <= 25 ? 'progress-25' :
                uploadState.progress <= 50 ? 'progress-50' :
                uploadState.progress <= 75 ? 'progress-75' : 'progress-100'
              }`}
            />
          </div>

          {uploadState.analysisId && (
            <p className="text-xs text-gray-600">
              ID da análise: <span className="font-mono text-blue-600">{uploadState.analysisId}</span>
            </p>
          )}

          {(uploadState.success || uploadState.error) && (
            <div className="flex justify-center">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => window.location.reload()}
              >
                Enviar outro arquivo
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}