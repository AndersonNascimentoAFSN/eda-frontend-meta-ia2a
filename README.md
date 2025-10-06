# EDA Frontend

🤖 **Assistente de IA para Análise Exploratória de Dados**

Frontend Next.js com chat conversacional usando Vercel AI SDK para análise exploratória de dados com integração completa ao backend EDA.

## ✨ Funcionalidades

- 💬 **Chat Conversacional**: Interface de IA para interação natural
- 📁 **Upload de CSV**: Drag & drop ou seleção de arquivos
- ☁️ **Storage em Nuvem**: Upload direto para Cloudflare R2
- 📊 **Análise Automática**: Processamento completo no backend
- 📈 **Insights Inteligentes**: Explicações e recomendações da IA
- ⏱️ **Tempo Real**: Monitoramento de progresso ao vivo

## 🚀 Início Rápido

### 1. Configuração

```bash
# Clone e instale dependências
cd eda-frontend
npm install

# Configure variáveis de ambiente
cp .env.local.example .env.local
```

### 2. Variáveis de Ambiente

Edite `.env.local`:

```bash
OPENAI_API_KEY=your_openai_api_key_here
EDA_BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_EDA_BACKEND_URL=http://localhost:8000
```

### 3. Execução

```bash
# Desenvolvimento
npm run dev

# Produção
npm run build && npm start
```

Acesse: http://localhost:3000

## 🛠️ Stack Tecnológica

- **Framework**: Next.js 15 + TypeScript
- **UI**: Tailwind CSS + Radix UI
- **IA**: Vercel AI SDK + OpenAI
- **Validação**: Zod
- **Ícones**: Lucide React

## 📱 Como Usar

1. **Abra a aplicação** em http://localhost:3000
2. **Faça upload** de um arquivo CSV
3. **Aguarde** o processamento automático
4. **Converse** com a IA sobre seus dados
5. **Obtenha insights** e recomendações

## 🔧 Desenvolvimento

```bash
# Comandos disponíveis
npm run dev      # Servidor de desenvolvimento
npm run build    # Build de produção
npm run start    # Servidor de produção
npm run lint     # Verificação de código
```

## 📊 Integração com Backend

Conecta-se ao backend EDA para:
- Obter URLs pré-assinadas para upload
- Iniciar análises de dados
- Monitorar progresso
- Recuperar resultados

## 📝 Documentação

Veja [DOCUMENTATION.md](./DOCUMENTATION.md) para documentação completa.

## 🎯 Status

✅ **Compilação**: Sem erros  
✅ **Tipos**: Totalmente tipado  
✅ **Interface**: Responsiva e moderna  
✅ **Integração**: Backend conectado  
✅ **IA**: Tools funcionais  

---

**Desenvolvido com ❤️ usando Next.js e Vercel AI SDK**
