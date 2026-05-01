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
import { formatDeviceDate, formatLocalMonthInput, parseLocalDateInput, parseLocalMonthInput, parseStoredDate } from "../utils/date";

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

const fmtDate = (date) => formatDeviceDate(date, { day: "numeric", month: "short" });

const getTransactionDate = (transaction) =>
  parseStoredDate(transaction.transaction_date || transaction.created_at);

const buildPieData = (txList) => {
  const cats = txList.reduce((acc, t) => {
    const cat = t.categories?.name || "Other";
    acc[cat] = (acc[cat] || 0) + Number(t.amount);
    return acc;
  }, {});
  return Object.entries(cats)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));
};

export default function Reports() {
  const { user } = useAuth();

  const [view, setView] = useState("all");
  const [month, setMonth] = useState(formatLocalMonthInput());
  const [weekOffset, setWeekOffset] = useState(0);
  const [rangeFrom, setRangeFrom] = useState("");
  const [rangeTo, setRangeTo] = useState("");
  const [selectedBarMonth, setSelectedBarMonth] = useState(null);

  const [allData, setAllData] = useState([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("transactions")
      .select("*, categories(name)")
      .eq("user_id", user.id)
      .then(({ data }) => setAllData(data || []));
  }, [user]);

  const handleViewChange = (newView) => {
    setView(newView);
    setSelectedBarMonth(null);
  };

  // Derive transactions for current view/filter
  const transactions = (() => {
    if (view === "all") {
      if (selectedBarMonth !== null) {
        const year = new Date().getFullYear();
        return allData.filter((t) => {
          const d = getTransactionDate(t);
          return d.getFullYear() === year && d.getMonth() === selectedBarMonth;
        });
      }
      return allData;
    }
    if (view === "weekly") {
      const bounds = getWeekBounds(weekOffset);
      return allData.filter((t) => {
        const d = getTransactionDate(t);
        return d >= bounds.start && d <= bounds.end;
      });
    }
    if (view === "custom") {
      if (!rangeFrom || !rangeTo) return [];
      const start = parseLocalDateInput(rangeFrom);
      start.setHours(0, 0, 0, 0);
      const end = parseLocalDateInput(rangeTo);
      end.setHours(23, 59, 59, 999);
      return allData.filter((t) => {
        const d = getTransactionDate(t);
        return d >= start && d <= end;
      });
    }
    // monthly
    const start = parseLocalMonthInput(month);
    return allData.filter((t) => {
      const d = getTransactionDate(t);
      return d.getFullYear() === start.getFullYear() && d.getMonth() === start.getMonth();
    });
  })();


  // Year used for the bar chart
  const chartYear =
    view === "monthly" ? parseInt(month.split("-")[0]) : new Date().getFullYear();
  const yearData = allData.filter(
    (t) => getTransactionDate(t).getFullYear() === chartYear
  );

  // Bar chart data
  const currentMonthIndex = parseInt(month.split("-")[1], 10) - 1;
  const barData = MONTH_NAMES.map((name, index) => ({
    name,
    total: yearData
      .filter((t) => getTransactionDate(t).getMonth() === index)
      .reduce((sum, t) => sum + Number(t.amount), 0),
    isSelected:
      view === "monthly"
        ? index === currentMonthIndex
        : index === selectedBarMonth,
    monthIndex: index,
  }));

  const handleBarClick = (data) => {
    if (!data) return;
    const idx = data.activePayload?.[0]?.payload?.monthIndex;
    if (idx === undefined) return;
    if (view === "monthly") {
      const [y] = month.split("-");
      setMonth(`${y}-${String(idx + 1).padStart(2, "0")}`);
    } else {
      setSelectedBarMonth((prev) => (prev === idx ? null : idx));
    }
  };

  // Pie data for the selected bar month (all/weekly bar drilldown)
  const barMonthPieData =
    selectedBarMonth !== null
      ? buildPieData(
          yearData.filter((t) => getTransactionDate(t).getMonth() === selectedBarMonth)
        )
      : null;

  const total = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
  const avg = transactions.length > 0 ? total / transactions.length : 0;

  const pieData = buildPieData(transactions);
  const topCategory = pieData[0];

  const weekBounds = getWeekBounds(weekOffset);
  const weekLabel = `${fmtDate(weekBounds.start)} - ${fmtDate(weekBounds.end)}, ${weekBounds.start.getFullYear()}`;

  const exportCSV = () => {
    if (transactions.length === 0) return;
    const headers = ["Date", "Category", "Description", "Amount (£)"];
    const rows = transactions.map((t) => [
      formatDeviceDate(getTransactionDate(t)),
      t.categories?.name || "N/A",
      `"${(t.description || "-").replace(/"/g, '""')}"`,
      Number(t.amount).toFixed(2),
    ]);
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `finance-report-${view === "monthly" ? month : view}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    if (transactions.length === 0) return;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;
    const checkY = (height = 10) => {
      if (y + height > 275) { doc.addPage(); y = 20; }
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
    const periodLabel =
      view === "weekly"
        ? `Week of ${weekLabel}`
        : view === "custom"
        ? `${rangeFrom} to ${rangeTo}`
        : view === "all"
        ? selectedBarMonth !== null
          ? `${MONTH_NAMES[selectedBarMonth]} ${chartYear}`
          : "All Time"
        : month;
    doc.text(
      `Period: ${periodLabel}   |   Generated: ${formatDeviceDate(new Date())}`,
      pageWidth / 2, y, { align: "center" }
    );

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

    let alt = false;
    pieData.forEach(({ name, value }) => {
      checkY(8);
      if (alt) { doc.setFillColor(241, 234, 220); doc.rect(14, y, pageWidth - 28, 7, "F"); }
      doc.setTextColor(24, 21, 18);
      doc.setFontSize(9);
      doc.text(name, 18, y + 5);
      doc.text(`£${value.toFixed(2)}`, 120, y + 5);
      doc.text(`${((value / total) * 100).toFixed(1)}%`, 155, y + 5);
      y += 7;
      alt = !alt;
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
    alt = false;

    transactions.forEach((t) => {
      checkY(8);
      if (alt) { doc.setFillColor(241, 234, 220); doc.rect(14, y, pageWidth - 28, 7, "F"); }
      doc.setTextColor(24, 21, 18);
      doc.setFontSize(8);
      doc.text(formatDeviceDate(getTransactionDate(t)), 18, y + 5);
      doc.text(t.categories?.name || "N/A", 52, y + 5);
      doc.text((t.description || "-").substring(0, 35), 100, y + 5);
      doc.text(`£${Number(t.amount).toFixed(2)}`, 168, y + 5);
      y += 7;
      alt = !alt;
    });

    const pages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(109, 98, 87);
      doc.text(`Page ${i} of ${pages}  |  Personal Finance App`, pageWidth / 2, 290, { align: "center" });
    }
    doc.save(`finance-report-${view === "monthly" ? month : view}.pdf`);
  };

  const pieTooltipStyle = {
    contentStyle: { background: "#fbf5ea", border: "1px solid rgba(33, 27, 23, 0.16)", borderRadius: 14 },
    labelStyle: { color: "#181512" },
  };

  const renderPie = (data, inner = false) => (
    <ResponsiveContainer width="100%" aspect={1.4}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={inner ? 60 : 0}
          outerRadius={inner ? 100 : undefined}
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
        >
          {data.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => `£${Number(value).toFixed(2)}`} {...pieTooltipStyle} />
        {inner && <Legend />}
      </PieChart>
    </ResponsiveContainer>
  );

  const barChart = (
    <ResponsiveContainer width="100%" aspect={1.6}>
      <BarChart
        data={barData}
        margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
        onClick={handleBarClick}
        style={{ cursor: "pointer" }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(33, 27, 23, 0.16)" />
        <XAxis dataKey="name" stroke="#6d6257" tick={{ fill: "#6d6257", fontSize: 11 }} />
        <YAxis stroke="#6d6257" tick={{ fill: "#6d6257", fontSize: 11 }} />
        <Tooltip
          formatter={(value) => `£${Number(value).toFixed(2)}`}
          {...pieTooltipStyle}
        />
        <Bar dataKey="total" radius={[4, 4, 0, 0]}>
          {barData.map((entry, index) => (
            <Cell
              key={index}
              fill={entry.isSelected ? "#2d5b53" : "#b25539"}
              opacity={entry.total === 0 ? 0.25 : 1}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );

  return (
    <div className="reports-container">
      <div className="reports-header">
        <h2>Reports</h2>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <div className="view-toggle">
            <button className={`view-btn ${view === "all" ? "active" : ""}`} onClick={() => handleViewChange("all")}>
              All
            </button>
            <button className={`view-btn ${view === "monthly" ? "active" : ""}`} onClick={() => handleViewChange("monthly")}>
              Monthly
            </button>
            <button className={`view-btn ${view === "weekly" ? "active" : ""}`} onClick={() => handleViewChange("weekly")}>
              Weekly
            </button>
            <button className={`view-btn ${view === "custom" ? "active" : ""}`} onClick={() => handleViewChange("custom")}>
              Custom
            </button>
          </div>
          <button className="btn" onClick={exportCSV} disabled={transactions.length === 0}>
            Export CSV
          </button>
          <button
            className="btn"
            onClick={exportPDF}
            disabled={transactions.length === 0}
            style={{ background: "var(--color-accent-deep)", color: "var(--color-surface)" }}
          >
            Export PDF
          </button>
        </div>
      </div>

      {view === "monthly" && (
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
        </div>
      )}

      {view === "weekly" && (
        <div className="week-nav">
          <button className="btn week-nav-btn" onClick={() => setWeekOffset((v) => v - 1)}>
            <ArrowBackRoundedIcon fontSize="small" /> Prev
          </button>
          <span className="week-label">Week of {weekLabel}</span>
          <button className="btn week-nav-btn" onClick={() => setWeekOffset((v) => v + 1)} disabled={weekOffset >= 0}>
            Next <ArrowForwardRoundedIcon fontSize="small" />
          </button>
        </div>
      )}

      {view === "custom" && (
        <div className="custom-range">
          <label>
            From
            <input type="date" value={rangeFrom} onChange={(e) => setRangeFrom(e.target.value)} />
          </label>
          <label>
            To
            <input type="date" value={rangeTo} min={rangeFrom} onChange={(e) => setRangeTo(e.target.value)} />
          </label>
        </div>
      )}

      {view === "all" && selectedBarMonth !== null && (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ color: "var(--color-secondary)", fontSize: 14 }}>
            Showing <strong>{MONTH_NAMES[selectedBarMonth]} {chartYear}</strong>
          </span>
          <button
            className="btn"
            onClick={() => setSelectedBarMonth(null)}
            style={{ fontSize: 12, padding: "4px 12px" }}
          >
            ✕ Clear — show all
          </button>
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
            <h3 className="stat-value" style={{ fontSize: 16 }}>{topCategory.name}</h3>
          </div>
        )}
      </div>

      {/* All / Monthly — bar chart + pie side by side */}
      {(view === "all" || view === "monthly") && (
        <div className="charts-grid">
          <div className="glass chart-card">
            <h3>
              {chartYear} Monthly Spending
              {view === "all" && (
                <span style={{ fontSize: 12, fontWeight: 400, marginLeft: 8, color: "var(--color-secondary)" }}>
                  — click a bar to drill in
                </span>
              )}
            </h3>
            {barChart}
          </div>

          <div className="glass chart-card">
            {view === "monthly" ? (
              <>
                <h3>Category Breakdown — {month}</h3>
                {pieData.length > 0 ? renderPie(pieData) : (
                  <p style={{ color: "var(--color-secondary)", textAlign: "center", padding: "40px 0" }}>No data</p>
                )}
              </>
            ) : barMonthPieData ? (
              <>
                <h3>
                  {MONTH_NAMES[selectedBarMonth]} {chartYear} — Category Breakdown
                </h3>
                {barMonthPieData.length > 0 ? renderPie(barMonthPieData) : (
                  <p style={{ color: "var(--color-secondary)", textAlign: "center", padding: "40px 0" }}>No transactions this month</p>
                )}
              </>
            ) : (
              <>
                <h3>All Time — Category Breakdown</h3>
                {pieData.length > 0 ? renderPie(pieData) : (
                  <p style={{ color: "var(--color-secondary)", textAlign: "center", padding: "40px 0" }}>No data yet</p>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Weekly / Custom — single pie */}
      {(view === "weekly" || view === "custom") && (
        <div className="glass chart-card" style={{ marginTop: 25 }}>
          <h3>
            {view === "weekly"
              ? `Spending Breakdown — Week of ${weekLabel}`
              : `Spending Breakdown — ${rangeFrom} to ${rangeTo}`}
          </h3>
          {pieData.length > 0 ? renderPie(pieData, true) : (
            <p style={{ color: "var(--color-secondary)", textAlign: "center", padding: "40px 0" }}>No transactions for this period.</p>
          )}
        </div>
      )}

      <div
        className="glass table-wrapper"
        style={{ padding: 16, marginTop: 25, overflowX: "auto", WebkitOverflowScrolling: "touch" }}
      >
        <h3 style={{ marginTop: 0 }}>
          Transaction Details
          {view === "all" && selectedBarMonth !== null && (
            <span style={{ fontSize: 13, fontWeight: 400, marginLeft: 8, color: "var(--color-secondary)" }}>
              — {MONTH_NAMES[selectedBarMonth]} {chartYear}
            </span>
          )}
        </h3>
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
              {transactions.map((t) => (
                <tr key={t.id}>
                  <td>{formatDeviceDate(getTransactionDate(t))}</td>
                  <td>{t.categories?.name || "N/A"}</td>
                  <td>{t.description || "—"}</td>
                  <td>£{Number(t.amount).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
