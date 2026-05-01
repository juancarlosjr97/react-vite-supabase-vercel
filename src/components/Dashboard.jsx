import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import CreditCardRoundedIcon from "@mui/icons-material/CreditCardRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import FlagRoundedIcon from "@mui/icons-material/FlagRounded";
import PieChartRoundedIcon from "@mui/icons-material/PieChartRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import { useAuth } from "../hooks/useAuth";
import supabase from "../utils/supabase";
import { fetchMonthlyBudgets } from "../utils/budgetSupport";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { DashboardSkeleton } from "./Skeleton";
import { parseStoredDate } from "../utils/date";

const COLORS = ["#b25539", "#48694f", "#c48a3a", "#2d5b53", "#856149"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const getBudgetStatus = (spent, limit) => {
  if (limit <= 0) return { tone: "green", label: "On track" };
  const ratio = spent / limit;

  if (ratio >= 1) return { tone: "red", label: "Over budget" };
  if (ratio >= 0.75) return { tone: "amber", label: "Close to limit" };
  return { tone: "green", label: "On track" };
};

export default function Dashboard() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [budgetData, setBudgetData] = useState([]);
  const [goals, setGoals] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [monthsCollapsed, setMonthsCollapsed] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");

  const fetchCategories = useCallback(async () => {
    const { data } = await supabase.from("categories").select("*");
    setCategories(data || []);
  }, []);

  const fetchData = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    const year = new Date().getFullYear();
    const { data } = await supabase
      .from("transactions")
      .select("id, amount, description, transaction_date, created_at, categories(name)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    const filtered = (data || []).filter((transaction) => {
      const date = parseStoredDate(transaction.transaction_date || transaction.created_at);
      return date.getFullYear() === year && date.getMonth() === selectedMonth;
    });

    setTransactions(filtered);

    const grouped = {};
    filtered.forEach((transaction) => {
      const category = transaction.categories?.name || "Other";
      grouped[category] = (grouped[category] || 0) + Number(transaction.amount);
    });
    setChartData(Object.entries(grouped).map(([name, value]) => ({ name, value })));

    const { data: budgets } = await fetchMonthlyBudgets(supabase, user.id);

    setBudgetData(
      (budgets || []).map((budget) => {
        const categoryName = budget.categories?.name || "Uncategorised";

        return {
          name: categoryName,
          limit: budget.limit_amount,
          spent: grouped[categoryName] || 0,
        };
      })
    );
    setLoading(false);
  }, [selectedMonth, user]);

  const fetchGoals = useCallback(async () => {
    if (!user) return;

    const { data } = await supabase.from("goals").select("current_amount, target_amount").eq("user_id", user.id);
    setGoals(data || []);
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchData();
      fetchGoals();
    }
  }, [fetchData, fetchGoals, user]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleQuickAdd = async () => {
    if (!amount) {
      alert("Enter an amount");
      return;
    }

    const { error } = await supabase.from("transactions").insert([
      {
        user_id: user.id,
        amount: Number(amount),
        description,
        category_id: categoryId || null,
        transaction_date: new Date(),
      },
    ]);

    if (!error) {
      setAmount("");
      setDescription("");
      setCategoryId("");
      setShowAddForm(false);
      fetchData();
    }
  };

  if (loading) return <DashboardSkeleton />;

  const total = transactions.reduce((sum, transaction) => sum + Number(transaction.amount), 0);
  const overBudget = budgetData.filter((budget) => budget.spent > budget.limit).length;
  const totalSaved = goals.reduce((sum, goal) => sum + Number(goal.current_amount), 0);
  const totalTarget = goals.reduce((sum, goal) => sum + Number(goal.target_amount), 0);

  const userName = user?.user_metadata?.name || user?.user_metadata?.full_name || user?.email?.split("@")[0];

  return (
    <div className="dashboard">
      <div className="header">
        <div>
          <p className="section-kicker">Monthly edition</p>
          <h1 style={{ margin: 0 }}>Welcome back, {userName}.</h1>
          <p className="page-subtitle">A view of spending, budgets, and savings.</p>
        </div>
      </div>

      <div className="months-panel">
        <div className="card-section-header">
          <div>
            <p className="section-kicker">Period</p>
            <h3>{MONTHS[selectedMonth]}</h3>
          </div>
          <button
            className="btn months-toggle"
            type="button"
            onClick={() => setMonthsCollapsed((current) => !current)}
            aria-expanded={!monthsCollapsed}
            aria-controls="dashboard-months"
          >
            {monthsCollapsed ? "Show months" : "Hide months"}
            {monthsCollapsed ? <ExpandMoreRoundedIcon fontSize="small" /> : <ExpandLessRoundedIcon fontSize="small" />}
          </button>
        </div>

        {!monthsCollapsed && (
          <div className="months" id="dashboard-months">
            {MONTHS.map((month, index) => (
              <button key={month} className={selectedMonth === index ? "active" : ""} onClick={() => setSelectedMonth(index)}>
                {month}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="card total-card">
        <p className="section-kicker">Lead figure</p>
        <h3>Total Spending - {MONTHS[selectedMonth]}</h3>
        <h1>£{total.toFixed(2)}</h1>
        <p>{transactions.length} transactions recorded</p>
        {overBudget > 0 && (
          <div className="alert">
            <WarningAmberRoundedIcon fontSize="small" />
            <span>
              {overBudget} {overBudget === 1 ? "category is" : "categories are"} over budget.{" "}
              <Link to="/budgets">Inspect the limits</Link>
            </span>
          </div>
        )}
      </div>

      <div className="card">
        {!showAddForm ? (
          <button className="btn ledger-btn" style={{ width: "100%" }} onClick={() => setShowAddForm(true)}>
            Add a quick expense note
          </button>
        ) : (
          <>
            <div className="quick-add-header">
              <h3>Quick Add Expense</h3>
              <button className="delete-btn" onClick={() => setShowAddForm(false)} aria-label="Close quick add form">
                <CloseRoundedIcon fontSize="small" />
              </button>
            </div>
            <div className="expense-form">
              <input type="number" placeholder="Amount (£)" value={amount} onChange={(event) => setAmount(event.target.value)} />
              <input type="text" placeholder="Description" value={description} onChange={(event) => setDescription(event.target.value)} />
              <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
                <option value="">Category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <button onClick={handleQuickAdd}>Record Expense</button>
            </div>
            <p className="subtle-note">
              Need more context? <Link to="/transactions">Open the full transactions page</Link>
            </p>
          </>
        )}
      </div>

      <div className="nav-cards">
        <Link to="/transactions" className="nav-card">
          <span className="nav-card-icon">
            <CreditCardRoundedIcon />
          </span>
          <div className="nav-card-info">
            <p className="nav-card-label">Transactions</p>
            <h3 className="nav-card-value">{transactions.length} this month</h3>
          </div>
          <span className="nav-card-arrow">
            <ArrowForwardRoundedIcon fontSize="small" />
          </span>
        </Link>

        <Link to="/budgets" className="nav-card">
          <span className="nav-card-icon">
            <PieChartRoundedIcon />
          </span>
          <div className="nav-card-info">
            <p className="nav-card-label">Budgets</p>
            <h3 className="nav-card-value" style={{ color: overBudget > 0 ? "var(--color-error)" : "var(--color-success)" }}>
              {overBudget > 0 ? `${overBudget} over limit` : "Steady"}
            </h3>
          </div>
          <span className="nav-card-arrow">
            <ArrowForwardRoundedIcon fontSize="small" />
          </span>
        </Link>

        <Link to="/reports" className="nav-card">
          <span className="nav-card-icon">
            <TrendingUpRoundedIcon />
          </span>
          <div className="nav-card-info">
            <p className="nav-card-label">Reports</p>
            <h3 className="nav-card-value">Read the larger pattern</h3>
          </div>
          <span className="nav-card-arrow">
            <ArrowForwardRoundedIcon fontSize="small" />
          </span>
        </Link>

        <Link to="/goals" className="nav-card">
          <span className="nav-card-icon">
            <FlagRoundedIcon />
          </span>
          <div className="nav-card-info">
            <p className="nav-card-label">Goals</p>
            <h3 className="nav-card-value">{goals.length > 0 ? `£${totalSaved.toFixed(0)} / £${totalTarget.toFixed(0)}` : "Set your target"}</h3>
          </div>
          <span className="nav-card-arrow">
            <ArrowForwardRoundedIcon fontSize="small" />
          </span>
        </Link>
      </div>

      <div className="dashboard-mid">
        <div className="card">
          <div className="card-section-header">
            <h3>Spending by Category</h3>
            <span className="section-chip">Chart</span>
          </div>
          {chartData.length > 0 ? (
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={56}
                    outerRadius={92}
                    stroke="#f1eadc"
                    strokeWidth={4}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {chartData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => `£${Number(value).toFixed(2)}`}
                    contentStyle={{ background: "#fbf5ea", border: "1px solid rgba(33, 27, 23, 0.18)", borderRadius: 14 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="empty-copy">No transactions this month.</p>
          )}
        </div>

        <div className="card">
          <div className="card-section-header">
            <h3>Budget Snapshot</h3>
            <Link to="/budgets" className="view-all-link">
              Manage →
            </Link>
          </div>

          {budgetData.length === 0 ? (
            <p className="empty-copy">
              No budgets set. <Link to="/budgets">Create your first one</Link>
            </p>
          ) : (
            budgetData.slice(0, 4).map((budget, index) => {
              const percent = Math.min((budget.spent / budget.limit) * 100, 100);
              const status = getBudgetStatus(budget.spent, Number(budget.limit));
              const color = status.tone === "red" ? "#a0412f" : status.tone === "amber" ? "#ad722f" : "#48694f";
              return (
                <div key={index} className="budget-item">
                  <div className="budget-header">
                    <div className="budget-name-row">
                      <span className={`status-dot ${status.tone}`} aria-hidden="true" />
                      <span className="budget-name">{budget.name}</span>
                    </div>
                    <span className="budget-amount">
                      £{budget.spent.toFixed(0)} / £{budget.limit}
                    </span>
                  </div>
                  <div className="bar">
                    <div className="fill" style={{ width: `${percent}%`, background: color }} />
                  </div>
                </div>
              );
            })
          )}

          {budgetData.length > 4 && (
            <p className="subtle-note">
              <Link to="/budgets">+{budgetData.length - 4} more categories</Link>
            </p>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-section-header">
          <h3>Recent Transactions</h3>
          <Link to="/transactions" className="view-all-link">
            View all →
          </Link>
        </div>

        {transactions.length === 0 ? (
          <p className="empty-copy">No transactions this month.</p>
        ) : (
          transactions.slice(0, 5).map((transaction, index) => (
            <div key={index} className="transaction">
              <div>
                <strong>{transaction.description || "No description"}</strong>
                <p>{transaction.categories?.name || "Uncategorised"}</p>
              </div>
              <span className="money">£{Number(transaction.amount).toFixed(2)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
