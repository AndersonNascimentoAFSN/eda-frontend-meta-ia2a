'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Upload } from 'lucide-react'

interface FileUploadProps {
  onFileSelect: (file: File) => void
  disabled?: boolean
}

export function FileUpload({ onFileSelect, disabled }: FileUploadProps) {
  const [dragOver, setDragOver] = useState(false)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === 'text/csv') {
      onFileSelect(file)
    } else {
      alert('Por favor, selecione um arquivo CSV')
    }
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragOver(false)
    
    const file = event.dataTransfer.files[0]
    if (file && file.type === 'text/csv') {
      onFileSelect(file)
    } else {
      alert('Por favor, solte um arquivo CSV')
    }
  }

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
        dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
      } ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
      onDragOver={(e) => {
        e.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
      <p className="text-lg font-medium text-gray-900 mb-2">Upload Arquivo CSV</p>
      <p className="text-sm text-gray-500 mb-4">Arraste e solte seu arquivo CSV aqui, ou clique para navegar</p>
      
      <input
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        className="hidden"
        id="file-upload"
        disabled={disabled}
      />
      
      <Button asChild disabled={disabled}>
        <label htmlFor="file-upload" className="cursor-pointer">
          Escolher Arquivo
        </label>
      </Button>
    </div>
  )
}