import { useCallback, useEffect, useMemo, useState } from "react";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { useAuth } from "../hooks/useAuth";
import supabase from "../utils/supabase";
import { deleteWeeklyBudget, fetchMonthlyBudgets, getWeeklyBudgets, saveWeeklyBudget } from "../utils/budgetSupport";
import CategoriesList from "../components/CategoriesList";
import toast from "react-hot-toast";
import { formatDeviceDate, formatLocalMonthInput, parseLocalMonthInput, parseStoredDate } from "../utils/date";

const getWeekBounds = (offset) => {
  const base = new Date();
  base.setDate(base.getDate() + offset * 7);
  const day = base.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const start = new Date(base);
  start.setDate(base.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

const fmtDate = (date) => formatDeviceDate(date, { day: "numeric", month: "short" });

const getTransactionDate = (transaction) => parseStoredDate(transaction.transaction_date || transaction.created_at);

const getBudgetStatus = (spent, limit) => {
  if (limit <= 0) return { tone: "green", label: "On track" };
  const ratio = spent / limit;

  if (ratio >= 1) return { tone: "red", label: "Over budget" };
  if (ratio >= 0.75) return { tone: "amber", label: "Close to limit" };
  return { tone: "green", label: "Comfortably within budget" };
};

const getSummaryStatus = (spent, limit) => {
  if (limit <= 0) return { tone: "green", label: "Below 50%" };
  const ratio = spent / limit;

  if (ratio < 0.5) return { tone: "green", label: "Below 50%" };
  if (ratio < 0.7) return { tone: "amber", label: "50% to 70%" };
  return { tone: "red", label: "70% or more" };
};

export default function Budgets() {
  const { user } = useAuth();

  const [categories, setCategories] = useState([]);
  const [budgetLimits, setBudgetLimits] = useState({});
  const [spending, setSpending] = useState({});
  const [savedBudgets, setSavedBudgets] = useState([]);
  const [inputAmounts, setInputAmounts] = useState({});
  const [view, setView] = useState("monthly");
  const [month, setMonth] = useState(formatLocalMonthInput());
  const [weekOffset, setWeekOffset] = useState(0);

  const fetchCategories = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("categories")
      .select("*")
      .or(`user_id.eq.${user.id},is_default.eq.true`);
    setCategories(data || []);
  }, [user]);

  const fetchBudgetData = useCallback(async () => {
    if (!user) return;

    const currentPeriod = view;
    let filteredBudgets = [];

    if (currentPeriod === "weekly") {
      filteredBudgets = getWeeklyBudgets();
    } else {
      const { data: budgetRows, error: budgetError } = await fetchMonthlyBudgets(supabase, user.id);
      if (budgetError) {
        toast.error("Could not load budgets");
        return;
      }
      filteredBudgets = budgetRows || [];
    }

    const limitsMap = {};
    filteredBudgets.forEach((budget) => {
      limitsMap[`${budget.category_id}:${budget.period}`] = budget.limit_amount;
    });
    setBudgetLimits(limitsMap);
    setSavedBudgets(filteredBudgets);

    const { start, end } =
      currentPeriod === "weekly"
        ? getWeekBounds(weekOffset)
        : (() => {
            const rangeStart = parseLocalMonthInput(month);
            const rangeEnd = new Date(rangeStart);
            rangeEnd.setMonth(rangeEnd.getMonth() + 1);
            return { start: rangeStart, end: rangeEnd };
          })();

    const { data: transactions, error: transactionError } = await supabase
      .from("transactions")
      .select("amount, category_id, transaction_date, created_at")
      .eq("user_id", user.id);

    if (transactionError) {
      toast.error("Could not load spending");
      return;
    }

    const spendMap = {};
    (transactions || []).forEach((transaction) => {
      const date = getTransactionDate(transaction);
      if (date < start || date >= end) return;

      if (transaction.category_id) {
        spendMap[transaction.category_id] = (spendMap[transaction.category_id] || 0) + Number(transaction.amount);
      }
    });
    setSpending(spendMap);
  }, [month, user, view, weekOffset]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    if (user) fetchBudgetData();
  }, [fetchBudgetData, user]);

  const saveBudget = async (categoryId) => {
    const amount = Number(inputAmounts[`${categoryId}:${view}`]);
    if (!amount || amount <= 0) {
      toast.error("Enter a valid positive amount");
      return;
    }
    if (amount > 1_000_000) {
      toast.error("Amount is too large");
      return;
    }

    if (view === "weekly") {
      const category = categories.find((item) => item.id === categoryId);
      saveWeeklyBudget({
        categoryId,
        categoryName: category?.name || "Uncategorised",
        limitAmount: amount,
      });
      toast.success("Weekly budget saved!");
      setInputAmounts((prev) => ({ ...prev, [`${categoryId}:${view}`]: "" }));
      fetchBudgetData();
    } else {
      const existing = savedBudgets.find((budget) => budget.category_id === categoryId && budget.period === "monthly");
      let error;

      if (existing) {
        ({ error } = await supabase.from("budgets").update({ limit_amount: amount }).eq("id", existing.id));
      } else {
        ({ error } = await supabase.from("budgets").insert([{ category_id: categoryId, limit_amount: amount, user_id: user.id }]));
      }

      if (error) {
        toast.error("Error saving budget");
      } else {
        toast.success(existing ? "Monthly budget updated!" : "Monthly budget saved!");
        setInputAmounts((prev) => ({ ...prev, [`${categoryId}:${view}`]: "" }));
        fetchBudgetData();
      }
    }
  };

  const deleteBudget = async (budgetId) => {
    if (!confirm("Remove this budget limit?")) return;

    const budget = savedBudgets.find((item) => item.id === budgetId);

    if (view === "weekly") {
      deleteWeeklyBudget(budget?.category_id);
      toast.success("Weekly budget removed");
      fetchBudgetData();
    } else {
      const { data: deleted, error } = await supabase
        .from("budgets")
        .delete()
        .eq("id", budgetId)
        .eq("user_id", user.id)
        .select("id");

      if (error) {
        toast.error(error.message || "Error deleting budget");
        return;
      }

      if (!deleted || deleted.length === 0) {
        toast.error("Delete blocked — run the RLS policy SQL in your Supabase project (see console).");
        console.error(
          "Budget delete returned 0 rows. RLS is blocking it.\n\n" +
          "Run this in Supabase → SQL Editor:\n\n" +
          "alter table public.budgets enable row level security;\n\n" +
          "drop policy if exists \"BUDGETS_DELETE_OWN\" on public.budgets;\n" +
          "create policy \"BUDGETS_DELETE_OWN\" on public.budgets\n" +
          "  for delete using (auth.uid() = user_id);\n\n" +
          "drop policy if exists \"BUDGETS_SELECT_OWN\" on public.budgets;\n" +
          "create policy \"BUDGETS_SELECT_OWN\" on public.budgets\n" +
          "  for select using (auth.uid() = user_id);\n\n" +
          "drop policy if exists \"BUDGETS_INSERT_OWN\" on public.budgets;\n" +
          "create policy \"BUDGETS_INSERT_OWN\" on public.budgets\n" +
          "  for insert with check (auth.uid() = user_id);\n\n" +
          "drop policy if exists \"BUDGETS_UPDATE_OWN\" on public.budgets;\n" +
          "create policy \"BUDGETS_UPDATE_OWN\" on public.budgets\n" +
          "  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);"
        );
        return;
      }

      toast.success("Budget removed");
      fetchBudgetData();
    }
  };

  const handleAmountChange = (categoryId, value) => {
    if (Number(value) < 0) return;
    setInputAmounts((prev) => ({ ...prev, [`${categoryId}:${view}`]: value }));
  };

  const weekBounds = getWeekBounds(weekOffset);
  const weekLabel = `${fmtDate(weekBounds.start)} - ${fmtDate(weekBounds.end)}, ${weekBounds.start.getFullYear()}`;

  const overCount = savedBudgets.filter((budget) => (spending[budget.category_id] || 0) > budget.limit_amount).length;
  const totalBudgeted = savedBudgets.reduce((sum, budget) => sum + Number(budget.limit_amount), 0);
  const totalSpent = savedBudgets.reduce((sum, budget) => sum + (spending[budget.category_id] || 0), 0);
  const summaryStatus = getSummaryStatus(totalSpent, totalBudgeted);
  const summaryColor =
    summaryStatus.tone === "red"
      ? "var(--color-error)"
      : summaryStatus.tone === "amber"
        ? "var(--color-warning)"
        : "var(--color-success)";

  const periodLabel = useMemo(() => (view === "weekly" ? `Week of ${weekLabel}` : month), [view, weekLabel, month]);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h2>Budgets</h2>
          <p className="page-subtitle">Set monthly or repeating weekly limits and track each category at a glance.</p>
        </div>

        <div className="budgets-toolbar">
          <div className="view-toggle">
            <button className={`view-btn ${view === "monthly" ? "active" : ""}`} onClick={() => setView("monthly")}>
              Monthly
            </button>
            <button className={`view-btn ${view === "weekly" ? "active" : ""}`} onClick={() => setView("weekly")}>
              Weekly
            </button>
          </div>

          {view === "monthly" ? (
            <input
              id="budget-month"
              name="budget-month"
              type="month"
              autoComplete="off"
              value={month}
              onChange={(event) => setMonth(event.target.value)}
            />
          ) : (
            <div className="week-nav">
              <button className="btn week-nav-btn" onClick={() => setWeekOffset((value) => value - 1)}>
                <ArrowBackRoundedIcon fontSize="small" />
                Prev
              </button>
              <span className="week-label">Week of {weekLabel}</span>
              <button className="btn week-nav-btn" onClick={() => setWeekOffset((value) => value + 1)} disabled={weekOffset >= 0}>
                Next
                <ArrowForwardRoundedIcon fontSize="small" />
              </button>
            </div>
          )}
        </div>
      </div>

      {savedBudgets.length > 0 && (
        <div className="card total-card">
          <div className="summary-status-banner" style={{ color: summaryColor }}>
            <span className={`status-dot ${summaryStatus.tone}`} aria-hidden="true" />
            <span>{summaryStatus.label}</span>
          </div>
          <div className="summary-row">
            <div>
              <p className="summary-label">{view === "weekly" ? "Weekly Budgeted" : "Total Budgeted"}</p>
              <h2 className="summary-value">£{totalBudgeted.toFixed(2)}</h2>
            </div>
            <div>
              <p className="summary-label">{view === "weekly" ? "This Week Spent" : "Total Spent"}</p>
              <h2 className="summary-value" style={{ color: summaryColor }}>£{totalSpent.toFixed(2)}</h2>
            </div>
            <div>
              <p className="summary-label">Remaining</p>
              <h2 className="summary-value" style={{ color: summaryColor }}>
                £{Math.max(totalBudgeted - totalSpent, 0).toFixed(2)}
              </h2>
            </div>
            <div>
              <p className="summary-label">Over Limit</p>
              <h2 className="summary-value" style={{ color: summaryColor }}>
                {overCount} / {savedBudgets.length}
              </h2>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <h3>Set {view === "weekly" ? "Weekly" : "Monthly"} Budget Limits</h3>
        <p style={{ color: "var(--color-secondary)", fontSize: 13, marginTop: 0 }}>
          {view === "weekly"
            ? "Weekly budgets are stored in this browser and repeat every week. Enter a limit and press Save or Enter."
            : "Monthly budgets run across the selected month. Enter a limit and press Save or Enter."}
        </p>
        {categories.length === 0 ? (
          <p style={{ color: "var(--color-secondary)" }}>Add categories below before setting budgets.</p>
        ) : (
          <div className="budget-form">
            {categories.map((category) => {
              const key = `${category.id}:${view}`;

              return (
                <div key={category.id} className="budget-row">
                  <span className="budget-label">{category.name}</span>
                  <input
                    id={`budget-amount-${category.id}-${view}`}
                    name={`budget-amount-${category.id}-${view}`}
                    type="number"
                    min="0.01"
                    step="0.01"
                    autoComplete="off"
                    placeholder={budgetLimits[key] ? `Current: £${Number(budgetLimits[key]).toFixed(2)}` : "£0.00"}
                    value={inputAmounts[key] || ""}
                    onChange={(event) => handleAmountChange(category.id, event.target.value)}
                    onKeyDown={(event) => event.key === "Enter" && saveBudget(category.id)}
                  />
                  <button onClick={() => saveBudget(category.id)}>{budgetLimits[key] ? "Update" : "Save"}</button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {savedBudgets.length > 0 && (
        <div className="card">
          <h3>{view === "weekly" ? `Weekly Budget Progress - ${periodLabel}` : `Budget Progress - ${periodLabel}`}</h3>

          {savedBudgets.map((budget) => {
            const spent = spending[budget.category_id] || 0;
            const percent = Math.min((spent / budget.limit_amount) * 100, 100);
            const status = getBudgetStatus(spent, Number(budget.limit_amount));
            const color = status.tone === "red" ? "var(--color-error)" : status.tone === "amber" ? "var(--color-warning)" : "var(--color-success)";

            return (
              <div key={budget.id} className="budget-item">
                <div className="budget-header">
                  <div className="budget-name-row">
                    <span className={`status-dot ${status.tone}`} aria-hidden="true" />
                    <span className="budget-name">{budget.categories?.name || "Uncategorised"}</span>
                    <span className="status-label">{status.label}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span className="budget-amount">
                      £{spent.toFixed(2)} / £{Number(budget.limit_amount).toFixed(2)}
                    </span>
                    <button className="delete-btn" onClick={() => deleteBudget(budget.id)} title="Remove budget" aria-label="Remove budget">
                      <CloseRoundedIcon fontSize="small" />
                    </button>
                  </div>
                </div>
                <div className="bar">
                  <div className="fill" style={{ width: `${percent}%`, background: color }} />
                </div>
                <div className="budget-footer">
                  <span style={{ color, fontSize: 13 }}>{percent.toFixed(0)}% used</span>
                  {spent > budget.limit_amount && <span className="over-text">Over by £{(spent - budget.limit_amount).toFixed(2)}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="card">
        <h3>Manage Categories</h3>
        <p style={{ color: "var(--color-secondary)", fontSize: 13, marginTop: 0 }}>
          Add or remove the categories used for budgets and transactions.
        </p>
        <CategoriesList refresh={fetchCategories} />
      </div>
    </div>
  );
}
