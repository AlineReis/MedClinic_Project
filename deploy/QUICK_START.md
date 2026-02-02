# 🚀 GUIA RÁPIDO DE DEPLOY - MEDCLINIC

## 📋 ANTES DE COMEÇAR

Você tem 2 opções para fazer o deploy:

### Opção A: Deploy Automático (Recomendado) ⚡
Use o script que faz tudo automaticamente.

### Opção B: Deploy Manual 📝
Siga o passo a passo detalhado.

---

## ⚡ OPÇÃO A: DEPLOY AUTOMÁTICO

### 1. Conecte ao servidor
```bash
ssh seu_usuario@10.10.0.203
```

### 2. Baixe o script de deploy
```bash
# Crie uma pasta temporária
mkdir -p ~/temp-deploy
cd ~/temp-deploy

# Baixe o script
curl -O https://raw.githubusercontent.com/AlineReis/MedClinic_Project/main/deploy/auto-deploy.sh

# Dê permissão de execução
chmod +x auto-deploy.sh
```

### 3. Configure o .env
```bash
# Baixe o template
curl -O https://raw.githubusercontent.com/AlineReis/MedClinic_Project/main/deploy/.env.production

# Edite e configure suas variáveis
nano .env.production

# IMPORTANTE: Troque o JWT_SECRET por uma senha forte!
# Gere uma senha: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Depois de configurar, copie para a pasta do backend (será criada pelo script)
# Você fará isso DURANTE a execução do script quando ele pedir
```

### 4. Execute o script
```bash
bash auto-deploy.sh
```

O script vai:
- ✅ Criar a estrutura de pastas
- ✅ Clonar o código (backend e frontend)
- ✅ Instalar dependências
- ✅ Compilar tudo
- ✅ Configurar o Nginx
- ✅ Iniciar o PM2
- ✅ Ajustar permissões

### 5. Quando o script pedir o .env
Durante a execução, o script vai pausar e pedir para você configurar o `.env`.

```bash
# Copie o arquivo que você editou:
cp ~/temp-deploy/.env.production ~/apps/medclinic/backend/.env

# Pressione ENTER para continuar
```

### 6. Validação
Após o script terminar, abra o arquivo de validação:
```bash
cat ~/apps/medclinic/backend/deploy/VALIDATION_CHECKLIST.md
```

Siga os testes para garantir que tudo está funcionando.

---

## 📝 OPÇÃO B: DEPLOY MANUAL

Se preferir fazer passo a passo, siga o guia completo:
```bash
cat ~/apps/medclinic/backend/DEPLOY_GUIDE_UBUNTU.md
```

Ou acesse localmente: `DEPLOY_GUIDE_UBUNTU.md`

---

## 🆘 PROBLEMAS COMUNS

### "Sua sessão expirou" após login
```bash
# Edite o .env do backend
nano ~/apps/medclinic/backend/.env

# Certifique-se que está:
NODE_ENV=development

# Reinicie
pm2 restart medclinic-api
```

### CSS não carrega
```bash
# Verifique se o build foi feito corretamente
ls -la ~/apps/medclinic/frontend/dist/

# Deve ter pastas: js/, css/, pages/, assets/
# Se estiver vazio, rode o build novamente:
cd ~/apps/medclinic/frontend
npm run build
```

### API retorna 404
```bash
# Verifique se o backend está rodando
pm2 status

# Veja os logs
pm2 logs medclinic-api

# Teste direto
curl http://localhost:3000/api/v1/1/health
```

---

## 📞 COMANDOS ÚTEIS

```bash
# Ver status de tudo
pm2 status
sudo systemctl status nginx

# Reiniciar serviços
pm2 restart medclinic-api
sudo systemctl restart nginx

# Ver logs
pm2 logs medclinic-api --lines 100
sudo tail -f /var/log/nginx/error.log

# Atualizar código (depois de fazer git push)
cd ~/apps/medclinic/backend && git pull && npm run build && pm2 restart medclinic-api
cd ~/apps/medclinic/frontend && git pull && npm run build
```

---

## ✅ TUDO PRONTO?

Acesse:
- **Via IP:** http://10.10.0.203
- **Via Domínio:** https://lab.alphaedtech.org.br/server03

Login padrão:
- **Email:** admin@email.com
- **Senha:** senha123

**Boa apresentação! 🎉**
