export const generateID = () =>
  `tx_${Date.now()}_${Math.random().toString(16).slice(2)}`;

export const escapeHtml = (str) =>
  String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

export const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

// Fix: parse date parts manually to avoid UTC→local timezone shift
export const formatDate = (dateString) => {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

export const filterTransactions = (transactions, filters) => {
  const { category, type, search } = filters;
  return transactions.filter((tx) => {
    const matchesCategory = category === "all" || tx.category === category;
    const matchesType =
      type === "all" ||
      (type === "income" && tx.amount > 0) ||
      (type === "expense" && tx.amount < 0);
    const matchesSearch = tx.title.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesType && matchesSearch;
  });
};

export const groupByMonth = (transactions) => {
  const sorted = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
  const groups = [];
  const lookup = new Map();
  sorted.forEach((tx) => {
    const [year, month] = tx.date.split("-").map(Number);
    const label = new Date(year, month - 1, 1).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
    if (!lookup.has(label)) {
      lookup.set(label, { label, items: [] });
      groups.push(lookup.get(label));
    }
    lookup.get(label).items.push(tx);
  });
  return groups;
};

export const validateFormData = (title, amountValue, category, date) => {
  const errors = {};
  if (!title || !String(title).trim()) errors.title = "Title is required.";
  const amount = Number(amountValue);
  if (!amountValue || Number.isNaN(amount) || amount === 0)
    errors.amount = "Enter a valid amount.";
  if (!category) errors.category = "Select a category.";
  if (!date) errors.date = "Pick a date.";
  return { isValid: Object.keys(errors).length === 0, errors };
};
