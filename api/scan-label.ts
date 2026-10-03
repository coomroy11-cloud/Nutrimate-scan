import app from '../server.ts';

export default function handler(req: any, res: any) {
  // Normalize request url so Express matches whether path is / or /api/scan-label
  if (!req.url || req.url === '/' || req.url === '') {
    req.url = '/api/scan-label';
  } else if (!req.url.startsWith('/api')) {
    req.url = `/api${req.url.startsWith('/') ? '' : '/'}${req.url}`;
  }
  return app(req, res);
}
