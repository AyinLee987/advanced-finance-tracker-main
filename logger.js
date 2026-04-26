"use strict";

// ── Logger ────────────────────────────────────────────────────────────────────
// Levels: DEBUG < INFO < WARN < ERROR
// Logs are written to the console and persisted in localStorage (capped at 200).
// When deployed on Vercel, logs are also sent to the /api/log endpoint so they
// appear in the Vercel Dashboard → Deployment → Logs.

const Logger = (() => {
  const STORAGE_KEY = "financeTrackerLogs";
  const MAX_ENTRIES = 200;

  const LEVELS = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };

  // Change to "DEBUG" during development to see all messages.
  let minLevel = LEVELS.INFO;

  const STYLES = {
    DEBUG: "color:#94a3b8;font-weight:bold",
    INFO:  "color:#60a5fa;font-weight:bold",
    WARN:  "color:#fbbf24;font-weight:bold",
    ERROR: "color:#f87171;font-weight:bold",
  };

  const CONSOLE_METHODS = {
    DEBUG: "debug",
    INFO:  "info",
    WARN:  "warn",
    ERROR: "error",
  };

  function timestamp() {
    return new Date().toISOString();
  }

  function loadLogs() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch {
      return [];
    }
  }

  function saveLogs(logs) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
    } catch {
      // Silently ignore storage quota errors.
    }
  }

  function persist(level, message, data) {
    const logs = loadLogs();
    const entry = { timestamp: timestamp(), level, message };
    if (data !== undefined) entry.data = data;
    logs.push(entry);
    if (logs.length > MAX_ENTRIES) logs.splice(0, logs.length - MAX_ENTRIES);
    saveLogs(logs);
  }

  /**
   * Sends a log entry to the Vercel Serverless Function /api/log
   * so it appears in the Vercel Dashboard → Deployment → Logs.
   * Uses sendBeacon for reliability (works even when page is unloading).
   * Falls back to fetch if sendBeacon is not available.
   */
  function sendToVercel(level, message, data) {
    const payload = JSON.stringify({
      level,
      message,
      data,
      timestamp: timestamp(),
    });

    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/log", payload);
      } else {
        fetch("/api/log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
        }).catch(() => {
          // Silently ignore network errors (e.g., when running locally without Vercel)
        });
      }
    } catch {
      // Silently ignore errors (e.g., when running locally without Vercel)
    }
  }

  function log(level, message, data) {
    if (LEVELS[level] < minLevel) return;
    const ts = timestamp();
    const method = CONSOLE_METHODS[level];
    const prefix = `%c[${level}]`;
    const label = `${ts} — ${message}`;
    if (data !== undefined) {
      console[method](prefix, STYLES[level], label, data);
    } else {
      console[method](prefix, STYLES[level], label);
    }
    persist(level, message, data);
    // Send to Vercel Dashboard logs (silently fails if not on Vercel)
    sendToVercel(level, message, data);
  }

  return {
    setLevel(level) {
      if (LEVELS[level] !== undefined) minLevel = LEVELS[level];
    },

    debug(message, data) { log("DEBUG", message, data); },
    info(message, data)  { log("INFO",  message, data); },
    warn(message, data)  { log("WARN",  message, data); },
    error(message, data) { log("ERROR", message, data); },

    getAll() {
      return loadLogs();
    },

    clear() {
      saveLogs([]);
    },

    // Downloads all stored logs as a timestamped JSON file.
    export() {
      const logs = loadLogs();
      if (logs.length === 0) {
        console.info("[Logger] No logs to export.");
        return;
      }
      const json = JSON.stringify(logs, null, 2);
      const blob = new Blob([json], { type: "application/json;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `finance-tracker-logs-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    },
  };
})();

// Expose Logger globally so main.js can access it
window.Logger = Logger;
