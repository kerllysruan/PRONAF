#!/usr/bin/env node

/**
 * Servidor simples para servir aplicação Vite em produção
 * Trata todas as rotas como SPA com fallback para index.html
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 8080;
const DIST_DIR = path.join(__dirname, 'dist');

// Tipos MIME comuns
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.json': 'application/json',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
};

function getContentType(pathname) {
  const ext = path.extname(pathname).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  let pathname = decodeURIComponent(parsedUrl.pathname);
  
  // Remove barras iniciais/finais extras
  if (pathname.endsWith('/') && pathname !== '/') {
    pathname = pathname.slice(0, -1);
  }

  const filePath = path.join(DIST_DIR, pathname);
  const filePathNorm = path.normalize(filePath);

  // Validação de segurança: evitar path traversal
  if (!filePathNorm.startsWith(DIST_DIR)) {
    res.writeHead(403, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Forbidden' }));
    return;
  }

  // Trata solicitações para arquivos específicos
  if (pathname !== '/' && pathname.includes('.')) {
    fs.stat(filePathNorm, (err, stat) => {
      if (err || !stat.isFile()) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not Found' }));
        return;
      }

      const contentType = getContentType(filePathNorm);
      res.writeHead(200, { 'Content-Type': contentType });
      fs.createReadStream(filePathNorm).pipe(res);
    });
    return;
  }

  // Tudo o resto (rotas SPA) retorna index.html
  const indexPath = path.join(DIST_DIR, 'index.html');
  fs.stat(indexPath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'index.html not found' }));
      return;
    }

    res.writeHead(200, { 'Content-Type': 'text/html' });
    fs.createReadStream(indexPath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`\n✅ Servidor rodando em http://localhost:${PORT}/\n`);
  console.log('Estaticamente servindo arquivos de:', DIST_DIR);
  console.log('Todas as rotas SPA retornam para index.html\n');
});

server.on('error', (err) => {
  console.error('❌ Erro ao iniciar servidor:', err.message);
  process.exit(1);
});
