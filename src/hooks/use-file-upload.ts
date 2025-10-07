'use client'

import { useState, useTransition } from 'react'
import { uploadFileAction, checkAnalysisStatusAction, getAnalysisResultAction } from '@/app/actions/upload'
import { AnalysisManager } from '@/lib/analysis-manager'

interface UploadResult {
  fileName: string
  fileSize: number
  analysisId: string
  status: string
  fileKey: string
}

interface UploadState {
  isUploading: boolean
  progress: number
  error: string | null
  success: boolean
  analysisId: string | null
  fileName: string | null
  fileSize: number | null
}

export function useFileUpload() {
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null,
    success: false,
    analysisId: null,
    fileName: null,
    fileSize: null
  })

  const [isPending, startTransition] = useTransition()

  const uploadFile = async (file: File): Promise<UploadResult | undefined> => {
    setUploadState({
      isUploading: true,
      progress: 0,
      error: null,
      success: false,
      analysisId: null,
      fileName: file.name,
      fileSize: file.size
    })

    return new Promise((resolve, reject) => {
      startTransition(async () => {
        try {
          // Simular progresso de upload
          setUploadState(prev => ({ ...prev, progress: 25 }))

          const formData = new FormData()
          formData.append('file', file)

          setUploadState(prev => ({ ...prev, progress: 50 }))

          const result = await uploadFileAction(formData)

          setUploadState(prev => ({ ...prev, progress: 75 }))

          if (!result.success) {
            throw new Error(result.error || 'Erro durante o upload')
          }

          // Armazenar análise no manager
          if (result.data) {
            AnalysisManager.addAnalysis(
              result.data.analysisId,
              result.data.fileName,
              result.data.status
            )
          }

          setUploadState(prev => ({
            ...prev,
            progress: 100,
            success: true,
            isUploading: false,
            analysisId: result.data?.analysisId || null
          }))

          resolve(result.data)

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido durante o upload'
          
          setUploadState(prev => ({
            ...prev,
            isUploading: false,
            error: errorMessage,
            success: false,
            progress: 0
          }))

          reject(error)
        }
      })
    })
  }

  const checkAnalysisStatus = async (analysisId: string) => {
    try {
      const result = await checkAnalysisStatusAction(analysisId)
      
      if (!result.success) {
        throw new Error(result.error || 'Erro ao verificar status')
      }

      return result.data

    } catch (error) {
      console.error('Error checking analysis status:', error)
      throw error
    }
  }

  const getAnalysisResult = async (analysisId: string) => {
    try {
      const result = await getAnalysisResultAction(analysisId)
      
      if (!result.success) {
        throw new Error(result.error || 'Erro ao obter resultados')
      }

      return result.data

    } catch (error) {
      console.error('Error getting analysis result:', error)
      throw error
    }
  }

  const resetUploadState = () => {
    setUploadState({
      isUploading: false,
      progress: 0,
      error: null,
      success: false,
      analysisId: null,
      fileName: null,
      fileSize: null
    })
  }

  return {
    uploadState,
    isPending,
    uploadFile,
    checkAnalysisStatus,
    getAnalysisResult,
    resetUploadState
  }
}