#!/bin/bash

# 🔄 Script de Atualização Automática do Servidor MedClinic
# Este script atualiza o código mantendo as configurações

set -e  # Para em caso de erro

echo "🚀 Iniciando atualização do servidor MedClinic..."
echo ""

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Função para log
log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 1. BACKUP
echo "📦 Passo 1/8: Criando backup das configurações..."
BACKUP_DIR=~/config-backups/$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup backend
if [ -f ~/backend/.env ]; then
    cp ~/backend/.env $BACKUP_DIR/backend.env
    log_success "Backup do backend/.env criado"
else
    log_warning "backend/.env não encontrado"
fi

# Backup frontend
if [ -f ~/frontend/webpack.config.js ]; then
    cp ~/frontend/webpack.config.js $BACKUP_DIR/webpack.config.js
    log_success "Backup do webpack.config.js criado"
else
    log_warning "webpack.config.js não encontrado"
fi

if [ -f ~/frontend/src/config/basePath.ts ]; then
    cp ~/frontend/src/config/basePath.ts $BACKUP_DIR/basePath.ts
    log_success "Backup do basePath.ts criado"
fi

if [ -f ~/frontend/src/config/roleRoutes.ts ]; then
    cp ~/frontend/src/config/roleRoutes.ts $BACKUP_DIR/roleRoutes.ts
    log_success "Backup do roleRoutes.ts criado"
fi

log_success "Backup completo em: $BACKUP_DIR"
echo ""

# 2. ATUALIZAR BACKEND
echo "📥 Passo 2/8: Atualizando código do backend..."
cd ~/backend

# Salvar mudanças locais
git stash save "Auto-stash before update $(date)" 2>/dev/null || true

# Atualizar
if git pull origin main; then
    log_success "Backend atualizado do GitHub"
else
    log_error "Erro ao atualizar backend"
    exit 1
fi

# Restaurar mudanças locais (pode ter conflitos)
git stash pop 2>/dev/null || log_warning "Sem mudanças locais para restaurar"
echo ""

# 3. ATUALIZAR FRONTEND
echo "📥 Passo 3/8: Atualizando código do frontend..."
cd ~/frontend

# Salvar mudanças locais
git stash save "Auto-stash before update $(date)" 2>/dev/null || true

# Atualizar
if git pull origin final-semantic-audit-complete; then
    log_success "Frontend atualizado do GitHub"
else
    log_error "Erro ao atualizar frontend"
    exit 1
fi

# Restaurar mudanças locais
git stash pop 2>/dev/null || log_warning "Sem mudanças locais para restaurar"
echo ""

# 4. RESTAURAR CONFIGURAÇÕES CRÍTICAS
echo "🔧 Passo 4/8: Restaurando configurações críticas..."

# Restaurar .env do backend
if [ -f $BACKUP_DIR/backend.env ]; then
    cp $BACKUP_DIR/backend.env ~/backend/.env
    log_success "Configurações do backend restauradas"
fi

# Restaurar webpack.config.js
if [ -f $BACKUP_DIR/webpack.config.js ]; then
    cp $BACKUP_DIR/webpack.config.js ~/frontend/webpack.config.js
    log_success "webpack.config.js restaurado"
fi

# Restaurar basePath.ts
if [ -f $BACKUP_DIR/basePath.ts ]; then
    cp $BACKUP_DIR/basePath.ts ~/frontend/src/config/basePath.ts
    log_success "basePath.ts restaurado"
fi

# Restaurar roleRoutes.ts
if [ -f $BACKUP_DIR/roleRoutes.ts ]; then
    cp $BACKUP_DIR/roleRoutes.ts ~/frontend/src/config/roleRoutes.ts
    log_success "roleRoutes.ts restaurado"
fi

echo ""

# 5. REINSTALAR DEPENDÊNCIAS
echo "📦 Passo 5/8: Reinstalando dependências..."

cd ~/backend
if npm install; then
    log_success "Dependências do backend instaladas"
else
    log_error "Erro ao instalar dependências do backend"
    exit 1
fi

cd ~/frontend
if npm install; then
    log_success "Dependências do frontend instaladas"
else
    log_error "Erro ao instalar dependências do frontend"
    exit 1
fi

echo ""

# 6. REBUILD
echo "🔨 Passo 6/8: Fazendo rebuild..."

cd ~/backend
if npm run build; then
    log_success "Backend compilado com sucesso"
else
    log_error "Erro ao compilar backend"
    exit 1
fi

cd ~/frontend
if CLINIC_BASE_PATH=/server03/ CLINIC_API_HOST=/server03/api/v1/1 npm run build; then
    log_success "Frontend compilado com sucesso"
else
    log_error "Erro ao compilar frontend"
    exit 1
fi

echo ""

# 7. REINICIAR SERVIÇOS
echo "🔄 Passo 7/8: Reiniciando serviços..."

if pm2 restart medclinic-api; then
    log_success "Serviço reiniciado"
else
    log_error "Erro ao reiniciar serviço"
    exit 1
fi

pm2 save
log_success "Configuração PM2 salva"
echo ""

# 8. VERIFICAÇÃO
echo "🔍 Passo 8/8: Verificando status..."
sleep 2

pm2 status medclinic-api

echo ""
echo "📋 Últimas linhas do log:"
pm2 logs medclinic-api --lines 10 --nostream

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log_success "Atualização concluída!"
echo ""
echo "📍 Backup salvo em: $BACKUP_DIR"
echo ""
echo "🌐 Teste os seguintes endereços:"
echo "   • http://10.10.0.203"
echo "   • https://lab.alphaedtech.org.br/server03/"
echo ""
echo "🔐 Credenciais de teste:"
echo "   Email: admin@clinica.com"
echo "   Senha: password"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
