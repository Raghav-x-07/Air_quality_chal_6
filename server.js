/**
 * Prana Urban Air Quality Assistant - Production HTTP Server
 * Zero external runtime dependencies, built using native Node.js 18+ modules.
 * Implements strict security headers, sliding-window rate limiting with memory cleanup,
 * payload capping, safe static serving, and REST endpoints.
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { INPUT_LIMITS, SAMPLE_PRESETS, APP_NAME } from './src/constants.js';
import { validateAssessmentInput } from './src/validate.js';
import { generateAssessment } from './src/engine.js';
import { enrichPlanWithAi } from './src/ai.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.resolve(__dirname, 'public');

/**
 * Loads environment variables from a .env file into process.env without third-party dependencies.
 * @param {string} [filePath] - Absolute path to .env file
 * @returns {Record<string, string>} Key-value pairs loaded
 */
export function loadEnv(filePath = path.resolve(__dirname, '.env')) {
  const loaded = {};
  if (!fs.existsSync(filePath)) {
    return loaded;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [k, ...v] = trimmed.split('=');
        const key = k.trim();
        const val = v.join('=').trim();
        if (!process.env[key]) {
          process.env[key] = val;
        }
        loaded[key] = val;
      }
    }
  } catch {
    // Continue gracefully if .env cannot be read
  }

  return loaded;
}

// Auto-load environment variables on initialization
loadEnv();

/**
 * MIME types dictionary for static file serving.
 */
export const MIME_TYPES = Object.freeze({
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
});

/**
 * Sliding-window rate limiter per client IP with automatic TTL cleanup to prevent memory leaks.
 */
export class RateLimiter {
  /**
   * @param {number} [windowMs=60000] - Window duration in milliseconds.
   * @param {number} [maxRequests=60] - Maximum requests allowed per window.
   */
  constructor(windowMs = 60000, maxRequests = 60) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.requests = new Map();
  }

  /**
   * Prunes stale records from memory to prevent unbounded growth.
   */
  cleanup() {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    for (const [ip, timestamps] of this.requests.entries()) {
      const valid = timestamps.filter((t) => t > windowStart);
      if (valid.length === 0) {
        this.requests.delete(ip);
      } else {
        this.requests.set(ip, valid);
      }
    }
  }

  /**
   * Determines if a client IP has exceeded the allowed rate threshold.
   * @param {string} ip
   * @returns {boolean} True if rate limited, false otherwise.
   */
  isRateLimited(ip) {
    this.cleanup();
    const now = Date.now();
    const windowStart = now - this.windowMs;

    const timestamps = this.requests.get(ip) || [];
    const valid = timestamps.filter((t) => t > windowStart);

    if (valid.length >= this.maxRequests) {
      return true;
    }

    valid.push(now);
    this.requests.set(ip, valid);
    return false;
  }
}

/**
 * Applies security and defensive HTTP headers to all outgoing responses.
 * @param {http.ServerResponse} res
 */
export function applySecurityHeaders(res) {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self';"
  );
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'interest-cohort=()');
}

/**
 * Extracts client IP address safely, respecting X-Forwarded-For if behind a proxy.
 * @param {http.IncomingMessage} req
 * @returns {string} Client IP
 */
export function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || '127.0.0.1';
}

/**
 * Reads request body stream enforcing maximum byte size limit.
 * @param {http.IncomingMessage} req
 * @param {number} maxBytes
 * @returns {Promise<{ body: string, limitExceeded: boolean }>}
 */
export function readRequestBody(req, maxBytes = INPUT_LIMITS.MAX_BODY_BYTES) {
  return new Promise((resolve) => {
    let body = '';
    let bytesReceived = 0;
    let limitExceeded = false;

    req.on('data', (chunk) => {
      bytesReceived += chunk.length;
      if (bytesReceived > maxBytes) {
        limitExceeded = true;
        req.destroy();
        return resolve({ body: '', limitExceeded: true });
      }
      body += chunk.toString('utf-8');
    });

    req.on('end', () => {
      if (!limitExceeded) {
        resolve({ body, limitExceeded: false });
      }
    });

    req.on('error', () => {
      resolve({ body: '', limitExceeded: false });
    });
  });
}

/**
 * Safely serves files from the public directory preventing path traversal.
 * @param {string} reqPath
 * @param {http.ServerResponse} res
 */
export function serveStaticFile(reqPath, res) {
  let relativePath = reqPath === '/' ? '/index.html' : reqPath;
  relativePath = decodeURIComponent(relativePath.split('?')[0]);

  const filePath = path.resolve(PUBLIC_DIR, '.' + relativePath);

  // Security Check: Path traversal defense
  if (!filePath.startsWith(PUBLIC_DIR)) {
    applySecurityHeaders(res);
    res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: 'Access forbidden.' }));
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      applySecurityHeaders(res);
      res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'Resource not found.' }));
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    applySecurityHeaders(res);
    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stats.size,
      'Cache-Control': 'public, max-age=3600'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
}

