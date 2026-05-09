import { describe, it, expect } from "vitest";
import {
  generateID,
  escapeHtml,
  formatCurrency,
  formatDate,
  filterTransactions,
  groupByMonth,
  validateFormData,
} from "./utils.js";

// ── generateID ────────────────────────────────────────────────────────────────

describe("generateID", () => {
  it("returns a string starting with tx_", () => {
    expect(generateID()).toMatch(/^tx_/);
  });

  it("returns unique IDs on repeated calls", () => {
    const ids = new Set(Array.from({ length: 100 }, generateID));
    expect(ids.size).toBe(100);
  });
});

// ── escapeHtml ────────────────────────────────────────────────────────────────

describe("escapeHtml", () => {
  it("escapes < and >", () => {
    expect(escapeHtml("<script>")).toBe("&lt;script&gt;");
  });

  it("escapes &", () => {
    expect(escapeHtml("a & b")).toBe("a &amp; b");
  });

  it("escapes double quotes", () => {
    expect(escapeHtml('"hello"')).toBe("&quot;hello&quot;");
  });

  it("escapes single quotes", () => {
    expect(escapeHtml("it's")).toBe("it&#039;s");
  });

  it("handles XSS payload", () => {
    const result = escapeHtml('<img src=x onerror="alert(1)">');
    expect(result).not.toContain("<img");
    expect(result).toContain("&lt;img");
  });

  it("converts numbers to string", () => {
    expect(escapeHtml(42)).toBe("42");
  });

  it("converts null to string", () => {
    expect(escapeHtml(null)).toBe("null");
  });

  it("leaves safe strings unchanged", () => {
    expect(escapeHtml("hello world")).toBe("hello world");
  });
});

// ── formatCurrency ────────────────────────────────────────────────────────────

describe("formatCurrency", () => {
  it("formats a positive integer as USD", () => {
    expect(formatCurrency(1000)).toBe("$1,000.00");
  });

  it("formats a decimal amount", () => {
    expect(formatCurrency(1234.56)).toBe("$1,234.56");
  });

  it("formats zero", () => {
    expect(formatCurrency(0)).toBe("$0.00");
  });

  it("formats a negative amount", () => {
    expect(formatCurrency(-45)).toBe("-$45.00");
  });

  it("formats a large amount with comma separators", () => {
    expect(formatCurrency(1000000)).toBe("$1,000,000.00");
  });
});

// ── formatDate ────────────────────────────────────────────────────────────────

describe("formatDate", () => {
  it("formats a mid-month date correctly", () => {
    expect(formatDate("2024-01-15")).toBe("Jan 15, 2024");
  });

  it("formats the last day of a month without off-by-one error", () => {
    expect(formatDate("2024-01-31")).toBe("Jan 31, 2024");
  });

  it("formats December correctly", () => {
    expect(formatDate("2024-12-25")).toBe("Dec 25, 2024");
  });

  it("formats February in a leap year", () => {
    expect(formatDate("2024-02-29")).toBe("Feb 29, 2024");
  });

  it("formats the first day of a month", () => {
    expect(formatDate("2024-03-01")).toBe("Mar 1, 2024");
  });
});

// ── filterTransactions ────────────────────────────────────────────────────────

const sampleTx = [
  { id: "1", title: "Salary",    amount: 3000,  category: "Salary",   date: "2024-01-01" },
  { id: "2", title: "Rent",      amount: -1200, category: "Housing",  date: "2024-01-02" },
  { id: "3", title: "Freelance", amount: 500,   category: "Business", date: "2024-02-01" },
  { id: "4", title: "Groceries", amount: -80,   category: "Food",     date: "2024-02-05" },
];

