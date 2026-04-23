import { useEffect, useState } from "react";
import supabase from "../utils/supabase";
import { getCategoryMeta } from "../utils/categoryIcons";
import toast from "react-hot-toast";

export default function TransactionsList({ transactions = [], onRefresh }) {
  const [categories, setCategories] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ amount: "", description: "", categoryId: "" });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data } = await supabase.from("categories").select("*");
    setCategories(data || []);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this transaction?")) return;

    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (error) {
      toast.error("Error deleting transaction");
    } else {
      toast.success("Transaction deleted");
      onRefresh();
    }
  };

  const handleEditClick = (t) => {
    setEditingId(t.id);
    setEditForm({
      amount: t.amount,
      description: t.description || "",
      categoryId: t.category_id || "",
    });
  };

  const handleEditSave = async (id) => {
    if (!editForm.amount) {
      toast.error("Please enter an amount");
      return;
    }

    const { error } = await supabase
      .from("transactions")
      .update({
        amount: Number(editForm.amount),
        description: editForm.description,
        category_id: editForm.categoryId || null,
      })
      .eq("id", id);

    if (error) {
      toast.error("Error updating transaction");
    } else {
      toast.success("Transaction updated");
      setEditingId(null);
      onRefresh();
    }
  };

  if (transactions.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '30px 20px', backgroundColor: 'var(--bg-main)', borderRadius: '12px', border: '1px dashed var(--border-color)', marginTop: '10px' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px', margin: 0 }}>No transactions found for this period.</p>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '6px' }}>Add a new expense to get started!</p>
      </div>
    );
  }

  return (
    <div>
      {transactions.map((t) =>
        editingId === t.id ? (
          <div key={t.id} className="transaction transaction-editing">
            <div className="expense-form" style={{ flex: 1, gap: "8px" }}>
              <input
                type="number"
                placeholder="Amount (£)"
                value={editForm.amount}
                onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
              />
              <input
                type="text"
                placeholder="Description"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              />
              <select
                value={editForm.categoryId}
                onChange={(e) => setEditForm({ ...editForm, categoryId: e.target.value })}
              >
                <option value="">No category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <div className="tx-actions">
                <button className="btn-save" onClick={() => handleEditSave(t.id)}>
                  Save
                </button>
                <button className="btn-cancel" onClick={() => setEditingId(null)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div key={t.id} className="transaction">
            <div className="tx-left">
              <div className="tx-icon-wrapper" style={{ backgroundColor: 'var(--bg-card)', padding: '10px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-card)' }}>
                {(() => {
                  const { icon: Icon, color } = getCategoryMeta(t.categories?.name || "");
                  return <Icon style={{ fontSize: 24, color, flexShrink: 0 }} />;
                })()}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <strong style={{ color: 'var(--text-primary)', fontSize: '15px' }}>{t.description || t.categories?.name || "Transaction"}</strong>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {t.categories?.name || "No category"} • {t.transaction_date ? new Date(t.transaction_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : "No date"}
                </span>
              </div>
            </div>
            <div className="tx-right" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
              <span className="tx-amount" style={{ color: Number(t.amount) < 0 || t.categories?.name === 'Income' ? 'var(--color-success)' : 'var(--color-danger)', fontSize: '16px' }}>
                {Number(t.amount) < 0 || t.categories?.name === 'Income' ? '+' : '-'}£{Math.abs(Number(t.amount)).toFixed(2)}
              </span>
              <div className="tx-actions">
                <button className="btn-edit" onClick={() => handleEditClick(t)}>
                  Edit
                </button>
                <button className="btn-delete" onClick={() => handleDelete(t.id)}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}