/**
 * Handles the health check endpoint.
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 */
export function handleHealthCheck(req, res) {
  if (req.method !== 'GET') {
    res.writeHead(405, { Allow: 'GET', 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify({ error: 'Method Not Allowed' }));
  }

  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({
    status: 'healthy',
    app: APP_NAME,
    uptime: process.uptime()
  }));
}

/**
 * Handles the presets list endpoint.
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 */
export function handlePresetsRequest(req, res) {
  if (req.method !== 'GET') {
    res.writeHead(405, { Allow: 'GET', 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify({ error: 'Method Not Allowed' }));
  }

  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({
    success: true,
    presets: SAMPLE_PRESETS
  }));
}

/**
 * Handles the air quality assessment API endpoint.
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 * @param {Object} options
 * @param {RateLimiter} rateLimiter
 * @param {string} clientIp
 */
export async function handleAssessRequest(req, res, options, rateLimiter, clientIp) {
  if (req.method !== 'POST') {
    res.writeHead(405, {
      Allow: 'POST',
      'Content-Type': 'application/json; charset=utf-8'
    });
    return res.end(JSON.stringify({
      success: false,
      errors: ['Method Not Allowed. Use POST.']
    }));
  }

  if (rateLimiter.isRateLimited(clientIp)) {
    res.writeHead(429, {
      'Content-Type': 'application/json; charset=utf-8',
      'Retry-After': '60'
    });
    return res.end(JSON.stringify({
      success: false,
      errors: ['Too many requests. Please wait a minute before submitting again.']
    }));
  }

  const contentType = req.headers['content-type'] || '';
  if (!contentType.toLowerCase().startsWith('application/json')) {
    res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify({
      success: false,
      errors: ['Invalid Content-Type: Must be application/json.']
    }));
  }

  const { body, limitExceeded } = await readRequestBody(req, INPUT_LIMITS.MAX_BODY_BYTES);
  if (limitExceeded) {
    res.writeHead(413, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify({
      success: false,
      errors: [`Payload Too Large: Maximum allowed size is ${INPUT_LIMITS.MAX_BODY_BYTES} bytes.`]
    }));
  }

  let parsedBody;
  try {
    parsedBody = JSON.parse(body);
  } catch {
    res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify({
      success: false,
      errors: ['Malformed JSON in request body.']
    }));
  }

  const validation = validateAssessmentInput(parsedBody);
  if (!validation.valid) {
    res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify({
      success: false,
      errors: validation.errors
    }));
  }

  try {
    const assessment = generateAssessment(validation.sanitized);
    const enriched = await enrichPlanWithAi(
      assessment,
      process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY,
      options.aiOptions
    );

    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      success: true,
      data: enriched
    }));
  } catch {
    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      success: false,
      errors: ['Internal server error while formulating air quality assessment.']
    }));
  }
}

/**
 * Dispatches an incoming HTTP request through routing, rate limiting, and security checks.
 * Can be invoked directly without TCP network sockets for robust in-process testing.
 *
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 * @param {Object} [options]
 * @param {RateLimiter} [rateLimiter]
 */
export async function dispatchRequest(req, res, options = {}, rateLimiter = null) {
  const limiter = rateLimiter || new RateLimiter(
    Number(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
    Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 60
  );

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;
  const clientIp = getClientIp(req);

  applySecurityHeaders(res);

  if (pathname === '/api/health') {
    return handleHealthCheck(req, res);
  }

  if (pathname === '/api/presets') {
    return handlePresetsRequest(req, res);
  }

  // Support both /api/assess and legacy alias /api/plan
  if (pathname === '/api/assess' || pathname === '/api/plan') {
    return handleAssessRequest(req, res, options, limiter, clientIp);
  }

  if (req.method === 'GET') {
    return serveStaticFile(pathname, res);
  }

  res.writeHead(405, { Allow: 'GET', 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({ error: 'Method Not Allowed' }));
}

/**
 * Creates the HTTP application server.
 * @param {Object} [options]
 * @returns {http.Server}
 */
export function createServer(options = {}) {
  const rateLimiter = options.rateLimiter || new RateLimiter(
    Number(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
    Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 60
  );

  return http.createServer((req, res) => {
    dispatchRequest(req, res, options, rateLimiter);
  });
}

// Default handler for Vercel Serverless environment
const defaultAppServer = createServer();

/**
 * Serverless request handler for Vercel.
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 */
export default function handler(req, res) {
  defaultAppServer.emit('request', req, res);
}

/**
 * Starts the application server on the specified port.
 * @param {number|string} [port]
 * @returns {http.Server}
 */
export function startServer(port = process.env.PORT || 3000) {
  return defaultAppServer.listen(port, () => {
    console.log(`Prana Urban Air Quality Assistant server running at http://localhost:${port}`);
  });
}

// Start server if directly executed
if (process.argv[1] && process.argv[1] === fileURLToPath(import.meta.url)) {
  startServer();
}
