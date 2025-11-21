# 📱 Guia de Configuração da Evolution API

## Visão Geral

A Evolution API já está configurada no seu `docker-compose.yml` e o backend está pronto para se comunicar com ela. Este guia explica como iniciar e configurar a integração completa com o WhatsApp.

## 🚀 Passo 1: Iniciar os Serviços Docker

### 1.1. Certifique-se de que o Docker está instalado

```bash
docker --version
docker-compose --version
```

### 1.2. Inicie os serviços

No diretório raiz do projeto (onde está o `docker-compose.yml`):

```bash
docker-compose up -d
```

Isso iniciará:
- **Evolution API** na porta 8082
- **PostgreSQL** para a Evolution API
- **Turso** (banco de dados principal)

### 1.3. Verifique se os serviços estão rodando

```bash
docker-compose ps
```

Você deve ver:
- `evolution-api` - Up
- `evolution-postgres` - Up
- `turso` - Up

## 🔧 Passo 2: Acessar a Evolution API

### 2.1. Abra o navegador

Acesse: http://localhost:8082

### 2.2. Faça login

- **API Key**: `minha-api-key-123` (configurada no docker-compose.yml)

## 📲 Passo 3: Criar uma Instância do WhatsApp

### 3.1. Via Interface Web

1. Acesse http://localhost:8082
2. Clique em "Create Instance"
3. Configure:
   - **Instance Name**: `hzsolucoes` (mesmo nome configurado no .env)
   - **Webhook URL**: `http://host.docker.internal:3000/whatsapp/webhook`
   - **Events**: Marque `messages.upsert`

### 3.2. Via API (Alternativa)

```bash
curl -X POST http://localhost:8082/instance/create \
  -H "apikey: minha-api-key-123" \
  -H "Content-Type: application/json" \
  -d '{
    "instanceName": "hzsolucoes",
    "webhook": {
      "url": "http://host.docker.internal:3000/whatsapp/webhook",
      "events": ["messages.upsert"]
    }
  }'
```

## 📱 Passo 4: Conectar o WhatsApp

### 4.1. Gerar QR Code

```bash
curl -X GET http://localhost:8082/instance/connect/hzsolucoes \
  -H "apikey: minha-api-key-123"
```

Ou acesse via navegador:
http://localhost:8082/instance/qrcode/hzsolucoes

### 4.2. Escanear o QR Code

1. Abra o WhatsApp no seu celular
2. Vá em **Configurações** > **Aparelhos conectados**
3. Clique em **Conectar um aparelho**
4. Escaneie o QR Code exibido

### 4.3. Verificar conexão

```bash
curl -X GET http://localhost:8082/instance/connectionState/hzsolucoes \
  -H "apikey: minha-api-key-123"
```

Resposta esperada:
```json
{
  "state": "open"
}
```

## 🧪 Passo 5: Testar a Integração

### 5.1. Testar via Backend

Acesse no navegador ou via curl:

```bash
curl http://localhost:3000/whatsapp/test
```

Resposta esperada:
```json
{
  "configured": true,
  "connected": true,
  "message": "✅ Evolution API configurada e conectada"
}
```

### 5.2. Testar Comandos via WhatsApp

Envie mensagens para o número conectado:

| Comando | Exemplo | Resultado |
|---------|---------|-----------|
| `despesa 50 compras` | Adiciona despesa de R$ 50,00 | Confirmação com categoria |
| `receita 1000 salário` | Adiciona receita de R$ 1000,00 | Confirmação |
| `saldo` | Consulta saldo do mês | Resumo financeiro |
| `lista` | Ver lista de compras | Itens pendentes |
| `comprar arroz 5kg` | Adiciona item à lista | Confirmação |
| `agua 250` | Registra 250ml de água | Progresso da meta |
| `ajuda` | Lista todos os comandos | Menu de ajuda |

## 🔍 Troubleshooting

### Problema: Evolution API não inicia

**Solução:**
```bash
docker-compose logs evolution-api
```

Verifique se a porta 8082 não está em uso:
```bash
lsof -i :8082
```

### Problema: Webhook não recebe mensagens

**Verificações:**

1. **Webhook configurado?**
```bash
curl -X GET http://localhost:8082/instance/webhook/hzsolucoes \
  -H "apikey: minha-api-key-123"
```

2. **Backend está rodando?**
```bash
curl http://localhost:3000/health
```

3. **Logs do backend:**
```bash
tail -f /tmp/server.log
```

### Problema: "Connection closed"

**Solução:** O WhatsApp desconectou. Gere um novo QR Code:

```bash
curl -X GET http://localhost:8082/instance/connect/hzsolucoes \
  -H "apikey: minha-api-key-123"
```

## 📊 Monitoramento

### Ver logs da Evolution API

```bash
docker-compose logs -f evolution-api
```

### Ver logs do backend

```bash
tail -f /tmp/server.log
```

### Verificar instâncias ativas

```bash
curl -X GET http://localhost:8082/instance/fetchInstances \
  -H "apikey: minha-api-key-123"
```

## 🔐 Segurança em Produção

### ⚠️ IMPORTANTE: Antes de fazer deploy

1. **Mude a API Key** no `docker-compose.yml` e no `.env`:
   ```env
   EVOLUTION_API_KEY=sua-chave-super-secreta-aqui
   ```

2. **Configure HTTPS** para o webhook:
   ```env
   # No .env do backend
   EVOLUTION_API_URL=https://seu-dominio.com
   ```

3. **Use variáveis de ambiente** no docker-compose:
   ```yaml
   environment:
     - AUTHENTICATION_API_KEY=${EVOLUTION_API_KEY}
   ```

## 📚 Documentação Oficial

- [Evolution API Docs](https://doc.evolution-api.com/)
- [Evolution API GitHub](https://github.com/EvolutionAPI/evolution-api)

## ✅ Checklist de Configuração

- [ ] Docker e Docker Compose instalados
- [ ] Serviços iniciados com `docker-compose up -d`
- [ ] Evolution API acessível em http://localhost:8082
- [ ] Instância `hzsolucoes` criada
- [ ] Webhook configurado para `http://host.docker.internal:3000/whatsapp/webhook`
- [ ] QR Code escaneado e WhatsApp conectado
- [ ] Teste `/whatsapp/test` retorna `connected: true`
- [ ] Comandos via WhatsApp funcionando

## 🎉 Próximos Passos

Após configurar a Evolution API:

1. Teste todos os comandos via WhatsApp
2. Monitore os logs para ver as mensagens sendo processadas
3. Personalize as mensagens de resposta em `src/services/whatsapp.ts`
4. Adicione novos comandos em `src/routes/whatsapp.ts`
5. Configure notificações automáticas (lembretes, alertas de meta, etc.)

---

**Dúvidas?** Verifique os logs ou consulte a documentação oficial da Evolution API.
