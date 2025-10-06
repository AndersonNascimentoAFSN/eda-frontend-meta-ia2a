# EDA Frontend - Assistente de Análise Exploratória de Dados

## 📊 Visão Geral

O EDA Frontend é uma aplicação Next.js que oferece uma interface conversacional com IA para análise exploratória de dados. Utilizando o Vercel AI SDK, permite que usuários façam upload de arquivos CSV e obtenham insights detalhados através de um chat inteligente.

## 🚀 Funcionalidades Implementadas

### 1. **Chat Conversacional com IA**
- Interface moderna e responsiva usando Tailwind CSS
- Integração com OpenAI via Vercel AI SDK
- Sistema de mensagens em tempo real
- Loading states e feedback visual

### 2. **Upload e Processamento de Arquivos**
- Upload de arquivos CSV via drag & drop ou seleção
- Conversão automática para base64
- Validação de tipo de arquivo
- Feedback visual durante upload

### 3. **Tools Personalizadas para EDA**
- **`uploadAndAnalyzeData`**: Fluxo completo de upload e início de análise
- **`checkAnalysisStatus`**: Monitoramento de progresso em tempo real
- **`getAnalysisResult`**: Recuperação de resultados detalhados

### 4. **Integração com Backend EDA**
- Comunicação com API FastAPI do backend
- Gerenciamento de URLs pré-assinadas para Cloudflare R2
- Upload direto para armazenamento em nuvem
- Monitoramento de status de análises

### 5. **Componentes UI Modernos**
- Componentes reutilizáveis com Radix UI
- Design system consistente
- Estados de carregamento e erro
- Animações suaves

## 🛠️ Tecnologias Utilizadas

- **Next.js 15** - Framework React
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **Vercel AI SDK** - Integração com IA
- **Zod** - Validação de schemas
- **Lucide React** - Ícones
- **Radix UI** - Componentes primitivos

## 📁 Estrutura do Projeto

```
eda-frontend/
├── src/
│   ├── app/
│   │   ├── api/chat/
│   │   │   └── route.ts          # API route para chat
│   │   ├── globals.css           # Estilos globais
│   │   ├── layout.tsx            # Layout principal
│   │   └── page.tsx              # Página inicial
│   ├── components/
│   │   ├── ui/
│   │   │   └── button.tsx        # Componente de botão
│   │   ├── chat.tsx              # Componente principal do chat
│   │   └── file-upload.tsx       # Componente de upload
│   ├── lib/
│   │   ├── ai/
│   │   │   └── tools.ts          # Tools personalizadas para IA
│   │   └── utils.ts              # Utilitários
│   ├── services/
│   │   └── eda-service.ts        # Serviços para comunicação com backend
│   └── types/
│       └── eda.ts                # Tipos TypeScript
├── .env.local                    # Variáveis de ambiente
├── package.json                  # Dependências
└── tailwind.config.js           # Configuração Tailwind
```

## ⚙️ Configuração

### 1. Variáveis de Ambiente

Crie um arquivo `.env.local` com:

```bash
# OpenAI API Key
OPENAI_API_KEY=your_openai_api_key_here

# EDA Backend URL
EDA_BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_EDA_BACKEND_URL=http://localhost:8000
```

### 2. Instalação

```bash
cd eda-frontend
npm install
```

### 3. Execução

```bash
# Desenvolvimento
npm run dev

# Produção
npm run build
npm start
```

## 🔄 Fluxo de Uso

### 1. **Início da Conversa**
- Usuário acessa http://localhost:3000
- Interface de boas-vindas com opção de upload

### 2. **Upload de Arquivo**
- Usuário faz upload de arquivo CSV
- Sistema automaticamente:
  - Solicita URL pré-assinada ao backend
  - Faz upload para Cloudflare R2
  - Inicia análise exploratória

### 3. **Monitoramento**
- IA monitora progresso automaticamente
- Usuário pode perguntar sobre status
- Feedback em tempo real

