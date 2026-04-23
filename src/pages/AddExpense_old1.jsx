import { useEffect, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../hooks/useAuth";
import { getCategories, addTransaction } from "../lib/api";

const validationSchema = Yup.object({
  amount: Yup.number()
    .typeError("Amount must be a number")
    .positive("Amount must be greater than 0")
    .required("Amount is required"),
  description: Yup.string()
    .trim()
    .max(100, "Description must be 100 characters or less"),
  date: Yup.string()
    .required("Date is required"),
  categoryId: Yup.string()
    .required("Category is required"),
});

export default function AddExpense({ compact, onRefresh }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch((err) => console.error("Error fetching categories:", err));
  }, []);

  const formik = useFormik({
    initialValues: {
      amount: "",
      description: "",
      date: new Date().toISOString().slice(0, 10),
      categoryId: "",
    },
    validationSchema,
    validateOnMount: true,
    onSubmit: async (values, { resetForm }) => {
      if (!user) {
        toast.error("Not logged in");
        return;
      }

      try {
        await addTransaction({
          userId: user.id,
          amount: values.amount,
          description: values.description.trim(),
          categoryId: values.categoryId,
          date: values.date,
        });

        toast.success("Expense added successfully!");
        resetForm({
          values: {
            amount: "",
            description: "",
            date: new Date().toISOString().slice(0, 10),
            categoryId: "",
          },
        });
        if (onRefresh) {
          onRefresh();
        } else {
          navigate("/");
        }
      } catch (err) {
        console.error(err);
        toast.error("Error adding expense. Please try again later.");
      }
    },
  });

  return (
    <div className={compact ? "add-expense" : ""}>
      <form className="expense-form" onSubmit={formik.handleSubmit} noValidate>

        <div className="field">
          <input
            type="number"
            name="amount"
            placeholder="Amount (£)"
            className={formik.touched.amount && formik.errors.amount ? "input-error" : ""}
            value={formik.values.amount}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          />
          {formik.touched.amount && formik.errors.amount && (
            <span className="field-error">{formik.errors.amount}</span>
          )}
        </div>

        <div className="field">
          <input
            type="text"
            name="description"
            placeholder="Description (optional)"
            className={formik.touched.description && formik.errors.description ? "input-error" : ""}
            value={formik.values.description}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          />
          {formik.touched.description && formik.errors.description && (
            <span className="field-error">{formik.errors.description}</span>
          )}
        </div>

        <div className="field">
          <input
            type="date"
            name="date"
            className={formik.touched.date && formik.errors.date ? "input-error" : ""}
            value={formik.values.date}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          />
          {formik.touched.date && formik.errors.date && (
            <span className="field-error">{formik.errors.date}</span>
          )}
        </div>

        <div className="field">
          <select
            name="categoryId"
            className={formik.touched.categoryId && formik.errors.categoryId ? "input-error" : ""}
            value={formik.values.categoryId}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          {formik.touched.categoryId && formik.errors.categoryId && (
            <span className="field-error">{formik.errors.categoryId}</span>
          )}
        </div>

        <button type="submit" disabled={!formik.isValid || formik.isSubmitting}>
          Add
        </button>

      </form>
    </div>
  );
}