describe("filterTransactions", () => {
  it("returns all transactions when all filters are 'all'", () => {
    const result = filterTransactions(sampleTx, { category: "all", type: "all", search: "" });
    expect(result).toHaveLength(4);
  });

  it("filters by category", () => {
    const result = filterTransactions(sampleTx, { category: "Salary", type: "all", search: "" });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("1");
  });

  it("filters income only", () => {
    const result = filterTransactions(sampleTx, { category: "all", type: "income", search: "" });
    expect(result).toHaveLength(2);
    result.forEach((tx) => expect(tx.amount).toBeGreaterThan(0));
  });

  it("filters expense only", () => {
    const result = filterTransactions(sampleTx, { category: "all", type: "expense", search: "" });
    expect(result).toHaveLength(2);
    result.forEach((tx) => expect(tx.amount).toBeLessThan(0));
  });

  it("filters by search term (case-insensitive)", () => {
    const result = filterTransactions(sampleTx, { category: "all", type: "all", search: "free" });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("3");
  });

  it("returns empty array when search has no match", () => {
    const result = filterTransactions(sampleTx, { category: "all", type: "all", search: "xyz123" });
    expect(result).toHaveLength(0);
  });

  it("combines category and type filters", () => {
    const result = filterTransactions(sampleTx, { category: "Business", type: "income", search: "" });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("3");
  });

  it("handles empty transaction array", () => {
    const result = filterTransactions([], { category: "all", type: "all", search: "" });
    expect(result).toHaveLength(0);
  });
});

// ── groupByMonth ──────────────────────────────────────────────────────────────

describe("groupByMonth", () => {
  it("groups transactions into correct months", () => {
    const groups = groupByMonth(sampleTx);
    expect(groups).toHaveLength(2);
  });

  it("orders groups most-recent first", () => {
    const groups = groupByMonth(sampleTx);
    expect(groups[0].label).toContain("February");
    expect(groups[1].label).toContain("January");
  });

  it("places the correct number of items in each group", () => {
    const groups = groupByMonth(sampleTx);
    expect(groups[0].items).toHaveLength(2); // February
    expect(groups[1].items).toHaveLength(2); // January
  });

  it("returns empty array for empty input", () => {
    expect(groupByMonth([])).toHaveLength(0);
  });

  it("handles a single transaction", () => {
    const groups = groupByMonth([sampleTx[0]]);
    expect(groups).toHaveLength(1);
    expect(groups[0].items).toHaveLength(1);
  });

  it("does not mutate the original array", () => {
    const original = [...sampleTx];
    groupByMonth(sampleTx);
    expect(sampleTx).toEqual(original);
  });
});

// ── validateFormData ──────────────────────────────────────────────────────────

describe("validateFormData", () => {
  it("returns valid for correct input", () => {
    const { isValid, errors } = validateFormData("Salary", "3000", "Salary", "2024-01-01");
    expect(isValid).toBe(true);
    expect(errors).toEqual({});
  });

  it("accepts negative amount", () => {
    const { isValid } = validateFormData("Rent", "-1200", "Housing", "2024-01-02");
    expect(isValid).toBe(true);
  });

  it("rejects empty title", () => {
    const { isValid, errors } = validateFormData("", "100", "Salary", "2024-01-01");
    expect(isValid).toBe(false);
    expect(errors.title).toBeDefined();
  });

  it("rejects whitespace-only title", () => {
    const { isValid, errors } = validateFormData("   ", "100", "Salary", "2024-01-01");
    expect(isValid).toBe(false);
    expect(errors.title).toBeDefined();
  });

  it("rejects zero amount", () => {
    const { isValid, errors } = validateFormData("Test", "0", "Salary", "2024-01-01");
    expect(isValid).toBe(false);
    expect(errors.amount).toBeDefined();
  });

  it("rejects non-numeric amount", () => {
    const { isValid, errors } = validateFormData("Test", "abc", "Salary", "2024-01-01");
    expect(isValid).toBe(false);
    expect(errors.amount).toBeDefined();
  });

  it("rejects empty amount", () => {
    const { isValid, errors } = validateFormData("Test", "", "Salary", "2024-01-01");
    expect(isValid).toBe(false);
    expect(errors.amount).toBeDefined();
  });

  it("rejects missing category", () => {
    const { isValid, errors } = validateFormData("Test", "100", "", "2024-01-01");
    expect(isValid).toBe(false);
    expect(errors.category).toBeDefined();
  });

  it("rejects missing date", () => {
    const { isValid, errors } = validateFormData("Test", "100", "Salary", "");
    expect(isValid).toBe(false);
    expect(errors.date).toBeDefined();
  });

  it("returns all four errors when all fields are empty", () => {
    const { isValid, errors } = validateFormData("", "", "", "");
    expect(isValid).toBe(false);
    expect(Object.keys(errors)).toHaveLength(4);
  });
});
