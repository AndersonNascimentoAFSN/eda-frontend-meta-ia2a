'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, Paperclip } from 'lucide-react'

interface SimpleUploadProps {
  onFileSelect: (file: File) => void
}

export function SimpleUpload({ onFileSelect }: SimpleUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.name.endsWith('.csv') || file.type === 'text/csv') {
        setSelectedFile(file)
        onFileSelect(file)
      } else {
        alert('Por favor, selecione apenas arquivos CSV')
      }
    }
  }

  const triggerFileInput = () => {
    const input = document.getElementById('simple-file-input') as HTMLInputElement
    if (input) {
      input.click()
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 border-2 border-dashed border-gray-300 rounded-lg">
      <div className="text-center">
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Upload de Arquivo CSV
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Selecione um arquivo CSV para análise
        </p>
        
        <input
          id="simple-file-input"
          type="file"
          accept=".csv,text/csv"
          onChange={handleFileChange}
          className="hidden"
          aria-label="Selecionar arquivo CSV"
        />
        
        <Button 
          onClick={triggerFileInput}
          className="w-full"
        >
          <Paperclip className="w-4 h-4 mr-2" />
          Escolher Arquivo
        </Button>
        
        {selectedFile && (
          <p className="mt-3 text-sm text-green-600">
            ✓ Arquivo selecionado: {selectedFile.name}
          </p>
        )}
      </div>
    </div>
  )
}