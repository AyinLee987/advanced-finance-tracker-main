"use strict";

// ── Utilities (mirrored in utils.js for test runner) ──────────────────────────

const generateID = () =>
  `tx_${Date.now()}_${Math.random().toString(16).slice(2)}`;

const escapeHtml = (str) =>
  String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

// Fix: parse date parts manually to avoid UTC→local timezone shift
const formatDate = (dateString) => {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const filterTransactions = (transactions, filters) => {
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

const groupByMonth = (transactions) => {
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

const validateFormData = (title, amountValue, category, date) => {
  const errors = {};
  if (!title || !String(title).trim()) errors.title = "Title is required.";
  const amount = Number(amountValue);
  if (!amountValue || Number.isNaN(amount) || amount === 0)
    errors.amount = "Enter a valid amount.";
  if (!category) errors.category = "Select a category.";
  if (!date) errors.date = "Pick a date.";
  return { isValid: Object.keys(errors).length === 0, errors };
};

// ── i18n (mirrored in i18n.js for test runner) ───────────────────────────────

const LANG_KEY = "financeTrackerLang";

const translations = {
  en: {
    eyebrow: "Personal Finance",
    appTitle: "Advanced Finance Tracker",
    appSubtitle: "Track income, expenses, and your balance with clarity.",
    lightMode: "Light Mode",
    darkMode: "Dark Mode",
    exportCsv: "Export CSV",
    resetFilters: "Reset Filters",
    totalBalance: "Total Balance",
    totalIncome: "Total Income",
    totalExpenses: "Total Expenses",
    cashFlowOverview: "Cash Flow Overview",
    incomeVsExpense: "Income vs Expense",
    chartAriaLabel: "Bar chart showing total income versus total expenses",
    addTransactionHeading: "Add Transaction",
    formTitle: "Title",
    formAmount: "Amount",
    formCategory: "Category",
    formDate: "Date",
    selectCategory: "Select category",
    addTransactionBtn: "Add Transaction",
    saveChanges: "Save Changes",
    cancelEdit: "Cancel Edit",
    filtersSearch: "Filters & Search",
    allCategories: "All categories",
    all: "All",
    income: "Income",
    expense: "Expense",
    searchByTitle: "Search by title",
    searchPlaceholder: "Start typing...",
    transactions: "Transactions",
    results: "results",
    noTransactions: "No transactions yet. Add your first one to get started.",
    addFirst: "Add First Transaction",
    deleteTitle: "Delete transaction?",
    deleteBody: "This action cannot be undone.",
    cancel: "Cancel",
    delete: "Delete",
    privacyPolicy: "Privacy Policy",
    cookieMsg:
      "We use cookies to store your preferences and transaction data locally. No data is shared with third parties.",
    acceptCookies: "Accept",
    declineCookies: "Decline",
    editBtn: "Edit",
    deleteBtn: "Delete",
    catSalary: "Salary",
    catBusiness: "Business",
    catInvestments: "Investments",
    catHousing: "Housing",
    catFood: "Food",
    catTransport: "Transport",
    catHealth: "Health",
    catEntertainment: "Entertainment",
    catEducation: "Education",
    catOther: "Other",
    fixFields: "Please fix the highlighted fields.",
    transactionUpdated: "Transaction updated.",
    transactionAdded: "Transaction added.",
    editingMode: "Editing mode enabled.",
    transactionDeleted: "Transaction deleted.",
    noDataExport: "No data to export.",
    csvExported: "CSV exported.",
    titleRequired: "Title is required.",
    validAmount: "Enter a valid amount.",
    categoryRequired: "Select a category.",
    pickDate: "Pick a date.",
  },
  zh: {
    eyebrow: "个人财务",
    appTitle: "高级财务追踪器",
    appSubtitle: "清晰追踪您的收入、支出和余额。",
    lightMode: "浅色模式",
    darkMode: "深色模式",
    exportCsv: "导出 CSV",
    resetFilters: "重置筛选",
    totalBalance: "总余额",
    totalIncome: "总收入",
    totalExpenses: "总支出",
    cashFlowOverview: "现金流概览",
    incomeVsExpense: "收入 vs 支出",
    chartAriaLabel: "显示总收入与总支出对比的柱状图",
    addTransactionHeading: "添加交易",
    formTitle: "标题",
    formAmount: "金额",
    formCategory: "类别",
    formDate: "日期",
    selectCategory: "选择类别",
    addTransactionBtn: "添加交易",
    saveChanges: "保存更改",
    cancelEdit: "取消编辑",
    filtersSearch: "筛选与搜索",
    allCategories: "所有类别",
    all: "全部",
    income: "收入",
    expense: "支出",
    searchByTitle: "按标题搜索",
    searchPlaceholder: "开始输入...",
    transactions: "交易记录",
    results: "条结果",
    noTransactions: "暂无交易记录，请添加第一笔交易。",
    addFirst: "添加第一笔交易",
    deleteTitle: "删除交易？",
    deleteBody: "此操作无法撤销。",
    cancel: "取消",
    delete: "删除",
    privacyPolicy: "隐私政策",
    cookieMsg: "我们使用 Cookie 在本地存储您的偏好和交易数据。数据不会与第三方共享。",
    acceptCookies: "接受",
    declineCookies: "拒绝",
    editBtn: "编辑",
    deleteBtn: "删除",
    catSalary: "工资",
    catBusiness: "商业",
    catInvestments: "投资",
    catHousing: "住房",
    catFood: "餐饮",
    catTransport: "交通",
    catHealth: "健康",
    catEntertainment: "娱乐",
    catEducation: "教育",
    catOther: "其他",
    fixFields: "请修正高亮显示的字段。",
    transactionUpdated: "交易已更新。",
    transactionAdded: "交易已添加。",
    editingMode: "编辑模式已启用。",
    transactionDeleted: "交易已删除。",
    noDataExport: "没有可导出的数据。",
    csvExported: "CSV 已导出。",
    titleRequired: "标题为必填项。",
    validAmount: "请输入有效金额。",
    categoryRequired: "请选择类别。",
    pickDate: "请选择日期。",
  },
};

// ── Constants & state ─────────────────────────────────────────────────────────

const STORAGE_KEY = "financeTrackerData";
const THEME_KEY = "financeTrackerTheme";
const COOKIE_KEY = "financeTrackerCookies";

const state = {
  transactions: [],
  filters: { category: "all", type: "all", search: "" },
  editingId: null,
  pendingDeleteId: null,
  theme: "dark",
  lang: "en",
};

// ── i18n ──────────────────────────────────────────────────────────────────────

const t = (key) => translations[state.lang]?.[key] ?? key;

const applyI18n = () => {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
    el.setAttribute("aria-label", t(el.dataset.i18nAria));
  });
  const searchInput = document.getElementById("searchInput");
  if (searchInput) searchInput.placeholder = t("searchPlaceholder");
  if (dom.langToggleBtn) {
    dom.langToggleBtn.textContent = state.lang === "en" ? "中文" : "EN";
    dom.langToggleBtn.setAttribute(
      "aria-label",
      state.lang === "en" ? "Switch to Chinese" : "Switch to English"
    );
  }
  if (dom.themeToggleBtn) {
    dom.themeToggleBtn.textContent =
      state.theme === "light" ? t("darkMode") : t("lightMode");
  }
  if (dom.submitBtn && !state.editingId) {
    dom.submitBtn.textContent = t("addTransactionBtn");
  }
  document.documentElement.lang = state.lang === "zh" ? "zh-CN" : "en";
};

const setLang = (lang) => {
  state.lang = lang;
  localStorage.setItem(LANG_KEY, lang);
  applyI18n();
  renderApp();
};

const loadLang = () => {
  const stored = localStorage.getItem(LANG_KEY);
  state.lang = stored === "zh" ? "zh" : "en";
};

// ── DOM refs ──────────────────────────────────────────────────────────────────

const dom = {
  form: document.getElementById("transactionForm"),
  titleInput: document.getElementById("titleInput"),
  amountInput: document.getElementById("amountInput"),
  categoryInput: document.getElementById("categoryInput"),
  dateInput: document.getElementById("dateInput"),
  titleError: document.getElementById("titleError"),
  amountError: document.getElementById("amountError"),
  categoryError: document.getElementById("categoryError"),
  dateError: document.getElementById("dateError"),
  submitBtn: document.getElementById("submitBtn"),
  cancelEditBtn: document.getElementById("cancelEditBtn"),
  filterCategory: document.getElementById("filterCategory"),
  filterType: document.getElementById("filterType"),
  searchInput: document.getElementById("searchInput"),
  resetFiltersBtn: document.getElementById("resetFiltersBtn"),
  exportCsvBtn: document.getElementById("exportCsvBtn"),
  themeToggleBtn: document.getElementById("themeToggleBtn"),
  langToggleBtn: document.getElementById("langToggleBtn"),
  transactionsList: document.getElementById("transactionsList"),
  resultsCount: document.getElementById("resultsCount"),
  totalBalance: document.getElementById("totalBalance"),
  totalIncome: document.getElementById("totalIncome"),
  totalExpenses: document.getElementById("totalExpenses"),
  financeChart: document.getElementById("financeChart"),
  confirmModal: document.getElementById("confirmModal"),
  confirmDeleteBtn: document.getElementById("confirmDeleteBtn"),
  cancelDeleteBtn: document.getElementById("cancelDeleteBtn"),
  toastContainer: document.getElementById("toastContainer"),
  skeleton: document.getElementById("skeleton"),
  cookieBanner: document.getElementById("cookieBanner"),
  acceptCookiesBtn: document.getElementById("acceptCookiesBtn"),
  declineCookiesBtn: document.getElementById("declineCookiesBtn"),
};

// ── Storage ───────────────────────────────────────────────────────────────────

const saveToLocalStorage = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.transactions));
};

