"use strict";

/**
 * Vercel Serverless Function - Transactions API
 *
 * This function handles transaction CRUD operations on the server side.
 * All console.log output will appear in Vercel Runtime Logs
 * (Vercel Dashboard → Deployment → Logs).
 *
 * Endpoints:
 *   GET    /api/transactions          - List all transactions
 *   POST   /api/transactions          - Create a new transaction
 *   PUT    /api/transactions?id=xxx   - Update a transaction
 *   DELETE /api/transactions?id=xxx   - Delete a transaction
 */

// In-memory storage (Vercel Serverless Functions are stateless,
// this is for demo purposes. In production, use a database.)
let transactions = [];

export default function handler(request, response) {
  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    response.status(200).end();
    return;
  }

  const { method } = request;

  console.log(`[API] ${method} /api/transactions - ${new Date().toISOString()}`);

  try {
    switch (method) {
      case "GET":
        return handleGET(request, response);

      case "POST":
        return handlePOST(request, response);

      case "PUT":
        return handlePUT(request, response);

      case "DELETE":
        return handleDELETE(request, response);

      default:
        console.log(`[API] Method not allowed: ${method}`);
        response.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error(`[API] Error: ${error.message}`);
    response.status(500).json({ error: "Internal server error" });
  }
}

function handleGET(request, response) {
  const { category, type, search } = request.query || {};

  let filtered = [...transactions];

  if (category && category !== "all") {
    filtered = filtered.filter((tx) => tx.category === category);
  }
  if (type && type !== "all") {
    filtered = filtered.filter((tx) =>
      type === "income" ? tx.amount > 0 : tx.amount < 0
    );
  }
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter((tx) => tx.title.toLowerCase().includes(q));
  }

  console.log(`[API] GET /api/transactions - Returning ${filtered.length} of ${transactions.length} transactions`);

  response.status(200).json({
    success: true,
    total: transactions.length,
    filtered: filtered.length,
    data: filtered,
  });
}

function handlePOST(request, response) {
  const body = typeof request.body === "string" ? JSON.parse(request.body) : (request.body || {});
  const { title, amount, category, date } = body;

  // Validation
  const errors = {};
  if (!title || !String(title).trim()) errors.title = "Title is required.";
  const numAmount = Number(amount);
  if (!amount || Number.isNaN(numAmount) || numAmount === 0) errors.amount = "Enter a valid amount.";
  if (!category) errors.category = "Select a category.";
  if (!date) errors.date = "Pick a date.";

  if (Object.keys(errors).length > 0) {
    console.log(`[API] POST /api/transactions - Validation failed: ${JSON.stringify(errors)}`);
    response.status(400).json({ success: false, errors });
    return;
  }

  const newTransaction = {
    id: `tx_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    title: title.trim(),
    amount: numAmount,
    category,
    date,
    createdAt: new Date().toISOString(),
  };

  transactions = [newTransaction, ...transactions];

  console.log(`[API] POST /api/transactions - Created transaction: id=${newTransaction.id}, title="${newTransaction.title}", amount=${newTransaction.amount}, category=${newTransaction.category}`);
  console.log(`[API] POST /api/transactions - Total transactions now: ${transactions.length}`);

  response.status(201).json({
    success: true,
    message: "Transaction created",
    data: newTransaction,
  });
}

function handlePUT(request, response) {
  const { id } = request.query || {};
  if (!id) {
    console.log(`[API] PUT /api/transactions - Missing id parameter`);
    response.status(400).json({ success: false, error: "Missing id parameter" });
    return;
  }

  const body = typeof request.body === "string" ? JSON.parse(request.body) : (request.body || {});
  const { title, amount, category, date } = body;

  const index = transactions.findIndex((tx) => tx.id === id);
  if (index === -1) {
    console.log(`[API] PUT /api/transactions - Transaction not found: id=${id}`);
    response.status(404).json({ success: false, error: "Transaction not found" });
    return;
  }

  const updated = {
    ...transactions[index],
    title: title !== undefined ? title.trim() : transactions[index].title,
    amount: amount !== undefined ? Number(amount) : transactions[index].amount,
    category: category !== undefined ? category : transactions[index].category,
    date: date !== undefined ? date : transactions[index].date,
    updatedAt: new Date().toISOString(),
  };

  transactions[index] = updated;

  console.log(`[API] PUT /api/transactions - Updated transaction: id=${id}, title="${updated.title}", amount=${updated.amount}`);
  console.log(`[API] PUT /api/transactions - Transaction ${id} updated successfully`);

  response.status(200).json({
    success: true,
    message: "Transaction updated",
    data: updated,
  });
}

function handleDELETE(request, response) {
  const { id } = request.query || {};
  if (!id) {
    console.log(`[API] DELETE /api/transactions - Missing id parameter`);
    response.status(400).json({ success: false, error: "Missing id parameter" });
    return;
  }

  const index = transactions.findIndex((tx) => tx.id === id);
  if (index === -1) {
    console.log(`[API] DELETE /api/transactions - Transaction not found: id=${id}`);
    response.status(404).json({ success: false, error: "Transaction not found" });
    return;
  }

  const deleted = transactions[index];
  transactions.splice(index, 1);

  console.log(`[API] DELETE /api/transactions - Deleted transaction: id=${id}, title="${deleted.title}", amount=${deleted.amount}`);
  console.log(`[API] DELETE /api/transactions - Total transactions remaining: ${transactions.length}`);

  response.status(200).json({
    success: true,
    message: "Transaction deleted",
    data: deleted,
  });
}
