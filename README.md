# Payment API Demo

Professional demonstration of payment processing API for Banco Nacional enterprise client.

## Overview
This demo showcases a secure, scalable payment processing API designed for banking institutions.

## Endpoints

### POST /payments
Initiate a new payment transaction
```json
{
  "amount": 10000,
  "currency": "ARS",
  "description": "Payment for services",
  "customerId": "cust_123"
}
```

### GET /payments/{id}
Check payment status

### POST /payments/{id}/refund
Process a refund
```json
{
  "reason": "Customer request",
  "amount": 10000
}
```

## Running locally
```bash
npm install
npm start
```

Server runs on http://localhost:3000

## Demo flow for Banco Nacional
1. Initiate payment → POST /payments
2. Check status → GET /payments/{id}
3. Process refund → POST /payments/{id}/refund