const loadFromLocalStorage = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  state.transactions = stored ? JSON.parse(stored) : [];
};

// ── Theme ─────────────────────────────────────────────────────────────────────

const setTheme = (theme) => {
  state.theme = theme;
  document.body.classList.toggle("theme-light", theme === "light");
  dom.themeToggleBtn.textContent =
    theme === "light" ? t("darkMode") : t("lightMode");
  localStorage.setItem(THEME_KEY, theme);
};

const loadTheme = () => {
  const stored = localStorage.getItem(THEME_KEY);
  setTheme(stored || "dark");
};

// ── Toast ─────────────────────────────────────────────────────────────────────

const showToast = (message, variant = "success") => {
  const toast = document.createElement("div");
  toast.className = `toast${variant === "error" ? " toast--error" : ""}`;
  toast.textContent = message;
  dom.toastContainer.innerHTML = "";
  dom.toastContainer.appendChild(toast);
  setTimeout(() => toast.remove(), 2400);
};

// ── Form validation ───────────────────────────────────────────────────────────

const clearErrors = () => {
  [
    { input: dom.titleInput, error: dom.titleError },
    { input: dom.amountInput, error: dom.amountError },
    { input: dom.categoryInput, error: dom.categoryError },
    { input: dom.dateInput, error: dom.dateError },
  ].forEach(({ input, error }) => {
    input.classList.remove("is-invalid");
    error.textContent = "";
  });
};

