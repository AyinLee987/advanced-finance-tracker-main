"use strict";

/**
 * Vercel Serverless Function - Log Collector
 *
 * This function receives log entries from the frontend and logs them
 * to the Vercel runtime console, making them visible in the
 * Vercel Dashboard → Deployment → Logs.
 *
 * Endpoint: POST /api/log
 * Body: { level: string, message: string, data?: any, timestamp: string }
 */

export default function handler(request, response) {
  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    response.status(200).end();
    return;
  }

  // Only accept POST requests
  if (request.method !== "POST") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const body = typeof request.body === "string" ? JSON.parse(request.body) : (request.body || {});

    const { level = "INFO", message = "", data, timestamp = new Date().toISOString() } = body;

    // Format the log entry for Vercel Dashboard display
    const logPrefix = `[${level}] [${timestamp}]`;

    if (data !== undefined) {
      console.log(`${logPrefix} ${message}`, JSON.stringify(data, null, 2));
    } else {
      console.log(`${logPrefix} ${message}`);
    }

    response.status(200).json({
      success: true,
      message: "Log recorded",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[ERROR] Failed to process log entry:", error.message);
    response.status(500).json({ error: "Internal server error" });
  }
}
