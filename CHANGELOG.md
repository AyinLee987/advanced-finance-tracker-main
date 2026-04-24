# Changelog

All notable changes to **Advanced Finance Tracker** are recorded here.

---

## [1.1.0] — 2026-04-24

### Added — Logging System (`logger.js`)

A new standalone `Logger` utility has been added to the project.

#### File: `logger.js`

A self-contained IIFE module that exposes a global `Logger` object. No external dependencies.

**Log levels (low → high):** `DEBUG` → `INFO` → `WARN` → `ERROR`

| Method | Description |
|---|---|
| `Logger.debug(message, data?)` | Low-level diagnostic details (storage ops, render cycles) |
| `Logger.info(message, data?)`  | Normal application events (init, CRUD, theme/lang changes) |
| `Logger.warn(message, data?)`  | Unexpected but non-fatal situations (validation failures, empty exports) |
| `Logger.error(message, data?)` | Errors that affect functionality |
| `Logger.setLevel(level)`       | Set the minimum level shown; levels below are silently dropped |
| `Logger.getAll()`              | Returns the full array of persisted log entries |
| `Logger.clear()`               | Clears all logs from localStorage |
| `Logger.export()`              | Downloads all logs as a dated `.json` file |

**Storage:** Logs are persisted in `localStorage` under the key `financeTrackerLogs`, capped at 200 entries (oldest are dropped when the cap is exceeded).

**Console output format:**
```
[INFO] 2026-04-24T10:30:00.000Z — App initialized  {lang: "en", theme: "dark", transactions: 5}
```
Each level uses a distinct colour so logs are easy to scan in DevTools.

#### Integration points in `main.js`

| Event | Level | Message |
|---|---|---|
| App start | INFO | `"App initializing"` |
| App ready | INFO | `"App initialized"` + `{lang, theme, transactions}` |
| Transactions loaded from storage | DEBUG | `"Transactions loaded from localStorage"` |
| Transactions saved to storage | DEBUG | `"Transactions saved to localStorage"` |
| Transaction added | INFO | `"Transaction added"` + `{id, title, amount, category, date}` |
| Transaction updated | INFO | `"Transaction updated"` + `{id, title, amount, category, date}` |
| Transaction deleted | INFO | `"Transaction deleted"` + `{id}` |
| Form validation failed | WARN | `"Transaction form submission blocked by validation errors"` |
| CSV exported | INFO | `"CSV exported"` + `{transactionCount}` |
| CSV export with no data | WARN | `"CSV export attempted with no transactions"` |
| Theme changed | INFO | `"Theme changed"` + `{theme}` |
| Language changed | INFO | `"Language changed"` + `{lang}` |

#### Changes to `index.html`

`logger.js` is loaded as a classic `<script>` tag immediately before `main.js` so the `Logger` global is available throughout `main.js`.

---

## [1.0.0] — Initial release

- Transaction management (add, edit, delete with confirmation)
- Filtering by category, type, and free-text search
- Summary cards: balance, income, expenses
- Canvas bar chart (income vs expenses)
- CSV export
- Dark / light theme with persistence
- English / Chinese localisation
- Cookie consent banner
- Vitest unit-test suite (≥ 80 % coverage)
