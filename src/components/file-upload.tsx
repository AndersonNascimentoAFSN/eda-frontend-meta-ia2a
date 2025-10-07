'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

interface FileUploadProps {
  onFileUploaded: (fileKey: string, fileName: string, fileSize: number) => void
  disabled?: boolean
}

interface UploadState {
  status: 'idle' | 'uploading' | 'success' | 'error'
  message: string
  progress: number
}

export function FileUpload({ onFileUploaded, disabled }: FileUploadProps) {
  const [dragOver, setDragOver] = useState(false)
  const [uploadState, setUploadState] = useState<UploadState>({
    status: 'idle',
    message: '',
    progress: 0
  })

  const resetUploadState = () => {
    setUploadState({
      status: 'idle',
      message: '',
      progress: 0
    })
  }

  const handleFileUpload = async (file: File) => {
    if (!file) return

    // Validações
    if (!file.name.endsWith('.csv')) {
      setUploadState({
        status: 'error',
        message: 'Por favor, selecione apenas arquivos CSV',
        progress: 0
      })
      return
    }

    const maxSizeBytes = 160 * 1024 * 1024 // 160MB
    if (file.size > maxSizeBytes) {
      setUploadState({
        status: 'error',
        message: 'Arquivo muito grande. Máximo permitido: 160MB',
        progress: 0
      })
      return
    }

    try {
      setUploadState({
        status: 'uploading',
        message: `Enviando ${file.name}...`,
        progress: 50
      })

      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (result.success) {
        setUploadState({
          status: 'success',
          message: `${file.name} enviado com sucesso! (${result.fileSizeMB}MB)`,
          progress: 100
        })

        // Notificar o componente pai sobre o upload
        onFileUploaded(result.file_key, result.fileName, result.fileSize)

        // Reset após 3 segundos
        setTimeout(resetUploadState, 3000)
      } else {
        setUploadState({
          status: 'error',
          message: result.error || 'Erro no upload',
          progress: 0
        })
      }
    } catch (error) {
      setUploadState({
        status: 'error',
        message: error instanceof Error ? error.message : 'Erro no upload',
        progress: 0
      })
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
    // Reset input para permitir re-upload do mesmo arquivo
    event.target.value = ''
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragOver(false)
    
    const file = event.dataTransfer.files[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  const isActive = uploadState.status === 'uploading'
  const isSuccess = uploadState.status === 'success'
  const isError = uploadState.status === 'error'

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
        dragOver 
          ? 'border-blue-500 bg-blue-50' 
          : isSuccess 
            ? 'border-green-500 bg-green-50'
            : isError
              ? 'border-red-500 bg-red-50'
              : 'border-gray-300'
      } ${disabled || isActive ? 'opacity-50 pointer-events-none' : ''}`}
      onDragOver={(e) => {
        e.preventDefault()
        if (!disabled && !isActive) setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      {/* Ícone */}
      <div className="mb-4">
        {isActive ? (
          <Loader2 className="mx-auto h-12 w-12 text-blue-500 animate-spin" />
        ) : isSuccess ? (
          <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
        ) : isError ? (
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
        ) : (
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
        )}
      </div>

      {/* Título */}
      <p className={`text-lg font-medium mb-2 ${
        isSuccess ? 'text-green-800' : isError ? 'text-red-800' : 'text-gray-900'
      }`}>
        {isActive ? 'Enviando arquivo...' : 
         isSuccess ? 'Upload concluído!' :
         isError ? 'Erro no upload' :
         'Upload Arquivo CSV'}
      </p>

      {/* Mensagem */}
      {uploadState.message && (
        <p className={`text-sm mb-4 ${
          isSuccess ? 'text-green-600' : isError ? 'text-red-600' : 'text-gray-500'
        }`}>
          {uploadState.message}
        </p>
      )}

      {/* Progress bar */}
      {isActive && (
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div 
            className={`bg-blue-600 h-2 rounded-full transition-all duration-300 ${
              uploadState.progress > 75 ? 'w-full' :
              uploadState.progress > 50 ? 'w-3/4' :
              uploadState.progress > 25 ? 'w-1/2' : 'w-1/4'
            }`}
          />
        </div>
      )}

      {/* Instruções padrão */}
      {uploadState.status === 'idle' && (
        <p className="text-sm text-gray-500 mb-4">
          Arraste e solte seu arquivo CSV aqui, ou clique para navegar
        </p>
      )}
      
      {/* Input file */}
      <input
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        className="hidden"
        id="file-upload"
        disabled={disabled || isActive}
      />
      
      {/* Botão */}
      {uploadState.status === 'idle' && (
        <Button asChild disabled={disabled || isActive}>
          <label htmlFor="file-upload" className="cursor-pointer">
            Escolher Arquivo
          </label>
        </Button>
      )}

      {/* Botão de retry em caso de erro */}
      {isError && (
        <Button 
          onClick={resetUploadState}
          variant="outline"
          className="mt-2"
        >
          Tentar novamente
        </Button>
      )}
    </div>
  )
}