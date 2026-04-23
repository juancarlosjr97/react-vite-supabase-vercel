import { useEffect, useState } from "react";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import { useAuth } from "../hooks/useAuth";
import supabase from "../utils/supabase";
import { jsPDF } from "jspdf";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";

const COLORS = ["#b25539", "#48694f", "#c48a3a", "#2d5b53", "#856149", "#a0412f", "#778e69"];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

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

const fmtDate = (date) =>
  date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });

export default function Reports() {
  const { user } = useAuth();

  const [view, setView] = useState("monthly");
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [weekOffset, setWeekOffset] = useState(0);
  const [rangeFrom, setRangeFrom] = useState("");
  const [rangeTo, setRangeTo] = useState("");
  const [compareMode, setCompareMode] = useState(false);

  const [transactions, setTransactions] = useState([]);
  const [prevTransactions, setPrevTransactions] = useState([]);
  const [yearData, setYearData] = useState([]);

  useEffect(() => {
    if (!user) return;

    const fetchPeriod = async () => {
      let start;
      let end;

      if (view === "weekly") {
        const bounds = getWeekBounds(weekOffset);
        start = bounds.start;
        end = bounds.end;
      } else if (view === "custom") {
        if (!rangeFrom || !rangeTo) {
          setTransactions([]);
          return;
        }
        start = new Date(rangeFrom);
        start.setHours(0, 0, 0, 0);
        end = new Date(rangeTo);
        end.setHours(23, 59, 59, 999);
      } else {
        start = new Date(`${month}-01`);
        end = new Date(start);
        end.setMonth(end.getMonth() + 1);
      }

      const { data } = await supabase
        .from("transactions")
        .select("*, categories(name)")
        .eq("user_id", user.id)
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString());

      setTransactions(data || []);
    };

    fetchPeriod();
  }, [user, view, month, weekOffset, rangeFrom, rangeTo]);

  useEffect(() => {
    if (!user || !compareMode) {
      setPrevTransactions([]);
      return;
    }

    const fetchPrev = async () => {
      let start;
      let end;

      if (view === "weekly") {
        const bounds = getWeekBounds(weekOffset - 1);
        start = bounds.start;
        end = bounds.end;
      } else if (view === "monthly") {
        const current = new Date(`${month}-01`);
        start = new Date(current);
        start.setMonth(start.getMonth() - 1);
        end = new Date(current);
      } else {
        setPrevTransactions([]);
        return;
      }

      const { data } = await supabase
        .from("transactions")
        .select("*, categories(name)")
        .eq("user_id", user.id)
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString());

      setPrevTransactions(data || []);
    };

    fetchPrev();
  }, [user, compareMode, view, month, weekOffset]);

  useEffect(() => {
    if (!user) return;

    const year = view === "monthly" ? month.split("-")[0] : new Date().getFullYear();

    const fetchYear = async () => {
      const { data } = await supabase
        .from("transactions")
        .select("amount, created_at")
        .eq("user_id", user.id)
        .gte("created_at", `${year}-01-01`)
        .lte("created_at", `${year}-12-31`);

      setYearData(data || []);
    };

    if (view !== "custom") fetchYear();
  }, [user, view, month]);

  const total = transactions.reduce((sum, transaction) => sum + Number(transaction.amount), 0);
  const avg = transactions.length > 0 ? total / transactions.length : 0;
  const prevTotal = prevTransactions.reduce((sum, transaction) => sum + Number(transaction.amount), 0);

  const categoryTotals = transactions.reduce((accumulator, transaction) => {
    const category = transaction.categories?.name || "Other";
    accumulator[category] = (accumulator[category] || 0) + Number(transaction.amount);
    return accumulator;
  }, {});

  const pieData = Object.entries(categoryTotals)
    .sort((left, right) => right[1] - left[1])
    .map(([name, value]) => ({ name, value }));

  const currentMonthIndex = parseInt(month.split("-")[1], 10) - 1;
  const barData = MONTH_NAMES.map((name, index) => ({
    name,
    total: yearData
      .filter((transaction) => new Date(transaction.created_at).getMonth() === index)
      .reduce((sum, transaction) => sum + Number(transaction.amount), 0),
    isCurrent: index === currentMonthIndex,
  }));

  const topCategory = pieData[0];
  const changeVsPrev = prevTotal > 0 ? (((total - prevTotal) / prevTotal) * 100).toFixed(1) : null;

  const weekBounds = getWeekBounds(weekOffset);
  const weekLabel = `${fmtDate(weekBounds.start)} - ${fmtDate(weekBounds.end)}, ${weekBounds.start.getFullYear()}`;

  const exportCSV = () => {
    if (transactions.length === 0) return;

    const headers = ["Date", "Category", "Description", "Amount (£)"];
    const rows = transactions.map((transaction) => [
      new Date(transaction.created_at).toLocaleDateString(),
      transaction.categories?.name || "N/A",
      `"${(transaction.description || "-").replace(/"/g, '""')}"`,
      Number(transaction.amount).toFixed(2),
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `finance-report-${view === "monthly" ? month : "custom"}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    if (transactions.length === 0) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;
    const checkY = (height = 10) => {
      if (y + height > 275) {
        doc.addPage();
        y = 20;
      }
    };

    doc.setFillColor(178, 85, 57);
    doc.rect(0, 0, pageWidth, 14, "F");
    doc.setTextColor(251, 245, 234);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("Personal Finance Report", pageWidth / 2, 9, { align: "center" });

    y = 24;
    doc.setTextColor(109, 98, 87);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const periodLabel = view === "weekly" ? `Week of ${weekLabel}` : view === "custom" ? `${rangeFrom} to ${rangeTo}` : month;
    doc.text(`Period: ${periodLabel}   |   Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, y, {
      align: "center",
    });

    y += 12;
    doc.setFillColor(230, 215, 193);
    doc.roundedRect(14, y, pageWidth - 28, 28, 3, 3, "F");
    doc.setTextColor(24, 21, 18);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Summary", 20, y + 8);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(109, 98, 87);
    doc.text(`Total Spent: £${total.toFixed(2)}`, 20, y + 17);
    doc.text(`Transactions: ${transactions.length}`, 90, y + 17);
    doc.text(`Avg per transaction: £${avg.toFixed(2)}`, 145, y + 17);

    y += 36;
    checkY(20);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(24, 21, 18);
    doc.text("Spending by Category", 14, y);
    y += 8;
    doc.setFillColor(24, 21, 18);
    doc.rect(14, y, pageWidth - 28, 8, "F");
    doc.setTextColor(251, 245, 234);
    doc.setFontSize(9);
    doc.text("Category", 18, y + 5.5);
    doc.text("Amount", 120, y + 5.5);
    doc.text("% of Total", 155, y + 5.5);
    y += 8;

    let alternateRow = false;
    pieData.forEach(({ name, value }) => {
      checkY(8);
      if (alternateRow) {
        doc.setFillColor(241, 234, 220);
        doc.rect(14, y, pageWidth - 28, 7, "F");
      }
      doc.setTextColor(24, 21, 18);
      doc.setFontSize(9);
      doc.text(name, 18, y + 5);
      doc.text(`£${value.toFixed(2)}`, 120, y + 5);
      doc.text(`${((value / total) * 100).toFixed(1)}%`, 155, y + 5);
      y += 7;
      alternateRow = !alternateRow;
    });

    y += 10;
    checkY(20);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(24, 21, 18);
    doc.text("Transaction Details", 14, y);
    y += 8;
    doc.setFillColor(24, 21, 18);
    doc.rect(14, y, pageWidth - 28, 8, "F");
    doc.setTextColor(251, 245, 234);
    doc.setFontSize(9);
    doc.text("Date", 18, y + 5.5);
    doc.text("Category", 52, y + 5.5);
    doc.text("Description", 100, y + 5.5);
    doc.text("Amount", 168, y + 5.5);
    y += 8;
    alternateRow = false;

    transactions.forEach((transaction) => {
      checkY(8);
      if (alternateRow) {
        doc.setFillColor(241, 234, 220);
        doc.rect(14, y, pageWidth - 28, 7, "F");
      }
      doc.setTextColor(24, 21, 18);
      doc.setFontSize(8);
      doc.text(new Date(transaction.created_at).toLocaleDateString(), 18, y + 5);
      doc.text(transaction.categories?.name || "N/A", 52, y + 5);
      doc.text((transaction.description || "-").substring(0, 35), 100, y + 5);
      doc.text(`£${Number(transaction.amount).toFixed(2)}`, 168, y + 5);
      y += 7;
      alternateRow = !alternateRow;
    });

    const pages = doc.internal.getNumberOfPages();
    for (let index = 1; index <= pages; index += 1) {
      doc.setPage(index);
      doc.setFontSize(8);
      doc.setTextColor(109, 98, 87);
      doc.text(`Page ${index} of ${pages}  |  Personal Finance App`, pageWidth / 2, 290, { align: "center" });
    }

    doc.save(`finance-report-${view === "monthly" ? month : "custom"}.pdf`);
  };

  return (
    <div className="reports-container">
      <div className="reports-header">
        <h2>Reports</h2>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <div className="view-toggle">
            <button className={`view-btn ${view === "monthly" ? "active" : ""}`} onClick={() => setView("monthly")}>
              Monthly
            </button>
            <button className={`view-btn ${view === "weekly" ? "active" : ""}`} onClick={() => setView("weekly")}>
              Weekly
            </button>
            <button className={`view-btn ${view === "custom" ? "active" : ""}`} onClick={() => setView("custom")}>
              Custom
            </button>
          </div>

          <button className="btn" onClick={exportCSV} disabled={transactions.length === 0}>
            Export CSV
          </button>
          <button className="btn" onClick={exportPDF} disabled={transactions.length === 0} style={{ background: "var(--color-accent-deep)", color: "var(--color-surface)" }}>
            Export PDF
          </button>
        </div>
      </div>

      {view === "monthly" && (
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <input type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
          <label className="compare-toggle">
            <input type="checkbox" checked={compareMode} onChange={(event) => setCompareMode(event.target.checked)} />
            Compare with previous month
          </label>
        </div>
      )}

      {view === "weekly" && (
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
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
          <label className="compare-toggle">
            <input type="checkbox" checked={compareMode} onChange={(event) => setCompareMode(event.target.checked)} />
            Compare with previous week
          </label>
        </div>
      )}

      {view === "custom" && (
        <div className="custom-range">
          <label>
            From
            <input type="date" value={rangeFrom} onChange={(event) => setRangeFrom(event.target.value)} />
          </label>
          <label>
            To
            <input type="date" value={rangeTo} min={rangeFrom} onChange={(event) => setRangeTo(event.target.value)} />
          </label>
        </div>
      )}

      {compareMode && prevTotal > 0 && (
        <div className="compare-grid">
          <div className="glass stat-card">
            <p className="stat-label">{view === "weekly" ? "Previous Week" : "Previous Month"}</p>
            <h3 className="stat-value">£{prevTotal.toFixed(2)}</h3>
            <p className="stat-label">{prevTransactions.length} transactions</p>
          </div>
          <div className="glass stat-card compare-arrow">
            <p className="stat-label">Change</p>
            <h3 className="stat-value" style={{ color: Number(changeVsPrev) > 0 ? "#ef4444" : "#22c55e" }}>
              {changeVsPrev !== null ? `${Number(changeVsPrev) > 0 ? "+" : ""}${changeVsPrev}%` : "—"}
            </h3>
            <p className="stat-label">{Number(changeVsPrev) > 0 ? "Spending up" : "Spending down"}</p>
          </div>
          <div className="glass stat-card">
            <p className="stat-label">{view === "weekly" ? "This Week" : "This Month"}</p>
            <h3 className="stat-value">£{total.toFixed(2)}</h3>
            <p className="stat-label">{transactions.length} transactions</p>
          </div>
        </div>
      )}

      <div className="stats-grid">
        <div className="glass stat-card">
          <p className="stat-label">Total Spent</p>
          <h3 className="stat-value">£{total.toFixed(2)}</h3>
        </div>
        <div className="glass stat-card">
          <p className="stat-label">Transactions</p>
          <h3 className="stat-value">{transactions.length}</h3>
        </div>
        <div className="glass stat-card">
          <p className="stat-label">Avg per Transaction</p>
          <h3 className="stat-value">£{avg.toFixed(2)}</h3>
        </div>
        {topCategory && (
          <div className="glass stat-card">
            <p className="stat-label">Top Category</p>
            <h3 className="stat-value" style={{ fontSize: 16 }}>
              {topCategory.name}
            </h3>
          </div>
        )}
      </div>

      {view === "monthly" ? (
        <div className="charts-grid">
          <div className="glass chart-card">
            <h3>{month.split("-")[0]} Monthly Spending</h3>
            <ResponsiveContainer width="100%" aspect={1.6}>
              <BarChart data={barData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(33, 27, 23, 0.16)" />
                <XAxis dataKey="name" stroke="#6d6257" tick={{ fill: "#6d6257", fontSize: 11 }} />
                <YAxis stroke="#6d6257" tick={{ fill: "#6d6257", fontSize: 11 }} />
                <Tooltip
                  formatter={(value) => `£${Number(value).toFixed(2)}`}
                  contentStyle={{ background: "#fbf5ea", border: "1px solid rgba(33, 27, 23, 0.16)", borderRadius: 14 }}
                  labelStyle={{ color: "#181512" }}
                />
                <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                  {barData.map((entry, index) => (
                    <Cell key={index} fill={entry.isCurrent ? "#2d5b53" : "#b25539"} opacity={entry.total === 0 ? 0.25 : 1} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="glass chart-card">
            <h3>Category Breakdown - {month}</h3>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" aspect={1.4}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {pieData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => `£${Number(value).toFixed(2)}`}
                    contentStyle={{ background: "#fbf5ea", border: "1px solid rgba(33, 27, 23, 0.16)", borderRadius: 14 }}
                    labelStyle={{ color: "#181512" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p style={{ color: "var(--color-secondary)", textAlign: "center", padding: "40px 0" }}>No data</p>
            )}
          </div>
        </div>
      ) : (
        <div className="glass chart-card" style={{ marginTop: 25 }}>
          <h3>{view === "weekly" ? `Spending Breakdown - Week of ${weekLabel}` : `Spending Breakdown - ${rangeFrom} to ${rangeTo}`}</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" aspect={1.4}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={100}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => `£${Number(value).toFixed(2)}`}
                  contentStyle={{ background: "#fbf5ea", border: "1px solid rgba(33, 27, 23, 0.16)", borderRadius: 14 }}
                  labelStyle={{ color: "#181512" }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ color: "var(--color-secondary)", textAlign: "center", padding: "40px 0" }}>No transactions for this period.</p>
          )}
        </div>
      )}

      <div className="glass table-wrapper" style={{ padding: 16, marginTop: 25, overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <h3 style={{ marginTop: 0 }}>Transaction Details</h3>
        {transactions.length === 0 ? (
          <p style={{ color: "var(--color-secondary)" }}>No transactions found for this period.</p>
        ) : (
          <table className="table" style={{ minWidth: 480 }}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Description</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td>{new Date(transaction.created_at).toLocaleDateString("en-GB")}</td>
                  <td>{transaction.categories?.name || "N/A"}</td>
                  <td>{transaction.description || "—"}</td>
                  <td>£{Number(transaction.amount).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
