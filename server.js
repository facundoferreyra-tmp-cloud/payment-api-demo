const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// In-memory store for demo purposes
const payments = new Map();

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
    updatedAt: new Date().toISOString()
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
      error: 'Payment not found'
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
      error: 'Payment not found'
    });
  }
  
  if (payment.status !== 'completed') {
    return res.status(400).json({
      success: false,
      error: 'Only completed payments can be refunded'
    });
  }
  
  const refundId = 'ref_' + Date.now();
  const refund = {
    id: refundId,
    paymentId: id,
    amount: amount || payment.amount,
    reason,
    status: 'processed',
    createdAt: new Date().toISOString()
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
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Payment API Demo server running on port ${PORT}`);
  console.log(`Ready for Banco Nacional demo`);
});
