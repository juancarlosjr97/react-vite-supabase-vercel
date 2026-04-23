import { useEffect, useState } from "react";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { useAuth } from "../hooks/useAuth";
import supabase from "../utils/supabase";
import toast from "react-hot-toast";

export default function QuickAddModal({ onClose }) {
  const { user } = useAuth();
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState("");

  useEffect(() => {
    const fetchCats = async () => {
      const { data } = await supabase.from("categories").select("*");
      setCategories(data || []);
    };
    fetchCats();

    const onKey = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

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
      toast.error("Error adding expense");
    } else {
      toast.success("Expense added!");
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>Add Expense</h3>
          <button className="delete-btn" onClick={onClose} aria-label="Close add expense modal">
            <CloseRoundedIcon fontSize="small" />
          </button>
        </div>

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
            autoFocus
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
    </div>
  );
}
