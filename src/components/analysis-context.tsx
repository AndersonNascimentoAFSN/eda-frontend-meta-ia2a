'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AnalysisManager } from '@/lib/analysis-manager'
import { Copy } from 'lucide-react'

interface ActiveAnalysis {
  id: string
  filename: string
  status: string
  startedAt: string
}

export function AnalysisContext() {
  const [latestAnalysis, setLatestAnalysis] = useState<ActiveAnalysis | null>(null)

  useEffect(() => {
    const analysis = AnalysisManager.getLatestAnalysis()
    setLatestAnalysis(analysis)
  }, [])

  if (!latestAnalysis) {
    return null
  }

  const copyId = () => {
    navigator.clipboard.writeText(latestAnalysis.id)
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span className="text-sm font-medium text-blue-900">
            Análise Ativa
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={copyId}
          className="h-6 px-2 text-blue-600 hover:text-blue-800"
        >
          <Copy className="w-3 h-3 mr-1" />
          Copiar ID
        </Button>
      </div>
      
      <div className="mt-2 space-y-1 text-sm text-blue-800">
        <div className="flex justify-between">
          <span>Arquivo:</span>
          <span className="font-mono text-xs">{latestAnalysis.filename}</span>
        </div>
        <div className="flex justify-between">
          <span>Status:</span>
          <span className={`font-medium ${
            latestAnalysis.status === 'completed' ? 'text-green-600' :
            latestAnalysis.status === 'pending' ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {latestAnalysis.status}
          </span>
        </div>
        <div className="flex justify-between">
          <span>ID:</span>
          <span className="font-mono text-xs truncate max-w-32" title={latestAnalysis.id}>
            {latestAnalysis.id}
          </span>
        </div>
      </div>
      
      <div className="mt-3 p-2 bg-blue-100 rounded text-xs text-blue-700">
        💡 <strong>Dica:</strong> Pergunte &quot;Como está minha análise?&quot; ou &quot;Mostre os resultados&quot; 
        e eu usarei automaticamente este ID de análise.
      </div>
    </div>
  )
}