const setError = (input, errorEl, message) => {
  input.classList.add("is-invalid");
  errorEl.textContent = message;
};

const validateForm = () => {
  clearErrors();
  const { isValid, errors } = validateFormData(
    dom.titleInput.value.trim(),
    dom.amountInput.value.trim(),
    dom.categoryInput.value,
    dom.dateInput.value
  );
  if (errors.title) setError(dom.titleInput, dom.titleError, t("titleRequired"));
  if (errors.amount) setError(dom.amountInput, dom.amountError, t("validAmount"));
  if (errors.category) setError(dom.categoryInput, dom.categoryError, t("categoryRequired"));
  if (errors.date) setError(dom.dateInput, dom.dateError, t("pickDate"));
  return isValid;
};

const resetFormState = () => {
  dom.form.reset();
  state.editingId = null;
  dom.submitBtn.textContent = t("addTransactionBtn");
  dom.cancelEditBtn.hidden = true;
  clearErrors();
};

// ── Transactions CRUD ─────────────────────────────────────────────────────────

const addTransaction = () => {
  if (!validateForm()) {
    showToast(t("fixFields"), "error");
    return;
  }
  const title = dom.titleInput.value.trim();
  const amount = Number(dom.amountInput.value);
  const category = dom.categoryInput.value;
  const date = dom.dateInput.value;

  if (state.editingId) {
    state.transactions = state.transactions.map((tx) =>
      tx.id === state.editingId ? { ...tx, title, amount, category, date } : tx
    );
    showToast(t("transactionUpdated"));
  } else {
    state.transactions = [
      { id: generateID(), title, amount, category, date },
      ...state.transactions,
    ];
    showToast(t("transactionAdded"));
  }
  resetFormState();
  saveToLocalStorage();
  renderApp();
};

