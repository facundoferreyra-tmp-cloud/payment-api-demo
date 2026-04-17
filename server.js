const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// In-memory store for demo purposes
const payments = new Map();

// ==================== SECURITY MIDDLEWARE STUBS ====================
// Banks always ask about these - placeholder implementations for demo

// 1. JWT Authentication Header Validation
// In production: verify JWT signature, check expiry, validate issuer
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  // TODO: Implement full JWT validation
  // - Verify token signature using public key
  // - Check exp, iat, iss claims
  // - Validate audience for Banco Nacional
  // - Implement token refresh logic
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // For demo: allow requests but log warning
    console.warn('[AUTH] Missing or invalid Authorization header');
    // In production: return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Mock decoded user for demo
  req.user = { id: 'demo_user', role: 'api_client' };
  next();
};

// 2. Rate Limiting (DDoS Protection)
// In production: use Redis store, implement sliding window
const rateLimiter = (req, res, next) => {
  // TODO: Implement production rate limiting
  // - Use express-rate-limit with Redis store
  // - Configure: 1000 req/min per API key for banks
  // - Implement IP-based fallback limiting
  // - Add DDoS protection at WAF/CDN layer (Cloudflare/AWS Shield)
  // - Log rate limit hits to SIEM
  
  const clientId = req.headers['x-api-key'] || req.ip;
  console.log(`[RATE_LIMIT] Request from ${clientId}`);
  
  // For demo: always allow
  next();
};

// 3. Request Logging with Transaction IDs
// Critical for bank audits and troubleshooting
const requestLogger = (req, res, next) => {
  // Generate unique transaction ID for tracing
  const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  req.transactionId = transactionId;
  
  // TODO: Production logging
  // - Send to centralized logging (ELK, Splunk, Datadog)
  // - Include: timestamp, transactionId, user, IP, endpoint, payload (sanitized)
  // - Ensure PCI DSS compliance - never log full card numbers
  // - Implement log retention: 7 years for banking regulations
  // - Add correlation IDs for distributed tracing
  
  const startTime = Date.now();
  
  console.log(`[${transactionId}] ${req.method} ${req.path} - Start`);
  
  // Log response
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`[${transactionId}] ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });
  
  // Add transaction ID to response headers
  res.setHeader('X-Transaction-ID', transactionId);
  next();
};

// Apply security middleware (order matters!)
app.use(requestLogger);
app.use(rateLimiter);
app.use(authenticateJWT);

// ===================================================================

// POST /payments - initiate a payment transaction
app.post('/payments', (req, res) => {
  const { amount, currency, description, customerId } = req.body;
  
  // Generate mock payment ID
  const paymentId = 'pay_' + Date.now();
  
  const payment = {
    id: paymentId,
    amount,
    currency: currency || 'ARS',
    description,
    customerId,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    transactionId: req.transactionId // Link to request log
  };
  
  payments.set(paymentId, payment);
  
  // Simulate processing
  setTimeout(() => {
    payment.status = 'completed';
    payment.updatedAt = new Date().toISOString();
    payments.set(paymentId, payment);
  }, 2000);
  
  res.status(201).json({
    success: true,
    data: payment,
    message: 'Payment initiated successfully'
  });
});

// GET /payments/:id - check payment status
app.get('/payments/:id', (req, res) => {
  const { id } = req.params;
  const payment = payments.get(id);
  
  if (!payment) {
    return res.status(404).json({
      success: false,
      error: 'Payment not found',
      transactionId: req.transactionId
    });
  }
  
  res.json({
    success: true,
    data: payment
  });
});

// POST /payments/:id/refund - process refund
app.post('/payments/:id/refund', (req, res) => {
  const { id } = req.params;
  const { reason, amount } = req.body;
  
  const payment = payments.get(id);
  
  if (!payment) {
    return res.status(404).json({
      success: false,
      error: 'Payment not found',
      transactionId: req.transactionId
    });
  }
  
  if (payment.status !== 'completed') {
    return res.status(400).json({
      success: false,
      error: 'Only completed payments can be refunded',
      transactionId: req.transactionId
    });
  }
  
  const refundId = 'ref_' + Date.now();
  const refund = {
    id: refundId,
    paymentId: id,
    amount: amount || payment.amount,
    reason,
    status: 'processed',
    createdAt: new Date().toISOString(),
    transactionId: req.transactionId
  };
  
  payment.status = 'refunded';
  payment.updatedAt = new Date().toISOString();
  payments.set(id, payment);
  
  res.json({
    success: true,
    data: {
      refund,
      payment
    },
    message: 'Refund processed successfully'
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    transactionId: req.transactionId
  });
});

app.listen(PORT, () => {
  console.log(`Payment API Demo server running on port ${PORT}`);
  console.log(`Ready for Banco Nacional demo`);
  console.log(`Security middleware: JWT auth, rate limiting, and transaction logging enabled (demo mode)`);
});
