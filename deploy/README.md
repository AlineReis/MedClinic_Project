# Guia de Deploy - MedClinic

Este guia ajuda a configurar o servidor Nginx para servir a aplicação MedClinic (Frontend + Backend).

## 1. Build da Aplicação

Antes de tudo, certifique-se de gerar a versão de produção do frontend:

```bash
# Na pasta do projeto frontend (MedClinic_Project)
npm run build
```

Isso criará a pasta `dist` com todos os arquivos otimizados.

## 2. Configuração do Backend

Certifique-se de que o backend está rodando no servidor, geralmente na porta 3000.
Recomenda-se usar PM2 para manter o backend online:

```bash
# Na pasta do backend
npm run build
pm2 start dist/server.js --name "medclinic-api"
```

## 3. Configuração do Nginx

1.  **Copie os arquivos do frontend:**
    Mova o conteúdo da pasta `dist` (gerada no passo 1) para o diretório web do servidor, por exemplo `/var/www/medclinic/html`.

2.  **Configure o Nginx:**
    Copie o arquivo `nginx.conf` desta pasta para `/etc/nginx/sites-available/medclinic`.

3.  **Ajuste o arquivo:**
    Edite o arquivo e verifique se o caminho `root` aponta corretamente para onde você copiou os arquivos (ex: `/var/www/medclinic/html`).

4.  **Ative o site:**
    ```bash
    sudo ln -s /etc/nginx/sites-available/medclinic /etc/nginx/sites-enabled/
    sudo nginx -t  # Testa a configuração
    sudo systemctl restart nginx
    ```

## Problemas Comuns Resolvidos

### Erro "Refused to execute script ... because its MIME type ('text/html') is not executable"

Isso acontece quando o Nginx não encontra o arquivo `.js` e retorna a página 404 (que é HTML) ou redireciona para o `index.html`.
**Solução:** O bloco `location ~* \.(js|css...)` no nosso `nginx.conf` garante que arquivos estáticos sejam servidos corretamente ou retornem 404 real se não existirem, evitando a confusão de tipos MIME.

### Erro 404 na API

Se as requisições para o backend falham, verifique o bloco `location /api/`. Ele deve fazer o `proxy_pass` para onde seu backend Node.js está rodando (ex: `http://localhost:3000/api/`).

### Cors Errors ou "Blocked by Client"

Se seu frontend está em `https` e o backend em `http`, ou domínios diferentes, podem ocorrer erros. O uso do Nginx como **Proxy Reverso** (configurado aqui) resolve isso, pois tudo é servido da mesma origem (porta 80/443).
