import { NextRequest, NextResponse } from 'next/server'
import { EdaService } from '@/services/eda-service'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    // Validações
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Arquivo não fornecido' },
        { status: 400 }
      )
    }
    
    if (!file.name.endsWith('.csv')) {
      return NextResponse.json(
        { success: false, error: 'Apenas arquivos CSV são suportados' },
        { status: 400 }
      )
    }

    // Verificar tamanho do arquivo (máximo 160MB)
    const maxSizeBytes = 160 * 1024 * 1024 // 160MB
    if (file.size > maxSizeBytes) {
      return NextResponse.json(
        { success: false, error: 'Arquivo muito grande. Máximo permitido: 160MB' },
        { status: 400 }
      )
    }
    
    console.log(`📁 Processando upload: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`)
    
    // 1. Obter URL pré-assinada
    console.log('🔗 Solicitando URL pré-assinada...')
    const presignedData = await EdaService.getPresignedUrl(file.name)
    
    // 2. Upload para R2
    console.log('⬆️ Fazendo upload para R2...')
    await EdaService.uploadToR2(presignedData.upload_url, file)
    
    console.log('✅ Upload concluído com sucesso!')
    
    return NextResponse.json({
      success: true,
      file_key: presignedData.file_key,
      fileName: file.name,
      fileSize: file.size,
      fileSizeMB: Math.round((file.size / 1024 / 1024) * 100) / 100,
      message: `Arquivo ${file.name} enviado com sucesso`
    })
    
  } catch (error) {
    console.error('❌ Erro no upload:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido no upload'
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        message: `Falha no upload: ${errorMessage}`
      },
      { status: 500 }
    )
  }
}