### 4. **Resultados**
- Quando análise completa, resultados são apresentados
- IA explica insights em linguagem natural
- Usuário pode fazer perguntas específicas sobre os dados

## 🎯 Tools Implementadas

### `uploadAndAnalyzeData`
```typescript
// Parâmetros:
{
  fileName: string,
  fileContent: string, // base64
  analysisType?: string
}

// Retorna:
{
  success: boolean,
  analysisId: string,
  message: string,
  status: string
}
```

### `checkAnalysisStatus`
```typescript
// Parâmetros:
{
  analysisId?: string // opcional, usa o mais recente se não fornecido
}

// Retorna:
{
  success: boolean,
  analysisId: string,
  status: 'pending' | 'processing' | 'completed' | 'failed',
  progress?: number,
  message: string,
  results?: object, // se completo
  isComplete: boolean
}
```

### `getAnalysisResult`
```typescript
// Parâmetros:
{
  analysisId?: string // opcional
}

// Retorna:
{
  success: boolean,
  analysisId: string,
  results: {
    basic_info: object,
    missing_values: object,
    statistical_summary: object,
    correlations: object,
    visualizations: object,
    insights: string[]
  },
  message: string
}
```

## 🧠 Sistema de IA

O assistente é configurado com:

- **Especialização**: Análise exploratória de dados
- **Personalidade**: Especialista amigável e didático
- **Capacidades**: 
  - Explicação de conceitos estatísticos
  - Interpretação de resultados
  - Recomendações de próximos passos
  - Suporte técnico

## 🌐 Integração com Backend

### Endpoints Utilizados:
- `POST /api/v1/r2/presigned-upload` - URLs pré-assinadas
- `POST /api/v1/analysis/start` - Iniciar análise
- `GET /api/v1/analysis/status/{id}` - Status da análise
- `GET /api/v1/analysis/results/{id}` - Resultados da análise

### Fluxo de Comunicação:
1. Frontend → Backend: Solicita URL pré-assinada
2. Frontend → R2: Upload direto do arquivo
3. Frontend → Backend: Inicia análise com URL do arquivo
4. Frontend → Backend: Monitora progresso
5. Frontend → Backend: Recupera resultados

## 📱 Interface do Usuário

### Características:
- **Responsiva**: Adapta-se a diferentes tamanhos de tela
- **Moderna**: Design clean com gradientes e animações
- **Intuitiva**: Fluxo de uso natural e claro
- **Acessível**: Componentes semânticos e navegação por teclado

### Componentes Principais:
- **Header**: Branding e informações do assistente
- **Chat Area**: Área de conversa com histórico
- **File Upload**: Zona de upload com drag & drop
- **Input**: Campo de entrada com botão de envio
- **Loading States**: Indicadores visuais de progresso

## 🔧 Desenvolvimento

### Scripts Disponíveis:
```bash
npm run dev      # Servidor de desenvolvimento
npm run build    # Build de produção
npm run start    # Servidor de produção
npm run lint     # Verificação de código
```

### Estrutura de Dados:
- **Estado local**: Gerenciado pelo `useChat` hook
- **Persistência**: Análises ativas em Map local
- **Tipos**: Totalmente tipado com TypeScript
- **Validação**: Schemas Zod para APIs

## 🎨 Customização

### Temas:
- Variáveis CSS personalizáveis
- Sistema de cores consistente
- Suporte a modo escuro (preparado)

### Componentes:
- Arquitetura modular
- Props tipadas
- Fácil extensão e modificação

## 📊 Resultado Final

O frontend oferece uma experiência completa para análise exploratória de dados:

1. **Interface Amigável**: Chat conversacional intuitivo
2. **Integração Completa**: Comunicação seamless com backend
3. **Funcionalidades Avançadas**: Upload, monitoramento e resultados
4. **Código Limpo**: Arquitetura moderna e bem estruturada
5. **Experiência do Usuário**: Feedback visual e estados claros

O sistema está pronto para uso e pode ser facilmente estendido com novas funcionalidades conforme necessário.