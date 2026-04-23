import { useEffect, useState } from "react";
import { getTransactions, getBudgets } from "../lib/api";
import BudgetForm from "./BudgetForm";
import AddExpense from "../pages/AddExpense";
import CategoriesList from "./CategoriesList";
import TransactionsList from "./TransactionsList";

import {
  PieChart,
  Pie,
  Cell,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { getCategoryMeta } from "../utils/categoryIcons";

const renderChartLegend = ({ payload }) => (
  <div className="chart-legend">
    {payload.map((entry, i) => {
      const { icon: Icon, color } = getCategoryMeta(entry.value);
      return (
        <div key={i} className="chart-legend-item">
          <Icon style={{ fontSize: 14, color }} />
          <span>{entry.value}</span>
        </div>
      );
    })}
  </div>
);

export default function Dashboard() {

  // STATE
  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);
  const [chartData, setChartData] = useState([]);
  const [budgetData, setBudgetData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedMonth, setSelectedMonth] = useState(
    new Date().getMonth()
  );

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const [insights, setInsights] = useState({
    highestCategory: null,
    highestAmount: 0,
    monthComparison: null,
  });

  const [trendData, setTrendData] = useState([]);

  // ✅ FIX: fetch data when month changes
  useEffect(() => {
    fetchData();
  }, [selectedMonth]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [allTransactions, rawBudgets] = await Promise.all([
        getTransactions(),
        getBudgets(),
      ]);

      // ── Filter to selected month ──────────────────────────────────────────
      const filtered = allTransactions.filter((t) => {
        if (!t.transaction_date) return true;
        return new Date(t.transaction_date).getMonth() === selectedMonth;
      });

      setTransactions(filtered);

      const totalAmount = filtered.reduce((sum, t) => sum + Number(t.amount), 0);
      setTotal(totalAmount);

      // ── Category grouping for chart ───────────────────────────────────────
      const grouped = {};
      filtered.forEach((t) => {
        const cat = t.categories?.name || "Other";
        grouped[cat] = (grouped[cat] || 0) + Number(t.amount);
      });

      const chartArray = Object.entries(grouped).map(([name, value]) => ({ name, value }));
      setChartData(chartArray);

      // ── Smart insights ────────────────────────────────────────────────────
      const prevMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
      const prevMonthTotal = allTransactions
        .filter((t) => t.transaction_date && new Date(t.transaction_date).getMonth() === prevMonth)
        .reduce((sum, t) => sum + Number(t.amount), 0);

      let highestCat = null;
      let highestAmt = 0;
      chartArray.forEach((c) => {
        if (c.value > highestAmt) { highestAmt = c.value; highestCat = c.name; }
      });

      let monthComparisonStr;
      if (totalAmount > prevMonthTotal && prevMonthTotal > 0) {
        monthComparisonStr = `You spent £${(totalAmount - prevMonthTotal).toFixed(2)} more this month than last month.`;
      } else if (totalAmount < prevMonthTotal && prevMonthTotal > 0) {
        monthComparisonStr = `Great job! You spent £${(prevMonthTotal - totalAmount).toFixed(2)} less this month.`;
      } else if (prevMonthTotal === 0 && totalAmount > 0) {
        monthComparisonStr = `This is your first month tracking or no data last month.`;
      } else if (totalAmount === 0) {
        monthComparisonStr = `No spending recorded yet this month.`;
      } else {
        monthComparisonStr = `Spending is exactly the same as last month.`;
      }

      setInsights({ highestCategory: highestCat, highestAmount: highestAmt, monthComparison: monthComparisonStr });

      // ── Yearly trend ──────────────────────────────────────────────────────
      const currentYear = new Date().getFullYear();
      const monthlyTotals = new Array(12).fill(0);
      allTransactions
        .filter((t) => t.transaction_date && new Date(t.transaction_date).getFullYear() === currentYear)
        .forEach((t) => {
          monthlyTotals[new Date(t.transaction_date).getMonth()] += Number(t.amount);
        });

      setTrendData(months.map((m, i) => ({ month: m, spent: monthlyTotals[i] })));

      // ── Budget progress ───────────────────────────────────────────────────
      const seenCategories = new Set();
      const uniqueBudgets = rawBudgets.filter((b) => {
        if (!b.categories) return false;
        if (seenCategories.has(b.categories.name)) return false;
        seenCategories.add(b.categories.name);
        return true;
      });

      setBudgetData(
        uniqueBudgets.map((b) => ({
          name: b.categories.name,
          limit: b.limit_amount,
          spent: chartArray.find((c) => c.name === b.categories.name)?.value || 0,
        }))
      );
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
      setError("Failed to load data. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  const overBudgetCount = budgetData.filter(
    (b) => b.spent > b.limit
  ).length;

  if (error) {
    return (
      <div className="dashboard">
        <div className="data-error">
          <p>{error}</p>
          <button onClick={fetchData}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">

      {loading && (
        <div className="loading-overlay">
          <div className="spinner" />
        </div>
      )}

      {/* HEADER */}
      <div className="header">
        <div className="header-center">
            <h1>Personal Finance Manager</h1>
            <p>Track your spending</p>
        </div>
    </div>

      {/* MONTHS */}
      <div className="months">
        {months.map((m, i) => (
          <button
            key={i}
            className={selectedMonth === i ? "active" : ""}
            onClick={() => setSelectedMonth(i)}
          >
            {m}
          </button>
        ))}
      </div>

      {/* TOP SUMMARY ROW */}
      <div className="top-summary" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', gridColumn: '1 / -1' }}>
        {/* TOTAL */}
        <div className="card total-card">
          <h3>Total Spending</h3>
          <h1>£{total.toFixed(2)}</h1>
          <p>{transactions.length} transactions</p>

          {overBudgetCount > 0 && (
            <div className="alert">
              🚨 {overBudgetCount} categories over budget
            </div>
          )}
        </div>

        {/* INSIGHTS */}
        <div className="card insights-card">
          <h3>Smart Insights</h3>
          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ padding: '12px', background: 'var(--bg-main)', borderRadius: '8px', borderLeft: '4px solid var(--color-primary)' }}>
              <strong style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Top Expense</strong>
              <span style={{ color: 'var(--text-primary)', fontSize: '15px' }}>
                {insights.highestCategory ? `Most spent on ${insights.highestCategory} (£${insights.highestAmount.toFixed(2)})` : "No expenses yet"}
              </span>
            </div>
            
            <div style={{ padding: '12px', background: 'var(--bg-main)', borderRadius: '8px', borderLeft: '4px solid var(--color-secondary)' }}>
              <strong style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Monthly Comparison</strong>
              <span style={{ color: 'var(--text-primary)', fontSize: '15px' }}>
                {insights.monthComparison}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ADD EXPENSE */}
      <div className="card add-expense-card">
        <h3>Add Expense</h3>
        <AddExpense compact onRefresh={fetchData} />
      </div>

      {/* CATEGORIES */}
      <div className="card category-card">
        <h3>Categories</h3>
        <CategoriesList compact />
      </div>

      {/* CHARTS CONTAINER */}
      <div className="charts-wrapper" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {/* PIE CHART */}
        <div className="card">
          <h3>Spending by Category</h3>

          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={90}
                  label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                  isAnimationActive={true}
                  animationBegin={150}
                  animationDuration={700}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={index} fill={getCategoryMeta(entry.name).color} />
                  ))}
                </Pie>
                <Legend content={renderChartLegend} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* TREND CHART */}
        <div className="card">
          <h3>Monthly Trend</h3>
          
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} tickFormatter={(val) => `£${val}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--text-primary)' }}
                  formatter={(value) => [`£${value}`, 'Spent']}
                />
                <Line 
                  type="monotone" 
                  dataKey="spent" 
                  stroke="var(--color-primary)" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: 'var(--bg-card)', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: 'var(--color-primary)', strokeWidth: 0 }}
                  isAnimationActive={true}
                  animationBegin={150}
                  animationDuration={700}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* BUDGET FORM */}
      <BudgetForm />

      {/* BUDGET */}
      <div className="card">
        <h3>Budget Progress</h3>

        {budgetData.map((b, i) => {
          const percent = Math.min((b.spent / b.limit) * 100, 100);
          const { icon: BudgetIcon, color: catColor } = getCategoryMeta(b.name);

          // Status colour for the bar fill and footer text
          let statusColor = catColor;
          if (percent >= 70) statusColor = "#f59e0b";
          if (percent >= 100) statusColor = "#ef4444";

          return (
            <div
              key={i}
              className="budget-item"
              style={{ borderLeft: `3px solid ${catColor}`, paddingLeft: "12px" }}
            >
              <div className="budget-header">
                <span className="budget-name" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <BudgetIcon style={{ fontSize: 16, color: catColor, flexShrink: 0 }} />
                  {b.name}
                </span>
                <span className="budget-amount">
                  £{b.spent.toFixed(2)} / £{b.limit.toFixed(2)}
                </span>
              </div>

              <div className="bar">
                <div
                  className="fill"
                  style={{ width: `${percent}%`, background: statusColor }}
                />
              </div>

              <div className="budget-footer">
                <span style={{ color: statusColor }}>
                  {percent.toFixed(0)}% used
                </span>
                {b.spent > b.limit && (
                  <span className="over-text">
                    Over by £{(b.spent - b.limit).toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* TRANSACTIONS */}
      <div className="card">
        <h3>Transactions</h3>
        <TransactionsList transactions={transactions} onRefresh={fetchData} />
      </div>

    </div>
  );
}