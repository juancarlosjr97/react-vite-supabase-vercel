import { useEffect, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import supabase from "../utils/supabase";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function AddExpense({ compact }) {
  const navigate = useNavigate();

export default function AddExpense({ compact, onRefresh }) {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data, error } = await supabase.from("categories").select("*");
    if (error) {
      console.error("Error fetching categories:", error);
    } else {
      setCategories(data || []);
    }
  };

  const formik = useFormik({
    initialValues: {
      amount: "",
      description: "",
      date: new Date().toISOString().slice(0, 10),
      categoryId: "",
    },
    validationSchema,
    onSubmit: async (values, { resetForm }) => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;

      if (!user) {
        toast.error("Not logged in");
        return;
      }

    // Basic validation
    if (!amount) {
      alert("Please enter an amount");
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

    if (error) {
      console.error(error);
      alert("Error adding expense");
    } else {
      alert("Expense added!");

      // reset form
      setAmount("");
      setDescription("");
      setCategoryId("");

      // UX improvement
      navigate("/");
    }
  };

  if (compact) {
    return (
      <div className="expense-form">
        <input
          type="number"
          placeholder="Amount (£)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <input
          type="text"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        >
          <option value="">Category</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        <button onClick={handleSubmit}>Add</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
      <div className="card">
        <h3>Add Expense</h3>
        <div className="expense-form">
          <input
            type="number"
            placeholder="Amount (£)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <input
            type="text"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">Category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <button onClick={handleSubmit}>Add Expense</button>
        </div>
      </div>
    </div>
  );
}
