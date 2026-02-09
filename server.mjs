#!/usr/bin/env node
import { createServer } from 'http';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const port = process.env.PORT || 8080;
const distDir = resolve(import.meta.url, '../dist');

const server = createServer((req, res) => {
  // Definir headers CORS e segurança
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Servir arquivos estáticos
  if (req.url.includes('.') || req.url.startsWith('/api')) {
    // Arquivo com extensão ou API - deixar como está
    try {
      const filePath = resolve(distDir, req.url.replace(/^\//, ''));
      const content = readFileSync(filePath);
      res.writeHead(200);
      res.end(content);
    } catch {
      res.writeHead(404);
      res.end('Not found');
    }
  } else {
    // Rota SPA - servir index.html
    try {
      const content = readFileSync(resolve(distDir, 'index.html'));
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(content);
    } catch {
      res.writeHead(500);
      res.end('Internal server error');
    }
  }
});

server.listen(port, '::', () => {
  console.log(`🚀 Servidor rodando em http://localhost:${port}`);
});
