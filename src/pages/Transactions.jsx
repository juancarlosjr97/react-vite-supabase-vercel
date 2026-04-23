import { useEffect, useState } from "react";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { useAuth } from "../hooks/useAuth";
import supabase from "../utils/supabase";
import toast from "react-hot-toast";
import { PageSkeleton } from "../components/Skeleton";

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

export default function Transactions() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [allData, setAllData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [view, setView] = useState("monthly");
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [weekOffset, setWeekOffset] = useState(0);

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");

  useEffect(() => {
    if (user) {
      fetchAll();
      fetchCategories();
    }
  }, [user]);

  const fetchAll = async () => {
    const { data } = await supabase
      .from("transactions")
      .select("id, amount, description, transaction_date, created_at, categories(name)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setAllData(data || []);
    setLoading(false);
  };

  const fetchCategories = async () => {
    const { data } = await supabase.from("categories").select("*");
    setCategories(data || []);
  };

  const weekBounds = getWeekBounds(weekOffset);

  const filteredTransactions = (() => {
    if (view === "weekly") {
      return allData.filter((transaction) => {
        const date = new Date(transaction.transaction_date || transaction.created_at);
        return date >= weekBounds.start && date <= weekBounds.end;
      });
    }

    const start = new Date(`${month}-01`);
    return allData.filter((transaction) => {
      const date = new Date(transaction.transaction_date || transaction.created_at);
      return date.getFullYear() === start.getFullYear() && date.getMonth() === start.getMonth();
    });
  })();

  const handleAdd = async () => {
    const parsedAmount = Number(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }
    if (parsedAmount > 1_000_000) {
      toast.error("Amount is too large");
      return;
    }
    if (description.length > 100) {
      toast.error("Description must be 100 characters or fewer");
      return;
    }

    const { error } = await supabase.from("transactions").insert([
      {
        user_id: user.id,
        amount: parsedAmount,
        description: description.trim(),
        category_id: categoryId || null,
        transaction_date: new Date(),
      },
    ]);

    if (error) {
      toast.error("Error adding transaction");
    } else {
      toast.success("Expense added!");
      setAmount("");
      setDescription("");
      setCategoryId("");
      fetchAll();
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this transaction?")) return;
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (!error) {
      toast.success("Deleted");
      fetchAll();
    }
  };

  if (loading) return <PageSkeleton />;

  const total = filteredTransactions.reduce((sum, transaction) => sum + Number(transaction.amount), 0);
  const avg = filteredTransactions.length > 0 ? total / filteredTransactions.length : 0;
  const weekLabel = `${fmtDate(weekBounds.start)} - ${fmtDate(weekBounds.end)}, ${weekBounds.start.getFullYear()}`;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h2>Transactions</h2>
          <p className="page-subtitle">Add and manage your expenses</p>
        </div>

        <div className="view-toggle">
          <button className={`view-btn ${view === "monthly" ? "active" : ""}`} onClick={() => setView("monthly")}>
            Monthly
          </button>
          <button className={`view-btn ${view === "weekly" ? "active" : ""}`} onClick={() => setView("weekly")}>
            Weekly
          </button>
        </div>
      </div>

      {view === "monthly" ? (
        <input type="month" value={month} onChange={(event) => setMonth(event.target.value)} style={{ alignSelf: "flex-start" }} />
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

      <div className="card">
        <h3>Add Expense</h3>
        <div className="expense-form">
          <input
            type="number"
            placeholder="Amount (£)"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(event) => {
              if (Number(event.target.value) < 0) return;
              setAmount(event.target.value);
            }}
            onKeyDown={(event) => event.key === "Enter" && handleAdd()}
          />
          <div className="input-with-counter">
            <input
              type="text"
              placeholder="Description (optional)"
              maxLength={100}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && handleAdd()}
            />
            {description.length > 0 && (
              <span className={`char-counter ${description.length > 90 ? "warn" : ""}`}>
                {description.length}/100
              </span>
            )}
          </div>
          <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
            <option value="">No category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <button onClick={handleAdd}>Add Expense</button>
        </div>
      </div>

      {filteredTransactions.length > 0 && (
        <div className="card total-card">
          <div className="summary-row">
            <div>
              <p className="summary-label">Total Spent</p>
              <h2 className="summary-value">£{total.toFixed(2)}</h2>
            </div>
            <div>
              <p className="summary-label">Transactions</p>
              <h2 className="summary-value">{filteredTransactions.length}</h2>
            </div>
            <div>
              <p className="summary-label">Average</p>
              <h2 className="summary-value">£{avg.toFixed(2)}</h2>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <h3>{view === "weekly" ? `Transactions - Week of ${weekLabel}` : `Transaction History - ${month}`}</h3>

        {filteredTransactions.length === 0 ? (
          <p style={{ color: "var(--color-secondary)" }}>No transactions for this period. Add one above.</p>
        ) : (
          filteredTransactions.map((transaction) => (
            <div key={transaction.id} className="transaction transaction-deletable">
              <div className="transaction-info">
                <strong>{transaction.description || "No description"}</strong>
                <p>
                  {transaction.categories?.name || "Uncategorised"}
                  {" · "}
                  {new Date(transaction.transaction_date || transaction.created_at).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div className="transaction-right">
                <span className="transaction-amount">£{Number(transaction.amount).toFixed(2)}</span>
                <button className="delete-btn" onClick={() => handleDelete(transaction.id)} title="Delete" aria-label="Delete transaction">
                  <CloseRoundedIcon fontSize="small" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
