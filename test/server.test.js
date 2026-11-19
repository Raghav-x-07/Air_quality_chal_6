import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { dispatchRequest, RateLimiter, applySecurityHeaders } from '../server.js';
import { USER_TYPES, AREA_TYPES, HOUSING_TYPES, COMMUTE_MODES, COOKING_HEATING, BUDGET_PREFERENCES } from '../src/constants.js';

/**
 * Creates a mock HTTP request object simulating Node.js IncomingMessage.
 */
function createMockRequest({
  method = 'GET',
  url = '/',
  headers = {},
  body = null,
  remoteAddress = '127.0.0.1'
} = {}) {
  const req = new EventEmitter();
  req.method = method;
  req.url = url;
  req.headers = { ...headers };
  req.socket = { remoteAddress };

  // Defer emitting data to allow handlers to attach listeners
  process.nextTick(() => {
    if (body !== null) {
      const buffer = Buffer.isBuffer(body) ? body : Buffer.from(typeof body === 'string' ? body : JSON.stringify(body));
      req.emit('data', buffer);
    }
    req.emit('end');
  });

  req.destroy = () => {
    req.emit('close');
  };

  return req;
}

/**
 * Creates a mock HTTP response object simulating Node.js ServerResponse.
 */
function createMockResponse() {
  const res = new EventEmitter();
  res.statusCode = 200;
  res.headers = {};
  res._body = '';
  res._chunks = [];

  res.setHeader = (key, value) => {
    res.headers[key.toLowerCase()] = value;
  };

  res.getHeader = (key) => {
    return res.headers[key.toLowerCase()];
  };

  res.writeHead = (statusCode, headers = {}) => {
    res.statusCode = statusCode;
    for (const [k, v] of Object.entries(headers)) {
      res.setHeader(k, v);
    }
    return res;
  };

  res.write = (chunk) => {
    if (chunk) {
      res._chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return true;
  };

  res.end = (chunk) => {
    if (chunk) {
      res._chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    res._body = Buffer.concat(res._chunks).toString('utf-8');
    res.emit('finish');
    return res;
  };

  return res;
}

/**
 * Helper to dispatch request and wait for response completion.
 */
function invokeDispatch(req, res, options = {}, rateLimiter = null) {
  return new Promise((resolve) => {
    res.on('finish', () => resolve(res));
    dispatchRequest(req, res, options, rateLimiter);
  });
}

describe('Server Module - Endpoints & Security Integration', () => {
  it('serves static index.html with 200 OK and security headers', async () => {
    const req = createMockRequest({ method: 'GET', url: '/' });
    const res = createMockResponse();

    await invokeDispatch(req, res);

    assert.equal(res.statusCode, 200);
    assert.ok(res.headers['content-type'].includes('text/html'));
    assert.ok(res.headers['content-security-policy'].includes("script-src 'self'"));
    assert.equal(res.headers['x-content-type-options'], 'nosniff');
    assert.equal(res.headers['x-frame-options'], 'DENY');
    assert.equal(res.headers['referrer-policy'], 'strict-origin-when-cross-origin');
    assert.ok(res._body.includes('Prana Air Assistant'));
  });

  it('serves static styles.css and app.js correctly', async () => {
    const reqCss = createMockRequest({ method: 'GET', url: '/styles.css' });
    const resCss = createMockResponse();
    await invokeDispatch(reqCss, resCss);
    assert.equal(resCss.statusCode, 200);
    assert.ok(resCss.headers['content-type'].includes('text/css'));

    const reqJs = createMockRequest({ method: 'GET', url: '/app.js' });
    const resJs = createMockResponse();
    await invokeDispatch(reqJs, resJs);
    assert.equal(resJs.statusCode, 200);
    assert.ok(resJs.headers['content-type'].includes('application/javascript'));
  });

  it('blocks path traversal attempts and returns 403 or 404', async () => {
    const req = createMockRequest({ method: 'GET', url: '/../server.js' });
    const res = createMockResponse();
    await invokeDispatch(req, res);
    assert.ok(res.statusCode === 403 || res.statusCode === 404);
  });

  it('responds with 200 OK for GET /api/health', async () => {
    const req = createMockRequest({ method: 'GET', url: '/api/health' });
    const res = createMockResponse();
    await invokeDispatch(req, res);

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res._body);
    assert.equal(body.status, 'healthy');
    assert.ok(body.app.includes('Prana'));
  });

  it('responds with 200 OK for GET /api/presets', async () => {
    const req = createMockRequest({ method: 'GET', url: '/api/presets' });
    const res = createMockResponse();
    await invokeDispatch(req, res);

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res._body);
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.presets));
    assert.ok(body.presets.length >= 4);
  });

  it('responds with 405 Method Not Allowed on non-GET for /api/health', async () => {
    const req = createMockRequest({ method: 'POST', url: '/api/health' });
    const res = createMockResponse();
    await invokeDispatch(req, res);
    assert.equal(res.statusCode, 405);
  });

  it('responds with 405 Method Not Allowed on invalid methods for /api/assess', async () => {
    const req = createMockRequest({ method: 'GET', url: '/api/assess' });
    const res = createMockResponse();
    await invokeDispatch(req, res);

    assert.equal(res.statusCode, 405);
    const body = JSON.parse(res._body);
    assert.equal(body.success, false);
  });

  it('responds with 400 Bad Request if Content-Type is missing or not application/json', async () => {
    const req = createMockRequest({
      method: 'POST',
      url: '/api/assess',
      headers: { 'content-type': 'text/plain' },
      body: 'plain text data'
    });
    const res = createMockResponse();
    await invokeDispatch(req, res);

    assert.equal(res.statusCode, 400);
    const body = JSON.parse(res._body);
    assert.ok(body.errors[0].includes('Content-Type'));
  });

  it('responds with 400 Bad Request on malformed JSON body', async () => {
    const req = createMockRequest({
      method: 'POST',
      url: '/api/assess',
      headers: { 'content-type': 'application/json' },
      body: '{"unclosed":'
    });
    const res = createMockResponse();
    await invokeDispatch(req, res);

    assert.equal(res.statusCode, 400);
    const body = JSON.parse(res._body);
    assert.ok(body.errors[0].includes('Malformed JSON'));
  });

  it('responds with 400 Bad Request on validation error (e.g. empty city)', async () => {
    const req = createMockRequest({
      method: 'POST',
      url: '/api/assess',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        city: '',
        aqiLevel: 400,
        householdSize: 4
      })
    });
    const res = createMockResponse();
    await invokeDispatch(req, res);

    assert.equal(res.statusCode, 400);
    const body = JSON.parse(res._body);
    assert.equal(body.success, false);
    assert.ok(body.errors.some((e) => e.includes('City/Location is required')));
  });

  it('responds with 200 OK and valid assessment for valid payload on /api/assess', async () => {
    const payload = {
      userType: USER_TYPES.FAMILY,
      city: 'Delhi NCR',
      areaType: AREA_TYPES.URBAN_CORE,
      aqiLevel: 420,
      householdSize: 4,
      housingType: HOUSING_TYPES.APARTMENT_HIGH_FLOOR,
      primaryCommute: COMMUTE_MODES.TWO_WHEELER,
      cookingHeating: COOKING_HEATING.LPG_GAS,
      vulnerableMembers: [],
      budgetPreference: BUDGET_PREFERENCES.LOW_COST_DIY,
      notes: 'Need DIY purifier advice'
    };

    const req = createMockRequest({
      method: 'POST',
      url: '/api/assess',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const res = createMockResponse();
    await invokeDispatch(req, res);

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res._body);
    assert.equal(body.success, true);
    assert.ok(body.data.impact);
    assert.ok(body.data.impact.exposureReductionPercent > 0);
    assert.ok(body.data.diurnalRoutine);
    assert.ok(body.data.iaqHacks);
  });

  it('supports backward-compatible legacy /api/plan alias', async () => {
    const payload = {
      city: 'Mumbai',
      aqiLevel: 220,
      householdSize: 2
    };

    const req = createMockRequest({
      method: 'POST',
      url: '/api/plan',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const res = createMockResponse();
    await invokeDispatch(req, res);

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res._body);
    assert.equal(body.success, true);
  });

  it('responds with 413 Payload Too Large when payload exceeds 64KB', async () => {
    const oversizedBody = 'A'.repeat(70000);
    const req = createMockRequest({
      method: 'POST',
      url: '/api/assess',
      headers: { 'content-type': 'application/json' },
      body: oversizedBody
    });
    const res = createMockResponse();
    await invokeDispatch(req, res);

    assert.equal(res.statusCode, 413);
    const body = JSON.parse(res._body);
    assert.ok(body.errors[0].includes('Payload Too Large'));
  });

  it('enforces rate limiting and returns 429 when threshold exceeded', async () => {
    const strictLimiter = new RateLimiter(60000, 3); // Max 3 requests
    const clientIp = '10.0.0.99';

    for (let i = 0; i < 3; i++) {
      const req = createMockRequest({
        method: 'POST',
        url: '/api/assess',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ city: 'Delhi', aqiLevel: 300, householdSize: 2 }),
        remoteAddress: clientIp
      });
      const res = createMockResponse();
      await invokeDispatch(req, res, {}, strictLimiter);
      assert.equal(res.statusCode, 200);
    }

    // 4th request must trigger 429
    const reqBlocked = createMockRequest({
      method: 'POST',
      url: '/api/assess',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ city: 'Delhi', aqiLevel: 300, householdSize: 2 }),
      remoteAddress: clientIp
    });
    const resBlocked = createMockResponse();
    await invokeDispatch(reqBlocked, resBlocked, {}, strictLimiter);

    assert.equal(resBlocked.statusCode, 429);
    assert.equal(resBlocked.headers['retry-after'], '60');
  });

  it('returns 404 for unknown routes', async () => {
    const req = createMockRequest({ method: 'GET', url: '/unknown-page-path' });
    const res = createMockResponse();
    await invokeDispatch(req, res);
    assert.equal(res.statusCode, 404);
  });

  it('responds with 405 Method Not Allowed on non-GET for static assets', async () => {
    const req = createMockRequest({ method: 'DELETE', url: '/styles.css' });
    const res = createMockResponse();
    await invokeDispatch(req, res);
    assert.equal(res.statusCode, 405);
  });
});
