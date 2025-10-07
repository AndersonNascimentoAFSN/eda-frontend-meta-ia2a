'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Paperclip, Upload, CheckCircle, XCircle } from 'lucide-react'
import { useFileUpload } from '@/hooks/use-file-upload'

interface UploadResult {
  fileName: string
  fileSize: number
  analysisId: string
  status: string
  fileKey: string
}

interface UploadProgressProps {
  onUploadComplete?: (result: UploadResult) => void
  onUploadError?: (error: string) => void
  onUploadStart?: (fileName: string) => void
}

export function UploadProgress({ onUploadComplete, onUploadError, onUploadStart }: UploadProgressProps) {
  const { uploadState, uploadFile, resetUploadState } = useFileUpload()
  const [isDragOver, setIsDragOver] = useState(false)

  const handleFileSelect = async (file: File) => {
    try {
      onUploadStart?.(file.name)
      
      const result = await uploadFile(file)
      
      if (uploadState.success && result) {
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
      e.target.value = '' // Reset input
    }
  }

  const handleButtonClick = () => {
    const input = document.getElementById('file-upload-input') as HTMLInputElement
    if (input) {
      input.click()
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const getProgressColor = () => {
    if (uploadState.error) return 'bg-red-500'
    if (uploadState.success) return 'bg-green-500'
    return 'bg-blue-500'
  }

  const getStatusIcon = () => {
    if (uploadState.error) return <XCircle className="h-5 w-5 text-red-500" />
    if (uploadState.success) return <CheckCircle className="h-5 w-5 text-green-500" />
    if (uploadState.isUploading) return <Upload className="h-5 w-5 text-blue-500 animate-pulse" />
    return <Paperclip className="h-5 w-5 text-gray-500" />
  }

  const getStatusMessage = () => {
    if (uploadState.error) return `Erro: ${uploadState.error}`
    if (uploadState.success) return `Upload concluído: ${uploadState.fileName}`
    if (uploadState.isUploading) return `Enviando ${uploadState.fileName}...`
    return 'Arraste um arquivo CSV ou clique para selecionar'
  }

  return (
    <div className="space-y-4">
      {/* Área de upload */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragOver
            ? 'border-blue-500 bg-blue-50'
            : uploadState.error
            ? 'border-red-300 bg-red-50'
            : uploadState.success
            ? 'border-green-300 bg-green-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="flex flex-col items-center space-y-3">
          {getStatusIcon()}
          
          <div>
            <p className="text-sm font-medium text-gray-900">
              {getStatusMessage()}
            </p>
            {!uploadState.isUploading && !uploadState.success && (
              <p className="text-xs text-gray-500 mt-1">
                Arquivos CSV até 200MB
              </p>
            )}
          </div>

          {!uploadState.isUploading && !uploadState.success && (
            <div>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileInput}
                className="hidden"
                id="file-upload-input"
                disabled={uploadState.isUploading}
                aria-label="Selecionar arquivo CSV"
              />
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={handleButtonClick}
                disabled={uploadState.isUploading}
              >
                <Paperclip className="h-4 w-4 mr-2" />
                Selecionar arquivo
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Barra de progresso */}
      {(uploadState.isUploading || uploadState.success || uploadState.error) && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">
              {uploadState.fileName} 
              {uploadState.fileSize && (
                <span className="text-gray-400 ml-1">
                  ({(uploadState.fileSize / 1024 / 1024).toFixed(2)}MB)
                </span>
              )}
            </span>
            <span className="text-gray-600">
              {uploadState.progress}%
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${getProgressColor()}`}
              data-progress={uploadState.progress}
            />
          </div>

          {uploadState.analysisId && (
            <p className="text-xs text-gray-600">
              ID da análise: <span className="font-mono">{uploadState.analysisId}</span>
            </p>
          )}

          {(uploadState.success || uploadState.error) && (
            <div className="flex justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={resetUploadState}
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