const startEditing = (id) => {
  const tx = state.transactions.find((tx) => tx.id === id);
  if (!tx) return;
  dom.titleInput.value = tx.title;
  dom.amountInput.value = tx.amount;
  dom.categoryInput.value = tx.category;
  dom.dateInput.value = tx.date;
  state.editingId = id;
  dom.submitBtn.textContent = t("saveChanges");
  dom.cancelEditBtn.hidden = false;
  dom.titleInput.focus();
  showToast(t("editingMode"));
};

const deleteTransaction = (id) => {
  state.transactions = state.transactions.filter((tx) => tx.id !== id);
  saveToLocalStorage();
  renderApp();
  showToast(t("transactionDeleted"));
};

// ── Modal ─────────────────────────────────────────────────────────────────────

const openConfirmModal = (id) => {
  state.pendingDeleteId = id;
  dom.confirmModal.classList.add("is-open");
  dom.confirmModal.setAttribute("aria-hidden", "false");
  dom.confirmDeleteBtn.focus();
};

const closeConfirmModal = () => {
  state.pendingDeleteId = null;
  dom.confirmModal.classList.remove("is-open");
  dom.confirmModal.setAttribute("aria-hidden", "true");
};

// ── Rendering ─────────────────────────────────────────────────────────────────

const renderSummary = () => {
  const amounts = state.transactions.map((tx) => tx.amount);
  const totalIncome = amounts.filter((a) => a > 0).reduce((s, a) => s + a, 0);
  const totalExpenses = amounts.filter((a) => a < 0).reduce((s, a) => s + a, 0);
  dom.totalIncome.textContent = formatCurrency(totalIncome);
  dom.totalExpenses.textContent = formatCurrency(Math.abs(totalExpenses));
  dom.totalBalance.textContent = formatCurrency(totalIncome + totalExpenses);
};

const renderTransactionItem = (tx) => {
  const safeTitle = escapeHtml(tx.title);
  const safeCategory = escapeHtml(tx.category);
  const typeClass = tx.amount >= 0 ? "amount--income" : "amount--expense";
  return `
    <div class="transaction">
      <div>
        <p class="transaction__title">${safeTitle}</p>
        <div class="transaction__meta">
          <span class="badge">${safeCategory}</span>
          <span>${formatDate(tx.date)}</span>
        </div>
      </div>
      <div>
        <p class="amount ${typeClass}">${formatCurrency(tx.amount)}</p>
        <button class="edit-btn" data-id="${tx.id}" aria-label="${t("editBtn")} ${safeTitle}">${t("editBtn")}</button>
        <button class="delete-btn" data-id="${tx.id}" aria-label="${t("deleteBtn")} ${safeTitle}">${t("deleteBtn")}</button>
      </div>
    </div>
  `;
};

const renderTransactions = () => {
  const filtered = filterTransactions(state.transactions, state.filters);
  dom.resultsCount.textContent = `${filtered.length} ${t("results")}`;

  if (filtered.length === 0) {
    dom.transactionsList.innerHTML = `
      <div class="transactions__empty">
        <div class="empty__icon" aria-hidden="true">+</div>
        <p>${t("noTransactions")}</p>
        <button class="btn btn--accent empty-add-btn" type="button">${t("addFirst")}</button>
      </div>
    `;
    return;
  }

  dom.transactionsList.innerHTML = groupByMonth(filtered)
    .map(
      (group) => `
        <div class="month-group">
          <p class="month-title">${escapeHtml(group.label)}</p>
          ${group.items.map(renderTransactionItem).join("")}
        </div>
      `
    )
    .join("");
};

const renderChart = () => {
  const canvas = dom.financeChart;
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  const displayWidth = canvas.clientWidth;
  const displayHeight = 260;
  canvas.width = displayWidth * dpr;
  canvas.height = displayHeight * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const width = displayWidth;
  const height = displayHeight;
  ctx.clearRect(0, 0, width, height);

  const amounts = state.transactions.map((tx) => tx.amount);
  const income = amounts.filter((a) => a > 0).reduce((s, a) => s + a, 0);
  const expenses = Math.abs(amounts.filter((a) => a < 0).reduce((s, a) => s + a, 0));
  const maxValue = Math.max(income, expenses, 1);
  const barWidth = 120;
  const gap = 80;
  const baseY = height - 40;
  const incomeHeight = (income / maxValue) * (height - 80);
  const expenseHeight = (expenses / maxValue) * (height - 80);

  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.beginPath();
  ctx.moveTo(40, baseY);
  ctx.lineTo(width - 40, baseY);
  ctx.stroke();

  ctx.fillStyle = "#22c55e";
  ctx.fillRect(160, baseY - incomeHeight, barWidth, incomeHeight);
  ctx.fillStyle = "#f97316";
  ctx.fillRect(160 + barWidth + gap, baseY - expenseHeight, barWidth, expenseHeight);

  ctx.fillStyle = state.theme === "light" ? "#0f172a" : "#f8f4e9";
  ctx.font = "14px sans-serif";
  ctx.fillText(t("income"), 170, baseY + 20);
  ctx.fillText(t("expense"), 160 + barWidth + gap, baseY + 20);
  ctx.fillText(formatCurrency(income), 150, baseY - incomeHeight - 10);
  ctx.fillText(formatCurrency(expenses), 150 + barWidth + gap, baseY - expenseHeight - 10);
};

