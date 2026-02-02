# ✅ CHECKLIST DE VALIDAÇÃO PÓS-DEPLOY

Execute estes testes após o deploy para garantir que tudo está funcionando.

## 🌐 1. Acesso ao Site

### Teste 1.1: Acesso via IP (Raiz)
- [ ] Abrir: `http://10.10.0.203`
- [ ] Página de login carrega corretamente
- [ ] CSS está aplicado (não aparece texto sem estilo)
- [ ] Imagens/ícones aparecem

### Teste 1.2: Acesso via Domínio (Subpasta)
- [ ] Abrir: `https://lab.alphaedtech.org.br/server03`
- [ ] Página de login carrega corretamente
- [ ] CSS está aplicado
- [ ] Imagens/ícones aparecem

## 🔐 2. Autenticação

### Teste 2.1: Login
- [ ] Email: `admin@email.com`
- [ ] Senha: `senha123`
- [ ] Login bem-sucedido
- [ ] Redirecionado para dashboard
- [ ] Nome do usuário aparece no header

### Teste 2.2: Sessão Persistente
- [ ] Após login, recarregar a página (F5)
- [ ] Continua logado (não volta para tela de login)
- [ ] Se voltar para login, há problema com cookies (veja seção de troubleshooting)

## 📊 3. Funcionalidades Principais

### Teste 3.1: Navegação
- [ ] Clicar em diferentes menus
- [ ] Páginas carregam sem erro 404
- [ ] URL muda corretamente

### Teste 3.2: API
- [ ] Abrir DevTools (F12) → Network
- [ ] Navegar pelo sistema
- [ ] Requisições para `/api/` retornam 200 (não 404 ou 500)
- [ ] Dados aparecem nas tabelas/listas

### Teste 3.3: Upload de Arquivos (Se aplicável)
- [ ] Tentar fazer upload de uma imagem
- [ ] Arquivo é salvo
- [ ] Imagem aparece corretamente

## 🐛 4. Troubleshooting

### Problema: "Sua sessão expirou" após login
**Causa:** Cookie não está sendo salvo (problema de HTTPS/HTTP)

**Solução:**
```bash
# No servidor, edite o .env:
nano ~/apps/medclinic/backend/.env

# Certifique-se que está assim:
NODE_ENV=development

# Salve (Ctrl+O, Enter, Ctrl+X) e reinicie:
pm2 restart medclinic-api
```

### Problema: CSS não carrega (página sem estilo)
**Causa:** Caminhos dos arquivos estáticos incorretos

**Verificar:**
1. Abrir DevTools (F12) → Console
2. Ver se há erros 404 para arquivos .css ou .js
3. Se sim, verificar configuração do Nginx

### Problema: API retorna 404
**Causa:** Proxy reverso do Nginx não está funcionando

**Verificar:**
```bash
# Ver logs do Nginx
sudo tail -f /var/log/nginx/error.log

# Ver logs do backend
pm2 logs medclinic-api

# Testar se o backend está rodando
curl http://localhost:3000/api/v1/1/health
```

### Problema: Permissões negadas
**Causa:** Usuário do PM2/Nginx não tem acesso às pastas

**Solução:**
```bash
sudo chown -R $USER:$USER ~/apps/medclinic
chmod -R 755 ~/apps/medclinic/backend/uploads
chmod -R 755 ~/apps/medclinic/backend/database
pm2 restart medclinic-api
```

## 📝 5. Comandos Úteis

```bash
# Ver status do PM2
pm2 status

# Ver logs em tempo real
pm2 logs medclinic-api --lines 50

# Reiniciar backend
pm2 restart medclinic-api

# Testar configuração do Nginx
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx

# Ver processos rodando na porta 3000
sudo lsof -i :3000
```

## ✅ Checklist Final

- [ ] Site acessível via IP
- [ ] Site acessível via domínio/subpasta
- [ ] Login funciona
- [ ] Sessão persiste após reload
- [ ] API responde corretamente
- [ ] CSS e imagens carregam
- [ ] Navegação funciona
- [ ] Sem erros no console do navegador
- [ ] PM2 mostra backend online
- [ ] Nginx está rodando sem erros

**Se todos os itens estão marcados: 🎉 DEPLOY BEM-SUCEDIDO!**
