import { useEffect, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import toast from "react-hot-toast";
import { getCategories, getBudgets, upsertBudget } from "../lib/api";

const budgetSchema = Yup.object({
  amount: Yup.number()
    .typeError("Must be a number")
    .positive("Must be greater than 0")
    .required("Amount is required"),
});

function BudgetRow({ cat, initialAmount }) {
  const formik = useFormik({
    initialValues: {
      amount: initialAmount !== undefined ? String(initialAmount) : "",
    },
    validationSchema: budgetSchema,
    validateOnMount: true,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        await upsertBudget(cat.id, Number(values.amount));
        toast.success("Budget saved!");
      } catch (err) {
        console.error(err);
        toast.error("Error saving budget");
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <div className="budget-row">
      <span className="budget-label">{cat.name}</span>

      <div className="budget-input-wrapper">
        <input
          type="number"
          name="amount"
          placeholder="£"
          className={formik.touched.amount && formik.errors.amount ? "input-error" : ""}
          value={formik.values.amount}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
        />
        {formik.touched.amount && formik.errors.amount && (
          <span className="field-error">{formik.errors.amount}</span>
        )}
      </div>

      <button
        onClick={formik.handleSubmit}
        disabled={!formik.isValid || formik.isSubmitting}
      >
        Save
      </button>
    </div>
  );
}

export default function BudgetForm() {
  const [categories, setCategories] = useState([]);
  const [budgetAmounts, setBudgetAmounts] = useState({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetchCategoriesAndBudgets();
  }, []);

  const fetchCategoriesAndBudgets = async () => {
    try {
      const [cats, buds] = await Promise.all([getCategories(), getBudgets()]);
      setCategories(cats);
      const amounts = {};
      buds.forEach((b) => {
        if (b.categories) amounts[b.categories.id] = b.limit_amount;
      });
      setBudgetAmounts(amounts);
    } catch (err) {
      console.error("Error loading budget form data:", err);
    } finally {
      setLoaded(true);
    }
  };

  return (
    <div className="card">
      <h3>Set Budgets</h3>

      <div className="budget-form">
        {loaded &&
          categories.map((cat) => (
            <BudgetRow
              key={cat.id}
              cat={cat}
              initialAmount={budgetAmounts[cat.id]}
            />
          ))}
      </div>
    </div>
  );
}
