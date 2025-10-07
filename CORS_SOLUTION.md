# 🔧 Solução para Problema de CORS no Cloudflare R2

## ❌ **Problema Identificado**

```
Access to fetch at 'https://eda-i2a2.0e5e9e2ce4e3cbf645ce67e3709caa65.r2.cloudflarestorage.com/...' 
from origin 'http://localhost:3000' has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## 🎯 **Onde Resolver**

O problema de CORS deve ser resolvido em **duas camadas**:

### 1. **📍 Cloudflare Dashboard (Recomendado)**
### 2. **⚙️ Configuração de URLs Pré-assinadas (Backup)**

---

## 🚀 **Solução 1: Cloudflare Dashboard (PRINCIPAL)**

### **Passo a Passo:**

1. **Acesse o Cloudflare Dashboard**
   ```
   https://dash.cloudflare.com/
   ```

2. **Navegue até R2 Object Storage**
   - Clique em "R2 Object Storage" no menu lateral
   - Selecione seu bucket: `eda-i2a2`

3. **Configure CORS**
   - Clique na aba "Settings" do bucket
   - Encontre a seção "CORS policy"
   - Clique em "Add CORS policy" ou "Edit"

4. **Adicione a seguinte configuração CORS:**

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://127.0.0.1:3000",
      "https://*.vercel.app",
      "https://*.netlify.app",
      "https://*.pages.dev"
    ],
    "AllowedMethods": [
      "GET",
      "PUT", 
      "POST",
      "DELETE",
      "HEAD"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "ExposeHeaders": [
      "ETag",
      "Content-Length",
      "Content-Type",
      "Last-Modified"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

5. **Salve a configuração**

---

## 🔧 **Solução 2: URLs Pré-assinadas com CORS (BACKUP)**

Se não conseguir configurar pelo dashboard, modifique a geração de URLs pré-assinadas para incluir headers CORS:

### **Arquivo:** `eda-backend/app/core/r2_service.py`

```python
def generate_presigned_upload_url(
    self, 
    filename: str, 
    content_type: str = "application/octet-stream",
    folder: str = "uploads"
) -> Dict[str, Any]:
    # ... código existente ...
    
    # ADICIONAR headers CORS na presigned URL
    fields = {
        'Content-Type': content_type,
        'Cache-Control': 'max-age=0',
        # Headers CORS
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, PUT, POST, DELETE, HEAD',
        'Access-Control-Allow-Headers': '*'
    }
    
    conditions = [
        ['starts-with', '$Content-Type', ''],
        ['content-length-range', 1, settings.max_file_size_mb * 1024 * 1024]
    ]
    
    # Gerar presigned POST com headers CORS
    presigned_post = self.client.generate_presigned_post(
        Bucket=settings.cloudflare_r2_bucket_name,
        Key=file_key,
        Fields=fields,
        Conditions=conditions,
        ExpiresIn=settings.presigned_url_expiration_seconds
    )
```

---

## 🧪 **Solução 3: Desenvolvimento Local (TEMPORÁRIA)**

Para testes locais imediatos, adicione extensão CORS no navegador:

### **Chrome/Edge:**
1. Instale a extensão "CORS Unblock"
2. Ative para localhost:3000
3. **⚠️ APENAS para desenvolvimento!**

### **Firefox:**
1. Abra `about:config`
2. Procure por `security.fileuri.strict_origin_policy`
3. Defina como `false`
4. **⚠️ APENAS para desenvolvimento!**

---

## ✅ **Verificação da Solução**

### **1. Teste após configurar CORS:**
```bash
# No frontend, tente fazer upload novamente
# O erro de CORS deve desaparecer
```

### **2. Verificar headers CORS (DevTools):**
```
Network Tab → Selecione requisição PUT para R2
Response Headers deve conter:
- Access-Control-Allow-Origin: *
- Access-Control-Allow-Methods: GET, PUT, POST, DELETE, HEAD
- Access-Control-Allow-Headers: *
```

### **3. Teste automatizado:**
```javascript
// Console do navegador
fetch('https://eda-i2a2.0e5e9e2ce4e3cbf645ce67e3709caa65.r2.cloudflarestorage.com', {
  method: 'OPTIONS'
}).then(r => console.log('CORS OK', r.headers))
```

---

## 🔄 **Status da Implementação**

- ✅ Script de configuração automática criado
- ❌ Credenciais R2 sem permissão para modificar CORS
- 🔄 **PRÓXIMO:** Configurar manualmente via Dashboard
- 🔄 **BACKUP:** Implementar headers CORS nas URLs

---

## 📞 **Suporte**

Se o problema persistir após configurar CORS no dashboard:

1. **Verifique se a configuração foi salva**
2. **Aguarde 5-10 minutos para propagação**
3. **Teste em aba anônima do navegador**
4. **Verifique se está usando a URL correta do bucket**

---

## 🎯 **Resumo da Ação**

**AGORA:** Acesse o Cloudflare Dashboard e configure CORS no bucket `eda-i2a2` com a configuração JSON fornecida acima.

**DEPOIS:** Teste o upload novamente - o erro de CORS deve desaparecer.