#!/bin/bash
# ==========================================
# SCRIPT DE DEPLOY AUTOMÁTICO - MEDCLINIC
# ==========================================
# Execute este script no servidor Ubuntu
# Uso: bash auto-deploy.sh

set -e  # Para na primeira falha

echo "🚀 Iniciando deploy do MedClinic..."

# ==========================================
# 1. PREPARAÇÃO
# ==========================================
echo ""
echo "📂 1. Criando estrutura de pastas..."
mkdir -p ~/apps/medclinic
cd ~/apps/medclinic

# ==========================================
# 2. BACKEND
# ==========================================
echo ""
echo "🛠️  2. Configurando Backend..."

if [ -d "backend" ]; then
    echo "   ↻ Atualizando código existente..."
    cd backend
    git pull origin main
else
    echo "   ⬇ Clonando repositório..."
    git clone https://github.com/AlineReis/MedClinic_Project.git backend
    cd backend
    git checkout main
fi

echo "   📦 Instalando dependências..."
npm install

echo "   🔨 Compilando TypeScript..."
npm run build

# Verificar se .env existe
if [ ! -f ".env" ]; then
    echo ""
    echo "⚠️  ATENÇÃO: Arquivo .env não encontrado!"
    echo "   Por favor, crie o arquivo .env antes de continuar."
    echo "   Use o template em deploy/.env.production como base."
    echo ""
    read -p "Pressione ENTER quando o .env estiver configurado..."
fi

echo "   🌱 Populando banco de dados..."
npm run db:seed

echo "   🚀 Iniciando backend com PM2..."
pm2 delete medclinic-api 2>/dev/null || true
pm2 start dist/server.js --name "medclinic-api"
pm2 save

cd ~/apps/medclinic

# ==========================================
# 3. FRONTEND
# ==========================================
echo ""
echo "🎨 3. Configurando Frontend..."

if [ -d "frontend" ]; then
    echo "   ↻ Atualizando código existente..."
    cd frontend
    git pull origin fix/frontend-server03-support
else
    echo "   ⬇ Clonando repositório..."
    git clone https://github.com/AlineReis/MedClinic_Project.git frontend
    cd frontend
    git checkout fix/frontend-server03-support
fi

echo "   📦 Instalando dependências..."
npm install

echo "   🔨 Compilando frontend..."
npm run build

cd ~/apps/medclinic

# ==========================================
# 4. NGINX
# ==========================================
echo ""
echo "🌐 4. Configurando Nginx..."

# Verificar se a configuração já existe
if [ -f "/etc/nginx/sites-available/medclinic" ]; then
    echo "   ⚠️  Configuração do Nginx já existe."
    read -p "   Deseja sobrescrever? (s/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        echo "   ⏭  Pulando configuração do Nginx..."
    else
        sudo cp ~/apps/medclinic/backend/deploy/nginx-medclinic.conf /etc/nginx/sites-available/medclinic
        sudo ln -sf /etc/nginx/sites-available/medclinic /etc/nginx/sites-enabled/
        echo "   ✅ Configuração atualizada!"
    fi
else
    sudo cp ~/apps/medclinic/backend/deploy/nginx-medclinic.conf /etc/nginx/sites-available/medclinic
    sudo ln -s /etc/nginx/sites-available/medclinic /etc/nginx/sites-enabled/
    echo "   ✅ Configuração criada!"
fi

echo "   🔍 Testando configuração do Nginx..."
sudo nginx -t

echo "   🔄 Reiniciando Nginx..."
sudo systemctl restart nginx

# ==========================================
# 5. PERMISSÕES
# ==========================================
echo ""
echo "🔐 5. Ajustando permissões..."
sudo chown -R $USER:$USER ~/apps/medclinic
chmod -R 755 ~/apps/medclinic/backend/uploads
chmod -R 755 ~/apps/medclinic/backend/database

# ==========================================
# FINALIZAÇÃO
# ==========================================
echo ""
echo "✅ Deploy concluído com sucesso!"
echo ""
echo "📋 Próximos passos:"
echo "   1. Acesse: http://10.10.0.203"
echo "   2. Ou: https://lab.alphaedtech.org.br/server03"
echo "   3. Login: admin@email.com / senha123"
echo ""
echo "📊 Comandos úteis:"
echo "   • Ver logs do backend: pm2 logs medclinic-api"
echo "   • Ver logs do Nginx: sudo tail -f /var/log/nginx/error.log"
echo "   • Reiniciar backend: pm2 restart medclinic-api"
echo ""
