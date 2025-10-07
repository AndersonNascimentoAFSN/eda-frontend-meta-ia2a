import { NextRequest, NextResponse } from 'next/server'
import { EdaService } from '@/services/eda-service'

// Esta API apenas obtém a URL pré-assinada
// O upload real acontece diretamente do frontend para R2
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fileName, fileSize } = body
    
    // Validações básicas
    if (!fileName) {
      return NextResponse.json(
        { success: false, error: 'Nome do arquivo não fornecido' },
        { status: 400 }
      )
    }
    
    if (!fileName.endsWith('.csv')) {
      return NextResponse.json(
        { success: false, error: 'Apenas arquivos CSV são suportados' },
        { status: 400 }
      )
    }

    // Verificar tamanho do arquivo (máximo 160MB)
    const maxSizeBytes = 160 * 1024 * 1024 // 160MB
    if (fileSize && fileSize > maxSizeBytes) {
      return NextResponse.json(
        { success: false, error: 'Arquivo muito grande. Máximo permitido: 160MB' },
        { status: 400 }
      )
    }
    
    console.log(`📁 Preparando upload: ${fileName} (${fileSize ? (fileSize / 1024 / 1024).toFixed(2) + 'MB' : 'tamanho desconhecido'})`)
    
    // Obter URL pré-assinada
    console.log('🔗 Solicitando URL pré-assinada...')
    const presignedData = await EdaService.getPresignedUrl(fileName)
    
    console.log('✅ URL pré-assinada gerada com sucesso!')
    
    return NextResponse.json({
      success: true,
      upload_url: presignedData.upload_url,
      file_key: presignedData.file_key,
      fileName: fileName,
      fileSize: fileSize,
      fileSizeMB: fileSize ? Math.round((fileSize / 1024 / 1024) * 100) / 100 : 0,
      message: `URL de upload gerada para ${fileName}`
    })
    
  } catch (error) {
    console.error('❌ Erro ao gerar URL de upload:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        message: `Falha ao gerar URL de upload: ${errorMessage}`
      },
      { status: 500 }
    )
  }
}