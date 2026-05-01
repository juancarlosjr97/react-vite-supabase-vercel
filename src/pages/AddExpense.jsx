import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import supabase from "../utils/supabase";

export default function AddExpense({ compact = false, onRefresh }) {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");

  const fetchCategories = useCallback(async () => {
    const { data, error } = await supabase.from("categories").select("*");

    if (error) {
      toast.error("Could not load categories");
      return;
    }

    setCategories(data || []);
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleSubmit = async () => {
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

    const {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user;

    if (!user) {
      toast.error("Not logged in");
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
      return;
    }

    toast.success("Expense added!");
    setAmount("");
    setDescription("");
    setCategoryId("");
    onRefresh?.();

    if (!compact) {
      navigate("/transactions");
    }
  };

  const form = (
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
        onKeyDown={(event) => event.key === "Enter" && handleSubmit()}
      />
      <input
        type="text"
        placeholder="Description"
        maxLength={100}
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        onKeyDown={(event) => event.key === "Enter" && handleSubmit()}
      />
      <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
        <option value="">No category</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>
      <button onClick={handleSubmit}>{compact ? "Add" : "Add Expense"}</button>
    </div>
  );

  if (compact) return form;

  return (
    <div className="page-container">
      <div className="card">
        <h3>Add Expense</h3>
        {form}
      </div>
    </div>
  );
}
