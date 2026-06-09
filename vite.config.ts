import path from 'path';
import fs from 'node:fs';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { isValidToolRecord } from './lib/governanceToolsValidate';

function governanceToolsDevWriteApi(): import('vite').Plugin {
  return {
    name: 'governance-tools-dev-write-api',
    configureServer(server) {
      const file = path.resolve(__dirname, 'public/governance-tools.json');
      server.middlewares.use((req, res, next) => {
        const pathname = (req.url || '').split('?')[0];
        if (pathname !== '/__api/governance-tools') {
          next();
          return;
        }
        if (req.method !== 'PUT') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
          res.end('Method Not Allowed');
          return;
        }
        const chunks: Buffer[] = [];
        req.on('data', (c: Buffer) => chunks.push(c));
        req.on('end', () => {
          try {
            const raw = Buffer.concat(chunks).toString('utf8');
            const data = JSON.parse(raw) as unknown;
            if (!Array.isArray(data)) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'text/plain; charset=utf-8');
              res.end('Body must be a JSON array');
              return;
            }
            for (const row of data) {
              if (!isValidToolRecord(row)) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'text/plain; charset=utf-8');
                res.end('Invalid tool record');
                return;
              }
            }
            fs.mkdirSync(path.dirname(file), { recursive: true });
            fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, 'utf-8');
            res.statusCode = 204;
            res.end();
          } catch {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.end('Invalid JSON');
          }
        });
      });
    },
  };
}

function requirementsSpecDevApi(): import('vite').Plugin {
  return {
    name: 'requirements-spec-dev-api',
    configureServer(server) {
      const file = path.resolve(__dirname, 'public/requirements-spec-notes.json');
      server.middlewares.use((req, res, next) => {
        const pathname = (req.url || '').split('?')[0];
        if (pathname !== '/__api/requirements-spec-notes') {
          next();
          return;
        }
        if (req.method !== 'PUT') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
          res.end('Method Not Allowed');
          return;
        }
        const chunks: Buffer[] = [];
        req.on('data', (c: Buffer) => chunks.push(c));
        req.on('end', () => {
          try {
            const raw = Buffer.concat(chunks).toString('utf8');
            const data = JSON.parse(raw) as unknown;
            if (!Array.isArray(data)) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'text/plain; charset=utf-8');
              res.end('Body must be a JSON array');
              return;
            }
            fs.mkdirSync(path.dirname(file), { recursive: true });
            fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, 'utf-8');
            res.statusCode = 204;
            res.end();
          } catch {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.end('Invalid JSON');
          }
        });
      });
    },
  };
}

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        tailwindcss(),
        governanceToolsDevWriteApi(),
        requirementsSpecDevApi(),
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