const renderApp = () => {
  renderSummary();
  renderTransactions();
  renderChart();
};

// ── CSV export ────────────────────────────────────────────────────────────────

const exportToCSV = () => {
  if (state.transactions.length === 0) {
    showToast(t("noDataExport"), "error");
    return;
  }
  const headers = ["Title", "Amount", "Category", "Date"];
  const rows = state.transactions.map((tx) => [tx.title, tx.amount, tx.category, tx.date]);
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "transactions.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast(t("csvExported"));
};

// ── Cookie banner ─────────────────────────────────────────────────────────────

const initCookieBanner = () => {
  if (!localStorage.getItem(COOKIE_KEY)) {
    dom.cookieBanner.classList.add("is-visible");
  }
};

const hideCookieBanner = () => {
  dom.cookieBanner.classList.remove("is-visible");
};

// ── Init ──────────────────────────────────────────────────────────────────────

const initializeApp = () => {
  loadFromLocalStorage();
  loadLang();
  loadTheme();
  applyI18n();
  renderApp();
  initCookieBanner();

  setTimeout(() => dom.skeleton.classList.add("is-hidden"), 300);

  dom.form.addEventListener("submit", (e) => {
    e.preventDefault();
    addTransaction();
  });

  dom.cancelEditBtn.addEventListener("click", resetFormState);

  dom.transactionsList.addEventListener("click", (e) => {
    const deleteId = e.target.closest(".delete-btn")?.dataset?.id;
    const editId = e.target.closest(".edit-btn")?.dataset?.id;
    const emptyAdd = e.target.closest(".empty-add-btn");
    if (deleteId) openConfirmModal(deleteId);
    if (editId) startEditing(editId);
    if (emptyAdd) dom.titleInput.focus();
  });

  dom.filterCategory.addEventListener("change", (e) => {
    state.filters.category = e.target.value;
    renderTransactions();
  });

  dom.filterType.addEventListener("change", (e) => {
    state.filters.type = e.target.value;
    renderTransactions();
  });

  dom.searchInput.addEventListener("input", (e) => {
    state.filters.search = e.target.value;
    renderTransactions();
  });

  dom.resetFiltersBtn.addEventListener("click", () => {
    state.filters = { category: "all", type: "all", search: "" };
    dom.filterCategory.value = "all";
    dom.filterType.value = "all";
    dom.searchInput.value = "";
    renderTransactions();
  });

  dom.exportCsvBtn.addEventListener("click", exportToCSV);

  dom.themeToggleBtn.addEventListener("click", () => {
    setTheme(state.theme === "dark" ? "light" : "dark");
  });

  dom.langToggleBtn.addEventListener("click", () => {
    setLang(state.lang === "en" ? "zh" : "en");
  });

  dom.confirmDeleteBtn.addEventListener("click", () => {
    if (state.pendingDeleteId) deleteTransaction(state.pendingDeleteId);
    closeConfirmModal();
  });

  dom.cancelDeleteBtn.addEventListener("click", closeConfirmModal);

  dom.confirmModal.addEventListener("click", (e) => {
    if (e.target.dataset.close) closeConfirmModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && dom.confirmModal.classList.contains("is-open")) {
      closeConfirmModal();
    }
  });

  dom.acceptCookiesBtn.addEventListener("click", () => {
    localStorage.setItem(COOKIE_KEY, "accepted");
    hideCookieBanner();
  });

  dom.declineCookiesBtn.addEventListener("click", () => {
    localStorage.setItem(COOKIE_KEY, "declined");
    hideCookieBanner();
  });
};

initializeApp();
